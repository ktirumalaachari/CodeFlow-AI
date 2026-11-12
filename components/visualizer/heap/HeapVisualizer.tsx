"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { ArrowRight, Boxes, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HeapVisualNode, HeapVisualizationState } from "@/types/visualizer";
import { cn } from "@/lib/utils";

type HeapFlowNodeData = Record<string, unknown> & {
  heapNode: HeapVisualNode;
};

function HeapFlowNode({ data }: NodeProps<Node<HeapFlowNodeData>>) {
  const { heapNode } = data;

  return (
    <div
      data-testid={`heap-node-${heapNode.index}`}
      className={cn(
        "relative flex min-w-[68px] flex-col items-center justify-center rounded-xl border-2 px-2.5 py-2 font-mono shadow-sm transition-all",
        heapNode.status === "swapped" &&
          "border-accent-amber bg-accent-amber/18",
        heapNode.status === "inserted" &&
          "border-accent-emerald bg-accent-emerald/18",
        heapNode.status === "root" &&
          "border-primary bg-primary/15",
        heapNode.status === "default" && "border-border bg-surface-1"
      )}
    >
      <span className="text-[9px] text-subtle-foreground">
        idx [{heapNode.index}]
      </span>
      <span className="text-sm font-bold text-foreground">
        {heapNode.valueDisplay}
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
  heapNode: HeapFlowNode,
};

function HeapFlowInner({ state }: { state: HeapVisualizationState }) {
  const { resolvedTheme } = useTheme();
  const { fitView } = useReactFlow();
  const isDark = resolvedTheme === "dark";

  const nodes: Node<HeapFlowNodeData>[] = React.useMemo(
    () =>
      state.nodes.map((n) => ({
        id: n.id,
        type: "heapNode",
        position: { x: n.x, y: n.y },
        draggable: false,
        data: { heapNode: n },
      })),
    [state.nodes]
  );

  const edges: Edge[] = React.useMemo(() => {
    const out: Edge[] = [];
    for (const node of state.nodes) {
      if (node.leftIndex !== null) {
        out.push({
          id: `heap-edge-${node.index}-${node.leftIndex}`,
          source: node.id,
          target: `heap-node-${node.leftIndex}`,
          style: { stroke: "#6366f1", strokeWidth: 1.8 },
        });
      }
      if (node.rightIndex !== null) {
        out.push({
          id: `heap-edge-${node.index}-${node.rightIndex}`,
          source: node.id,
          target: `heap-node-${node.rightIndex}`,
          style: { stroke: "#10b981", strokeWidth: 1.8 },
        });
      }
    }
    return out;
  }, [state.nodes]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.26, duration: 160 });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [fitView, state.nodes.length]);

  return (
    <div className="h-full w-full min-h-[165px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode={isDark ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        minZoom={0.4}
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

interface HeapVisualizerProps {
  state: HeapVisualizationState;
}

export function HeapVisualizer({ state }: HeapVisualizerProps) {
  return (
    <div
      className="flex h-full flex-col gap-3 p-4"
      data-testid={`visualizer-heap-${state.variableName}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            {state.variableName}
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <Boxes className="h-2.5 w-2.5" />
            {state.variant === "max" ? "Max Heap" : "Min Heap"}
          </Badge>
          <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
            size={state.nodes.length}
          </Badge>
        </div>

        <Badge
          variant={state.heapPropertySatisfied ? "emerald" : "amber"}
          className="gap-1 px-1.5 py-0 text-[10px]"
        >
          {state.heapPropertySatisfied ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span>Heap invariant valid</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              <span>Rebalancing</span>
            </>
          )}
        </Badge>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground"
          data-testid="heap-operation-banner"
        >
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* Dual View 1: Binary Tree Representation */}
      <div className="relative min-h-[165px] flex-1 overflow-hidden rounded-xl border border-border bg-surface-code/50">
        {state.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Empty heap ({state.variableName} = [])
          </div>
        ) : (
          <ReactFlowProvider>
            <HeapFlowInner state={state} />
          </ReactFlowProvider>
        )}
      </div>

      {/* Dual View 2: Underlying 0-Indexed Array */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
        <div className="mb-2 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
          <span>Underlying Python List Representation</span>
          <span className="font-mono normal-case">
            parent = (i - 1) // 2 · children = 2i + 1, 2i + 2
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.arrayCells.map((cell) => (
            <div
              key={cell.index}
              className={cn(
                "flex min-w-[54px] flex-col items-center rounded-lg border px-2.5 py-1.5 font-mono",
                cell.index === 0
                  ? "border-primary/60 bg-primary/12"
                  : cell.status === "inserted"
                  ? "border-accent-emerald bg-accent-emerald/12"
                  : cell.status === "swapped"
                  ? "border-accent-amber bg-accent-amber/12"
                  : "border-border bg-surface-1"
              )}
            >
              <span className="text-xs font-bold text-foreground">
                {cell.display}
              </span>
              <span className="text-[9.5px] text-subtle-foreground">
                [{cell.index}]
              </span>
            </div>
          ))}
        </div>

        {state.extractedValue && (
          <p className="mt-2 font-mono text-[11px] text-accent-rose">
            Last extracted root: {state.extractedValue}
          </p>
        )}
      </div>
    </div>
  );
}

