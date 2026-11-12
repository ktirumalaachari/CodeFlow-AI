import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-b border-border py-section-md">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface-1 px-6 py-14 text-center shadow-elevation-2 sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-dot-subtle opacity-45"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Every Line Has a Story.
              <span className="mt-1 block text-primary">See Yours.</span>
            </h2>
            <p className="mt-3 text-body-md text-muted-foreground">
              Step inside the CODEFLOW AI workspace, explore core data structure
              tracks, and build lasting intuition for how programs execute.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="xl" className="shadow-glow-primary">
                <Link href="/learn">
                  Start Learning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="xl">
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

