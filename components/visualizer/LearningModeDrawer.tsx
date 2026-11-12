"use client";

import * as React from "react";
import {
  BookOpen,
  Clock,
  Code2,
  Cpu,
  GraduationCap,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  buildStepLearningCommentary,
  STRUCTURE_LEARNING_GUIDES,
} from "@/lib/visualizer/learning-content";
import type {
  ReconstructedStructureState,
  VisualizationStructureKind,
} from "@/types/visualizer";

interface LearningModeDrawerProps {
  kind: VisualizationStructureKind;
  activeState: ReconstructedStructureState | null;
  onClose: () => void;
}

export function LearningModeDrawer({
  kind,
  activeState,
  onClose,
}: LearningModeDrawerProps) {
  const guide =
    STRUCTURE_LEARNING_GUIDES[kind] ?? STRUCTURE_LEARNING_GUIDES.array;
  const stepCommentary = buildStepLearningCommentary(activeState);

  return (
    <aside
      aria-label="Data Structure Learning Guide"
      data-testid="visualizer-learning-drawer"
      className="border-t border-border bg-surface-2/65 p-3.5 text-xs"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/15 text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{guide.title}</h3>
              <Badge variant="emerald" className="px-1.5 py-0 text-[10px]">
                Learning Guide
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">{guide.tagline}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Learning Mode"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Live Step Commentary */}
      {stepCommentary && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-[11.5px] leading-relaxed text-foreground">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            <strong>Current Snapshot:</strong> {stepCommentary}
          </span>
        </div>
      )}

      {/* Main Educational Grid */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {/* Definition & When Used */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-1 p-3">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Concept &amp; Mental Model</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            {guide.definition}
          </p>

          <div className="pt-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
              When Engineers Use It
            </span>
            <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
              {guide.whenUsed.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Complexity Table with Explicit Assumptions */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-1 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-accent-amber" />
              <span>Time &amp; Space Complexity</span>
            </div>
            <Badge variant="mono" className="px-1.5 py-0 text-[10px]">
              Space: {guide.spaceComplexity}
            </Badge>
          </div>

          <div className="space-y-1.5">
            {guide.operations.map((op) => (
              <div
                key={op.operation}
                className="rounded-md border border-border-subtle bg-surface-2/60 px-2.5 py-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-mono text-[11px] font-medium text-foreground">
                    {op.operation}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                    <span className="rounded bg-accent-emerald/15 px-1.5 py-0.5 text-accent-emerald">
                      {op.averageCase}
                    </span>
                    {op.worstCase && (
                      <span className="rounded bg-accent-amber/15 px-1.5 py-0.5 text-accent-amber">
                        worst {op.worstCase}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  Assumption: {op.assumption}
                </p>
              </div>
            ))}
          </div>

          <p className="flex items-center gap-1 text-[10.5px] text-subtle-foreground">
            <Cpu className="h-3 w-3 shrink-0" />
            <span>{guide.spaceAssumption}</span>
          </p>
        </div>
      </div>

      {/* Bottom Row: Python Snippet + Key Takeaways */}
      <div className="mt-2.5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="rounded-lg border border-border bg-surface-code p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
            <Code2 className="h-3 w-3 text-accent-emerald" />
            <span>Idiomatic Python Pattern</span>
          </div>
          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground">
            <code>{guide.pythonSnippet}</code>
          </pre>
        </div>

        <div className="rounded-lg border border-border bg-surface-1 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-subtle-foreground">
            <Lightbulb className="h-3 w-3 text-accent-amber" />
            <span>Key Interview &amp; Debugging Takeaways</span>
          </div>
          <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            {guide.keyTakeaways.map((tip) => (
              <li key={tip} className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-emerald" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

