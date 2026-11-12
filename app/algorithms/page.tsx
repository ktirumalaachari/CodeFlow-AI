"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Code2,
  Cpu,
  GitCompare,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ALGORITHM_CATALOG, ALGORITHM_CATEGORIES } from "@/lib/data/catalog";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

function AlgorithmsContent() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();

  const initialCategory = searchParams.get("category") ?? "All";
  const initialQuery = searchParams.get("q") ?? "";

  const [selectedCategory, setSelectedCategory] =
    React.useState<string>(initialCategory);
  const [query, setQuery] = React.useState<string>(initialQuery);
  const [expandedCodeId, setExpandedCodeId] = React.useState<string | null>(
    ALGORITHM_CATALOG[0]?.id ?? null
  );

  const exploredAlgorithms = useProjectStore((s) => s.exploredAlgorithms);
  const markAlgorithmExplored = useProjectStore((s) => s.markAlgorithmExplored);
  const backendSynced = useProjectStore((s) => s.backendSynced);
  const toast = useToastStore((s) => s.toast);

  const filtered = React.useMemo(() => {
    return ALGORITHM_CATALOG.filter((alg) => {
      const matchesCat =
        selectedCategory === "All" || alg.category === selectedCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        alg.title.toLowerCase().includes(q) ||
        alg.summary.toLowerCase().includes(q) ||
        alg.category.toLowerCase().includes(q) ||
        alg.keyInsight.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, selectedCategory]);

  return (
    <div className="space-y-6" data-testid="algorithms-page">
      <PageHeader
        title="Algorithm Library"
        badge={`${ALGORITHM_CATALOG.length} Runnable Blueprints · 9 Categories`}
        badgeVariant="default"
        description="Explore searching, sorting, pointer patterns, recursion, linear structures, trees, graphs, and dynamic programming with exact complexity profiles and runnable Python visualizations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={backendSynced ? "emerald" : "secondary"}>
              {hydrated ? exploredAlgorithms.length : 0} /{" "}
              {ALGORITHM_CATALOG.length} Explored
            </Badge>
            <Button asChild variant="secondary" size="sm">
              <Link href="/comparison">
                <GitCompare className="h-3.5 w-3.5" />
                Compare Brute Force vs Optimized
              </Link>
            </Button>
          </div>
        }
      />

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search algorithms, insights, or categories..."
            className="pl-9"
            data-testid="algorithms-search-input"
          />
        </div>

        <div
          className="flex flex-wrap gap-1.5"
          data-testid="algorithms-category-filters"
        >
          {ALGORITHM_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`alg-cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/14 text-primary"
                    : "border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Cpu}
          badge="No Filter Matches"
          badgeVariant="secondary"
          title="No algorithms match your current search"
          description="Clear the search filter or choose 'All' categories to view the complete algorithm library."
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setSelectedCategory("All");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((alg) => {
            const isExplored =
              hydrated && exploredAlgorithms.includes(alg.slug);
            const isCodeOpen = expandedCodeId === alg.id;

            return (
              <div
                key={alg.id}
                data-testid={`algorithm-card-${alg.slug}`}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-colors hover:border-border-strong"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{alg.category}</Badge>
                      <Badge
                        variant={
                          alg.difficulty === "Beginner"
                            ? "emerald"
                            : alg.difficulty === "Intermediate"
                            ? "default"
                            : "amber"
                        }
                      >
                        {alg.difficulty}
                      </Badge>
                    </div>
                    {isExplored && (
                      <Badge variant="emerald">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Explored
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h2 className="text-heading-md text-foreground">
                      {alg.title}
                    </h2>
                    <p className="mt-1.5 text-body-sm text-muted-foreground leading-relaxed">
                      {alg.summary}
                    </p>
                  </div>

                  {/* Visual Invariant */}
                  <div className="rounded-lg border border-border-subtle bg-surface-2/55 p-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Sparkles className="h-3 w-3 text-accent-violet" />
                      Visual Invariant:
                    </span>{" "}
                    {alg.keyInsight}
                  </div>

                  {/* Step-by-step Execution Mechanics */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                      Step-by-Step Mechanics
                    </p>
                    <ol className="space-y-1 text-xs text-muted-foreground">
                      {alg.howItWorksSteps.map((stepText, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[10px] font-semibold text-primary">
                            {idx + 1}
                          </span>
                          <span>{stepText}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Complexity Matrix */}
                  <div className="rounded-lg border border-border-subtle bg-surface-2/35 p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                          Best Time
                        </span>
                        <p className="font-mono font-semibold text-accent-emerald">
                          {alg.bestTimeComplexity ?? alg.timeComplexity}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                          Avg Time
                        </span>
                        <p className="font-mono font-semibold text-foreground">
                          {alg.timeComplexity}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                          Worst Time
                        </span>
                        <p className="font-mono font-semibold text-accent-amber">
                          {alg.worstTimeComplexity ?? alg.timeComplexity}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                          Space
                        </span>
                        <p className="font-mono font-semibold text-primary">
                          {alg.spaceComplexity}
                        </p>
                      </div>
                    </div>
                    <p className="border-t border-border-subtle pt-1.5 text-[11px] text-subtle-foreground">
                      {alg.complexityAssumption}
                    </p>
                  </div>

                  {/* Expandable Runnable Python Code Preview */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCodeId(isCodeOpen ? null : alg.id)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      {isCodeOpen
                        ? "Hide Python Implementation"
                        : "Inspect Runnable Python Implementation"}
                    </button>
                    {isCodeOpen && (
                      <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-border bg-surface-2/85 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                        {alg.codeExample}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      asChild
                      size="xs"
                      onClick={() => markAlgorithmExplored(alg.slug)}
                      data-testid={`open-workspace-${alg.slug}`}
                    >
                      <Link href={`/workspace?algorithm=${alg.slug}`}>
                        <Play className="h-3.5 w-3.5" />
                        Open &amp; Run in Workspace
                      </Link>
                    </Button>

                    {alg.comparisonScenarioId && (
                      <Button asChild size="xs" variant="secondary">
                        <Link
                          href={`/comparison?scenario=${alg.comparisonScenarioId}`}
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                          Compare
                        </Link>
                      </Button>
                    )}

                    <Button asChild size="xs" variant="ghost">
                      <Link href={`/tutor`}>
                        <Bot className="h-3.5 w-3.5" />
                        AI Tutor
                      </Link>
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="xs"
                    variant={isExplored ? "subtle" : "outline"}
                    onClick={() => {
                      markAlgorithmExplored(alg.slug);
                      if (!isExplored) {
                        toast({
                          title: "Algorithm marked explored",
                          description: `"${alg.title}" synced to your learning progress.`,
                          variant: "success",
                        });
                      }
                    }}
                    data-testid={`mark-explored-${alg.slug}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isExplored ? "Explored" : "Mark Explored"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AlgorithmsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <AlgorithmsContent />
      </Suspense>
    </AppShell>
  );
}
