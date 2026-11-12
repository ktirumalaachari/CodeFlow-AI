"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Code2,
  CornerDownLeft,
  PhoneCall,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { cn } from "@/lib/utils";

export function ExecutionTimeline() {
  const sourceCode = useWorkspaceStore((s) => s.sourceCode);
  const lastExecutedCode = useWorkspaceStore((s) => s.lastExecutedCode);
  const status = useWorkspaceStore((s) => s.status);
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const jumpToStep = useWorkspaceStore((s) => s.jumpToStep);
  const runExecution = useWorkspaceStore((s) => s.runExecution);

  const steps = traceResult?.steps ?? [];
  const totalSteps = steps.length;
  const hasSteps = totalSteps > 0;
  const currentStep = hasSteps ? steps[currentStepIndex] ?? steps[0] : null;

  const progressPercent = hasSteps
    ? totalSteps === 1
      ? 100
      : Math.round(((currentStepIndex + 1) / totalSteps) * 100)
    : 0;

  const isAtEnd = hasSteps && currentStepIndex === totalSteps - 1;
  const isCodeStale =
    lastExecutedCode !== null && lastExecutedCode !== sourceCode;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const [hoverStep, setHoverStep] = React.useState<number | null>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasSteps || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetRatio = clickX / rect.width;
    const targetIdx = Math.round(targetRatio * (totalSteps - 1));
    jumpToStep(targetIdx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasSteps || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const moveX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetRatio = moveX / rect.width;
    const targetIdx = Math.round(targetRatio * (totalSteps - 1));
    setHoverStep(targetIdx);
  };

  return (
    <div
      className="border-b border-border bg-gradient-to-r from-surface-1/95 via-surface-1/90 to-surface-1/95 px-3 py-2.5 backdrop-blur sm:px-4"
      data-testid="execution-timeline"
    >
      <div className="flex flex-col gap-2">
        {/* Top Info Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Step navigation, step counter, active line, statement preview */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-surface-2/60 p-0.5 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!hasSteps || currentStepIndex <= 0}
                onClick={() => jumpToStep(0)}
                aria-label="Jump to first step"
                data-testid="timeline-first-btn"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>

              <span
                className="min-w-[6.8rem] select-none text-center font-mono text-xs font-bold tabular-nums text-foreground"
                data-testid="timeline-step-counter"
              >
                {hasSteps
                  ? `Step ${currentStepIndex + 1} / ${totalSteps}`
                  : "Step 0 / 0"}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!hasSteps || currentStepIndex >= totalSteps - 1}
                onClick={() => jumpToStep(totalSteps - 1)}
                aria-label="Jump to last step"
                data-testid="timeline-last-btn"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {currentStep && (
              <div className="flex min-w-0 items-center gap-1.5">
                <Badge
                  variant="default"
                  className="gap-1 border-primary/30 bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary shadow-sm"
                >
                  <Code2 className="h-3 w-3" />
                  Line {currentStep.line}
                </Badge>

                <Badge
                  variant={
                    currentStep.event === "exception"
                      ? "rose"
                      : currentStep.event === "call"
                      ? "default"
                      : currentStep.event === "return"
                      ? "violet"
                      : "emerald"
                  }
                  className="gap-1 px-1.5 py-0 font-mono text-[10px] uppercase shadow-sm"
                >
                  {currentStep.event === "call" && (
                    <PhoneCall className="h-2.5 w-2.5" />
                  )}
                  {currentStep.event === "return" && (
                    <CornerDownLeft className="h-2.5 w-2.5" />
                  )}
                  {currentStep.event === "line" && (
                    <Zap className="h-2.5 w-2.5" />
                  )}
                  {currentStep.event}
                </Badge>

                {currentStep.source_line && (
                  <span className="hidden max-w-[260px] truncate rounded-md border border-border-subtle bg-surface-2/70 px-2 py-0.5 font-mono text-[11px] text-foreground sm:inline-block md:max-w-[340px]">
                    {currentStep.source_line.trim()}
                  </span>
                )}
              </div>
            )}

            {!hasSteps && status === "idle" && (
              <span className="text-xs text-muted-foreground">
                Click <strong className="font-semibold text-primary">Run</strong>{" "}
                (⌘/Ctrl+Enter) to visualize every execution step.
              </span>
            )}
          </div>

          {/* Right: Code stale badge, duration, completion pill */}
          <div className="flex items-center gap-2">
            {isCodeStale && (
              <button
                type="button"
                onClick={() => void runExecution()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent-amber/40 bg-accent-amber/15 px-2.5 py-1 text-[11px] font-semibold text-accent-amber shadow-sm transition-all hover:bg-accent-amber/25 hover:shadow-glow-primary"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Code modified · Click to re-run</span>
              </button>
            )}

            {traceResult && (
              <span className="hidden items-center gap-1 font-mono text-[11px] tabular-nums text-muted-foreground sm:inline-flex">
                <Clock className="h-3 w-3 text-subtle-foreground" />
                {traceResult.duration_ms.toFixed(1)} ms
              </span>
            )}

            {hasSteps && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                  {progressPercent}%
                </span>
                {isAtEnd && (
                  <Badge variant="emerald" className="gap-1 px-1.5 py-0 text-[10px]">
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fluid Interactive Scrubber Bar */}
        <div
          ref={trackRef}
          role="slider"
          aria-label="Execution step scrubber"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, totalSteps - 1)}
          aria-valuenow={currentStepIndex}
          tabIndex={hasSteps ? 0 : -1}
          onClick={handleTrackClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverStep(null)}
          onKeyDown={(e) => {
            if (!hasSteps) return;
            if (e.key === "ArrowRight") {
              e.preventDefault();
              jumpToStep(Math.min(totalSteps - 1, currentStepIndex + 1));
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              jumpToStep(Math.max(0, currentStepIndex - 1));
            } else if (e.key === "Home") {
              e.preventDefault();
              jumpToStep(0);
            } else if (e.key === "End") {
              e.preventDefault();
              jumpToStep(totalSteps - 1);
            }
          }}
          className={cn(
            "group relative flex h-5 w-full cursor-pointer items-center select-none py-1 focus:outline-none",
            !hasSteps && "pointer-events-none opacity-40"
          )}
        >
          {/* Base Background Track */}
          <div className="relative h-2 w-full overflow-hidden rounded-full border border-border/80 bg-surface-3/80 shadow-inner">
            {/* Animated Gradient Progress Fill */}
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent-violet to-accent-emerald"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          </div>

          {/* Floating Glowing Playhead Thumb */}
          {hasSteps && (
            <motion.div
              className="pointer-events-none absolute top-1/2 -ml-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center"
              initial={false}
              animate={{ left: `${(currentStepIndex / Math.max(1, totalSteps - 1)) * 100}%` }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            >
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-lg ring-2 ring-primary/40 transition-transform group-hover:scale-125 dark:border-zinc-950 dark:bg-accent-emerald dark:ring-accent-emerald/40" />
            </motion.div>
          )}

          {/* Hover Tooltip Preview */}
          <AnimatePresence>
            {hoverStep !== null && hasSteps && steps[hoverStep] && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                style={{
                  left: `${(hoverStep / Math.max(1, totalSteps - 1)) * 100}%`,
                }}
                className="pointer-events-none absolute -top-8 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-1/95 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-elevation-2 backdrop-blur"
              >
                Step {hoverStep + 1} · Line {steps[hoverStep].line}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
