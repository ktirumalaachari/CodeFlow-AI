import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DSATopicGuide,
  TutorActionType,
  TutorConversationSummary,
  TutorMessageItem,
  TutorProviderId,
  TutorProvidersStatusResponse,
} from "@/types/tutor";
import { ApiClientError, codeflowApi } from "@/lib/api/client";
import { extractWorkspaceExecutionContext } from "@/lib/tutor/context-extractor";
import { FALLBACK_DSA_TOPICS } from "@/lib/tutor/dsa-catalog";
import { useWorkspaceStore } from "@/store/use-workspace-store";

export type TutorPanelTab = "chat" | "dsa" | "history" | "settings";

interface AskTutorParams {
  action: TutorActionType;
  message?: string;
  hintLevelOverride?: 1 | 2 | 3;
  topicSlug?: string;
}

interface TutorState {
  isOpen: boolean;
  activeTab: TutorPanelTab;
  selectedProvider: TutorProviderId;
  selectedModel: string;
  hintMode: boolean;
  hintLevel: 1 | 2 | 3;
  allowFallback: boolean;

  providersStatus: TutorProvidersStatusResponse | null;
  dsaTopics: DSATopicGuide[];
  selectedDsaTopicSlug: string;

  activeConversationId: string | null;
  messages: TutorMessageItem[];
  conversations: TutorConversationSummary[];
  conversationCache: Record<string, TutorMessageItem[]>;

  isStreaming: boolean;
  streamingContent: string;
  streamingProvider: TutorProviderId | null;
  streamingModel: string | null;
  lastUsedFallback: boolean;
  lastFallbackReason: string | null;
  error: string | null;
  suggestedQuestions: string[];

  setTutorOpen: (open: boolean) => void;
  toggleTutorOpen: () => void;
  setActiveTab: (tab: TutorPanelTab) => void;
  setProvider: (provider: TutorProviderId, model?: string) => void;
  setModel: (model: string) => void;
  setHintMode: (enabled: boolean) => void;
  setHintLevel: (level: 1 | 2 | 3) => void;
  setAllowFallback: (allow: boolean) => void;
  setSelectedDsaTopicSlug: (slug: string) => void;

  initializeTutorData: () => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  askTutor: (params: AskTutorParams) => Promise<void>;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Explain what this program does step by step and its time complexity.",
  "Why did the current execution step update these variables?",
  "Can we compare a brute-force solution vs. an optimized approach here?",
  "Give me a progressive hint without revealing the full answer.",
];

