from __future__ import annotations

import os
import tempfile
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import pytest

from app.execution.runner import IsolatedExecutionRunner
from app.main import app
from app.storage.workspace_store import WorkspacePersistenceStore


def test_security_audit_blocks_backend_files_and_host_reads():
    runner = IsolatedExecutionRunner()

    # 1. Direct open() of backend config or .env must be blocked
    backend_cfg = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "app", "core", "config.py")
    )
    res_cfg = runner.run_trace(f"f = open({backend_cfg!r}, 'r')\n")
    assert res_cfg.payload["status"] == "security_blocked"
    assert res_cfg.payload["error"]["error_type"] == "SecurityRestrictionError"

    # 2. Reading via pathlib.Path.read_text() must also be blocked
    res_pathlib = runner.run_trace(
        "import pathlib\ncontent = pathlib.Path('/etc/hosts').read_text()\n"
    )
    assert res_pathlib.payload["status"] == "security_blocked"

    # 3. Writing or deleting files must be blocked
    res_write = runner.run_trace("f = open('malicious.txt', 'w')\n")
    assert res_write.payload["status"] == "security_blocked"

    res_listdir = runner.run_trace("import os\nfiles = os.listdir('.')\n")
    assert res_listdir.payload["status"] == "security_blocked"


def test_security_audit_blocks_backend_app_import_and_scrubs_env(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "AIzaSySuperSecretTestKey1234567890")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-SuperSecretTestKey1234567890")

    runner = IsolatedExecutionRunner()

    # 1. Importing internal FastAPI `app` package from user code must be blocked
    res_import_app = runner.run_trace("import app.core.config\n")
    assert res_import_app.payload["status"] == "security_blocked"
    assert "Importing module 'app' is disabled" in res_import_app.payload["error"]["message"]

    # 2. Inspecting os.environ inside user code must reveal zero secrets
    res_env = runner.run_trace(
        "import os\n"
        "env_copy = dict(os.environ)\n"
        "leaked = ('GEMINI_API_KEY' in env_copy) or ('OPENAI_API_KEY' in env_copy)\n"
        "print('env_count:', len(env_copy), 'leaked:', leaked)\n"
    )
    assert res_env.payload["status"] == "completed"
    assert "env_count: 0 leaked: False" in res_env.payload["stdout"]


def test_security_audit_blocks_network_ctypes_and_subprocess():
    runner = IsolatedExecutionRunner()

    for snippet in [
        "import urllib.request\nurllib.request.urlopen('http://example.com')\n",
        "import http.client\nconn = http.client.HTTPConnection('example.com')\nconn.request('GET', '/')\n",
        "import ctypes\n",
        "import sqlite3\n",
        "import multiprocessing\n",
        "import subprocess\nsubprocess.run(['ls'])\n",
    ]:
        res = runner.run_trace(snippet)
        assert res.payload["status"] == "security_blocked", f"Expected security_blocked for: {snippet}"


def test_production_mode_forbids_dev_subprocess_fallback():
    runner = IsolatedExecutionRunner()
    runner._docker_available = False

    with pytest.raises(RuntimeError, match="SECURITY BLOCK"):
        runner.detect_mode(environment_override="production")


def test_docker_sandbox_command_flags_and_container_cleanup():
    runner = IsolatedExecutionRunner()
    cmd = runner.build_docker_command("cf_sandbox_test123")

    assert "--rm" in cmd
    assert "--network" in cmd and cmd[cmd.index("--network") + 1] == "none"
    assert "--read-only" in cmd
    assert "--cap-drop" in cmd and cmd[cmd.index("--cap-drop") + 1] == "ALL"
    assert "--security-opt" in cmd and cmd[cmd.index("--security-opt") + 1] == "no-new-privileges"
    assert "--user" in cmd and cmd[cmd.index("--user") + 1] == "65534:65534"
    assert "--pids-limit" in cmd and cmd[cmd.index("--pids-limit") + 1] == "32"

    # Verify _run_in_docker always cleans up container via `docker rm -f` in finally block
    fake_proc = MagicMock()
    fake_proc.communicate.return_value = (
        b'{"status":"completed","total_steps":1,"stdout":"ok\\n","steps":[],"error":null}',
        b"",
    )
    fake_proc.returncode = 0
    fake_proc.poll.return_value = 0

    with patch("subprocess.Popen", return_value=fake_proc), patch(
        "subprocess.run"
    ) as mock_sub_run:
        payload = runner._run_in_docker(
            stdin_bytes=b"{}",
            source_code="print('ok')",
            timeout_seconds=2.0,
        )
        assert payload["status"] == "completed"
        assert mock_sub_run.called
        rm_args = mock_sub_run.call_args[0][0]
        assert rm_args[1:3] == ["rm", "-f"]
        assert rm_args[3].startswith("cf_sandbox_")


