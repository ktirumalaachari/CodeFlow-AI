from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.schemas.tutor import (
    DSATopicGuideSchema,
    TutorChatRequestSchema,
    TutorChatResponseSchema,
    TutorConversationDetailSchema,
    TutorConversationSummarySchema,
    TutorProvidersResponseSchema,
)
from app.tutor.base import AIProviderError
from app.tutor.dsa_catalog import get_all_dsa_topics, get_dsa_topic_by_slug
from app.tutor.service import tutor_service

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "local"


@router.get("/providers", response_model=TutorProvidersResponseSchema)
def get_tutor_providers() -> TutorProvidersResponseSchema:
    return tutor_service.get_providers_status()


@router.get("/dsa-topics", response_model=list[DSATopicGuideSchema])
def list_dsa_topics() -> list[DSATopicGuideSchema]:
    return get_all_dsa_topics()


@router.get("/dsa-topics/{slug}", response_model=DSATopicGuideSchema)
def get_dsa_topic(slug: str) -> DSATopicGuideSchema:
    topic = get_dsa_topic_by_slug(slug)
    if topic is None:
        raise HTTPException(
            status_code=404,
            detail=f"DSA topic '{slug}' not found.",
        )
    return topic


@router.get("/conversations", response_model=list[TutorConversationSummarySchema])
def list_tutor_conversations() -> list[TutorConversationSummarySchema]:
    return tutor_service.store.list_conversations()


@router.get(
    "/conversations/{conversation_id}",
    response_model=TutorConversationDetailSchema,
)
def get_tutor_conversation(conversation_id: str) -> TutorConversationDetailSchema:
    conv = tutor_service.store.get_conversation(conversation_id)
    if conv is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation '{conversation_id}' not found.",
        )
    return conv


@router.delete("/conversations/{conversation_id}")
def delete_tutor_conversation(conversation_id: str) -> dict[str, bool]:
    deleted = tutor_service.store.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation '{conversation_id}' not found.",
        )
    return {"deleted": True}


@router.post("/chat", response_model=TutorChatResponseSchema)
async def tutor_chat(
    body: TutorChatRequestSchema,
    request: Request,
) -> TutorChatResponseSchema:
    try:
        return await tutor_service.handle_chat(
            body, client_key=_client_key(request)
        )
    except AIProviderError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc


@router.post("/chat/stream")
async def tutor_chat_stream(
    body: TutorChatRequestSchema,
    request: Request,
) -> StreamingResponse:
    try:
        # Pre-check rate limit and strict provider resolution before opening stream
        tutor_service.rate_limiter.check_and_record(_client_key(request))
        tutor_service._resolve_provider(
            body.provider, allow_fallback=body.allow_fallback
        )
    except AIProviderError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc

    async def event_generator():
        # Note: handle_chat_stream records rate limit too; use a separate sub-key to avoid double counting
        async for event in tutor_service.handle_chat_stream(
            body, client_key=f"{_client_key(request)}:stream"
        ):
            yield event

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

