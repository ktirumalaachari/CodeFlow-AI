"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ShowcaseSection() {
  return (
    <section
      id="showcase"
      className="scroll-mt-16 border-b border-border py-section-md"
    >
      <div className="container">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge variant="emerald">Visualization Showcase</Badge>
            <h2 className="mt-3 text-display-md text-foreground">
              Clean representations for every core structure
            </h2>
            <p className="mt-2 text-body-md text-muted-foreground">
              Preview how CODEFLOW AI renders contiguous memory, dynamic subarray
              bounds, hierarchical trees, graph frontiers, and recursion stacks.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit font-mono">
            UI Blueprints · Phase 3 Renderer Specs
          </Badge>
        </div>

        <Tabs defaultValue="array" className="mt-8">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max gap-1 p-1">
              <TabsTrigger value="array">Array Visualization</TabsTrigger>
              <TabsTrigger value="window">Sliding Window</TabsTrigger>
              <TabsTrigger value="tree">Binary Tree</TabsTrigger>
              <TabsTrigger value="graph">Graph Traversal</TabsTrigger>
              <TabsTrigger value="recursion">Recursion</TabsTrigger>
            </TabsList>
          </div>

          {/* 1. Array Visualization */}
          <TabsContent value="array">
            <ShowcaseFrame
              title="Binary Search Midpoint Partitioning"
              complexity="Time O(log n) · Space O(1)"
              caption="Contiguous memory cells dim eliminated halves automatically as low, mid, and high update."
            >
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
                {[3, 7, 12, 18, 24, 31, 42, 56].map((value, idx) => {
                  const eliminated = idx < 4;
                  const isMid = idx === 5;
                  const isBound = idx === 4 || idx === 7;
                  return (
                    <div
                      key={value}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <span className="font-mono text-[10px] text-subtle-foreground tabular-nums">
                        idx {idx}
                      </span>
                      <div
                        className={cn(
                          "flex h-12 w-full items-center justify-center rounded-lg border font-mono text-sm font-semibold tabular-nums",
                          isMid
                            ? "border-accent-emerald bg-accent-emerald/15 text-accent-emerald"
                            : isBound
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : eliminated
                            ? "border-border-subtle bg-surface-1 text-subtle-foreground opacity-45"
                            : "border-border bg-surface-2 text-foreground"
                        )}
                      >
                        {value}
                      </div>
                      <span className="h-4 font-mono text-[10px] font-semibold">
                        {idx === 4 && (
                          <span className="text-primary">low</span>
                        )}
                        {idx === 5 && (
                          <span className="text-accent-emerald">mid</span>
                        )}
                        {idx === 7 && (
                          <span className="text-primary">high</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ShowcaseFrame>
          </TabsContent>

          {/* 2. Sliding Window */}
          <TabsContent value="window">
            <ShowcaseFrame
              title="Fixed-Size Rolling Subarray Window (k = 3)"
              complexity="Time O(n) · Space O(1)"
              caption="Highlights outgoing element subtraction and incoming element addition without resumming interior elements."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {[4, 2, 9, 7, 5, 8].map((val, idx) => {
                    const outgoing = idx === 1;
                    const inWindow = idx >= 2 && idx <= 4;
                    const incoming = idx === 4;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <span className="font-mono text-[10px] text-subtle-foreground">
                          [{idx}]
                        </span>
                        <div
                          className={cn(
                            "flex h-12 w-full items-center justify-center rounded-lg border font-mono text-sm font-semibold tabular-nums",
                            incoming
                              ? "border-accent-emerald bg-accent-emerald/15 text-accent-emerald"
                              : inWindow
                              ? "border-primary bg-primary/14 text-foreground"
                              : outgoing
                              ? "border-accent-rose/45 border-dashed bg-accent-rose/10 text-accent-rose"
                              : "border-border-subtle bg-surface-1 text-subtle-foreground opacity-55"
                          )}
                        >
                          {val}
                        </div>
                        <span className="font-mono text-[10px]">
                          {outgoing && (
                            <span className="text-accent-rose">-2 exit</span>
                          )}
                          {idx === 2 && (
                            <span className="text-primary">left</span>
                          )}
                          {incoming && (
                            <span className="text-accent-emerald">+5 enter</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg border border-border bg-surface-code px-4 py-2.5 font-mono text-xs">
                  <span className="text-muted-foreground">
                    prev_sum = <strong className="text-foreground">18</strong>
                  </span>
                  <span className="text-subtle-foreground">→</span>
                  <span className="text-muted-foreground">
                    18 <span className="text-accent-rose">- 2</span>{" "}
                    <span className="text-accent-emerald">+ 5</span>
                  </span>
                  <span className="text-subtle-foreground">→</span>
                  <span className="text-accent-emerald font-semibold">
                    window_sum = 21 (new max)
                  </span>
                </div>
              </div>
            </ShowcaseFrame>
          </TabsContent>

          {/* 3. Binary Tree */}
          <TabsContent value="tree">
            <ShowcaseFrame
              title="Binary Search Tree Depth-First Search"
              complexity="Time O(V) · Stack Depth O(h)"
              caption="Visited nodes, active recursion node, and parent-child edges stay legible at every frame."
            >
              <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
                <svg
                  viewBox="0 0 340 185"
                  className="h-44 w-full max-w-[340px]"
                  role="img"
                  aria-label="Binary tree visualization preview"
                >
                  {/* Edges */}
                  <line
                    x1="170"
                    y1="32"
                    x2="95"
                    y2="92"
                    stroke="hsl(var(--accent-emerald))"
                    strokeWidth="2"
                  />
                  <line
                    x1="170"
                    y1="32"
                    x2="245"
                    y2="92"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="1.75"
                  />
                  <line
                    x1="95"
                    y1="92"
                    x2="52"
                    y2="152"
                    stroke="hsl(var(--accent-emerald))"
                    strokeWidth="2"
                  />
                  <line
                    x1="95"
                    y1="92"
                    x2="138"
                    y2="152"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                  <line
                    x1="245"
                    y1="92"
                    x2="288"
                    y2="152"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="1.75"
                  />

                  {/* Root 20 */}
                  <TreeNodeSvg x={170} y={32} label="20" state="visited" />
                  {/* Left 12 */}
                  <TreeNodeSvg x={95} y={92} label="12" state="visited" />
                  {/* Right 30 */}
                  <TreeNodeSvg x={245} y={92} label="30" state="unvisited" />
                  {/* Leaves */}
                  <TreeNodeSvg x={52} y={152} label="6" state="visited" />
                  <TreeNodeSvg x={138} y={152} label="15" state="active" />
                  <TreeNodeSvg x={288} y={152} label="36" state="unvisited" />
                </svg>

                <div className="w-full max-w-xs space-y-2 rounded-xl border border-border bg-surface-code p-3.5 font-mono text-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Inorder Traversal State
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">visited_order</span>
                    <span className="text-accent-emerald">[6, 12]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">active_node</span>
                    <span className="text-primary font-semibold">Node(15)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">call_depth</span>
                    <span className="text-foreground">3 frames</span>
                  </div>
                </div>
              </div>
            </ShowcaseFrame>
          </TabsContent>

          {/* 4. Graph Traversal */}
          <TabsContent value="graph">
            <ShowcaseFrame
              title="Breadth-First Search (BFS) Level Frontier"
              complexity="Time O(V + E) · Queue O(V)"
              caption="Displays vertex discovery state alongside the live FIFO deque frontier."
            >
              <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
                <svg
                  viewBox="0 0 340 175"
                  className="h-44 w-full max-w-[340px]"
                  role="img"
                  aria-label="Graph traversal visualization preview"
                >
                  <line x1="55" y1="88" x2="145" y2="38" stroke="hsl(var(--accent-emerald))" strokeWidth="2" />
                  <line x1="55" y1="88" x2="145" y2="138" stroke="hsl(var(--accent-emerald))" strokeWidth="2" />
                  <line x1="145" y1="38" x2="245" y2="38" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="145" y1="38" x2="145" y2="138" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
                  <line x1="145" y1="138" x2="245" y2="138" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
                  <line x1="245" y1="38" x2="300" y2="88" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
                  <line x1="245" y1="138" x2="300" y2="88" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />

                  <TreeNodeSvg x={55} y={88} label="A" state="visited" />
                  <TreeNodeSvg x={145} y={38} label="B" state="active" />
                  <TreeNodeSvg x={145} y={138} label="C" state="visited" />
                  <TreeNodeSvg x={245} y={38} label="D" state="frontier" />
                  <TreeNodeSvg x={245} y={138} label="E" state="unvisited" />
                  <TreeNodeSvg x={300} y={88} label="F" state="unvisited" />
                </svg>

                <div className="w-full max-w-xs space-y-2.5 rounded-xl border border-border bg-surface-code p-3.5 font-mono text-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    FIFO Queue (deque)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-primary/40 bg-primary/15 px-2.5 py-1 text-primary">
                      C
                    </span>
                    <span className="rounded border border-accent-amber/40 bg-accent-amber/15 px-2.5 py-1 text-accent-amber">
                      D (enqueued)
                    </span>
                  </div>
                  <div className="border-t border-border-subtle pt-2 text-[11px] text-muted-foreground">
                    visited ={" "}
                    <span className="text-accent-emerald">
                      {"{'A', 'B', 'C', 'D'}"}
                    </span>
                  </div>
                </div>
              </div>
            </ShowcaseFrame>
          </TabsContent>

          {/* 5. Recursion */}
          <TabsContent value="recursion">
            <ShowcaseFrame
              title="Recursive Call Stack & Unwinding Return Frames"
              complexity="Call Stack Growth & Base Case Return"
              caption="Visualizes each pushed activation record so recursion stops feeling like magic."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    frame: "factorial(1)",
                    depth: "Top of Stack · Frame #3",
                    line: "return 1  # base case hit",
                    stateClass:
                      "border-accent-emerald bg-accent-emerald/10 text-accent-emerald",
                  },
                  {
                    frame: "factorial(2)",
                    depth: "Suspended · Frame #2",
                    line: "waiting: 2 * factorial(1)",
                    stateClass: "border-primary/40 bg-primary/10 text-primary",
                  },
                  {
                    frame: "factorial(3)",
                    depth: "Root Call · Frame #1",
                    line: "waiting: 3 * factorial(2)",
                    stateClass: "border-border bg-surface-2 text-foreground",
                  },
                ].map((item) => (
                  <div
                    key={item.frame}
                    className={cn(
                      "rounded-xl border p-4 font-mono",
                      item.stateClass
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider opacity-80">
                      {item.depth}
                    </div>
                    <div className="mt-1.5 text-sm font-semibold">
                      {item.frame}
                    </div>
                    <div className="mt-2 rounded bg-surface-code/80 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                      {item.line}
                    </div>
                  </div>
                ))}
              </div>
            </ShowcaseFrame>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function ShowcaseFrame({
  title,
  complexity,
  caption,
  children,
}: {
  title: string;
  complexity: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-elevation-1 sm:p-7">
      <div className="mb-6 flex flex-col gap-2 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-heading-md text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
        </div>
        <Badge variant="mono" className="w-fit">
          {complexity}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function TreeNodeSvg({
  x,
  y,
  label,
  state,
}: {
  x: number;
  y: number;
  label: string;
  state: "visited" | "active" | "frontier" | "unvisited";
}) {
  const fillMap = {
    visited: "hsl(var(--accent-emerald) / 0.16)",
    active: "hsl(var(--primary) / 0.22)",
    frontier: "hsl(var(--accent-amber) / 0.18)",
    unvisited: "hsl(var(--surface-2))",
  };
  const strokeMap = {
    visited: "hsl(var(--accent-emerald))",
    active: "hsl(var(--primary))",
    frontier: "hsl(var(--accent-amber))",
    unvisited: "hsl(var(--border-strong))",
  };

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={19}
        fill={fillMap[state]}
        stroke={strokeMap[state]}
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className="fill-foreground font-mono text-[12px] font-semibold"
      >
        {label}
      </text>
    </g>
  );
}

