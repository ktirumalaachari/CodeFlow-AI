from __future__ import annotations

import ast
from dataclasses import dataclass

from app.execution.error_formatter import UnsupportedConstructError
from app.execution.models import StepExplanationData, TraceStepData


@dataclass
class LineSyntaxInfo:
    kind: str
    condition_expr: str | None = None
    target_expr: str | None = None
    iter_expr: str | None = None
    op_symbol: str | None = None
    body_start: int | None = None
    body_end: int | None = None
    orelse_start: int | None = None


AUG_OP_SYMBOLS: dict[type[ast.operator], str] = {
    ast.Add: "+=",
    ast.Sub: "-=",
    ast.Mult: "*=",
    ast.Div: "/=",
    ast.FloorDiv: "//=",
    ast.Mod: "%=",
    ast.Pow: "**=",
    ast.BitAnd: "&=",
    ast.BitOr: "|=",
    ast.BitXor: "^=",
    ast.LShift: "<<=",
    ast.RShift: ">>=",
}


def _max_lineno(nodes: list[ast.stmt]) -> int | None:
    if not nodes:
        return None
    best = 0
    for n in nodes:
        end = getattr(n, "end_lineno", None) or getattr(n, "lineno", 0)
        if end > best:
            best = end
    return best or None


class SourceAstInspector:
    """
    Extracts statement metadata per line for deterministic explanations and
    detects class-body headers & unsupported interactive constructs.
    """

    def __init__(self, source_code: str, has_stdin: bool = False) -> None:
        self.line_info: dict[int, LineSyntaxInfo] = {}
        self.class_def_lines: set[tuple[int, str]] = set()
        self._analyze(source_code, has_stdin=has_stdin)

    def _analyze(self, source_code: str, has_stdin: bool) -> None:
        tree = ast.parse(source_code, filename="<workspace>")

        for node in ast.walk(tree):
            lineno = getattr(node, "lineno", None)

            if isinstance(
                node,
                (ast.AsyncFunctionDef, ast.Await, ast.AsyncFor, ast.AsyncWith),
            ):
                raise UnsupportedConstructError(
                    "Async/await coroutines are not supported in synchronous step tracing.",
                    line=lineno,
                )

            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == "input"
                and not has_stdin
            ):
                raise UnsupportedConstructError(
                    "Interactive input() requires stdin data. Assign test variables directly in your code instead.",
                    line=lineno,
                )

            if isinstance(node, ast.ClassDef) and lineno is not None:
                self.class_def_lines.add((lineno, node.name))
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(kind="class_def", target_expr=node.name),
                )

            elif isinstance(node, ast.FunctionDef) and lineno is not None:
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(kind="func_def", target_expr=node.name),
                )

            elif isinstance(node, ast.If) and lineno is not None:
                self.line_info[lineno] = LineSyntaxInfo(
                    kind="if",
                    condition_expr=_safe_unparse(node.test),
                    body_start=node.body[0].lineno if node.body else None,
                    body_end=_max_lineno(node.body),
                    orelse_start=node.orelse[0].lineno if node.orelse else None,
                )

            elif isinstance(node, ast.While) and lineno is not None:
                self.line_info[lineno] = LineSyntaxInfo(
                    kind="while",
                    condition_expr=_safe_unparse(node.test),
                    body_start=node.body[0].lineno if node.body else None,
                    body_end=_max_lineno(node.body),
                )

            elif isinstance(node, ast.For) and lineno is not None:
                self.line_info[lineno] = LineSyntaxInfo(
                    kind="for",
                    target_expr=_safe_unparse(node.target),
                    iter_expr=_safe_unparse(node.iter),
                    body_start=node.body[0].lineno if node.body else None,
                    body_end=_max_lineno(node.body),
                )

            elif isinstance(node, ast.AugAssign) and lineno is not None:
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(
                        kind="aug_assign",
                        target_expr=_safe_unparse(node.target),
                        op_symbol=AUG_OP_SYMBOLS.get(type(node.op), "+="),
                    ),
                )

            elif isinstance(node, ast.Assign) and lineno is not None:
                targets = ", ".join(_safe_unparse(t) for t in node.targets)
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(kind="assign", target_expr=targets),
                )

            elif isinstance(node, ast.AnnAssign) and lineno is not None:
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(
                        kind="assign", target_expr=_safe_unparse(node.target)
                    ),
                )

            elif isinstance(node, ast.Return) and lineno is not None:
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(
                        kind="return",
                        target_expr=_safe_unparse(node.value)
                        if node.value is not None
                        else "None",
                    ),
                )

            elif isinstance(node, ast.Break) and lineno is not None:
                self.line_info.setdefault(lineno, LineSyntaxInfo(kind="break"))

            elif isinstance(node, ast.Continue) and lineno is not None:
                self.line_info.setdefault(lineno, LineSyntaxInfo(kind="continue"))

            elif isinstance(node, ast.Delete) and lineno is not None:
                targets = ", ".join(_safe_unparse(t) for t in node.targets)
                self.line_info.setdefault(
                    lineno,
                    LineSyntaxInfo(kind="delete", target_expr=targets),
                )


