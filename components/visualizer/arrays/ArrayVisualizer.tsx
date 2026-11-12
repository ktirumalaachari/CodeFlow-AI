"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpDown,
  Grid3X3,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ArrayCellItem,
  ArrayPointerMarker,
  ArrayVisualizationState,
} from "@/types/visualizer";
import { cn } from "@/lib/utils";

const POINTER_ROLE_STYLES: Record<
  ArrayPointerMarker["role"],
  { pill: string; arrow: string; glow: string; label: string }
> = {
  left: {
    pill: "border-sky-500/60 bg-sky-500/20 text-sky-400 shadow-sm shadow-sky-500/20",
    arrow: "text-sky-400",
    glow: "ring-2 ring-sky-500/40 border-sky-400/80 bg-sky-500/10",
    label: "left",
  },
  right: {
    pill: "border-purple-500/60 bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/20",
    arrow: "text-purple-400",
    glow: "ring-2 ring-purple-500/40 border-purple-400/80 bg-purple-500/10",
    label: "right",
  },
  mid: {
    pill: "border-amber-500/60 bg-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/20",
    arrow: "text-amber-400",
    glow: "ring-2 ring-amber-500/40 border-amber-400/80 bg-amber-500/10",
    label: "mid",
  },
  iterator: {
    pill: "border-emerald-500/60 bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20",
    arrow: "text-emerald-400",
    glow: "ring-2 ring-emerald-500/40 border-emerald-400/80 bg-emerald-500/10",
    label: "pointer",
  },
  boundary: {
    pill: "border-border bg-surface-3 text-foreground",
    arrow: "text-muted-foreground",
    glow: "ring-1 ring-border border-border",
    label: "boundary",
  },
};

function CellStatusBadge({ status }: { status: ArrayCellItem["status"] }) {
  if (status === "default" || status === "active") return null;

  if (status === "inserted") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-emerald/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-accent-emerald shadow-sm">
        <PlusCircle className="h-2.5 w-2.5" />
        new
      </span>
    );
  }
  if (status === "updated") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-amber/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-accent-amber shadow-sm">
        <RefreshCw className="h-2.5 w-2.5" />
        set
      </span>
    );
  }
  if (status === "swapped") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-amber/25 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-accent-amber shadow-sm">
        <ArrowUpDown className="h-2.5 w-2.5" />
        swap
      </span>
    );
  }
  if (status === "searched") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/25 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-primary shadow-sm">
        <Search className="h-2.5 w-2.5" />
        target
      </span>
    );
  }
  return null;
}

interface ArrayVisualizerProps {
  state: ArrayVisualizationState;
}

