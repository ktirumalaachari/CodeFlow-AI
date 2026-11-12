"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Box,
  ChevronDown,
  ChevronRight,
  GitCommitHorizontal,
  Layers,
  LayoutGrid,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Table as TableIcon,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { useProjectStore } from "@/store/use-project-store";
import type {
  DeletedVariableItem,
  StructuredValueNode,
  VariableSnapshotItem,
} from "@/types/api";
import { cn } from "@/lib/utils";

const POINTER_NAMES = new Set([
  "l",
  "r",
  "i",
  "j",
  "k",
  "left",
  "right",
  "low",
  "high",
  "mid",
  "start",
  "end",
  "curr",
  "prev",
  "next",
  "fast",
  "slow",
  "ptr",
  "p1",
  "p2",
]);

function isPointerVariable(item: VariableSnapshotItem): boolean {
  if (item.var_type !== "int") return false;
  const lower = item.name.toLowerCase();
  return (
    POINTER_NAMES.has(lower) ||
    lower.endsWith("_ptr") ||
    lower.endsWith("_idx") ||
    lower.startsWith("ptr_")
  );
}

function isExpandableNode(node: StructuredValueNode): boolean {
  if (node.circular) return false;
  if (node.items && node.items.length > 0) return true;
  if (node.entries && node.entries.length > 0) return true;
  if (node.attributes && node.attributes.length > 0) return true;
  return false;
}

