import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import type { ExecuteResponsePayload, TraceStep } from "@/types/api";
import { extractWorkspaceExecutionContext } from "@/lib/tutor/context-extractor";
import {
  FALLBACK_DSA_TOPICS,
  getDsaTopicBySlug,
} from "@/lib/tutor/dsa-catalog";

function makeMockTraceStep(overrides: Partial<TraceStep> = {}): TraceStep {
  return {
    step: 2,
    line: 5,
    event: "line",
    function_name: "<module>",
    call_depth: 1,
    source_line: "current_sum = nums[left] + nums[right]",
    locals: [
      {
        name: "nums",
        scope: "local",
        var_type: "list",
        repr_value: "[2, 5, 8, 11, 15]",
        change: "unchanged",
        previous_repr: "[2, 5, 8, 11, 15]",
        structured: {
          kind: "sequence",
          type_name: "list",
          display: "[2, 5, 8, 11, 15]",
          object_id: "ref#1",
          length: 5,
          truncated: false,
          items: [2, 5, 8, 11, 15].map((n) => ({
            kind: "primitive",
            type_name: "int",
            display: String(n),
          })),
        },
      },
      {
        name: "left",
        scope: "local",
        var_type: "int",
        repr_value: "1",
        change: "modified",
        previous_repr: "0",
        structured: {
          kind: "primitive",
          type_name: "int",
          display: "1",
        },
      },
      {
        name: "right",
        scope: "local",
        var_type: "int",
        repr_value: "3",
        change: "unchanged",
        previous_repr: "3",
        structured: {
          kind: "primitive",
          type_name: "int",
          display: "3",
        },
      },
      {
        name: "current_sum",
        scope: "local",
        var_type: "int",
        repr_value: "16",
        change: "created",
        previous_repr: null,
        structured: {
          kind: "primitive",
          type_name: "int",
          display: "16",
        },
      },
    ],
    globals: [],
    deleted_variables: [],
    call_stack: [
      {
        frame_id: "f1",
        function_name: "<module>",
        line: 5,
        depth: 1,
        locals_summary: {
          nums: "[2, 5, 8, 11, 15]",
          left: "1",
          right: "3",
          current_sum: "16",
        },
      },
    ],
    return_value: null,
    stdout_snapshot: "Checking pair\n",
    stdout_delta: "Checking pair\n",
    explanation: {
      headline: "Line 5 in <module>: computed `current_sum = 16`",
      details: "`left` changed from 0 to 1; `current_sum` initialized to 16.",
      changes: ["left", "current_sum"],
    },
    ...overrides,
  };
}

