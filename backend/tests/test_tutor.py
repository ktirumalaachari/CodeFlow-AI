from __future__ import annotations

import asyncio
import json
from pathlib import Path
from fastapi.testclient import TestClient
import httpx
import pytest

from app.main import app
from app.schemas.tutor import (
    TutorChatRequestSchema,
    TutorDetectedStructureSchema,
    TutorErrorSnapshotSchema,
    TutorExecutionContextSchema,
    TutorStepSnapshotSchema,
    TutorVariableItemSchema,
)
from app.tutor.base import (
    AIProviderAuthError,
    AIProviderError,
    AIProviderRateLimitError,
    AIProviderTimeoutError,
    AIProviderUnavailableError,
    ConversationTurn,
    ProviderCompletionRequest,
)
from app.tutor.context_builder import (
    build_action_user_prompt,
    build_system_prompt,
    scrub_secrets,
)
from app.tutor.providers.gemini import GeminiTutorProvider
from app.tutor.providers.grounded_fallback import ExecutionGroundedTutorProvider
from app.tutor.providers.openai_provider import OpenAITutorProvider
from app.tutor.service import AITutorService
from app.tutor.storage import TutorConversationStore


def _sample_execution_context() -> TutorExecutionContextSchema:
    return TutorExecutionContextSchema(
        source_code=(
            "nums = [2, 5, 8, 11, 15]\n"
            "target = 16\n"
            "left = 0\n"
            "right = len(nums) - 1\n"
            "while left < right:\n"
            "    curr = nums[left] + nums[right]\n"
        ),
        selected_line_start=5,
        selected_line_end=6,
        selected_code="while left < right:\n    curr = nums[left] + nums[right]",
        execution_status="completed",
        total_steps=12,
        current_step=TutorStepSnapshotSchema(
            step=6,
            line=6,
            event="line",
            function_name="<module>",
            call_depth=0,
            source_line="    curr = nums[left] + nums[right]",
            locals=[],
            globals=[
                TutorVariableItemSchema(
                    name="nums",
                    scope="global",
                    var_type="list",
                    repr_value="[2, 5, 8, 11, 15]",
                    change="unchanged",
                    object_id="ref#1",
                ),
                TutorVariableItemSchema(
                    name="left",
                    scope="global",
                    var_type="int",
                    repr_value="1",
                    change="modified",
                    previous_repr="0",
                ),
                TutorVariableItemSchema(
                    name="right",
                    scope="global",
                    var_type="int",
                    repr_value="3",
                    change="unchanged",
                ),
                TutorVariableItemSchema(
                    name="curr",
                    scope="global",
                    var_type="int",
                    repr_value="16",
                    change="created",
                ),
            ],
            explanation_headline="Assigned curr = 16",
            explanation_details="Computed nums[1] (5) + nums[3] (11) = 16.",
        ),
        previous_step=TutorStepSnapshotSchema(
            step=5,
            line=5,
            event="line",
            function_name="<module>",
            call_depth=0,
            source_line="while left < right:",
            explanation_headline="Checked left < right (1 < 3 is True)",
            explanation_details="Loop continues.",
        ),
        detected_structures=[
            TutorDetectedStructureSchema(
                id="array:nums",
                kind="array",
                variable_name="nums",
                title="Array · nums",
                subtitle="list · len=5",
                active_operation="access",
                summary="Pointers left=1, right=3",
            )
        ],
    )


def test_secret_scrubbing_redacts_api_keys_and_tokens() -> None:
    raw = (
        "api_key = 'sk-proj-1234567890abcdefghijklmnop'\n"
        "gemini = 'AIzaSyA1234567890abcdefghijklmnopqrstuvw'\n"
        "gh = 'ghp_1234567890abcdefghijklmnopqrstuv'\n"
    )
    cleaned = scrub_secrets(raw)
    assert "sk-proj-" not in cleaned
    assert "AIzaSy" not in cleaned
    assert "ghp_" not in cleaned
    assert "[REDACTED_OPENAI_KEY]" in cleaned
    assert "[REDACTED_GEMINI_KEY]" in cleaned
    assert "[REDACTED_GITHUB_TOKEN]" in cleaned


