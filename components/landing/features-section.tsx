import {
  Cpu,
  GitCompare,
  Layers,
  Play,
  Sparkles,
  Variable,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-16 border-b border-border py-section-md"
    >
      <div className="container">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge variant="default">Platform Capabilities</Badge>
            <h2 className="mt-3 text-display-md text-foreground">
              Engineered for deep code comprehension
            </h2>
            <p className="mt-2 text-body-md text-muted-foreground">
              Every workspace instrument is designed to turn invisible runtime
              state into crisp, inspectable visual artifacts.
            </p>
          </div>
          <p className="font-mono text-xs text-subtle-foreground">
            6 Core Visualization Modules
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. Step-by-Step Execution */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-emerald/25 bg-accent-emerald/12 text-accent-emerald">
                <Play className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-heading-md text-foreground">
                Step-by-Step Execution
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                Step forward, step backward, or scrub directly to any execution
                tick to observe exact line transitions and branch decisions.
              </p>
            </div>
            <div className="mt-5 rounded-lg border border-border-subtle bg-surface-code p-3 font-mono text-[11px]">
              <div className="flex items-center justify-between text-subtle-foreground">
                <span>4  if mid_val &lt; target:</span>
              </div>
              <div className="mt-1 flex items-center justify-between rounded bg-accent-emerald/15 px-2 py-1 text-accent-emerald ring-1 ring-inset ring-accent-emerald/30">
                <span>→ 5      low = mid + 1</span>
                <span>tick #08</span>
              </div>
            </div>
          </div>

          {/* 2. Live Variable Inspector */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-amber/25 bg-accent-amber/12 text-accent-amber">
                <Variable className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-heading-md text-foreground">
                Live Variable Inspector
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                Track local and global scopes in real time with automatic mutation
                highlights whenever a variable changes value or type.
              </p>
            </div>
            <div className="mt-5 space-y-1.5 rounded-lg border border-border-subtle bg-surface-code p-3 font-mono text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>window_start : int</span>
                <span className="text-foreground">2</span>
              </div>
              <div className="flex items-center justify-between rounded bg-accent-amber/12 px-2 py-0.5 text-accent-amber">
                <span>max_len : int</span>
                <span>3 → 4</span>
              </div>
            </div>
          </div>

          {/* 3. Interactive Data Structures */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-heading-md text-foreground">
                Interactive Data Structures
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                Render arrays, hash maps, linked lists, binary trees, and graphs
                automatically from live Python memory references.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-code p-3 font-mono text-xs">
              <span className="rounded border border-primary/35 bg-primary/15 px-2.5 py-1 text-primary">
                [10]
              </span>
              <span className="text-subtle-foreground">──▶</span>
              <span className="rounded border border-border bg-surface-2 px-2.5 py-1 text-foreground">
                [24]
              </span>
              <span className="text-subtle-foreground">──▶</span>
              <span className="rounded border border-accent-emerald/35 bg-accent-emerald/15 px-2.5 py-1 text-accent-emerald">
                [38]
              </span>
            </div>
          </div>

          {/* 4. AI Code Tutor */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-violet/25 bg-accent-violet/12 text-accent-violet">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-heading-md text-foreground">
                AI Code Tutor
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                Ask &ldquo;Why did this loop terminate?&rdquo; or &ldquo;Why did
                this pointer move?&rdquo; with full context of the active execution step.
              </p>
            </div>
            <div className="mt-5 rounded-lg border border-accent-violet/25 bg-accent-violet/[0.07] p-3 text-xs text-muted-foreground">
              <span className="font-mono text-[10px] font-semibold uppercase text-accent-violet">
                Step Context · Line 8
              </span>
              <p className="mt-1 leading-relaxed text-foreground/90">
                Advancing <code className="text-accent-violet">left</code> shrinks
                the window until duplicate <code className="text-accent-violet">&apos;b&apos;</code> exits.
              </p>
            </div>
          </div>

          {/* 5. Algorithm Visualization */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary">
                <Cpu className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-heading-md text-foreground">
                Algorithm Visualization
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                Explore curated visual blueprints for binary search, sliding
                windows, DFS/BFS traversals, sorting, and dynamic programming.
              </p>
            </div>
            <div className="mt-5 flex items-end gap-1.5 rounded-lg border border-border-subtle bg-surface-code p-3 h-16">
              {[35, 55, 42, 85, 68, 95, 50].map((height, idx) => (
                <div
                  key={idx}
                  style={{ height: `${height}%` }}
                  className={
                    idx === 3 || idx === 5
                      ? "flex-1 rounded-sm bg-primary transition-all group-hover:bg-accent-emerald"
                      : "flex-1 rounded-sm bg-surface-3"
                  }
                />
              ))}
            </div>
          </div>

          {/* 6. Brute Force vs Optimized */}
          <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevation-2">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-rose/25 bg-accent-rose/12 text-accent-rose">
                <GitCompare className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-heading-md text-foreground">
                Brute Force vs Optimized
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                Contrast naive nested loops against optimal hash-map or pointer
                solutions side by side to witness concrete step-count savings.
              </p>
            </div>
            <div className="mt-5 space-y-2 rounded-lg border border-border-subtle bg-surface-code p-3 font-mono text-[11px]">
              <div className="space-y-1">
                <div className="flex justify-between text-accent-rose">
                  <span>Nested Scan O(n²)</span>
                  <span>190 ops</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-accent-rose/25">
                  <div className="h-1.5 w-full rounded-full bg-accent-rose" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-accent-emerald">
                  <span>Hash Complement O(n)</span>
                  <span>20 ops</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-3">
                  <div className="h-1.5 w-[14%] rounded-full bg-accent-emerald" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

