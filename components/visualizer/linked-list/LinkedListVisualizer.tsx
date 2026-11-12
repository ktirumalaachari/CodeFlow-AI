"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { ArrowRight, GitBranch, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  LinkedListVisualNode,
  LinkedListVisualizationState,
} from "@/types/visualizer";
import { cn } from "@/lib/utils";

type LinkedListNodeData = Record<string, unknown> & {
  visualNode: LinkedListVisualNode;
  variant: LinkedListVisualizationState["variant"];
};

function LinkedListFlowNode({ data }: NodeProps<Node<LinkedListNodeData>>) {
  const { visualNode, variant } = data;

  return (
    <div
      data-testid={`ll-node-${visualNode.objectId}`}
      className={cn(
        "relative min-w-[144px] rounded-xl border-2 bg-surface-1 font-mono shadow-sm transition-all",
        visualNode.status === "inserted" &&
          "border-accent-emerald bg-accent-emerald/12",
        visualNode.status === "modified" &&
          "border-accent-amber bg-accent-amber/12",
        visualNode.status === "active" && "border-primary bg-primary/12",
        visualNode.status === "default" && "border-border"
      )}
    >
      {/* Pointer Variable Labels Above Node */}
      {visualNode.pointers.length > 0 && (
        <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap">
          {visualNode.pointers.map((ptr) => (
            <span
              key={ptr}
              className="rounded border border-primary/45 bg-primary/15 px-1.5 py-0 text-[10px] font-bold text-primary shadow-sm"
            >
              {ptr}
            </span>
          ))}
        </div>
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-surface-2/80 px-2.5 py-1 text-[10px]">
        <span className="font-semibold text-muted-foreground">
          {visualNode.className}
        </span>
        <span className="text-accent-violet">{visualNode.objectId}</span>
      </div>

      {/* Value + Next/Prev Slots */}
      <div className="flex items-stretch divide-x divide-border-subtle">
        {variant === "doubly" && (
          <div className="flex flex-col items-center justify-center px-2 py-2 text-[9.5px] text-muted-foreground">
            <span className="uppercase">prev</span>
            <span className="font-semibold text-foreground">
              {visualNode.prevId ?? "None"}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center px-3 py-2">
          <span className="text-[9.5px] uppercase text-subtle-foreground">
            val
          </span>
          <span className="text-sm font-bold text-foreground">
            {visualNode.valueDisplay}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-2 py-2 text-[9.5px] text-muted-foreground">
          <span className="uppercase">next</span>
          <span className="font-semibold text-foreground">
            {visualNode.nextId ?? "None"}
          </span>
        </div>
      </div>

      {/* Head / Tail / Cycle Badges */}
      {(visualNode.isHead || visualNode.isTail || visualNode.isCycleTarget) && (
        <div className="flex items-center justify-center gap-1 border-t border-border-subtle px-2 py-1">
          {visualNode.isHead && (
            <Badge variant="indigo" className="px-1 py-0 text-[9px]">
              HEAD
            </Badge>
          )}
          {visualNode.isTail && (
            <Badge variant="emerald" className="px-1 py-0 text-[9px]">
              TAIL
            </Badge>
          )}
          {visualNode.isCycleTarget && (
            <Badge variant="amber" className="px-1 py-0 text-[9px]">
              CYCLE TARGET
            </Badge>
          )}
        </div>
      )}

      {/* Handles for Next (L->R) & Prev (Top/Bottom return) */}
      <Handle
        id="in-left"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-surface-1 !bg-primary"
      />
      <Handle
        id="out-right"
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-surface-1 !bg-accent-emerald"
      />
      <Handle
        id="out-bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-surface-1 !bg-accent-amber"
      />
      <Handle
        id="in-bottom"
        type="target"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-surface-1 !bg-accent-amber"
      />
    </div>
  );
}

const NODE_TYPES = {
  linkedListNode: LinkedListFlowNode,
};

function LinkedListFlowInner({
  state,
}: {
  state: LinkedListVisualizationState;
}) {
  const { resolvedTheme } = useTheme();
  const { fitView } = useReactFlow();
  const isDark = resolvedTheme === "dark";

  const nodes: Node<LinkedListNodeData>[] = React.useMemo(
    () =>
      state.nodes.map((n) => ({
        id: n.id,
        type: "linkedListNode",
        position: { x: n.x, y: n.y },
        draggable: true,
        data: {
          visualNode: n,
          variant: state.variant,
        },
      })),
    [state.nodes, state.variant]
  );

  const edges: Edge[] = React.useMemo(
    () =>
      state.edges.map((e) => {
        const isCircular = e.kind === "circular";
        const isPrev = e.kind === "prev";
        const strokeColor = e.isUpdated
          ? "#f59e0b"
          : isCircular
          ? "#a855f7"
          : isPrev
          ? "#64748b"
          : "#10b981";

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: isCircular || isPrev ? "out-bottom" : "out-right",
          targetHandle: isCircular || isPrev ? "in-bottom" : "in-left",
          type: isCircular || isPrev ? "smoothstep" : "default",
          label: e.label,
          animated: Boolean(e.isUpdated),
          style: {
            stroke: strokeColor,
            strokeWidth: isCircular || e.isUpdated ? 2.4 : 1.9,
            strokeDasharray: isPrev ? "5 4" : undefined,
          },
          labelStyle: {
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            fill: isDark ? "#cbd5e1" : "#334155",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 16,
            height: 16,
          },
        };
      }),
    [state.edges, isDark]
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.28, duration: 160 });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [fitView, state.nodes.length, state.edges.length, state.variant]);

  return (
    <div className="h-full w-full min-h-[300px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode={isDark ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.28 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        minZoom={0.35}
        maxZoom={1.7}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={isDark ? "#262b3d" : "#cbd5e1"}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

interface LinkedListVisualizerProps {
  state: LinkedListVisualizationState;
}

export function LinkedListVisualizer({ state }: LinkedListVisualizerProps) {
  return (
    <div
      className="flex h-full flex-col gap-3 p-4"
      data-testid={`visualizer-linked-list-${state.variableName}`}
    >
      {/* Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <GitBranch className="h-2.5 w-2.5" />
            {state.variant === "doubly"
              ? "Doubly Linked List"
              : state.variant === "circular"
              ? "Circular Linked List"
              : "Singly Linked List"}
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            nodes={state.nodes.length}
          </Badge>
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          Chain:{" "}
          {state.nodes.map((n) => n.valueDisplay).join(" → ") +
            (state.variant === "circular" ? " ↺" : " → None")}
        </span>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground"
          data-testid="linked-list-operation-banner"
        >
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* React Flow Canvas */}
      <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border border-border bg-surface-code/50">
        {state.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Linked List is empty (None)
          </div>
        ) : (
          <ReactFlowProvider>
            <LinkedListFlowInner state={state} />
          </ReactFlowProvider>
        )}
      </div>

      {/* Unlinked / Removed Nodes */}
      {state.removedNodes.length > 0 && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-3 py-1.5 font-mono text-xs text-accent-rose">
          <MinusCircle className="h-3.5 w-3.5" />
          <span>
            Unlinked:{" "}
            {state.removedNodes
              .map((r) => `${r.valueDisplay} (${r.objectId})`)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

