from __future__ import annotations

from dataclasses import dataclass
import io
import sys
from types import FrameType
from typing import Any

from app.execution.error_formatter import (
    StepLimitExceededError,
    UnsupportedConstructError,
    build_execution_error,
    build_step_exception,
)
from app.execution.explainer import SourceAstInspector, populate_step_explanations
from app.execution.models import (
    CallStackFrameData,
    TraceStepData,
    WorkerTracePayload,
)
from app.execution.serializer import (
    ObjectIdentityTracker,
    ValueSerializer,
    should_include_variable,
)
from app.execution.snapshots import SnapshotDiffTracker


class BoundedStringIO(io.StringIO):
    """Captures standard output while enforcing a strict maximum byte/character cap."""

    def __init__(self, max_chars: int = 32768) -> None:
        super().__init__()
        self._max_chars = max_chars
        self._current_len = 0
        self.truncated = False

    def write(self, s: str) -> int:
        if not s:
            return 0
        if self._current_len >= self._max_chars:
            self.truncated = True
            return len(s)
        remaining = self._max_chars - self._current_len
        if len(s) > remaining:
            super().write(s[:remaining] + "\n... [output truncated]")
            self._current_len = self._max_chars
            self.truncated = True
            return len(s)
        self._current_len += len(s)
        return super().write(s)


@dataclass
class _ActiveFrame:
    frame: FrameType
    frame_key: int
    function_name: str
    depth: int
    pending_line: int | None = None
    pending_stdout_pos: int = 0
    suspended_call_line: int | None = None
    suspended_stdout_pos: int = 0


