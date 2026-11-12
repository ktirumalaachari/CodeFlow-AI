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
import { ArrowRight, Binary, GitFork } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TreeVisualNode, TreeVisualizationState } from "@/types/visualizer";
import { cn } from "@/lib/utils";

type TreeFlowNodeData = Record<string, unknown> & {
  treeNode: TreeVisualNode;
};

function TreeFlowNode({ data }: NodeProps<Node<TreeFlowNodeData>>) {
  const { treeNode } = data;

  return (
    <div
      data-testid={`tree-node-${treeNode.objectId}`}
      className={cn(
        "relative flex min-w-[76px] flex-col items-center justify-center rounded-full border-2 px-3 py-2 font-mono shadow-sm transition-all",
        treeNode.status === "active" &&
          "border-primary bg-primary/18 ring-2 ring-primary/30",
        treeNode.status === "inserted" &&
          "border-accent-emerald bg-accent-emerald/18",
        treeNode.status === "visited" &&
          "border-accent-violet bg-accent-violet/15",
        treeNode.status === "search-path" &&
          "border-accent-amber bg-accent-amber/15",
        treeNode.status === "default" && "border-border bg-surface-1"
      )}
    >
      {/* Pointer Variable Chips */}
      {treeNode.pointers.length > 0 && (
        <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap">
          {treeNode.pointers.map((ptr) => (
            <span
              key={ptr}
              className="rounded border border-primary/45 bg-primary/15 px-1.5 py-0 text-[9.5px] font-bold text-primary"
            >
              {ptr}
            </span>
          ))}
        </div>
      )}

      {/* Traversal Order Badge */}
      {treeNode.traversalOrderIndex && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-violet text-[10px] font-bold text-white shadow">
          {treeNode.traversalOrderIndex}
        </span>
      )}

      <span className="text-sm font-bold text-foreground">
        {treeNode.valueDisplay}
      </span>
      <span className="text-[9px] text-subtle-foreground">
        {treeNode.objectId}
      </span>

      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-surface-1 !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-surface-1 !bg-accent-emerald"
      />
    </div>
  );
}

const NODE_TYPES = {
  treeNode: TreeFlowNode,
};

function TreeFlowInner({ state }: { state: TreeVisualizationState }) {
  const { resolvedTheme } = useTheme();
  const { fitView } = useReactFlow();
  const isDark = resolvedTheme === "dark";

  const nodes: Node<TreeFlowNodeData>[] = React.useMemo(
    () =>
      state.nodes.map((n) => ({
        id: n.id,
        type: "treeNode",
        position: { x: n.x, y: n.y },
        draggable: true,
        data: { treeNode: n },
      })),
    [state.nodes]
  );

  const edges: Edge[] = React.useMemo(
    () =>
      state.edges.map((e) => {
        const strokeColor = e.isHighlighted
          ? "#f59e0b"
          : e.branch === "left"
          ? "#6366f1"
          : "#10b981";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.branch === "left" ? "L" : "R",
          animated: e.isHighlighted,
          style: {
            stroke: strokeColor,
            strokeWidth: e.isHighlighted ? 2.5 : 1.8,
          },
          labelStyle: {
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            fill: strokeColor,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 14,
            height: 14,
          },
        };
      }),
    [state.edges]
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.25, duration: 160 });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [fitView, state.nodes.length, state.edges.length]);

  return (
    <div className="h-full w-full min-h-[320px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode={isDark ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        minZoom={0.3}
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

interface TreeVisualizerProps {
  state: TreeVisualizationState;
}

export function TreeVisualizer({ state }: TreeVisualizerProps) {
  return (
    <div
      className="flex h-full flex-col gap-3 p-4"
      data-testid={`visualizer-tree-${state.variableName}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <Binary className="h-2.5 w-2.5" />
            {state.isBinarySearchTree ? "Binary Search Tree" : "Binary Tree"}
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            nodes={state.nodes.length}
          </Badge>
        </div>

        {/* Recorded Traversal Sequence */}
        {state.traversalSequence.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]"
            data-testid="tree-traversal-sequence"
          >
            <GitFork className="h-3 w-3 text-accent-violet" />
            <span className="text-muted-foreground">
              {state.traversalTypeLabel}:
            </span>
            <span className="font-semibold text-foreground">
              [{state.traversalSequence.join(", ")}]
            </span>
          </div>
        )}
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground"
          data-testid="tree-operation-banner"
        >
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* D3 Hierarchy + React Flow Tree Canvas */}
      <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-xl border border-border bg-surface-code/50">
        {state.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Empty tree (root = None)
          </div>
        ) : (
          <ReactFlowProvider>
            <TreeFlowInner state={state} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}

