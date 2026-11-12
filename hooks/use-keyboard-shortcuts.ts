"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";

export function useGlobalShortcuts(options?: { enableSidebarShortcut?: boolean }) {
  const setCommandSearchOpen = useAppStore((s) => s.setCommandSearchOpen);
  const commandSearchOpen = useAppStore((s) => s.commandSearchOpen);
  const toggleSidebarCollapsed = useAppStore((s) => s.toggleSidebarCollapsed);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;

      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        setCommandSearchOpen(!commandSearchOpen);
      } else if (key === "b" && options?.enableSidebarShortcut) {
        const target = event.target as HTMLElement | null;
        const isEditable =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        if (!isEditable) {
          event.preventDefault();
          toggleSidebarCollapsed();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    commandSearchOpen,
    options?.enableSidebarShortcut,
    setCommandSearchOpen,
    toggleSidebarCollapsed,
  ]);
}