class PythonExecutionTracer:
    """
    Deterministic Python 3.12 execution tracer powered by sys.settrace.
    Records complete per-step snapshots (variables, types, mutations, call stack,
    stdout deltas, return values, and exceptions) so the frontend can scrub
    forward and backward across execution history without re-running code.
    """

    def __init__(
        self,
        max_steps: int = 500,
        max_output_bytes: int = 32768,
        max_container_items: int = 64,
        max_serialize_depth: int = 18,
        max_recursion_depth: int = 90,
    ) -> None:
        self.max_steps = max_steps
        self.max_output_bytes = max_output_bytes
        self.max_recursion_depth = max_recursion_depth

        self._identity_tracker = ObjectIdentityTracker()
        self._serializer = ValueSerializer(
            identity_tracker=self._identity_tracker,
            max_items=max_container_items,
            max_depth=max_serialize_depth,
        )
        self._diff_tracker = SnapshotDiffTracker(self._serializer)

        self._steps: list[TraceStepData] = []
        self._frame_stack: list[_ActiveFrame] = []
        self._frame_id_seq = 0
        self._source_lines: list[str] = []
        self._user_globals: dict[str, Any] = {}
        self._stdout_buf = BoundedStringIO(max_chars=max_output_bytes)
        self._ast_inspector: SourceAstInspector | None = None
        self._unwinding_exception = False

    def execute(
        self,
        source_code: str,
        stdin_data: str | None = None,
    ) -> WorkerTracePayload:
        self._source_lines = source_code.splitlines()

        if not source_code.strip():
            return WorkerTracePayload(
                status="completed",
                total_steps=0,
                stdout="",
                steps=[],
                error=None,
            )

        # 1. Parse & validate AST + compile before executing
        try:
            self._ast_inspector = SourceAstInspector(
                source_code,
                has_stdin=bool(stdin_data is not None and stdin_data != ""),
            )
            compiled_code = compile(source_code, "<workspace>", "exec")
        except SyntaxError as syn_err:
            err_data = build_execution_error(syn_err, self._source_lines)
            return WorkerTracePayload(
                status="syntax_error",
                total_steps=0,
                stdout="",
                steps=[],
                error=err_data,
            )
        except UnsupportedConstructError as unsup_err:
            err_data = build_execution_error(unsup_err, self._source_lines)
            return WorkerTracePayload(
                status="runtime_error",
                total_steps=0,
                stdout="",
                steps=[],
                error=err_data,
            )

        # 2. Prepare clean execution namespace & redirected stdio
        self._user_globals = {"__name__": "__main__"}
        old_stdout = sys.stdout
        old_stdin = sys.stdin
        old_recursion_limit = sys.getrecursionlimit()

        sys.stdout = self._stdout_buf
        sys.stdin = io.StringIO(stdin_data or "")

        status = "completed"
        error_payload = None

        try:
            # Keep safe C-stack headroom for serializer if user triggers RecursionError
            sys.setrecursionlimit(max(60, self.max_recursion_depth + 35))
            sys.settrace(self._trace_dispatch)
            exec(compiled_code, self._user_globals)
        except StepLimitExceededError as step_err:
            sys.settrace(None)
            status = "step_limit_exceeded"
            last_line = self._steps[-1].line if self._steps else 1
            error_payload = build_execution_error(
                step_err, self._source_lines, fallback_line=last_line
            )
        except BaseException as exc:
            sys.settrace(None)
            # Temporarily restore recursion limit so error & snapshot formatting never hit RecursionError
            sys.setrecursionlimit(max(old_recursion_limit, 1000))
            exc_name = type(exc).__name__
            if exc_name == "ExecutionTimeoutError":
                status = "timeout"
            elif exc_name == "SecurityRestrictionError":
                status = "security_blocked"
            else:
                status = "runtime_error"

            last_line = self._steps[-1].line if self._steps else None
            # Ensure exception step exists if raised before first flush (e.g. inner C/audit error)
            if (
                not self._steps
                or (
                    self._steps[-1].event != "exception"
                    and status == "runtime_error"
                )
            ):
                err_probe = build_execution_error(
                    exc, self._source_lines, fallback_line=last_line
                )
                if err_probe.line is not None and len(self._steps) < self.max_steps:
                    self._emit_synthetic_exception_step(err_probe.line, exc)

            error_payload = build_execution_error(
                exc,
                self._source_lines,
                fallback_line=self._steps[-1].line if self._steps else None,
            )
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout
            sys.stdin = old_stdin
            sys.setrecursionlimit(old_recursion_limit)

        # 3. Populate deterministic beginner-friendly explanations across recorded steps
        sys.setrecursionlimit(max(old_recursion_limit, 1000))
        populate_step_explanations(self._steps, self._ast_inspector)

        return WorkerTracePayload(
            status=status,  # type: ignore[arg-type]
            total_steps=len(self._steps),
            stdout=self._stdout_buf.getvalue(),
            steps=self._steps,
            error=error_payload,
        )

    def _next_frame_key(self) -> int:
        self._frame_id_seq += 1
        return self._frame_id_seq

    def _source_at(self, lineno: int) -> str:
        if 1 <= lineno <= len(self._source_lines):
            return self._source_lines[lineno - 1]
        return ""

    def _stdout_len(self) -> int:
        return len(self._stdout_buf.getvalue())

    def _trace_dispatch(
        self,
        frame: FrameType,
        event: str,
        arg: Any,
    ) -> Any:
        if frame.f_code.co_filename != "<workspace>":
            return None

        co_name = frame.f_code.co_name

        # Skip generator expression internal frames & class body creation frames
        if co_name == "<genexpr>":
            return None
        if (
            self._ast_inspector is not None
            and (frame.f_code.co_firstlineno, co_name)
            in self._ast_inspector.class_def_lines
        ):
            return None

        if event == "call":
            # Enforce clean Python recursion depth guard before hitting C stack limit
            if len(self._frame_stack) > self.max_recursion_depth:
                raise RecursionError("maximum recursion depth exceeded")

            if not self._frame_stack and co_name == "<module>":
                self._frame_stack.append(
                    _ActiveFrame(
                        frame=frame,
                        frame_key=0,
                        function_name="<module>",
                        depth=0,
                    )
                )
                return self._trace_dispatch

            # User function call! Flush caller's pending line if active
            if self._frame_stack:
                caller = self._frame_stack[-1]
                if caller.pending_line is not None:
                    self._record_snapshot(
                        active=caller,
                        line=caller.pending_line,
                        event="line",
                        stdout_start=caller.pending_stdout_pos,
                    )
                    caller.suspended_call_line = caller.pending_line
                    caller.suspended_stdout_pos = self._stdout_len()
                    caller.pending_line = None

            callee = _ActiveFrame(
                frame=frame,
                frame_key=self._next_frame_key(),
                function_name=co_name,
                depth=len(self._frame_stack),
            )
            self._frame_stack.append(callee)
            self._record_snapshot(
                active=callee,
                line=frame.f_lineno,
                event="call",
                stdout_start=self._stdout_len(),
            )
            return self._trace_dispatch

        if not self._frame_stack or self._frame_stack[-1].frame is not frame:
            return self._trace_dispatch

        active = self._frame_stack[-1]

        if event == "line":
            # If a try/except caught a prior exception, resume normal tracing
            self._unwinding_exception = False

            if active.pending_line is not None:
                self._record_snapshot(
                    active=active,
                    line=active.pending_line,
                    event="line",
                    stdout_start=active.pending_stdout_pos,
                )
                active.pending_line = None
            elif active.suspended_call_line is not None:
                if frame.f_lineno != active.suspended_call_line:
                    self._record_snapshot(
                        active=active,
                        line=active.suspended_call_line,
                        event="line",
                        stdout_start=active.suspended_stdout_pos,
                    )
                active.suspended_call_line = None

            active.pending_line = frame.f_lineno
            active.pending_stdout_pos = self._stdout_len()
            return self._trace_dispatch

        if event == "return":
            if active.depth == 0:
                if not self._unwinding_exception:
                    final_line = active.pending_line or active.suspended_call_line
                    stdout_pos = (
                        active.pending_stdout_pos
                        if active.pending_line is not None
                        else active.suspended_stdout_pos
                    )
                    if final_line is not None:
                        self._record_snapshot(
                            active=active,
                            line=final_line,
                            event="line",
                            stdout_start=stdout_pos,
                        )
                self._frame_stack.pop()
                return None

            # Returning from a user function
            if self._unwinding_exception:
                self._diff_tracker.clear_frame(active.frame_key)
                self._frame_stack.pop()
                return None

            ret_line = (
                active.pending_line
                or active.suspended_call_line
                or frame.f_lineno
            )
            stdout_pos = (
                active.pending_stdout_pos
                if active.pending_line is not None
                else active.suspended_stdout_pos
            )
            active.pending_line = None
            active.suspended_call_line = None

            ret_struct = self._serializer.serialize(arg)
            self._record_snapshot(
                active=active,
                line=ret_line,
                event="return",
                stdout_start=stdout_pos,
                return_value=ret_struct.display,
            )
            self._diff_tracker.clear_frame(active.frame_key)
            self._frame_stack.pop()
            return None

        if event == "exception":
            exc_type, exc_value, _ = arg
            if exc_type in (GeneratorExit, StopIteration):
                return self._trace_dispatch

            if not self._unwinding_exception:
                # Temporarily ensure enough stack headroom to serialize deep recursion crash
                current_limit = sys.getrecursionlimit()
                sys.setrecursionlimit(current_limit + 50)
                try:
                    crash_line = (
                        active.pending_line
                        or active.suspended_call_line
                        or frame.f_lineno
                    )
                    stdout_pos = (
                        active.pending_stdout_pos
                        if active.pending_line is not None
                        else active.suspended_stdout_pos
                    )
                    active.pending_line = None
                    active.suspended_call_line = None

                    self._record_snapshot(
                        active=active,
                        line=crash_line,
                        event="exception",
                        stdout_start=stdout_pos,
                        step_exception=build_step_exception(exc_value),
                    )
                finally:
                    sys.setrecursionlimit(current_limit)

                self._unwinding_exception = True
            return self._trace_dispatch

        return self._trace_dispatch

    def _record_snapshot(
        self,
        active: _ActiveFrame,
        line: int,
        event: str,
        stdout_start: int,
        return_value: str | None = None,
        step_exception: Any = None,
    ) -> None:
        if len(self._steps) >= self.max_steps:
            raise StepLimitExceededError(self.max_steps)

        # Capture Global Scope
        global_vars, deleted_globals = self._diff_tracker.capture_scope(
            frame_key=0,
            raw_mapping=self._user_globals,
            scope="global",
        )

        # Capture Local Scope if inside a function call
        if active.depth > 0:
            local_vars, deleted_locals = self._diff_tracker.capture_scope(
                frame_key=active.frame_key,
                raw_mapping=dict(active.frame.f_locals),
                scope="local",
            )
            deleted_combined = deleted_locals + deleted_globals
        else:
            local_vars = []
            deleted_combined = deleted_globals

        # Build Call Stack Snapshot (from root <module> to active top frame)
        call_stack: list[CallStackFrameData] = []
        for idx, stack_item in enumerate(self._frame_stack):
            is_top = idx == len(self._frame_stack) - 1
            frame_line = (
                line
                if is_top
                else (
                    stack_item.suspended_call_line
                    or stack_item.pending_line
                    or stack_item.frame.f_lineno
                )
            )
            summary: dict[str, str] = {}
            if stack_item.depth > 0:
                for k, v in list(stack_item.frame.f_locals.items())[:8]:
                    if should_include_variable(k, v):
                        summary[k] = self._serializer.serialize(v).display

            call_stack.append(
                CallStackFrameData(
                    frame_id=f"frame_{stack_item.frame_key}",
                    function_name=stack_item.function_name,
                    line=frame_line,
                    depth=stack_item.depth,
                    locals_summary=summary,
                )
            )

        full_stdout = self._stdout_buf.getvalue()
        stdout_delta = full_stdout[stdout_start:]

        self._steps.append(
            TraceStepData(
                step=len(self._steps) + 1,
                line=line,
                event=event,  # type: ignore[arg-type]
                function_name=active.function_name,
                call_depth=active.depth,
                source_line=self._source_at(line),
                locals=local_vars,
                globals=global_vars,
                deleted_variables=deleted_combined,
                call_stack=call_stack,
                return_value=return_value,
                stdout_snapshot=full_stdout,
                stdout_delta=stdout_delta,
                exception=step_exception,
            )
        )

    def _emit_synthetic_exception_step(
        self,
        line: int,
        exc: BaseException,
    ) -> None:
        global_vars, _ = self._diff_tracker.capture_scope(
            frame_key=0,
            raw_mapping=self._user_globals,
            scope="global",
        )
        full_stdout = self._stdout_buf.getvalue()
        self._steps.append(
            TraceStepData(
                step=len(self._steps) + 1,
                line=line,
                event="exception",
                function_name="<module>",
                call_depth=0,
                source_line=self._source_at(line),
                locals=[],
                globals=global_vars,
                deleted_variables=[],
                call_stack=[
                    CallStackFrameData(
                        frame_id="frame_0",
                        function_name="<module>",
                        line=line,
                        depth=0,
                    )
                ],
                stdout_snapshot=full_stdout,
                stdout_delta="",
                exception=build_step_exception(exc),
            )
        )

