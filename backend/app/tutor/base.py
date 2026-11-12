from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator

from app.schemas.tutor import (
    TutorActionType,
    TutorExecutionContextSchema,
    TutorModelInfoSchema,
    TutorProviderId,
    TutorProviderInfoSchema,
)


class AIProviderError(Exception):
    """Base error raised by an AI Tutor provider."""

    def __init__(
        self,
        message: str,
        *,
        provider: TutorProviderId,
        code: str = "PROVIDER_ERROR",
        status_code: int = 502,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.code = code
        self.status_code = status_code


class AIProviderUnavailableError(AIProviderError):
    """Raised when a provider has no configured API key or endpoint."""

    def __init__(self, message: str, *, provider: TutorProviderId) -> None:
        super().__init__(
            message,
            provider=provider,
            code="PROVIDER_NOT_CONFIGURED",
            status_code=503,
        )


class AIProviderAuthError(AIProviderError):
    """Raised when the provider rejects credentials (HTTP 401/403)."""

    def __init__(self, message: str, *, provider: TutorProviderId) -> None:
        super().__init__(
            message,
            provider=provider,
            code="PROVIDER_AUTH_ERROR",
            status_code=401,
        )


class AIProviderRateLimitError(AIProviderError):
    """Raised when the provider returns HTTP 429 rate limit exceeded."""

    def __init__(self, message: str, *, provider: TutorProviderId) -> None:
        super().__init__(
            message,
            provider=provider,
            code="PROVIDER_RATE_LIMIT",
            status_code=429,
        )


class AIProviderTimeoutError(AIProviderError):
    """Raised when a provider request times out."""

    def __init__(self, message: str, *, provider: TutorProviderId) -> None:
        super().__init__(
            message,
            provider=provider,
            code="PROVIDER_TIMEOUT",
            status_code=504,
        )


@dataclass(frozen=True)
class ConversationTurn:
    role: str  # "user" | "assistant"
    content: str


@dataclass(frozen=True)
class ProviderCompletionRequest:
    action: TutorActionType
    user_prompt: str
    system_prompt: str
    execution_context: TutorExecutionContextSchema
    model: str | None = None
    hint_mode: bool = False
    hint_level: int = 1
    topic_slug: str | None = None
    history: list[ConversationTurn] = field(default_factory=list)
    temperature: float = 0.25
    max_output_tokens: int = 1400


@dataclass(frozen=True)
class ProviderCompletionResponse:
    content: str
    provider: TutorProviderId
    model: str


@dataclass(frozen=True)
class ProviderStreamChunk:
    delta: str
    provider: TutorProviderId
    model: str
    done: bool = False


class AITutorProvider(ABC):
    """Provider-independent interface for CODEFLOW AI Tutor backends."""

    provider_id: TutorProviderId
    display_name: str
    role_label: str
    env_var_name: str | None

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True when the provider has valid credentials/configuration."""

    @abstractmethod
    def default_model(self) -> str:
        """Return the default model identifier for this provider."""

    @abstractmethod
    def list_models(self) -> list[TutorModelInfoSchema]:
        """Return the selectable models supported by this provider."""

    def get_provider_info(self) -> TutorProviderInfoSchema:
        configured = self.is_configured()
        if self.provider_id == "execution_grounded":
            status = "local_ready"
            notes = "Built-in AST & runtime trace analyzer. Always available offline."
        elif configured:
            status = "ready"
            notes = f"Server-side {self.display_name} API key configured."
        else:
            status = "missing_api_key"
            notes = (
                f"Set {self.env_var_name} in backend environment (.env) to enable "
                f"live {self.display_name} cloud completions."
            )

        return TutorProviderInfoSchema(
            id=self.provider_id,
            name=self.display_name,
            role=self.role_label,
            configured=configured,
            status=status,
            default_model=self.default_model(),
            models=self.list_models(),
            env_var=self.env_var_name,
            notes=notes,
        )

    @abstractmethod
    async def generate_completion(
        self, request: ProviderCompletionRequest
    ) -> ProviderCompletionResponse:
        """Generate a complete response for the given execution-grounded prompt."""

    @abstractmethod
    def stream_completion(
        self, request: ProviderCompletionRequest
    ) -> AsyncIterator[ProviderStreamChunk]:
        """Stream response token chunks for the given execution-grounded prompt."""

