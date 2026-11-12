"use client";

import * as React from "react";
import {
  Boxes,
  GitBranch,
  Layers,
  ListOrdered,
  Network,
  Play,
  Sparkles,
} from "lucide-react";

interface VisualizerEmptyStateProps {
  hasTrace: boolean;
  stepNumber?: number;
  onRun?: () => void;
}

export function VisualizerEmptyState({
  hasTrace,
  stepNumber,
  onRun,
}: VisualizerEmptyStateProps) {
  if (!hasTrace) {
    return (
      <div
        className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center"
        data-testid="visualizer-empty-state"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
          <Boxes className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          Interactive Data Structure &amp; Memory Visualiser
        </h3>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
          Press <strong className="font-semibold text-foreground">Run</strong>{" "}
          to execute your Python 3.12 code. CODEFLOW AI automatically detects
          Arrays, Pointers, Stacks, Queues, Linked Lists, Trees, Graphs, Heaps,
          Dictionaries, and Recursion Call Frames at every step.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          {[
            { icon: ListOrdered, label: "Arrays & Two Pointers" },
            { icon: Layers, label: "Stacks & Queues" },
            { icon: GitBranch, label: "Linked Lists & Trees" },
            { icon: Network, label: "Graphs, Heaps & Dicts" },
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-1 px-2 py-1"
            >
              <item.icon className="h-3 w-3 text-primary" />
              <span>{item.label}</span>
            </span>
          ))}
        </div>

        {onRun && (
          <button
            type="button"
            onClick={onRun}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent-emerald px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-emerald/90 dark:text-slate-950"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run &amp; Visualise</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center"
      data-testid="visualizer-step-empty"
    >
      <Sparkles className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xs font-semibold text-foreground">
        No data structure allocated yet at Step {stepNumber ?? 1}
      </p>
      <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted-foreground">
        Step forward (<kbd className="font-mono">F10</kbd>) to execute variable
        or class initializations. Data structures appear automatically the
        moment Python creates them in memory.
      </p>
    </div>
  );
}

