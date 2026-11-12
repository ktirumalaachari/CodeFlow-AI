"use client";

import * as React from "react";
import { ArrowRight, Hash, MinusCircle, PlusCircle, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HashMapVisualizationState } from "@/types/visualizer";
import { cn } from "@/lib/utils";

interface HashMapVisualizerProps {
  state: HashMapVisualizationState;
}

export function HashMapVisualizer({ state }: HashMapVisualizerProps) {
  return (
    <div
      className="flex h-full flex-col justify-between gap-3 p-4"
      data-testid={`visualizer-hashmap-${state.variableName}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <Hash className="h-2.5 w-2.5" />
            Hash Map ({state.typeName})
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            keys={state.entries.length}
          </Badge>
          {state.objectId && (
            <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
              {state.objectId}
            </Badge>
          )}
        </div>

        <span className="text-[10.5px] text-muted-foreground">
          Logical key-value associations (insertion order)
        </span>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground"
          data-testid="hashmap-operation-banner"
        >
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* Key-Value Table */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-surface-1">
        {state.entries.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center p-6 text-center">
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              {state.variableName} = {"{}"}
            </span>
            <span className="mt-1 text-xs text-subtle-foreground">
              Empty Python dictionary (0 keys)
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            <div className="grid grid-cols-[minmax(100px,1fr)_32px_minmax(120px,1.5fr)_90px] items-center gap-2 bg-surface-2/70 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
              <span>Key</span>
              <span />
              <span>Value</span>
              <span className="text-right">Status</span>
            </div>

            {state.entries.map((entry) => (
              <div
                key={entry.key}
                data-testid={`hashmap-entry-${entry.key}`}
                className={cn(
                  "grid grid-cols-[minmax(100px,1fr)_32px_minmax(120px,1.5fr)_90px] items-center gap-2 px-3.5 py-2.5 font-mono text-xs transition-colors",
                  entry.status === "inserted" && "bg-accent-emerald/[0.09]",
                  entry.status === "updated" && "bg-accent-amber/[0.1]",
                  entry.status === "lookup" && "bg-primary/[0.09]"
                )}
              >
                <div className="min-w-0 truncate font-semibold text-primary">
                  {entry.key}
                </div>

                <div className="flex justify-center text-subtle-foreground">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="truncate font-bold text-foreground">
                    {entry.valueDisplay}
                  </div>
                  {entry.previousValueDisplay && (
                    <div className="truncate text-[10px] text-muted-foreground line-through">
                      was {entry.previousValueDisplay}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  {entry.status === "inserted" ? (
                    <Badge variant="emerald" className="gap-1 px-1.5 py-0 text-[9.5px]">
                      <PlusCircle className="h-2.5 w-2.5" />
                      inserted
                    </Badge>
                  ) : entry.status === "updated" ? (
                    <Badge variant="amber" className="gap-1 px-1.5 py-0 text-[9.5px]">
                      <RefreshCw className="h-2.5 w-2.5" />
                      updated
                    </Badge>
                  ) : entry.status === "lookup" ? (
                    <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[9.5px]">
                      <Search className="h-2.5 w-2.5" />
                      lookup
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-subtle-foreground">
                      {entry.valueType}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Removed Entries Banner */}
      {state.deletedEntries.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-3 py-1.5 font-mono text-xs text-accent-rose"
          data-testid="hashmap-deleted-entries"
        >
          <MinusCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Deleted:{" "}
            {state.deletedEntries
              .map((d) => `${d.key} (was ${d.previousValueDisplay})`)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

