"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  GraduationCap,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LEARNING_LESSONS,
  LEARNING_TRACKS,
  QUICK_START_TOPICS,
} from "@/lib/data/catalog";
import { codeflowApi } from "@/lib/api/client";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

function LearnContent() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const activeTopicSlug = searchParams.get("topic");
  const initialLessonSlug = searchParams.get("lesson");

  const exploredTopics = useProjectStore((s) => s.exploredTopics);
  const completedLessons = useProjectStore((s) => s.completedLessons);
  const completedExercises = useProjectStore((s) => s.completedExercises);
  const backendSynced = useProjectStore((s) => s.backendSynced);

  const markTopicExplored = useProjectStore((s) => s.markTopicExplored);
  const toggleLessonCompleted = useProjectStore((s) => s.toggleLessonCompleted);
  const markExerciseCompleted = useProjectStore((s) => s.markExerciseCompleted);
  const toast = useToastStore((s) => s.toast);

  const initialLesson =
    LEARNING_LESSONS.find((l) => l.slug === initialLessonSlug) ??
    LEARNING_LESSONS[0];

  const [selectedTrackId, setSelectedTrackId] = React.useState<string>(
    initialLesson.trackId
  );
  const [selectedLessonId, setSelectedLessonId] = React.useState<string>(
    initialLesson.id
  );
  const [exerciseCode, setExerciseCode] = React.useState<string>(
    initialLesson.exercise.starterCode
  );
  const [showHint, setShowHint] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<{
    passed: boolean;
    stdout: string;
    steps: number;
    durationMs: number;
    errorMessage?: string;
  } | null>(null);

  const activeLesson = React.useMemo(
    () =>
      LEARNING_LESSONS.find((l) => l.id === selectedLessonId) ??
      LEARNING_LESSONS[0],
    [selectedLessonId]
  );

  const trackLessons = React.useMemo(
    () => LEARNING_LESSONS.filter((l) => l.trackId === selectedTrackId),
    [selectedTrackId]
  );

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    const firstInTrack = LEARNING_LESSONS.find((l) => l.trackId === trackId);
    if (firstInTrack) {
      handleSelectLesson(firstInTrack.id);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    const lesson = LEARNING_LESSONS.find((l) => l.id === lessonId);
    if (!lesson) return;
    setSelectedLessonId(lesson.id);
    setSelectedTrackId(lesson.trackId);
    setExerciseCode(lesson.exercise.starterCode);
    setShowHint(false);
    setVerificationResult(null);
  };

  const handleRunPracticeExercise = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const response = await codeflowApi.executePython({
        source_code: exerciseCode,
        options: { max_steps: 400, timeout_seconds: 3.5 },
      });

      const stdout = (response.stdout ?? "").trim();
      const expected =
        activeLesson.exercise.expectedOutputSubstring.trim();
      const passed =
        response.status === "completed" && stdout.includes(expected);

      setVerificationResult({
        passed,
        stdout,
        steps: response.total_steps,
        durationMs: response.duration_ms,
        errorMessage:
          response.status !== "completed"
            ? response.error?.message ?? "Execution did not complete cleanly."
            : !passed
            ? `Expected output containing "${expected}", but received "${stdout || "(empty stdout)"}".`
            : undefined,
      });

      if (passed) {
        markExerciseCompleted(activeLesson.exercise.id, activeLesson.id);
        toast({
          title: "Practice Exercise Verified!",
          description: `"${activeLesson.title}" marked complete and synced to your progress.`,
          variant: "success",
        });
      }
    } catch {
      setVerificationResult({
        passed: false,
        stdout: "",
        steps: 0,
        durationMs: 0,
        errorMessage: "Unable to reach Python execution engine.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const totalLessons = LEARNING_LESSONS.length;
  const completedLessonsCount = hydrated ? completedLessons.length : 0;
  const completedExercisesCount = hydrated ? completedExercises.length : 0;
  const curriculumPct = Math.round((completedLessonsCount / totalLessons) * 100);

  const isActiveLessonDone =
    hydrated &&
    (completedLessons.includes(activeLesson.id) ||
      completedLessons.includes(activeLesson.slug));
  const isActiveExerciseDone =
    hydrated && completedExercises.includes(activeLesson.exercise.id);

  return (
    <div className="space-y-8" data-testid="learn-page">
      <PageHeader
        title="Guided Learning Studio"
        badge="Beginner → Intermediate → Advanced"
        badgeVariant="emerald"
        description="Master Python execution mechanics, pointer patterns, recursion frames, and dynamic programming through interactive lessons and live practice exercises verified by the Python tracer."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={backendSynced ? "emerald" : "secondary"}>
              {completedLessonsCount} / {totalLessons} Lessons ({curriculumPct}%)
            </Badge>
            <Button asChild variant="secondary" size="sm">
              <Link href="/tutor">
                <Bot className="h-3.5 w-3.5" />
                Ask AI Tutor
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/workspace?lesson=${activeLesson.slug}`}>
                Open in Workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        }
      />

      {/* Overall Progress Summary Banner */}
      <div className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-foreground">
                Curriculum Mastery Progress
              </p>
              <p className="text-xs text-muted-foreground">
                {completedLessonsCount} of {totalLessons} lessons completed ·{" "}
                {completedExercisesCount} of {totalLessons} coding exercises
                verified · Persisted in SQLite &amp; browser storage
              </p>
            </div>
          </div>
          <span
            className="font-mono text-sm font-semibold text-primary tabular-nums"
            data-testid="learn-progress-summary"
          >
            {curriculumPct}% Complete
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={curriculumPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-emerald transition-all duration-300"
            style={{ width: `${curriculumPct}%` }}
          />
        </div>
      </div>

      {/* 4 Structured Learning Paths */}
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        data-testid="learning-tracks-grid"
      >
        {LEARNING_TRACKS.map((track) => {
          const lessonsInTrack = LEARNING_LESSONS.filter(
            (l) => l.trackId === track.id
          );
          const doneInTrack = hydrated
            ? lessonsInTrack.filter(
                (l) =>
                  completedLessons.includes(l.id) ||
                  completedLessons.includes(l.slug)
              ).length
            : 0;
          const isSelected = selectedTrackId === track.id;

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => handleSelectTrack(track.id)}
              data-testid={`track-card-${track.id}`}
              className={cn(
                "flex flex-col justify-between rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/[0.08] ring-1 ring-primary/35 shadow-elevation-1"
                  : "border-border bg-surface-1 hover:border-border-strong"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      track.level === "Beginner"
                        ? "emerald"
                        : track.level === "Intermediate"
                        ? "default"
                        : "amber"
                    }
                  >
                    {track.level}
                  </Badge>
                  <span className="font-mono text-xs text-subtle-foreground">
                    {doneInTrack}/{lessonsInTrack.length} done
                  </span>
                </div>

                <h2 className="mt-2.5 text-heading-sm text-foreground">
                  {track.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {track.description}
                </p>
              </div>

              <div className="mt-4 border-t border-border-subtle pt-2.5">
                <div className="flex flex-wrap gap-1">
                  {track.concepts.slice(0, 3).map((concept) => (
                    <span
                      key={concept}
                      className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Lesson & Practice Workbench */}
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left: Track Lessons Sidebar */}
        <div className="space-y-2.5 rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Track Lessons ({trackLessons.length})
            </h3>
            <Badge variant="secondary">
              {
                LEARNING_TRACKS.find((t) => t.id === selectedTrackId)?.level
              }
            </Badge>
          </div>

          <div className="space-y-2" data-testid="track-lessons-list">
            {trackLessons.map((lesson, idx) => {
              const active = lesson.id === activeLesson.id;
              const completed =
                hydrated &&
                (completedLessons.includes(lesson.id) ||
                  completedLessons.includes(lesson.slug));
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => handleSelectLesson(lesson.id)}
                  data-testid={`lesson-item-${lesson.slug}`}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/12 text-foreground"
                      : "border-border-subtle bg-surface-2/45 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                      Lesson {idx + 1} · {lesson.estimatedMinutes}m
                    </span>
                    {completed && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" />
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {lesson.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {lesson.conceptSummary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Lesson Content + Interactive Practice Exercise */}
        <div
          className="space-y-5 rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1"
          data-testid="active-lesson-panel"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    activeLesson.level === "Beginner"
                      ? "emerald"
                      : activeLesson.level === "Intermediate"
                      ? "default"
                      : "amber"
                  }
                >
                  {activeLesson.level}
                </Badge>
                <span className="font-mono text-xs text-subtle-foreground">
                  ~{activeLesson.estimatedMinutes} min study
                </span>
                {isActiveLessonDone && (
                  <Badge variant="emerald">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
              <h2
                className="mt-2 text-heading-lg text-foreground"
                data-testid="active-lesson-title"
              >
                {activeLesson.title}
              </h2>
              <p className="mt-1 text-body-sm text-muted-foreground">
                {activeLesson.conceptSummary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="xs" variant="secondary">
                <Link href={`/workspace?lesson=${activeLesson.slug}`}>
                  <Play className="h-3.5 w-3.5" />
                  Step Through in Workspace
                </Link>
              </Button>
              <Button
                type="button"
                size="xs"
                variant={isActiveLessonDone ? "subtle" : "outline"}
                onClick={() => {
                  toggleLessonCompleted(activeLesson.id);
                  if (!isActiveLessonDone) {
                    toast({
                      title: "Lesson marked complete",
                      description: `"${activeLesson.title}" saved to your learning profile.`,
                      variant: "success",
                    });
                  }
                }}
                data-testid="mark-lesson-complete-btn"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isActiveLessonDone ? "Completed" : "Mark Lesson Complete"}
              </Button>
            </div>
          </div>

          {/* Mental Model & Key Takeaways */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-4 space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent-violet" />
                Core Execution Mental Model
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeLesson.mentalModel}
              </p>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-2/50 p-4 space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Key Takeaways
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {activeLesson.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-emerald" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reference Code Example */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                Reference Python Example
              </span>
              <Link
                href={`/workspace?lesson=${activeLesson.slug}`}
                className="text-xs text-primary hover:underline"
              >
                Visualize line-by-line →
              </Link>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-surface-2/85 p-3 font-mono text-xs leading-relaxed text-foreground">
              {activeLesson.exampleCode}
            </pre>
          </div>

          {/* Interactive Practice Exercise Verified by Python Engine */}
          <div
            className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 space-y-3.5"
            data-testid="practice-exercise-box"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  Practice: {activeLesson.exercise.title}
                </Badge>
                <Badge variant="mono">
                  {activeLesson.exercise.targetComplexity}
                </Badge>
                {isActiveExerciseDone && (
                  <Badge variant="emerald">Verified</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowHint((v) => !v)}
                >
                  <Lightbulb className="h-3.5 w-3.5 text-accent-amber" />
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    setExerciseCode(activeLesson.exercise.starterCode)
                  }
                  data-testid="load-exercise-solution-btn"
                >
                  Load Reference Solution
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setExerciseCode(activeLesson.exercise.starterCode);
                    setVerificationResult(null);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </div>

            <p className="text-xs text-foreground leading-relaxed">
              {activeLesson.exercise.prompt}
            </p>

            {showHint && (
              <div className="rounded-lg border border-accent-amber/30 bg-accent-amber/10 p-2.5 text-xs text-foreground">
                <span className="font-semibold text-accent-amber">Hint:</span>{" "}
                {activeLesson.exercise.solutionHint}
              </div>
            )}

            <textarea
              value={exerciseCode}
              onChange={(e) => setExerciseCode(e.target.value)}
              rows={7}
              spellCheck={false}
              data-testid="practice-exercise-editor"
              aria-label="Practice exercise Python editor"
              className="w-full rounded-lg border border-border bg-surface-1 p-3 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-subtle-foreground">
                Expected stdout contains:{" "}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-foreground">
                  {activeLesson.exercise.expectedOutputSubstring}
                </code>
              </span>

              <Button
                type="button"
                size="sm"
                onClick={handleRunPracticeExercise}
                disabled={isVerifying}
                data-testid="verify-exercise-btn"
              >
                <Terminal className="h-3.5 w-3.5" />
                {isVerifying
                  ? "Running Python Tracer..."
                  : "Run & Verify Exercise"}
              </Button>
            </div>

            {verificationResult && (
              <div
                data-testid="exercise-verification-result"
                className={cn(
                  "rounded-lg border p-3 text-xs space-y-1",
                  verificationResult.passed
                    ? "border-accent-emerald/40 bg-accent-emerald/10 text-foreground"
                    : "border-destructive/40 bg-destructive/10 text-foreground"
                )}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    {verificationResult.passed
                      ? "✓ Exercise Passed — Output Verified!"
                      : "✗ Verification Did Not Pass"}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {verificationResult.steps} steps ·{" "}
                    {verificationResult.durationMs.toFixed(2)} ms
                  </span>
                </div>
                {verificationResult.stdout && (
                  <p className="font-mono text-[11px]">
                    stdout: {verificationResult.stdout}
                  </p>
                )}
                {verificationResult.errorMessage && (
                  <p className="text-destructive">
                    {verificationResult.errorMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic Concept Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-heading-sm text-foreground">
              Quick-Start Topic Blueprints
            </h2>
          </div>
          <Badge variant="secondary">
            {hydrated ? exploredTopics.length : 0} / {QUICK_START_TOPICS.length}{" "}
            Studied
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_START_TOPICS.map((topic) => {
            const isHighlighted = activeTopicSlug === topic.slug;
            const isExplored = hydrated && exploredTopics.includes(topic.slug);

            return (
              <div
                key={topic.slug}
                className={cn(
                  "flex flex-col justify-between rounded-xl border bg-surface-1 p-4 transition-colors",
                  isHighlighted
                    ? "border-primary ring-1 ring-primary/35"
                    : "border-border"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-heading-sm text-foreground">
                      {topic.title}
                    </span>
                    {isHighlighted && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {topic.subtitle}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-subtle-foreground">
                    Blueprint: {topic.sampleCodeTitle}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                  <Link
                    href={`/workspace?sample=${topic.slug}`}
                    className="font-mono text-[11px] text-primary hover:underline"
                  >
                    Open in Workspace →
                  </Link>
                  <Button
                    type="button"
                    size="xs"
                    variant={isExplored ? "subtle" : "secondary"}
                    onClick={() => {
                      markTopicExplored(topic.slug);
                      if (!isExplored) {
                        toast({
                          title: "Topic marked explored",
                          description: `"${topic.title}" added to your learning progress.`,
                          variant: "success",
                        });
                      }
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isExplored ? "Explored" : "Mark Studied"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
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
        <LearnContent />
      </Suspense>
    </AppShell>
  );
}