def test_gemini_provider_completion_and_streaming_via_mock_transport() -> None:
    ctx = _sample_execution_context()
    req = ProviderCompletionRequest(
        action="explain_step",
        user_prompt=build_action_user_prompt("explain_step", "", ctx),
        system_prompt=build_system_prompt(hint_mode=False),
        execution_context=ctx,
        history=[ConversationTurn(role="user", content="Hello tutor")],
    )

    captured_headers: dict[str, str] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_headers.update(dict(request.headers))
        body = json.loads(request.content.decode("utf-8"))
        assert "systemInstruction" in body
        assert "nums = [2, 5, 8, 11, 15]" in json.dumps(body["contents"])

        if "streamGenerateContent" in str(request.url):
            sse_payload = (
                'data: {"candidates": [{"content": {"parts": [{"text": "Step 6 computes "}]}}]}\n\n'
                'data: {"candidates": [{"content": {"parts": [{"text": "curr = 5 + 11 = 16."}]}}]}\n\n'
            )
            return httpx.Response(
                200,
                headers={"content-type": "text/event-stream"},
                content=sse_payload.encode("utf-8"),
            )

        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "At Step 6 (Line 6), `left=1` (`5`) and `right=3` (`11`) sum to `curr=16`."
                                }
                            ]
                        }
                    }
                ]
            },
        )

    provider = GeminiTutorProvider(
        api_key="test-gemini-secret-key",
        default_model_id="gemini-2.5-flash",
        transport=httpx.MockTransport(handler),
    )
    assert provider.is_configured() is True

    result = asyncio.run(provider.generate_completion(req))
    assert result.provider == "gemini"
    assert result.model == "gemini-2.5-flash"
    assert "curr=16" in result.content
    assert captured_headers.get("x-goog-api-key") == "test-gemini-secret-key"

    async def collect_stream() -> list[str]:
        chunks: list[str] = []
        async for ch in provider.stream_completion(req):
            if ch.delta:
                chunks.append(ch.delta)
        return chunks

    stream_parts = asyncio.run(collect_stream())
    assert "".join(stream_parts) == "Step 6 computes curr = 5 + 11 = 16."


def test_openai_provider_completion_and_streaming_via_mock_transport() -> None:
    ctx = _sample_execution_context()
    req = ProviderCompletionRequest(
        action="explain_line",
        user_prompt=build_action_user_prompt("explain_line", "", ctx),
        system_prompt=build_system_prompt(hint_mode=True, hint_level=2),
        execution_context=ctx,
    )

    captured_auth: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_auth.append(request.headers.get("authorization", ""))
        payload = json.loads(request.content.decode("utf-8"))

        if payload.get("stream") is True:
            sse_lines = (
                'data: {"choices": [{"delta": {"content": "Line 6 adds "}}]}\n\n'
                'data: {"choices": [{"delta": {"content": "nums[left] and nums[right]."}}]}\n\n'
                "data: [DONE]\n\n"
            )
            return httpx.Response(
                200,
                headers={"content-type": "text/event-stream"},
                content=sse_lines.encode("utf-8"),
            )

        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Line 6 evaluates `nums[1] + nums[3]` which equals `16`.",
                        }
                    }
                ]
            },
        )

    provider = OpenAITutorProvider(
        api_key="test-openai-secret-key",
        default_model_id="gpt-4o-mini",
        transport=httpx.MockTransport(handler),
    )
    assert provider.is_configured() is True

    res = asyncio.run(provider.generate_completion(req))
    assert res.provider == "openai"
    assert res.model == "gpt-4o-mini"
    assert "nums[1] + nums[3]" in res.content
    assert captured_auth[0] == "Bearer test-openai-secret-key"

    async def collect_stream() -> str:
        parts: list[str] = []
        async for ch in provider.stream_completion(req):
            if ch.delta:
                parts.append(ch.delta)
        return "".join(parts)

    assert asyncio.run(collect_stream()) == "Line 6 adds nums[left] and nums[right]."


