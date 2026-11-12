"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Code2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AITutorPanel } from "@/components/tutor/AITutorPanel";
import { DSALearningAssistantView } from "@/components/tutor/DSALearningAssistantView";

export default function TutorPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="space-y-6" data-testid="tutor-studio-page">
        <PageHeader
          title="AI Code Tutor & DSA Learning Assistant"
          badge="Active · Phase 4"
          badgeVariant="violet"
          description="Execution-grounded explanations, line-by-line walkthroughs, progressive hints, and interactive DSA coaching powered by Google Gemini, OpenAI, and the CODEFLOW AST & Trace Engine."
          actions={
            <>
              <Button asChild variant="secondary">
                <Link href="/learn">
                  <BookOpen className="h-4 w-4" />
                  Learning Paths
                </Link>
              </Button>
              <Button asChild>
                <Link href="/workspace">
                  <Code2 className="h-4 w-4" />
                  Open Workspace IDE
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          }
        />

        {/* Two-Column Studio: Left = Interactive DSA Learning Assistant, Right = Live AI Tutor Chat */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.95fr)]">
          <section className="rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    DSA Learning Assistant &amp; Complexity Coach
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Explore concepts, Brute-Force vs. Optimized comparisons,
                    progressive hints, and practice problems.
                  </p>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-accent-violet" />
            </div>

            <DSALearningAssistantView
              compact={false}
              onNavigateToWorkspace={() => router.push("/workspace")}
            />
          </section>

          <div className="min-w-0">
            <AITutorPanel fullPage={true} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
