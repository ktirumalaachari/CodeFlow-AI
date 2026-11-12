export type TutorProviderId = "gemini" | "openai" | "execution_grounded";

export type TutorActionType =
  | "chat"
  | "explain_program"
  | "explain_line"
  | "explain_step"
  | "explain_why"
  | "debug_error"
  | "hint"
  | "dsa_topic";

export interface TutorVariableSnapshotPayload {
  name: string;
  scope: "local" | "global";
  var_type: string;
  repr_value: string;
  change: "unchanged" | "created" | "modified" | "deleted";
  previous_repr?: string | null;
  object_id?: string | null;
}

export interface TutorCallFramePayload {
  frame_id: string;
  function_name: string;
  line: number;
  depth: number;
  locals_summary: Record<string, string>;
}

export interface TutorStepSnapshotPayload {
  step: number;
  line: number;
  event: "line" | "call" | "return" | "exception";
  function_name: string;
  call_depth: number;
  source_line: string;
  locals: TutorVariableSnapshotPayload[];
  globals: TutorVariableSnapshotPayload[];
  call_stack: TutorCallFramePayload[];
  return_value?: string | null;
  stdout_snapshot: string;
  stdout_delta: string;
  explanation_headline: string;
  explanation_details: string;
}

export interface TutorErrorSnapshotPayload {
  error_type: string;
  message: string;
  friendly_title: string;
  friendly_explanation: string;
  suggestion: string;
  line?: number | null;
  source_line?: string | null;
  traceback_lines: string[];
}

export interface TutorDetectedStructurePayload {
  id: string;
  kind: string;
  variable_name: string;
  title: string;
  subtitle: string;
  active_operation?: string | null;
  summary: string;
}

export interface TutorExecutionContextPayload {
  source_code: string;
  selected_line_start?: number | null;
  selected_line_end?: number | null;
  selected_code?: string | null;
  execution_status: string;
  total_steps: number;
  current_step?: TutorStepSnapshotPayload | null;
  previous_step?: TutorStepSnapshotPayload | null;
  stdout: string;
  error?: TutorErrorSnapshotPayload | null;
  detected_structures: TutorDetectedStructurePayload[];
}

export interface TutorChatRequestPayload {
  action: TutorActionType;
  message?: string;
  provider: TutorProviderId;
  model?: string | null;
  conversation_id?: string | null;
  hint_mode?: boolean;
  hint_level?: 1 | 2 | 3;
  topic_slug?: string | null;
  allow_fallback?: boolean;
  execution_context: TutorExecutionContextPayload;
}

export interface TutorMessageItem {
  id: string;
  role: "user" | "assistant";
  action: TutorActionType;
  content: string;
  provider: TutorProviderId;
  model: string;
  used_fallback: boolean;
  hint_mode: boolean;
  hint_level?: number | null;
  step_number?: number | null;
  line_number?: number | null;
  created_at: string;
}

export interface TutorChatResponsePayload {
  conversation_id: string;
  message: TutorMessageItem;
  provider: TutorProviderId;
  model: string;
  used_fallback: boolean;
  fallback_reason?: string | null;
  suggested_questions: string[];
}

export interface TutorConversationSummary {
  id: string;
  title: string;
  provider: TutorProviderId;
  model: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface TutorConversationDetail {
  id: string;
  title: string;
  provider: TutorProviderId;
  model: string;
  created_at: string;
  updated_at: string;
  messages: TutorMessageItem[];
}

export interface TutorModelInfo {
  id: string;
  label: string;
  description: string;
  is_default: boolean;
}

export interface TutorProviderInfo {
  id: TutorProviderId;
  name: string;
  role: string;
  configured: boolean;
  status: "ready" | "missing_api_key" | "local_ready";
  default_model: string;
  models: TutorModelInfo[];
  env_var?: string | null;
  notes: string;
}

export interface TutorProvidersStatusResponse {
  default_provider: TutorProviderId;
  active_provider: TutorProviderId;
  fallback_available: boolean;
  providers: TutorProviderInfo[];
}

export interface DSABruteForceVsOptimized {
  problem_title: string;
  brute_force_approach: string;
  brute_force_time: string;
  brute_force_space: string;
  brute_force_code: string;
  optimized_approach: string;
  optimized_time: string;
  optimized_space: string;
  optimized_code: string;
  key_insight: string;
}

export interface DSAPracticeQuestion {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  prompt: string;
  starter_code: string;
  progressive_hints: string[];
  target_complexity: string;
}

export interface DSATopicGuide {
  slug: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  concept_explanation: string;
  how_it_works_steps: string[];
  time_complexity: string;
  space_complexity: string;
  complexity_assumptions: string;
  sample_slug: string;
  step_by_step_example: string;
  comparison: DSABruteForceVsOptimized;
  progressive_hints: string[];
  practice_questions: DSAPracticeQuestion[];
}

