"use client";

import Link from "next/link";
import {
  ArrowRight,
  Binary,
  Boxes,
  CheckCircle2,
  GitFork,
  Hash,
  Link2,
  MoveHorizontal,
  Network,
  Repeat,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QUICK_START_TOPICS } from "@/lib/data/catalog";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";
import type { AccentTone } from "@/types";
import { cn } from "@/lib/utils";

const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  "python-basics": Terminal,
  arrays: Boxes,
  "two-pointers": MoveHorizontal,
  "sliding-window": Binary,
  "hash-maps": Hash,
  "linked-lists": Link2,
  "binary-trees": GitFork,
  graphs: Network,
  recursion: Repeat,
};

const TONE_CLASSES: Record<AccentTone, string> = {
  indigo: "border-primary/25 bg-primary/12 text-primary",
  emerald: "border-accent-emerald/25 bg-accent-emerald/12 text-accent-emerald",
  amber: "border-accent-amber/25 bg-accent-amber/12 text-accent-amber",
  violet: "border-accent-violet/25 bg-accent-violet/12 text-accent-violet",
  rose: "border-accent-rose/25 bg-accent-rose/12 text-accent-rose",
};

export function QuickStartGrid() {
  const hydrated = useHydrated();
  const exploredTopics = useProjectStore((s) => s.exploredTopics);
  const markTopicExplored = useProjectStore((s) => s.markTopicExplored);

  return (
    <section aria-labelledby="quick-start-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="quick-start-heading"
            className="text-heading-sm text-foreground"
          >
            Quick Start Topics
          </h2>
          <p className="text-xs text-muted-foreground">
            Select a topic to open its corresponding curriculum module or
            workspace blueprint.
          </p>
        </div>
        <Badge variant="secondary">9 Core Topics</Badge>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_START_TOPICS.map((topic) => {
          const Icon = TOPIC_ICON_MAP[topic.slug] ?? Terminal;
          const isExplored = hydrated && exploredTopics.includes(topic.slug);

          return (
            <Link
              key={topic.slug}
              href={topic.targetRoute}
              onClick={() => markTopicExplored(topic.slug)}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-4 shadow-elevation-1 transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border",
                      TONE_CLASSES[topic.accent]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isExplored && (
                      <span
                        title="Explored in local workspace"
                        className="inline-flex items-center gap-1 rounded border border-accent-emerald/30 bg-accent-emerald/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-emerald"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Explored
                      </span>
                    )}
                    <Badge variant="secondary">{topic.difficulty}</Badge>
                  </div>
                </div>

                <h3 className="mt-3 text-heading-sm text-foreground group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {topic.subtitle}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[11px] text-subtle-foreground">
                <span className="font-mono">~{topic.estimatedMinutes} min</span>
                <span className="inline-flex items-center gap-1 font-medium text-muted-foreground group-hover:text-foreground">
                  Open
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

