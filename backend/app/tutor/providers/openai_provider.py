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
    "your_openai_api_key_here",
    "changeme",
}


class OpenAITutorProvider(AITutorProvider):
    """Alternative AI Tutor provider using OpenAI Chat Completions REST & SSE APIs."""

    provider_id: TutorProviderId = "openai"
    display_name: str = "OpenAI"
    role_label: str = "Alternative Provider"
    env_var_name: str = "OPENAI_API_KEY"

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
        return settings.openai_api_key.strip()

    @property
    def _base_url(self) -> str:
        raw = self._base_url_override or settings.openai_api_base_url
        return raw.rstrip("/")

    @property
    def _timeout(self) -> float:
        return self._timeout_override or settings.ai_timeout_seconds

    def is_configured(self) -> bool:
        return self._api_key not in _PLACEHOLDER_KEYS

    def default_model(self) -> str:
        return (self._default_model_override or settings.openai_model).strip()

    def list_models(self) -> list[TutorModelInfoSchema]:
        default_id = self.default_model()
        catalog = [
            (
                "gpt-4o-mini",
                "GPT-4o mini",
                "Fast, cost-efficient execution step explanations and line debugging.",
            ),
            (
                "gpt-4o",
                "GPT-4o",
                "High-precision code analysis, DSA tutoring, and complexity coaching.",
            ),
            (
                "o3-mini",
                "o3-mini",
                "Reasoning-focused model for tricky algorithmic invariants and DP.",
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
                    description="Configured custom OpenAI model.",
                    is_default=True,
                ),
            )
        return models

    def _build_payload(
        self, request: ProviderCompletionRequest, *, model_id: str, stream: bool
    ) -> dict[str, object]:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": request.system_prompt}
        ]
        for turn in request.history[-10:]:
            role = "assistant" if turn.role == "assistant" else "user"
            messages.append({"role": role, "content": turn.content})
        messages.append({"role": "user", "content": request.user_prompt})

        return {
            "model": model_id,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
            "stream": stream,
        }

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code < 400:
            return

        detail = f"OpenAI API returned HTTP {response.status_code}"
        try:
            err_json = response.json()
            if isinstance(err_json, dict) and isinstance(err_json.get("error"), dict):
                msg = err_json["error"].get("message")
                if isinstance(msg, str) and msg.strip():
                    detail = msg.strip()
        except Exception:
            pass

        if response.status_code in (401, 403):
            raise AIProviderAuthError(detail, provider="openai")
        if response.status_code == 429:
            raise AIProviderRateLimitError(detail, provider="openai")
        raise AIProviderError(
            detail,
            provider="openai",
            code="OPENAI_HTTP_ERROR",
            status_code=response.status_code,
        )

    async def generate_completion(
        self, request: ProviderCompletionRequest
    ) -> ProviderCompletionResponse:
        if not self.is_configured():
            raise AIProviderUnavailableError(
                "OpenAI API key (OPENAI_API_KEY) is not configured on the backend.",
                provider="openai",
            )

        model_id = (request.model or self.default_model()).strip()
        url = f"{self._base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._api_key}",
        }
        payload = self._build_payload(request, model_id=model_id, stream=False)

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                transport=self._transport,
            ) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise AIProviderTimeoutError(
                f"OpenAI request timed out after {self._timeout}s.",
                provider="openai",
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(
                f"Network error communicating with OpenAI: {exc}",
                provider="openai",
                code="OPENAI_NETWORK_ERROR",
            ) from exc

        self._raise_for_status(response)

        try:
            body = response.json()
        except ValueError as exc:
            raise AIProviderError(
                "Invalid JSON received from OpenAI API.",
                provider="openai",
                code="OPENAI_MALFORMED_JSON",
            ) from exc

        if not isinstance(body, dict) or not isinstance(body.get("choices"), list) or not body["choices"]:
            raise AIProviderError(
                "Malformed or empty choices in OpenAI response.",
                provider="openai",
                code="OPENAI_MALFORMED_RESPONSE",
            )

        first = body["choices"][0]
        content = ""
        if isinstance(first, dict) and isinstance(first.get("message"), dict):
            raw_content = first["message"].get("content")
            if isinstance(raw_content, str):
                content = raw_content.strip()

        if not content:
            raise AIProviderError(
                "OpenAI returned an empty completion message.",
                provider="openai",
                code="OPENAI_EMPTY_TEXT",
            )

        return ProviderCompletionResponse(
            content=content,
            provider="openai",
            model=model_id,
        )

    async def stream_completion(
        self, request: ProviderCompletionRequest
    ) -> AsyncIterator[ProviderStreamChunk]:
        if not self.is_configured():
            raise AIProviderUnavailableError(
                "OpenAI API key (OPENAI_API_KEY) is not configured on the backend.",
                provider="openai",
            )

        model_id = (request.model or self.default_model()).strip()
        url = f"{self._base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Authorization": f"Bearer {self._api_key}",
        }
        payload = self._build_payload(request, model_id=model_id, stream=True)

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
                        if not data_str:
                            continue
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk_obj = json.loads(data_str)
                        except ValueError as exc:
                            raise AIProviderError(
                                "Malformed SSE JSON chunk from OpenAI.",
                                provider="openai",
                                code="OPENAI_MALFORMED_STREAM",
                            ) from exc

                        if not isinstance(chunk_obj, dict):
                            continue
                        choices = chunk_obj.get("choices")
                        if not isinstance(choices, list) or not choices:
                            continue
                        choice0 = choices[0]
                        if not isinstance(choice0, dict):
                            continue
                        delta_obj = choice0.get("delta")
                        if isinstance(delta_obj, dict):
                            delta_text = delta_obj.get("content")
                            if isinstance(delta_text, str) and delta_text:
                                emitted_any = True
                                yield ProviderStreamChunk(
                                    delta=delta_text,
                                    provider="openai",
                                    model=model_id,
                                    done=False,
                                )

                    if not emitted_any:
                        raise AIProviderError(
                            "OpenAI stream closed without emitting text.",
                            provider="openai",
                            code="OPENAI_EMPTY_STREAM",
                        )

                    yield ProviderStreamChunk(
                        delta="",
                        provider="openai",
                        model=model_id,
                        done=True,
                    )
        except httpx.TimeoutException as exc:
            raise AIProviderTimeoutError(
                f"OpenAI streaming request timed out after {self._timeout}s.",
                provider="openai",
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(
                f"Network error during OpenAI stream: {exc}",
                provider="openai",
                code="OPENAI_NETWORK_ERROR",
            ) from exc

