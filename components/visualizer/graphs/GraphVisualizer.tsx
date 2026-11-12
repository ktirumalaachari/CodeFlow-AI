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
import { ArrowRight, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GraphVisualNode, GraphVisualizationState } from "@/types/visualizer";
import { cn } from "@/lib/utils";

type GraphFlowNodeData = Record<string, unknown> & {
  graphNode: GraphVisualNode;
};

function GraphFlowNode({ data }: NodeProps<Node<GraphFlowNodeData>>) {
  const { graphNode } = data;

  return (
    <div
      data-testid={`graph-node-${graphNode.id}`}
      className={cn(
        "relative flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 font-mono shadow-sm transition-all",
        graphNode.isCurrent
          ? "border-primary bg-primary/20 ring-4 ring-primary/25"
          : graphNode.isVisited
          ? "border-accent-emerald bg-accent-emerald/15"
          : graphNode.inFrontier
          ? "border-accent-amber bg-accent-amber/15"
          : "border-border bg-surface-1"
      )}
    >
      {graphNode.visitOrder && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-emerald text-[10px] font-bold text-white shadow">
          {graphNode.visitOrder}
        </span>
      )}
      {graphNode.isCurrent && (
        <span className="absolute -top-5 rounded bg-primary px-1.5 py-0 text-[9px] font-bold uppercase text-primary-foreground">
          curr
        </span>
      )}

      <span className="text-sm font-bold text-foreground">
        {graphNode.label}
      </span>

      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !opacity-0"
      />
    </div>
  );
}

const NODE_TYPES = {
  graphNode: GraphFlowNode,
};

function GraphFlowInner({ state }: { state: GraphVisualizationState }) {
  const { resolvedTheme } = useTheme();
  const { fitView } = useReactFlow();
  const isDark = resolvedTheme === "dark";

  const nodes: Node<GraphFlowNodeData>[] = React.useMemo(
    () =>
      state.nodes.map((n) => ({
        id: n.id,
        type: "graphNode",
        position: { x: n.x, y: n.y },
        draggable: true,
        data: { graphNode: n },
      })),
    [state.nodes]
  );

  const edges: Edge[] = React.useMemo(
    () =>
      state.edges.map((e) => {
        const strokeColor = e.isActiveEdge
          ? "#f59e0b"
          : e.isTraversed
          ? "#10b981"
          : isDark
          ? "#64748b"
          : "#94a3b8";

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "default",
          label: e.weight ?? undefined,
          animated: e.isActiveEdge,
          style: {
            stroke: strokeColor,
            strokeWidth: e.isActiveEdge ? 2.8 : e.isTraversed ? 2.2 : 1.7,
          },
          labelStyle: {
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            fill: isDark ? "#f8fafc" : "#0f172a",
          },
          labelBgStyle: {
            fill: isDark ? "#1e293b" : "#f8fafc",
            fillOpacity: 0.9,
          },
          markerEnd: e.isDirected
            ? {
                type: MarkerType.ArrowClosed,
                color: strokeColor,
                width: 16,
                height: 16,
              }
            : undefined,
        };
      }),
    [state.edges, isDark]
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.25, duration: 160 });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [fitView, state.nodes.length, state.edges.length]);

  return (
    <div className="h-full w-full min-h-[210px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode={isDark ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        minZoom={0.35}
        maxZoom={1.8}
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

interface GraphVisualizerProps {
  state: GraphVisualizationState;
}

export function GraphVisualizer({ state }: GraphVisualizerProps) {
  return (
    <div
      className="flex h-full flex-col gap-3 p-4"
      data-testid={`visualizer-graph-${state.variableName}`}
    >
      {/* Header Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <Network className="h-2.5 w-2.5" />
            {state.isDirected ? "Directed Graph" : "Undirected Graph"}
            {state.isWeighted ? " · Weighted" : ""}
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            V={state.nodes.length} · E={state.edges.length}
          </Badge>
        </div>

        <Badge variant="emerald" className="px-1.5 py-0 text-[10px]">
          {state.algorithmMode === "bfs"
            ? "BFS Mode"
            : state.algorithmMode === "dfs"
            ? "DFS Mode"
            : "Adjacency List"}
        </Badge>
      </div>

      {/* Synchronized Traversal Strip (Visited Order + Frontier Queue/Stack) */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5 font-mono text-xs"
          data-testid="graph-visited-order"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Visited ({state.visitedOrder.length}/{state.nodes.length}):
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {state.visitedOrder.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">None yet</span>
            ) : (
              state.visitedOrder.map((v, idx) => (
                <React.Fragment key={v}>
                  {idx > 0 && (
                    <ArrowRight className="my-auto h-3 w-3 text-subtle-foreground" />
                  )}
                  <span className="rounded bg-accent-emerald/15 px-1.5 py-0 text-[11px] font-bold text-accent-emerald">
                    {v}
                  </span>
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5 font-mono text-xs"
          data-testid="graph-frontier-strip"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            {state.frontierLabel}:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {state.frontierItems.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">Empty</span>
            ) : (
              state.frontierItems.map((item, idx) => (
                <span
                  key={`${item}-${idx}`}
                  className="rounded border border-accent-amber/35 bg-accent-amber/12 px-1.5 py-0 text-[11px] font-semibold text-accent-amber"
                >
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-xs text-foreground">
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* React Flow Graph Canvas */}
      <div className="relative min-h-[210px] flex-1 overflow-hidden rounded-xl border border-border bg-surface-code/50">
        {state.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Empty graph ({state.variableName} = {"{}"})
          </div>
        ) : (
          <ReactFlowProvider>
            <GraphFlowInner state={state} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}