def _safe_unparse(node: ast.AST) -> str:
    try:
        return ast.unparse(node)
    except Exception:
        return "expression"


def populate_step_explanations(
    steps: list[TraceStepData],
    inspector: SourceAstInspector | None,
) -> None:
    """
    Deterministically derives beginner-friendly 'What's Happening?' explanations
    from actual step events, variable changes, stdout deltas, and next-step flow.
    """
    total = len(steps)

    for idx, step in enumerate(steps):
        next_step = steps[idx + 1] if idx + 1 < total else None
        syntax_info = inspector.line_info.get(step.line) if inspector else None

        active_vars = step.locals if step.call_depth > 0 else step.globals
        created_vars = [v for v in active_vars if v.change == "created"]
        modified_vars = [v for v in active_vars if v.change == "modified"]

        change_notes: list[str] = []
        for v in created_vars:
            change_notes.append(
                f"Created {v.name} ({v.var_type}) = {v.repr_value}"
            )
        for v in modified_vars:
            change_notes.append(
                f"{v.name} changed from {v.previous_repr} to {v.repr_value}"
            )
        for d in step.deleted_variables:
            change_notes.append(
                f"Removed {d.name} (was {d.previous_repr})"
            )

        stmt_clean = step.source_line.strip()

        # 1. Exception Event
        if step.event == "exception" and step.exception is not None:
            step.explanation = StepExplanationData(
                headline=f"{step.exception.error_type} raised on line {step.line}",
                details=step.exception.friendly_explanation,
                changes=change_notes,
            )
            continue

        # 2. Function Call Event
        if step.event == "call":
            param_pairs = ", ".join(
                f"{v.name}={v.repr_value}" for v in step.locals
            )
            step.explanation = StepExplanationData(
                headline=f"Called function {step.function_name}({param_pairs})",
                details=(
                    f"Python pushed a new stack frame for '{step.function_name}' "
                    f"(call depth {step.call_depth}) and bound its parameter values."
                    if param_pairs
                    else f"Python pushed a new stack frame for '{step.function_name}' (call depth {step.call_depth})."
                ),
                changes=change_notes,
            )
            continue

        # 3. Function Return Event
        if step.event == "return":
            ret_val = step.return_value if step.return_value is not None else "None"
            step.explanation = StepExplanationData(
                headline=f"{step.function_name}() returned {ret_val}",
                details=(
                    f"Function '{step.function_name}' finished executing and returned {ret_val} "
                    "back to the calling line, popping its local stack frame."
                ),
                changes=change_notes,
            )
            continue

        # 4. Control Flow & Statement-Specific Explanations (event == "line")
        if syntax_info is not None:
            if syntax_info.kind == "func_def":
                fn_name = syntax_info.target_expr or "function"
                step.explanation = StepExplanationData(
                    headline=f"Defined function '{fn_name}'",
                    details=(
                        f"Python registered the function '{fn_name}' in memory. "
                        "Its body will only run when the function is called."
                    ),
                    changes=change_notes,
                )
                continue

            if syntax_info.kind == "class_def":
                cls_name = syntax_info.target_expr or "Class"
                step.explanation = StepExplanationData(
                    headline=f"Defined class '{cls_name}'",
                    details=f"Python created the class blueprint '{cls_name}' and its methods.",
                    changes=change_notes,
                )
                continue

            if syntax_info.kind in ("if", "while"):
                cond = syntax_info.condition_expr or "condition"
                entered_body = (
                    next_step is not None
                    and syntax_info.body_start is not None
                    and syntax_info.body_end is not None
                    and next_step.call_depth == step.call_depth
                    and syntax_info.body_start <= next_step.line <= syntax_info.body_end
                )
                # Also check if condition itself triggered a user function call first
                called_helper = (
                    next_step is not None and next_step.event == "call"
                )
                if called_helper:
                    step.explanation = StepExplanationData(
                        headline=f"Evaluating condition: {cond}",
                        details=(
                            f"To check '{cond}', Python first calls '{next_step.function_name}()' "
                            "to compute its return value."
                        ),
                        changes=change_notes,
                    )
                    continue

                if syntax_info.kind == "while":
                    if entered_body and next_step is not None:
                        step.explanation = StepExplanationData(
                            headline=f"While condition ({cond}) is True",
                            details=(
                                f"Python checked whether '{cond}' holds. Since it is True, "
                                f"execution enters the loop body at line {next_step.line}."
                            ),
                            changes=change_notes,
                        )
                    else:
                        step.explanation = StepExplanationData(
                            headline=f"While condition ({cond}) is False",
                            details=(
                                f"Python checked whether '{cond}' holds. Since this condition is False, "
                                "the loop body is skipped and the loop finishes."
                            ),
                            changes=change_notes,
                        )
                    continue

                # if / elif branch
                if entered_body and next_step is not None:
                    step.explanation = StepExplanationData(
                        headline=f"Condition ({cond}) evaluated to True",
                        details=(
                            f"Python checked '{cond}'. Because it is True, "
                            f"execution enters this branch at line {next_step.line}."
                        ),
                        changes=change_notes,
                    )
                else:
                    next_note = (
                        f"moves to line {next_step.line}."
                        if next_step is not None
                        else "skips this branch."
                    )
                    step.explanation = StepExplanationData(
                        headline=f"Condition ({cond}) evaluated to False",
                        details=(
                            f"Python checked '{cond}'. Because it is False, "
                            f"the body is skipped and execution {next_note}"
                        ),
                        changes=change_notes,
                    )
                continue

            if syntax_info.kind == "for":
                target = syntax_info.target_expr or "item"
                iterable = syntax_info.iter_expr or "sequence"
                entered_body = (
                    next_step is not None
                    and syntax_info.body_start is not None
                    and syntax_info.body_end is not None
                    and syntax_info.body_start <= next_step.line <= syntax_info.body_end
                )
                if entered_body:
                    updated_str = (
                        change_notes[0]
                        if change_notes
                        else f"Updated loop variable {target}"
                    )
                    step.explanation = StepExplanationData(
                        headline=f"Next iteration of for-loop ({target} in {iterable})",
                        details=(
                            f"{updated_str}. Execution now runs the loop body starting on line {next_step.line}."
                        ),
                        changes=change_notes,
                    )
                else:
                    step.explanation = StepExplanationData(
                        headline=f"For-loop over '{iterable}' completed",
                        details=(
                            f"All elements of '{iterable}' have been processed, so Python exits the loop."
                        ),
                        changes=change_notes,
                    )
                continue

            if syntax_info.kind == "break":
                dest = f"line {next_step.line}" if next_step else "outside the loop"
                step.explanation = StepExplanationData(
                    headline="Exited loop early via 'break'",
                    details=f"The 'break' statement immediately terminates the enclosing loop and jumps to {dest}.",
                    changes=change_notes,
                )
                continue

            if syntax_info.kind == "continue":
                dest = f"line {next_step.line}" if next_step else "the loop header"
                step.explanation = StepExplanationData(
                    headline="Skipped remainder of iteration via 'continue'",
                    details=f"The 'continue' statement jumps straight back to {dest} for the next loop check.",
                    changes=change_notes,
                )
                continue

        # 5. Assignments, Mutations, Function Call Invocations, and Print Output
        if next_step is not None and next_step.event == "call" and not change_notes:
            step.explanation = StepExplanationData(
                headline=f"Invoking {next_step.function_name}() from line {step.line}",
                details=(
                    f"Evaluating '{stmt_clean}' calls '{next_step.function_name}()'. "
                    "Once it returns, execution will resume on this line."
                ),
                changes=[],
            )
            continue

        if modified_vars:
            primary = modified_vars[0]
            details = (
                f"{primary.name} changed from {primary.previous_repr} to {primary.repr_value} "
                f"because the statement '{stmt_clean}' executed."
            )
            if step.stdout_delta:
                details += f" Printed {step.stdout_delta.strip()!r}."
            step.explanation = StepExplanationData(
                headline=f"Updated {primary.name} → {primary.repr_value}",
                details=details,
                changes=change_notes,
            )
            continue

        if created_vars:
            names_summary = ", ".join(
                f"{v.name} = {v.repr_value}" for v in created_vars[:2]
            )
            if len(created_vars) > 2:
                names_summary += f" (+{len(created_vars) - 2} more)"
            details = (
                f"Executed '{stmt_clean}', initializing {names_summary}."
            )
            if step.stdout_delta:
                details += f" Printed {step.stdout_delta.strip()!r}."
            step.explanation = StepExplanationData(
                headline=f"Initialized {names_summary}",
                details=details,
                changes=change_notes,
            )
            continue

        if step.deleted_variables:
            removed_names = ", ".join(d.name for d in step.deleted_variables)
            step.explanation = StepExplanationData(
                headline=f"Deleted {removed_names}",
                details=f"Removed {removed_names} from the current scope when '{stmt_clean}' executed.",
                changes=change_notes,
            )
            continue

        if step.stdout_delta:
            clean_out = step.stdout_delta.rstrip("\n")
            step.explanation = StepExplanationData(
                headline=f"Printed output: {clean_out!r}",
                details=f"Statement '{stmt_clean}' wrote {clean_out!r} to standard output.",
                changes=change_notes,
            )
            continue

        step.explanation = StepExplanationData(
            headline=f"Executed line {step.line}",
            details=f"Python evaluated '{stmt_clean}' without modifying existing variables.",
            changes=change_notes,
        )