def test_compare_endpoint_executes_both_solutions_on_identical_inputs():
    client = TestClient(app)

    resp = client.post(
        "/api/compare",
        json={
            "shared_input_code": "nums = [2, 4, 7, 11, 15, 19, 24, 30]\ntarget = 44",
            "brute_force_code": (
                "matched = (-1, -1)\n"
                "for i in range(len(nums)):\n"
                "    for j in range(i + 1, len(nums)):\n"
                "        if nums[i] + nums[j] == target:\n"
                "            matched = (i, j)\n"
                "            break\n"
                "    if matched != (-1, -1):\n"
                "        break\n"
                "print('Pair:', matched)\n"
            ),
            "optimized_code": (
                "left = 0\n"
                "right = len(nums) - 1\n"
                "matched = (-1, -1)\n"
                "while left < right:\n"
                "    s = nums[left] + nums[right]\n"
                "    if s == target:\n"
                "        matched = (left, right)\n"
                "        break\n"
                "    elif s < target:\n"
                "        left += 1\n"
                "    else:\n"
                "        right -= 1\n"
                "print('Pair:', matched)\n"
            ),
        },
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["brute_force"]["status"] == "completed"
    assert data["optimized"]["status"] == "completed"
    assert data["metrics"]["outputs_match"] is True
    assert data["metrics"]["brute_force_steps"] > data["metrics"]["optimized_steps"]
    assert data["metrics"]["steps_saved"] > 0
    assert data["metrics"]["step_reduction_pct"] > 0
    assert data["metrics"]["brute_force_duration_ms"] > 0
    assert data["metrics"]["optimized_duration_ms"] > 0


def test_workspace_persistence_survives_restart():
    with tempfile.TemporaryDirectory() as tmp:
        db_file = os.path.join(tmp, "restart_test.db")

        # Instance 1: Create project, record history, update learning progress
        store1 = WorkspacePersistenceStore(db_path=db_file)
        initial_projects = store1.list_projects()
        assert len(initial_projects) == 4

        created_proj = store1.create_project(
            {
                "name": "Custom Dijkstra Graph Trace",
                "description": "Shortest path priority queue trace",
                "topicSlug": "trees-graphs",
                "status": "Ready",
                "codePreview": "graph = {'A': [('B', 2)]}\nprint(graph)",
            }
        )
        store1.update_project(
            created_proj["id"],
            {"name": "Custom Dijkstra Graph Trace v2", "codePreview": "print('updated')"},
        )

        hist_entry = store1.record_history(
            {
                "title": "Binary Search Run",
                "sourceCode": "nums = [1, 2, 3]\nprint(nums)",
                "status": "completed",
                "totalSteps": 5,
                "durationMs": 12.4,
                "stdoutPreview": "[1, 2, 3]\n",
            }
        )

        store1.update_learning_progress(
            {
                "explored_topics": ["python-basics", "trees-graphs", "dynamic-programming"],
                "completed_lessons": ["lesson-variables-memory", "lesson-two-pointers"],
                "completed_exercises": ["ex-two-pointers"],
                "active_track_id": "track-dsa-core",
            }
        )

        # Instance 2: Simulate application restart with a brand new store instance on the same SQLite file
        store2 = WorkspacePersistenceStore(db_path=db_file)
        projects_after = store2.list_projects()
        assert len(projects_after) == 5

        reopened = store2.get_project(created_proj["id"])
        assert reopened is not None
        assert reopened["name"] == "Custom Dijkstra Graph Trace v2"
        assert reopened["codePreview"] == "print('updated')"

        history_after = store2.list_history()
        assert len(history_after) == 1
        assert history_after[0]["id"] == hist_entry["id"]
        assert history_after[0]["totalSteps"] == 5

        progress_after = store2.get_learning_progress()
        assert "dynamic-programming" in progress_after["explored_topics"]
        assert "lesson-two-pointers" in progress_after["completed_lessons"]
        assert "ex-two-pointers" in progress_after["completed_exercises"]
        assert progress_after["active_track_id"] == "track-dsa-core"


def test_security_audit_and_persistence_rest_endpoints():
    client = TestClient(app)

    audit_resp = client.get("/api/security/audit")
    assert audit_resp.status_code == 200
    audit_json = audit_resp.json()
    assert "docker_isolation_verified" in audit_json
    assert "production_deployment_blocked" in audit_json
    assert len(audit_json["docker_container_flags"]) >= 8
    assert len(audit_json["worker_sandbox_controls"]) >= 5

