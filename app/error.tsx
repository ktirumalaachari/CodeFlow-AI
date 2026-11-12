"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-surface-1 p-8 shadow-elevation-2">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-heading-lg text-foreground">
          Something interrupted this view
        </h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          An unexpected client error occurred while rendering this interface.
          Your local browser workspace data remains intact.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button type="button" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

