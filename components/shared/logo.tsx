import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  compact?: boolean;
  className?: string;
  showBadge?: boolean;
}

export function CodeflowMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-b from-primary/20 to-primary/5 shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 text-primary"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 7H13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 12H16"
          stroke="hsl(var(--accent-emerald))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 17H11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />
        <circle
          cx="18.5"
          cy="12"
          r="2.25"
          fill="hsl(var(--accent-emerald))"
        />
        <path
          d="M15 7L18.5 9.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        <path
          d="M13 17L18.5 14.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
      </svg>
    </div>
  );
}

export function Logo({
  href = "/",
  compact = false,
  className,
  showBadge = false,
}: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <CodeflowMark />
      {!compact && (
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
            CODEFLOW <span className="text-primary">AI</span>
          </span>
          {showBadge && (
            <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              v0.1
            </span>
          )}
        </span>
      )}
    </span>
  );

  return (
    <Link
      href={href}
      className=" rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}

