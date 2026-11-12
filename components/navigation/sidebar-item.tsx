"use client";

import Link from "next/link";
import {
  Cpu,
  FolderCode,
  GitCompare,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  PlusSquare,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { SidebarNavEntry } from "@/lib/data/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<SidebarNavEntry["icon"], LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "plus-square": PlusSquare,
  "folder-code": FolderCode,
  cpu: Cpu,
  "graduation-cap": GraduationCap,
  "git-compare": GitCompare,
  history: History,
  sparkles: Sparkles,
  settings: Settings,
  "help-circle": HelpCircle,
};

interface SidebarItemProps {
  item: SidebarNavEntry;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({
  item,
  active,
  collapsed,
  onNavigate,
}: SidebarItemProps) {
  const Icon = ICON_MAP[item.icon];

  const linkNode = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-body-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0",
        active
          ? "bg-surface-3 text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-primary"
        />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none",
                active
                  ? "border-primary/30 bg-primary/15 text-primary"
                  : "border-border bg-surface-1 text-subtle-foreground"
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (!collapsed) {
    return linkNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        <span>{item.label}</span>
        {item.badge && (
          <span className="font-mono text-[10px] text-muted-foreground">
            ({item.badge})
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