def test_provider_error_handling_auth_ratelimit_timeout_and_malformed() -> None:
    ctx = _sample_execution_context()
    req = ProviderCompletionRequest(
        action="chat",
        user_prompt="Explain this",
        system_prompt="System",
        execution_context=ctx,
    )

    # 1. Missing API key raises AIProviderUnavailableError
    unconfigured_gemini = GeminiTutorProvider(api_key="")
    with pytest.raises(AIProviderUnavailableError):
        asyncio.run(unconfigured_gemini.generate_completion(req))

    # 2. HTTP 401 raises AIProviderAuthError
    async def auth_fail(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": {"message": "Invalid API key"}})

    bad_auth_openai = OpenAITutorProvider(
        api_key="bad-key",
        transport=httpx.MockTransport(auth_fail),
    )
    with pytest.raises(AIProviderAuthError):
        asyncio.run(bad_auth_openai.generate_completion(req))

    # 3. HTTP 429 raises AIProviderRateLimitError
    async def rate_limit(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"error": {"message": "Quota exceeded"}})

    rl_gemini = GeminiTutorProvider(
        api_key="valid-key",
        transport=httpx.MockTransport(rate_limit),
    )
    with pytest.raises(AIProviderRateLimitError):
        asyncio.run(rl_gemini.generate_completion(req))

    # 4. Timeout raises AIProviderTimeoutError
    async def timeout_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Timed out", request=request)

    timeout_openai = OpenAITutorProvider(
        api_key="valid-key",
        transport=httpx.MockTransport(timeout_handler),
    )
    with pytest.raises(AIProviderTimeoutError):
        asyncio.run(timeout_openai.generate_completion(req))

    # 5. Malformed response raises AIProviderError
    async def malformed_handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"candidates": []})

    malformed_gemini = GeminiTutorProvider(
        api_key="valid-key",
        transport=httpx.MockTransport(malformed_handler),
    )
    with pytest.raises(AIProviderError):
        asyncio.run(malformed_gemini.generate_completion(req))


def test_provider_switching_persistence_and_execution_grounded_fallback(
    tmp_path: Path,
) -> None:
    db_file = tmp_path / "tutor_test.db"
    store = TutorConversationStore(db_path=db_file)

    async def gemini_ok(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"content": {"parts": [{"text": "Gemini explanation of Step 6"}]}}
                ]
            },
        )

    async def openai_ok(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": "OpenAI explanation of Step 6"}}
                ]
            },
        )

    service = AITutorService(
        gemini_provider=GeminiTutorProvider(
            api_key="gem-key", transport=httpx.MockTransport(gemini_ok)
        ),
        openai_provider=OpenAITutorProvider(
            api_key="oa-key", transport=httpx.MockTransport(openai_ok)
        ),
        grounded_provider=ExecutionGroundedTutorProvider(),
        store=store,
        rate_limit_per_minute=20,
    )

    ctx = _sample_execution_context()

    # Turn 1 with Google Gemini
    r1 = asyncio.run(
        service.handle_chat(
            TutorChatRequestSchema(
                action="explain_step",
                provider="gemini",
                execution_context=ctx,
            )
        )
    )
    assert r1.provider == "gemini"
    assert r1.used_fallback is False
    assert "Gemini explanation of Step 6" in r1.message.content

    # Turn 2 in same conversation switching to OpenAI
    r2 = asyncio.run(
        service.handle_chat(
            TutorChatRequestSchema(
                action="explain_line",
                provider="openai",
                conversation_id=r1.conversation_id,
                execution_context=ctx,
            )
        )
    )
    assert r2.conversation_id == r1.conversation_id
    assert r2.provider == "openai"
    assert "OpenAI explanation of Step 6" in r2.message.content

    # Verify SQLite persistence stored both turns (4 messages: 2 user + 2 assistant)
    saved = store.get_conversation(r1.conversation_id)
    assert saved is not None
    assert len(saved.messages) == 4
    assert saved.messages[1].provider == "gemini"
    assert saved.messages[3].provider == "openai"


