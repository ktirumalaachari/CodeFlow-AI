"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Database,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { codeflowApi } from "@/lib/api/client";
import type { SecurityAuditResponsePayload } from "@/types/api";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const preferences = useProjectStore((s) => s.preferences);
  const updatePreferences = useProjectStore((s) => s.updatePreferences);
  const projects = useProjectStore((s) => s.projects);
  const executionHistory = useProjectStore((s) => s.executionHistory);
  const exploredTopics = useProjectStore((s) => s.exploredTopics);
  const completedLessons = useProjectStore((s) => s.completedLessons);
  const backendSynced = useProjectStore((s) => s.backendSynced);
  const resetDemoProjects = useProjectStore((s) => s.resetDemoProjects);
  const resetLearningProgress = useProjectStore((s) => s.resetLearningProgress);
  const clearExecutionHistory = useProjectStore((s) => s.clearExecutionHistory);
  const toast = useToastStore((s) => s.toast);

  const [nameInput, setNameInput] = React.useState(preferences.displayName);
  const [securityAudit, setSecurityAudit] =
    React.useState<SecurityAuditResponsePayload | null>(null);
  const [auditLoading, setAuditLoading] = React.useState(false);

  React.useEffect(() => {
    if (hydrated) {
      setNameInput(preferences.displayName);
    }
  }, [hydrated, preferences.displayName]);

  const loadSecurityAudit = React.useCallback(async () => {
    setAuditLoading(true);
    try {
      const report = await codeflowApi.getSecurityAudit();
      setSecurityAudit(report);
    } catch {
      setSecurityAudit(null);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSecurityAudit();
  }, [loadSecurityAudit]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim() || "Developer Guest";
    updatePreferences({ displayName: cleaned });
    toast({
      title: "Workspace profile updated",
      description: `Display name saved as "${cleaned}".`,
      variant: "success",
    });
  };

  const activeTheme = hydrated ? resolvedTheme : "dark";

  return (
    <AppShell>
      <div className="space-y-8" data-testid="settings-page">
        <PageHeader
          title="Settings & Security Audit"
          badge={backendSynced ? "SQLite + Browser Synced" : "Local Preferences"}
          badgeVariant={backendSynced ? "emerald" : "secondary"}
          description="Customize theme mode, workspace display preferences, SQLite persistence state, and inspect the Python execution sandbox security audit."
        />

        {/* 1. Appearance / Theme Management */}
        <section className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-4">
          <div>
            <h2 className="text-heading-sm text-foreground">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Dark mode is enabled by default. Your selection persists
              automatically across sessions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              data-testid="theme-dark-btn"
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 text-left transition-all",
                activeTheme === "dark"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-surface-2/50 hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-[#0D0E12] text-white">
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-foreground">
                    Dark Theme
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deep charcoal default
                  </p>
                </div>
              </div>
              {activeTheme === "dark" && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTheme("light")}
              data-testid="theme-light-btn"
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 text-left transition-all",
                activeTheme === "light"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-surface-2/50 hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-zinc-900">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-foreground">
                    Light Theme
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Crisp high-contrast daylight
                  </p>
                </div>
              </div>
              {activeTheme === "light" && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          </div>
        </section>

        {/* 2. Python Execution Engine Security Audit */}
        <section
          className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-4"
          data-testid="security-audit-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {securityAudit?.docker_isolation_verified ? (
                <ShieldCheck className="h-4 w-4 text-accent-emerald" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-accent-amber" />
              )}
              <h2 className="text-heading-sm text-foreground">
                Python Execution Security Audit
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {securityAudit && (
                <Badge
                  variant={
                    securityAudit.production_deployment_blocked
                      ? "amber"
                      : "emerald"
                  }
                >
                  {securityAudit.production_deployment_blocked
                    ? "Local Dev Mode · Public Prod Blocked Until Docker Verified"
                    : "Docker Sandbox Verified"}
                </Badge>
              )}
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={loadSecurityAudit}
                disabled={auditLoading}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", auditLoading && "animate-spin")}
                />
                Re-verify
              </Button>
            </div>
          </div>

          {securityAudit ? (
            <div className="space-y-4">
              {securityAudit.production_deployment_blocked && (
                <div className="flex items-start gap-2.5 rounded-lg border border-accent-amber/35 bg-accent-amber/10 p-3 text-xs text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
                  <div>
                    <p className="font-semibold text-accent-amber">
                      Public Production Deployment Blocker Notice
                    </p>
                    <p className="mt-0.5 text-muted-foreground leading-relaxed">
                      {securityAudit.deployment_blockers.join(" ") ||
                        "Docker sandbox isolation is not currently verified in practice."}{" "}
                      Setting{" "}
                      <code className="rounded bg-surface-2 px-1 py-0.5">
                        CODEFLOW_ENV=production
                      </code>{" "}
                      automatically refuses to fall back to{" "}
                      <code className="rounded bg-surface-2 px-1 py-0.5">
                        development_subprocess
                      </code>
                      .
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                    Execution Mode
                  </span>
                  <p className="mt-1 font-mono font-semibold text-foreground">
                    {securityAudit.active_execution_mode}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                    Docker Daemon
                  </span>
                  <p className="mt-1 font-mono font-semibold text-foreground">
                    {securityAudit.docker_daemon_reachable
                      ? "Reachable"
                      : "Offline (CLI Installed)"}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                    Sandbox Image
                  </span>
                  <p className="mt-1 font-mono font-semibold text-foreground">
                    {securityAudit.docker_sandbox_image}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
                    Host &amp; Env Isolation
                  </span>
                  <p className="mt-1 font-mono font-semibold text-accent-emerald">
                    Filesystem + Env Blocked
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Active Security Controls
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2 text-xs text-muted-foreground">
                  {securityAudit.worker_sandbox_controls.map((ctrl, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-emerald" />
                      <span>{ctrl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Connect the Python execution backend (`127.0.0.1:8000`) to inspect
              live sandbox security telemetry.
            </p>
          )}
        </section>

        {/* 3. Local Profile & Interface Preferences */}
        <section className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-heading-sm text-foreground">
              Workspace Profile &amp; Display
            </h2>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="flex flex-col gap-3 sm:flex-row sm:items-end max-w-md"
          >
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="settings-display-name"
                className="text-xs font-medium text-foreground"
              >
                Display Name
              </label>
              <Input
                id="settings-display-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Developer Guest"
              />
            </div>
            <Button type="submit" variant="secondary">
              <Save className="h-3.5 w-3.5" />
              Save Profile
            </Button>
          </form>

          <div className="divide-y divide-border-subtle border-t border-border-subtle pt-2">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-body-sm font-medium text-foreground">
                  Compact Project Rows
                </p>
                <p className="text-xs text-muted-foreground">
                  Use denser table spacing in Dashboard and My Projects
                </p>
              </div>
              <Switch
                checked={hydrated ? preferences.compactProjectTable : false}
                onCheckedChange={(checked) =>
                  updatePreferences({ compactProjectTable: checked })
                }
                aria-label="Toggle compact project rows"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-body-sm font-medium text-foreground">
                  Highlight Mutated Variables
                </p>
                <p className="text-xs text-muted-foreground">
                  Emphasize variables modified in the active execution step
                </p>
              </div>
              <Switch
                checked={
                  hydrated ? preferences.highlightMutatedVariables : true
                }
                onCheckedChange={(checked) =>
                  updatePreferences({ highlightMutatedVariables: checked })
                }
                aria-label="Toggle mutated variable highlights"
              />
            </div>
          </div>
        </section>

        {/* 4. SQLite & Browser Persistence Management */}
        <section className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent-emerald" />
              <h2 className="text-heading-sm text-foreground">
                SQLite &amp; Browser Persistence State
              </h2>
            </div>
            <Badge variant={backendSynced ? "emerald" : "secondary"}>
              {hydrated ? projects.length : 0} Projects ·{" "}
              {hydrated ? executionHistory.length : 0} Runs ·{" "}
              {hydrated ? completedLessons.length + exploredTopics.length : 0}{" "}
              Progress Items
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground max-w-2xl">
            Projects, execution history, and learning progress are synchronized
            between browser{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5">
              localStorage
            </code>{" "}
            and the backend SQLite database (
            <code className="rounded bg-surface-2 px-1 py-0.5">
              backend/.data/codeflow_workspace.db
            </code>
            ) so your state survives both page reloads and server restarts.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                resetDemoProjects();
                toast({
                  title: "Starter projects restored",
                  description:
                    "Reset project list to the 4 default Python templates.",
                  variant: "info",
                });
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Starter Projects
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetLearningProgress();
                toast({
                  title: "Learning progress cleared",
                  description:
                    "Cleared completed lessons, exercises, topics, and algorithm markers.",
                  variant: "info",
                });
              }}
            >
              Clear Learning Progress
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                clearExecutionHistory();
                toast({
                  title: "Execution history cleared",
                  description: "Cleared recorded execution history runs.",
                  variant: "info",
                });
              }}
            >
              Clear Execution History
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
