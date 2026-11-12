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
import {
  ArrowRight,
  CornerDownLeft,
  Cpu,
  GitBranch,
  Layers,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  RecursionMemoryVisualizationState,
  RecursionTreeNode,
} from "@/types/visualizer";
import { cn } from "@/lib/utils";

type RecCallNodeData = Record<string, unknown> & {
  callNode: RecursionTreeNode;
};

function RecursionCallFlowNode({ data }: NodeProps<Node<RecCallNodeData>>) {
  const { callNode } = data;

  return (
    <div
      data-testid={`recursion-node-${callNode.id}`}
      className={cn(
        "min-w-[130px] rounded-xl border-2 px-3 py-2 font-mono shadow-sm transition-all",
        callNode.status === "active" &&
          "border-primary bg-primary/18 ring-2 ring-primary/30",
        callNode.status === "pending-child" &&
          "border-accent-amber bg-accent-amber/12",
        callNode.status === "completed" &&
          "border-accent-emerald/75 bg-surface-1"
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[9.5px] text-subtle-foreground">
        <span>depth {callNode.depth}</span>
        <span>step #{callNode.callStep}</span>
      </div>

      <div className="mt-0.5 truncate text-xs font-bold text-foreground">
        {callNode.functionName}({callNode.argsDisplay})
      </div>

      {callNode.returnValue !== null && callNode.returnValue !== undefined ? (
        <div className="mt-1 inline-flex items-center gap-1 rounded bg-accent-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-emerald">
          <CornerDownLeft className="h-2.5 w-2.5" />
          <span>ret {callNode.returnValue}</span>
        </div>
      ) : callNode.status === "active" ? (
        <div className="mt-1 text-[10px] font-semibold text-primary">
          ● executing
        </div>
      ) : (
        <div className="mt-1 text-[10px] text-accent-amber">
          ⏳ awaiting child
        </div>
      )}

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
  recCallNode: RecursionCallFlowNode,
};

function RecursionTreeFlowInner({
  state,
}: {
  state: RecursionMemoryVisualizationState;
}) {
  const { resolvedTheme } = useTheme();
  const { fitView } = useReactFlow();
  const isDark = resolvedTheme === "dark";

  const nodes: Node<RecCallNodeData>[] = React.useMemo(
    () =>
      state.callTreeNodes.map((n) => ({
        id: n.id,
        type: "recCallNode",
        position: { x: n.x, y: n.y },
        draggable: false,
        data: { callNode: n },
      })),
    [state.callTreeNodes]
  );

  const edges: Edge[] = React.useMemo(
    () =>
      state.callTreeNodes
        .filter((n) => n.parentId !== null)
        .map((n) => {
          const isCompleted = n.status === "completed";
          const color = isCompleted ? "#10b981" : "#6366f1";
          return {
            id: `rec-edge-${n.parentId}-${n.id}`,
            source: n.parentId!,
            target: n.id,
            animated: n.status === "active",
            label:
              n.returnValue !== null && n.returnValue !== undefined
                ? `↩ ${n.returnValue}`
                : undefined,
            style: { stroke: color, strokeWidth: 1.9 },
            labelStyle: {
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fill: color,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color,
              width: 14,
              height: 14,
            },
          };
        }),
    [state.callTreeNodes]
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.25, duration: 160 });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [fitView, state.callTreeNodes.length]);

  return (
    <div className="h-full w-full min-h-[220px]">
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

interface RecursionMemoryVisualizerProps {
  state: RecursionMemoryVisualizationState;
}

export function RecursionMemoryVisualizer({
  state,
}: RecursionMemoryVisualizerProps) {
  const reversedFrames = [...state.activeFrames].reverse();

  return (
    <div
      className="flex h-full flex-col gap-3 p-4"
      data-testid="visualizer-recursion-memory"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            Recursion &amp; Object References
          </span>
          <Badge variant="indigo" className="gap-1 px-1.5 py-0 text-[10px]">
            <Cpu className="h-2.5 w-2.5" />
            Frames={state.activeFrames.length} · Max Depth=
            {state.maxDepthReached}
          </Badge>
          {state.callTreeNodes.length > 0 && (
            <Badge variant="emerald" className="gap-1 px-1.5 py-0 text-[10px]">
              <GitBranch className="h-2.5 w-2.5" />
              Calls={state.callTreeNodes.length}
            </Badge>
          )}
        </div>

        <span className="text-[10.5px] text-muted-foreground">
          Educational Python frame &amp; reference graph (not CPython C-struct
          heap)
        </span>
      </div>

      {/* Operation Banner */}
      {state.operationSummary && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 font-mono text-xs text-foreground">
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{state.operationSummary}</span>
        </div>
      )}

      {/* Split Grid: Call Stack Frames + Recursion Tree */}
      <div className="grid min-h-[230px] flex-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Active Call Stack Tower */}
        <div
          className="flex flex-col rounded-xl border border-border bg-surface-2/40 p-3"
          data-testid="recursion-call-stack-tower"
        >
          <div className="mb-2 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3 text-primary" />
              Call Stack (Top First)
            </span>
            <span className="font-mono">{state.activeFrames.length}</span>
          </div>

          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {reversedFrames.map((frame, idx) => {
              const isActiveTop = idx === 0;
              return (
                <div
                  key={frame.frame_id}
                  data-testid={`call-frame-card-${frame.frame_id}`}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 font-mono text-xs transition-all",
                    isActiveTop
                      ? "border-primary bg-primary/12 shadow-sm"
                      : "border-border bg-surface-1 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground">
                      {frame.function_name}
                    </span>
                    <Badge
                      variant={isActiveTop ? "indigo" : "secondary"}
                      className="px-1 py-0 text-[9px]"
                    >
                      L{frame.line}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[10px] text-subtle-foreground">
                    depth {frame.depth} · {frame.frame_id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recursive Call Tree Diagram */}
        <div
          className="relative min-h-[220px] overflow-hidden rounded-xl border border-border bg-surface-code/50"
          data-testid="recursion-tree-canvas"
        >
          {state.callTreeNodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center font-mono text-xs text-muted-foreground">
              <span>Running at module scope (&lt;module&gt;)</span>
              <span className="mt-1 text-[11px] text-subtle-foreground">
                Function calls and recursive trees appear here when functions
                are invoked.
              </span>
            </div>
          ) : (
            <ReactFlowProvider>
              <RecursionTreeFlowInner state={state} />
            </ReactFlowProvider>
          )}
        </div>
      </div>

      {/* Object Reference Identity Table (ref#N) */}
      {state.memoryBindings.length > 0 && (
        <div
          className="rounded-xl border border-border bg-surface-1 p-3"
          data-testid="memory-reference-table"
        >
          <div className="mb-2 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="h-3 w-3 text-accent-violet" />
              Variable → Heap Object Reference Bindings (ref#N)
            </span>
            <span className="font-mono">{state.memoryBindings.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {state.memoryBindings.map((binding) => (
              <div
                key={`${binding.frameName}-${binding.variableName}`}
                data-testid={`memory-binding-${binding.variableName}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[11px]",
                  binding.isSharedAlias
                    ? "border-accent-violet/45 bg-accent-violet/10"
                    : "border-border bg-surface-2/60"
                )}
              >
                <span className="font-bold text-foreground">
                  {binding.variableName}
                </span>
                <ArrowRight className="h-3 w-3 text-subtle-foreground" />
                <Badge
                  variant={binding.isSharedAlias ? "indigo" : "secondary"}
                  className="px-1.5 py-0 font-mono text-[10px]"
                >
                  {binding.objectId}
                  {binding.isSharedAlias ? " · shared alias" : ""}
                </Badge>
                <span className="max-w-[160px] truncate text-muted-foreground">
                  {binding.typeName}: {binding.display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

