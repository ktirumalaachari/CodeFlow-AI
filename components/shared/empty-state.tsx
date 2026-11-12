import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: BadgeProps["variant"];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = "default",
  actions,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface-1 p-8 text-center shadow-elevation-1 sm:p-12",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-dot-subtle opacity-35"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-lg flex-col items-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <Badge variant={badgeVariant} className="mb-3">
            {badge}
          </Badge>
        )}
        <h2 className="text-heading-md text-foreground">{title}</h2>
        <p className="mt-2 text-body-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {children && <div className="mt-6 w-full text-left">{children}</div>}
        {actions && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

