"use client";

import {
  Activity,
  BookOpenCheck,
  Cpu,
  FileCode2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/use-app-store";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { ALGORITHM_CATALOG, LEARNING_LESSONS } from "@/lib/data/catalog";

export function StatsGrid() {
  const hydrated = useHydrated();
  const demoStatsPreview = useAppStore((s) => s.demoStatsPreview);
  const setDemoStatsPreview = useAppStore((s) => s.setDemoStatsPreview);
  const projects = useProjectStore((s) => s.projects);
  const executionHistory = useProjectStore((s) => s.executionHistory);
  const exploredTopics = useProjectStore((s) => s.exploredTopics);
  const completedLessons = useProjectStore((s) => s.completedLessons);
  const exploredAlgorithms = useProjectStore((s) => s.exploredAlgorithms);
  const backendSynced = useProjectStore((s) => s.backendSynced);

  const showDemo = hydrated ? demoStatsPreview : false;

  const cards = [
    {
      label: "Total Executions",
      icon: Activity,
      value: showDemo ? "48" : String(executionHistory.length),
      statusBadge: showDemo
        ? "Demo Sample"
        : backendSynced
        ? "SQLite Synced"
        : "Python 3.12 Tracer",
      badgeVariant: showDemo ? ("amber" as const) : ("emerald" as const),
      note: showDemo
        ? "Illustrative sample figure — toggle off for real execution count"
        : `${executionHistory.length} program runs recorded in Execution History`,
    },
    {
      label: "Saved Projects",
      icon: FileCode2,
      value: showDemo ? "12" : String(projects.length),
      statusBadge: showDemo ? "Demo Sample" : `${projects.length} Saved`,
      badgeVariant: showDemo ? ("amber" as const) : ("secondary" as const),
      note: showDemo
        ? "Illustrative sample figure — not real user history"
        : `${projects.length} Python programs persisted across restarts`,
    },
    {
      label: "Lessons Completed",
      icon: BookOpenCheck,
      value: showDemo
        ? "9 / 12"
        : `${completedLessons.length} / ${LEARNING_LESSONS.length}`,
      statusBadge: showDemo ? "Demo Sample" : `${exploredTopics.length} Topics`,
      badgeVariant: showDemo ? ("amber" as const) : ("emerald" as const),
      note: showDemo
        ? "Illustrative sample figure — toggle off for real progress"
        : `${completedLessons.length} curriculum lessons & ${exploredTopics.length} topics studied`,
    },
    {
      label: "Algorithms Explored",
      icon: Cpu,
      value: showDemo
        ? "11 / 14"
        : `${exploredAlgorithms.length} / ${ALGORITHM_CATALOG.length}`,
      statusBadge: showDemo ? "Demo Sample" : "9 Categories",
      badgeVariant: showDemo ? ("amber" as const) : ("default" as const),
      note: showDemo
        ? "Illustrative sample figure — toggle off for local state"
        : "Updates as you inspect and run patterns in Algorithm Library",
    },
  ];

  return (
    <section aria-labelledby="dashboard-stats-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2
            id="dashboard-stats-heading"
            className="text-heading-sm text-foreground"
          >
            Workspace Statistics
          </h2>
          <Badge variant={showDemo ? "amber" : "secondary"}>
            {showDemo ? "Showing Labeled Demo Data" : "Honest Local Empty State"}
          </Badge>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
          <span>Preview sample metrics</span>
          <Switch
            checked={showDemo}
            onCheckedChange={setDemoStatsPreview}
            aria-label="Toggle labeled demo statistics preview"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-4 shadow-elevation-1 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {metric.label}
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-2 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="my-3 flex items-baseline justify-between gap-2">
                {hydrated ? (
                  <span className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                    {metric.value}
                  </span>
                ) : (
                  <Skeleton className="h-8 w-16" />
                )}
                <Badge variant={metric.badgeVariant}>{metric.statusBadge}</Badge>
              </div>

              <p className="text-[11px] text-subtle-foreground leading-snug">
                {metric.note}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

