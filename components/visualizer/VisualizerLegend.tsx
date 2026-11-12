"use client";

import * as React from "react";
import type { VisualizationStructureKind } from "@/types/visualizer";

interface VisualizerLegendProps {
  kind: VisualizationStructureKind;
}

const COMMON_LEGEND = [
  { colorClass: "bg-primary", label: "Active / Pointer" },
  { colorClass: "bg-accent-emerald", label: "Inserted / Pushed / New" },
  { colorClass: "bg-accent-amber", label: "Updated / Swapped" },
  { colorClass: "bg-accent-rose", label: "Deleted / Popped" },
  { colorClass: "bg-accent-violet", label: "Reference / Visited" },
];

export function VisualizerLegend({ kind }: VisualizerLegendProps) {
  const extraHint =
    kind === "linked-list" || kind === "recursion-memory"
      ? "ref#N tags show Python object identity (educational runtime graph, not CPython C-heap layout)"
      : kind === "hash-map"
      ? "Displays Python dict insertion-ordered pairs (not CPython internal sparse hash buckets)"
      : kind === "heap"
      ? "Binary tree synchronized with 0-indexed array (parent = (i-1)//2)"
      : null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-surface-2/50 px-3 py-1.5 text-[10.5px] text-muted-foreground"
      data-testid="visualizer-legend"
    >
      <div className="flex flex-wrap items-center gap-3">
        {COMMON_LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${item.colorClass}`}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </span>
        ))}
      </div>
      {extraHint && (
        <span className="text-[10px] italic text-subtle-foreground">
          {extraHint}
        </span>
      )}
    </div>
  );
}

