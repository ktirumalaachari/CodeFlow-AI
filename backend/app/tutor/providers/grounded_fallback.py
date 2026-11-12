from __future__ import annotations

import ast
from typing import AsyncIterator

from app.schemas.tutor import (
    TutorExecutionContextSchema,
    TutorModelInfoSchema,
    TutorProviderId,
)
from app.tutor.base import (
    AITutorProvider,
    ProviderCompletionRequest,
    ProviderCompletionResponse,
    ProviderStreamChunk,
)
from app.tutor.dsa_catalog import DSA_TOPIC_GUIDES, get_dsa_topic_by_slug


class ExecutionGroundedTutorProvider(AITutorProvider):
    """
    Deterministic AST & Runtime-Snapshot Grounded Tutor Engine.

    Used automatically as a transparent fallback when external cloud API keys
    (GEMINI_API_KEY / OPENAI_API_KEY) are not configured in `.env`, or when
    explicitly selected. Every explanation is synthesized directly from the
    Python AST and actual execution snapshots—never invented or hardcoded.
    """

    provider_id: TutorProviderId = "execution_grounded"
    display_name: str = "Execution-Grounded Engine"
    role_label: str = "Built-in Local AST & Trace Engine"
    env_var_name: str | None = None

    def is_configured(self) -> bool:
        return True

    def default_model(self) -> str:
        return "codeflow-ast-trace-v4"

    def list_models(self) -> list[TutorModelInfoSchema]:
        return [
            TutorModelInfoSchema(
                id="codeflow-ast-trace-v4",
                label="CODEFLOW AST + Trace Engine v4",
                description="Deterministic Python 3.12 AST, variable snapshot diff, and DSA pattern analyzer.",
                is_default=True,
            )
        ]

    @staticmethod
    def _detect_dsa_pattern(ctx: TutorExecutionContextSchema) -> tuple[str, str, str]:
        code_lower = ctx.source_code.lower()
        struct_kinds = {s.kind for s in ctx.detected_structures}

        if "heapq" in code_lower or "heap" in struct_kinds:
            return (
                "Heap / Priority Queue",
                "O(n) heapify · O(log n) push/pop",
                "O(n) for heap list",
            )
        if "bfs" in code_lower or ("deque" in code_lower and "graph" in struct_kinds):
            return (
                "Breadth-First Search (Graph BFS)",
                "O(V + E) vertices and edges",
                "O(V) for visited set and FIFO queue",
            )
        if "dfs" in code_lower or ("graph" in struct_kinds):
            return (
                "Depth-First Search (Graph DFS)",
                "O(V + E) vertices and edges",
                "O(V) recursion/stack and visited set",
            )
        if "bst" in code_lower or "tree" in struct_kinds or ".left" in code_lower:
            return (
                "Binary Tree / Binary Search Tree",
                "O(log n) balanced search · O(n) full traversal",
                "O(h) tree height stack",
            )
        if "linked" in code_lower or "linked-list" in struct_kinds or ".next" in code_lower:
            return (
                "Linked List Pointer Manipulation",
                "O(n) traversal · O(1) local pointer splice",
                "O(1) auxiliary pointer state",
            )
        if "mid" in code_lower and ("low" in code_lower or "high" in code_lower):
            return (
                "Binary Search",
                "O(log n) interval halving",
                "O(1) iterative pointers",
            )
        if "window_sum" in code_lower or "window" in code_lower:
            return (
                "Sliding Window",
                "O(n) single-pass window shift",
                "O(1) rolling state",
            )
        if "left" in code_lower and "right" in code_lower and "while left < right" in code_lower:
            return (
                "Converging Two Pointers",
                "O(n) single pass",
                "O(1) auxiliary pointers",
            )
        if "stack" in struct_kinds or "stack.append" in code_lower:
            return (
                "LIFO Stack",
                "O(1) per push/pop · O(n) pass",
                "O(n) stack capacity",
            )
        if "queue" in struct_kinds or "popleft" in code_lower:
            return (
                "FIFO Queue (collections.deque)",
                "O(1) per enqueue/dequeue",
                "O(n) queue buffer",
            )
        if "hash-map" in struct_kinds or "dict" in code_lower or "seen" in code_lower:
            return (
                "Hash Map (Python dict)",
                "O(1) average lookup/insert · O(n) pass",
                "O(n) key-value table",
            )
        if ctx.current_step and ctx.current_step.call_depth > 1:
            return (
                "Recursion & Call Stack Unwinding",
                "O(branches^depth) or O(n) linear recursion",
                "O(depth) call stack frames",
            )
        return (
            "Sequential / Iterative Python Execution",
            "O(n) linear pass",
            "O(1) auxiliary state",
        )

    @staticmethod
    def _summarize_ast(source_code: str) -> list[str]:
        if not source_code.strip():
            return ["The editor buffer is currently empty."]
        try:
            tree = ast.parse(source_code)
        except SyntaxError as exc:
            return [
                f"SyntaxError detected at line {exc.lineno or 1}: `{exc.msg}`."
            ]

        notes: list[str] = []
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                args = ", ".join(a.arg for a in node.args.args)
                notes.append(
                    f"**Line {node.lineno}** — Defines function `{node.name}({args})` spanning lines {node.lineno}–{getattr(node, 'end_lineno', node.lineno)}."
                )
            elif isinstance(node, ast.ClassDef):
                methods = [
                    n.name for n in node.body if isinstance(n, ast.FunctionDef)
                ]
                notes.append(
                    f"**Line {node.lineno}** — Defines class `{node.name}` with methods `{', '.join(methods) or 'none'}`."
                )
            elif isinstance(node, (ast.Assign, ast.AnnAssign)):
                segment = ast.get_source_segment(source_code, node) or ""
                first_line = segment.splitlines()[0] if segment else ""
                notes.append(
                    f"**Line {node.lineno}** — Initializes/updates state: `{first_line.strip()}`."
                )
            elif isinstance(node, ast.For):
                target = ast.get_source_segment(source_code, node.target) or "item"
                iter_src = ast.get_source_segment(source_code, node.iter) or "iterable"
                notes.append(
                    f"**Line {node.lineno}** — Runs a `for` loop iterating `{target}` over `{iter_src}`."
                )
            elif isinstance(node, ast.While):
                cond = ast.get_source_segment(source_code, node.test) or "condition"
                notes.append(
                    f"**Line {node.lineno}** — Runs a `while` loop guarded by `{cond}`."
                )
            elif isinstance(node, ast.If):
                cond = ast.get_source_segment(source_code, node.test) or "condition"
                notes.append(
                    f"**Line {node.lineno}** — Evaluates conditional branch `if {cond}:`."
                )
            elif isinstance(node, ast.Expr):
                segment = ast.get_source_segment(source_code, node) or ""
                if segment:
                    notes.append(
                        f"**Line {node.lineno}** — Executes expression `{segment.splitlines()[0].strip()}`."
                    )
        return notes[:10]

    @staticmethod
    def _format_live_variables(ctx: TutorExecutionContextSchema) -> str:
        step = ctx.current_step
        if step is None:
            return "_No runtime variables captured yet — click **Run** to execute the program and inspect live values._"

        all_vars = list(step.locals) + list(step.globals)
        if not all_vars:
            return "_No user variables are allocated in scope at this step._"

        bullets: list[str] = []
        for v in all_vars[:12]:
            change_tag = ""
            if v.change == "created":
                change_tag = " *(newly created on this step)*"
            elif v.change == "modified" and v.previous_repr is not None:
                change_tag = f" *(updated from `{v.previous_repr}` → `{v.repr_value}`)*"
            elif v.change == "modified":
                change_tag = " *(modified on this step)*"
            ref_tag = f" `{v.object_id}`" if v.object_id else ""
            bullets.append(
                f"- `{v.name}` ({v.scope} `{v.var_type}`{ref_tag}) = `{v.repr_value}`{change_tag}"
            )
        return "\n".join(bullets)

    def _build_explain_step(
        self, ctx: TutorExecutionContextSchema, *, hint_mode: bool, hint_level: int
    ) -> str:
        if ctx.error is not None and (
            ctx.current_step is None or ctx.execution_status != "completed"
        ):
            return self._build_debug_error(ctx, hint_mode=hint_mode, hint_level=hint_level)

        step = ctx.current_step
        if step is None:
            return self._build_explain_program(ctx, hint_mode=hint_mode, hint_level=hint_level)

        pattern, time_c, space_c = self._detect_dsa_pattern(ctx)
        prev = ctx.previous_step
        transition_note = (
            f"Transitioned from **Step {prev.step}** (Line {prev.line}: `{prev.source_line.strip()}`) "
            f"to **Step {step.step}** (Line {step.line})."
            if prev
            else f"Initial execution snapshot at **Step {step.step}** (Line {step.line})."
        )

        struct_note = ""
        if ctx.detected_structures:
            active_structs = ", ".join(
                f"**{s.title}** (`{s.variable_name}`, operation: `{s.active_operation or 'inspect'}`)"
                for s in ctx.detected_structures[:3]
            )
            struct_note = f"\n\n### Active Data Structure State\n- Visualized structures at Step {step.step}: {active_structs}"

        stack_note = ""
        if step.call_stack:
            frames = " → ".join(
                f"`{f.function_name}` (L{f.line})" for f in step.call_stack
            )
            stack_note = f"\n- **Active Call Stack (depth {step.call_depth})**: {frames}"

        return (
            f"### Step {step.step} of {ctx.total_steps} — Line {step.line} Execution Analysis\n\n"
            f"```python\n# Line {step.line}\n{step.source_line}\n```\n\n"
            f"- **What Happened**: **{step.explanation_headline}** — {step.explanation_details}\n"
            f"- **Step Transition**: {transition_note}"
            f"{stack_note}\n\n"
            f"### Live Runtime Variables at Step {step.step}\n"
            f"{self._format_live_variables(ctx)}"
            f"{struct_note}\n\n"
            f"### Algorithmic Context ({pattern})\n"
            f"- **Time Complexity**: `{time_c}`\n"
            f"- **Space Complexity**: `{space_c}`"
        )

    def _build_explain_line(
        self, ctx: TutorExecutionContextSchema, *, hint_mode: bool, hint_level: int
    ) -> str:
        lines = ctx.source_code.splitlines()
        start_line = (
            ctx.selected_line_start
            or (ctx.current_step.line if ctx.current_step else 1)
        )
        end_line = ctx.selected_line_end or start_line
        start_line = max(1, min(max(1, len(lines)), start_line))
        end_line = max(start_line, min(max(1, len(lines)), end_line))

        snippet_lines = [
            f"{ln:>3}: {lines[ln - 1]}"
            for ln in range(start_line, end_line + 1)
            if 1 <= ln <= len(lines)
        ]
        snippet = "\n".join(snippet_lines) or "# Empty line"
        raw_stmt = (
            "\n".join(lines[start_line - 1 : end_line]).strip()
            if lines
            else ""
        )

        # Explain syntax construct
        construct_explanation = "Executes a Python statement updating or inspecting program state."
        if raw_stmt.startswith("while "):
            construct_explanation = (
                "Evaluates a `while` loop continuation condition. If the condition evaluates to `True` "
                "under the current variable bindings, execution enters the loop body; if `False`, the loop terminates."
            )
        elif raw_stmt.startswith("for "):
            construct_explanation = (
                "Advances a `for` loop iterator to the next element in the sequence/range and binds the loop variable."
            )
        elif raw_stmt.startswith(("if ", "elif ", "else")):
            construct_explanation = (
                "Tests a conditional branch expression against current variable values to decide whether to enter this block."
            )
        elif raw_stmt.startswith("def "):
            construct_explanation = (
                "Defines a reusable function object and binds its name in scope (or enters a call frame when invoked)."
            )
        elif raw_stmt.startswith("return"):
            construct_explanation = (
                "Terminates the current function frame and hands the evaluated return expression back to the caller frame."
            )
        elif "=" in raw_stmt:
            construct_explanation = (
                "Evaluates the right-hand expression using current variable values and binds/mutates the left-hand target."
            )

        line_label = (
            f"Line {start_line}"
            if start_line == end_line
            else f"Lines {start_line}–{end_line}"
        )

        return (
            f"### Line-by-Line Explanation ({line_label})\n\n"
            f"```python\n{snippet}\n```\n\n"
            f"### 1. What This Code Does\n"
            f"{construct_explanation}\n\n"
            f"### 2. Runtime Values in Current Snapshot\n"
            f"{self._format_live_variables(ctx)}\n\n"
            f"### 3. Why This Line Matters\n"
            + (
                f"At **Step {ctx.current_step.step}**, `{ctx.current_step.explanation_headline}` — {ctx.current_step.explanation_details}"
                if ctx.current_step
                else "Click **Run** (`Cmd/Ctrl + Enter`) to observe the exact variable mutations this line performs at runtime."
            )
        )

    def _build_explain_why(
        self, ctx: TutorExecutionContextSchema, *, hint_mode: bool, hint_level: int
    ) -> str:
        step = ctx.current_step
        pattern, time_c, space_c = self._detect_dsa_pattern(ctx)
        if step is None:
            return (
                f"### Causal Operation Analysis ({pattern})\n\n"
                "Run the program first so we can inspect the exact step transition and variable values that triggered an operation.\n\n"
                f"- **Detected Pattern**: {pattern}\n"
                f"- **Expected Complexity**: Time `{time_c}` · Space `{space_c}`"
            )

        modified_vars = [
            v for v in (step.locals + step.globals) if v.change in ("created", "modified")
        ]
        if modified_vars:
            cause_lines = [
                f"- **`{v.name}` became `{v.repr_value}`**"
                + (
                    f" (previously `{v.previous_repr}`)"
                    if v.previous_repr is not None
                    else " (newly initialized)"
                )
                + f" because line {step.line} (`{step.source_line.strip()}`) executed."
                for v in modified_vars
            ]
            cause_block = "\n".join(cause_lines)
        else:
            cause_block = (
                f"- No variables were mutated on Step {step.step}; Python evaluated line {step.line} "
                f"(`{step.source_line.strip()}`) as a control-flow check or call/return transition ({step.explanation_headline})."
            )

        return (
            f"### Why This Operation Occurred at Step {step.step} (Line {step.line})\n\n"
            f"**Statement Executed**: `{step.source_line.strip()}`\n\n"
            f"### Causal Breakdown\n"
            f"{cause_block}\n"
            f"- **Runtime Explanation**: {step.explanation_details}\n\n"
            f"### Snapshot State Supporting This Decision\n"
            f"{self._format_live_variables(ctx)}\n\n"
            f"### Algorithmic Invariant ({pattern})\n"
            f"This step preserves the **{pattern}** invariant (`{time_c}` time, `{space_c}` space)."
        )

    def _build_debug_error(
        self, ctx: TutorExecutionContextSchema, *, hint_mode: bool, hint_level: int
    ) -> str:
        err = ctx.error
        if err is None:
            return (
                "### No Runtime or Syntax Error Detected\n\n"
                f"Current execution status is **`{ctx.execution_status}`** with **{ctx.total_steps}** recorded steps. "
                "If your program produces an unexpected output (a logical bug), step through the timeline and inspect:\n\n"
                f"{self._format_live_variables(ctx)}"
            )

        fix_snippet = ""
        etype = err.error_type
        if etype == "IndexError":
            fix_snippet = (
                "```python\n"
                "# Ensure index stays strictly within 0 <= idx < len(seq)\n"
                "if 0 <= idx < len(nums):\n"
                "    val = nums[idx]\n"
                "```"
            )
        elif etype == "KeyError":
            fix_snippet = (
                "```python\n"
                "# Safely read dictionary keys with .get() or an 'in' check\n"
                "value = mapping.get(key, default_value)\n"
                "```"
            )
        elif etype == "ZeroDivisionError":
            fix_snippet = (
                "```python\n"
                "# Guard division when the denominator can be 0\n"
                "result = numerator / denominator if denominator != 0 else 0\n"
                "```"
            )
        elif etype == "RecursionError":
            fix_snippet = (
                "```python\n"
                "# Ensure every recursive call moves strictly toward a base case:\n"
                "if n <= 1:\n"
                "    return 1\n"
                "return n * solve(n - 1)\n"
                "```"
            )
        else:
            fix_snippet = (
                f"```python\n# Failing line {err.line or 1}:\n"
                f"{(err.source_line or '# Inspect line syntax and operand types').strip()}\n```"
            )

        return (
            f"### Error Diagnosis: `{err.error_type}` at Line {err.line or 1}\n\n"
            f"- **Summary**: **{err.friendly_title or err.error_type}** — `{err.message}`\n"
            f"- **Failing Statement**: `{(err.source_line or '').strip() or 'See editor line'}`\n"
            f"- **Why Python Raised `{err.error_type}`**: {err.friendly_explanation}\n\n"
            f"### Variable State at Crash Step\n"
            f"{self._format_live_variables(ctx)}\n\n"
            + (
                f"### Progressive Hint (Level {hint_level}/3)\n"
                f"{err.suggestion or 'Inspect the variable values above right before the failing line executes.'}"
                if hint_mode
                else f"### Recommended Fix\n{err.suggestion}\n\n{fix_snippet}"
            )
        )

    def _build_hint(
        self, ctx: TutorExecutionContextSchema, *, hint_level: int
    ) -> str:
        pattern, time_c, space_c = self._detect_dsa_pattern(ctx)
        step = ctx.current_step

        if hint_level == 1:
            return (
                f"### Progressive Hint — Level 1 of 3 (Conceptual Intuition)\n\n"
                f"- **Detected Pattern**: **{pattern}**\n"
                f"- **Key Question to Ask Yourself**: Look at the variables in scope "
                + (
                    f"at **Step {step.step}** (Line {step.line}): which condition or invariant must hold before advancing to the next iteration?"
                    if step
                    else "— what redundant work would a naive nested loop perform here, and what invariant lets us avoid it?"
                )
                + f"\n- **Target Complexity**: Aim for `{time_c}` time and `{space_c}` auxiliary space.\n\n"
                "_Click **Reveal Hint Level 2** if you want a concrete pointer / data-structure strategy._"
            )

        if hint_level == 2:
            return (
                f"### Progressive Hint — Level 2 of 3 (Data Structure & Pointer Strategy)\n\n"
                f"- **Pattern Strategy ({pattern})**:\n"
                "  1. Track the boundary state explicitly in variables so you do not rescan previously visited elements.\n"
                "  2. Verify how each branch updates your state:\n"
                f"{self._format_live_variables(ctx)}\n\n"
                "_Click **Reveal Hint Level 3** for the step-by-step implementation blueprint._"
            )

        return (
            f"### Progressive Hint — Level 3 of 3 (Implementation Blueprint)\n\n"
            f"- **Pattern**: **{pattern}** (`{time_c}` time, `{space_c}` space)\n"
            "- **Step-by-Step Checklist**:\n"
            "  1. **Initialize**: Set up your starting indices/containers and handle empty/single-element edge cases first.\n"
            "  2. **Loop Invariant**: On each iteration, compare the active elements and advance only the pointer or frontier item dictated by the comparison.\n"
            "  3. **Verify on Trace**: Step through the timeline (`F10` / `Shift+F10`) to confirm the final variable state matches expected output."
        )

    def _build_explain_program(
        self, ctx: TutorExecutionContextSchema, *, hint_mode: bool, hint_level: int
    ) -> str:
        pattern, time_c, space_c = self._detect_dsa_pattern(ctx)
        ast_notes = self._summarize_ast(ctx.source_code)
        ast_bullets = "\n".join(f"- {item}" for item in ast_notes)

        stdout_section = (
            f"\n\n### Program Output\n```text\n{ctx.stdout.strip()}\n```"
            if ctx.stdout.strip()
            else ""
        )

        return (
            f"### Complete Program Walkthrough — {pattern}\n\n"
            f"This Python program implements **{pattern}** (`{ctx.total_steps}` execution steps captured, status: `{ctx.execution_status}`).\n\n"
            f"### 1. Structural Breakdown (AST Analysis)\n"
            f"{ast_bullets}\n\n"
            f"### 2. Current Snapshot & Variable State\n"
            f"{self._format_live_variables(ctx)}\n\n"
            f"### 3. Complexity & Optimization Profile\n"
            f"- **Time Complexity**: `{time_c}`\n"
            f"- **Space Complexity**: `{space_c}`"
            f"{stdout_section}"
        )

    def _build_dsa_topic_response(
        self, topic_slug: str | None, ctx: TutorExecutionContextSchema
    ) -> str:
        topic = get_dsa_topic_by_slug(topic_slug or "") if topic_slug else None
        if topic is None:
            topic = DSA_TOPIC_GUIDES[0]

        steps_md = "\n".join(
            f"{idx + 1}. {s}" for idx, s in enumerate(topic.how_it_works_steps)
        )
        hints_md = "\n".join(f"- {h}" for h in topic.progressive_hints)
        cmp = topic.comparison

        return (
            f"### DSA Learning Guide: {topic.title} ({topic.difficulty})\n\n"
            f"{topic.concept_explanation}\n\n"
            f"### How It Works Step-by-Step\n"
            f"{steps_md}\n\n"
            f"### Complexity Analysis\n"
            f"- **Time Complexity**: `{topic.time_complexity}`\n"
            f"- **Space Complexity**: `{topic.space_complexity}`\n"
            f"- **Assumption**: {topic.complexity_assumptions}\n\n"
            f"### Brute-Force vs. Optimized ({cmp.problem_title})\n"
            f"- **Brute-Force (`{cmp.brute_force_time}`, `{cmp.brute_force_space}`)**: {cmp.brute_force_approach}\n"
            f"```python\n{cmp.brute_force_code}\n```\n"
            f"- **Optimized (`{cmp.optimized_time}`, `{cmp.optimized_space}`)**: {cmp.optimized_approach}\n"
            f"```python\n{cmp.optimized_code}\n```\n"
            f"- **Key Insight**: {cmp.key_insight}\n\n"
            f"### Progressive Hints\n"
            f"{hints_md}"
        )

    def _synthesize_markdown(self, request: ProviderCompletionRequest) -> str:
        ctx = request.execution_context
        action = request.action
        q_lower = request.user_prompt.lower()

        if action == "dsa_topic" or request.topic_slug:
            return self._build_dsa_topic_response(request.topic_slug, ctx)
        if request.hint_mode and action == "hint":
            return self._build_hint(ctx, hint_level=request.hint_level)
        if action == "explain_program":
            return self._build_explain_program(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if action == "explain_line":
            return self._build_explain_line(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if action == "explain_step":
            return self._build_explain_step(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if action == "explain_why":
            return self._build_explain_why(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if action == "debug_error":
            return self._build_debug_error(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if action == "hint":
            return self._build_hint(ctx, hint_level=request.hint_level)

        # Free-form chat routing grounded in the user's question + active execution state
        if "error" in q_lower or "bug" in q_lower or "crash" in q_lower or "fix" in q_lower:
            return self._build_debug_error(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if "hint" in q_lower or request.hint_mode:
            return self._build_hint(ctx, hint_level=request.hint_level)
        if "brute" in q_lower or "optimiz" in q_lower or "complexit" in q_lower:
            pattern, time_c, space_c = self._detect_dsa_pattern(ctx)
            matched_topic = next(
                (
                    t
                    for t in DSA_TOPIC_GUIDES
                    if t.title.lower().split()[0] in pattern.lower()
                ),
                DSA_TOPIC_GUIDES[1],
            )
            cmp = matched_topic.comparison
            return (
                f"### Complexity & Optimization Analysis ({pattern})\n\n"
                f"- **Current Code Pattern**: **{pattern}**\n"
                f"- **Time Complexity**: `{time_c}`\n"
                f"- **Space Complexity**: `{space_c}`\n\n"
                f"### Brute-Force vs. Optimized Reference ({cmp.problem_title})\n"
                f"- **Brute-Force (`{cmp.brute_force_time}`)**: {cmp.brute_force_approach}\n"
                f"- **Optimized (`{cmp.optimized_time}`)**: {cmp.optimized_approach}\n"
                f"- **Key Insight**: {cmp.key_insight}\n\n"
                f"### Current Runtime Variables\n"
                f"{self._format_live_variables(ctx)}"
            )
        if "why" in q_lower:
            return self._build_explain_why(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if "line" in q_lower:
            return self._build_explain_line(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        if ctx.current_step is not None:
            return self._build_explain_step(
                ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
            )
        return self._build_explain_program(
            ctx, hint_mode=request.hint_mode, hint_level=request.hint_level
        )

    async def generate_completion(
        self, request: ProviderCompletionRequest
    ) -> ProviderCompletionResponse:
        content = self._synthesize_markdown(request)
        return ProviderCompletionResponse(
            content=content,
            provider="execution_grounded",
            model=self.default_model(),
        )

    async def stream_completion(
        self, request: ProviderCompletionRequest
    ) -> AsyncIterator[ProviderStreamChunk]:
        content = self._synthesize_markdown(request)
        model_id = self.default_model()
        chunk_size = 48
        for i in range(0, len(content), chunk_size):
            yield ProviderStreamChunk(
                delta=content[i : i + chunk_size],
                provider="execution_grounded",
                model=model_id,
                done=False,
            )
        yield ProviderStreamChunk(
            delta="",
            provider="execution_grounded",
            model=model_id,
            done=True,
        )