export const useTutorStore = create<TutorState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activeTab: "chat",
      selectedProvider: "gemini",
      selectedModel: "gemini-2.5-flash",
      hintMode: false,
      hintLevel: 1,
      allowFallback: true,

      providersStatus: null,
      dsaTopics: FALLBACK_DSA_TOPICS,
      selectedDsaTopicSlug: "two-pointers",

      activeConversationId: null,
      messages: [],
      conversations: [],
      conversationCache: {},

      isStreaming: false,
      streamingContent: "",
      streamingProvider: null,
      streamingModel: null,
      lastUsedFallback: false,
      lastFallbackReason: null,
      error: null,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS,

      setTutorOpen: (open) => set({ isOpen: open }),

      toggleTutorOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setProvider: (provider, model) => {
        const status = get().providersStatus;
        const found = status?.providers.find((p) => p.id === provider);
        const defaultModel =
          model ??
          found?.default_model ??
          (provider === "gemini"
            ? "gemini-2.5-flash"
            : provider === "openai"
            ? "gpt-4o-mini"
            : "codeflow-ast-trace-v4");

        set({
          selectedProvider: provider,
          selectedModel: defaultModel,
          error: null,
        });
      },

      setModel: (model) => set({ selectedModel: model }),

      setHintMode: (enabled) => set({ hintMode: enabled }),

      setHintLevel: (level) => set({ hintLevel: level }),

      setAllowFallback: (allow) => set({ allowFallback: allow }),

      setSelectedDsaTopicSlug: (slug) => set({ selectedDsaTopicSlug: slug }),

      initializeTutorData: async () => {
        try {
          const [provStatus, topics, convs] = await Promise.all([
            codeflowApi.getTutorProviders(),
            codeflowApi.getDsaTopics(),
            codeflowApi.listTutorConversations(),
          ]);

          set((state) => ({
            providersStatus: provStatus,
            dsaTopics: topics.length > 0 ? topics : state.dsaTopics,
            conversations: convs,
          }));
        } catch {
          // Keep local FALLBACK_DSA_TOPICS if backend is temporarily unreachable
        }
      },

      startNewConversation: () =>
        set({
          activeConversationId: null,
          messages: [],
          streamingContent: "",
          error: null,
          activeTab: "chat",
        }),

      selectConversation: async (conversationId) => {
        const cached = get().conversationCache[conversationId];
        if (cached) {
          set({
            activeConversationId: conversationId,
            messages: cached,
            activeTab: "chat",
            error: null,
          });
        }

        try {
          const detail = await codeflowApi.getTutorConversation(conversationId);
          set((state) => ({
            activeConversationId: detail.id,
            messages: detail.messages,
            activeTab: "chat",
            error: null,
            conversationCache: {
              ...state.conversationCache,
              [detail.id]: detail.messages,
            },
          }));
        } catch (err) {
          if (!cached) {
            set({
              error:
                err instanceof ApiClientError
                  ? err.message
                  : "Failed to load conversation history.",
            });
          }
        }
      },

      deleteConversation: async (conversationId) => {
        try {
          await codeflowApi.deleteTutorConversation(conversationId);
        } catch {
          // Also remove from local state even if backend record was already gone
        }

        set((state) => {
          const nextCache = { ...state.conversationCache };
          delete nextCache[conversationId];
          const isCurrent = state.activeConversationId === conversationId;
          return {
            conversations: state.conversations.filter(
              (c) => c.id !== conversationId
            ),
            conversationCache: nextCache,
            activeConversationId: isCurrent ? null : state.activeConversationId,
            messages: isCurrent ? [] : state.messages,
          };
        });
      },

      askTutor: async ({
        action,
        message = "",
        hintLevelOverride,
        topicSlug,
      }) => {
        if (get().isStreaming) return;

        const ws = useWorkspaceStore.getState();
        const executionContext = extractWorkspaceExecutionContext({
          sourceCode: ws.sourceCode,
          traceResult: ws.traceResult,
          currentStepIndex: ws.currentStepIndex,
          selectedLineStart: ws.selectedLineStart,
          selectedLineEnd: ws.selectedLineEnd,
          selectedStructureId: ws.selectedStructureId,
        });

        const {
          selectedProvider,
          selectedModel,
          activeConversationId,
          hintMode,
          hintLevel,
          allowFallback,
        } = get();

        const effectiveHintLevel = hintLevelOverride ?? hintLevel;
        const effectiveHintMode = hintMode || action === "hint";

        const actionLabelMap: Record<TutorActionType, string> = {
          explain_program:
            "Explain this complete Python program and its complexity.",
          explain_line: `Explain Line${
            executionContext.selected_line_start !==
            executionContext.selected_line_end
              ? `s L${executionContext.selected_line_start}–L${executionContext.selected_line_end}`
              : ` L${executionContext.selected_line_start ?? 1}`
          } using actual runtime values.`,
          explain_step: executionContext.current_step
            ? `Explain Step ${executionContext.current_step.step} (Line ${executionContext.current_step.line}) using live variable values.`
            : "Explain the current execution state.",
          explain_why: executionContext.current_step
            ? `Why did Step ${executionContext.current_step.step} (Line ${executionContext.current_step.line}) perform this operation?`
            : "Explain why this operation occurred.",
          debug_error: executionContext.error
            ? `Debug ${executionContext.error.error_type} at Line ${
                executionContext.error.line ?? 1
              } and suggest a fix.`
            : "Inspect my code for potential bugs or edge cases.",
          hint: `Give me Progressive Hint #${effectiveHintLevel} (of 3) without revealing the full solution.`,
          dsa_topic: `Teach me the DSA topic '${
            topicSlug ?? "algorithmic pattern"
          }' with Brute-Force vs. Optimized comparison.`,
          chat: message.trim() || "Explain what is happening in my code.",
        };

        const displayUserContent = message.trim() || actionLabelMap[action];

        const optimisticUserMessage: TutorMessageItem = {
          id: `temp_user_${Date.now()}`,
          role: "user",
          action,
          content: displayUserContent,
          provider: selectedProvider,
          model: selectedModel,
          used_fallback: false,
          hint_mode: effectiveHintMode,
          hint_level: effectiveHintMode ? effectiveHintLevel : null,
          step_number: executionContext.current_step?.step ?? null,
          line_number:
            executionContext.selected_line_start ??
            executionContext.current_step?.line ??
            null,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          isOpen: true,
          activeTab: "chat",
          isStreaming: true,
          streamingContent: "",
          streamingProvider: selectedProvider,
          streamingModel: selectedModel,
          error: null,
          messages: [...state.messages, optimisticUserMessage],
        }));

        try {
          await codeflowApi.streamTutorChat(
            {
              action,
              message: displayUserContent,
              provider: selectedProvider,
              model: selectedModel,
              conversation_id: activeConversationId,
              hint_mode: effectiveHintMode,
              hint_level: effectiveHintLevel,
              topic_slug: topicSlug ?? null,
              allow_fallback: allowFallback,
              execution_context: executionContext,
            },
            {
              onDelta: (delta, provider, model) => {
                set((state) => ({
                  streamingContent: state.streamingContent + delta,
                  streamingProvider: provider,
                  streamingModel: model,
                }));
              },
              onDone: (donePayload) => {
                set((state) => {
                  const updatedMessages = [
                    ...state.messages,
                    donePayload.message,
                  ];
                  const existingConvIndex = state.conversations.findIndex(
                    (c) => c.id === donePayload.conversation_id
                  );
                  const summaryItem: TutorConversationSummary = {
                    id: donePayload.conversation_id,
                    title:
                      existingConvIndex >= 0
                        ? state.conversations[existingConvIndex].title
                        : displayUserContent.slice(0, 72),
                    provider: donePayload.provider,
                    model: donePayload.model,
                    message_count: updatedMessages.length,
                    created_at:
                      existingConvIndex >= 0
                        ? state.conversations[existingConvIndex].created_at
                        : new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };

                  const nextConversations =
                    existingConvIndex >= 0
                      ? [
                          summaryItem,
                          ...state.conversations.filter(
                            (c) => c.id !== donePayload.conversation_id
                          ),
                        ]
                      : [summaryItem, ...state.conversations];

                  return {
                    activeConversationId: donePayload.conversation_id,
                    messages: updatedMessages,
                    conversations: nextConversations,
                    conversationCache: {
                      ...state.conversationCache,
                      [donePayload.conversation_id]: updatedMessages,
                    },
                    isStreaming: false,
                    streamingContent: "",
                    lastUsedFallback: donePayload.used_fallback,
                    lastFallbackReason: donePayload.fallback_reason ?? null,
                    suggestedQuestions:
                      donePayload.suggested_questions.length > 0
                        ? donePayload.suggested_questions
                        : state.suggestedQuestions,
                  };
                });
              },
            }
          );
        } catch (err) {
          const messageText =
            err instanceof ApiClientError
              ? err.message
              : "Unable to complete AI Tutor request.";
          set({
            isStreaming: false,
            streamingContent: "",
            error: messageText,
          });
        }
      },
    }),
    {
      name: "codeflow-ai-tutor-v4",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isOpen: state.isOpen,
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
        hintMode: state.hintMode,
        hintLevel: state.hintLevel,
        allowFallback: state.allowFallback,
        selectedDsaTopicSlug: state.selectedDsaTopicSlug,
        conversations: state.conversations,
        conversationCache: state.conversationCache,
      }),
    }
  )
);
