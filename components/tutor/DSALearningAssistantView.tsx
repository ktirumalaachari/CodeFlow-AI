"use client";

import * as React from "react";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Eye,
  HelpCircle,
  Lightbulb,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAMPLE_PROGRAMS } from "@/lib/data/samples";
import { useTutorStore } from "@/store/use-tutor-store";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { useToastStore } from "@/store/use-toast-store";
import { cn } from "@/lib/utils";

interface DSALearningAssistantViewProps {
  compact?: boolean;
  onNavigateToWorkspace?: () => void;
}

export function DSALearningAssistantView({
  compact = false,
  onNavigateToWorkspace,
}: DSALearningAssistantViewProps) {
  const dsaTopics = useTutorStore((s) => s.dsaTopics);
  const selectedSlug = useTutorStore((s) => s.selectedDsaTopicSlug);
  const setSelectedDsaTopicSlug = useTutorStore(
    (s) => s.setSelectedDsaTopicSlug
  );
  const askTutor = useTutorStore((s) => s.askTutor);

  const loadSampleProgram = useWorkspaceStore((s) => s.loadSampleProgram);
  const setSourceCode = useWorkspaceStore((s) => s.setSourceCode);
  const setProjectName = useWorkspaceStore((s) => s.setProjectName);
  const runExecution = useWorkspaceStore((s) => s.runExecution);
  const toast = useToastStore((s) => s.toast);

  const [revealedHintCount, setRevealedHintCount] = React.useState(1);

  const activeTopic = React.useMemo(
    () =>
      dsaTopics.find((t) => t.slug === selectedSlug) ??
      dsaTopics[0],
    [dsaTopics, selectedSlug]
  );

  React.useEffect(() => {
    setRevealedHintCount(1);
  }, [selectedSlug]);

  if (!activeTopic) return null;

  const handleLoadTopicSample = () => {
    const sample = SAMPLE_PROGRAMS.find(
      (s) => s.slug === activeTopic.sample_slug
    );
    if (sample) {
      loadSampleProgram(sample);
      void runExecution();
      toast({
        title: `Loaded ${sample.title}`,
        description: "Sample loaded and executed in the Python trace engine.",
        variant: "success",
      });
      onNavigateToWorkspace?.();
    }
  };

  const handleLoadPracticeCode = (title: string, starterCode: string) => {
    setProjectName(title);
    setSourceCode(starterCode);
    void runExecution();
    toast({
      title: `Practice loaded: ${title}`,
      description: "Starter code loaded into Monaco Editor and traced.",
      variant: "info",
    });
    onNavigateToWorkspace?.();
  };

  return (
    <div
      className="space-y-4"
      data-testid="dsa-learning-assistant-view"
    >
      {/* Topic Selector Pills (All 11 Required Topics) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
            11 Core DSA Learning Modules
          </span>
          <Badge variant="indigo" className="text-[10px]">
            {activeTopic.category}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {dsaTopics.map((topic) => {
            const isSelected = topic.slug === activeTopic.slug;
            return (
              <button
                key={topic.slug}
                type="button"
                data-testid={`dsa-topic-pill-${topic.slug}`}
                onClick={() => setSelectedDsaTopicSlug(topic.slug)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  isSelected
                    ? "border-primary bg-primary/15 text-primary shadow-sm"
                    : "border-border bg-surface-2/60 text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                {topic.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic Header & Concept Explanation */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {activeTopic.title}
              </h3>
              <Badge
                variant={
                  activeTopic.difficulty === "Beginner"
                    ? "emerald"
                    : activeTopic.difficulty === "Intermediate"
                    ? "indigo"
                    : "amber"
                }
                className="text-[10px]"
              >
                {activeTopic.difficulty}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeTopic.summary}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="xs"
              variant="secondary"
              data-testid="dsa-load-sample-btn"
              onClick={handleLoadTopicSample}
            >
              <Play className="h-3 w-3 text-accent-emerald" />
              <span>Run Example</span>
            </Button>
            <Button
              type="button"
              size="xs"
              variant="default"
              data-testid="dsa-ask-tutor-topic-btn"
              onClick={() =>
                void askTutor({
                  action: "dsa_topic",
                  topicSlug: activeTopic.slug,
                })
              }
            >
              <Sparkles className="h-3 w-3" />
              <span>Ask Tutor</span>
            </Button>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-foreground/90">
          {activeTopic.concept_explanation}
        </p>

        {/* How It Works Step-by-Step */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Step-by-Step Mechanics</span>
          </div>
          <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
            {activeTopic.how_it_works_steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Complexity & Explicit Assumptions */}
        <div className="grid gap-2 pt-1 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-surface-1 p-2.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Time Complexity
            </span>
            <p className="mt-0.5 font-mono text-[11px] text-accent-emerald">
              {activeTopic.time_complexity}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-1 p-2.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Space Complexity
            </span>
            <p className="mt-0.5 font-mono text-[11px] text-primary">
              {activeTopic.space_complexity}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-subtle-foreground">
          <strong className="text-muted-foreground">Assumption:</strong>{" "}
          {activeTopic.complexity_assumptions}
        </p>
      </div>

      {/* Brute-Force vs. Optimized Comparison */}
      <div
        className="rounded-xl border border-border bg-surface-2/40 p-3.5 space-y-2.5"
        data-testid="dsa-brute-vs-optimized"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Zap className="h-3.5 w-3.5 text-accent-amber" />
            <span>
              Brute-Force vs. Optimized: {activeTopic.comparison.problem_title}
            </span>
          </div>
        </div>

        <div className={cn("grid gap-2.5", compact ? "grid-cols-1" : "md:grid-cols-2")}>
          {/* Brute Force Card */}
          <div className="rounded-lg border border-accent-rose/25 bg-accent-rose/[0.04] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-accent-rose">
                Brute-Force Approach
              </span>
              <span className="font-mono text-[10px] text-accent-rose">
                {activeTopic.comparison.brute_force_time} ·{" "}
                {activeTopic.comparison.brute_force_space}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {activeTopic.comparison.brute_force_approach}
            </p>
            <pre className="overflow-x-auto rounded border border-border-subtle bg-surface-code p-2 font-mono text-[10px] leading-relaxed text-foreground">
              <code>{activeTopic.comparison.brute_force_code}</code>
            </pre>
          </div>

          {/* Optimized Card */}
          <div className="rounded-lg border border-accent-emerald/25 bg-accent-emerald/[0.04] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-accent-emerald">
                Optimized Approach
              </span>
              <span className="font-mono text-[10px] text-accent-emerald">
                {activeTopic.comparison.optimized_time} ·{" "}
                {activeTopic.comparison.optimized_space}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {activeTopic.comparison.optimized_approach}
            </p>
            <pre className="overflow-x-auto rounded border border-border-subtle bg-surface-code p-2 font-mono text-[10px] leading-relaxed text-foreground">
              <code>{activeTopic.comparison.optimized_code}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border border-primary/25 bg-primary/[0.06] px-2.5 py-2 text-[11px] text-foreground">
          <strong className="text-primary">Key Optimization Insight:</strong>{" "}
          {activeTopic.comparison.key_insight}
        </div>
      </div>

      {/* Progressive Hints Drawer */}
      <div
        className="rounded-xl border border-border bg-surface-2/40 p-3.5 space-y-2"
        data-testid="dsa-progressive-hints"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-accent-amber" />
            <span>
              Progressive Hints ({revealedHintCount} /{" "}
              {activeTopic.progressive_hints.length})
            </span>
          </div>
          {revealedHintCount < activeTopic.progressive_hints.length && (
            <Button
              type="button"
              size="xs"
              variant="outline"
              data-testid="dsa-reveal-next-hint-btn"
              onClick={() =>
                setRevealedHintCount((c) =>
                  Math.min(activeTopic.progressive_hints.length, c + 1)
                )
              }
            >
              <Eye className="h-3 w-3" />
              <span>Reveal Next Hint</span>
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          {activeTopic.progressive_hints
            .slice(0, revealedHintCount)
            .map((hint, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-2 text-xs text-muted-foreground"
              >
                {hint}
              </div>
            ))}
        </div>
      </div>

      {/* Practice Questions */}
      {activeTopic.practice_questions.map((pq) => (
        <div
          key={pq.id}
          data-testid={`dsa-practice-${pq.id}`}
          className="rounded-xl border border-border bg-surface-2/40 p-3.5 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-accent-violet" />
              <span className="text-xs font-semibold text-foreground">
                Practice: {pq.title}
              </span>
              <Badge variant="violet" className="text-[10px]">
                {pq.target_complexity}
              </Badge>
            </div>
            <Button
              type="button"
              size="xs"
              variant="secondary"
              data-testid="dsa-load-practice-btn"
              onClick={() => handleLoadPracticeCode(pq.title, pq.starter_code)}
            >
              <Code2 className="h-3 w-3 text-primary" />
              <span>Try in Workspace</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{pq.prompt}</p>
        </div>
      ))}
    </div>
  );
}

