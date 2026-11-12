"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  HelpCircle,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sliders,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { SidebarItem } from "@/components/navigation/sidebar-item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SIDEBAR_PRIMARY_NAV,
  SIDEBAR_SECONDARY_NAV,
} from "@/lib/data/navigation";
import { useAppStore } from "@/store/use-app-store";
import { useProjectStore } from "@/store/use-project-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

function SidebarInner({
  collapsed,
  isMobile = false,
  onNavigate,
}: {
  collapsed: boolean;
  isMobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const toggleSidebarCollapsed = useAppStore((s) => s.toggleSidebarCollapsed);
  const setHelpModalOpen = useAppStore((s) => s.setHelpModalOpen);
  const preferences = useProjectStore((s) => s.preferences);

  const displayName = hydrated ? preferences.displayName : "Developer Guest";
  const roleLabel = hydrated ? preferences.roleLabel : "Local Workspace";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const helpButton = (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        setHelpModalOpen(true);
      }}
      className={cn(
        "group flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0"
      )}
    >
      <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
      {!collapsed && <span className="truncate">Help</span>}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-surface-1 text-foreground">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-header shrink-0 items-center border-b border-border px-3.5",
          collapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        <Logo href="/" compact={collapsed} />
        {!isMobile && !collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleSidebarCollapsed}
                className="h-7 w-7 text-muted-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar (⌘B)</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Expand Trigger When Collapsed */}
      {!isMobile && collapsed && (
        <div className="flex justify-center border-b border-border/60 py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleSidebarCollapsed}
                className="h-7 w-7 text-muted-foreground"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar (⌘B)</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Primary Navigation */}
      <nav
        aria-label="Primary Sidebar Navigation"
        className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3"
      >
        {!collapsed && (
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Platform
          </p>
        )}
        {SIDEBAR_PRIMARY_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <SidebarItem
              key={item.id}
              item={item}
              active={isActive}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      {/* Bottom Settings, Help & Profile */}
      <div className="shrink-0 border-t border-border p-2.5 space-y-1">
        {SIDEBAR_SECONDARY_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <SidebarItem
              key={item.id}
              item={item}
              active={isActive}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{helpButton}</TooltipTrigger>
            <TooltipContent side="right">Help & Shortcuts</TooltipContent>
          </Tooltip>
        ) : (
          helpButton
        )}

        <div className="pt-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-2/60 p-2 text-left transition-colors hover:border-border hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  collapsed && "justify-center p-1.5"
                )}
                aria-label="User workspace menu"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-semibold text-primary">
                  {initials || "DG"}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {roleLabel}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel>
                <p className="text-xs font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="text-[11px] font-normal text-muted-foreground">
                  Phase 1 Local Storage Mode
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.();
                  router.push("/settings");
                }}
              >
                <Settings className="h-3.5 w-3.5" />
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.();
                  setHelpModalOpen(true);
                }}
              >
                <Sliders className="h-3.5 w-3.5" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.();
                  router.push("/");
                }}
              >
                <Home className="h-3.5 w-3.5" />
                Back to Landing Page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const hydrated = useHydrated();
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const mobileSidebarOpen = useAppStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useAppStore((s) => s.setMobileSidebarOpen);

  const collapsed = hydrated ? sidebarCollapsed : false;

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col border-r border-border transition-[width] duration-200 ease-out",
          collapsed ? "lg:w-sidebar-collapsed" : "lg:w-sidebar"
        )}
      >
        <SidebarInner collapsed={collapsed} />
      </aside>

      {/* Mobile & Tablet Drawer Sidebar */}
      <Dialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-[270px] translate-x-0 translate-y-0 rounded-none border-r border-border p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
          <DialogDescription className="sr-only">
            Navigate between CODEFLOW AI sections.
          </DialogDescription>
          <SidebarInner
            collapsed={false}
            isMobile
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

