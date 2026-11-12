"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { QueueVisualizationState } from "@/types/visualizer";
import { cn } from "@/lib/utils";

interface QueueVisualizerProps {
  state: QueueVisualizationState;
}

export function QueueVisualizer({ state }: QueueVisualizerProps) {
  return (
    <div
      className="flex h-full flex-col justify-between gap-4 p-4"
      data-testid={`visualizer-queue-${state.variableName}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="emerald" className="px-1.5 py-0 text-[10px]">
            Queue · FIFO
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            size={state.items.length} ({state.backingType})
          </Badge>
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          Dequeue ← <strong className="text-primary">FRONT</strong> ·{" "}
          <strong className="text-accent-emerald">REAR</strong> ← Enqueue
        </span>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground"
          data-testid="queue-operation-banner"
        >
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* Horizontal FIFO Queue Lane */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-x-auto rounded-xl border border-border bg-surface-2/35 p-6">
        {state.dequeuedItem && (
          <div
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent-rose/50 bg-accent-rose/10 px-3 py-1.5 font-mono text-xs text-accent-rose"
            data-testid="queue-dequeued-indicator"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dequeued from front: {state.dequeuedItem.display}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Dequeue Exit Indicator */}
          <div className="flex flex-col items-center font-mono text-[10px] text-primary">
            <span className="font-bold">FRONT</span>
            <ArrowLeft className="h-4 w-4" />
            <span className="text-muted-foreground">popleft()</span>
          </div>

          {/* Open-Ended Queue Channel */}
          <div className="flex min-h-[96px] min-w-[240px] items-center gap-2 border-b-2 border-t-2 border-border-strong bg-surface-1/60 px-4 py-3">
            {state.items.length === 0 ? (
              <div className="mx-auto text-center font-mono text-xs text-muted-foreground">
                [ empty queue ]
              </div>
            ) : (
              state.items.map((item) => (
                <div
                  key={item.index}
                  data-testid={`queue-item-${item.index}`}
                  className={cn(
                    "flex min-w-[74px] flex-col items-center justify-between gap-1 rounded-xl border-2 px-3 py-2 font-mono transition-all",
                    item.status === "enqueued"
                      ? "border-accent-emerald bg-accent-emerald/15 shadow-sm"
                      : item.isFront
                      ? "border-primary bg-primary/12 shadow-sm"
                      : "border-border bg-surface-1"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {item.isFront && (
                      <Badge variant="indigo" className="px-1 py-0 text-[9px]">
                        FRONT
                      </Badge>
                    )}
                    {item.isRear && (
                      <Badge variant="emerald" className="px-1 py-0 text-[9px]">
                        REAR
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {item.display}
                  </span>
                  <span className="text-[10px] text-subtle-foreground">
                    [{item.index}]
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Enqueue Entry Indicator */}
          <div className="flex flex-col items-center font-mono text-[10px] text-accent-emerald">
            <span className="font-bold">REAR</span>
            <ArrowLeft className="h-4 w-4" />
            <span className="text-muted-foreground">append()</span>
          </div>
        </div>
      </div>
    </div>
  );
}

