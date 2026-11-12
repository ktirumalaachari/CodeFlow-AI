"use client";

import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Thin client component that registers global keyboard shortcuts on the
 * landing page without forcing the entire page to be a client component.
 */
export function LandingShortcuts() {
  useGlobalShortcuts({ enableSidebarShortcut: false });
  return null;
}