describe("Phase 4 — AI Tutor Context Extractor & DSA Catalog", () => {
  it("extracts idle workspace context cleanly when no execution trace is loaded", () => {
    const code = [
      "nums = [2, 5, 8, 11, 15]",
      "left = 0",
      "right = len(nums) - 1",
    ].join("\n");

    const ctx = extractWorkspaceExecutionContext({
      sourceCode: code,
      traceResult: null,
      currentStepIndex: 0,
      selectedLineStart: 2,
      selectedLineEnd: 3,
    });

    assert.equal(ctx.execution_status, "idle");
    assert.equal(ctx.total_steps, 0);
    assert.equal(ctx.current_step, null);
    assert.equal(ctx.previous_step, null);
    assert.equal(ctx.selected_line_start, 2);
    assert.equal(ctx.selected_line_end, 3);
    assert.equal(ctx.selected_code, "left = 0\nright = len(nums) - 1");
    assert.deepEqual(ctx.detected_structures, []);
  });

  it("extracts active execution step, previous step, and detected array pointers", () => {
    const code = [
      "nums = [2, 5, 8, 11, 15]",
      "target = 16",
      "left = 0",
      "right = len(nums) - 1",
      "current_sum = nums[left] + nums[right]",
    ].join("\n");

    const step1 = makeMockTraceStep({
      step: 1,
      line: 4,
      source_line: "right = len(nums) - 1",
      locals: [
        {
          name: "nums",
          scope: "local",
          var_type: "list",
          repr_value: "[2, 5, 8, 11, 15]",
          change: "unchanged",
          previous_repr: "[2, 5, 8, 11, 15]",
          structured: {
            kind: "sequence",
            type_name: "list",
            display: "[2, 5, 8, 11, 15]",
            object_id: "ref#1",
            length: 5,
            truncated: false,
            items: [2, 5, 8, 11, 15].map((n) => ({
              kind: "primitive",
              type_name: "int",
              display: String(n),
            })),
          },
        },
        {
          name: "left",
          scope: "local",
          var_type: "int",
          repr_value: "0",
          change: "created",
          previous_repr: null,
          structured: { kind: "primitive", type_name: "int", display: "0" },
        },
        {
          name: "right",
          scope: "local",
          var_type: "int",
          repr_value: "3",
          change: "created",
          previous_repr: null,
          structured: { kind: "primitive", type_name: "int", display: "3" },
        },
      ],
    });
    const step2 = makeMockTraceStep();

    const traceResult: ExecuteResponsePayload = {
      execution_id: "exec-1",
      status: "completed",
      execution_mode: "development_subprocess",
      security_notice: "Local development sandbox",
      duration_ms: 4.2,
      steps: [step1, step2],
      total_steps: 2,
      stdout: "Checking pair\n",
      error: null,
    };

    const ctx = extractWorkspaceExecutionContext({
      sourceCode: code,
      traceResult,
      currentStepIndex: 1,
    });

    assert.equal(ctx.execution_status, "completed");
    assert.equal(ctx.total_steps, 2);
    assert.ok(ctx.current_step);
    assert.equal(ctx.current_step.step, 2);
    assert.equal(ctx.current_step.line, 5);
    assert.ok(ctx.previous_step);
    assert.equal(ctx.previous_step.step, 1);
    assert.equal(ctx.selected_line_start, 5);
    assert.equal(ctx.selected_code, "current_sum = nums[left] + nums[right]");

    const arrayStruct = ctx.detected_structures.find(
      (s) => s.kind === "array" && s.variable_name === "nums"
    );
    assert.ok(arrayStruct, "Expected detected array structure for nums");
    assert.match(arrayStruct.summary, /left=1/);
    assert.match(arrayStruct.summary, /right=3/);
  });

  it("includes structured runtime error details in extracted context", () => {
    const code = "items = [10, 20]\nprint(items[5])";
    const traceResult: ExecuteResponsePayload = {
      execution_id: "exec-err",
      status: "runtime_error",
      execution_mode: "development_subprocess",
      security_notice: "Local development sandbox",
      duration_ms: 1.5,
      steps: [],
      total_steps: 0,
      stdout: "",
      error: {
        error_type: "IndexError",
        message: "list index out of range",
        friendly_title: "List Index Out of Range",
        friendly_explanation:
          "You tried to read index 5 from a list of length 2.",
        suggestion: "Ensure indices stay between 0 and len(items) - 1.",
        line: 2,
        source_line: "print(items[5])",
        traceback_lines: ["IndexError: list index out of range"],
      },
    };

    const ctx = extractWorkspaceExecutionContext({
      sourceCode: code,
      traceResult,
      currentStepIndex: 0,
    });

    assert.equal(ctx.execution_status, "runtime_error");
    assert.ok(ctx.error);
    assert.equal(ctx.error.error_type, "IndexError");
    assert.equal(ctx.error.line, 2);
    assert.equal(ctx.error.source_line, "print(items[5])");
  });

  it("provides all 11 required DSA topics with complexity, comparisons, progressive hints, and practice problems", () => {
    const requiredSlugs = [
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
    ];

    assert.equal(FALLBACK_DSA_TOPICS.length, requiredSlugs.length);

    for (const slug of requiredSlugs) {
      const topic = getDsaTopicBySlug(slug);
      assert.ok(topic, `Missing DSA topic for slug: ${slug}`);
      assert.ok(topic.concept_explanation.length > 40);
      assert.ok(topic.how_it_works_steps.length >= 3);
      assert.ok(topic.time_complexity.includes("O("));
      assert.ok(topic.space_complexity.includes("O("));
      assert.ok(topic.complexity_assumptions.length > 10);
      assert.ok(topic.comparison.brute_force_code.includes("def "));
      assert.ok(topic.comparison.optimized_code.includes("def "));
      assert.ok(topic.progressive_hints.length >= 3);
      assert.ok(topic.practice_questions.length >= 1);
      assert.ok(topic.practice_questions[0].starter_code.length > 20);
    }
  });

  it("integrates frontend extracted execution context with backend Python AI Tutor service", () => {
    const code = [
      "nums = [2, 5, 8, 11, 15]",
      "left = 0",
      "right = len(nums) - 1",
      "current_sum = nums[left] + nums[right]",
    ].join("\n");

    const ctx = extractWorkspaceExecutionContext({
      sourceCode: code,
      traceResult: {
        execution_id: "exec-2",
        status: "completed",
        execution_mode: "development_subprocess",
        security_notice: "Local development sandbox",
        duration_ms: 2.1,
        steps: [makeMockTraceStep()],
        total_steps: 1,
        stdout: "",
        error: null,
      },
      currentStepIndex: 0,
    });

    const pythonBin = path.resolve(process.cwd(), "backend/.venv/bin/python");
    const script = `
import asyncio, json, sys
from app.schemas.tutor import TutorChatRequestSchema
from app.tutor.service import AITutorService
from app.tutor.storage import TutorConversationStore
import tempfile

payload_dict = json.loads(sys.argv[1])
req = TutorChatRequestSchema.model_validate(payload_dict)
with tempfile.TemporaryDirectory() as tmp:
    store = TutorConversationStore(f"{tmp}/test.db")
    svc = AITutorService(store=store)
    resp = asyncio.run(svc.handle_chat(req))
    print(json.dumps({
        "answer": resp.message.content,
        "provider": resp.provider,
        "suggestions": resp.suggested_questions,
    }))
`;

    const requestPayload = {
      action: "explain_step",
      hint_level: 1,
      execution_context: ctx,
    };

    const output = execFileSync(
      pythonBin,
      ["-c", script, JSON.stringify(requestPayload)],
      {
        cwd: path.resolve(process.cwd(), "backend"),
        encoding: "utf-8",
      }
    );

    const parsed = JSON.parse(output.trim()) as {
      answer: string;
      provider: string;
      suggestions: string[];
    };

    assert.ok(parsed.answer.includes("Line 5"));
    assert.ok(parsed.answer.includes("current_sum"));
    assert.ok(parsed.answer.includes("16"));
    assert.ok(parsed.suggestions.length >= 2);
  });
});
