"use client";

import * as React from "react";
import {
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ListOrdered,
  RefreshCw,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useWorkspaceStore,
  type BottomDockTab,
} from "@/store/use-workspace-store";
import { cn } from "@/lib/utils";

export function OutputPanel() {
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const networkError = useWorkspaceStore((s) => s.networkError);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const activeBottomTab = useWorkspaceStore((s) => s.activeBottomTab);
  const setActiveBottomTab = useWorkspaceStore((s) => s.setActiveBottomTab);
  const jumpToStep = useWorkspaceStore((s) => s.jumpToStep);
  const runExecution = useWorkspaceStore((s) => s.runExecution);

  const [stdoutMode, setStdoutMode] = React.useState<"step" | "full">("step");
  const [showTraceback, setShowTraceback] = React.useState(false);

  const steps = traceResult?.steps ?? [];
  const hasSteps = steps.length > 0;
  const currentStep = hasSteps ? steps[currentStepIndex] ?? steps[0] : null;
  const errorDetail = traceResult?.error ?? null;
  const hasError = Boolean(errorDetail || networkError);

  const stepStdout = currentStep?.stdout_snapshot ?? traceResult?.stdout ?? "";
  const fullStdout = traceResult?.stdout ?? "";
  const displayedStdout =
    stdoutMode === "step" && hasSteps ? stepStdout : fullStdout;

  const stdoutLineCount = displayedStdout
    ? displayedStdout.replace(/\n$/, "").split("\n").length
    : 0;

  const activeTraceRowRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (activeBottomTab === "trace" && activeTraceRowRef.current) {
      activeTraceRowRef.current.scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeBottomTab, currentStepIndex]);

  const tabs: {
    id: BottomDockTab;
    label: string;
    icon: typeof Terminal;
    badge?: string | number;
    badgeTone?: "default" | "rose" | "emerald";
  }[] = [
    {
      id: "output",
      label: "Output",
      icon: Terminal,
      badge: fullStdout
        ? `${fullStdout.replace(/\n$/, "").split("\n").length}`
        : undefined,
      badgeTone: "emerald",
    },
    {
      id: "trace",
      label: "Execution Trace",
      icon: ListOrdered,
      badge: hasSteps ? steps.length : undefined,
      badgeTone: "default",
    },
    {
      id: "errors",
      label: "Errors",
      icon: AlertOctagon,
      badge: hasError ? 1 : undefined,
      badgeTone: "rose",
    },
  ];

  return (
    <section
      aria-label="Execution Output, Trace, and Errors"
      data-testid="output-panel"
      className="flex h-64 flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-elevation-1"
    >
      {/* Tab Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/60 px-3 py-1.5">
        <div
          role="tablist"
          aria-label="Execution output tabs"
          className="flex items-center gap-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeBottomTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`bottom-tab-${tab.id}`}
                onClick={() => setActiveBottomTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-surface-1 text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    tab.id === "errors" && hasError
                      ? "text-accent-rose"
                      : isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0 font-mono text-[10px]",
                      tab.badgeTone === "rose"
                        ? "bg-accent-rose/15 text-accent-rose"
                        : tab.badgeTone === "emerald"
                        ? "bg-accent-emerald/15 text-accent-emerald"
                        : "bg-surface-2 text-muted-foreground"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contextual Controls on Right of Tab Bar */}
        {activeBottomTab === "output" && hasSteps && fullStdout.length > 0 && (
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-1 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setStdoutMode("step")}
              className={cn(
                "rounded px-2 py-0.5 font-medium transition-colors",
                stdoutMode === "step"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Up to Step {currentStepIndex + 1}
            </button>
            <button
              type="button"
              onClick={() => setStdoutMode("full")}
              className={cn(
                "rounded px-2 py-0.5 font-medium transition-colors",
                stdoutMode === "full"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Full Output
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* TAB 1: OUTPUT */}
        {activeBottomTab === "output" && (
          <div
            className="h-full p-3 font-mono text-xs"
            data-testid="output-tab-content"
          >
            {!traceResult ? (
              <p className="text-muted-foreground">
                Standard output from Python <code>print()</code> statements will
                appear here once you click <strong>Run</strong>.
              </p>
            ) : displayedStdout ? (
              <div className="space-y-2">
                {currentStep?.stdout_delta && stdoutMode === "step" && (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-accent-emerald/30 bg-accent-emerald/10 px-2 py-0.5 font-sans text-[11px] text-accent-emerald">
                    <Sparkles className="h-3 w-3" />
                    <span>
                      Printed on Step {currentStep.step}:{" "}
                      <code className="font-mono">
                        {JSON.stringify(currentStep.stdout_delta.replace(/\n$/, ""))}
                      </code>
                    </span>
                  </div>
                )}
                <pre
                  className="whitespace-pre-wrap break-words rounded-lg border border-border-subtle bg-surface-code p-3 leading-6 text-foreground"
                  data-testid="stdout-pre"
                >
                  {displayedStdout}
                </pre>
                <p className="font-sans text-[11px] text-subtle-foreground">
                  {stdoutLineCount} {stdoutLineCount === 1 ? "line" : "lines"}{" "}
                  printed
                  {stdoutMode === "step" && hasSteps
                    ? ` through Step ${currentStepIndex + 1} of ${steps.length}`
                    : " across complete run"}
                </p>
              </div>
            ) : fullStdout && stdoutMode === "step" ? (
              <div className="space-y-1.5 font-sans text-xs text-muted-foreground">
                <p>
                  Nothing printed yet at{" "}
                  <strong className="text-foreground">
                    Step {currentStepIndex + 1}
                  </strong>
                  .
                </p>
                <p>
                  Step forward (<kbd className="font-mono">F10</kbd>) to reach{" "}
                  <code className="font-mono">print()</code> statements, or{" "}
                  <button
                    type="button"
                    onClick={() => setStdoutMode("full")}
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    view full program output
                  </button>
                  .
                </p>
              </div>
            ) : (
              <p className="font-sans text-xs text-muted-foreground">
                Program ran without producing any <code>print()</code> output.
              </p>
            )}
          </div>
        )}

        {/* TAB 2: EXECUTION TRACE */}
        {activeBottomTab === "trace" && (
          <div className="divide-y divide-border-subtle" data-testid="trace-tab-content">
            {!hasSteps ? (
              <div className="p-3 text-xs text-muted-foreground">
                Chronological history of executed lines will appear here after
                running your Python code.
              </div>
            ) : (
              steps.map((st, idx) => {
                const isSelected = idx === currentStepIndex;
                return (
                  <button
                    key={st.step}
                    ref={isSelected ? activeTraceRowRef : null}
                    type="button"
                    onClick={() => jumpToStep(idx)}
                    data-testid={`trace-row-${idx}`}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-primary/12 text-foreground"
                        : "hover:bg-surface-2/70 text-muted-foreground"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-subtle-foreground">
                        #{st.step}
                      </span>
                      <Badge
                        variant={
                          st.event === "exception"
                            ? "rose"
                            : st.event === "call"
                            ? "default"
                            : st.event === "return"
                            ? "violet"
                            : "secondary"
                        }
                        className="w-16 justify-center px-1 py-0 font-mono text-[9.5px] uppercase"
                      >
                        {st.event}
                      </Badge>
                      <span className="w-11 shrink-0 font-mono text-[11px] text-foreground">
                        L{st.line}
                      </span>
                      <code
                        className="truncate font-mono text-[11.5px] text-foreground"
                        style={{
                          paddingLeft: `${Math.min(st.call_depth, 6) * 10}px`,
                        }}
                      >
                        {st.source_line || st.function_name}
                      </code>
                    </div>

                    <div className="hidden shrink-0 items-center gap-1.5 md:flex">
                      {st.explanation.changes.slice(0, 2).map((ch, cIdx) => (
                        <span
                          key={cIdx}
                          className="max-w-[160px] truncate rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: ERRORS */}
        {activeBottomTab === "errors" && (
          <div className="p-3 text-xs" data-testid="errors-tab-content">
            {networkError ? (
              <div className="space-y-2.5 rounded-lg border border-accent-rose/35 bg-accent-rose/10 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="rose" className="font-mono">
                      BackendConnectionError
                    </Badge>
                    <span className="font-semibold text-foreground">
                      FastAPI Python Execution Service Offline
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    onClick={() => void runExecution()}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry Run
                  </Button>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {networkError}
                </p>
              </div>
            ) : errorDetail ? (
              <div className="space-y-3 rounded-lg border border-accent-rose/30 bg-accent-rose/[0.07] p-3.5">
                {/* Error Header: Type, Friendly Title, Line Jump */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="rose"
                      data-testid="error-type-badge"
                      className="font-mono text-[11px]"
                    >
                      {errorDetail.error_type}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      {errorDetail.friendly_title}
                    </span>
                    {errorDetail.line && (
                      <Badge variant="mono" className="px-1.5 py-0 text-[10.5px]">
                        Line {errorDetail.line}
                        {errorDetail.column ? `:${errorDetail.column}` : ""}
                      </Badge>
                    )}
                  </div>

                  {hasSteps && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => jumpToStep(steps.length - 1)}
                      className="h-6 text-[11px]"
                    >
                      Jump to Failing Step (#{steps.length})
                    </Button>
                  )}
                </div>

                {/* Raw Python Message */}
                <div className="rounded-md border border-border bg-surface-code px-3 py-2 font-mono text-[11.5px] text-accent-rose">
                  {errorDetail.error_type}: {errorDetail.message}
                </div>

                {/* Relevant Source Line */}
                {errorDetail.source_line && (
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
                      Relevant Source Line
                      {errorDetail.line ? ` (Line ${errorDetail.line})` : ""}
                    </span>
                    <pre className="overflow-x-auto rounded-md border border-border-subtle bg-surface-code px-3 py-1.5 font-mono text-xs text-foreground">
                      {errorDetail.source_line}
                    </pre>
                  </div>
                )}

                {/* Beginner-Friendly Explanation & Fix Suggestion */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-surface-1 p-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
                      What This Means
                    </p>
                    <p
                      className="mt-1 leading-relaxed text-foreground"
                      data-testid="error-friendly-explanation"
                    >
                      {errorDetail.friendly_explanation}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-1 p-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
                      How to Fix It
                    </p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {errorDetail.suggestion}
                    </p>
                  </div>
                </div>

                {/* Collapsible Traceback */}
                {errorDetail.traceback_lines.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowTraceback((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {showTraceback ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span>Technical Python Traceback</span>
                    </button>
                    {showTraceback && (
                      <pre className="mt-1.5 overflow-x-auto rounded-md border border-border-subtle bg-surface-code p-2.5 font-mono text-[11px] leading-5 text-muted-foreground">
                        {errorDetail.traceback_lines.join("")}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2/40 p-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
                <span>
                  {traceResult
                    ? "No syntax or runtime errors occurred during execution."
                    : "No errors recorded."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

