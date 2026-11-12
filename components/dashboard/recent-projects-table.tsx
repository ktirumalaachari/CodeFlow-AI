"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  FolderCode,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectStore } from "@/store/use-project-store";
import { useAppStore } from "@/store/use-app-store";
import { useToastStore } from "@/store/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import type { CodeProject, ProjectStatus } from "@/types";
import { cn, formatRelativeTime, getLanguageMeta } from "@/lib/utils";

const STATUS_BADGE: Record<
  ProjectStatus,
  "emerald" | "default" | "secondary"
> = {
  Ready: "emerald",
  Template: "default",
  Draft: "secondary",
};

interface RecentProjectsTableProps {
  limit?: number;
  title?: string;
  filterQuery?: string;
}

export function RecentProjectsTable({
  limit,
  title = "Recent Projects",
  filterQuery = "",
}: RecentProjectsTableProps) {
  const router = useRouter();
  const hydrated = useHydrated();

  const projects = useProjectStore((s) => s.projects);
  const backendSynced = useProjectStore((s) => s.backendSynced);
  const compactTable = useProjectStore(
    (s) => s.preferences.compactProjectTable
  );
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const touchProject = useProjectStore((s) => s.touchProject);
  const resetDemoProjects = useProjectStore((s) => s.resetDemoProjects);

  const setCreateProjectModalOpen = useAppStore(
    (s) => s.setCreateProjectModalOpen
  );
  const toast = useToastStore((s) => s.toast);

  const [renamingProject, setRenamingProject] =
    React.useState<CodeProject | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [deletingProject, setDeletingProject] =
    React.useState<CodeProject | null>(null);

  const visibleProjects = React.useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const filtered = q
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.topicSlug.toLowerCase().includes(q)
        )
      : projects;

    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [filterQuery, limit, projects]);

  const handleOpenProject = (project: CodeProject) => {
    touchProject(project.id);
    router.push(`/workspace?project=${encodeURIComponent(project.id)}`);
  };

  const handleStartRename = (project: CodeProject) => {
    setRenamingProject(project);
    setRenameValue(project.name);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingProject || !renameValue.trim()) return;
    renameProject(renamingProject.id, renameValue.trim());
    toast({
      title: "Project renamed",
      description: `Updated name to "${renameValue.trim()}".`,
      variant: "success",
    });
    setRenamingProject(null);
  };

  const handleDuplicate = (project: CodeProject) => {
    const created = duplicateProject(project.id);
    if (created) {
      toast({
        title: "Project duplicated",
        description: `Created "${created.name}" in local state.`,
        variant: "info",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingProject) return;
    const deletedName = deletingProject.name;
    deleteProject(deletingProject.id);
    toast({
      title: "Project removed",
      description: `"${deletedName}" was removed from local browser storage.`,
      variant: "warning",
    });
    setDeletingProject(null);
  };

  return (
    <section aria-labelledby="recent-projects-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="recent-projects-heading"
            className="text-heading-sm text-foreground"
          >
            {title}
          </h2>
          <Badge variant={backendSynced ? "emerald" : "secondary"}>
            {backendSynced ? "SQLite + Browser Synced" : "Browser Synced"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setCreateProjectModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Draft
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-1 shadow-elevation-1">
        {!hydrated ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted-foreground">
              <FolderCode className="h-4 w-4" />
            </div>
            <p className="text-body-sm font-medium text-foreground">
              {filterQuery
                ? "No local projects match your filter"
                : "No local projects in workspace"}
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Projects are currently stored in temporary local browser state.
              PostgreSQL cloud persistence is scheduled for Phase 6.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateProjectModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Create Project
              </Button>
              {!filterQuery && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    resetDemoProjects();
                    toast({
                      title: "Starter projects restored",
                      description: "Restored 4 local starter templates.",
                      variant: "info",
                    });
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Starter Projects
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Last Modified</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visibleProjects.map((project) => {
                  const langMeta = getLanguageMeta(project.language);
                  const rowPadding = compactTable ? "py-2" : "py-3.5";

                  return (
                    <tr
                      key={project.id}
                      className="group transition-colors hover:bg-surface-2/45"
                    >
                      <td className={cn("px-4", rowPadding)}>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-mono text-[11px] font-semibold text-primary">
                            {langMeta.shortLabel}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleOpenProject(project)}
                              className="truncate font-medium text-foreground hover:text-primary transition-colors text-left"
                            >
                              {project.name}
                            </button>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {project.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className={cn("px-4", rowPadding)}>
                        <span className="font-mono text-xs text-muted-foreground">
                          {langMeta.label}
                        </span>
                      </td>

                      <td className={cn("px-4", rowPadding)}>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatRelativeTime(project.lastModifiedIso)}
                        </span>
                      </td>

                      <td className={cn("px-4", rowPadding)}>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={STATUS_BADGE[project.status]}>
                            {project.status}
                          </Badge>
                          {project.isDemoSeed && (
                            <span className="font-mono text-[10px] text-subtle-foreground">
                              starter
                            </span>
                          )}
                        </div>
                      </td>

                      <td className={cn("px-4 text-right", rowPadding)}>
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenProject(project)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label={`Actions for ${project.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => handleOpenProject(project)}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open in Workspace
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStartRename(project)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(project)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingProject(project)}
                                className="text-destructive focus:bg-destructive/12 focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-2/40 px-4 py-2.5 text-[11px] text-subtle-foreground">
          <span>
            Persisted in SQLite database &amp; browser localStorage across restarts
          </span>
          {hydrated && projects.length > 0 && (
            <span>
              Showing {visibleProjects.length} of {projects.length} saved items
            </span>
          )}
        </div>
      </div>

      {/* Rename Project Modal */}
      <Dialog
        open={renamingProject !== null}
        onOpenChange={(open) => !open && setRenamingProject(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Local Project</DialogTitle>
            <DialogDescription>
              Update the display title for this local workspace entry.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRename} className="space-y-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter project name"
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenamingProject(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim()}>
                Save Name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deletingProject !== null}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Local Project?</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{deletingProject?.name}&rdquo; from your local
              browser workspace? Starter projects can be restored anytime from
              Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingProject(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

