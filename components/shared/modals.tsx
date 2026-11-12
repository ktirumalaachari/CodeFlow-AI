"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Keyboard,
  Layers,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/use-app-store";
import { useProjectStore } from "@/store/use-project-store";
import { useToastStore } from "@/store/use-toast-store";
import { QUICK_START_TOPICS } from "@/lib/data/catalog";

export function GlobalModals() {
  return (
    <>
      <CreateProjectModal />
      <HelpShortcutsModal />
      <WorkspaceAccessModal />
    </>
  );
}

function CreateProjectModal() {
  const router = useRouter();
  const open = useAppStore((s) => s.createProjectModalOpen);
  const setOpen = useAppStore((s) => s.setCreateProjectModalOpen);
  const createProject = useProjectStore((s) => s.createProject);
  const toast = useToastStore((s) => s.toast);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [topicSlug, setTopicSlug] = React.useState("python-basics");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const project = createProject({
      name: name.trim() || "New Python Visualization",
      description:
        description.trim() ||
        "Local Python draft saved for step-by-step trace inspection.",
      language: "python",
      topicSlug,
      status: "Draft",
    });

    toast({
      title: "Local project created",
      description: `"${project.name}" added to your local workspace.`,
      variant: "success",
    });

    setName("");
    setDescription("");
    setTopicSlug("python-basics");
    setOpen(false);
    router.push(`/workspace?project=${encodeURIComponent(project.id)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="emerald">Python 3.12 Draft</Badge>
            <Badge variant="secondary">Local State</Badge>
          </div>
          <DialogTitle>New Visualization Project</DialogTitle>
          <DialogDescription>
            Create a local project entry now. Interactive Python execution will
            attach to saved drafts in Phase 2.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label
              htmlFor="project-name-input"
              className="text-xs font-medium text-foreground"
            >
              Project Name
            </label>
            <Input
              id="project-name-input"
              placeholder="e.g., Binary Search Midpoint Trace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-topic-select"
              className="text-xs font-medium text-foreground"
            >
              Primary Concept
            </label>
            <select
              id="project-topic-select"
              value={topicSlug}
              onChange={(e) => setTopicSlug(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-surface-1 px-3 py-1.5 text-body-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {QUICK_START_TOPICS.map((topic) => (
                <option key={topic.slug} value={topic.slug}>
                  {topic.title} ({topic.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-desc-input"
              className="text-xs font-medium text-foreground"
            >
              Short Note (Optional)
            </label>
            <Input
              id="project-desc-input"
              placeholder="What behavior or invariant do you want to inspect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Draft
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HelpShortcutsModal() {
  const open = useAppStore((s) => s.helpModalOpen);
  const setOpen = useAppStore((s) => s.setHelpModalOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-1">
            <Badge variant="default">Phase 1 Guide</Badge>
          </div>
          <DialogTitle>CODEFLOW AI — Help & Shortcuts</DialogTitle>
          <DialogDescription>
            Quick keyboard controls and an honest overview of what is active in
            Phase 1 versus upcoming milestones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-1 p-3.5">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5 text-primary" />
              Keyboard Shortcuts
            </div>
            <div className="space-y-2 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Global Search & Quick Jump
                </span>
                <kbd className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground">
                  ⌘K / Ctrl+K
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Collapse / Expand Sidebar
                </span>
                <kbd className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground">
                  ⌘B / Ctrl+B
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Close Active Dialog
                </span>
                <kbd className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-1 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-accent-emerald" />
              Platform Architecture Status
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-emerald" />
                <span>
                  <strong className="text-foreground">Phase 1 (Active):</strong>{" "}
                  Design system, dark/light persistence, dashboard hub, local project CRUD, and curriculum browser.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Phase 2 (Next):</strong>{" "}
                  Monaco Editor + FastAPI Python 3.12 line-by-line execution engine.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-violet" />
                <span>
                  <strong className="text-foreground">Phases 3–6:</strong>{" "}
                  React Flow & D3 structure visualizers, AI Tutor explanations, and PostgreSQL cloud accounts.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Got It</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceAccessModal() {
  const router = useRouter();
  const open = useAppStore((s) => s.signInModalOpen);
  const setOpen = useAppStore((s) => s.setSignInModalOpen);

  const handleEnterWorkspace = () => {
    setOpen(false);
    router.push("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="emerald">Instant Local Access</Badge>
            <Badge variant="secondary">Phase 1</Badge>
          </div>
          <DialogTitle>Local Developer Workspace</DialogTitle>
          <DialogDescription>
            Cloud authentication and PostgreSQL account synchronization are
            scheduled for Phase 6. Right now, you have full unrestricted access
            in local browser mode—no credentials required.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-surface-1 p-3.5 text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground">
            What persists locally today:
          </p>
          <p>• Created, renamed, and duplicated Python project drafts</p>
          <p>• Dark / Light theme preference and sidebar layout</p>
          <p>• Explored DSA topics and learning progress state</p>
        </div>

        <DialogFooter className="pt-1">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Stay on Page
          </Button>
          <Button onClick={handleEnterWorkspace}>
            Open Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

