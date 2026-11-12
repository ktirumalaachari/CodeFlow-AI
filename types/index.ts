export type SupportedLanguageId = "python" | "javascript" | "java" | "c" | "cpp";

export type LanguageAvailability = "primary" | "planned";

export interface LanguageRoadmapItem {
  id: SupportedLanguageId;
  name: string;
  monogram: string;
  extension: string;
  availability: LanguageAvailability;
  statusLabel: string;
  runtimeNote: string;
  description: string;
  capabilities: string[];
}

export type ProjectStatus = "Draft" | "Template" | "Ready";

export interface CodeProject {
  id: string;
  name: string;
  description: string;
  language: SupportedLanguageId;
  topicSlug: string;
  lastModifiedIso: string;
  createdAtIso: string;
  status: ProjectStatus;
  codePreview: string;
  isDemoSeed?: boolean;
}

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export type AccentTone = "indigo" | "emerald" | "amber" | "violet" | "rose";

export interface QuickStartTopic {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: DifficultyLevel;
  accent: AccentTone;
  concepts: string[];
  estimatedMinutes: number;
  targetRoute: string;
  sampleCodeTitle: string;
}

export type AlgorithmCategory =
  | "Searching"
  | "Sorting"
  | "Two Pointers"
  | "Sliding Window"
  | "Recursion"
  | "Stack & Queue"
  | "Linked Lists"
  | "Trees & Graphs"
  | "Dynamic Programming";

export interface AlgorithmCatalogItem {
  id: string;
  slug: string;
  title: string;
  category: AlgorithmCategory;
  difficulty: DifficultyLevel;
  timeComplexity: string;
  bestTimeComplexity?: string;
  worstTimeComplexity?: string;
  spaceComplexity: string;
  bruteForceComplexity?: string;
  complexityAssumption: string;
  summary: string;
  keyInsight: string;
  howItWorksSteps: string[];
  codeExample: string;
  sampleSlug: string;
  tutorTopicSlug: string;
  comparisonScenarioId?: string;
}

export interface LearningPracticeExercise {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  solutionHint: string;
  expectedOutputSubstring: string;
  targetComplexity: string;
}

export interface LearningLesson {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  level: DifficultyLevel;
  topicSlug: string;
  sampleSlug: string;
  estimatedMinutes: number;
  conceptSummary: string;
  mentalModel: string;
  keyTakeaways: string[];
  exampleCode: string;
  exercise: LearningPracticeExercise;
}

export interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  level: DifficultyLevel;
  description: string;
  modulesCount: number;
  estimatedHours: string;
  concepts: string[];
  accent: AccentTone;
}

export interface ComparisonScenario {
  id: string;
  slug: string;
  title: string;
  category: string;
  sharedInputCode: string;
  bruteForce: {
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: string;
  };
  optimized: {
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: string;
  };
  summary: string;
  keyInsight: string;
  complexityExplanation: string;
}

export interface ExecutionHistoryEntry {
  id: string;
  title: string;
  sourceCode: string;
  language: SupportedLanguageId;
  status: string;
  totalSteps: number;
  durationMs: number;
  executionMode: string;
  stdoutPreview: string;
  errorTitle?: string | null;
  createdAtIso: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestampLabel: string;
  read: boolean;
  tag: "Platform" | "Roadmap" | "Tip";
}

export type SearchCategory =
  | "Navigation"
  | "Quick Start"
  | "Algorithm"
  | "Project"
  | "Quick Action";

export interface SearchableEntry {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  href?: string;
  actionId?: string;
  keywords: string[];
}
