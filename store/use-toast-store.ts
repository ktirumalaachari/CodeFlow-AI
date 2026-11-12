import { create } from "zustand";
import { createLocalId } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "info" | "warning" | "destructive";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  toast: (payload: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (payload) => {
    const id = createLocalId("toast");
    const durationMs = payload.durationMs ?? 3800;

    set((state) => ({
      toasts: [...state.toasts.slice(-3), { ...payload, id, durationMs }],
    }));

    if (durationMs > 0 && typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, durationMs);
    }

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

