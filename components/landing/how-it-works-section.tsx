import { Code2, PlayCircle, SlidersHorizontal, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WORKFLOW_STEPS = [
  {
    step: "01",
    icon: Code2,
    title: "Write or paste your code",
    description:
      "Start from a clean editor, paste an unfamiliar snippet, or pick a structured DSA template.",
    detail: "editor.py · syntax & AST ready",
  },
  {
    step: "02",
    icon: PlayCircle,
    title: "Run the visualization",
    description:
      "Generate a deterministic step trace capturing stack frames, local variables, and heap references.",
    detail: "trace · deterministic snapshots",
  },
  {
    step: "03",
    icon: SlidersHorizontal,
    title: "Explore every execution step",
    description:
      "Step forward and backward through iterations while watching pointers, arrays, and trees update live.",
    detail: "timeline · scrub any tick",
  },
  {
    step: "04",
    icon: Sparkles,
    title: "Understand with AI",
    description:
      "Inspect concise, state-grounded explanations for loop invariants, edge cases, and time complexity.",
    detail: "ai tutor · line-level clarity",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-b border-border bg-surface-1/40 py-section-md"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Four-Step Workflow</Badge>
          <h2 className="mt-3 text-display-md text-foreground">
            From raw syntax to complete intuition
          </h2>
          <p className="mt-2 text-body-md text-muted-foreground">
            A streamlined learning loop designed for beginners, CS students, and
            engineers preparing for technical interviews.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1 transition-colors hover:border-border-strong"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">
                      STEP {item.step}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-heading-md text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-border-subtle pt-3 font-mono text-[11px] text-subtle-foreground">
                  {item.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

