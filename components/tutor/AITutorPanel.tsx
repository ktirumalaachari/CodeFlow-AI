"use client";

import * as React from "react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Bug,
  CheckCircle2,
  Code2,
  Cpu,
  FileCode2,
  HelpCircle,
  History,
  Lightbulb,
  MessageSquare,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TutorMarkdownRenderer } from "@/components/tutor/TutorMarkdownRenderer";
import { DSALearningAssistantView } from "@/components/tutor/DSALearningAssistantView";
import { useTutorStore, type TutorPanelTab } from "@/store/use-tutor-store";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import type { TutorProviderId } from "@/types/tutor";
import { cn } from "@/lib/utils";

interface AITutorPanelProps {
  onClose?: () => void;
  fullPage?: boolean;
}

export function AITutorPanel({
  onClose,
  fullPage = false,
}: AITutorPanelProps) {
  const activeTab = useTutorStore((s) => s.activeTab);
  const selectedProvider = useTutorStore((s) => s.selectedProvider);
  const selectedModel = useTutorStore((s) => s.selectedModel);
  const hintMode = useTutorStore((s) => s.hintMode);
  const hintLevel = useTutorStore((s) => s.hintLevel);
  const allowFallback = useTutorStore((s) => s.allowFallback);
  const providersStatus = useTutorStore((s) => s.providersStatus);
  const activeConversationId = useTutorStore((s) => s.activeConversationId);
  const messages = useTutorStore((s) => s.messages);
  const conversations = useTutorStore((s) => s.conversations);
  const isStreaming = useTutorStore((s) => s.isStreaming);
  const streamingContent = useTutorStore((s) => s.streamingContent);
  const lastUsedFallback = useTutorStore((s) => s.lastUsedFallback);
  const lastFallbackReason = useTutorStore((s) => s.lastFallbackReason);
  const error = useTutorStore((s) => s.error);
  const suggestedQuestions = useTutorStore((s) => s.suggestedQuestions);

  const setActiveTab = useTutorStore((s) => s.setActiveTab);
  const setProvider = useTutorStore((s) => s.setProvider);
  const setModel = useTutorStore((s) => s.setModel);
  const setHintMode = useTutorStore((s) => s.setHintMode);
  const setHintLevel = useTutorStore((s) => s.setHintLevel);
  const setAllowFallback = useTutorStore((s) => s.setAllowFallback);
  const initializeTutorData = useTutorStore((s) => s.initializeTutorData);
  const startNewConversation = useTutorStore((s) => s.startNewConversation);
  const selectConversation = useTutorStore((s) => s.selectConversation);
  const deleteConversation = useTutorStore((s) => s.deleteConversation);
  const askTutor = useTutorStore((s) => s.askTutor);

  const traceResult = useWorkspaceStore((s) => s.traceResult);
  const currentStepIndex = useWorkspaceStore((s) => s.currentStepIndex);
  const selectedLineStart = useWorkspaceStore((s) => s.selectedLineStart);
  const selectedLineEnd = useWorkspaceStore((s) => s.selectedLineEnd);

  const [questionInput, setQuestionInput] = React.useState("");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    void initializeTutorData();
  }, [initializeTutorData]);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingContent]);

  const steps = traceResult?.steps ?? [];
  const currentStep =
    steps.length > 0 ? steps[currentStepIndex] ?? steps[0] : null;
  const errorDetail = traceResult?.error ?? null;
  const variableCount = currentStep
    ? currentStep.locals.length + currentStep.globals.length
    : 0;

  const activeProviderInfo = React.useMemo(() => {
    return (
      providersStatus?.providers.find((p) => p.id === selectedProvider) ?? null
    );
  }, [providersStatus, selectedProvider]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = questionInput.trim();
    if (!trimmed || isStreaming) return;
    setQuestionInput("");
    void askTutor({
      action: "chat",
      message: trimmed,
    });
  };

  const selectedLineLabel =
    selectedLineStart === selectedLineEnd
      ? `L${selectedLineStart}`
      : `L${selectedLineStart}–L${selectedLineEnd}`;

  const tabs: { id: TutorPanelTab; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Tutor Chat", icon: MessageSquare },
    { id: "dsa", label: "DSA Guide", icon: BookOpen },
    { id: "history", label: `History (${conversations.length})`, icon: History },
    { id: "settings", label: "Provider", icon: Settings2 },
  ];

  return (
    <section
      aria-label="AI Code Tutor Panel"
      data-testid="ai-tutor-panel"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-elevation-1",
        fullPage ? "min-h-[680px]" : "h-full min-h-[380px]"
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-accent-violet/35 bg-accent-violet/15 text-accent-violet">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold tracking-tight text-foreground">
                AI Code Tutor
              </h2>
              <Badge
                variant={
                  selectedProvider === "gemini"
                    ? "indigo"
                    : selectedProvider === "openai"
                    ? "emerald"
                    : "violet"
                }
                data-testid="tutor-active-provider-badge"
                className="px-1.5 py-0 text-[10px]"
              >
                {selectedProvider === "gemini"
                  ? "Gemini"
                  : selectedProvider === "openai"
                  ? "OpenAI"
                  : "AST Grounded"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right Controls: Hint Mode Switch + New Chat + Optional Close */}
        <div className="flex items-center gap-2">
          <label
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface-1 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            title="Hint Mode guides you with progressive clues without spoiling the full solution"
          >
            <Lightbulb
              className={cn(
                "h-3 w-3",
                hintMode ? "text-accent-amber" : "text-subtle-foreground"
              )}
            />
            <span>Hint Mode</span>
            <Switch
              checked={hintMode}
              onCheckedChange={(checked) => setHintMode(checked)}
              data-testid="tutor-hint-mode-toggle"
              aria-label="Toggle Hint Mode"
              className="scale-75"
            />
          </label>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={startNewConversation}
            data-testid="tutor-new-chat-btn"
            className="h-6 gap-1 px-2 text-[11px]"
            title="Start a new tutor conversation"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">New</span>
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close AI Tutor panel"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-1 border-b border-border-subtle bg-surface-1 px-2.5 py-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tutor-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Execution Context Attached Pill */}
        <div className="hidden items-center gap-1.5 font-mono text-[10px] text-subtle-foreground sm:flex">
          {currentStep ? (
            <span
              data-testid="tutor-context-indicator"
              className="rounded border border-accent-emerald/30 bg-accent-emerald/10 px-1.5 py-0.5 text-accent-emerald"
            >
              Step {currentStep.step}/{steps.length} · L{currentStep.line} ·{" "}
              {variableCount} vars
            </span>
          ) : (
            <span
              data-testid="tutor-context-indicator"
              className="rounded border border-border bg-surface-2 px-1.5 py-0.5"
            >
              Editor {selectedLineLabel}
            </span>
          )}
        </div>
      </div>

      {/* Main Tab Body */}
      {activeTab === "chat" && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Quick Context Actions Strip */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-surface-2/30 px-3 py-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={isStreaming}
              data-testid="tutor-action-explain-step"
              onClick={() => void askTutor({ action: "explain_step" })}
              className="h-6 gap-1 px-2 text-[11px]"
            >
              <Cpu className="h-3 w-3 text-primary" />
              <span>
                {currentStep
                  ? `Explain Step ${currentStep.step}`
                  : "Explain Step"}
              </span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={isStreaming}
              data-testid="tutor-action-explain-line"
              onClick={() => void askTutor({ action: "explain_line" })}
              className="h-6 gap-1 px-2 text-[11px]"
            >
              <FileCode2 className="h-3 w-3 text-accent-violet" />
              <span>Explain {selectedLineLabel}</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={isStreaming}
              data-testid="tutor-action-explain-why"
              onClick={() => void askTutor({ action: "explain_why" })}
              className="h-6 gap-1 px-2 text-[11px]"
            >
              <HelpCircle className="h-3 w-3 text-accent-emerald" />
              <span>Why This Step?</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={isStreaming}
              data-testid="tutor-action-explain-program"
              onClick={() => void askTutor({ action: "explain_program" })}
              className="h-6 gap-1 px-2 text-[11px]"
            >
              <Code2 className="h-3 w-3 text-primary" />
              <span>Explain Program</span>
            </Button>

            <Button
              type="button"
              variant={errorDetail ? "destructive" : "secondary"}
              size="xs"
              disabled={isStreaming}
              data-testid="tutor-action-debug-error"
              onClick={() => void askTutor({ action: "debug_error" })}
              className="h-6 gap-1 px-2 text-[11px]"
            >
              <Bug className="h-3 w-3" />
              <span>
                {errorDetail
                  ? `Debug ${errorDetail.error_type}`
                  : "Debug Code"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isStreaming}
              data-testid="tutor-action-hint"
              onClick={() =>
                void askTutor({
                  action: "hint",
                  hintLevelOverride: hintLevel,
                })
              }
              className="h-6 gap-1 border-accent-amber/35 bg-accent-amber/10 px-2 text-[11px] text-accent-amber hover:bg-accent-amber/20"
            >
              <Lightbulb className="h-3 w-3" />
              <span>Hint ({hintLevel}/3)</span>
            </Button>
          </div>

          {/* Scrollable Messages Stream */}
          <div
            ref={scrollContainerRef}
            data-testid="tutor-messages-list"
            className="flex-1 space-y-3 overflow-y-auto p-3"
          >
            {messages.length === 0 && !isStreaming ? (
              <div className="space-y-3 rounded-xl border border-border-subtle bg-surface-2/40 p-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      Execution-Grounded AI Tutor Ready
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Every explanation uses your live Python source code,
                      active line highlight ({selectedLineLabel}), variable
                      snapshots, call stack frames, and data structure
                      visualizers.
                    </p>
                  </div>
                </div>

                {/* Suggested Context-Aware Questions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                    Suggested Questions for Current Context
                  </span>
                  <div className="grid gap-1.5">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        data-testid={`tutor-suggested-q-${idx}`}
                        onClick={() =>
                          void askTutor({ action: "chat", message: q })
                        }
                        className="flex items-center justify-between rounded-lg border border-border bg-surface-1 px-2.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <span>{q}</span>
                        <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    data-testid={`tutor-message-${msg.role}`}
                    className={cn(
                      "rounded-xl border p-3",
                      msg.role === "user"
                        ? "ml-6 border-primary/30 bg-primary/[0.08]"
                        : "border-border bg-surface-2/50"
                    )}
                  >
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                        {msg.role === "user" ? (
                          <>
                            <User className="h-3 w-3 text-primary" />
                            <span>You</span>
                          </>
                        ) : (
                          <>
                            <Bot className="h-3.5 w-3.5 text-accent-violet" />
                            <span>CODEFLOW Tutor</span>
                          </>
                        )}
                        {msg.step_number && (
                          <Badge variant="mono" className="px-1.5 py-0 text-[9px]">
                            Step {msg.step_number}
                          </Badge>
                        )}
                        {msg.line_number && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                            L{msg.line_number}
                          </Badge>
                        )}
                      </div>

                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={
                              msg.provider === "gemini"
                                ? "indigo"
                                : msg.provider === "openai"
                                ? "emerald"
                                : "secondary"
                            }
                            className="px-1.5 py-0 font-mono text-[9px]"
                          >
                            {msg.provider} · {msg.model}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" ? (
                      <p className="text-xs text-foreground">{msg.content}</p>
                    ) : (
                      <div className="space-y-2">
                        <TutorMarkdownRenderer content={msg.content} />

                        {/* Progressive Hint Next-Level Controls */}
                        {(msg.action === "hint" || msg.hint_mode) && (
                          <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2">
                            <span className="text-[10px] font-medium text-subtle-foreground">
                              Need more detail?
                            </span>
                            {([1, 2, 3] as const).map((lvl) => (
                              <Button
                                key={lvl}
                                type="button"
                                size="xs"
                                variant={
                                  msg.hint_level === lvl
                                    ? "default"
                                    : "outline"
                                }
                                data-testid={`tutor-hint-level-btn-${lvl}`}
                                onClick={() => {
                                  setHintLevel(lvl);
                                  void askTutor({
                                    action: "hint",
                                    hintLevelOverride: lvl,
                                  });
                                }}
                                className="h-5 px-2 text-[10px]"
                              >
                                Hint {lvl}/3
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Active Streaming Message Bubble */}
                {isStreaming && (
                  <div
                    data-testid="tutor-streaming-bubble"
                    className="rounded-xl border border-primary/35 bg-surface-2/60 p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      <span>Streaming Execution-Aware Analysis…</span>
                    </div>
                    {streamingContent ? (
                      <TutorMarkdownRenderer content={streamingContent} />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Inspecting Python AST and runtime variable snapshots…
                      </p>
                    )}
                  </div>
                )}

                {/* Fallback Notice Banner (Honest Reporting When Cloud API Key Not Set) */}
                {lastUsedFallback && lastFallbackReason && (
                  <div
                    data-testid="tutor-fallback-notice"
                    className="rounded-lg border border-border-subtle bg-surface-2/40 px-2.5 py-1.5 text-[10px] text-subtle-foreground"
                  >
                    <strong>Note:</strong> {lastFallbackReason}
                  </div>
                )}

                {/* Follow-Up Suggestions */}
                {!isStreaming && suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {suggestedQuestions.slice(0, 2).map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          void askTutor({ action: "chat", message: q })
                        }
                        className="rounded-md border border-border bg-surface-1 px-2 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && (
              <div
                data-testid="tutor-error-banner"
                className="rounded-lg border border-accent-rose/35 bg-accent-rose/10 p-2.5 text-xs text-accent-rose"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>AI Tutor Request Error</span>
                </div>
                <p className="mt-1 text-muted-foreground">{error}</p>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendChat}
            className="flex items-center gap-2 border-t border-border bg-surface-2/40 p-2.5"
          >
            <Input
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder={
                hintMode
                  ? "Ask for a hint about your code or current step…"
                  : "Ask about a variable, line, loop invariant, or complexity…"
              }
              disabled={isStreaming}
              data-testid="tutor-chat-input"
              className="h-8 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isStreaming || !questionInput.trim()}
              data-testid="tutor-chat-send-btn"
              className="h-8 gap-1 px-3 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Ask</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: DSA Learning Assistant */}
      {activeTab === "dsa" && (
        <div className="flex-1 overflow-y-auto p-3">
          <DSALearningAssistantView compact={!fullPage} />
        </div>
      )}

      {/* Tab 3: Persisted Conversation History */}
      {activeTab === "history" && (
        <div
          className="flex-1 space-y-2.5 overflow-y-auto p-3"
          data-testid="tutor-history-view"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Persisted Tutor Sessions ({conversations.length})
            </span>
            <Button
              type="button"
              size="xs"
              variant="secondary"
              onClick={startNewConversation}
            >
              <Plus className="h-3 w-3" />
              <span>New Session</span>
            </Button>
          </div>

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-2/40 p-4 text-center text-xs text-muted-foreground">
              No saved tutor conversations yet. Ask a question or click any
              quick action to persist a session.
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const isCurrent = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    data-testid={`tutor-conv-item-${conv.id}`}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors",
                      isCurrent
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface-2/40 hover:border-border-strong"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void selectConversation(conv.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-medium text-foreground">
                        {conv.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-subtle-foreground">
                        <span>{conv.provider}</span>
                        <span>·</span>
                        <span>{conv.message_count} msgs</span>
                      </div>
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid={`tutor-delete-conv-${conv.id}`}
                      onClick={() => void deleteConversation(conv.id)}
                      aria-label={`Delete conversation ${conv.title}`}
                      className="h-6 w-6 text-muted-foreground hover:text-accent-rose"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Provider & Model Configuration */}
      {activeTab === "settings" && (
        <div
          className="flex-1 space-y-4 overflow-y-auto p-3"
          data-testid="tutor-settings-view"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-foreground">
              Provider-Independent AI Architecture
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Select your preferred AI provider and model. API keys remain
              strictly on the FastAPI server (`GEMINI_API_KEY`, `OPENAI_API_KEY`).
            </p>
          </div>

          {/* Provider Cards: 1. Google Gemini (Primary), 2. OpenAI (Alternative), 3. Execution-Grounded */}
          <div className="space-y-2">
            {(
              providersStatus?.providers ?? [
                {
                  id: "gemini" as TutorProviderId,
                  name: "Google Gemini",
                  role: "Primary Provider",
                  configured: false,
                  status: "missing_api_key" as const,
                  default_model: "gemini-2.5-flash",
                  models: [
                    {
                      id: "gemini-2.5-flash",
                      label: "Gemini 2.5 Flash",
                      description: "Fast step debugging",
                      is_default: true,
                    },
                    {
                      id: "gemini-2.5-pro",
                      label: "Gemini 2.5 Pro",
                      description: "Deep algorithmic reasoning",
                      is_default: false,
                    },
                  ],
                  env_var: "GEMINI_API_KEY",
                  notes: "Set GEMINI_API_KEY in backend .env.",
                },
                {
                  id: "openai" as TutorProviderId,
                  name: "OpenAI",
                  role: "Alternative Provider",
                  configured: false,
                  status: "missing_api_key" as const,
                  default_model: "gpt-4o-mini",
                  models: [
                    {
                      id: "gpt-4o-mini",
                      label: "GPT-4o mini",
                      description: "Fast execution explanations",
                      is_default: true,
                    },
                    {
                      id: "gpt-4o",
                      label: "GPT-4o",
                      description: "Advanced DSA coaching",
                      is_default: false,
                    },
                  ],
                  env_var: "OPENAI_API_KEY",
                  notes: "Set OPENAI_API_KEY in backend .env.",
                },
                {
                  id: "execution_grounded" as TutorProviderId,
                  name: "Execution-Grounded Engine",
                  role: "Built-in Local AST & Trace Engine",
                  configured: true,
                  status: "local_ready" as const,
                  default_model: "codeflow-ast-trace-v4",
                  models: [
                    {
                      id: "codeflow-ast-trace-v4",
                      label: "CODEFLOW AST + Trace Engine v4",
                      description: "Deterministic local analyzer",
                      is_default: true,
                    },
                  ],
                  env_var: null,
                  notes: "Always available offline.",
                },
              ]
            ).map((prov) => {
              const isSelected = selectedProvider === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  data-testid={`tutor-select-provider-${prov.id}`}
                  onClick={() => setProvider(prov.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-surface-2/40 hover:border-border-strong"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {prov.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {prov.role}
                      </Badge>
                    </div>
                    <Badge
                      variant={
                        prov.status === "ready" || prov.status === "local_ready"
                          ? "emerald"
                          : "amber"
                      }
                      className="text-[10px]"
                    >
                      {prov.status === "ready" ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          API Key Ready
                        </span>
                      ) : prov.status === "local_ready" ? (
                        "Built-in Ready"
                      ) : (
                        "Needs .env Key"
                      )}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {prov.notes}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Model Selector for Active Provider */}
          {activeProviderInfo && activeProviderInfo.models.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Active Model ({activeProviderInfo.name})
              </label>
              <div className="grid gap-1.5">
                {activeProviderInfo.models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`tutor-select-model-${m.id}`}
                    onClick={() => setModel(m.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                      selectedModel === m.id
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div>
                      <p className="font-mono font-medium text-foreground">
                        {m.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                    {selectedModel === m.id && (
                      <Badge variant="indigo" className="text-[10px]">
                        Selected
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Automatic Fallback Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-3">
            <div className="space-y-0.5 pr-3">
              <p className="text-xs font-medium text-foreground">
                Automatic Execution-Grounded Fallback
              </p>
              <p className="text-[11px] text-muted-foreground">
                When a cloud API key is not set in `.env`, automatically answer
                using the built-in Python AST &amp; Snapshot Analyzer.
              </p>
            </div>
            <Switch
              checked={allowFallback}
              onCheckedChange={(checked) => setAllowFallback(checked)}
              data-testid="tutor-allow-fallback-toggle"
              aria-label="Toggle automatic execution-grounded fallback"
            />
          </div>
        </div>
      )}
    </section>
  );
}
