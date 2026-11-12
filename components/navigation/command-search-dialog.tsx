"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Compass,
  Cpu,
  FolderCode,
  Layers,
  Plus,
  Search,
  SunMoon,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/use-app-store";
import { useProjectStore } from "@/store/use-project-store";
import {
  SIDEBAR_PRIMARY_NAV,
  SIDEBAR_SECONDARY_NAV,
} from "@/lib/data/navigation";
import { ALGORITHM_CATALOG, QUICK_START_TOPICS } from "@/lib/data/catalog";
import type { SearchableEntry, SearchCategory } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<SearchCategory, typeof Compass> = {
  Navigation: Compass,
  "Quick Start": Layers,
  Algorithm: Cpu,
  Project: FolderCode,
  "Quick Action": Plus,
};

export function CommandSearchDialog() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const open = useAppStore((s) => s.commandSearchOpen);
  const setOpen = useAppStore((s) => s.setCommandSearchOpen);
  const setCreateProjectModalOpen = useAppStore(
    (s) => s.setCreateProjectModalOpen
  );
  const projects = useProjectStore((s) => s.projects);
  const markTopicExplored = useProjectStore((s) => s.markTopicExplored);
  const markAlgorithmExplored = useProjectStore((s) => s.markAlgorithmExplored);

  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const entries = React.useMemo<SearchableEntry[]>(() => {
    const navEntries: SearchableEntry[] = [
      ...SIDEBAR_PRIMARY_NAV,
      ...SIDEBAR_SECONDARY_NAV,
    ].map((nav) => ({
      id: `nav_${nav.id}`,
      title: nav.label,
      description: nav.description,
      category: "Navigation",
      href: nav.href,
      keywords: nav.keywords,
    }));

    navEntries.push({
      id: "nav_landing",
      title: "Landing Page",
      description: "Return to the public CODEFLOW AI product overview",
      category: "Navigation",
      href: "/",
      keywords: ["home", "landing", "marketing", "product"],
    });

    const actionEntries: SearchableEntry[] = [
      {
        id: "act_new_project",
        title: "Create New Local Project",
        description: "Save a Python draft project in your local workspace",
        category: "Quick Action",
        actionId: "create-project",
        keywords: ["new", "create", "project", "scratch", "draft"],
      },
      {
        id: "act_toggle_theme",
        title: `Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Theme`,
        description: "Toggle interface color mode cleanly",
        category: "Quick Action",
        actionId: "toggle-theme",
        keywords: ["theme", "dark", "light", "appearance", "color"],
      },
    ];

    const topicEntries: SearchableEntry[] = QUICK_START_TOPICS.map((topic) => ({
      id: `topic_${topic.slug}`,
      title: topic.title,
      description: `${topic.difficulty} · ${topic.subtitle}`,
      category: "Quick Start",
      href: topic.targetRoute,
      actionId: `topic:${topic.slug}`,
      keywords: [topic.slug, ...topic.concepts, topic.difficulty.toLowerCase()],
    }));

    const algorithmEntries: SearchableEntry[] = ALGORITHM_CATALOG.map((alg) => ({
      id: `alg_${alg.id}`,
      title: alg.title,
      description: `${alg.timeComplexity} time · ${alg.category}`,
      category: "Algorithm",
      href: `/algorithms?q=${encodeURIComponent(alg.title)}`,
      actionId: `alg:${alg.slug}`,
      keywords: [alg.slug, alg.category.toLowerCase(), alg.timeComplexity],
    }));

    const projectEntries: SearchableEntry[] = projects.map((proj) => ({
      id: `proj_${proj.id}`,
      title: proj.name,
      description: `Local Project (${proj.status}) · ${proj.description}`,
      category: "Project",
      href: `/workspace?project=${encodeURIComponent(proj.id)}`,
      keywords: [proj.language, proj.topicSlug, proj.status.toLowerCase()],
    }));

    return [
      ...actionEntries,
      ...navEntries,
      ...projectEntries,
      ...topicEntries,
      ...algorithmEntries,
    ];
  }, [projects, resolvedTheme]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return entries.slice(0, 12);
    }

    return entries
      .filter((item) => {
        const haystack = [
          item.title,
          item.description,
          item.category,
          ...item.keywords,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 16);
  }, [entries, query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeEntry = React.useCallback(
    (entry: SearchableEntry) => {
      setOpen(false);
      if (entry.actionId === "create-project") {
        setCreateProjectModalOpen(true);
        return;
      }
      if (entry.actionId === "toggle-theme") {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }
      if (entry.actionId?.startsWith("topic:")) {
        markTopicExplored(entry.actionId.replace("topic:", ""));
      }
      if (entry.actionId?.startsWith("alg:")) {
        markAlgorithmExplored(entry.actionId.replace("alg:", ""));
      }
      if (entry.href) {
        router.push(entry.href);
      }
    },
    [
      markAlgorithmExplored,
      markTopicExplored,
      resolvedTheme,
      router,
      setCreateProjectModalOpen,
      setOpen,
      setTheme,
    ]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = filtered[selectedIndex];
      if (target) executeEntry(target);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideCloseButton
        className="max-w-xl gap-0 overflow-hidden p-0 border-border-strong"
      >
        <DialogTitle className="sr-only">Search CODEFLOW AI</DialogTitle>
        <DialogDescription className="sr-only">
          Search across dashboard navigation, DSA topics, algorithms, and local projects.
        </DialogDescription>

        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, topics, algorithms, projects, or actions..."
            className="flex-1 bg-transparent text-body-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-body-sm font-medium text-foreground">
                No matching destinations or items
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try searching for &ldquo;Sliding Window&rdquo;, &ldquo;Recursion&rdquo;, &ldquo;Compare&rdquo;, or &ldquo;Settings&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, idx) => {
                const Icon =
                  item.actionId === "toggle-theme"
                    ? SunMoon
                    : CATEGORY_ICONS[item.category];
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => executeEntry(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-surface-2 text-foreground"
                        : "text-muted-foreground hover:bg-surface-2/60"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                          isSelected
                            ? "border-primary/35 bg-primary/12 text-primary"
                            : "border-border bg-surface-1 text-muted-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="hidden sm:inline-flex">
                        {item.category}
                      </Badge>
                      <ArrowRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          isSelected
                            ? "translate-x-0 text-primary"
                            : "-translate-x-0.5 opacity-40"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-1 px-3.5 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 text-[10px]">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 text-[10px]">
                ↵
              </kbd>{" "}
              Open
            </span>
          </div>
          <span>Local Workspace Index</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

