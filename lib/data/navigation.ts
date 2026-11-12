export interface SidebarNavEntry {
  id: string;
  label: string;
  href: string;
  icon:
    | "layout-dashboard"
    | "plus-square"
    | "folder-code"
    | "cpu"
    | "graduation-cap"
    | "git-compare"
    | "history"
    | "sparkles"
    | "settings"
    | "help-circle";
  badge?: string;
  description: string;
  keywords: string[];
}

export const LANDING_NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Algorithms", href: "/algorithms" },
  { label: "Learn", href: "/learn" },
] as const;

export const SIDEBAR_PRIMARY_NAV: SidebarNavEntry[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    icon: "layout-dashboard",
    description: "Central hub for projects, topics, and learning progress",
    keywords: ["home", "dashboard", "overview", "metrics", "hub"],
  },
  {
    id: "workspace",
    label: "New Workspace",
    href: "/workspace",
    icon: "plus-square",
    badge: "IDE",
    description: "Interactive code editor and step-by-step execution canvas",
    keywords: ["editor", "new", "visualize", "sandbox", "python", "run"],
  },
  {
    id: "projects",
    label: "My Projects",
    href: "/projects",
    icon: "folder-code",
    description: "Manage saved local programs, templates, and drafts",
    keywords: ["projects", "files", "saved", "programs", "drafts"],
  },
  {
    id: "algorithms",
    label: "Algorithm Library",
    href: "/algorithms",
    icon: "cpu",
    description: "Curated DSA patterns with visual mental models and complexity specs",
    keywords: ["dsa", "algorithms", "trees", "graphs", "sorting", "sliding window"],
  },
  {
    id: "learn",
    label: "Learn",
    href: "/learn",
    icon: "graduation-cap",
    description: "Structured tracks from Python fundamentals to recursion and graphs",
    keywords: ["courses", "tracks", "tutorials", "beginner", "concepts"],
  },
  {
    id: "comparison",
    label: "Code Comparison",
    href: "/comparison",
    icon: "git-compare",
    description: "Side-by-side brute-force vs. optimized complexity blueprints",
    keywords: ["compare", "big o", "brute force", "optimized", "benchmark"],
  },
  {
    id: "history",
    label: "Execution History",
    href: "/history",
    icon: "history",
    description: "Timeline of step-by-step program runs and memory snapshots",
    keywords: ["history", "runs", "traces", "logs", "past"],
  },
  {
    id: "tutor",
    label: "AI Tutor",
    href: "/tutor",
    icon: "sparkles",
    badge: "Preview",
    description: "Context-aware line-by-line AI code intuition and debugging mentor",
    keywords: ["ai", "tutor", "explain", "assistant", "mentor"],
  },
];

export const SIDEBAR_SECONDARY_NAV: SidebarNavEntry[] = [
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: "settings",
    description: "Appearance, workspace preferences, and local state controls",
    keywords: ["preferences", "theme", "dark mode", "profile", "config"],
  },
];

export const ROUTE_META: Record<
  string,
  { title: string; section: string; subtitle: string }
> = {
  "/dashboard": {
    title: "Overview",
    section: "Dashboard",
    subtitle: "Your central workspace for visual learning and code exploration.",
  },
  "/projects": {
    title: "My Projects",
    section: "Workspace",
    subtitle: "Organize local code drafts and visualization templates.",
  },
  "/workspace": {
    title: "Execution Workspace",
    section: "Workspace",
    subtitle: "Interactive code editor, variable inspector, and memory visualizer.",
  },
  "/algorithms": {
    title: "Algorithm Library",
    section: "Explore",
    subtitle: "Browse foundational data structures and algorithmic patterns.",
  },
  "/learn": {
    title: "Learning Paths",
    section: "Curriculum",
    subtitle: "Guided visual modules from first loops to graph traversals.",
  },
  "/comparison": {
    title: "Code Comparison",
    section: "Analysis",
    subtitle: "Contrast brute-force approaches against optimal solutions.",
  },
  "/history": {
    title: "Execution History",
    section: "Activity",
    subtitle: "Inspect recorded execution traces and step snapshots.",
  },
  "/tutor": {
    title: "AI Code Tutor",
    section: "Intelligence",
    subtitle: "Contextual explanations anchored to live execution state.",
  },
  "/settings": {
    title: "Settings",
    section: "Preferences",
    subtitle: "Configure theme, visualization defaults, and local storage.",
  },
};

