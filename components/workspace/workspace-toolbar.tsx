"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  Code2,
  Columns2,
  FastForward,
  Keyboard,
  Loader2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Save,
  SkipBack,
  SkipForward,
  Sparkles,
  Type,
  WifiOff,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SAMPLE_PROGRAMS,
  type SampleCategory,
  type SampleProgram,
} from "@/lib/data/samples";
import { LANGUAGE_ROADMAP } from "@/lib/data/catalog";
import {
  useWorkspaceStore,
  type WorkspaceStatus,
} from "@/store/use-workspace-store";
import { useTutorStore } from "@/store/use-tutor-store";
import type { PlaybackSpeed } from "@/types/api";
import type { WorkspaceViewMode } from "@/types/visualizer";
import { cn } from "@/lib/utils";

const SAMPLE_CATEGORIES: SampleCategory[] = ["Python Basics", "DSA", "Advanced"];
const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];
const FONT_SIZES = [12, 13, 14, 15, 16, 18];

const STATUS_META: Record<
  WorkspaceStatus,
  {
    label: string;
    dotClass: string;
    badgeVariant: "secondary" | "emerald" | "amber" | "indigo" | "rose" | "default";
  }
> = {
  idle: {
    label: "Idle",
    dotClass: "bg-subtle-foreground",
    badgeVariant: "secondary",
  },
  running: {
    label: "Running…",
    dotClass: "bg-primary animate-pulse",
    badgeVariant: "default",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-accent-amber",
    badgeVariant: "amber",
  },
  playing: {
    label: "Auto Play",
    dotClass: "bg-accent-emerald animate-pulse",
    badgeVariant: "emerald",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-accent-emerald",
    badgeVariant: "emerald",
  },
  error: {
    label: "Error",
    dotClass: "bg-accent-rose",
    badgeVariant: "rose",
  },
};

interface WorkspaceToolbarProps {
  onSaveProject: () => void;
}

