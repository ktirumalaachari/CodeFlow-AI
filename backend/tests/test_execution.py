from __future__ import annotations

from pathlib import Path
import re

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _load_frontend_sample_snippets() -> list[tuple[str, str]]:
    samples_path = (
        Path(__file__).resolve().parents[2] / "lib" / "data" / "samples.ts"
    )
    raw = samples_path.read_text(encoding="utf-8")
    pattern = re.compile(
        r'id:\s*"([^"]+)".*?code:\s*`([^`]+)`',
        re.DOTALL,
    )
    return [(m.group(1), m.group(2)) for m in pattern.finditer(raw)]


def test_all_workspace_sample_programs_detected():
    samples = _load_frontend_sample_snippets()
    assert len(samples) == 29


@pytest.mark.parametrize(
    ("sample_id", "code"),
    _load_frontend_sample_snippets(),
)
def test_every_workspace_sample_program_executes_cleanly(
    sample_id: str,
    code: str,
):
    response = client.post(
        "/api/execute",
        json={"source_code": code, "options": {"max_steps": 500}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed", f"{sample_id} failed: {body['error']}"
    assert body["total_steps"] >= 3
    assert body["stdout"].strip() != ""
    assert len(body["steps"]) == body["total_steps"]


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["python_version"].startswith("3.12")
    assert body["execution_mode"] in ("docker_sandbox", "development_subprocess")
    assert body["limits"]["default_max_steps"] >= 100


def test_execute_endpoint_binary_search_trace_and_snapshot_navigation():
    source = (
        "def binary_search(nums, target):\n"
        "    low, high = 0, len(nums) - 1\n"
        "    while low <= high:\n"
        "        mid = (low + high) // 2\n"
        "        if nums[mid] == target:\n"
        "            return mid\n"
        "        elif nums[mid] < target:\n"
        "            low = mid + 1\n"
        "        else:\n"
        "            high = mid - 1\n"
        "    return -1\n"
        "\n"
        "arr = [2, 5, 8, 12, 16, 23, 38]\n"
        "found_index = binary_search(arr, 23)\n"
        "print('Found at:', found_index)\n"
    )
    response = client.post(
        "/api/execute",
        json={"source_code": source, "options": {"max_steps": 300}},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert data["stdout"] == "Found at: 5\n"
    assert data["total_steps"] == len(data["steps"])
    assert data["total_steps"] > 8

    steps = data["steps"]
    # Simulate snapshot navigation: inspect first mid calculation vs second mid calculation
    mid_steps = [
        s
        for s in steps
        if s["function_name"] == "binary_search"
        and any(v["name"] == "mid" and v["change"] in ("created", "modified") for v in s["locals"])
    ]
    assert len(mid_steps) == 2
    first_mid = {v["name"]: v["repr_value"] for v in mid_steps[0]["locals"]}["mid"]
    second_mid = {v["name"]: v["repr_value"] for v in mid_steps[1]["locals"]}["mid"]
    assert first_mid == "3"   # (0 + 6) // 2 -> arr[3]=12 < 23
    assert second_mid == "5"  # (4 + 6) // 2 -> arr[5]=23 == 23!

    # Final step in <module> has found_index == 5
    final_globals = {v["name"]: v["repr_value"] for v in steps[-1]["globals"]}
    assert final_globals["found_index"] == "5"
