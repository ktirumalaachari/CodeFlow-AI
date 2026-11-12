"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { useToastStore } from "@/store/use-toast-store";

type LegalModalTopic = "privacy" | "terms" | null;

export function LandingFooter() {
  const setHelpModalOpen = useAppStore((s) => s.setHelpModalOpen);
  const toast = useToastStore((s) => s.toast);
  const [legalTopic, setLegalTopic] = React.useState<LegalModalTopic>(null);

  return (
    <footer className="bg-background py-12 text-body-sm text-muted-foreground">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="space-y-3 lg:col-span-2">
            <Logo href="/" />
            <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
              Understand Every Line. Visualize Every Step. Interactive
              programming visualization and AI learning platform.
            </p>
            <button
              type="button"
              onClick={() =>
                toast({
                  title: "GitHub Repository Placeholder",
                  description:
                    "No remote repository URL is configured in Phase 1. Initialize git remote when ready.",
                  variant: "info",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-1 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              <GitBranch className="h-3 w-3" />
              GitHub (Local Build — No Remote Yet)
            </button>
          </div>

          {/* Product */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Product
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/workspace"
                  className="hover:text-foreground transition-colors"
                >
                  Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/comparison"
                  className="hover:text-foreground transition-colors"
                >
                  Code Comparison
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Features
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Step-by-Step Execution
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#showcase"
                  className="hover:text-foreground transition-colors"
                >
                  Visualization Showcase
                </a>
              </li>
            </ul>
          </div>

          {/* Learning */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Learning
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/learn"
                  className="hover:text-foreground transition-colors"
                >
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link
                  href="/algorithms"
                  className="hover:text-foreground transition-colors"
                >
                  Algorithm Library
                </Link>
              </li>
              <li>
                <Link
                  href="/tutor"
                  className="hover:text-foreground transition-colors"
                >
                  AI Tutor
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Resources
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalTopic("privacy")}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalTopic("terms")}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Terms
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-subtle-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} CODEFLOW AI. Phase 1 Foundation Build.</p>
          <p className="font-mono text-[11px]">
            Next.js · TypeScript · Tailwind · shadcn/ui
          </p>
        </div>
      </div>

      <Dialog
        open={legalTopic !== null}
        onOpenChange={(open) => !open && setLegalTopic(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {legalTopic === "privacy"
                ? "Privacy Notice (Phase 1 Local Build)"
                : "Terms of Use (Phase 1 Local Build)"}
            </DialogTitle>
            <DialogDescription>
              {legalTopic === "privacy"
                ? "In Phase 1, CODEFLOW AI operates completely locally in your browser. Theme settings, project drafts, and explored topics are stored exclusively in browser localStorage with zero external telemetry or server transmission."
                : "CODEFLOW AI Phase 1 is provided as a local frontend learning and visualization workspace foundation. Interactive code execution, cloud persistence, and user accounts will be governed by service terms upon Phase 6 deployment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setLegalTopic(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </footer>
  );
}

