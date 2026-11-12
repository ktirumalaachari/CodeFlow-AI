import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { QuickStartGrid } from "@/components/dashboard/quick-start-grid";
import { RecentProjectsTable } from "@/components/dashboard/recent-projects-table";
import { LearningProgressCard } from "@/components/dashboard/learning-progress-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WelcomeBanner />
        <StatsGrid />
        <QuickActionsGrid />
        <QuickStartGrid />
        <RecentProjectsTable limit={6} />
        <LearningProgressCard />
      </div>
    </AppShell>
  );
}

