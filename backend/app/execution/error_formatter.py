from __future__ import annotations

import traceback
from typing import Any

from app.execution.models import ExecutionErrorData, StepExceptionData


class StepLimitExceededError(Exception):
    """Raised when traced execution exceeds configured max_steps."""

    def __init__(self, max_steps: int) -> None:
        super().__init__(
            f"Execution exceeded maximum limit of {max_steps} trace steps."
        )
        self.max_steps = max_steps


class ExecutionTimeoutError(Exception):
    """Raised when user program exceeds configured wall-clock timeout."""

    def __init__(self, timeout_seconds: float) -> None:
        super().__init__(
            f"Program exceeded time limit of {timeout_seconds:.1f} seconds."
        )
        self.timeout_seconds = timeout_seconds


class SecurityRestrictionError(Exception):
    """Raised when sandboxed runtime blocks restricted operations."""


class UnsupportedConstructError(Exception):
    """Raised when source contains unsupported constructs such as async/input without stdin."""

    def __init__(self, message: str, line: int | None = None) -> None:
        super().__init__(message)
        self.line = line


ERROR_KNOWLEDGE_BASE: dict[str, tuple[str, str, str]] = {
    "SyntaxError": (
        "Python Syntax Error",
        "Python could not parse this line because its structure breaks Python grammar rules (such as a missing colon ':', unmatched bracket, or unclosed string).",
        "Check the highlighted line and the line immediately above it for missing colons after if/for/while/def, unmatched parentheses, or typos.",
    ),
    "IndentationError": (
        "Indentation Error",
        "Python uses consistent leading spaces to group blocks inside loops, conditions, and functions, and found unexpected spacing on this line.",
        "Indent every block under if, for, while, or def by 4 spaces consistently.",
    ),
    "TabError": (
        "Mixed Tabs and Spaces",
        "This line mixes tab characters and spaces in its indentation.",
        "Use spaces consistently (4 spaces per indentation level).",
    ),
    "NameError": (
        "Undefined Variable or Function Name",
        "You referenced a variable or function name before assigning or defining it, or spelled its name differently.",
        "Verify that the variable was assigned earlier in the current scope and check its exact spelling and casing.",
    ),
    "UnboundLocalError": (
        "Local Variable Read Before Assignment",
        "Inside this function, Python treats this variable as local because you assign to it, so reading it before that assignment fails.",
        "Initialize the variable at the top of the function before modifying or reading it.",
    ),
    "TypeError": (
        "Incompatible Data Types",
        "An operation or function was applied to values of incompatible types (for example, adding a string and an integer, or calling something that isn't a function).",
        "Inspect the Variable Inspector types right before this line and convert types explicitly (e.g., int(), str()) if needed.",
    ),
    "IndexError": (
        "Sequence Index Out of Range",
        "You attempted to access an index that does not exist in this list, tuple, or string. A sequence of length N only has valid indices from 0 to N - 1.",
        "Check your index variable and loop condition so the index stays strictly less than len(sequence).",
    ),
    "KeyError": (
        "Missing Dictionary or Set Key",
        "You tried to look up or remove a key that is not currently stored in the dictionary or set.",
        "Check 'if key in my_dict:' before accessing, or use my_dict.get(key, default) for safe lookups.",
    ),
    "ValueError": (
        "Invalid Value for Operation",
        "The argument has the right type, but its content is invalid for this operation (such as int('abc') or removing a missing value from a list).",
        "Inspect the input value passed into the function on this line.",
    ),
    "ZeroDivisionError": (
        "Division by Zero",
        "Your expression attempted to divide or take modulo (/, //, %) by 0, which is mathematically undefined.",
        "Guard the division with 'if denominator != 0:' or inspect why the divisor became 0.",
    ),
    "RecursionError": (
        "Maximum Recursion Depth Exceeded",
        "A function called itself repeatedly without reaching a terminating base case, exhausting the call stack limit.",
        "Ensure your recursive function has a reachable base case (like 'if n <= 1: return ...') and each recursive call moves closer to it.",
    ),
    "AttributeError": (
        "Unknown Attribute or Method",
        "You tried to access a property or method (using '.') that does not exist on this object's data type (often when a variable is unexpectedly None).",
        "Check the variable's type in the Variable Inspector—for example, list.append() mutates in place and returns None.",
    ),
    "StepLimitExceededError": (
        "Infinite Loop or Step Limit Reached",
        "Your program executed more steps than the visualization limit allows. This usually indicates an infinite while-loop whose condition never becomes False.",
        "Scrub through the recorded steps in the timeline to inspect why your loop variables aren't progressing toward termination.",
    ),
    "ExecutionTimeoutError": (
        "Execution Time Limit Exceeded",
        "Your program ran longer than the maximum allowed execution window (likely a tight infinite loop or very large computation).",
        "Reduce the input size for visualization or verify that every loop updates its termination variable.",
    ),
    "SecurityRestrictionError": (
        "Restricted Sandbox Operation",
        "CODEFLOW AI blocks filesystem access outside the temporary workspace, network sockets, and OS process spawning to keep execution isolated.",
        "Use pure Python data structures, algorithms, and print() statements inside the visualization workspace.",
    ),
    "UnsupportedConstructError": (
        "Unsupported Construct in Interactive Tracer",
        "This construct requires interactive terminal input or asynchronous event loops not active in step-by-step visualization mode.",
        "Define test inputs directly as Python variables at the top of your script (e.g., nums = [2, 7, 11, 15]).",
    ),
}


