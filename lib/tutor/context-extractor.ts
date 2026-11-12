import type {
  ExecuteResponsePayload,
  TraceStep,
  VariableSnapshotItem,
} from "@/types/api";
import type {
  TutorDetectedStructurePayload,
  TutorExecutionContextPayload,
  TutorStepSnapshotPayload,
  TutorVariableSnapshotPayload,
} from "@/types/tutor";
import { reconstructSnapshotVisualizations } from "@/lib/visualizer/state-reconstructor";

function serializeVariable(
  v: VariableSnapshotItem
): TutorVariableSnapshotPayload {
  return {
    name: v.name,
    scope: v.scope,
    var_type: v.var_type,
    repr_value: v.repr_value,
    change: v.change,
    previous_repr: v.previous_repr ?? null,
    object_id: v.structured?.object_id ?? null,
  };
}

function serializeStep(step: TraceStep | null): TutorStepSnapshotPayload | null {
  if (!step) return null;
  return {
    step: step.step,
    line: step.line,
    event: step.event,
    function_name: step.function_name,
    call_depth: step.call_depth,
    source_line: step.source_line,
    locals: step.locals.map(serializeVariable),
    globals: step.globals.map(serializeVariable),
    call_stack: step.call_stack.map((f) => ({
      frame_id: f.frame_id,
      function_name: f.function_name,
      line: f.line,
      depth: f.depth,
      locals_summary: f.locals_summary,
    })),
    return_value: step.return_value ?? null,
    stdout_snapshot: step.stdout_snapshot,
    stdout_delta: step.stdout_delta,
    explanation_headline: step.explanation.headline,
    explanation_details: step.explanation.details,
  };
}

export interface ExtractExecutionContextOptions {
  sourceCode: string;
  traceResult: ExecuteResponsePayload | null;
  currentStepIndex: number;
  selectedLineStart?: number | null;
  selectedLineEnd?: number | null;
  selectedStructureId?: string | null;
}

export function extractWorkspaceExecutionContext({
  sourceCode,
  traceResult,
  currentStepIndex,
  selectedLineStart = null,
  selectedLineEnd = null,
  selectedStructureId = null,
}: ExtractExecutionContextOptions): TutorExecutionContextPayload {
  const steps = traceResult?.steps ?? [];
  const safeIndex =
    steps.length > 0
      ? Math.max(0, Math.min(steps.length - 1, currentStepIndex))
      : 0;
  const currentStep = steps.length > 0 ? steps[safeIndex] ?? null : null;
  const previousStep =
    steps.length > 0 && safeIndex > 0 ? steps[safeIndex - 1] ?? null : null;

  const lines = sourceCode.split("\n");
  const effStart = selectedLineStart ?? (currentStep ? currentStep.line : 1);
  const effEnd = selectedLineEnd ?? effStart;
  const clampedStart = Math.max(1, Math.min(Math.max(1, lines.length), effStart));
  const clampedEnd = Math.max(
    clampedStart,
    Math.min(Math.max(1, lines.length), effEnd)
  );
  const selectedCode = lines.slice(clampedStart - 1, clampedEnd).join("\n");

  const detectedStructures: TutorDetectedStructurePayload[] = [];
  if (steps.length > 0) {
    try {
      const bundle = reconstructSnapshotVisualizations(
        steps,
        safeIndex,
        sourceCode,
        selectedStructureId
      );
      if (bundle) {
        for (const desc of bundle.detectedStructures) {
          const st =
            bundle.allStatesById[desc.id] ??
            (bundle.activeStructureId === desc.id ? bundle.activeState : null);
          let summary = "";
          if (st) {
            if (st.kind === "array") {
              const ptrs = st.pointers
                .map((p) => `${p.name}=${p.index}`)
                .join(", ");
              summary = ptrs ? `Pointers: ${ptrs}` : `Length=${st.length}`;
            } else if (st.kind === "linked-list") {
              summary = `${st.variant} list with ${st.nodes.length} nodes`;
            } else if (st.kind === "tree") {
              summary = `${st.isBinarySearchTree ? "BST" : "Binary Tree"} with ${st.nodes.length} nodes`;
            } else if (st.kind === "graph") {
              summary = `Visited: [${st.visitedOrder.join(", ")}], Frontier: [${st.frontierItems.join(", ")}]`;
            } else if (st.kind === "heap") {
              summary = `${st.variant} heap, invariant=${st.heapPropertySatisfied}`;
            } else if (st.kind === "hash-map") {
              summary = `${st.entries.length} active keys`;
            }
          }
          detectedStructures.push({
            id: desc.id,
            kind: desc.kind,
            variable_name: desc.variableName,
            title: desc.title,
            subtitle: desc.subtitle,
            active_operation:
              st && "activeOperation" in st
                ? String(st.activeOperation ?? "inspect")
                : "inspect",
            summary,
          });
        }
      }
    } catch {
      // Never block tutor context extraction if visualization bundle fails
    }
  }

  return {
    source_code: sourceCode,
    selected_line_start: clampedStart,
    selected_line_end: clampedEnd,
    selected_code: selectedCode,
    execution_status: traceResult?.status ?? "idle",
    total_steps: traceResult?.total_steps ?? steps.length,
    current_step: serializeStep(currentStep),
    previous_step: serializeStep(previousStep),
    stdout: traceResult?.stdout ?? "",
    error: traceResult?.error
      ? {
          error_type: traceResult.error.error_type,
          message: traceResult.error.message,
          friendly_title: traceResult.error.friendly_title,
          friendly_explanation: traceResult.error.friendly_explanation,
          suggestion: traceResult.error.suggestion,
          line: traceResult.error.line ?? null,
          source_line: traceResult.error.source_line ?? null,
          traceback_lines: traceResult.error.traceback_lines ?? [],
        }
      : null,
    detected_structures: detectedStructures,
  };
}
