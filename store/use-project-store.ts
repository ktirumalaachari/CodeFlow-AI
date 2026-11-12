import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CodeProject,
  ExecutionHistoryEntry,
  NotificationItem,
  ProjectStatus,
  SupportedLanguageId,
} from "@/types";
import {
  INITIAL_LOCAL_PROJECTS,
  INITIAL_NOTIFICATIONS,
} from "@/lib/data/catalog";
import { codeflowApi } from "@/lib/api/client";
import { createLocalId } from "@/lib/utils";

export interface WorkspacePreferences {
  displayName: string;
  roleLabel: string;
  preferredLanguage: SupportedLanguageId;
  lineNumbers: boolean;
  highlightMutatedVariables: boolean;
  compactProjectTable: boolean;
}

interface ProjectStoreState {
  projects: CodeProject[];
  executionHistory: ExecutionHistoryEntry[];
  exploredTopics: string[];
  exploredAlgorithms: string[];
  completedLessons: string[];
  completedExercises: string[];
  activeTrackId: string;
  backendSynced: boolean;
  notifications: NotificationItem[];
  preferences: WorkspacePreferences;

  syncWithBackend: () => Promise<void>;

  createProject: (payload: {
    name: string;
    description?: string;
    language?: SupportedLanguageId;
    topicSlug?: string;
    status?: ProjectStatus;
    codePreview?: string;
  }) => CodeProject;
  renameProject: (id: string, newName: string) => void;
  updateProject: (
    id: string,
    patch: Partial<
      Pick<
        CodeProject,
        "name" | "description" | "codePreview" | "status" | "topicSlug"
      >
    >
  ) => void;
  duplicateProject: (id: string) => CodeProject | null;
  deleteProject: (id: string) => void;
  touchProject: (id: string) => void;
  resetDemoProjects: () => void;

  recordExecutionRun: (payload: {
    title: string;
    sourceCode: string;
    language?: SupportedLanguageId;
    status: string;
    totalSteps: number;
    durationMs: number;
    executionMode: string;
    stdoutPreview: string;
    errorTitle?: string | null;
  }) => ExecutionHistoryEntry;
  deleteHistoryEntry: (id: string) => void;
  clearExecutionHistory: () => void;

  markTopicExplored: (slug: string) => void;
  markAlgorithmExplored: (slug: string) => void;
  toggleLessonCompleted: (lessonId: string) => void;
  markExerciseCompleted: (exerciseId: string, lessonId?: string) => void;
  setActiveTrackId: (trackId: string) => void;
  resetLearningProgress: () => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  updatePreferences: (patch: Partial<WorkspacePreferences>) => void;
}

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  displayName: "Developer Guest",
  roleLabel: "Local Workspace",
  preferredLanguage: "python",
  lineNumbers: true,
  highlightMutatedVariables: true,
  compactProjectTable: false,
};

