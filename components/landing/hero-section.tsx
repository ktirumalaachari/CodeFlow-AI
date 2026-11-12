"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PreviewFrame {
  stepLabel: string;
  activeLine: number;
  leftIdx: number;
  rightIdx: number;
  currentSum: number;
  statusNote: string;
  mutatedVar: "left" | "right" | "current_sum" | "found";
}

const PREVIEW_ARRAY = [2, 5, 8, 11, 15];
const TARGET_SUM = 16;

const PREVIEW_FRAMES: PreviewFrame[] = [
  {
    stepLabel: "Step 1 / 4",
    activeLine: 2,
    leftIdx: 0,
    rightIdx: 4,
    currentSum: 17,
    statusNote: "Initialize converging pointers at array bounds (0 and 4).",
    mutatedVar: "left",
  },
  {
    stepLabel: "Step 2 / 4",
    activeLine: 4,
    leftIdx: 0,
    rightIdx: 4,
    currentSum: 17,
    statusNote: "nums[0] + nums[4] = 17 > target (16); right boundary is too large.",
    mutatedVar: "current_sum",
  },
  {
    stepLabel: "Step 3 / 4",
    activeLine: 9,
    leftIdx: 0,
    rightIdx: 3,
    currentSum: 13,
    statusNote: "Decrement right → 3; next sum nums[0] + nums[3] = 13 < 16.",
    mutatedVar: "right",
  },
  {
    stepLabel: "Step 4 / 4",
    activeLine: 6,
    leftIdx: 1,
    rightIdx: 3,
    currentSum: 16,
    statusNote: "Advance left → 1; nums[1] + nums[3] == 16. Target pair matched!",
    mutatedVar: "found",
  },
];

const CODE_LINES = [
  { num: 1, code: "def pair_sum(nums: list[int], t: int):" },
  { num: 2, code: "    left, right = 0, len(nums) - 1" },
  { num: 3, code: "    while left < right:" },
  { num: 4, code: "        curr = nums[left] + nums[right]" },
  { num: 5, code: "        if curr == t:" },
  { num: 6, code: "            return (left, right)" },
  { num: 7, code: "        elif curr < t:" },
  { num: 8, code: "            left += 1" },
  { num: 9, code: "        else: right -= 1" },
];

