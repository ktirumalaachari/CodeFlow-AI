import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_ROADMAP } from "@/lib/data/catalog";

export function LanguagesSection() {
  const primaryLang = LANGUAGE_ROADMAP[0];
  const plannedLangs = LANGUAGE_ROADMAP.slice(1);

  return (
    <section className="border-b border-border bg-surface-1/35 py-section-md">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Language Roadmap</Badge>
          <h2 className="mt-3 text-display-md text-foreground">
            Starting with Python. Expanding across runtimes.
          </h2>
          <p className="mt-2 text-body-md text-muted-foreground">
            Transparent multi-language architecture: Python powers our initial
            execution engine, with four compiled and managed languages on the
            roadmap.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          {/* Featured First Supported Language: Python */}
          <div className="flex flex-col justify-between rounded-2xl border border-primary/35 bg-surface-1 p-6 shadow-elevation-2 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 font-mono text-sm font-bold text-primary">
                    {primaryLang.monogram}
                  </div>
                  <div>
                    <h3 className="text-heading-lg text-foreground">
                      {primaryLang.name}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {primaryLang.runtimeNote}
                    </p>
                  </div>
                </div>
                <Badge variant="emerald">First Supported</Badge>
              </div>

              <p className="mt-4 text-body-sm text-muted-foreground leading-relaxed">
                {primaryLang.description}
              </p>

              <ul className="mt-5 space-y-2">
                {primaryLang.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex items-center gap-2 text-xs text-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-surface-2/70 px-3.5 py-2.5 text-xs text-muted-foreground">
              <strong className="text-foreground">Status:</strong> Frontend
              workspace ready in Phase 1 · Live Python execution engine arrives
              in Phase 2.
            </div>
          </div>

          {/* Planned Languages Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {plannedLangs.map((lang) => (
              <div
                key={lang.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-elevation-1"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 font-mono text-xs font-semibold text-muted-foreground">
                        {lang.monogram}
                      </div>
                      <h3 className="text-heading-md text-foreground">
                        {lang.name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {lang.statusLabel}
                    </Badge>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    {lang.description}
                  </p>
                </div>

                <div className="mt-4 border-t border-border-subtle pt-3 font-mono text-[11px] text-subtle-foreground">
                  {lang.runtimeNote}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

