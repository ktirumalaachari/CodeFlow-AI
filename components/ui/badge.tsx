import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/12 text-primary",
        indigo:
          "border-primary/25 bg-primary/12 text-primary",
        secondary:
          "border-border bg-surface-2 text-muted-foreground",
        outline:
          "border-border bg-transparent text-foreground",
        emerald:
          "border-accent-emerald/25 bg-accent-emerald/12 text-accent-emerald",
        amber:
          "border-accent-amber/25 bg-accent-amber/12 text-accent-amber",
        violet:
          "border-accent-violet/25 bg-accent-violet/12 text-accent-violet",
        rose:
          "border-accent-rose/25 bg-accent-rose/12 text-accent-rose",
        mono:
          "border-border bg-surface-code font-mono text-[11px] text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

