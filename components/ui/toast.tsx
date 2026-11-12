"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import { useToastStore, type ToastVariant } from "@/store/use-toast-store";
import { cn } from "@/lib/utils";

const variantIcon: Record<ToastVariant, typeof CheckCircle2> = {
  default: Sparkles,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  destructive: AlertTriangle,
};

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border text-primary",
  success: "border-accent-emerald/30 text-accent-emerald",
  info: "border-accent-indigo/30 text-accent-indigo",
  warning: "border-accent-amber/30 text-accent-amber",
  destructive: "border-destructive/35 text-destructive",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => {
          const variant = item.variant ?? "default";
          const Icon = variantIcon[variant];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover p-3.5 shadow-elevation-2",
                variantStyles[variant]
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-foreground">
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

