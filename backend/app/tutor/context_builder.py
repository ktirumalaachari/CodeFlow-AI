from __future__ import annotations

import re
from app.core.config import settings
from app.schemas.tutor import (
    TutorActionType,
    TutorExecutionContextSchema,
    TutorStepSnapshotSchema,
)

# Regex patterns to scrub accidental credentials/tokens before sending to external LLMs
_SECRET_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"sk-[A-Za-z0-9_-]{20,}"), "[REDACTED_OPENAI_KEY]"),
    (re.compile(r"AIza[A-Za-z0-9_-]{30,}"), "[REDACTED_GEMINI_KEY]"),
    (re.compile(r"ghp_[A-Za-z0-9]{20,}"), "[REDACTED_GITHUB_TOKEN]"),
    (
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        "[REDACTED_PRIVATE_KEY]",
    ),
]


def scrub_secrets(text: str) -> str:
    """Remove accidental API keys or private keys before external LLM transmission."""
    if not text:
        return ""
    cleaned = text
    for pattern, replacement in _SECRET_PATTERNS:
        cleaned = pattern.sub(replacement, cleaned)
    return cleaned


def _format_step_snapshot(label: str, step: TutorStepSnapshotSchema | None) -> str:
    if step is None:
        return f"{label}: <No step snapshot active>"

    lines: list[str] = [
        f"{label}: Step #{step.step} | Line {step.line} | Event={step.event} | Function={step.function_name} (depth={step.call_depth})",
        f"  Source Statement: {step.source_line.strip() or '<empty>'}",
    ]

    if step.explanation_headline:
        lines.append(f"  Tracer Summary: {step.explanation_headline} — {step.explanation_details}")

    if step.return_value is not None:
        lines.append(f"  Return Value: {step.return_value}")

    if step.locals:
        local_parts = []
        for v in step.locals[:20]:
            delta = (
                f" (changed from {v.previous_repr})"
                if v.change == "modified" and v.previous_repr is not None
                else f" ({v.change})"
                if v.change != "unchanged"
                else ""
            )
            ref = f" [{v.object_id}]" if v.object_id else ""
            local_parts.append(f"{v.name}: {v.var_type} = {v.repr_value}{ref}{delta}")
        lines.append("  Locals: " + "; ".join(local_parts))

    if step.globals:
        global_parts = []
        for v in step.globals[:20]:
            delta = (
                f" (changed from {v.previous_repr})"
                if v.change == "modified" and v.previous_repr is not None
                else f" ({v.change})"
                if v.change != "unchanged"
                else ""
            )
            ref = f" [{v.object_id}]" if v.object_id else ""
            global_parts.append(f"{v.name}: {v.var_type} = {v.repr_value}{ref}{delta}")
        lines.append("  Globals: " + "; ".join(global_parts))

    if step.call_stack:
        stack_str = " -> ".join(
            f"{f.function_name}@L{f.line}({', '.join(f'{k}={v}' for k, v in list(f.locals_summary.items())[:4])})"
            for f in step.call_stack[:12]
        )
        lines.append(f"  Call Stack: {stack_str}")

    if step.stdout_delta:
        lines.append(f"  Printed on This Step: {step.stdout_delta.strip()!r}")

    return "\n".join(lines)


def build_system_prompt(*, hint_mode: bool, hint_level: int = 1) -> str:
    base = (
        "You are CODEFLOW AI Tutor, an expert, encouraging computer science and Python 3.12 "
        "visualization instructor embedded inside an interactive step-by-step debugger.\n\n"
        "CRITICAL RULES:\n"
        "1. GROUND EVERY EXPLANATION IN ACTUAL EXECUTION DATA: Always reference the exact variable names, "
        "runtime values, step numbers, line numbers, call stack frames, and data structure states provided in the execution context.\n"
        "2. NEVER INVENT VARIABLE VALUES OR FAKE TRACE DATA: If the program has not been run yet (execution_status='idle'), "
        "explain the static code logic clearly and invite the user to click Run to inspect live runtime values.\n"
        "3. CLEAR STRUCTURE: Use concise Markdown headings, bullet points, inline code (`var = val`), and explicit Time & Space Complexity analysis when relevant.\n"
        "4. SAFETY: Never instruct the user to run destructive system commands or expose credentials."
    )
    if hint_mode:
        base += (
            f"\n\n5. HINT MODE ACTIVE (Level {hint_level} of 3): "
            "Do NOT reveal the full final code solution immediately. "
            "At Level 1, give a conceptual intuition and point out the key invariant. "
            "At Level 2, explain the pointer/data-structure strategy and what condition triggers transitions. "
            "At Level 3, provide a structured step-by-step implementation blueprint with a small skeleton."
        )
    return base


