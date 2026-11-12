"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const isDark = !hydrated || resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className={cn(
            "relative border border-transparent hover:border-border",
            className
          )}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {hydrated ? (
            isDark ? (
              <Sun className="h-4 w-4 text-muted-foreground transition-transform duration-200 hover:rotate-12 hover:text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground transition-transform duration-200 hover:-rotate-12 hover:text-foreground" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? "Switch to Light theme" : "Switch to Dark theme"}
      </TooltipContent>
    </Tooltip>
  );
}