def test_execution_grounded_engine_all_actions_and_error_diagnosis() -> None:
    grounded = ExecutionGroundedTutorProvider()
    ctx = _sample_execution_context()

    for action in ("explain_program", "explain_line", "explain_step", "explain_why", "hint"):
        req = ProviderCompletionRequest(
            action=action,  # type: ignore[arg-type]
            user_prompt="",
            system_prompt="",
            execution_context=ctx,
            hint_mode=(action == "hint"),
            hint_level=2,
        )
        res = asyncio.run(grounded.generate_completion(req))
        assert res.provider == "execution_grounded"
        # Must reference real variable values from the snapshot
        assert "left" in res.content or "nums" in res.content

    # Test runtime error diagnosis
    err_ctx = TutorExecutionContextSchema(
        source_code="nums = [10, 20]\nprint(nums[5])",
        execution_status="runtime_error",
        total_steps=2,
        error=TutorErrorSnapshotSchema(
            error_type="IndexError",
            message="list index out of range",
            friendly_title="List Index Out of Range",
            friendly_explanation="Index 5 does not exist in a 2-element list.",
            suggestion="Ensure index < len(nums).",
            line=2,
            source_line="print(nums[5])",
        ),
    )
    err_res = asyncio.run(
        grounded.generate_completion(
            ProviderCompletionRequest(
                action="debug_error",
                user_prompt="Fix this crash",
                system_prompt="",
                execution_context=err_ctx,
            )
        )
    )
    assert "IndexError" in err_res.content
    assert "Line 2" in err_res.content


def test_tutor_rest_and_sse_endpoints() -> None:
    client = TestClient(app)

    # 1. Providers status
    prov_res = client.get("/api/tutor/providers")
    assert prov_res.status_code == 200
    prov_data = prov_res.json()
    assert len(prov_data["providers"]) == 3
    assert prov_data["providers"][0]["id"] == "gemini"
    assert prov_data["providers"][1]["id"] == "openai"
    assert prov_data["providers"][2]["id"] == "execution_grounded"

    # 2. All 11 DSA Learning Assistant topics
    topics_res = client.get("/api/tutor/dsa-topics")
    assert topics_res.status_code == 200
    topics = topics_res.json()
    assert len(topics) == 11
    slugs = {t["slug"] for t in topics}
    assert {
        "arrays-strings",
        "two-pointers",
        "sliding-window",
        "hash-maps-sets",
        "binary-search",
        "recursion",
        "sorting",
        "stacks-queues",
        "linked-lists",
        "trees-graphs",
        "dynamic-programming",
    }.issubset(slugs)

    # Single topic endpoint
    tp_res = client.get("/api/tutor/dsa-topics/two-pointers")
    assert tp_res.status_code == 200
    assert tp_res.json()["title"] == "Two Pointers"

    # 3. POST /api/tutor/chat (falls back cleanly to execution_grounded when no cloud key set)
    ctx = _sample_execution_context()
    chat_res = client.post(
        "/api/tutor/chat",
        json={
            "action": "explain_step",
            "provider": "gemini",
            "allow_fallback": True,
            "execution_context": ctx.model_dump(),
        },
    )
    assert chat_res.status_code == 200
    chat_body = chat_res.json()
    conv_id = chat_body["conversation_id"]
    assert conv_id.startswith("conv_")
    assert "Step 6" in chat_body["message"]["content"] or "Step #6" in chat_body["message"]["content"]
    assert "`16`" in chat_body["message"]["content"]
    assert len(chat_body["suggested_questions"]) > 0

    # 4. POST /api/tutor/chat/stream (SSE streaming)
    with client.stream(
        "POST",
        "/api/tutor/chat/stream",
        json={
            "action": "hint",
            "provider": "gemini",
            "hint_mode": True,
            "hint_level": 1,
            "conversation_id": conv_id,
            "execution_context": ctx.model_dump(),
        },
    ) as stream_res:
        assert stream_res.status_code == 200
        events = [
            json.loads(line[5:].strip())
            for line in stream_res.iter_lines()
            if line.startswith("data:")
        ]
    assert any(e["type"] == "delta" for e in events)
    done_ev = next(e for e in events if e["type"] == "done")
    assert done_ev["conversation_id"] == conv_id
    hint_content = done_ev["message"]["content"].lower()
    assert "hint" in hint_content and ("level 1" in hint_content or "#1" in hint_content)

    # 5. Conversation history list, detail, and delete
    list_res = client.get("/api/tutor/conversations")
    assert list_res.status_code == 200
    assert any(c["id"] == conv_id for c in list_res.json())

    detail_res = client.get(f"/api/tutor/conversations/{conv_id}")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["messages"]) == 4

    del_res = client.delete(f"/api/tutor/conversations/{conv_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

