"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GripVertical } from "lucide-react";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import { ExecutionTimeline } from "@/components/workspace/execution-timeline";
import { CodeEditorPane } from "@/components/workspace/code-editor-pane";
import { ExplanationPanel } from "@/components/workspace/explanation-panel";
import { VariableInspector } from "@/components/workspace/variable-inspector";
import { OutputPanel } from "@/components/workspace/output-panel";
import { VisualizerPanel } from "@/components/visualizer/VisualizerPanel";
import { AITutorPanel } from "@/components/tutor/AITutorPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { SAMPLE_PROGRAMS } from "@/lib/data/samples";
import { ALGORITHM_CATALOG, LEARNING_LESSONS } from "@/lib/data/catalog";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { useTutorStore } from "@/store/use-tutor-store";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";

function WorkspaceIDEContent() {
  useGlobalShortcuts({ enableSidebarShortcut: false });

  const searchParams = useSearchParams();
  const hydrated = useHydrated();

  const projects = useProjectStore((s) => s.projects);
  const executionHistory = useProjectStore((s) => s.executionHistory);
  const createProject = useProjectStore((s) => s.createProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const toast = useToastStore((s) => s.toast);

  const projectName = useWorkspaceStore((s) => s.projectName);
  const linkedProjectId = useWorkspaceStore((s) => s.linkedProjectId);
  const sourceCode = useWorkspaceStore((s) => s.sourceCode);
  const isPlaying = useWorkspaceStore((s) => s.isPlaying);
  const playbackSpeed = useWorkspaceStore((s) => s.playbackSpeed);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const splitRatio = useWorkspaceStore((s) => s.splitRatio);
  const isTutorOpen = useTutorStore((s) => s.isOpen);
  const setTutorOpen = useTutorStore((s) => s.setTutorOpen);

  const loadSampleProgram = useWorkspaceStore((s) => s.loadSampleProgram);
  const loadSavedProject = useWorkspaceStore((s) => s.loadSavedProject);
  const loadCustomSnippet = useWorkspaceStore((s) => s.loadCustomSnippet);
  const markSavedAsProject = useWorkspaceStore((s) => s.markSavedAsProject);
  const checkBackendHealth = useWorkspaceStore((s) => s.checkBackendHealth);
  const runExecution = useWorkspaceStore((s) => s.runExecution);
  const stepForward = useWorkspaceStore((s) => s.stepForward);
  const stepBackward = useWorkspaceStore((s) => s.stepBackward);
  const resetExecution = useWorkspaceStore((s) => s.resetExecution);
  const setSplitRatio = useWorkspaceStore((s) => s.setSplitRatio);

  const splitContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = React.useState(false);

  // Check FastAPI health on mount
  React.useEffect(() => {
    void checkBackendHealth();
  }, [checkBackendHealth]);

  // Load ?project=<id>, ?sample=<slug>, ?algorithm=<slug>, ?lesson=<slug>, or ?history=<id> when navigated from Dashboard / Library / Learn / History
  const projectParam = searchParams.get("project");
  const sampleParam = searchParams.get("sample") ?? searchParams.get("template");
  const algorithmParam = searchParams.get("algorithm");
  const lessonParam = searchParams.get("lesson");
  const historyParam = searchParams.get("history");
  const appliedQueryRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const queryKey = `${projectParam ?? ""}|${sampleParam ?? ""}|${algorithmParam ?? ""}|${lessonParam ?? ""}|${historyParam ?? ""}`;
    if (queryKey === "||||" || appliedQueryRef.current === queryKey) return;

    if (algorithmParam) {
      const alg = ALGORITHM_CATALOG.find(
        (a) => a.slug === algorithmParam || a.id === algorithmParam
      );
      if (alg) {
        loadCustomSnippet(alg.title, alg.codeExample);
        appliedQueryRef.current = queryKey;
        return;
      }
    }

    if (lessonParam) {
      const lesson = LEARNING_LESSONS.find(
        (l) => l.slug === lessonParam || l.id === lessonParam
      );
      if (lesson) {
        loadCustomSnippet(lesson.title, lesson.exampleCode);
        appliedQueryRef.current = queryKey;
        return;
      }
    }

    if (!projectParam && sampleParam) {
      const normalizedSampleId = `sample_${sampleParam.replace(/-/g, "_")}`;
      const matchedSample = SAMPLE_PROGRAMS.find(
        (s) =>
          s.slug === sampleParam ||
          s.id === sampleParam ||
          s.id === normalizedSampleId
      );
      if (matchedSample) {
        loadSampleProgram(matchedSample);
        appliedQueryRef.current = queryKey;
        return;
      }
      const matchedAlg = ALGORITHM_CATALOG.find(
        (a) => a.slug === sampleParam || a.sampleSlug === sampleParam
      );
      if (matchedAlg) {
        loadCustomSnippet(matchedAlg.title, matchedAlg.codeExample);
        appliedQueryRef.current = queryKey;
        return;
      }
    }

    if (!hydrated) return;

    if (historyParam) {
      const historyItem = executionHistory.find((h) => h.id === historyParam);
      if (historyItem) {
        loadCustomSnippet(historyItem.title, historyItem.sourceCode);
        appliedQueryRef.current = queryKey;
        return;
      }
    }

    if (projectParam) {
      const existingProject = projects.find((p) => p.id === projectParam);
      if (existingProject) {
        loadSavedProject(existingProject);
        appliedQueryRef.current = queryKey;
        return;
      }
    }

    if (sampleParam) {
      const fallbackProject = projects.find((p) => p.topicSlug === sampleParam);
      if (fallbackProject) {
        loadSavedProject(fallbackProject);
        appliedQueryRef.current = queryKey;
      }
    }
  }, [
    algorithmParam,
    executionHistory,
    historyParam,
    hydrated,
    lessonParam,
    loadCustomSnippet,
    loadSampleProgram,
    loadSavedProject,
    projectParam,
    projects,
    sampleParam,
  ]);

  // Auto Play timer synchronized with playbackSpeed (0.5x, 1x, 1.5x, 2x)
  React.useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(850 / playbackSpeed);
    const timer = window.setInterval(() => {
      stepForward();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, stepForward]);

  // Interactive drag-to-resize for Split View
  React.useEffect(() => {
    if (!isDraggingSplit) return;

    function handleMouseMove(ev: MouseEvent) {
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(pct);
    }

    function handleMouseUp() {
      setIsDraggingSplit(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSplit, setSplitRatio]);

  // Save current editor buffer to local Project Store
  const handleSaveProject = React.useCallback(() => {
    const cleanName = projectName.trim() || "Untitled Python Visualization";
    const existing = linkedProjectId
      ? projects.find((p) => p.id === linkedProjectId)
      : null;

    if (existing) {
      updateProject(existing.id, {
        name: cleanName,
        codePreview: sourceCode,
        status: "Ready",
      });
      markSavedAsProject(existing.id, cleanName);
      toast({
        title: "Project updated",
        description: `"${cleanName}" saved to your local workspace.`,
        variant: "success",
      });
    } else {
      const created = createProject({
        name: cleanName,
        description: "Interactive Python visualization saved from Workspace IDE.",
        language: "python",
        status: "Ready",
        codePreview: sourceCode,
      });
      markSavedAsProject(created.id, created.name);
      toast({
        title: "Saved to My Projects",
        description: `"${created.name}" is now available on your Dashboard.`,
        variant: "success",
      });
    }
  }, [
    createProject,
    linkedProjectId,
    markSavedAsProject,
    projectName,
    projects,
    sourceCode,
    toast,
    updateProject,
  ]);

  // Global window keyboard shortcuts (when focus is outside Monaco editor)
  React.useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".monaco-editor")) return;

      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && event.key === "Enter") {
        event.preventDefault();
        void runExecution();
        return;
      }

      if (event.key === "F10" && event.shiftKey) {
        event.preventDefault();
        stepBackward();
        return;
      }

      if (event.key === "F10" && !event.shiftKey) {
        event.preventDefault();
        stepForward();
        return;
      }

      if (isMod && event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetExecution();
        return;
      }

      if (isMod && !event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSaveProject();
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [
    handleSaveProject,
    resetExecution,
    runExecution,
    stepBackward,
    stepForward,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      {/* Area A: Top IDE Toolbar */}
      <WorkspaceToolbar onSaveProject={handleSaveProject} />

      {/* Execution Timeline & Interactive Scrubber */}
      <ExecutionTimeline />

      {/* Main Workspace Area — Supports Code View, Split View, and Visualisation View */}
      {viewMode === "code" ? (
        <main
          className="grid flex-1 gap-3 p-3 lg:min-h-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]"
          data-testid="workspace-main-code"
        >
          {/* Left Column: Monaco Code Editor + Bottom Output/Trace/Errors Dock */}
          <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
            <div className="min-h-[340px] flex-1 lg:min-h-0">
              <CodeEditorPane onSaveShortcut={handleSaveProject} />
            </div>
            <OutputPanel />
          </div>

          {/* Right Column: Explanation + Variable Inspector + Optional AI Tutor */}
          <div className="flex min-w-0 flex-col gap-3 overflow-y-auto lg:min-h-0">
            <ExplanationPanel />
            <VariableInspector />
            {isTutorOpen && (
              <div className="min-h-[420px] flex-1">
                <AITutorPanel onClose={() => setTutorOpen(false)} />
              </div>
            )}
          </div>
        </main>
      ) : viewMode === "visualize" ? (
        <main
          className="grid flex-1 gap-3 p-3 lg:min-h-0 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]"
          data-testid="workspace-main-visualize"
        >
          {/* Left Hero Column: Full-Stage Data Structure & Memory Visualiser */}
          <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
            <VisualizerPanel />
          </div>

          {/* Right Column: Step Explanation + Variable Inspector + Output Dock + Optional AI Tutor */}
          <div className="flex min-w-0 flex-col gap-3 overflow-y-auto lg:min-h-0">
            <ExplanationPanel />
            <VariableInspector />
            <OutputPanel />
            {isTutorOpen && (
              <div className="min-h-[420px]">
                <AITutorPanel onClose={() => setTutorOpen(false)} />
              </div>
            )}
          </div>
        </main>
      ) : (
        <main
          ref={splitContainerRef}
          className="flex flex-1 flex-col gap-3 p-3 lg:min-h-0 lg:flex-row lg:gap-1.5"
          data-testid="workspace-main-split"
        >
          {/* Left Pane: Monaco Code Editor + Console Output Dock */}
          <div
            style={
              {
                "--split-left": `${isTutorOpen ? Math.min(38, splitRatio) : splitRatio}%`,
              } as React.CSSProperties
            }
            className="flex min-w-0 flex-col gap-3 lg:min-h-0 lg:w-[var(--split-left)] lg:shrink-0"
          >
            <div className="min-h-[320px] flex-1 lg:min-h-0">
              <CodeEditorPane onSaveShortcut={handleSaveProject} />
            </div>
            <OutputPanel />
          </div>

          {/* Interactive Resizable Drag Handle (Desktop) */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize code editor and visualization panels"
            tabIndex={0}
            data-testid="workspace-split-resizer"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSplit(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setSplitRatio(splitRatio - 4);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setSplitRatio(splitRatio + 4);
              }
            }}
            className="group hidden w-2.5 shrink-0 cursor-col-resize items-center justify-center rounded-md transition-colors hover:bg-primary/15 focus-visible:bg-primary/20 focus-visible:outline-none lg:flex"
            title="Drag to resize panels"
          >
            <GripVertical className="h-4 w-4 text-subtle-foreground transition-colors group-hover:text-primary" />
          </div>

          {/* Center/Right Pane: Interactive Data Structure Visualizer + Explanation & Variable Inspector */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto lg:min-h-0">
            <div className="flex min-h-[360px] flex-[1.35] flex-col">
              <VisualizerPanel />
            </div>

            <div className="grid min-h-[240px] flex-1 gap-3 xl:grid-cols-[minmax(220px,0.9fr)_minmax(240px,1.1fr)]">
              <ExplanationPanel />
              <VariableInspector />
            </div>
          </div>

          {/* Docked AI Tutor Panel (Phase 4) */}
          {isTutorOpen && (
            <div
              className="flex min-h-[420px] w-full flex-col lg:min-h-0 lg:w-[370px] lg:shrink-0 xl:w-[400px]"
              data-testid="workspace-tutor-dock"
            >
              <AITutorPanel onClose={() => setTutorOpen(false)} />
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col gap-3 bg-background p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid flex-1 gap-3 lg:grid-cols-2">
            <Skeleton className="h-[520px] w-full" />
            <Skeleton className="h-[520px] w-full" />
          </div>
        </div>
      }
    >
      <WorkspaceIDEContent />
    </Suspense>
  );
}