export function HeroSection() {
  const [frameIndex, setFrameIndex] = React.useState(1);
  const frame = PREVIEW_FRAMES[frameIndex];

  return (
    <section className="relative overflow-hidden border-b border-border py-14 sm:py-20 lg:py-24">
      {/* Subtle architectural grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-subtle [mask-image:radial-gradient(ellipse_75%_60%_at_50%_20%,#000_35%,transparent_100%)]"
      />

      <div className="container relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Headline & Actions */}
          <div className="animate-hero-left lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1 shadow-elevation-1">
              <span className="h-2 w-2 rounded-full bg-accent-emerald" />
              <span className="text-xs font-medium text-muted-foreground">
                Understand Every Line. Visualize Every Step.
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.07]">
              Stop Reading Code.
              <span className="mt-1 block text-primary">
                Start Seeing How It Works.
              </span>
            </h1>

            <p className="max-w-xl text-body-lg text-muted-foreground leading-relaxed">
              Understand programming through interactive execution, real-time
              visualizations and AI-powered explanations. From your first Python
              loop to advanced algorithms.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild size="xl" className="shadow-glow-primary">
                <Link href="/dashboard">
                  Start Visualizing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="xl">
                <a href="#features">Explore Features</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Step-by-step memory frames
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                Data structure visuals
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-violet" />
                Contextual AI tutor
              </span>
            </div>
          </div>

          {/* Right Column: Product Design Preview Window */}
          <div className="animate-hero-right lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface-1 shadow-elevation-3">
              {/* Window Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/70 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                  </div>
                  <span className="ml-1 font-mono text-xs text-foreground">
                    pair_sum_sorted.py
                  </span>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Eye className="h-3 w-3 text-primary" />
                  Design Preview · Sample Frames
                </Badge>
              </div>

              {/* Split Editor + Inspector */}
              <div className="grid divide-y divide-border md:grid-cols-12 md:divide-x md:divide-y-0">
                {/* Code Editor Pane */}
                <div className="bg-surface-code p-3.5 md:col-span-7">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-subtle-foreground">
                    <span className="font-mono uppercase tracking-wider">
                      Python 3.12
                    </span>
                    <span className="font-mono text-accent-emerald">
                      Line {frame.activeLine} active
                    </span>
                  </div>
                  <div className="space-y-0.5 font-mono text-[11.5px] leading-6">
                    {CODE_LINES.map((line) => {
                      const isActive = line.num === frame.activeLine;
                      return (
                        <div
                          key={line.num}
                          className={cn(
                            "flex items-center gap-2 rounded px-2 transition-colors duration-150",
                            isActive
                              ? "bg-accent-emerald/14 text-foreground ring-1 ring-inset ring-accent-emerald/35"
                              : "text-muted-foreground"
                          )}
                        >
                          <span className="w-4 shrink-0 select-none text-right text-[11px] tabular-nums text-subtle-foreground">
                            {isActive ? "→" : line.num}
                          </span>
                          <pre className="overflow-hidden text-ellipsis whitespace-pre">
                            {line.code}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Variable Inspector Pane */}
                <div className="flex flex-col justify-between bg-surface-1 p-3.5 md:col-span-5">
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Variable Inspector
                      </span>
                      <span className="font-mono text-[10px] text-subtle-foreground">
                        frame: pair_sum
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <InspectorRow
                        name="t"
                        type="int"
                        value={String(TARGET_SUM)}
                      />
                      <InspectorRow
                        name="left"
                        type="int"
                        value={String(frame.leftIdx)}
                        highlighted={
                          frame.mutatedVar === "left" ||
                          frame.mutatedVar === "found"
                        }
                      />
                      <InspectorRow
                        name="right"
                        type="int"
                        value={String(frame.rightIdx)}
                        highlighted={frame.mutatedVar === "right"}
                      />
                      <InspectorRow
                        name="curr"
                        type="int"
                        value={String(frame.currentSum)}
                        highlighted={
                          frame.mutatedVar === "current_sum" ||
                          frame.mutatedVar === "found"
                        }
                      />
                    </div>
                  </div>

                  {frame.mutatedVar === "found" && (
                    <div className="mt-3 rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-1.5 font-mono text-[11px] text-accent-emerald">
                      return → (1, 3)
                    </div>
                  )}
                </div>
              </div>

              {/* Array Visualization Strip */}
              <div className="border-t border-border bg-surface-1 px-4 py-3.5">
                <div className="mb-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    nums: list[int] (len = 5)
                  </span>
                  <span className="font-mono text-[11px] text-foreground tabular-nums">
                    nums[{frame.leftIdx}] + nums[{frame.rightIdx}] ={" "}
                    <strong
                      className={cn(
                        frame.currentSum === TARGET_SUM
                          ? "text-accent-emerald"
                          : "text-accent-amber"
                      )}
                    >
                      {frame.currentSum}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {PREVIEW_ARRAY.map((val, idx) => {
                    const isLeft = idx === frame.leftIdx;
                    const isRight = idx === frame.rightIdx;
                    const inWindow =
                      idx >= frame.leftIdx && idx <= frame.rightIdx;
                    const isMatched =
                      frame.mutatedVar === "found" && (isLeft || isRight);

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="font-mono text-[10px] text-subtle-foreground tabular-nums">
                          [{idx}]
                        </span>
                        <div
                          className={cn(
                            "flex h-10 w-full items-center justify-center rounded-lg border font-mono text-sm font-semibold tabular-nums transition-all duration-200",
                            isMatched
                              ? "border-accent-emerald bg-accent-emerald/18 text-accent-emerald"
                              : isLeft || isRight
                              ? "border-primary bg-primary/15 text-foreground shadow-sm"
                              : inWindow
                              ? "border-border bg-surface-2 text-foreground"
                              : "border-border-subtle bg-surface-1 text-subtle-foreground opacity-50"
                          )}
                        >
                          {val}
                        </div>
                        <div className="flex h-4 items-center gap-1 font-mono text-[10px] font-semibold">
                          {isLeft && (
                            <span className="rounded bg-primary/15 px-1 text-primary">
                              L
                            </span>
                          )}
                          {isRight && (
                            <span className="rounded bg-accent-amber/15 px-1 text-accent-amber">
                              R
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Intuition Strip */}
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-2/60 px-3 py-2 text-xs text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-violet" />
                  <span>{frame.statusNote}</span>
                </div>
              </div>

              {/* Execution Storyboard Controls */}
              <div className="flex items-center justify-between border-t border-border bg-surface-2/80 px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={frameIndex === 0}
                    onClick={() => setFrameIndex(0)}
                    aria-label="Reset preview to first sample step"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    disabled={frameIndex === 0}
                    onClick={() => setFrameIndex((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    disabled={frameIndex === PREVIEW_FRAMES.length - 1}
                    onClick={() =>
                      setFrameIndex((i) =>
                        Math.min(PREVIEW_FRAMES.length - 1, i + 1)
                      )
                    }
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={frameIndex === PREVIEW_FRAMES.length - 1}
                    onClick={() => setFrameIndex(PREVIEW_FRAMES.length - 1)}
                    aria-label="Jump to final sample step"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
                  {frame.stepLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InspectorRow({
  name,
  type,
  value,
  highlighted = false,
}: {
  name: string;
  type: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border px-2.5 py-1.5 transition-colors",
        highlighted
          ? "border-accent-amber/40 bg-accent-amber/10"
          : "border-border-subtle bg-surface-2/50"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-foreground">{name}</span>
        <span className="text-[10px] text-subtle-foreground">:{type}</span>
      </div>
      <span
        className={cn(
          "font-semibold tabular-nums",
          highlighted ? "text-accent-amber" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
