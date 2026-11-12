"use client";

import * as React from "react";
import "@xyflow/react/dist/style.css";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ArrayVisualizer } from "@/components/visualizer/arrays/ArrayVisualizer";
import { StackVisualizer } from "@/components/visualizer/stack/StackVisualizer";
import { QueueVisualizer } from "@/components/visualizer/queue/QueueVisualizer";
import { LinkedListVisualizer } from "@/components/visualizer/linked-list/LinkedListVisualizer";
import { TreeVisualizer } from "@/components/visualizer/trees/TreeVisualizer";
import { GraphVisualizer } from "@/components/visualizer/graphs/GraphVisualizer";
import { HeapVisualizer } from "@/components/visualizer/heap/HeapVisualizer";
import { HashMapVisualizer } from "@/components/visualizer/hash-map/HashMapVisualizer";
import { RecursionMemoryVisualizer } from "@/components/visualizer/recursion/RecursionMemoryVisualizer";
import { VisualizerEmptyState } from "@/components/visualizer/VisualizerEmptyState";
import type {
  ReconstructedStructureState,
  UnsupportedVisualizationState,
  VisualizationEvent,
} from "@/types/visualizer";

function UnsupportedVisualizerCard({
  state,
}: {
  state: UnsupportedVisualizationState;
}) {
  return (
    <div
      className="flex h-full min-h-[260px] flex-col items-center justify-center p-6 text-center"
      data-testid="visualizer-unsupported-card"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted-foreground">
        <Info className="h-5 w-5" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-foreground">
          {state.variableName}
        </span>
        <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
          {state.typeName}
        </Badge>
      </div>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        {state.reason}
      </p>
      <div className="mt-3 max-w-md overflow-x-auto rounded-lg border border-border bg-surface-code px-3 py-2 font-mono text-[11px] text-foreground">
        {state.display}
      </div>
    </div>
  );
}

interface VisualizerCanvasProps {
  hasTrace: boolean;
  stepNumber?: number;
  activeState: ReconstructedStructureState | null;
  stepEvents: VisualizationEvent[];
  onRun?: () => void;
}

export function VisualizerCanvas({
  hasTrace,
  stepNumber,
  activeState,
  stepEvents,
  onRun,
}: VisualizerCanvasProps) {
  if (!hasTrace || !activeState) {
    return (
      <div className="flex-1 p-3">
        <VisualizerEmptyState
          hasTrace={hasTrace}
          stepNumber={stepNumber}
          onRun={onRun}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[280px] flex-1 flex-col">
      {/* Main Active Structure Renderer */}
      <div className="min-h-[260px] flex-1">
        {activeState.kind === "array" && <ArrayVisualizer state={activeState} />}
        {activeState.kind === "stack" && <StackVisualizer state={activeState} />}
        {activeState.kind === "queue" && <QueueVisualizer state={activeState} />}
        {activeState.kind === "linked-list" && (
          <LinkedListVisualizer state={activeState} />
        )}
        {activeState.kind === "tree" && <TreeVisualizer state={activeState} />}
        {activeState.kind === "graph" && <GraphVisualizer state={activeState} />}
        {activeState.kind === "heap" && <HeapVisualizer state={activeState} />}
        {activeState.kind === "hash-map" && (
          <HashMapVisualizer state={activeState} />
        )}
        {activeState.kind === "recursion-memory" && (
          <RecursionMemoryVisualizer state={activeState} />
        )}
        {activeState.kind === "unsupported" && (
          <UnsupportedVisualizerCard state={activeState} />
        )}
      </div>

      {/* Step Events Timeline Chips */}
      {stepEvents.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle bg-surface-2/40 px-3.5 py-2"
          data-testid="visualizer-step-events"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Step Events:
          </span>
          {stepEvents.map((ev) => (
            <Badge
              key={ev.id}
              variant="secondary"
              className="gap-1 px-2 py-0.5 font-mono text-[10.5px]"
            >
              <span className="font-semibold text-primary">{ev.operation}</span>
              <span className="text-muted-foreground">{ev.summary}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

