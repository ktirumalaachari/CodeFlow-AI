"use client";

import * as React from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useTheme } from "next-themes";
import { Check, Copy, FileCode2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import { useTutorStore } from "@/store/use-tutor-store";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";

// Load Monaco from local static bundle in /public/monaco/vs so it works offline & sandboxed
loader.config({
  paths: {
    vs: "/monaco/vs",
  },
});

interface CodeEditorPaneProps {
  onSaveShortcut: () => void;
}

export function CodeEditorPane({ onSaveShortcut }: CodeEditorPaneProps) {
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();

  const sourceCode = useWorkspaceStore((s) => s.sourceCode);
  const editorFontSize = useWorkspaceStore((s) => s.editorFontSize);
  const selectedLineStart = useWorkspaceStore((s) => s.selectedLineStart);
  const selectedLineEnd = useWorkspaceStore((s) => s.selectedLineEnd);
  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const setSourceCode = useWorkspaceStore((s) => s.setSourceCode);
  const setSelectedLines = useWorkspaceStore((s) => s.setSelectedLines);
  const runExecution = useWorkspaceStore((s) => s.runExecution);
  const stepForward = useWorkspaceStore((s) => s.stepForward);
  const stepBackward = useWorkspaceStore((s) => s.stepBackward);
  const resetExecution = useWorkspaceStore((s) => s.resetExecution);
  const askTutor = useTutorStore((s) => s.askTutor);

  const lineNumbersPref = useProjectStore((s) => s.preferences.lineNumbers);

  const editorRef = React.useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = React.useRef<typeof Monaco | null>(null);
  const decorationsRef =
    React.useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);

  // Keep latest callbacks in refs so Monaco commands never call stale closures
  const actionsRef = React.useRef({
    runExecution,
    stepForward,
    stepBackward,
    resetExecution,
    onSaveShortcut,
  });
  React.useEffect(() => {
    actionsRef.current = {
      runExecution,
      stepForward,
      stepBackward,
      resetExecution,
      onSaveShortcut,
    };
  }, [runExecution, stepForward, stepBackward, resetExecution, onSaveShortcut]);

  const [copied, setCopied] = React.useState(false);

  const isDark = !hydrated || resolvedTheme === "dark";
  const monacoTheme = isDark ? "codeflow-dark" : "codeflow-light";

  const steps = traceResult?.steps ?? [];
  const currentStep =
    steps.length > 0 ? steps[currentStepIndex] ?? steps[0] : null;
  const errorDetail = traceResult?.error ?? null;

  // Determine active line & whether it is an error highlight
  const activeDecoration = React.useMemo(() => {
    if (currentStep) {
      const isErrorStep =
        currentStep.event === "exception" ||
        (traceResult?.status !== "completed" &&
          currentStepIndex === steps.length - 1 &&
          errorDetail?.line === currentStep.line);
      return {
        line: currentStep.line,
        kind: isErrorStep ? ("error" as const) : ("exec" as const),
      };
    }
    if (errorDetail?.line && errorDetail.line > 0) {
      return {
        line: errorDetail.line,
        kind: "error" as const,
      };
    }
    return null;
  }, [currentStep, currentStepIndex, errorDetail, steps.length, traceResult?.status]);

  const applyDecorations = React.useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (!decorationsRef.current) {
      decorationsRef.current = editor.createDecorationsCollection();
    }

    const model = editor.getModel();
    if (!model || !activeDecoration) {
      decorationsRef.current.clear();
      return;
    }

    const lineCount = model.getLineCount();
    const safeLine = Math.max(1, Math.min(lineCount, activeDecoration.line));
    const isErr = activeDecoration.kind === "error";

    decorationsRef.current.set([
      {
        range: new monaco.Range(safeLine, 1, safeLine, 1),
        options: {
          isWholeLine: true,
          className: isErr
            ? "cf-error-line-highlight"
            : "cf-exec-line-highlight",
          glyphMarginClassName: isErr
            ? "cf-error-glyph-marker"
            : "cf-exec-glyph-arrow",
          glyphMarginHoverMessage: {
            value: isErr
              ? `Error at line ${safeLine}`
              : `Currently executing line ${safeLine}`,
          },
        },
      },
    ]);

    editor.revealLineInCenterIfOutsideViewport(safeLine);
  }, [activeDecoration]);

  React.useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme("codeflow-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b728e", fontStyle: "italic" },
        { token: "keyword", foreground: "8b97ff" },
        { token: "string", foreground: "5eead4" },
        { token: "number", foreground: "fbbf24" },
        { token: "type", foreground: "c084fc" },
        { token: "identifier", foreground: "e5e7f3" },
      ],
      colors: {
        "editor.background": "#0d0f17",
        "editor.foreground": "#e6e9f4",
        "editorGutter.background": "#0d0f17",
        "editorLineNumber.foreground": "#4d536e",
        "editorLineNumber.activeForeground": "#a5b4fc",
        "editor.lineHighlightBackground": "#161a29",
        "editor.selectionBackground": "#37407a80",
        "editorIndentGuide.background1": "#1d2233",
        "editorIndentGuide.activeBackground1": "#363e5e",
      },
    });

    monaco.editor.defineTheme("codeflow-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "737b94", fontStyle: "italic" },
        { token: "keyword", foreground: "4351d5" },
        { token: "string", foreground: "0d9488" },
        { token: "number", foreground: "d97706" },
        { token: "type", foreground: "7c3aed" },
      ],
      colors: {
        "editor.background": "#f6f7fb",
        "editor.foreground": "#131726",
        "editorGutter.background": "#f6f7fb",
        "editorLineNumber.foreground": "#8b92a8",
        "editorLineNumber.activeForeground": "#4351d5",
        "editor.lineHighlightBackground": "#eceff8",
        "editor.selectionBackground": "#c7d2fe90",
        "editorIndentGuide.background1": "#e2e5f0",
        "editorIndentGuide.activeBackground1": "#b8c0dc",
      },
    });

    monaco.editor.setTheme(isDark ? "codeflow-dark" : "codeflow-light");

    // Register IDE keyboard shortcuts inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void actionsRef.current.runExecution();
    });
    editor.addCommand(monaco.KeyCode.F10, () => {
      actionsRef.current.stepForward();
    });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F10, () => {
      actionsRef.current.stepBackward();
    });
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR,
      () => {
        actionsRef.current.resetExecution();
      }
    );
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      actionsRef.current.onSaveShortcut();
    });

    editor.onDidChangeCursorSelection((ev) => {
      const sel = ev.selection;
      useWorkspaceStore
        .getState()
        .setSelectedLines(sel.startLineNumber, sel.endLineNumber);
    });

    // Ensure editor buffer matches latest store sourceCode if updated while AMD loader initialized
    const latestSource = useWorkspaceStore.getState().sourceCode;
    if (editor.getValue() !== latestSource) {
      editor.setValue(latestSource);
    }

    applyDecorations();
  };

  // Keep Monaco model strictly synced when a sample or saved project replaces sourceCode externally
  React.useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== sourceCode) {
      editor.setValue(sourceCode);
    }
  }, [sourceCode]);

  React.useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(monacoTheme);
    }
  }, [monacoTheme]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sourceCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in restricted contexts
    }
  };

  const totalLines = React.useMemo(
    () => Math.max(1, sourceCode.split("\n").length),
    [sourceCode]
  );

  const targetLine = currentStep ? currentStep.line : selectedLineStart;
  const isMultiLineSelection = selectedLineStart !== selectedLineEnd;
  const explainLabel = isMultiLineSelection
    ? `L${selectedLineStart}–L${selectedLineEnd}`
    : `L${targetLine}`;

  return (
    <section
      aria-label="Python Source Editor"
      data-testid="code-editor-pane"
      className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-border bg-surface-code shadow-elevation-1"
    >
      {/* File Tab Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-1 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-code px-2.5 py-1 text-xs font-medium text-foreground">
            <FileCode2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono">main.py</span>
          </div>
          <span className="hidden font-mono text-[11px] text-subtle-foreground sm:inline">
            {totalLines} {totalLines === 1 ? "line" : "lines"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeDecoration && (
            <Badge
              variant={activeDecoration.kind === "error" ? "rose" : "emerald"}
              data-testid="editor-active-line-badge"
              className="gap-1 px-2 py-0 font-mono text-[11px]"
            >
              <Sparkles className="h-3 w-3" />
              <span>
                {activeDecoration.kind === "error"
                  ? `Error · Line ${activeDecoration.line}`
                  : `Executing · Line ${activeDecoration.line}`}
              </span>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="xs"
            data-testid="editor-explain-line-btn"
            onClick={() => {
              if (currentStep && !isMultiLineSelection) {
                setSelectedLines(currentStep.line, currentStep.line);
              }
              void askTutor({ action: "explain_line" });
            }}
            className="h-6 gap-1 px-2 text-[11px] text-accent-violet hover:bg-accent-violet/10 hover:text-accent-violet"
            title="Ask AI Tutor to explain the selected line(s)"
          >
            <Sparkles className="h-3 w-3" />
            <span>Explain {explainLabel}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => void handleCopyCode()}
            className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-accent-emerald" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Monaco Editor Canvas */}
      <div className="relative min-h-[280px] flex-1">
        <Editor
          height="100%"
          language="python"
          value={sourceCode}
          theme={monacoTheme}
          onChange={(val) => setSourceCode(val ?? "")}
          onMount={handleEditorMount}
          loading={
            <div className="flex h-full w-full flex-col gap-2.5 p-4">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          }
          options={{
            fontSize: editorFontSize,
            fontFamily:
              "'JetBrains Mono', 'SF Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            fontLigatures: false,
            lineNumbers: lineNumbersPref ? "on" : "off",
            glyphMargin: true,
            folding: true,
            showFoldingControls: "mouseover",
            matchBrackets: "always",
            bracketPairColorization: { enabled: true },
            autoIndent: "full",
            tabSize: 4,
            insertSpaces: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            wordWrap: "off",
            guides: {
              indentation: true,
              bracketPairs: true,
            },
          }}
        />
      </div>
    </section>
  );
}