function StructuredValueTree({
  node,
  depth = 0,
}: {
  node: StructuredValueNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = React.useState(depth === 0);
  const canExpand = isExpandableNode(node);

  if (!canExpand) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 font-mono text-[11.5px]">
        <span
          className={cn(
            "break-all",
            node.type_name === "str"
              ? "text-accent-emerald"
              : node.type_name === "int" || node.type_name === "float"
              ? "text-accent-amber"
              : node.type_name === "bool" || node.type_name === "NoneType"
              ? "text-accent-violet"
              : "text-foreground"
          )}
        >
          {node.display}
        </span>
        {node.circular && (
          <Badge variant="amber" className="px-1 py-0 text-[9px]">
            circular {node.object_id ?? ""}
          </Badge>
        )}
      </span>
    );
  }

  return (
    <div className="space-y-1 font-mono text-[11.5px]">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-left text-foreground transition-colors hover:bg-surface-3"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="text-[11px] text-muted-foreground">
          {node.type_name}
          {typeof node.length === "number" ? `(${node.length})` : ""}
        </span>
        {!expanded && (
          <span className="max-w-[200px] truncate text-foreground">
            {node.display}
          </span>
        )}
      </button>

      {expanded && (
        <div className="ml-2.5 space-y-1 border-l border-border pl-2.5">
          {/* Sequence / Set items */}
          {node.items?.map((child, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="shrink-0 select-none text-[10.5px] text-subtle-foreground">
                {node.kind === "set" ? `•` : `[${idx}]`}
              </span>
              <div className="min-w-0 flex-1">
                <StructuredValueTree node={child} depth={depth + 1} />
              </div>
            </div>
          ))}

          {/* Dict entries */}
          {node.entries?.map((entry, idx) => (
            <div key={`${entry.key}-${idx}`} className="flex items-start gap-1.5">
              <span className="shrink-0 text-[11px] text-primary">
                {entry.key}:
              </span>
              <div className="min-w-0 flex-1">
                <StructuredValueTree node={entry.value} depth={depth + 1} />
              </div>
            </div>
          ))}

          {/* Object attributes */}
          {node.attributes?.map((attr, idx) => (
            <div key={`${attr.key}-${idx}`} className="flex items-start gap-1.5">
              <span className="shrink-0 text-[11px] text-accent-violet">
                .{attr.key} =
              </span>
              <div className="min-w-0 flex-1">
                <StructuredValueTree node={attr.value} depth={depth + 1} />
              </div>
            </div>
          ))}

          {node.truncated && (
            <span className="block text-[10px] italic text-subtle-foreground">
              … additional items truncated for snapshot safety
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function buildVariableChangeNote(
  item: VariableSnapshotItem,
  sourceLine: string
): string | null {
  const cleanStmt = sourceLine.trim();
  if (item.change === "created") {
    return cleanStmt
      ? `${item.name} was initialized to ${item.repr_value} when "${cleanStmt}" executed.`
      : `${item.name} was initialized to ${item.repr_value}.`;
  }
  if (item.change === "modified") {
    const prev = item.previous_repr ?? "previous value";
    return cleanStmt
      ? `${item.name} changed from ${prev} to ${item.repr_value} because the statement "${cleanStmt}" executed.`
      : `${item.name} changed from ${prev} to ${item.repr_value}.`;
  }
  return null;
}

/**
 * Visual Variable Card — animated, rich, intuitive learning presentation
 */
function VariableCard({
  item,
  sourceLine,
  highlightMutations,
  sharedRefIds,
  allVariables,
}: {
  item: VariableSnapshotItem;
  sourceLine: string;
  highlightMutations: boolean;
  sharedRefIds: Set<string>;
  allVariables: VariableSnapshotItem[];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const expandable = isExpandableNode(item.structured);

  const isCreated = highlightMutations && item.change === "created";
  const isModified = highlightMutations && item.change === "modified";
  const objId = item.structured.object_id ?? null;
  const isSharedAlias = objId !== null && sharedRefIds.has(objId);
  const isPointer = isPointerVariable(item);

  const changeNote = buildVariableChangeNote(item, sourceLine);

  // Find pointers pointing to indices if this item is a list
  const pointingPointers = React.useMemo(() => {
    if (item.var_type !== "list") return [];
    return allVariables
      .filter((v) => isPointerVariable(v))
      .map((v) => ({
        name: v.name,
        index: Number.parseInt(v.repr_value, 10),
      }))
      .filter((p) => !Number.isNaN(p.index));
  }, [item.var_type, allVariables]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      data-testid={`var-row-${item.scope}-${item.name}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border p-3 transition-all shadow-sm",
        isModified
          ? "border-accent-amber/50 bg-gradient-to-r from-accent-amber/[0.12] via-accent-amber/[0.05] to-transparent ring-1 ring-accent-amber/40 shadow-glow-amber"
          : isCreated
          ? "border-accent-emerald/50 bg-gradient-to-r from-accent-emerald/[0.12] via-accent-emerald/[0.05] to-transparent ring-1 ring-accent-emerald/40"
          : "border-border/80 bg-surface-2/40 hover:border-border hover:bg-surface-2/70"
      )}
    >
      {/* Top Row: Variable Identity & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {expandable && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-label={
                expanded ? `Collapse ${item.name}` : `Expand ${item.name}`
              }
              data-testid={`var-expand-${item.name}`}
              className="rounded p-0.5 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            {item.name}
          </span>

          {/* Type Badge */}
          <Badge
            variant={
              item.var_type === "int" || item.var_type === "float"
                ? "amber"
                : item.var_type === "str"
                ? "emerald"
                : item.var_type === "list"
                ? "indigo"
                : item.var_type === "bool"
                ? "violet"
                : "secondary"
            }
            className="px-1.5 py-0 text-[10px] font-mono"
          >
            {item.var_type === "list" && typeof item.structured.length === "number"
              ? `list [${item.structured.length}]`
              : item.var_type}
          </Badge>

          {/* Pointer Badge */}
          {isPointer && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0 font-mono text-[10px] font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              Pointer
            </span>
          )}
        </div>

        {/* Change Indicator Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.change === "created" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-emerald/20 px-2 py-0.5 font-mono text-[10px] font-bold text-accent-emerald">
              <PlusCircle className="h-3 w-3" />
              new
            </span>
          )}

          {item.change === "modified" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-amber/20 px-2 py-0.5 font-mono text-[10px] font-bold text-accent-amber">
              <Zap className="h-3 w-3" />
              {item.previous_repr ? `was ${item.previous_repr}` : "updated"}
            </span>
          )}

          {isSharedAlias && (
            <span className="rounded-full border border-accent-violet/40 bg-accent-violet/15 px-2 py-0 font-mono text-[10px] text-accent-violet">
              shared alias
            </span>
          )}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="pt-0.5">
        {item.var_type === "list" &&
        item.structured.items &&
        item.structured.items.length > 0 &&
        item.structured.items.length <= 16 ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-end gap-1.5 overflow-x-auto py-1">
              {item.structured.items.map((child, idx) => {
                const pointersHere = pointingPointers.filter(
                  (p) => p.index === idx
                );
                const hasPointer = pointersHere.length > 0;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    {/* Tiny Pointer Indicator */}
                    {hasPointer ? (
                      <span className="mb-0.5 rounded bg-primary/20 px-1 py-0 font-mono text-[9px] font-bold text-primary">
                        {pointersHere.map((p) => p.name).join(",")}
                      </span>
                    ) : (
                      <span className="mb-0.5 h-3.5" />
                    )}

                    <div
                      className={cn(
                        "flex min-w-[32px] items-center justify-center rounded-lg border px-2 py-1 font-mono text-xs font-bold transition-all",
                        hasPointer
                          ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary/40 shadow-sm"
                          : "border-border-subtle bg-surface-1 text-foreground"
                      )}
                    >
                      {child.display}
                    </div>
                    <span className="mt-0.5 font-mono text-[9px] text-subtle-foreground">
                      [{idx}]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="font-mono text-sm">
            {expandable ? (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary transition-colors"
                title="Click to expand"
              >
                {item.repr_value}
              </button>
            ) : (
              <span
                className={cn(
                  "font-bold",
                  item.var_type === "str"
                    ? "text-accent-emerald"
                    : item.var_type === "int" || item.var_type === "float"
                    ? "text-accent-amber text-base"
                    : item.var_type === "bool" || item.var_type === "NoneType"
                    ? "text-accent-violet"
                    : "text-foreground"
                )}
              >
                {item.repr_value}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Understandable Change Explanation */}
      {changeNote && (
        <div className="flex items-start gap-1.5 rounded-lg border border-border-subtle bg-surface-1/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <span>{changeNote}</span>
        </div>
      )}

      {/* Expanded Nested Structure */}
      {expandable && expanded && (
        <div
          className="rounded-lg border border-border-subtle bg-surface-code/85 p-2.5"
          data-testid={`var-tree-${item.name}`}
        >
          <StructuredValueTree node={item.structured} depth={0} />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Compact Table Row — for dense table view
 */
function VariableRow({
  item,
  sourceLine,
  highlightMutations,
  sharedRefIds,
}: {
  item: VariableSnapshotItem;
  sourceLine: string;
  highlightMutations: boolean;
  sharedRefIds: Set<string>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const expandable = isExpandableNode(item.structured);

  const isCreated = highlightMutations && item.change === "created";
  const isModified = highlightMutations && item.change === "modified";
  const objId = item.structured.object_id ?? null;
  const isSharedAlias = objId !== null && sharedRefIds.has(objId);

  const changeNote = buildVariableChangeNote(item, sourceLine);

  return (
    <div
      data-testid={`var-row-${item.scope}-${item.name}`}
      className={cn(
        "border-b border-border-subtle last:border-b-0 transition-colors",
        isCreated && "bg-accent-emerald/[0.08]",
        isModified && "bg-accent-amber/[0.09]"
      )}
    >
      {/* Main Row matching Variable | Type | Current Value */}
      <div className="grid grid-cols-[minmax(88px,1.1fr)_minmax(58px,0.7fr)_minmax(110px,1.8fr)] items-start gap-2 px-3 py-2 text-xs">
        {/* Column 1: Variable Name & Change Badge */}
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1">
            {expandable && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={
                  expanded ? `Collapse ${item.name}` : `Expand ${item.name}`
                }
                data-testid={`var-expand-${item.name}`}
                className="rounded p-0.5 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            <span className="truncate font-mono font-semibold text-foreground">
              {item.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {item.change === "created" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-accent-emerald/15 px-1 py-0 font-mono text-[9.5px] font-medium text-accent-emerald">
                <PlusCircle className="h-2.5 w-2.5" />
                new
              </span>
            )}
            {item.change === "modified" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-accent-amber/15 px-1 py-0 font-mono text-[9.5px] font-medium text-accent-amber">
                <RefreshCw className="h-2.5 w-2.5" />
                updated
              </span>
            )}
            {objId && (
              <span
                className={cn(
                  "rounded px-1 py-0 font-mono text-[9.5px]",
                  isSharedAlias
                    ? "border border-accent-violet/35 bg-accent-violet/12 text-accent-violet"
                    : "bg-surface-2 text-subtle-foreground"
                )}
                title={
                  isSharedAlias
                    ? `Shared object reference (${objId}) — multiple variables point to this object`
                    : `Heap object identity ${objId}`
                }
              >
                {objId}
                {isSharedAlias ? " · alias" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Data Type */}
        <div className="pt-0.5">
          <Badge variant="mono" className="px-1.5 py-0 text-[10.5px]">
            {item.var_type}
          </Badge>
        </div>

        {/* Column 3: Current Value */}
        <div className="min-w-0 space-y-0.5 pt-0.5 font-mono text-[11.5px]">
          {expandable ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="block max-w-full truncate text-left text-foreground hover:text-primary"
              title="Click to expand nested structure"
            >
              {item.repr_value}
            </button>
          ) : (
            <span
              className={cn(
                "block break-all",
                item.var_type === "str"
                  ? "text-accent-emerald"
                  : item.var_type === "int" || item.var_type === "float"
                  ? "text-accent-amber"
                  : item.var_type === "bool" || item.var_type === "NoneType"
                  ? "text-accent-violet"
                  : "text-foreground"
              )}
            >
              {item.repr_value}
            </span>
          )}

          {item.change === "modified" &&
            item.previous_repr !== null &&
            item.previous_repr !== undefined && (
              <span className="block truncate text-[10.5px] text-muted-foreground">
                was {item.previous_repr}
              </span>
            )}
        </div>
      </div>

      {/* Understandable Change Explanation Banner */}
      {changeNote && (
        <div className="px-3 pb-2 text-[11px] leading-relaxed text-muted-foreground">
          {changeNote}
        </div>
      )}

      {/* Expanded Nested Structure View */}
      {expandable && expanded && (
        <div
          className="border-t border-border-subtle bg-surface-code/75 px-3 py-2"
          data-testid={`var-tree-${item.name}`}
        >
          <StructuredValueTree node={item.structured} depth={0} />
        </div>
      )}
    </div>
  );
}

function ScopeVariableSection({
  title,
  scopeBadge,
  variables,
  sourceLine,
  highlightMutations,
  sharedRefIds,
  viewMode,
}: {
  title: string;
  scopeBadge: string;
  variables: VariableSnapshotItem[];
  sourceLine: string;
  highlightMutations: boolean;
  sharedRefIds: Set<string>;
  viewMode: "cards" | "table";
}) {
  if (viewMode === "table") {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-surface-2/70 px-3 py-1.5">
          <span className="text-[11px] font-semibold text-foreground">
            {title}
          </span>
          <Badge
            variant="secondary"
            className="px-1.5 py-0 font-mono text-[10px]"
          >
            {scopeBadge} · {variables.length}
          </Badge>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[minmax(88px,1.1fr)_minmax(58px,0.7fr)_minmax(110px,1.8fr)] gap-2 border-b border-border-subtle bg-surface-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
          <span>Variable</span>
          <span>Type</span>
          <span>Current Value</span>
        </div>

        <div className="divide-y divide-border-subtle bg-surface-1">
          {variables.map((v) => (
            <VariableRow
              key={`${v.scope}-${v.name}`}
              item={v}
              sourceLine={sourceLine}
              highlightMutations={highlightMutations}
              sharedRefIds={sharedRefIds}
            />
          ))}
        </div>
      </div>
    );
  }

  // Visual Cards View (Default)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
          {title}
        </span>
        <Badge
          variant="secondary"
          className="px-1.5 py-0 font-mono text-[10px]"
        >
          {variables.length} active
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {variables.map((v) => (
          <VariableCard
            key={`${v.scope}-${v.name}`}
            item={v}
            sourceLine={sourceLine}
            highlightMutations={highlightMutations}
            sharedRefIds={sharedRefIds}
            allVariables={variables}
          />
        ))}
      </div>
    </div>
  );
}

function DeletedVariablesCard({ items }: { items: DeletedVariableItem[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className="overflow-hidden rounded-xl border border-accent-rose/25 bg-accent-rose/[0.06]"
      data-testid="deleted-variables-section"
    >
      <div className="flex items-center justify-between border-b border-accent-rose/20 px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent-rose">
          <MinusCircle className="h-3 w-3" />
          Removed in This Step
        </span>
        <span className="font-mono text-[10px] text-accent-rose">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-accent-rose/15 px-3 py-1 text-xs">
        {items.map((d) => (
          <div
            key={`${d.scope}-${d.name}`}
            className="flex flex-wrap items-center justify-between gap-2 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium line-through text-muted-foreground">
                {d.name}
              </span>
              <Badge variant="mono" className="px-1 py-0 text-[10px]">
                {d.previous_type}
              </Badge>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              was {d.previous_repr}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const EMPTY_SNAPSHOT_VARS: VariableSnapshotItem[] = [];
const EMPTY_DELETED_VARS: DeletedVariableItem[] = [];

export function VariableInspector() {
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const highlightMutatedVariables = useProjectStore(
    (s) => s.preferences.highlightMutatedVariables
  );

  const steps = traceResult?.steps ?? [];
  const currentStep =
    steps.length > 0 ? steps[currentStepIndex] ?? steps[0] : null;

  const isModuleFrame =
    !currentStep || currentStep.function_name === "<module>";

  const localVars = currentStep?.locals ?? EMPTY_SNAPSHOT_VARS;
  const globalVars = currentStep?.globals ?? EMPTY_SNAPSHOT_VARS;
  const deletedVars = currentStep?.deleted_variables ?? EMPTY_DELETED_VARS;

  // Detect shared heap object_ids across visible variables
  const sharedRefIds = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of [...localVars, ...globalVars]) {
      const oid = v.structured.object_id;
      if (oid) {
        counts.set(oid, (counts.get(oid) ?? 0) + 1);
      }
    }
    const shared = new Set<string>();
    counts.forEach((count, oid) => {
      if (count > 1) shared.add(oid);
    });
    return shared;
  }, [localVars, globalVars]);

  const createdCount = [...localVars, ...globalVars].filter(
    (v) => v.change === "created"
  ).length;
  const modifiedCount = [...localVars, ...globalVars].filter(
    (v) => v.change === "modified"
  ).length;

  return (
    <section
      aria-label="Variable Inspector"
      data-testid="variable-inspector"
      className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-elevation-1"
    >
      {/* Inspector Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-accent-emerald/25 bg-accent-emerald/12 text-accent-emerald">
            <Box className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-tight text-foreground">
              Variable Inspector
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {createdCount > 0 && (
            <Badge
              variant="emerald"
              className="px-1.5 py-0 font-mono text-[10px]"
            >
              +{createdCount} new
            </Badge>
          )}
          {modifiedCount > 0 && (
            <Badge variant="amber" className="px-1.5 py-0 font-mono text-[10px]">
              ~{modifiedCount} changed
            </Badge>
          )}
          {deletedVars.length > 0 && (
            <Badge variant="rose" className="px-1.5 py-0 font-mono text-[10px]">
              -{deletedVars.length} removed
            </Badge>
          )}
          {currentStep &&
            createdCount === 0 &&
            modifiedCount === 0 &&
            deletedVars.length === 0 && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 font-mono text-[10px]"
              >
                {localVars.length + globalVars.length} tracked
              </Badge>
            )}

          {/* View Mode Toggle: Visual Cards vs Compact Table */}
          <div className="ml-1 flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("cards")}
              className={cn(
                "h-5 gap-1 px-1.5 text-[10.5px]",
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Visual cards view"
            >
              <LayoutGrid className="h-3 w-3" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-5 gap-1 px-1.5 text-[10.5px]",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Compact table view"
            >
              <TableIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Call Stack Strip */}
      {currentStep && currentStep.call_stack.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1 border-b border-border-subtle bg-surface-2/50 px-3.5 py-1.5 text-[11px]"
          data-testid="call-stack-strip"
        >
          <span className="mr-1 inline-flex items-center gap-1 font-medium text-muted-foreground">
            <Layers className="h-3 w-3" />
            Frames:
          </span>
          {currentStep.call_stack.map((frame, idx) => {
            const isActiveFrame = idx === currentStep.call_stack.length - 1;
            const displayName =
              frame.function_name === "<module>"
                ? "Global Scope"
                : `${frame.function_name}()`;

            return (
              <React.Fragment key={frame.frame_id}>
                {idx > 0 && (
                  <GitCommitHorizontal className="h-3 w-3 text-subtle-foreground" />
                )}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10.5px]",
                    isActiveFrame
                      ? "border border-primary/35 bg-primary/12 font-semibold text-primary"
                      : "bg-surface-2 text-muted-foreground"
                  )}
                >
                  {displayName} : L{frame.line}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-3">
        {!currentStep ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/30 p-5 text-center">
            <Box className="h-6 w-6 text-subtle-foreground" />
            <p className="mt-2 text-xs font-medium text-foreground">
              No execution snapshot active
            </p>
            <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
              Run your Python program to inspect live variable values, types,
              mutations, and interactive structures at every step.
            </p>
          </div>
        ) : localVars.length === 0 &&
          globalVars.length === 0 &&
          deletedVars.length === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/30 p-4 text-center">
            <p className="text-xs font-medium text-foreground">
              No user variables defined yet at Step {currentStep.step}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Step forward (<kbd className="font-mono">F10</kbd>) to watch
              variables appear as assignments execute.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Module-level execution: show globalVars */}
            {isModuleFrame && globalVars.length > 0 && (
              <ScopeVariableSection
                key="module-vars"
                title="Global Variables"
                scopeBadge="global"
                variables={globalVars}
                sourceLine={currentStep.source_line}
                highlightMutations={highlightMutatedVariables}
                sharedRefIds={sharedRefIds}
                viewMode={viewMode}
              />
            )}

            {/* Function frame execution: show Local Variables first, then Global Variables */}
            {!isModuleFrame && localVars.length > 0 && (
              <ScopeVariableSection
                key="local-vars"
                title={`Local Variables · ${currentStep.function_name}()`}
                scopeBadge="local"
                variables={localVars}
                sourceLine={currentStep.source_line}
                highlightMutations={highlightMutatedVariables}
                sharedRefIds={sharedRefIds}
                viewMode={viewMode}
              />
            )}

            {!isModuleFrame && globalVars.length > 0 && (
              <ScopeVariableSection
                key="function-global-vars"
                title="Global Variables"
                scopeBadge="global"
                variables={globalVars}
                sourceLine={currentStep.source_line}
                highlightMutations={highlightMutatedVariables}
                sharedRefIds={sharedRefIds}
                viewMode={viewMode}
              />
            )}

            {/* Removed / Out-of-Scope Variables */}
            <DeletedVariablesCard items={deletedVars} />
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