export function ArrayVisualizer({ state }: ArrayVisualizerProps) {
  // Out of bounds pointers (e.g. right = 6 when len is 6)
  const outOfBoundsPointers = state.pointers.filter(
    (p) => p.index < 0 || p.index >= state.cells.length
  );

  // Detect active sliding window or two-pointer range [left..right]
  const leftPtr = state.pointers.find((p) => p.role === "left");
  const rightPtr = state.pointers.find((p) => p.role === "right");
  const hasRangeHighlight =
    leftPtr !== undefined &&
    rightPtr !== undefined &&
    leftPtr.index >= 0 &&
    rightPtr.index >= leftPtr.index &&
    rightPtr.index < state.cells.length;

  return (
    <div
      className="flex h-full flex-col justify-between gap-3 p-4"
      data-testid={`visualizer-array-${state.variableName}`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-foreground">
              {state.variableName}
            </span>
            <Badge
              variant="default"
              className="border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary"
            >
              Array ({state.length} elements)
            </Badge>
          </div>

          {state.is2DMatrix && (
            <Badge variant="indigo" className="gap-1 px-2 py-0.5 text-[10px]">
              <Grid3X3 className="h-2.5 w-2.5" />
              2D Matrix
            </Badge>
          )}

          {hasRangeHighlight && (
            <div className="flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-sky-400">
              <Sparkles className="h-3 w-3" />
              <span>
                Window [{leftPtr.name}..{rightPtr.name}]: {rightPtr.index - leftPtr.index + 1} items
              </span>
            </div>
          )}
        </div>

        {/* Visual Pointer Legend Pills */}
        {state.pointers.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5"
            data-testid="array-pointers-strip"
          >
            {state.pointers.map((ptr) => {
              const style = POINTER_ROLE_STYLES[ptr.role];
              return (
                <span
                  key={ptr.name}
                  data-testid={`array-pointer-pill-${ptr.name}`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold shadow-sm transition-transform hover:scale-105",
                    style.pill
                  )}
                >
                  <span>{ptr.name}</span>
                  <span className="opacity-75">→ [{ptr.index}]</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Operation Announcement Banner */}
      {state.operationSummary && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent px-3.5 py-2 font-mono text-xs text-foreground shadow-sm"
          data-testid="array-operation-banner"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">{state.operationSummary}</span>
        </motion.div>
      )}

      {/* Main Interactive Array Canvas */}
      {state.cells.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-2/20 p-8 text-center">
          <span className="font-mono text-base font-bold text-muted-foreground">
            {state.variableName} = []
          </span>
          <span className="mt-1.5 text-xs text-subtle-foreground">
            Empty array (0 elements initialized)
          </span>
        </div>
      ) : state.is2DMatrix && state.matrixRows ? (
        <div
          className="overflow-x-auto rounded-2xl border border-border bg-surface-2/30 p-5 shadow-inner"
          data-testid="array-2d-matrix"
        >
          <div className="inline-flex flex-col gap-2.5">
            {state.matrixRows.map((row) => (
              <div key={row.rowIndex} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-right font-mono text-xs font-semibold text-subtle-foreground">
                  [{row.rowIndex}]
                </span>
                <div className="flex items-center gap-2">
                  {row.cells.map((cell) => (
                    <motion.div
                      key={cell.colIndex}
                      layout
                      className={cn(
                        "flex h-12 min-w-[58px] flex-col items-center justify-center rounded-xl border-2 px-3 font-mono text-xs transition-all",
                        cell.isActive
                          ? "border-primary bg-primary/20 font-bold text-foreground shadow-glow-primary"
                          : "border-border bg-surface-1 text-foreground hover:border-border-strong"
                      )}
                    >
                      <span className="text-[9px] text-subtle-foreground">
                        [{cell.colIndex}]
                      </span>
                      <span className="font-bold">{cell.display}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-2xl border border-border/80 bg-gradient-to-b from-surface-2/40 to-surface-2/20 px-6 py-6 shadow-inner">
          <div className="inline-flex min-w-full items-end justify-start gap-3">
            {state.cells.map((cell) => {
              const inActiveWindow =
                hasRangeHighlight &&
                cell.index >= leftPtr!.index &&
                cell.index <= rightPtr!.index;

              const activePointer = cell.pointers[0];
              const pointerStyle = activePointer
                ? POINTER_ROLE_STYLES[activePointer.role]
                : null;

              return (
                <div
                  key={cell.index}
                  data-testid={`array-cell-${cell.index}`}
                  className="flex flex-col items-center"
                >
                  {/* Floating Animated Pointer Markers */}
                  <div className="mb-2 flex min-h-[46px] flex-col items-center justify-end gap-1">
                    <AnimatePresence>
                      {cell.pointers.map((ptr) => {
                        const style = POINTER_ROLE_STYLES[ptr.role];
                        return (
                          <motion.div
                            key={ptr.name}
                            layoutId={`ptr-${state.variableName}-${ptr.name}`}
                            initial={{ y: -8, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -8, opacity: 0, scale: 0.8 }}
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 28,
                            }}
                            data-testid={`array-cell-pointer-${ptr.name}-${cell.index}`}
                            className="flex flex-col items-center"
                          >
                            <span
                              className={cn(
                                "flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px] font-bold shadow-md",
                                style.pill
                              )}
                            >
                              <span>{ptr.name}</span>
                            </span>
                            <ArrowDown
                              className={cn("h-3.5 w-3.5 -mt-1 drop-shadow", style.arrow)}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Array Cell Box */}
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className={cn(
                      "relative flex min-h-[70px] min-w-[72px] flex-col items-center justify-between rounded-2xl border-2 px-3 py-2 font-mono shadow-sm transition-all",
                      cell.status === "inserted" &&
                        "border-accent-emerald bg-accent-emerald/20 text-foreground ring-2 ring-accent-emerald/40 shadow-glow-primary",
                      (cell.status === "updated" || cell.status === "swapped") &&
                        "border-accent-amber bg-accent-amber/20 text-foreground ring-2 ring-accent-amber/40",
                      cell.status === "searched" &&
                        "border-primary bg-primary/25 text-foreground ring-2 ring-primary/40",
                      cell.status === "active" &&
                        "border-primary bg-primary/18 text-foreground ring-2 ring-primary/30",
                      cell.status === "default" &&
                        (pointerStyle
                          ? pointerStyle.glow
                          : inActiveWindow
                          ? "border-sky-500/50 bg-sky-500/10 text-foreground ring-1 ring-sky-500/20"
                          : "border-border/90 bg-surface-1/95 text-foreground hover:border-border-strong")
                    )}
                  >
                    <CellStatusBadge status={cell.status} />

                    <motion.span
                      key={`${cell.index}-${cell.display}`}
                      initial={{ scale: 0.85, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="my-auto text-base font-bold tracking-tight text-foreground"
                      data-testid={`array-cell-value-${cell.index}`}
                    >
                      {cell.display}
                    </motion.span>

                    {cell.previousDisplay !== null &&
                      cell.previousDisplay !== undefined &&
                      cell.previousDisplay !== cell.display && (
                        <span className="text-[9.5px] text-muted-foreground line-through">
                          was {cell.previousDisplay}
                        </span>
                      )}
                  </motion.div>

                  {/* Bottom Index Label */}
                  <span className="mt-2 font-mono text-xs font-semibold text-subtle-foreground">
                    [{cell.index}]
                  </span>
                </div>
              );
            })}

            {/* Out-Of-Bounds Boundary Slot (e.g. pointer at len(nums)) */}
            {outOfBoundsPointers.length > 0 && (
              <div className="flex flex-col items-center opacity-85">
                <div className="mb-2 flex min-h-[46px] flex-col items-center justify-end gap-1">
                  {outOfBoundsPointers.map((ptr) => {
                    const style = POINTER_ROLE_STYLES[ptr.role];
                    return (
                      <motion.div
                        key={ptr.name}
                        layoutId={`ptr-${state.variableName}-${ptr.name}`}
                        className="flex flex-col items-center"
                      >
                        <span
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold shadow-md",
                            style.pill
                          )}
                        >
                          {ptr.name}
                        </span>
                        <ArrowDown className={cn("h-3.5 w-3.5 -mt-1", style.arrow)} />
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex min-h-[70px] min-w-[72px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-strong bg-surface-2/30 p-2 font-mono text-xs text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider text-subtle-foreground font-semibold">
                    End
                  </span>
                  <span className="font-semibold text-foreground">
                    [{state.cells.length}]
                  </span>
                </div>

                <span className="mt-2 font-mono text-[11px] text-subtle-foreground">
                  (out of bounds)
                </span>
              </div>
            )}
          </div>

          {state.truncated && (
            <p className="mt-3 text-xs italic text-subtle-foreground">
              Showing first {state.cells.length} of {state.length} elements for responsive rendering.
            </p>
          )}
        </div>
      )}

      {/* Footer: Removed/Popped Items Alert */}
      {state.removedItems.length > 0 && (
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-accent-rose/35 bg-accent-rose/10 px-3.5 py-1.5 font-mono text-xs text-accent-rose shadow-sm"
          data-testid="array-removed-items"
        >
          <MinusCircle className="h-4 w-4" />
          <span>
            Removed:{" "}
            {state.removedItems
              .map((r) => `${r.display} (from index [${r.index}])`)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
