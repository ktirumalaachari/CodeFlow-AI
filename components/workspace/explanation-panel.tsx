"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CornerDownLeft,
  HelpCircle,
  Lightbulb,
  Play,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { useTutorStore } from "@/store/use-tutor-store";

export function ExplanationPanel() {
  const status = useWorkspaceStore((s) => s.status);
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const networkError = useWorkspaceStore((s) => s.networkError);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const askTutor = useTutorStore((s) => s.askTutor);
  const isStreaming = useTutorStore((s) => s.isStreaming);

  const steps = traceResult?.steps ?? [];
  const currentStep =
    steps.length > 0 ? steps[currentStepIndex] ?? steps[0] : null;
  const errorDetail = traceResult?.error ?? null;

  return (
    <section
      aria-label="What's Happening Explanation"
      data-testid="explanation-panel"
      className="rounded-xl border border-border bg-surface-1 p-3.5 shadow-elevation-1"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-primary/25 bg-primary/12 text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-xs font-semibold tracking-tight text-foreground">
            What&apos;s Happening?
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {currentStep ? (
            <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
              Step {currentStep.step} · L{currentStep.line}
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              Step Guide
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mt-2.5">
        {networkError ? (
          <div className="rounded-lg border border-accent-rose/30 bg-accent-rose/10 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-accent-rose">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Cannot Reach Python Execution Service</span>
            </div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {networkError}
            </p>
          </div>
        ) : currentStep ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2.5"
            >
              {/* Active Source Statement */}
              {currentStep.source_line && (
                <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border/80 bg-surface-code px-3 py-1.5 font-mono text-xs text-foreground shadow-xs">
                  <span className="flex h-5 items-center justify-center rounded bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                    L{currentStep.line}
                  </span>
                  <code className="whitespace-pre font-semibold">{currentStep.source_line}</code>
                </div>
              )}

              {/* Output Pill if this step printed stdout */}
              {currentStep.stdout_delta && (
                <div className="flex items-center gap-2 rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-1.5 font-mono text-xs text-accent-emerald">
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Printed output: <strong>&apos;{currentStep.stdout_delta.replace(/\n$/, "")}&apos;</strong>
                  </span>
                </div>
              )}

              {/* Headline & Beginner-Friendly Explanation */}
              <div className="space-y-1 rounded-lg border border-border/60 bg-surface-2/30 p-2.5">
                <p
                  className="text-xs font-semibold text-foreground"
                  data-testid="explanation-headline"
                >
                  {currentStep.explanation.headline}
                </p>
                <p
                  className="text-xs leading-relaxed text-muted-foreground"
                  data-testid="explanation-details"
                >
                  {currentStep.explanation.details}
                </p>
              </div>

              {/* Return Value Pill */}
              {currentStep.event === "return" &&
                currentStep.return_value !== null &&
                currentStep.return_value !== undefined && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-1 font-mono text-[11px] text-accent-violet">
                    <CornerDownLeft className="h-3 w-3 shrink-0" />
                    <span>
                      Returned: <strong>{currentStep.return_value}</strong>
                    </span>
                  </div>
                )}

              {/* State Change Chips */}
              {currentStep.explanation.changes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {currentStep.explanation.changes.map((changeText, idx) => (
                    <span
                      key={`${idx}-${changeText}`}
                      className="inline-flex items-center gap-1 rounded-full border border-accent-emerald/25 bg-accent-emerald/10 px-2.5 py-0.5 font-mono text-[10.5px] text-accent-emerald"
                    >
                      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                      <span>{changeText}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick AI Tutor Triggers */}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  disabled={isStreaming}
                  data-testid="explanation-ask-step-btn"
                  onClick={() => void askTutor({ action: "explain_step" })}
                  className="h-6 gap-1 rounded-full px-2.5 text-[11px] hover:border-accent-violet/40 hover:bg-accent-violet/10 hover:text-accent-violet transition-all"
                >
                  <Sparkles className="h-3 w-3 text-accent-violet" />
                  <span>AI Explain Step</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isStreaming}
                  data-testid="explanation-ask-why-btn"
                  onClick={() => void askTutor({ action: "explain_why" })}
                  className="h-6 gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:text-foreground transition-all"
                >
                  <HelpCircle className="h-3 w-3 text-primary" />
                  <span>Why?</span>
                </Button>
                {errorDetail && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    disabled={isStreaming}
                    data-testid="explanation-debug-error-btn"
                    onClick={() => void askTutor({ action: "debug_error" })}
                    className="h-6 gap-1 rounded-full px-2.5 text-[11px]"
                  >
                    <Bug className="h-3 w-3" />
                    <span>Debug Error</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : errorDetail ? (
          <div className="space-y-2 rounded-lg border border-accent-rose/30 bg-accent-rose/10 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-accent-rose">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorDetail.friendly_title}</span>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                disabled={isStreaming}
                data-testid="explanation-debug-error-btn"
                onClick={() => void askTutor({ action: "debug_error" })}
                className="h-6 gap-1 px-2 text-[11px]"
              >
                <Bug className="h-3 w-3" />
                <span>AI Debug Error</span>
              </Button>
            </div>
            <p className="leading-relaxed text-foreground/90">
              {errorDetail.friendly_explanation}
            </p>
            {errorDetail.suggestion && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Tip:</strong>{" "}
                {errorDetail.suggestion}
              </p>
            )}
          </div>
        ) : status === "running" ? (
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2/60 p-3 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
            <span>
              Executing Python program in isolated worker and capturing frame
              snapshots…
            </span>
          </div>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-3 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Play className="h-3 w-3 text-accent-emerald" />
              <span>Ready to visualize every step</span>
            </div>
            <p className="mt-1">
              Press{" "}
              <strong className="font-medium text-foreground">Run</strong> to
              execute your code. As you step forward and backward, this panel
              explains in plain English what each Python statement checks,
              computes, and updates.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

