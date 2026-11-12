from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class BackendSettings:
    app_name: str = "CODEFLOW AI Execution & Tutor Engine"
    version: str = "1.0.0"
    environment: str = os.getenv("CODEFLOW_ENV", "development").lower()
    host: str = os.getenv("CODEFLOW_BACKEND_HOST", "127.0.0.1")
    port: int = int(os.getenv("CODEFLOW_BACKEND_PORT", "8000"))

    # Execution mode: "auto" | "docker" | "development_subprocess"
    # Note: development_subprocess is strictly for local development on 127.0.0.1
    # and is blocked when CODEFLOW_ENV=production.
    execution_mode_preference: str = os.getenv("CODEFLOW_EXECUTION_MODE", "auto")
    docker_image: str = os.getenv("CODEFLOW_RUNNER_IMAGE", "codeflow-python-runner:3.12")

    # Safety & resource limits
    default_timeout_seconds: float = float(
        os.getenv("CODEFLOW_DEFAULT_TIMEOUT", "3.0")
    )
    max_timeout_seconds: float = float(os.getenv("CODEFLOW_MAX_TIMEOUT", "8.0"))
    default_max_steps: int = int(os.getenv("CODEFLOW_DEFAULT_MAX_STEPS", "500"))
    hard_max_steps: int = int(os.getenv("CODEFLOW_HARD_MAX_STEPS", "1500"))
    max_memory_mb: int = int(os.getenv("CODEFLOW_MAX_MEMORY_MB", "128"))
    max_output_bytes: int = int(os.getenv("CODEFLOW_MAX_OUTPUT_BYTES", "32768"))
    max_source_chars: int = int(os.getenv("CODEFLOW_MAX_SOURCE_CHARS", "25000"))
    max_recursion_depth: int = int(os.getenv("CODEFLOW_MAX_RECURSION_DEPTH", "90"))
    max_container_items: int = 64
    max_serialize_depth: int = 18

    # Phase 4 — AI Tutor Provider Settings (Server-Side Only)
    ai_default_provider: str = os.getenv("CODEFLOW_AI_DEFAULT_PROVIDER", "gemini")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    gemini_api_base_url: str = os.getenv(
        "GEMINI_API_BASE_URL",
        "https://generativelanguage.googleapis.com/v1beta",
    )

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    openai_api_base_url: str = os.getenv(
        "OPENAI_API_BASE_URL",
        "https://api.openai.com/v1",
    )

    ai_timeout_seconds: float = float(
        os.getenv("CODEFLOW_AI_TIMEOUT_SECONDS", "25.0")
    )
    ai_max_context_chars: int = int(
        os.getenv("CODEFLOW_AI_MAX_CONTEXT_CHARS", "18000")
    )
    ai_rate_limit_per_minute: int = int(
        os.getenv("CODEFLOW_AI_RATE_LIMIT_PER_MINUTE", "30")
    )
    tutor_db_path: str = os.getenv(
        "CODEFLOW_TUTOR_DB_PATH",
        str(Path(__file__).resolve().parents[2] / ".data" / "tutor_conversations.db"),
    )
    workspace_db_path: str = os.getenv(
        "CODEFLOW_WORKSPACE_DB_PATH",
        str(Path(__file__).resolve().parents[2] / ".data" / "codeflow_workspace.db"),
    )

    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "CODEFLOW_CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000",
            ).split(",")
            if origin.strip()
        ]
    )


settings = BackendSettings()
