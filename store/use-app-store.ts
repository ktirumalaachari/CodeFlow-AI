import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AppUIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandSearchOpen: boolean;
  helpModalOpen: boolean;
  signInModalOpen: boolean;
  createProjectModalOpen: boolean;
  demoStatsPreview: boolean;

  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setCommandSearchOpen: (open: boolean) => void;
  setHelpModalOpen: (open: boolean) => void;
  setSignInModalOpen: (open: boolean) => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setDemoStatsPreview: (enabled: boolean) => void;
}

export const useAppStore = create<AppUIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandSearchOpen: false,
      helpModalOpen: false,
      signInModalOpen: false,
      createProjectModalOpen: false,
      demoStatsPreview: false,

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setCommandSearchOpen: (open) => set({ commandSearchOpen: open }),
      setHelpModalOpen: (open) => set({ helpModalOpen: open }),
      setSignInModalOpen: (open) => set({ signInModalOpen: open }),
      setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
      setDemoStatsPreview: (enabled) => set({ demoStatsPreview: enabled }),
    }),
    {
      name: "codeflow-ui-preferences-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        demoStatsPreview: state.demoStatsPreview,
      }),
    }
  )
);

