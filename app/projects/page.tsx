"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { RecentProjectsTable } from "@/components/dashboard/recent-projects-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/use-app-store";

export default function ProjectsPage() {
  const setCreateProjectModalOpen = useAppStore(
    (s) => s.setCreateProjectModalOpen
  );
  const [filterQuery, setFilterQuery] = React.useState("");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="My Projects"
          badge="SQLite + Browser Synced"
          badgeVariant="emerald"
          description="Manage your saved Python programs and starter templates. Projects persist across page reloads and application restarts via SQLite and localStorage."
          actions={
            <Button onClick={() => setCreateProjectModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          }
        />

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter projects by name or topic..."
            className="pl-9"
          />
        </div>

        <RecentProjectsTable title="All Local Projects" filterQuery={filterQuery} />
      </div>
    </AppShell>
  );
}

