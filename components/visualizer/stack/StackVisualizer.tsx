"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, Eye, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StackVisualizationState } from "@/types/visualizer";
import { cn } from "@/lib/utils";

interface StackVisualizerProps {
  state: StackVisualizationState;
}

export function StackVisualizer({ state }: StackVisualizerProps) {
  // Render top-of-stack at the visual top (LIFO bucket)
  const topToBottom = [...state.items].reverse();

  return (
    <div
      className="flex h-full flex-col justify-between gap-4 p-4"
      data-testid={`visualizer-stack-${state.variableName}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <Layers className="h-2.5 w-2.5" />
            Stack · LIFO
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            size={state.items.length} ({state.backingType})
          </Badge>
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          Push / Pop at <strong className="text-foreground">TOP</strong>
        </span>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground"
          data-testid="stack-operation-banner"
        >
          {state.activeOperation === "pop" ? (
            <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0 text-accent-rose" />
          ) : state.activeOperation === "peek" ? (
            <Eye className="h-3.5 w-3.5 shrink-0 text-accent-amber" />
          ) : (
            <ArrowDownToLine className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
          )}
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* Vertical Stack Tower + Popped Ghost Card */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface-2/35 p-6">
        {state.poppedItem && (
          <div
            className="flex items-center gap-2 rounded-lg border border-dashed border-accent-rose/50 bg-accent-rose/10 px-3 py-1.5 font-mono text-xs text-accent-rose"
            data-testid="stack-popped-indicator"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            <span>Popped from top: {state.poppedItem.display}</span>
          </div>
        )}

        {/* Open-Top U-Shaped Stack Frame */}
        <div className="flex w-full max-w-[300px] flex-col items-stretch rounded-b-2xl border-b-2 border-l-2 border-r-2 border-border-strong bg-surface-1/50 px-3 pb-3 pt-4">
          {topToBottom.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center text-center font-mono text-xs text-muted-foreground">
              <span>[ empty stack ]</span>
              <span className="mt-1 text-[10.5px] text-subtle-foreground">
                TOP = None
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topToBottom.map((item) => (
                <div
                  key={item.index}
                  data-testid={`stack-item-${item.index}`}
                  className={cn(
                    "flex items-center justify-between rounded-lg border-2 px-3.5 py-2.5 font-mono transition-all",
                    item.status === "pushed"
                      ? "border-accent-emerald bg-accent-emerald/15 shadow-sm"
                      : item.status === "peeked"
                      ? "border-accent-amber bg-accent-amber/15 shadow-sm"
                      : item.isTop
                      ? "border-primary/70 bg-primary/10 shadow-sm"
                      : "border-border bg-surface-1"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-subtle-foreground">
                      [{item.index}]
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {item.display}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.status === "pushed" && (
                      <Badge variant="emerald" className="px-1.5 py-0 text-[9.5px]">
                        pushed
                      </Badge>
                    )}
                    {item.status === "peeked" && (
                      <Badge variant="amber" className="px-1.5 py-0 text-[9.5px]">
                        peeked
                      </Badge>
                    )}
                    {item.isTop && (
                      <Badge variant="indigo" className="px-1.5 py-0 text-[9.5px]">
                        TOP
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="font-mono text-[10.5px] uppercase tracking-wider text-subtle-foreground">
          Stack Base (index 0)
        </span>
      </div>
    </div>
  );
}

