"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  FolderCode,
  HelpCircle,
  Home,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROUTE_META } from "@/lib/data/navigation";
import { useAppStore } from "@/store/use-app-store";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();

  const setMobileSidebarOpen = useAppStore((s) => s.setMobileSidebarOpen);
  const setCommandSearchOpen = useAppStore((s) => s.setCommandSearchOpen);
  const setHelpModalOpen = useAppStore((s) => s.setHelpModalOpen);

  const notifications = useProjectStore((s) => s.notifications);
  const markNotificationRead = useProjectStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useProjectStore(
    (s) => s.markAllNotificationsRead
  );
  const preferences = useProjectStore((s) => s.preferences);

  const currentMeta = ROUTE_META[pathname] ?? {
    title: "Workspace",
    section: "CODEFLOW AI",
    subtitle: "",
  };

  const unreadCount = hydrated
    ? notifications.filter((item) => !item.read).length
    : 0;

  const displayName = hydrated ? preferences.displayName : "Developer Guest";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-header w-full items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Drawer Trigger + Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-body-sm"
        >
          <Link
            href="/dashboard"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            {currentMeta.section}
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-subtle-foreground sm:inline" />
          <span className="truncate font-medium text-foreground">
            {currentMeta.title}
          </span>
        </nav>
      </div>

      {/* Right: Search Interface, Notifications, Theme Toggle, User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setCommandSearchOpen(true)}
          className="flex h-8 items-center gap-2.5 rounded-lg border border-border bg-surface-1 px-2.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56 md:w-64"
          aria-label="Search destinations and dashboard content"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="hidden truncate sm:inline flex-1 text-left">
            Search pages, topics, projects...
          </span>
          <kbd className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative border border-transparent hover:border-border"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} unread notifications`}
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 divide-y divide-border overflow-y-auto">
              {(hydrated ? notifications : []).map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => markNotificationRead(notif.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-2",
                    !notif.read && "bg-primary/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-subtle-foreground">
                      {notif.timestampLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {notif.description}
                  </p>
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar & Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 font-mono text-xs font-semibold text-primary transition-colors hover:border-border-strong hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open user menu"
            >
              {initials || "DG"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="text-xs font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-[11px] font-normal text-muted-foreground">
                Local Workspace (Phase 1)
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard Overview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/projects")}>
              <FolderCode className="h-3.5 w-3.5" />
              My Projects
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHelpModalOpen(true)}>
              <HelpCircle className="h-3.5 w-3.5" />
              Help & Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/")}>
              <Home className="h-3.5 w-3.5" />
              Landing Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

