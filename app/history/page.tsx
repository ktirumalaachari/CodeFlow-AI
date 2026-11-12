"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  Code2,
  FolderCode,
  History,
  Play,
  Search,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatRelativeTime } from "@/lib/utils";

export default function HistoryPage() {
  const hydrated = useHydrated();
  const executionHistory = useProjectStore((s) => s.executionHistory);
  const backendSynced = useProjectStore((s) => s.backendSynced);
  const deleteHistoryEntry = useProjectStore((s) => s.deleteHistoryEntry);
  const clearExecutionHistory = useProjectStore((s) => s.clearExecutionHistory);
  const toast = useToastStore((s) => s.toast);

  const [query, setQuery] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return executionHistory;
    return executionHistory.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.sourceCode.toLowerCase().includes(q)
    );
  }, [executionHistory, query]);

  return (
    <AppShell>
      <div className="space-y-6" data-testid="history-page">
        <PageHeader
          title="Execution History"
          badge={
            backendSynced ? "SQLite + Browser Synced" : "Local Browser Synced"
          }
          badgeVariant={backendSynced ? "emerald" : "secondary"}
          description="Chronological log of Python workspace and comparison lab executions with real step counts, runtime durations, and one-click workspace replay."
          actions={
            hydrated &&
            executionHistory.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clearExecutionHistory();
                  toast({
                    title: "Execution history cleared",
                    description:
                      "Removed recorded runs from browser and SQLite store.",
                    variant: "info",
                  });
                }}
                data-testid="clear-history-btn"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear History
              </Button>
            )
          }
        />

        {!hydrated ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : executionHistory.length === 0 ? (
          <EmptyState
            icon={History}
            badge="No Recorded Runs Yet"
            badgeVariant="secondary"
            title="Your Execution Timeline Is Currently Empty"
            description="Run any Python program in the Workspace IDE or Comparison Lab to record real step counts, runtime durations, and replayable source snapshots."
            actions={
              <>
                <Button asChild>
                  <Link href="/workspace">
                    <Play className="h-4 w-4" />
                    Run Code in Workspace
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/projects">
                    <FolderCode className="h-4 w-4" />
                    View Saved Projects
                  </Link>
                </Button>
              </>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter runs by title, status, or code..."
                  className="pl-9"
                  data-testid="history-search-input"
                />
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                Showing {filtered.length} of {executionHistory.length} recorded
                runs
              </span>
            </div>

            <div className="space-y-3" data-testid="history-runs-list">
              {filtered.map((entry) => {
                const isSuccess = entry.status === "completed";
                const isExpanded = expandedId === entry.id;

                return (
                  <div
                    key={entry.id}
                    data-testid={`history-entry-${entry.id}`}
                    className="rounded-xl border border-border bg-surface-1 p-4 shadow-elevation-1 transition-colors hover:border-border-strong space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-heading-sm text-foreground">
                            {entry.title}
                          </h2>
                          <Badge
                            variant={isSuccess ? "emerald" : "amber"}
                          >
                            {entry.status}
                          </Badge>
                          <Badge variant="mono">
                            {entry.totalSteps} steps
                          </Badge>
                          <Badge variant="mono">
                            {entry.durationMs.toFixed(2)} ms
                          </Badge>
                          <Badge variant="secondary">
                            {entry.executionMode}
                          </Badge>
                        </div>
                        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(entry.createdAtIso)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="xs">
                          <Link href={`/workspace?history=${entry.id}`}>
                            <Play className="h-3.5 w-3.5" />
                            Replay in Workspace
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : entry.id)
                          }
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          {isExpanded ? "Hide Code" : "View Code"}
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => deleteHistoryEntry(entry.id)}
                          aria-label={`Delete run ${entry.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {(entry.stdoutPreview || entry.errorTitle) && (
                      <div className="rounded-lg border border-border-subtle bg-surface-2/55 px-3 py-2 font-mono text-xs text-muted-foreground">
                        {entry.errorTitle ? (
                          <span className="text-destructive">
                            Error: {entry.errorTitle}
                          </span>
                        ) : (
                          <span>
                            stdout: {entry.stdoutPreview.trim() || "(no stdout)"}
                          </span>
                        )}
                      </div>
                    )}

                    {isExpanded && (
                      <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-surface-2/85 p-3 font-mono text-xs leading-relaxed text-foreground">
                        {entry.sourceCode}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
