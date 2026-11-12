"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useAppStore } from "@/store/use-app-store";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  useGlobalShortcuts({ enableSidebarShortcut: true });

  const hydrated = useHydrated();
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const backendSynced = useProjectStore((s) => s.backendSynced);
  const syncWithBackend = useProjectStore((s) => s.syncWithBackend);
  const collapsed = hydrated ? sidebarCollapsed : false;

  React.useEffect(() => {
    if (hydrated && !backendSynced) {
      void syncWithBackend();
    }
  }, [backendSynced, hydrated, syncWithBackend]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-sidebar-collapsed" : "lg:pl-sidebar"
        )}
      >
        <AppHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

