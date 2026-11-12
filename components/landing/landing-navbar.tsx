"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { LANDING_NAV_ITEMS } from "@/lib/data/navigation";
import { useAppStore } from "@/store/use-app-store";

export function LandingNavbar() {
  const setSignInModalOpen = useAppStore((s) => s.setSignInModalOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left: Logo & Mark */}
        <Logo href="/" showBadge />

        {/* Center: Primary Links */}
        <nav
          aria-label="Landing Navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {LANDING_NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-body-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: Theme Toggle, Sign In, Get Started */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSignInModalOpen(true)}
          >
            Sign In
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface-1 px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-1">
            {LANDING_NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMobileMenuOpen(false);
                setSignInModalOpen(true);
              }}
            >
              Sign In
            </Button>
            <Button asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

