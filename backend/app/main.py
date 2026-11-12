from __future__ import annotations

from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.platform_routes import router as platform_router
from app.api.routes import router as execution_router
from app.api.tutor_routes import router as tutor_router
from app.core.config import settings
from app.execution.runner import execution_runner

logger = logging.getLogger("codeflow.backend")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    mode = execution_runner.detect_mode()
    if mode == "development_subprocess":
        logger.warning(
            "CODEFLOW AI starting in DEVELOPMENT SUBPROCESS mode on %s:%s. "
            "Do NOT expose this runner to public untrusted traffic without Docker container isolation.",
            settings.host,
            settings.port,
        )
    else:
        logger.info("CODEFLOW AI starting with DOCKER SANDBOX isolation active.")
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=(
            "Isolated Python 3.12 step-by-step execution and snapshot tracing "
            "service for CODEFLOW AI."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )

    app.include_router(execution_router)
    app.include_router(tutor_router)
    app.include_router(platform_router)
    return app


app = create_app()

