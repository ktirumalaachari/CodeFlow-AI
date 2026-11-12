import Link from "next/link";
import { ArrowRight, Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface-1 p-6 shadow-elevation-1 sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-dot-subtle opacity-35 [mask-image:linear-gradient(to_left,#000,transparent)]"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="default">CodeFlow AI v1.0</Badge>
            <Badge variant="emerald">SQLite + Python 3.12 Active</Badge>
          </div>
          <h1 className="pt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back!
          </h1>
          <p className="text-body-md text-muted-foreground">
            Ready to understand some code today?
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild size="lg" className="shadow-glow-primary">
            <Link href="/workspace">
              <Plus className="h-4 w-4" />
              New Visualization
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/algorithms">
              <Compass className="h-4 w-4" />
              Explore Algorithms
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

