"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Layers,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPARISON_SCENARIOS } from "@/lib/data/catalog";
import { codeflowApi, ApiClientError } from "@/lib/api/client";
import type {
  CompareExecutionResponsePayload,
  PlaybackSpeed,
  TraceStep,
} from "@/types/api";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { cn } from "@/lib/utils";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

function countLeadingLines(sharedInput: string): number {
  const trimmed = sharedInput.trim();
  if (!trimmed) return 0;
  return trimmed.split("\n").length + 2;
}

interface TraceRunnerColumnProps {
  variant: "brute" | "optimized";
  title: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  onCodeChange: (val: string) => void;
  steps: TraceStep[];
  currentStepIdx: number;
  onStepIdxChange: (idx: number) => void;
  totalSteps: number;
  durationMs: number;
  status: string;
  stdout: string;
  errorMsg?: string | null;
  lineOffset: number;
  onOpenInWorkspace: () => void;
}

function TraceRunnerColumn({
  variant,
  title,
  approach,
  timeComplexity,
  spaceComplexity,
  code,
  onCodeChange,
  steps,
  currentStepIdx,
  onStepIdxChange,
  totalSteps,
  durationMs,
  status,
  stdout,
  errorMsg,
  lineOffset,
  onOpenInWorkspace,
}: TraceRunnerColumnProps) {
  const isBrute = variant === "brute";
  const clampedIdx =
    steps.length > 0
      ? Math.max(0, Math.min(steps.length - 1, currentStepIdx))
      : 0;
  const activeStep: TraceStep | null =
    steps.length > 0 ? steps[clampedIdx] ?? null : null;

  const activeLocalLine = activeStep
    ? Math.max(1, activeStep.line - lineOffset)
    : null;

  const codeLines = code.split("\n");
  const allVars = React.useMemo(() => {
    if (!activeStep) return [];
    const map = new Map<string, TraceStep["locals"][number]>();
    for (const g of activeStep.globals) map.set(g.name, g);
    for (const l of activeStep.locals) map.set(l.name, l);
    return Array.from(map.values());
  }, [activeStep]);

  return (
    <div
      data-testid={`comparison-column-${variant}`}
      className={cn(
        "flex flex-col rounded-xl border bg-surface-1 shadow-elevation-1 overflow-hidden",
        isBrute ? "border-accent-rose/30" : "border-accent-emerald/30"
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3",
          isBrute
            ? "border-accent-rose/20 bg-accent-rose/[0.06]"
            : "border-accent-emerald/20 bg-accent-emerald/[0.06]"
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={isBrute ? "rose" : "emerald"}>{title}</Badge>
            <span className="font-mono text-xs font-semibold text-foreground">
              Time {timeComplexity} · Space {spaceComplexity}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{approach}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onOpenInWorkspace}
          data-testid={`comparison-open-workspace-${variant}`}
          className="h-7 gap-1 text-xs"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Open in IDE</span>
        </Button>
      </div>

      {/* Live Metrics Bar */}
      <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle bg-surface-2/40 text-center">
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Current / Total Steps
          </p>
          <p
            data-testid={`comparison-step-count-${variant}`}
            className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums"
          >
            {activeStep ? activeStep.step : 0} / {totalSteps}
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Runtime Duration
          </p>
          <p
            data-testid={`comparison-duration-${variant}`}
            className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums"
          >
            {durationMs.toFixed(2)} ms
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Call Stack Depth
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
            {activeStep ? activeStep.call_depth : 0} frame
            {activeStep && activeStep.call_depth === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Interactive Code Editor + Active Executing Line Highlight */}
      <div className="border-b border-border-subtle bg-[#0B0C10]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11px] text-zinc-400">
          <span className="font-mono">
            {isBrute ? "brute_force.py" : "optimized.py"}
          </span>
          {activeLocalLine && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] font-medium",
                isBrute
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-emerald-500/20 text-emerald-300"
              )}
            >
              Executing Line {activeLocalLine}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {/* Editable Textarea */}
          <div className="p-2">
            <label className="sr-only" htmlFor={`editor-${variant}`}>
              {title} Python Code
            </label>
            <textarea
              id={`editor-${variant}`}
              data-testid={`comparison-editor-${variant}`}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              rows={Math.max(8, Math.min(14, codeLines.length + 1))}
              spellCheck={false}
              className="w-full resize-y bg-transparent font-mono text-xs leading-5 text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Step-Highlighted Line Trace View */}
          <div className="max-h-60 overflow-y-auto py-2 font-mono text-xs leading-5">
            {codeLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isExecuting = activeLocalLine === lineNum;
              return (
                <div
                  key={lineNum}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-0.5 transition-colors",
                    isExecuting
                      ? isBrute
                        ? "bg-rose-500/20 text-white border-l-2 border-rose-400"
                        : "bg-emerald-500/20 text-white border-l-2 border-emerald-400"
                      : "text-zinc-400"
                  )}
                >
                  <span className="w-5 shrink-0 select-none text-right text-[10px] text-zinc-600">
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{lineText || " "}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Individual Step Scrubber */}
      {steps.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-2/30 px-4 py-2">
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            Step {clampedIdx + 1}/{steps.length}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, steps.length - 1)}
            value={clampedIdx}
            onChange={(e) => onStepIdxChange(Number(e.target.value))}
            aria-label={`${title} step timeline`}
            className="h-1.5 flex-1 cursor-pointer accent-primary"
          />
          <span className="font-mono text-[10px] text-subtle-foreground truncate max-w-[180px]">
            {activeStep?.explanation.headline ?? ""}
          </span>
        </div>
      )}

      {/* Variable & Memory Snapshot Inspector */}
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Variable &amp; Memory Snapshot ({allVars.length})
          </span>
          {activeStep && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              Frame: {activeStep.function_name}
            </Badge>
          )}
        </div>

        {allVars.length === 0 ? (
          <p className="rounded-lg border border-border-subtle bg-surface-2/40 p-3 text-xs text-muted-foreground">
            No variables initialized at this step yet.
          </p>
        ) : (
          <div
            data-testid={`comparison-variables-${variant}`}
            className="grid gap-1.5 sm:grid-cols-2"
          >
            {allVars.map((v) => (
              <div
                key={`${v.scope}-${v.name}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-xs",
                  v.change === "created"
                    ? "border-accent-emerald/35 bg-accent-emerald/[0.08]"
                    : v.change === "modified"
                    ? "border-accent-amber/35 bg-accent-amber/[0.08]"
                    : "border-border-subtle bg-surface-2/50"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      {v.name}
                    </span>
                    <span className="text-[10px] text-subtle-foreground">
                      {v.var_type}
                    </span>
                    {v.structured?.object_id && (
                      <span className="rounded bg-surface-3 px-1 text-[9px] text-muted-foreground">
                        {v.structured.object_id}
                      </span>
                    )}
                  </div>
                </div>
                <span className="truncate font-semibold text-primary max-w-[140px]">
                  {v.repr_value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Stdout / Error Footer */}
        <div className="rounded-lg border border-border-subtle bg-surface-2/40 p-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-primary" />
              Program Output ({status})
            </span>
          </div>
          {errorMsg ? (
            <p className="mt-1 font-mono text-xs text-accent-rose">{errorMsg}</p>
          ) : (
            <pre className="mt-1 font-mono text-xs text-foreground whitespace-pre-wrap">
              {stdout.trim() || "(no stdout emitted)"}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonLabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialScenarioId =
    searchParams.get("scenario") ?? COMPARISON_SCENARIOS[0].id;

  const matchedInitial =
    COMPARISON_SCENARIOS.find(
      (s) => s.id === initialScenarioId || s.slug === initialScenarioId
    ) ?? COMPARISON_SCENARIOS[0];

  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>(
    matchedInitial.id
  );
  const [sharedInputCode, setSharedInputCode] = React.useState<string>(
    matchedInitial.sharedInputCode
  );
  const [bruteCode, setBruteCode] = React.useState<string>(
    matchedInitial.bruteForce.code
  );
  const [optimizedCode, setOptimizedCode] = React.useState<string>(
    matchedInitial.optimized.code
  );

  const [comparisonResult, setComparisonResult] =
    React.useState<CompareExecutionResponsePayload | null>(null);
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);

  const [bruteStepIdx, setBruteStepIdx] = React.useState<number>(0);
  const [optStepIdx, setOptStepIdx] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<PlaybackSpeed>(1);

  const setWorkspaceSourceCode = useWorkspaceStore((s) => s.setSourceCode);
  const setWorkspaceProjectName = useWorkspaceStore((s) => s.setProjectName);
  const recordExecutionRun = useProjectStore((s) => s.recordExecutionRun);
  const toast = useToastStore((s) => s.toast);

  const activeScenario = React.useMemo(
    () =>
      COMPARISON_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
      COMPARISON_SCENARIOS[0],
    [selectedScenarioId]
  );

  const executeComparison = React.useCallback(
    async (
      shared: string,
      brute: string,
      opt: string,
      scenarioTitle: string
    ) => {
      setIsRunning(true);
      setIsPlaying(false);
      setErrorBanner(null);

      try {
        const res = await codeflowApi.comparePythonCode({
          shared_input_code: shared,
          brute_force_code: brute,
          optimized_code: opt,
          options: { max_steps: 600, timeout_seconds: 4.0 },
        });
        setComparisonResult(res);
        setBruteStepIdx(
          Math.max(0, Math.min(3, res.brute_force.steps.length - 1))
        );
        setOptStepIdx(
          Math.max(0, Math.min(3, res.optimized.steps.length - 1))
        );

        recordExecutionRun({
          title: `Comparison: ${scenarioTitle}`,
          sourceCode: `${shared.trim()}\n\n# Optimized\n${opt.trim()}`,
          language: "python",
          status: res.optimized.status,
          totalSteps: res.metrics.optimized_steps,
          durationMs: res.metrics.optimized_duration_ms,
          executionMode: res.optimized.execution_mode,
          stdoutPreview: res.optimized.stdout,
          errorTitle: res.optimized.error?.friendly_title ?? null,
        });
      } catch (err) {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Could not reach the FastAPI comparison engine.";
        setErrorBanner(msg);
      } finally {
        setIsRunning(false);
      }
    },
    [recordExecutionRun]
  );

  // Run initial scenario automatically on mount
  const didAutoRunRef = React.useRef(false);
  React.useEffect(() => {
    if (didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    void executeComparison(
      matchedInitial.sharedInputCode,
      matchedInitial.bruteForce.code,
      matchedInitial.optimized.code,
      matchedInitial.title
    );
  }, [executeComparison, matchedInitial]);

  const handleSelectScenario = (scenarioId: string) => {
    const found = COMPARISON_SCENARIOS.find((s) => s.id === scenarioId);
    if (!found) return;
    setSelectedScenarioId(found.id);
    setSharedInputCode(found.sharedInputCode);
    setBruteCode(found.bruteForce.code);
    setOptimizedCode(found.optimized.code);
    void executeComparison(
      found.sharedInputCode,
      found.bruteForce.code,
      found.optimized.code,
      found.title
    );
  };

  const maxCombinedSteps = React.useMemo(() => {
    if (!comparisonResult) return 0;
    return Math.max(
      comparisonResult.brute_force.steps.length,
      comparisonResult.optimized.steps.length
    );
  }, [comparisonResult]);

  // Synchronized playback loop
  React.useEffect(() => {
    if (!isPlaying || !comparisonResult) return;
    const bLen = comparisonResult.brute_force.steps.length;
    const oLen = comparisonResult.optimized.steps.length;

    const intervalMs = Math.round(700 / playbackSpeed);
    const timer = window.setInterval(() => {
      setBruteStepIdx((prevB) => {
        const nextB = prevB < bLen - 1 ? prevB + 1 : prevB;
        return nextB;
      });
      setOptStepIdx((prevO) => {
        const nextO = prevO < oLen - 1 ? prevO + 1 : prevO;
        return nextO;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [comparisonResult, isPlaying, playbackSpeed]);

  // Stop playing once both reach their final step
  React.useEffect(() => {
    if (!isPlaying || !comparisonResult) return;
    const bEnd =
      bruteStepIdx >=
      Math.max(0, comparisonResult.brute_force.steps.length - 1);
    const oEnd =
      optStepIdx >= Math.max(0, comparisonResult.optimized.steps.length - 1);
    if (bEnd && oEnd) {
      setIsPlaying(false);
    }
  }, [bruteStepIdx, comparisonResult, isPlaying, optStepIdx]);

  const handleStepForwardBoth = () => {
    if (!comparisonResult) return;
    setIsPlaying(false);
    setBruteStepIdx((b) =>
      Math.min(Math.max(0, comparisonResult.brute_force.steps.length - 1), b + 1)
    );
    setOptStepIdx((o) =>
      Math.min(Math.max(0, comparisonResult.optimized.steps.length - 1), o + 1)
    );
  };

  const handleStepBackBoth = () => {
    setIsPlaying(false);
    setBruteStepIdx((b) => Math.max(0, b - 1));
    setOptStepIdx((o) => Math.max(0, o - 1));
  };

  const handleResetBoth = () => {
    setIsPlaying(false);
    setBruteStepIdx(0);
    setOptStepIdx(0);
  };

  const handleOpenInWorkspace = (variant: "brute" | "optimized") => {
    const codePart = variant === "brute" ? bruteCode : optimizedCode;
    const combined = sharedInputCode.trim()
      ? `${sharedInputCode.trim()}\n\n${codePart.trim()}\n`
      : codePart;
    const label = `${activeScenario.title} (${
      variant === "brute" ? "Brute-Force" : "Optimized"
    })`;
    setWorkspaceProjectName(label);
    setWorkspaceSourceCode(combined);
    toast({
      title: `Loaded ${label}`,
      description: "Opening solution in the interactive Workspace IDE.",
      variant: "info",
    });
    router.push("/workspace");
  };

  const lineOffset = countLeadingLines(sharedInputCode);
  const metrics = comparisonResult?.metrics;

  return (
    <div className="space-y-6" data-testid="comparison-lab-page">
      <PageHeader
        title="Algorithm Comparison Lab"
        badge="Dual-Runner Engine · Active"
        badgeVariant="violet"
        description="Execute Brute-Force and Optimized Python implementations side-by-side on identical inputs to inspect real execution step counts, runtime durations, memory snapshots, and asymptotic tradeoffs."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/algorithms">
                <Compass className="h-3.5 w-3.5" />
                Algorithm Library
              </Link>
            </Button>
            <Button asChild>
              <Link href="/workspace">
                Open Workspace IDE
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Scenario Selector Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Comparison Scenario ({COMPARISON_SCENARIOS.length} Curated Benchmarks)
          </span>
          <Badge variant="indigo">{activeScenario.category}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {COMPARISON_SCENARIOS.map((scen) => {
            const isSelected = scen.id === selectedScenarioId;
            return (
              <button
                key={scen.id}
                type="button"
                data-testid={`comparison-scenario-${scen.id}`}
                onClick={() => handleSelectScenario(scen.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all",
                  isSelected
                    ? "border-primary bg-primary/15 text-primary shadow-sm"
                    : "border-border bg-surface-1 text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                <p className="font-semibold text-foreground">{scen.title}</p>
                <p className="mt-0.5 font-mono text-[10px] text-subtle-foreground">
                  {scen.bruteForce.timeComplexity} vs{" "}
                  {scen.optimized.timeComplexity}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Input + Synchronized Execution Controls */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        {/* Shared Input Box */}
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-elevation-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Identical Shared Input Setup
              </h2>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px]">
              Prepended to both runners
            </Badge>
          </div>
          <textarea
            data-testid="comparison-shared-input"
            value={sharedInputCode}
            onChange={(e) => setSharedInputCode(e.target.value)}
            rows={3}
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-[#0B0C10] p-2.5 font-mono text-xs text-zinc-100 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Synchronized Controls & Empirical Verdict */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-4 shadow-elevation-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isRunning}
                data-testid="comparison-run-btn"
                onClick={() =>
                  void executeComparison(
                    sharedInputCode,
                    bruteCode,
                    optimizedCode,
                    activeScenario.title
                  )
                }
                className="gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>
                  {isRunning ? "Executing Both…" : "Run Dual Comparison"}
                </span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!comparisonResult || isRunning}
                data-testid="comparison-play-btn"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Sync Play</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!comparisonResult}
                data-testid="comparison-step-back-btn"
                onClick={handleStepBackBoth}
                aria-label="Step backward both executions"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!comparisonResult}
                data-testid="comparison-step-forward-btn"
                onClick={handleStepForwardBoth}
                aria-label="Step forward both executions"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!comparisonResult}
                data-testid="comparison-reset-btn"
                onClick={handleResetBoth}
                aria-label="Reset both executions to step 1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Playback Speed Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
              {SPEEDS.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-mono text-[11px] transition-colors",
                    playbackSpeed === spd
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Synchronized Master Scrubber */}
          {maxCombinedSteps > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                Sync Timeline
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, maxCombinedSteps - 1)}
                value={Math.max(bruteStepIdx, optStepIdx)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setIsPlaying(false);
                  if (comparisonResult) {
                    setBruteStepIdx(
                      Math.min(
                        val,
                        Math.max(0, comparisonResult.brute_force.steps.length - 1)
                      )
                    );
                    setOptStepIdx(
                      Math.min(
                        val,
                        Math.max(0, comparisonResult.optimized.steps.length - 1)
                      )
                    );
                  }
                }}
                aria-label="Synchronized dual execution timeline"
                className="h-1.5 flex-1 cursor-pointer accent-primary"
              />
              <span className="font-mono text-[11px] text-subtle-foreground">
                Max {maxCombinedSteps} steps
              </span>
            </div>
          )}
        </div>
      </div>

      {errorBanner && (
        <div className="rounded-xl border border-accent-rose/40 bg-accent-rose/10 p-4 text-xs text-accent-rose">
          {errorBanner}
        </div>
      )}

      {/* Empirical Comparison Results Summary Banner */}
      {metrics ? (
        <div
          data-testid="comparison-metrics-summary"
          className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4 shadow-elevation-1 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {metrics.verdict_headline}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {metrics.outputs_match && (
                <Badge variant="emerald" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Identical Output Verified
                </Badge>
              )}
              <Badge variant="indigo" className="font-mono">
                {metrics.step_speedup_ratio}x Step Efficiency
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {metrics.verdict_details}
          </p>

          <div className="grid gap-3 sm:grid-cols-4 pt-1">
            <div className="rounded-lg border border-border bg-surface-1 p-3">
              <span className="text-[11px] text-muted-foreground">
                Brute-Force Steps
              </span>
              <p className="mt-1 font-mono text-lg font-semibold text-accent-rose tabular-nums">
                {metrics.brute_force_steps} steps
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-3">
              <span className="text-[11px] text-muted-foreground">
                Optimized Steps
              </span>
              <p className="mt-1 font-mono text-lg font-semibold text-accent-emerald tabular-nums">
                {metrics.optimized_steps} steps
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-3">
              <span className="text-[11px] text-muted-foreground">
                Steps Saved
              </span>
              <p className="mt-1 font-mono text-lg font-semibold text-primary tabular-nums">
                {metrics.steps_saved} ({metrics.step_reduction_pct}%)
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-3">
              <span className="text-[11px] text-muted-foreground">
                Measured Runtime (Brute vs Opt)
              </span>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground tabular-nums">
                {metrics.brute_force_duration_ms} ms vs{" "}
                {metrics.optimized_duration_ms} ms
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* Side-by-Side Execution Columns */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TraceRunnerColumn
          variant="brute"
          title="Brute-Force Solution"
          approach={activeScenario.bruteForce.approach}
          timeComplexity={activeScenario.bruteForce.timeComplexity}
          spaceComplexity={activeScenario.bruteForce.spaceComplexity}
          code={bruteCode}
          onCodeChange={setBruteCode}
          steps={comparisonResult?.brute_force.steps ?? []}
          currentStepIdx={bruteStepIdx}
          onStepIdxChange={setBruteStepIdx}
          totalSteps={comparisonResult?.brute_force.total_steps ?? 0}
          durationMs={comparisonResult?.brute_force.duration_ms ?? 0}
          status={comparisonResult?.brute_force.status ?? "idle"}
          stdout={comparisonResult?.brute_force.stdout ?? ""}
          errorMsg={comparisonResult?.brute_force.error?.message}
          lineOffset={lineOffset}
          onOpenInWorkspace={() => handleOpenInWorkspace("brute")}
        />

        <TraceRunnerColumn
          variant="optimized"
          title="Optimized Solution"
          approach={activeScenario.optimized.approach}
          timeComplexity={activeScenario.optimized.timeComplexity}
          spaceComplexity={activeScenario.optimized.spaceComplexity}
          code={optimizedCode}
          onCodeChange={setOptimizedCode}
          steps={comparisonResult?.optimized.steps ?? []}
          currentStepIdx={optStepIdx}
          onStepIdxChange={setOptStepIdx}
          totalSteps={comparisonResult?.optimized.total_steps ?? 0}
          durationMs={comparisonResult?.optimized.duration_ms ?? 0}
          status={comparisonResult?.optimized.status ?? "idle"}
          stdout={comparisonResult?.optimized.stdout ?? ""}
          errorMsg={comparisonResult?.optimized.error?.message}
          lineOffset={lineOffset}
          onOpenInWorkspace={() => handleOpenInWorkspace("optimized")}
        />
      </div>

      {/* Complexity Explanation & Key Insight Card */}
      <section className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <h2 className="text-heading-sm text-foreground">
            Complexity Analysis &amp; Algorithmic Insight
          </h2>
        </div>
        <p className="text-xs text-foreground font-medium">
          Key Insight: {activeScenario.keyInsight}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {activeScenario.complexityExplanation}
        </p>
      </section>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <ComparisonLabContent />
      </Suspense>
    </AppShell>
  );
}