export function WorkspaceToolbar({ onSaveProject }: WorkspaceToolbarProps) {
  const projectName = useWorkspaceStore((s) => s.projectName);
  const isDirty = useWorkspaceStore((s) => s.isDirty);
  const linkedProjectId = useWorkspaceStore((s) => s.linkedProjectId);
  const activeSampleId = useWorkspaceStore((s) => s.activeSampleId);
  const status = useWorkspaceStore((s) => s.status);
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const networkError = useWorkspaceStore((s) => s.networkError);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const isPlaying = useWorkspaceStore((s) => s.isPlaying);
  const playbackSpeed = useWorkspaceStore((s) => s.playbackSpeed);
  const editorFontSize = useWorkspaceStore((s) => s.editorFontSize);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const backendStatus = useWorkspaceStore((s) => s.backendStatus);
  const backendHealth = useWorkspaceStore((s) => s.backendHealth);

  const setProjectName = useWorkspaceStore((s) => s.setProjectName);
  const loadSampleProgram = useWorkspaceStore((s) => s.loadSampleProgram);
  const runExecution = useWorkspaceStore((s) => s.runExecution);
  const stepForward = useWorkspaceStore((s) => s.stepForward);
  const stepBackward = useWorkspaceStore((s) => s.stepBackward);
  const toggleAutoPlay = useWorkspaceStore((s) => s.toggleAutoPlay);
  const setPlaybackSpeed = useWorkspaceStore((s) => s.setPlaybackSpeed);
  const resetExecution = useWorkspaceStore((s) => s.resetExecution);
  const setEditorFontSize = useWorkspaceStore((s) => s.setEditorFontSize);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const checkBackendHealth = useWorkspaceStore((s) => s.checkBackendHealth);
  const isTutorOpen = useTutorStore((s) => s.isOpen);
  const toggleTutorOpen = useTutorStore((s) => s.toggleTutorOpen);

  const [editingName, setEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(projectName);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDraftName(projectName);
  }, [projectName]);

  React.useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const commitName = () => {
    const cleaned = draftName.trim();
    if (cleaned && cleaned !== projectName) {
      setProjectName(cleaned);
    } else {
      setDraftName(projectName);
    }
    setEditingName(false);
  };

  const totalSteps = traceResult?.steps.length ?? 0;
  const hasSteps = totalSteps > 0;
  const isRunning = status === "running";
  const canStepBack = hasSteps && currentStepIndex > 0 && !isRunning;
  const canStepForward =
    hasSteps && currentStepIndex < totalSteps - 1 && !isRunning;
  const canReset =
    !isRunning && (status !== "idle" || traceResult !== null || networkError !== null);

  const statusConfig = STATUS_META[status];
  const executionMode =
    traceResult?.execution_mode ?? backendHealth?.execution_mode ?? "development_subprocess";

  const handleSelectSample = (sample: SampleProgram) => {
    loadSampleProgram(sample);
  };

  return (
    <header
      className="border-b border-border bg-surface-1/95 backdrop-blur supports-[backdrop-filter]:bg-surface-1/85"
      data-testid="workspace-toolbar"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        {/* LEFT CLUSTER: Brand, Back Link, Project Name, Samples, Language, Save */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard" aria-label="Back to Dashboard">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
          </Tooltip>

          <Logo href="/dashboard" className="mr-1 shrink-0" />

          <span
            className="hidden h-4 w-px bg-border sm:inline-block"
            aria-hidden="true"
          />

          {/* Inline Editable Project Name */}
          <div className="flex min-w-0 items-center">
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setDraftName(projectName);
                    setEditingName(false);
                  }
                }}
                aria-label="Project name"
                className="h-7 w-40 rounded-md border border-primary/50 bg-surface-2 px-2 text-xs font-medium text-foreground outline-none ring-2 ring-primary/20 sm:w-48"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="group inline-flex max-w-[150px] items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 sm:max-w-[200px]"
                title="Click to rename project"
              >
                <span className="truncate">{projectName}</span>
                {isDirty && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber"
                    title="Unsaved changes"
                  />
                )}
                <Pencil className="h-3 w-3 shrink-0 text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>

          {/* Sample Selector (22 Programs across 3 Categories) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="xs"
                className="h-7 gap-1.5 px-2.5 text-xs"
                data-testid="workspace-samples-trigger"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Samples</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[72vh] w-72 overflow-y-auto p-1.5"
            >
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-foreground">
                  Sample Program Library
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {SAMPLE_PROGRAMS.length} tracer-verified Python 3.12 programs
                </p>
              </div>
              <DropdownMenuSeparator />
              {SAMPLE_CATEGORIES.map((category, catIdx) => {
                const items = SAMPLE_PROGRAMS.filter(
                  (s) => s.category === category
                );
                return (
                  <React.Fragment key={category}>
                    {catIdx > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="flex items-center justify-between py-1 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                        <span>{category}</span>
                        <span className="font-mono">{items.length}</span>
                      </DropdownMenuLabel>
                      {items.map((sample) => {
                        const isSelected = activeSampleId === sample.id;
                        return (
                          <DropdownMenuItem
                            key={sample.id}
                            onClick={() => handleSelectSample(sample)}
                            data-testid={`sample-item-${sample.slug}`}
                            className="flex flex-col items-start gap-0.5 py-1.5"
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {sample.title}
                              </span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-accent-emerald" />
                              )}
                            </div>
                            <span className="line-clamp-1 text-[11px] text-muted-foreground">
                              {sample.description}
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </React.Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="xs"
                className="hidden h-7 gap-1.5 px-2.5 text-xs md:inline-flex"
                data-testid="workspace-language-trigger"
              >
                <Code2 className="h-3.5 w-3.5 text-accent-emerald" />
                <span>Python 3.12</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel>Execution Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGE_ROADMAP.map((lang) => {
                const isPython = lang.id === "python";
                return (
                  <DropdownMenuItem
                    key={lang.id}
                    disabled={!isPython}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-6 items-center justify-center rounded bg-surface-2 font-mono text-[10px] font-semibold">
                        {lang.monogram}
                      </span>
                      <span className="text-xs font-medium">
                        {isPython ? "Python 3.12" : lang.name}
                      </span>
                    </div>
                    {isPython ? (
                      <Badge variant="emerald" className="px-1.5 py-0 text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        Planned
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onSaveProject}
                data-testid="workspace-save-btn"
                className="h-7 gap-1.5 border border-border/70 px-2.5 text-xs text-foreground hover:bg-surface-2"
              >
                {!isDirty && linkedProjectId ? (
                  <Check className="h-3.5 w-3.5 text-accent-emerald" />
                ) : (
                  <Save className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="hidden sm:inline">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Save project to local workspace (⌘/Ctrl + S)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* CENTER CLUSTER: Execution Transport Controls */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface-2/70 p-1">
          {/* Run */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="xs"
                onClick={() => void runExecution()}
                disabled={isRunning}
                data-testid="workspace-run-btn"
                className="h-7 gap-1.5 bg-accent-emerald px-3 text-xs font-semibold text-white shadow-sm hover:bg-accent-emerald/90 dark:text-slate-950"
              >
                {isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                <span>{isRunning ? "Running…" : "Run"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Execute Python &amp; capture trace (⌘/Ctrl + Enter)
            </TooltipContent>
          </Tooltip>

          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />

          {/* Step Backward */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={stepBackward}
                disabled={!canStepBack}
                data-testid="workspace-step-back-btn"
                aria-label="Step Backward"
                className="h-7 px-2 text-xs text-foreground"
              >
                <SkipBack className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Back</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Step Backward (Shift + F10)
            </TooltipContent>
          </Tooltip>

          {/* Auto Play / Pause */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={isPlaying ? "subtle" : "ghost"}
                size="xs"
                onClick={toggleAutoPlay}
                disabled={!hasSteps || isRunning}
                data-testid="workspace-autoplay-btn"
                aria-label={isPlaying ? "Pause Auto Play" : "Start Auto Play"}
                className="h-7 px-2 text-xs text-foreground"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <FastForward className="h-3.5 w-3.5" />
                )}
                <span className="hidden xl:inline">
                  {isPlaying ? "Pause" : "Auto"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isPlaying ? "Pause automatic playback" : `Auto Play (${playbackSpeed}x)`}
            </TooltipContent>
          </Tooltip>

          {/* Playback Speed Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isRunning}
                data-testid="workspace-speed-trigger"
                className="inline-flex h-7 items-center gap-0.5 rounded px-1.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-45"
                title="Playback speed"
              >
                <span>{playbackSpeed}x</span>
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[7rem]">
              <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PLAYBACK_SPEEDS.map((spd) => (
                <DropdownMenuItem
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <span>{spd}x</span>
                  {playbackSpeed === spd && (
                    <Check className="h-3.5 w-3.5 text-accent-emerald" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Step Forward */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={stepForward}
                disabled={!canStepForward}
                data-testid="workspace-step-forward-btn"
                aria-label="Step Forward"
                className="h-7 px-2 text-xs text-foreground"
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Step</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Step Forward (F10)</TooltipContent>
          </Tooltip>

          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={resetExecution}
                disabled={!canReset}
                data-testid="workspace-reset-btn"
                aria-label="Reset Execution"
                className="h-7 px-2 text-xs text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden 2xl:inline">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Reset execution state (⌘/Ctrl + Shift + R)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* RIGHT CLUSTER: View Mode Switcher, Status Badge, Sandbox Health, Font Size, Shortcuts, Theme */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* View Mode Segmented Switcher (Part 12: Code View | Split View | Visualisation View) */}
          <div
            className="inline-flex items-center rounded-lg border border-border bg-surface-2/80 p-0.5"
            role="group"
            aria-label="Workspace view mode"
            data-testid="workspace-view-mode-switcher"
          >
            {(
              [
                { id: "code", label: "Code View", shortLabel: "Code", icon: Code2 },
                {
                  id: "split",
                  label: "Split View",
                  shortLabel: "Split",
                  icon: Columns2,
                },
                {
                  id: "visualize",
                  label: "Visualisation View",
                  shortLabel: "Visual",
                  icon: Boxes,
                },
              ] as {
                id: WorkspaceViewMode;
                label: string;
                shortLabel: string;
                icon: React.ComponentType<{ className?: string }>;
              }[]
            ).map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  data-testid={`view-mode-${mode.id}`}
                  title={mode.label}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all",
                    isActive
                      ? "bg-surface-1 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3 w-3",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="hidden sm:inline">{mode.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* AI Tutor Dock Toggle Button (Phase 4) */}
          <Button
            type="button"
            variant={isTutorOpen ? "default" : "secondary"}
            size="xs"
            onClick={toggleTutorOpen}
            data-testid="workspace-tutor-toggle"
            aria-pressed={isTutorOpen}
            className={cn(
              "h-7 gap-1.5 px-2.5 text-xs font-medium",
              isTutorOpen
                ? "bg-accent-violet text-white hover:bg-accent-violet/90"
                : "border border-accent-violet/30 bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Tutor</span>
          </Button>

          {/* Execution Status Pill */}
          <Badge
            variant={
              statusConfig.badgeVariant === "indigo"
                ? "default"
                : statusConfig.badgeVariant
            }
            data-testid="workspace-status-badge"
            className="h-6 gap-1.5 px-2 font-mono text-[11px]"
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dotClass)}
            />
            <span>{statusConfig.label}</span>
          </Badge>

          {/* Backend Health & Sandbox Security Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void checkBackendHealth()}
                data-testid="workspace-backend-badge"
                className={cn(
                  "hidden h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors lg:inline-flex",
                  backendStatus === "connected"
                    ? "border-accent-emerald/30 bg-accent-emerald/10 text-foreground hover:bg-accent-emerald/15"
                    : backendStatus === "offline"
                    ? "border-accent-rose/35 bg-accent-rose/10 text-accent-rose"
                    : "border-border bg-surface-2 text-muted-foreground"
                )}
              >
                {backendStatus === "offline" ? (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Backend Offline</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
                    <span className="font-mono text-[10.5px]">Python 3.12</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs p-2.5 leading-relaxed">
              {backendStatus === "offline" ? (
                <span>
                  FastAPI execution engine is unreachable at{" "}
                  <code>127.0.0.1:8000</code>. Click to retry health check.
                </span>
              ) : executionMode === "docker_sandbox" ? (
                <span>
                  Isolated Docker container runner active (network disabled,
                  read-only rootfs, memory &amp; PID limits).
                </span>
              ) : (
                <span>
                  <strong>Python 3.12 Execution Engine Active</strong> (
                  {backendHealth?.execution_mode ?? "development_subprocess"}): isolated temp dir,
                  timeouts, memory/step caps, and PEP 578 audit hooks active.
                </span>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Editor Font Size Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-7 w-7 text-muted-foreground hover:text-foreground sm:inline-flex"
                aria-label="Editor font size"
              >
                <Type className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[8.5rem]">
              <DropdownMenuLabel>Editor Font Size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {FONT_SIZES.map((sz) => (
                <DropdownMenuItem
                  key={sz}
                  onClick={() => setEditorFontSize(sz)}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <span>{sz}px</span>
                  {editorFontSize === sz && (
                    <Check className="h-3.5 w-3.5 text-accent-emerald" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Keyboard Shortcuts Reference */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-7 w-7 text-muted-foreground hover:text-foreground sm:inline-flex"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="px-1.5 py-1">
                Workspace Shortcuts
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-1.5 px-1.5 py-1 text-xs">
                {[
                  { label: "Run Program", keys: "⌘/Ctrl + ↵" },
                  { label: "Step Forward", keys: "F10" },
                  { label: "Step Backward", keys: "⇧ + F10" },
                  { label: "Reset Trace", keys: "⌘/Ctrl + ⇧ + R" },
                  { label: "Save Project", keys: "⌘/Ctrl + S" },
                  { label: "Command Palette", keys: "⌘/Ctrl + K" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ThemeToggle className="h-7 w-7" />
        </div>
      </div>
    </header>
  );
}

