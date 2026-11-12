from __future__ import annotations

import json
from typing import AsyncIterator
import httpx

from app.core.config import settings
from app.schemas.tutor import TutorModelInfoSchema, TutorProviderId
from app.tutor.base import (
    AIProviderAuthError,
    AIProviderError,
    AIProviderRateLimitError,
    AIProviderTimeoutError,
    AIProviderUnavailableError,
    AITutorProvider,
    ProviderCompletionRequest,
    ProviderCompletionResponse,
    ProviderStreamChunk,
)

_PLACEHOLDER_KEYS = {
    "",
    "your_google_gemini_api_key_here",
    "your_gemini_api_key_here",
    "changeme",
}


class GeminiTutorProvider(AITutorProvider):
    """Primary AI Tutor provider using Google Gemini REST & SSE Streaming APIs."""

    provider_id: TutorProviderId = "gemini"
    display_name: str = "Google Gemini"
    role_label: str = "Primary Provider"
    env_var_name: str = "GEMINI_API_KEY"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        default_model_id: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_key_override = api_key
        self._default_model_override = default_model_id
        self._base_url_override = base_url
        self._timeout_override = timeout_seconds
        self._transport = transport

    @property
    def _api_key(self) -> str:
        if self._api_key_override is not None:
            return self._api_key_override.strip()
        return settings.gemini_api_key.strip()

    @property
    def _base_url(self) -> str:
        raw = self._base_url_override or settings.gemini_api_base_url
        return raw.rstrip("/")

    @property
    def _timeout(self) -> float:
        return self._timeout_override or settings.ai_timeout_seconds

    def is_configured(self) -> bool:
        return self._api_key not in _PLACEHOLDER_KEYS

    def default_model(self) -> str:
        return (self._default_model_override or settings.gemini_model).strip()

    def list_models(self) -> list[TutorModelInfoSchema]:
        default_id = self.default_model()
        catalog = [
            (
                "gemini-3.5-flash",
                "Gemini 3.5 Flash",
                "Fast, execution-grounded reasoning for interactive step debugging.",
            ),
            (
                "gemini-2.5-pro",
                "Gemini 2.5 Pro",
                "Deep algorithmic analysis, complexity proofs, and multi-frame recursion.",
            ),
            (
                "gemini-2.0-flash",
                "Gemini 2.0 Flash",
                "Low-latency streaming explanations and quick line diagnostics.",
            ),
        ]
        models = [
            TutorModelInfoSchema(
                id=m_id,
                label=label,
                description=desc,
                is_default=(m_id == default_id),
            )
            for m_id, label, desc in catalog
        ]
        if not any(m.id == default_id for m in models):
            models.insert(
                0,
                TutorModelInfoSchema(
                    id=default_id,
                    label=default_id,
                    description="Configured custom Gemini model.",
                    is_default=True,
                ),
            )
        return models

    def _build_payload(self, request: ProviderCompletionRequest) -> dict[str, object]:
        contents: list[dict[str, object]] = []
        for turn in request.history[-10:]:
            gemini_role = "model" if turn.role == "assistant" else "user"
            contents.append(
                {
                    "role": gemini_role,
                    "parts": [{"text": turn.content}],
                }
            )
        contents.append(
            {
                "role": "user",
                "parts": [{"text": request.user_prompt}],
            }
        )

        return {
            "systemInstruction": {
                "parts": [{"text": request.system_prompt}],
            },
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_output_tokens,
            },
        }

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code < 400:
            return

        detail = f"Gemini API returned HTTP {response.status_code}"
        try:
            err_json = response.json()
            if isinstance(err_json, dict) and isinstance(err_json.get("error"), dict):
                msg = err_json["error"].get("message")
                if isinstance(msg, str) and msg.strip():
                    detail = msg.strip()
        except Exception:
            pass

        if response.status_code in (401, 403):
            raise AIProviderAuthError(detail, provider="gemini")
        if response.status_code == 429:
            raise AIProviderRateLimitError(detail, provider="gemini")
        raise AIProviderError(
            detail,
            provider="gemini",
            code="GEMINI_HTTP_ERROR",
            status_code=response.status_code,
        )

    @staticmethod
    def _extract_candidate_text(data: object) -> str:
        if not isinstance(data, dict):
            raise AIProviderError(
                "Malformed non-JSON-object response from Gemini API.",
                provider="gemini",
                code="GEMINI_MALFORMED_RESPONSE",
            )
        candidates = data.get("candidates")
        if not isinstance(candidates, list) or not candidates:
            raise AIProviderError(
                "Gemini API returned no completion candidates.",
                provider="gemini",
                code="GEMINI_EMPTY_CANDIDATES",
            )
        first = candidates[0]
        if not isinstance(first, dict):
            raise AIProviderError(
                "Malformed candidate item in Gemini response.",
                provider="gemini",
                code="GEMINI_MALFORMED_RESPONSE",
            )
        content = first.get("content")
        if not isinstance(content, dict):
            return ""
        parts = content.get("parts")
        if not isinstance(parts, list):
            return ""
        texts = [
            str(p.get("text", ""))
            for p in parts
            if isinstance(p, dict) and isinstance(p.get("text"), str)
        ]
        return "".join(texts)

    async def generate_completion(
        self, request: ProviderCompletionRequest
    ) -> ProviderCompletionResponse:
        if not self.is_configured():
            raise AIProviderUnavailableError(
                "Google Gemini API key (GEMINI_API_KEY) is not configured on the backend.",
                provider="gemini",
            )

        model_id = (request.model or self.default_model()).strip()
        url = f"{self._base_url}/models/{model_id}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self._api_key,
        }
        payload = self._build_payload(request)

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                transport=self._transport,
            ) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise AIProviderTimeoutError(
                f"Google Gemini request timed out after {self._timeout}s.",
                provider="gemini",
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(
                f"Network error communicating with Google Gemini: {exc}",
                provider="gemini",
                code="GEMINI_NETWORK_ERROR",
            ) from exc

        self._raise_for_status(response)

        try:
            body = response.json()
        except ValueError as exc:
            raise AIProviderError(
                "Invalid JSON received from Google Gemini API.",
                provider="gemini",
                code="GEMINI_MALFORMED_JSON",
            ) from exc

        text = self._extract_candidate_text(body).strip()
        if not text:
            raise AIProviderError(
                "Google Gemini returned an empty explanation.",
                provider="gemini",
                code="GEMINI_EMPTY_TEXT",
            )

        return ProviderCompletionResponse(
            content=text,
            provider="gemini",
            model=model_id,
        )

    async def stream_completion(
        self, request: ProviderCompletionRequest
    ) -> AsyncIterator[ProviderStreamChunk]:
        if not self.is_configured():
            raise AIProviderUnavailableError(
                "Google Gemini API key (GEMINI_API_KEY) is not configured on the backend.",
                provider="gemini",
            )

        model_id = (request.model or self.default_model()).strip()
        url = f"{self._base_url}/models/{model_id}:streamGenerateContent?alt=sse"
        headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "x-goog-api-key": self._api_key,
        }
        payload = self._build_payload(request)

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                transport=self._transport,
            ) as client:
                async with client.stream(
                    "POST", url, headers=headers, json=payload
                ) as response:
                    if response.status_code >= 400:
                        await response.aread()
                        self._raise_for_status(response)

                    emitted_any = False
                    async for raw_line in response.aiter_lines():
                        line = raw_line.strip()
                        if not line or not line.startswith("data:"):
                            continue
                        data_str = line[5:].strip()
                        if not data_str or data_str == "[DONE]":
                            continue
                        try:
                            chunk_obj = json.loads(data_str)
                        except ValueError as exc:
                            raise AIProviderError(
                                "Malformed SSE JSON chunk from Google Gemini.",
                                provider="gemini",
                                code="GEMINI_MALFORMED_STREAM",
                            ) from exc

                        delta = self._extract_candidate_text(chunk_obj)
                        if delta:
                            emitted_any = True
                            yield ProviderStreamChunk(
                                delta=delta,
                                provider="gemini",
                                model=model_id,
                                done=False,
                            )

                    if not emitted_any:
                        raise AIProviderError(
                            "Google Gemini stream closed without emitting text.",
                            provider="gemini",
                            code="GEMINI_EMPTY_STREAM",
                        )

                    yield ProviderStreamChunk(
                        delta="",
                        provider="gemini",
                        model=model_id,
                        done=True,
                    )
        except httpx.TimeoutException as exc:
            raise AIProviderTimeoutError(
                f"Google Gemini streaming request timed out after {self._timeout}s.",
                provider="gemini",
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(
                f"Network error during Google Gemini stream: {exc}",
                provider="gemini",
                code="GEMINI_NETWORK_ERROR",
            ) from exc

