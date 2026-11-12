"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { reconstructSnapshotVisualizations } from "@/lib/visualizer/state-reconstructor";
import { VisualizerToolbar } from "@/components/visualizer/VisualizerToolbar";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { LearningModeDrawer } from "@/components/visualizer/LearningModeDrawer";
import { VisualizerLegend } from "@/components/visualizer/VisualizerLegend";

const EMPTY_STRUCTURES: [] = [];

export function VisualizerPanel() {
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const lastExecutedCode = useWorkspaceStore((s) => s.lastExecutedCode);
  const sourceCode = useWorkspaceStore((s) => s.sourceCode);
  const selectedStructureId = useWorkspaceStore((s) => s.selectedStructureId);
  const learningModeOpen = useWorkspaceStore((s) => s.learningModeOpen);
  const showLegend = useWorkspaceStore((s) => s.showLegend);

  const setSelectedStructureId = useWorkspaceStore(
    (s) => s.setSelectedStructureId
  );
  const setLearningModeOpen = useWorkspaceStore((s) => s.setLearningModeOpen);
  const setShowLegend = useWorkspaceStore((s) => s.setShowLegend);
  const runExecution = useWorkspaceStore((s) => s.runExecution);

  const steps = traceResult?.steps ?? EMPTY_STRUCTURES;
  const effectiveSource = lastExecutedCode ?? sourceCode;

  const bundle = React.useMemo(
    () =>
      reconstructSnapshotVisualizations(
        steps,
        currentStepIndex,
        effectiveSource,
        selectedStructureId
      ),
    [steps, currentStepIndex, effectiveSource, selectedStructureId]
  );

  return (
    <section
      aria-label="Data Structure and Memory Visualiser"
      data-testid="visualizer-panel"
      className="flex min-h-[340px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-elevation-1"
    >
      <VisualizerToolbar
        structures={bundle?.detectedStructures ?? EMPTY_STRUCTURES}
        activeStructureId={bundle?.activeStructureId ?? null}
        onSelectStructure={setSelectedStructureId}
        learningModeOpen={learningModeOpen}
        onToggleLearningMode={() => setLearningModeOpen(!learningModeOpen)}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(!showLegend)}
        stepNumber={bundle?.stepNumber}
        lineNumber={bundle?.line}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <VisualizerCanvas
          hasTrace={steps.length > 0}
          stepNumber={bundle?.stepNumber}
          activeState={bundle?.activeState ?? null}
          stepEvents={bundle?.stepEvents ?? EMPTY_STRUCTURES}
          onRun={() => void runExecution()}
        />

        {learningModeOpen && bundle?.activeState && (
          <LearningModeDrawer
            kind={bundle.activeState.kind}
            activeState={bundle.activeState}
            onClose={() => setLearningModeOpen(false)}
          />
        )}
      </div>

      {showLegend && bundle?.activeState && (
        <VisualizerLegend kind={bundle.activeState.kind} />
      )}
    </section>
  );
}

