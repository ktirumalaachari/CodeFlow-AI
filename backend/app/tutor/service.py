from __future__ import annotations

from collections import deque
import json
import time
from typing import AsyncIterator

from app.core.config import settings
from app.schemas.tutor import (
    TutorActionType,
    TutorChatRequestSchema,
    TutorChatResponseSchema,
    TutorProviderId,
    TutorProvidersResponseSchema,
)
from app.tutor.base import (
    AIProviderError,
    AIProviderRateLimitError,
    AIProviderUnavailableError,
    AITutorProvider,
    ConversationTurn,
    ProviderCompletionRequest,
)
from app.tutor.context_builder import (
    build_action_user_prompt,
    build_suggested_questions,
    build_system_prompt,
)
from app.tutor.providers.gemini import GeminiTutorProvider
from app.tutor.providers.grounded_fallback import ExecutionGroundedTutorProvider
from app.tutor.providers.openai_provider import OpenAITutorProvider
from app.tutor.storage import TutorConversationStore

_ACTION_USER_LABELS: dict[TutorActionType, str] = {
    "explain_program": "Explain this complete Python program and its complexity.",
    "explain_line": "Explain the selected code line(s) and runtime values.",
    "explain_step": "Explain the current execution step using actual variable values.",
    "explain_why": "Explain why the operation at this execution step occurred.",
    "debug_error": "Diagnose this error and suggest how to fix it.",
    "hint": "Give me a progressive hint without spoiling the full solution.",
    "dsa_topic": "Explain this DSA topic and compare brute-force vs. optimized.",
    "chat": "Explain what is happening in my code.",
}


class SlidingWindowRateLimiter:
    """In-memory sliding-window rate limiter for AI Tutor endpoints."""

    def __init__(self, max_requests_per_minute: int) -> None:
        self.max_requests = max(1, max_requests_per_minute)
        self._buckets: dict[str, deque[float]] = {}

    def check_and_record(self, client_key: str = "default") -> None:
        now = time.monotonic()
        window_start = now - 60.0
        bucket = self._buckets.setdefault(client_key, deque())
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            raise AIProviderRateLimitError(
                f"Tutor rate limit exceeded ({self.max_requests} requests/min). Please wait a moment and try again.",
                provider="gemini",
            )
        bucket.append(now)


