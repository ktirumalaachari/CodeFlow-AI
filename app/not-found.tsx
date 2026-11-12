import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-surface-1 p-8 shadow-elevation-2">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-primary">
          <Compass className="h-5 w-5" />
        </div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          404 · Route Not Found
        </p>
        <h1 className="mt-2 text-heading-lg text-foreground">
          This page doesn&apos;t exist in CODEFLOW AI
        </h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          Head back to the landing page or open your workspace dashboard to
          continue exploring.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button asChild>
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Landing Page</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

