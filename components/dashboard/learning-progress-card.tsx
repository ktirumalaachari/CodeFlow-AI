"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LEARNING_LESSONS, QUICK_START_TOPICS } from "@/lib/data/catalog";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";

export function LearningProgressCard() {
  const hydrated = useHydrated();
  const exploredTopics = useProjectStore((s) => s.exploredTopics);
  const completedLessons = useProjectStore((s) => s.completedLessons);
  const backendSynced = useProjectStore((s) => s.backendSynced);
  const markTopicExplored = useProjectStore((s) => s.markTopicExplored);

  const totalTopics = QUICK_START_TOPICS.length + LEARNING_LESSONS.length;
  const exploredCount = hydrated
    ? exploredTopics.length + completedLessons.length
    : 0;
  const percentage = Math.round((exploredCount / totalTopics) * 100);

  const studiedTopicObjects = hydrated
    ? QUICK_START_TOPICS.filter((t) => exploredTopics.includes(t.slug))
    : [];

  const suggestedTopics = hydrated
    ? QUICK_START_TOPICS.filter((t) => !exploredTopics.includes(t.slug)).slice(
        0,
        3
      )
    : QUICK_START_TOPICS.slice(3, 6);

  return (
    <section
      aria-labelledby="learning-progress-heading"
      className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-emerald/25 bg-accent-emerald/12 text-accent-emerald">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2
              id="learning-progress-heading"
              className="text-heading-sm text-foreground"
            >
              Learning Progress
            </h2>
            <p className="text-xs text-muted-foreground">
              Tracked locally as you explore curriculum &amp; quick-start topics
            </p>
          </div>
        </div>
        <Badge variant={backendSynced ? "emerald" : "secondary"}>
          {backendSynced ? "SQLite + Browser Synced" : "Local Progress"}
        </Badge>
      </div>

      {/* Progress Bar & Topics Explored Metric */}
      <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            Lessons &amp; Topics Mastered
          </span>
          {hydrated ? (
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {exploredCount} / {totalTopics} ({percentage}%)
            </span>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-emerald transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Recently Studied Concepts */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recently Studied Concepts
          </h3>
          {!hydrated ? (
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          ) : studiedTopicObjects.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface-2/40 p-3 text-xs text-muted-foreground">
              No concepts studied yet in this browser session. Select any Quick
              Start card above to begin!
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {studiedTopicObjects.map((topic) => (
                <Link
                  key={topic.slug}
                  href={topic.targetRoute}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                  {topic.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Next Topics */}
        <div className="space-y-2.5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent-violet" />
            Suggested Next Topics
          </h3>
          {suggestedTopics.length === 0 ? (
            <div className="rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 p-3 text-xs text-accent-emerald">
              All 9 Quick Start topics explored! Head to the Algorithm Library
              for deeper complexity patterns.
            </div>
          ) : (
            <div className="space-y-1.5">
              {suggestedTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={topic.targetRoute}
                  onClick={() => markTopicExplored(topic.slug)}
                  className="group flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2/45 px-3 py-2 text-xs transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate font-medium text-foreground">
                      {topic.title}
                    </span>
                    <span className="text-[10px] text-subtle-foreground">
                      · {topic.difficulty}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