def get_friendly_error_metadata(exc: BaseException) -> tuple[str, str, str]:
    exc_name = type(exc).__name__
    msg = str(exc)

    if exc_name in ERROR_KNOWLEDGE_BASE:
        title, explanation, suggestion = ERROR_KNOWLEDGE_BASE[exc_name]
        # Enrich NameError with exact symbol name if available
        if isinstance(exc, NameError) and "'" in msg:
            parts = msg.split("'")
            if len(parts) >= 2:
                explanation = (
                    f"Python does not recognize the name '{parts[1]}' at this point in execution. "
                    "It has not been assigned a value yet or may be misspelled."
                )
        return title, explanation, suggestion

    return (
        f"Runtime {exc_name}",
        f"Python raised {exc_name}: {msg}",
        "Inspect the variable values on the highlighted line to see what caused this exception.",
    )


def build_step_exception(exc: BaseException) -> StepExceptionData:
    _, explanation, _ = get_friendly_error_metadata(exc)
    return StepExceptionData(
        error_type=type(exc).__name__,
        message=str(exc),
        friendly_explanation=explanation,
    )


def build_execution_error(
    exc: BaseException,
    source_lines: list[str],
    fallback_line: int | None = None,
) -> ExecutionErrorData:
    exc_name = type(exc).__name__
    title, explanation, suggestion = get_friendly_error_metadata(exc)

    line_no: int | None = fallback_line
    col_no: int | None = None
    src_line: str | None = None
    tb_lines: list[str] = []

    if isinstance(exc, SyntaxError):
        line_no = exc.lineno or fallback_line
        col_no = exc.offset
        if exc.text:
            src_line = exc.text.rstrip("\r\n")
        tb_lines = [f"{exc_name}: {exc.msg} (line {line_no})"]
    elif isinstance(exc, UnsupportedConstructError):
        line_no = exc.line or fallback_line
        tb_lines = [f"UnsupportedConstructError: {exc}"]
    else:
        # Extract frames belonging solely to "<workspace>"
        tb = exc.__traceback__
        workspace_frames = []
        if tb is not None:
            stack_summary = traceback.StackSummary.extract(
                traceback.walk_tb(tb), lookup_lines=False
            )
            for frame_summary in stack_summary:
                if frame_summary.filename == "<workspace>":
                    workspace_frames.append(frame_summary)

        if workspace_frames:
            last_frame = workspace_frames[-1]
            line_no = last_frame.lineno
            for fs in workspace_frames:
                code_text = (
                    source_lines[fs.lineno - 1].strip()
                    if 1 <= fs.lineno <= len(source_lines)
                    else ""
                )
                tb_lines.append(
                    f"Line {fs.lineno}, in {fs.name}: {code_text}"
                )
        tb_lines.append(f"{exc_name}: {exc}")

    if src_line is None and line_no is not None and 1 <= line_no <= len(source_lines):
        src_line = source_lines[line_no - 1]

    return ExecutionErrorData(
        error_type=exc_name,
        message=str(exc),
        friendly_title=title,
        friendly_explanation=explanation,
        suggestion=suggestion,
        line=line_no,
        column=col_no,
        source_line=src_line,
        traceback_lines=tb_lines,
    )