class AITutorService:
    """
    Coordinates provider selection (1. Google Gemini, 2. OpenAI, 3. Execution-Grounded Fallback),
    execution-aware prompt construction, SSE streaming, rate limiting, and SQLite conversation persistence.
    """

    def __init__(
        self,
        *,
        gemini_provider: GeminiTutorProvider | None = None,
        openai_provider: OpenAITutorProvider | None = None,
        grounded_provider: ExecutionGroundedTutorProvider | None = None,
        store: TutorConversationStore | None = None,
        rate_limit_per_minute: int | None = None,
    ) -> None:
        self.gemini = gemini_provider or GeminiTutorProvider()
        self.openai = openai_provider or OpenAITutorProvider()
        self.grounded = grounded_provider or ExecutionGroundedTutorProvider()
        self.store = store or TutorConversationStore()
        self.rate_limiter = SlidingWindowRateLimiter(
            rate_limit_per_minute or settings.ai_rate_limit_per_minute
        )

        # Ordered provider registry: 1. Gemini (Primary), 2. OpenAI (Alternative), 3. Grounded Fallback
        self._providers: dict[TutorProviderId, AITutorProvider] = {
            "gemini": self.gemini,
            "openai": self.openai,
            "execution_grounded": self.grounded,
        }

    def get_providers_status(self) -> TutorProvidersResponseSchema:
        default_pref: TutorProviderId = (
            "openai"
            if settings.ai_default_provider.strip().lower() == "openai"
            else "gemini"
        )
        if self._providers[default_pref].is_configured():
            active: TutorProviderId = default_pref
        elif self.gemini.is_configured():
            active = "gemini"
        elif self.openai.is_configured():
            active = "openai"
        else:
            active = "execution_grounded"

        return TutorProvidersResponseSchema(
            default_provider=default_pref,
            active_provider=active,
            fallback_available=True,
            providers=[
                self.gemini.get_provider_info(),
                self.openai.get_provider_info(),
                self.grounded.get_provider_info(),
            ],
        )

    def _resolve_provider(
        self, requested: TutorProviderId, *, allow_fallback: bool
    ) -> tuple[AITutorProvider, bool, str | None]:
        primary = self._providers.get(requested, self.gemini)
        if primary.is_configured():
            return primary, False, None

        if not allow_fallback:
            raise AIProviderUnavailableError(
                f"{primary.display_name} is not configured ({primary.env_var_name} is not set).",
                provider=requested,
            )

        # Try the alternative cloud provider if configured before local execution-grounded engine
        alt_cloud = self.openai if requested == "gemini" else self.gemini
        if alt_cloud.is_configured():
            return (
                alt_cloud,
                True,
                f"{primary.display_name} key not configured; switched to {alt_cloud.display_name}.",
            )

        return (
            self.grounded,
            True,
            f"{primary.display_name} API key ({primary.env_var_name}) is not set in .env; "
            "using built-in Execution-Grounded AST & Trace Engine.",
        )

    def _build_provider_request(
        self,
        body: TutorChatRequestSchema,
        history: list[ConversationTurn],
    ) -> tuple[str, ProviderCompletionRequest]:
        display_user_text = body.message or _ACTION_USER_LABELS.get(
            body.action, "Explain this code."
        )
        if body.action == "dsa_topic" and body.topic_slug and not body.message:
            display_user_text = f"Teach me the DSA topic '{body.topic_slug}' with complexity and examples."

        system_prompt = build_system_prompt(
            hint_mode=body.hint_mode or body.action == "hint",
            hint_level=body.hint_level,
        )
        user_prompt = build_action_user_prompt(
            body.action,
            display_user_text,
            body.execution_context,
            hint_mode=body.hint_mode,
            hint_level=body.hint_level,
            topic_slug=body.topic_slug,
        )

        req = ProviderCompletionRequest(
            action=body.action,
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            execution_context=body.execution_context,
            model=body.model,
            hint_mode=body.hint_mode or body.action == "hint",
            hint_level=body.hint_level,
            topic_slug=body.topic_slug,
            history=history,
        )
        return display_user_text, req

    async def handle_chat(
        self, body: TutorChatRequestSchema, *, client_key: str = "default"
    ) -> TutorChatResponseSchema:
        self.rate_limiter.check_and_record(client_key)

        provider, used_fallback, fallback_reason = self._resolve_provider(
            body.provider, allow_fallback=body.allow_fallback
        )

        # Load prior conversation history if conversation_id exists
        existing_conv = (
            self.store.get_conversation(body.conversation_id)
            if body.conversation_id
            else None
        )
        history_turns = [
            ConversationTurn(role=m.role, content=m.content)
            for m in (existing_conv.messages[-10:] if existing_conv else [])
        ]

        display_user_text, provider_req = self._build_provider_request(
            body, history_turns
        )

        try:
            completion = await provider.generate_completion(provider_req)
        except AIProviderError as exc:
            if not body.allow_fallback or provider.provider_id == "execution_grounded":
                raise
            # Graceful fallback to Execution-Grounded Engine on cloud provider failure when allowed
            used_fallback = True
            fallback_reason = f"{provider.display_name} error ({exc.code}); answered via Execution-Grounded Engine."
            completion = await self.grounded.generate_completion(provider_req)

        conv_id = self.store.create_or_get_conversation(
            conversation_id=body.conversation_id,
            title=display_user_text[:72],
            provider=completion.provider,
            model=completion.model,
        )

        step_num = (
            body.execution_context.current_step.step
            if body.execution_context.current_step
            else None
        )
        line_num = (
            body.execution_context.selected_line_start
            or (
                body.execution_context.current_step.line
                if body.execution_context.current_step
                else None
            )
        )

        # Persist user message and assistant response
        self.store.append_message(
            conversation_id=conv_id,
            role="user",
            action=body.action,
            content=display_user_text,
            provider=completion.provider,
            model=completion.model,
            used_fallback=used_fallback,
            hint_mode=body.hint_mode or body.action == "hint",
            hint_level=body.hint_level if (body.hint_mode or body.action == "hint") else None,
            step_number=step_num,
            line_number=line_num,
        )
        assistant_msg = self.store.append_message(
            conversation_id=conv_id,
            role="assistant",
            action=body.action,
            content=completion.content,
            provider=completion.provider,
            model=completion.model,
            used_fallback=used_fallback,
            hint_mode=body.hint_mode or body.action == "hint",
            hint_level=body.hint_level if (body.hint_mode or body.action == "hint") else None,
            step_number=step_num,
            line_number=line_num,
        )

        return TutorChatResponseSchema(
            conversation_id=conv_id,
            message=assistant_msg,
            provider=completion.provider,
            model=completion.model,
            used_fallback=used_fallback,
            fallback_reason=fallback_reason,
            suggested_questions=build_suggested_questions(body.execution_context),
        )

    async def handle_chat_stream(
        self, body: TutorChatRequestSchema, *, client_key: str = "default"
    ) -> AsyncIterator[str]:
        self.rate_limiter.check_and_record(client_key)

        provider, used_fallback, fallback_reason = self._resolve_provider(
            body.provider, allow_fallback=body.allow_fallback
        )

        existing_conv = (
            self.store.get_conversation(body.conversation_id)
            if body.conversation_id
            else None
        )
        history_turns = [
            ConversationTurn(role=m.role, content=m.content)
            for m in (existing_conv.messages[-10:] if existing_conv else [])
        ]

        display_user_text, provider_req = self._build_provider_request(
            body, history_turns
        )

        target_model = body.model or provider.default_model()
        conv_id = self.store.create_or_get_conversation(
            conversation_id=body.conversation_id,
            title=display_user_text[:72],
            provider=provider.provider_id,
            model=target_model,
        )

        step_num = (
            body.execution_context.current_step.step
            if body.execution_context.current_step
            else None
        )
        line_num = (
            body.execution_context.selected_line_start
            or (
                body.execution_context.current_step.line
                if body.execution_context.current_step
                else None
            )
        )

        self.store.append_message(
            conversation_id=conv_id,
            role="user",
            action=body.action,
            content=display_user_text,
            provider=provider.provider_id,
            model=target_model,
            used_fallback=used_fallback,
            hint_mode=body.hint_mode or body.action == "hint",
            hint_level=body.hint_level if (body.hint_mode or body.action == "hint") else None,
            step_number=step_num,
            line_number=line_num,
        )

        accumulated: list[str] = []
        active_provider_id = provider.provider_id
        active_model_id = target_model

        try:
            async for chunk in provider.stream_completion(provider_req):
                active_provider_id = chunk.provider
                active_model_id = chunk.model
                if chunk.delta:
                    accumulated.append(chunk.delta)
                    yield f"data: {json.dumps({'type': 'delta', 'delta': chunk.delta, 'provider': active_provider_id, 'model': active_model_id})}\n\n"
        except AIProviderError as exc:
            if not body.allow_fallback or provider.provider_id == "execution_grounded":
                yield f"data: {json.dumps({'type': 'error', 'code': exc.code, 'message': exc.message, 'provider': exc.provider})}\n\n"
                return

            used_fallback = True
            fallback_reason = f"{provider.display_name} stream error ({exc.code}); switched to Execution-Grounded Engine."
            accumulated.clear()
            async for chunk in self.grounded.stream_completion(provider_req):
                active_provider_id = chunk.provider
                active_model_id = chunk.model
                if chunk.delta:
                    accumulated.append(chunk.delta)
                    yield f"data: {json.dumps({'type': 'delta', 'delta': chunk.delta, 'provider': active_provider_id, 'model': active_model_id})}\n\n"

        full_text = "".join(accumulated).strip()
        assistant_msg = self.store.append_message(
            conversation_id=conv_id,
            role="assistant",
            action=body.action,
            content=full_text,
            provider=active_provider_id,
            model=active_model_id,
            used_fallback=used_fallback,
            hint_mode=body.hint_mode or body.action == "hint",
            hint_level=body.hint_level if (body.hint_mode or body.action == "hint") else None,
            step_number=step_num,
            line_number=line_num,
        )

        done_payload = {
            "type": "done",
            "conversation_id": conv_id,
            "message": assistant_msg.model_dump(),
            "provider": active_provider_id,
            "model": active_model_id,
            "used_fallback": used_fallback,
            "fallback_reason": fallback_reason,
            "suggested_questions": build_suggested_questions(body.execution_context),
        }
        yield f"data: {json.dumps(done_payload)}\n\n"


tutor_service = AITutorService()

