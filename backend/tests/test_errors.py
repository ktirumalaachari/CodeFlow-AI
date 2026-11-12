from __future__ import annotations

import pytest

from app.execution.runner import IsolatedExecutionRunner
from app.execution.tracer import PythonExecutionTracer


def test_syntax_error_reporting():
    code = "def broken(x)\n    return x + 1\n"
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "syntax_error"
    assert payload.total_steps == 0
    assert payload.error is not None
    assert payload.error.error_type == "SyntaxError"
    assert payload.error.line == 1
    assert "Syntax Error" in payload.error.friendly_title


@pytest.mark.parametrize(
    ("snippet", "expected_error_type", "expected_crash_line"),
    [
        ("x = 5\ny = unknown_var + x\n", "NameError", 2),
        ("text = 'age: ' + 25\n", "TypeError", 1),
        ("nums = [10, 20, 30]\nval = nums[5]\n", "IndexError", 2),
        ("mapping = {'a': 1}\nv = mapping['missing']\n", "KeyError", 2),
        ("num = int('not_an_int')\n", "ValueError", 1),
        ("a = 10\nb = 0\nc = a / b\n", "ZeroDivisionError", 3),
    ],
)
def test_runtime_errors_preserve_prior_snapshots(
    snippet: str,
    expected_error_type: str,
    expected_crash_line: int,
):
    payload = PythonExecutionTracer().execute(snippet)
    assert payload.status == "runtime_error"
    assert payload.error is not None
    assert payload.error.error_type == expected_error_type
    assert payload.error.line == expected_crash_line
    assert payload.error.friendly_explanation != ""
    assert payload.steps[-1].event == "exception"
    assert payload.steps[-1].line == expected_crash_line


def test_infinite_recursion_caught_cleanly():
    code = "def recurse(n):\n    return recurse(n + 1)\n\nrecurse(0)\n"
    payload = PythonExecutionTracer(max_recursion_depth=35).execute(code)
    assert payload.status == "runtime_error"
    assert payload.error is not None
    assert payload.error.error_type == "RecursionError"
    assert "Recursion" in payload.error.friendly_title
    assert payload.total_steps > 10


def test_infinite_loop_hits_max_trace_step_limit():
    code = "i = 0\nwhile True:\n    i += 1\n"
    payload = PythonExecutionTracer(max_steps=40).execute(code)
    assert payload.status == "step_limit_exceeded"
    assert payload.total_steps == 40
    assert payload.error is not None
    assert payload.error.error_type == "StepLimitExceededError"
    # Verify recorded snapshots actually captured i increasing!
    last_globals = {v.name: v.repr_value for v in payload.steps[-1].globals}
    assert int(last_globals["i"]) >= 18


def test_single_line_infinite_loop_caught_by_step_limit():
    runner = IsolatedExecutionRunner()
    # Python 3.12 PEP 626 emits line events on backward jumps even on one line
    code = "x = 1\nwhile True: pass\n"
    res = runner.run_trace(source_code=code, max_steps=60, timeout_seconds=1.5)
    assert res.payload["status"] == "step_limit_exceeded"
    assert res.payload["total_steps"] == 60


def test_long_blocking_operation_triggers_execution_timeout():
    runner = IsolatedExecutionRunner()
    # Blocking operation inside a single statement triggers wall-clock timeout
    code = "import time\nx = 42\ntime.sleep(2.5)\ny = 99\n"
    res = runner.run_trace(source_code=code, timeout_seconds=0.7)
    assert res.payload["status"] == "timeout"
    assert res.payload["error"]["error_type"] == "ExecutionTimeoutError"
    # Partial trace before timeout is preserved (line 1: import time, line 2: x = 42!)
    assert res.payload["total_steps"] >= 2
    last_vars = {v["name"]: v["repr_value"] for v in res.payload["steps"][-1]["globals"]}
    assert last_vars["x"] == "42"


def test_sandbox_blocks_network_filesystem_and_subprocess():
    runner = IsolatedExecutionRunner()

    net_res = runner.run_trace("import socket\ns = socket.socket()\n")
    assert net_res.payload["status"] == "security_blocked"
    assert net_res.payload["error"]["error_type"] == "SecurityRestrictionError"

    fs_res = runner.run_trace("f = open('/etc/hosts', 'r')\n")
    assert fs_res.payload["status"] == "security_blocked"

    proc_res = runner.run_trace("import os\nos.system('echo blocked')\n")
    assert proc_res.payload["status"] == "security_blocked"