def build_execution_context_block(
    context: TutorExecutionContextSchema,
    *,
    max_chars: int | None = None,
) -> str:
    limit = max_chars or settings.ai_max_context_chars
    numbered_code = "\n".join(
        f"{idx + 1:>3}: {line}"
        for idx, line in enumerate(scrub_secrets(context.source_code).splitlines()[:220])
    )

    sections: list[str] = [
        "=== LIVE WORKSPACE EXECUTION CONTEXT ===",
        f"Execution Status: {context.execution_status} (Total Steps: {context.total_steps})",
        f"Python Source Code:\n```python\n{numbered_code or '# Empty editor'}\n```",
    ]

    if context.selected_line_start:
        end_line = context.selected_line_end or context.selected_line_start
        sections.append(
            f"Selected Editor Line Range: L{context.selected_line_start}–L{end_line}\n"
            f"Selected Code Snippet:\n```python\n{scrub_secrets(context.selected_code or '')}\n```"
        )

    sections.append(_format_step_snapshot("Current Execution Snapshot", context.current_step))
    if context.previous_step is not None:
        sections.append(_format_step_snapshot("Previous Execution Snapshot", context.previous_step))

    if context.detected_structures:
        struct_lines = [
            f"- {s.title} (`{s.variable_name}`, kind={s.kind}, op={s.active_operation or 'inspect'}): {s.subtitle} {s.summary}".strip()
            for s in context.detected_structures[:8]
        ]
        sections.append("Detected Data Structures & Visualizers:\n" + "\n".join(struct_lines))

    if context.stdout:
        sections.append(f"Program Standard Output:\n```\n{scrub_secrets(context.stdout[:1500])}\n```")

    if context.error:
        err = context.error
        sections.append(
            f"Runtime/Syntax Error Details:\n"
            f"  Type: {err.error_type} at Line {err.line or '?'}\n"
            f"  Message: {scrub_secrets(err.message)}\n"
            f"  Statement: {scrub_secrets(err.source_line or '')}\n"
            f"  Explanation: {err.friendly_explanation}\n"
            f"  Suggestion: {err.suggestion}"
        )

    combined = "\n\n".join(sections)
    if len(combined) > limit:
        return combined[:limit] + "\n...[Context truncated to fit token budget]..."
    return combined


def build_action_user_prompt(
    action: TutorActionType,
    user_message: str,
    context: TutorExecutionContextSchema,
    *,
    hint_mode: bool = False,
    hint_level: int = 1,
    topic_slug: str | None = None,
) -> str:
    context_block = build_execution_context_block(context)
    cleaned_user_msg = scrub_secrets(user_message)

    action_directives: dict[TutorActionType, str] = {
        "explain_program": (
            "Task: Explain this complete Python program from top to bottom. "
            "Cover: (1) Overall purpose and algorithm pattern, (2) Step-by-step walkthrough of key lines, "
            "(3) How variables and data structures evolve in the trace, and (4) Time and Space Complexity."
        ),
        "explain_line": (
            "Task: Explain the selected code line(s) (or current executing line) in detail. "
            "Explain the Python syntax, why this line exists in the algorithm, and what concrete values "
            "it reads or mutates in the current execution snapshot."
        ),
        "explain_step": (
            "Task: Explain the CURRENT execution step using the exact runtime variable values shown in the snapshot. "
            "Compare the current snapshot with the previous snapshot, highlight every created or modified variable, "
            "and explain what happens next."
        ),
        "explain_why": (
            "Task: Explain WHY the operation at the current execution step occurred. "
            "Focus on the causal condition, loop/branch invariant, pointer movement, or recursive call decision "
            "using the actual variable values."
        ),
        "debug_error": (
            "Task: Diagnose and explain the error in the execution context. "
            "Identify the root cause on the failing line using the actual runtime variable values, explain why Python "
            "raised the error, and provide a corrected Python code snippet."
        ),
        "hint": (
            f"Task: Provide Progressive Hint #{hint_level} (of 3) for improving, completing, or optimizing the user's code "
            "without immediately giving away the full solution."
        ),
        "dsa_topic": (
            f"Task: Teach the DSA topic '{topic_slug or 'algorithmic pattern'}' and connect it directly to the user's "
            "current workspace code and execution trace."
        ),
        "chat": (
            "Task: Answer the user's question accurately using the live execution context, variable values, "
            "and data structure state."
        ),
    }

    directive = action_directives.get(action, action_directives["chat"])
    if cleaned_user_msg:
        directive += f"\n\nUser Question / Focus: {cleaned_user_msg}"

    if hint_mode and action != "hint":
        directive += (
            f"\n\nReminder: Hint Mode (Level {hint_level}/3) is enabled — guide the learner with progressive clues "
            "and avoid spoiling a full solution immediately."
        )

    return f"{directive}\n\n{context_block}"


def build_suggested_questions(context: TutorExecutionContextSchema) -> list[str]:
    suggestions: list[str] = []

    if context.error is not None:
        suggestions.append(
            f"Why did {context.error.error_type} happen at line {context.error.line or 1} and how do I fix it?"
        )
        suggestions.append("What were the exact variable values right before the crash?")

    if context.current_step is not None:
        step = context.current_step
        suggestions.append(
            f"Why did Step {step.step} execute line {step.line} (`{step.source_line.strip()[:36]}`)?"
        )
        modified = [v.name for v in (step.locals + step.globals) if v.change in ("created", "modified")]
        if modified:
            suggestions.append(
                f"How did {', '.join(modified[:2])} change at Step {step.step}?"
            )
        if step.call_depth > 0:
            suggestions.append(
                f"How does the recursive call stack unwind from `{step.function_name}` (depth {step.call_depth})?"
            )

    if context.detected_structures:
        first_struct = context.detected_structures[0]
        suggestions.append(
            f"What is the time and space complexity of this {first_struct.title} approach?"
        )

    suggestions.extend(
        [
            "Can we compare a brute-force solution against an optimized approach for this code?",
            "Give me a progressive hint to optimize or test edge cases in this program.",
        ]
    )

    # Deduplicate while preserving order, return top 4
    seen: set[str] = set()
    unique: list[str] = []
    for item in suggestions:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique[:4]

