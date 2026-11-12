from __future__ import annotations

from datetime import datetime, timezone
import sys
from fastapi import APIRouter

from app.core.config import settings
from app.execution.runner import (
    DEV_MODE_SECURITY_NOTICE,
    DOCKER_MODE_SECURITY_NOTICE,
    execution_runner,
)
from app.schemas.execution import (
    ExecuteRequestSchema,
    ExecuteResponseSchema,
    HealthLimitsSchema,
    HealthResponseSchema,
)

router = APIRouter(prefix="/api", tags=["execution"])


@router.get("/health", response_model=HealthResponseSchema)
def get_health() -> HealthResponseSchema:
    mode = execution_runner.detect_mode()
    notice = (
        DOCKER_MODE_SECURITY_NOTICE
        if mode == "docker_sandbox"
        else DEV_MODE_SECURITY_NOTICE
    )
    return HealthResponseSchema(
        status="ok",
        service=settings.app_name,
        version=settings.version,
        python_version=sys.version.split()[0],
        execution_mode=mode,
        security_notice=notice,
        limits=HealthLimitsSchema(
            default_timeout_seconds=settings.default_timeout_seconds,
            max_timeout_seconds=settings.max_timeout_seconds,
            default_max_steps=settings.default_max_steps,
            hard_max_steps=settings.hard_max_steps,
            max_memory_mb=settings.max_memory_mb,
            max_output_bytes=settings.max_output_bytes,
        ),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/execute", response_model=ExecuteResponseSchema)
def execute_python_code(body: ExecuteRequestSchema) -> ExecuteResponseSchema:
    result = execution_runner.run_trace(
        source_code=body.source_code,
        max_steps=body.options.max_steps,
        timeout_seconds=body.options.timeout_seconds,
        stdin_data=body.options.stdin,
    )

    payload = result.payload
    return ExecuteResponseSchema(
        execution_id=result.execution_id,
        status=payload.get("status", "runtime_error"),
        execution_mode=result.execution_mode,
        security_notice=result.security_notice,
        duration_ms=result.duration_ms,
        total_steps=payload.get("total_steps", 0),
        stdout=payload.get("stdout", ""),
        steps=payload.get("steps", []),
        error=payload.get("error"),
    )

