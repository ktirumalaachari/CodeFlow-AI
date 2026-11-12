from __future__ import annotations

from app.execution.tracer import PythonExecutionTracer


def _var_map(step, scope: str = "global") -> dict[str, str]:
    items = step.locals if scope == "local" else step.globals
    return {v.name: v.repr_value for v in items}


def test_basic_variable_assignment_and_types():
    code = (
        "count = 42\n"
        "ratio = 3.5\n"
        "label = 'codeflow'\n"
        "active = True\n"
        "nothing = None\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    assert payload.total_steps == 5

    # Step 1 only has count
    assert _var_map(payload.steps[0]) == {"count": "42"}
    assert payload.steps[0].globals[0].var_type == "int"

    # Step 4 has count, ratio, label, active
    assert _var_map(payload.steps[3]) == {
        "count": "42",
        "ratio": "3.5",
        "label": "'codeflow'",
        "active": "True",
    }

    # Step 5 has all 5 with exact types
    final_types = {v.name: v.var_type for v in payload.steps[4].globals}
    assert final_types == {
        "count": "int",
        "ratio": "float",
        "label": "str",
        "active": "bool",
        "nothing": "NoneType",
    }


def test_arithmetic_and_comparisons():
    code = (
        "a = 17\n"
        "b = 5\n"
        "quot = a // b\n"
        "rem = a % b\n"
        "exact = (quot * b + rem) == a\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    final_vars = _var_map(payload.steps[-1])
    assert final_vars == {
        "a": "17",
        "b": "5",
        "quot": "3",
        "rem": "2",
        "exact": "True",
    }


def test_if_elif_else_branching_and_explanations():
    code = (
        "score = 78\n"
        "if score >= 90:\n"
        "    grade = 'A'\n"
        "elif score >= 75:\n"
        "    grade = 'B'\n"
        "else:\n"
        "    grade = 'C'\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    executed_lines = [s.line for s in payload.steps]
    # Line 1 -> Line 2 (False) -> Line 4 (True) -> Line 5
    assert executed_lines == [1, 2, 4, 5]
    assert "False" in payload.steps[1].explanation.headline
    assert "True" in payload.steps[2].explanation.headline
    assert _var_map(payload.steps[-1])["grade"] == "'B'"


def test_for_loop_with_continue_and_break():
    code = (
        "nums = [1, 2, 3, 4, 5]\n"
        "total = 0\n"
        "for n in nums:\n"
        "    if n == 2:\n"
        "        continue\n"
        "    if n == 5:\n"
        "        break\n"
        "    total += n\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    # Collect progressive values of total whenever line 8 executes
    totals_at_line_8 = [
        _var_map(s)["total"] for s in payload.steps if s.line == 8
    ]
    # n=1 -> total=1; n=2 -> continue; n=3 -> total=4; n=4 -> total=8; n=5 -> break
    assert totals_at_line_8 == ["1", "4", "8"]
    assert _var_map(payload.steps[-1])["total"] == "8"


def test_while_loop_intermediate_snapshots():
    code = (
        "left = 0\n"
        "right = 3\n"
        "steps_taken = 0\n"
        "while left < right:\n"
        "    left += 1\n"
        "    steps_taken += 1\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    left_progression = [
        _var_map(s)["left"] for s in payload.steps if s.line == 5
    ]
    assert left_progression == ["1", "2", "3"]
    # Final step is the while condition check evaluating False (left=3, right=3)
    assert payload.steps[-1].line == 4
    assert "False" in payload.steps[-1].explanation.headline


def test_nested_loops():
    code = (
        "pairs = []\n"
        "for i in range(2):\n"
        "    for j in range(2):\n"
        "        pairs.append((i, j))\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    append_snapshots = [
        _var_map(s)["pairs"] for s in payload.steps if s.line == 4
    ]
    assert append_snapshots == [
        "[(0, 0)]",
        "[(0, 0), (0, 1)]",
        "[(0, 0), (0, 1), (1, 0)]",
        "[(0, 0), (0, 1), (1, 0), (1, 1)]",
    ]


def test_function_calls_and_return_values():
    code = (
        "def add_scaled(x, y):\n"
        "    scaled = x * 2\n"
        "    return scaled + y\n"
        "\n"
        "result = add_scaled(3, 5)\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    call_steps = [s for s in payload.steps if s.event == "call"]
    return_steps = [s for s in payload.steps if s.event == "return"]
    assert len(call_steps) == 1
    assert call_steps[0].function_name == "add_scaled"
    assert call_steps[0].call_depth == 1
    assert _var_map(call_steps[0], scope="local") == {"x": "3", "y": "5"}

    assert len(return_steps) == 1
    assert return_steps[0].return_value == "11"
    assert _var_map(payload.steps[-1])["result"] == "11"


def test_recursion_call_stack_and_unwinding():
    code = (
        "def factorial(n):\n"
        "    if n <= 1:\n"
        "        return 1\n"
        "    return n * factorial(n - 1)\n"
        "\n"
        "ans = factorial(4)\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    max_depth = max(s.call_depth for s in payload.steps)
    assert max_depth == 4

    # Verify the deepest call step has 5 frames on stack (<module> + n=4,3,2,1)
    deepest_call = [
        s for s in payload.steps if s.event == "call" and s.call_depth == 4
    ][0]
    stack_ns = [
        f.locals_summary.get("n")
        for f in deepest_call.call_stack
        if f.depth > 0
    ]
    assert stack_ns == ["4", "3", "2", "1"]

    return_vals = [s.return_value for s in payload.steps if s.event == "return"]
    assert return_vals == ["1", "2", "6", "24"]
    assert _var_map(payload.steps[-1])["ans"] == "24"


def test_list_comprehension_and_print_output():
    code = (
        "nums = [1, 2, 3, 4]\n"
        "squares = [x * x for x in nums if x % 2 == 0]\n"
        "print('even squares:', squares)\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    assert _var_map(payload.steps[-1])["squares"] == "[4, 16]"
    assert payload.stdout == "even squares: [4, 16]\n"
    # Step 1 should have empty stdout_snapshot, final step has full stdout_snapshot
    assert payload.steps[0].stdout_snapshot == ""
    assert payload.steps[-1].stdout_snapshot == "even squares: [4, 16]\n"

