import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SupportedLanguageId } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createLocalId(prefix = "cf"): string {
  const randomPart = Math.random().toString(36).slice(2, 9);
  const timePart = Date.now().toString(36).slice(-4);
  return `${prefix}_${timePart}${randomPart}`;
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSeconds < 45) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getLanguageMeta(language: SupportedLanguageId): {
  label: string;
  shortLabel: string;
  extension: string;
} {
  const mapping: Record<
    SupportedLanguageId,
    { label: string; shortLabel: string; extension: string }
  > = {
    python: { label: "Python 3.12", shortLabel: "PY", extension: ".py" },
    javascript: { label: "JavaScript", shortLabel: "JS", extension: ".js" },
    java: { label: "Java", shortLabel: "JV", extension: ".java" },
    c: { label: "C", shortLabel: "C", extension: ".c" },
    cpp: { label: "C++", shortLabel: "CPP", extension: ".cpp" },
  };
  return mapping[language];
}

