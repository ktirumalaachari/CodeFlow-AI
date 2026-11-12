"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  FilePlus2,
  FlaskConical,
  GitCompare,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

export function QuickActionsGrid() {
  const setCreateProjectModalOpen = useAppStore(
    (s) => s.setCreateProjectModalOpen
  );

  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="quick-actions-heading"
          className="text-heading-sm text-foreground"
        >
          Quick Actions
        </h2>
        <span className="text-xs text-subtle-foreground">
          Direct workflows
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Start from Scratch */}
        <button
          type="button"
          onClick={() => setCreateProjectModalOpen(true)}
          className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left shadow-elevation-1 transition-all duration-150 hover:border-primary/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary">
              <FilePlus2 className="h-4 w-4" />
            </div>
            <p className="pt-1 text-heading-sm text-foreground">
              Start from Scratch
            </p>
            <p className="text-xs text-muted-foreground">
              Create a new local Python draft project
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>

        {/* 2. Try Sample Code */}
        <Link
          href="/workspace?template=sliding-window"
          className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left shadow-elevation-1 transition-all duration-150 hover:border-accent-emerald/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-emerald/25 bg-accent-emerald/12 text-accent-emerald">
              <FlaskConical className="h-4 w-4" />
            </div>
            <p className="pt-1 text-heading-sm text-foreground">
              Try Sample Code
            </p>
            <p className="text-xs text-muted-foreground">
              Inspect a pre-configured sliding window blueprint
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-emerald" />
        </Link>

        {/* 3. Browse Algorithms */}
        <Link
          href="/algorithms"
          className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left shadow-elevation-1 transition-all duration-150 hover:border-accent-amber/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-amber/25 bg-accent-amber/12 text-accent-amber">
              <Compass className="h-4 w-4" />
            </div>
            <p className="pt-1 text-heading-sm text-foreground">
              Browse Algorithms
            </p>
            <p className="text-xs text-muted-foreground">
              Filter DSA patterns by category & complexity
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-amber" />
        </Link>

        {/* 4. Compare Solutions */}
        <Link
          href="/comparison"
          className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left shadow-elevation-1 transition-all duration-150 hover:border-accent-violet/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-violet/25 bg-accent-violet/12 text-accent-violet">
              <GitCompare className="h-4 w-4" />
            </div>
            <p className="pt-1 text-heading-sm text-foreground">
              Compare Solutions
            </p>
            <p className="text-xs text-muted-foreground">
              Review Brute Force vs. Optimized tradeoffs
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-violet" />
        </Link>
      </div>
    </section>
  );
}

