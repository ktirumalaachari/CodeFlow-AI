import {
  AlertCircle,
  BrainCircuit,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SOLUTION_PILLARS = [
  {
    icon: Eye,
    title: "Visual Execution",
    description:
      "Replace mental guesswork with deterministic line-by-line state frames, call stacks, and pointer movement.",
    accentClass: "text-accent-emerald bg-accent-emerald/12 border-accent-emerald/25",
  },
  {
    icon: Layers,
    title: "Interactive Learning",
    description:
      "Scrub forward and backward across tricky loop boundaries, recursive base cases, and pointer updates at your own pace.",
    accentClass: "text-primary bg-primary/12 border-primary/25",
  },
  {
    icon: Sparkles,
    title: "AI Explanations",
    description:
      "Receive clear explanations anchored to the exact active line and current memory snapshot—not generic textbook prose.",
    accentClass: "text-accent-violet bg-accent-violet/12 border-accent-violet/25",
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="border-b border-border py-section-md">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary">Why Static Code Fails Learners</Badge>
          <h2 className="mt-3 text-display-md text-foreground">
            Source code is static text.
            <span className="block text-muted-foreground">
              Program execution is dynamic state.
            </span>
          </h2>
          <p className="mt-3 text-body-md text-muted-foreground leading-relaxed">
            Reading ten lines of nested loops or recursion forces your brain to
            simulate a compiler, call stack, and heap all at once. One missed
            off-by-one mutation breaks your entire mental model.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* Problem Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-1 p-6 shadow-elevation-1 lg:col-span-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-accent-rose/25 bg-accent-rose/10 px-2.5 py-1 text-xs font-medium text-accent-rose">
                <AlertCircle className="h-3.5 w-3.5" />
                The Traditional Struggle
              </div>
              <h3 className="mt-4 text-heading-lg text-foreground">
                Blindly tracing variables in your head
              </h3>
              <p className="mt-2 text-body-sm text-muted-foreground leading-relaxed">
                Scattering temporary <code className="rounded bg-surface-3 px-1.5 py-0.5 text-xs text-foreground">print()</code>{" "}
                statements floods your terminal without showing pointer positions,
                shared references, or why a recursive call unwound the way it did.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-surface-code p-4 font-mono text-xs text-muted-foreground space-y-1.5">
              <div className="text-subtle-foreground"># Terminal output overload</div>
              <div>i=0 j=4 curr=17</div>
              <div>i=0 j=3 curr=13</div>
              <div>i=1 j=3 curr=16</div>
              <div className="text-accent-rose pt-1">
                IndexError: list index out of range (Wait—at which step?)
              </div>
            </div>
          </div>

          {/* CODEFLOW AI Solution Card */}
          <div className="rounded-2xl border border-border-strong bg-surface-1 p-6 shadow-elevation-2 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary">
              <BrainCircuit className="h-3.5 w-3.5" />
              The CODEFLOW AI Approach
            </div>
            <h3 className="mt-4 text-heading-lg text-foreground">
              See control flow, memory, and intuition together
            </h3>
            <p className="mt-2 text-body-sm text-muted-foreground">
              CODEFLOW AI bridges raw syntax and runtime behavior through three
              tightly synchronized pillars:
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {SOLUTION_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-xl border border-border bg-surface-2/55 p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
                  >
                    <div
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${pillar.accentClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="mt-3 text-heading-sm text-foreground">
                      {pillar.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