function pushLearningProgressToBackend(state: {
  exploredTopics: string[];
  exploredAlgorithms: string[];
  completedLessons: string[];
  completedExercises: string[];
  activeTrackId: string;
}): void {
  void codeflowApi
    .updateLearningProgress({
      explored_topics: state.exploredTopics,
      explored_algorithms: state.exploredAlgorithms,
      completed_lessons: state.completedLessons,
      completed_exercises: state.completedExercises,
      active_track_id: state.activeTrackId,
    })
    .catch(() => {
      // Offline fallback: localStorage remains authoritative until backend reconnects
    });
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_LOCAL_PROJECTS,
      executionHistory: [],
      exploredTopics: ["python-basics", "arrays", "sliding-window"],
      exploredAlgorithms: ["binary-search", "sliding-window-subarray"],
      completedLessons: ["lesson-variables-memory"],
      completedExercises: [],
      activeTrackId: "track-foundations",
      backendSynced: false,
      notifications: INITIAL_NOTIFICATIONS,
      preferences: DEFAULT_PREFERENCES,

      syncWithBackend: async () => {
        try {
          const [remoteProjects, remoteHistory, remoteProgress] =
            await Promise.all([
              codeflowApi.listProjects(),
              codeflowApi.listExecutionHistory(),
              codeflowApi.getLearningProgress(),
            ]);

          set((state) => ({
            projects:
              remoteProjects.length > 0 ? remoteProjects : state.projects,
            executionHistory: remoteHistory,
            exploredTopics: remoteProgress.explored_topics,
            exploredAlgorithms: remoteProgress.explored_algorithms,
            completedLessons: remoteProgress.completed_lessons,
            completedExercises: remoteProgress.completed_exercises,
            activeTrackId:
              remoteProgress.active_track_id || state.activeTrackId,
            backendSynced: true,
          }));
        } catch {
          // Backend offline: continue seamlessly with persisted localStorage state
        }
      },

      createProject: (payload) => {
        const now = new Date().toISOString();
        const newProject: CodeProject = {
          id: createLocalId("proj"),
          name: payload.name.trim() || "Untitled Visualization",
          description:
            payload.description?.trim() ||
            "Python program saved in CODEFLOW AI workspace.",
          language: payload.language ?? "python",
          topicSlug: payload.topicSlug ?? "python-basics",
          lastModifiedIso: now,
          createdAtIso: now,
          status: payload.status ?? "Draft",
          isDemoSeed: false,
          codePreview:
            payload.codePreview ??
            `def solve(items: list[int]) -> int:\n    total = 0\n    for value in items:\n        total += value\n    return total\n\nprint(solve([10, 20, 30]))`,
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
        }));

        void codeflowApi
          .createProject({
            id: newProject.id,
            name: newProject.name,
            description: newProject.description,
            language: newProject.language,
            topicSlug: newProject.topicSlug,
            status: newProject.status,
            codePreview: newProject.codePreview,
          })
          .catch(() => {});

        return newProject;
      },

      renameProject: (id, newName) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        const now = new Date().toISOString();

        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id
              ? { ...proj, name: trimmed, lastModifiedIso: now }
              : proj
          ),
        }));

        void codeflowApi.updateProject(id, { name: trimmed }).catch(() => {});
      },

      updateProject: (id, patch) => {
        const now = new Date().toISOString();
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id
              ? {
                  ...proj,
                  ...patch,
                  name: patch.name?.trim() || proj.name,
                  lastModifiedIso: now,
                }
              : proj
          ),
        }));

        void codeflowApi.updateProject(id, patch).catch(() => {});
      },

      duplicateProject: (id) => {
        const existing = get().projects.find((proj) => proj.id === id);
        if (!existing) return null;

        const now = new Date().toISOString();
        const copy: CodeProject = {
          ...existing,
          id: createLocalId("proj"),
          name: `${existing.name} (Copy)`,
          lastModifiedIso: now,
          createdAtIso: now,
          status: "Draft",
          isDemoSeed: false,
        };

        set((state) => ({
          projects: [copy, ...state.projects],
        }));

        void codeflowApi
          .createProject({
            id: copy.id,
            name: copy.name,
            description: copy.description,
            language: copy.language,
            topicSlug: copy.topicSlug,
            status: copy.status,
            codePreview: copy.codePreview,
          })
          .catch(() => {});

        return copy;
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((proj) => proj.id !== id),
        }));

        void codeflowApi.deleteProject(id).catch(() => {});
      },

      touchProject: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, lastModifiedIso: now } : proj
          ),
        }));
      },

      resetDemoProjects: () => {
        set({ projects: INITIAL_LOCAL_PROJECTS });
        void codeflowApi
          .resetProjects()
          .then((remote) => {
            if (remote.length > 0) {
              set({ projects: remote });
            }
          })
          .catch(() => {});
      },

      recordExecutionRun: (payload) => {
        const now = new Date().toISOString();
        const entry: ExecutionHistoryEntry = {
          id: createLocalId("run"),
          title: payload.title.trim() || "Workspace Execution",
          sourceCode: payload.sourceCode,
          language: payload.language ?? "python",
          status: payload.status,
          totalSteps: payload.totalSteps,
          durationMs: payload.durationMs,
          executionMode: payload.executionMode,
          stdoutPreview: payload.stdoutPreview.slice(0, 500),
          errorTitle: payload.errorTitle ?? null,
          createdAtIso: now,
        };

        set((state) => ({
          executionHistory: [entry, ...state.executionHistory].slice(0, 50),
        }));

        void codeflowApi
          .createExecutionHistoryEntry({
            id: entry.id,
            title: entry.title,
            sourceCode: entry.sourceCode,
            language: entry.language,
            status: entry.status,
            totalSteps: entry.totalSteps,
            durationMs: entry.durationMs,
            executionMode: entry.executionMode,
            stdoutPreview: entry.stdoutPreview,
            errorTitle: entry.errorTitle,
          })
          .catch(() => {});

        return entry;
      },

      deleteHistoryEntry: (id) => {
        set((state) => ({
          executionHistory: state.executionHistory.filter((h) => h.id !== id),
        }));
        void codeflowApi.deleteExecutionHistoryEntry(id).catch(() => {});
      },

      clearExecutionHistory: () => {
        set({ executionHistory: [] });
        void codeflowApi.clearExecutionHistory().catch(() => {});
      },

      markTopicExplored: (slug) => {
        set((state) => {
          if (state.exploredTopics.includes(slug)) return state;
          const next = {
            ...state,
            exploredTopics: [...state.exploredTopics, slug],
          };
          pushLearningProgressToBackend(next);
          return { exploredTopics: next.exploredTopics };
        });
      },

      markAlgorithmExplored: (slug) => {
        set((state) => {
          if (state.exploredAlgorithms.includes(slug)) return state;
          const next = {
            ...state,
            exploredAlgorithms: [...state.exploredAlgorithms, slug],
          };
          pushLearningProgressToBackend(next);
          return { exploredAlgorithms: next.exploredAlgorithms };
        });
      },

      toggleLessonCompleted: (lessonId) => {
        set((state) => {
          const exists = state.completedLessons.includes(lessonId);
          const completedLessons = exists
            ? state.completedLessons.filter((id) => id !== lessonId)
            : [...state.completedLessons, lessonId];
          const next = { ...state, completedLessons };
          pushLearningProgressToBackend(next);
          return { completedLessons };
        });
      },

      markExerciseCompleted: (exerciseId, lessonId) => {
        set((state) => {
          const completedExercises = state.completedExercises.includes(
            exerciseId
          )
            ? state.completedExercises
            : [...state.completedExercises, exerciseId];
          const completedLessons =
            lessonId && !state.completedLessons.includes(lessonId)
              ? [...state.completedLessons, lessonId]
              : state.completedLessons;
          const next = {
            ...state,
            completedExercises,
            completedLessons,
          };
          pushLearningProgressToBackend(next);
          return { completedExercises, completedLessons };
        });
      },

      setActiveTrackId: (trackId) => {
        set((state) => {
          const next = { ...state, activeTrackId: trackId };
          pushLearningProgressToBackend(next);
          return { activeTrackId: trackId };
        });
      },

      resetLearningProgress: () => {
        set({
          exploredTopics: [],
          exploredAlgorithms: [],
          completedLessons: [],
          completedExercises: [],
          activeTrackId: "track-foundations",
        });
        void codeflowApi.resetLearningProgress().catch(() => {});
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      updatePreferences: (patch) => {
        set((state) => ({
          preferences: { ...state.preferences, ...patch },
        }));
      },
    }),
    {
      name: "codeflow-local-workspace-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
