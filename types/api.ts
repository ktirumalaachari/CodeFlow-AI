import type { SupportedLanguageId } from "@/types";

export type ExecutionEventType = "line" | "call" | "return" | "exception";
export type VariableChangeType = "unchanged" | "created" | "modified" | "deleted";
export type VariableScopeType = "local" | "global";

export type ExecutionRunStatus =
  | "completed"
  | "runtime_error"
  | "syntax_error"
  | "timeout"
  | "step_limit_exceeded"
  | "security_blocked";

export type ExecutionSandboxMode = "docker_sandbox" | "development_subprocess";

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export interface StructuredKeyValue {
  key: string;
  value: StructuredValueNode;
}

export interface StructuredValueNode {
  kind:
    | "primitive"
    | "sequence"
    | "mapping"
    | "set"
    | "object"
    | "circular_ref"
    | "function";
  type_name: string;
  display: string;
  object_id?: string | null;
  length?: number | null;
  truncated?: boolean;
  circular?: boolean;
  items?: StructuredValueNode[] | null;
  entries?: StructuredKeyValue[] | null;
  attributes?: StructuredKeyValue[] | null;
}

export interface VariableSnapshotItem {
  name: string;
  scope: VariableScopeType;
  var_type: string;
  repr_value: string;
  structured: StructuredValueNode;
  change: VariableChangeType;
  previous_repr?: string | null;
}

export interface DeletedVariableItem {
  name: string;
  scope: VariableScopeType;
  previous_type: string;
  previous_repr: string;
}

export interface CallStackFrameItem {
  frame_id: string;
  function_name: string;
  line: number;
  depth: number;
  locals_summary: Record<string, string>;
}

export interface StepExplanationItem {
  headline: string;
  details: string;
  changes: string[];
}

export interface StepExceptionItem {
  error_type: string;
  message: string;
  friendly_explanation: string;
}

export interface TraceStep {
  step: number;
  line: number;
  event: ExecutionEventType;
  function_name: string;
  call_depth: number;
  source_line: string;
  locals: VariableSnapshotItem[];
  globals: VariableSnapshotItem[];
  deleted_variables: DeletedVariableItem[];
  call_stack: CallStackFrameItem[];
  return_value?: string | null;
  stdout_snapshot: string;
  stdout_delta: string;
  explanation: StepExplanationItem;
  exception?: StepExceptionItem | null;
}

export interface ExecutionErrorDetail {
  error_type: string;
  message: string;
  friendly_title: string;
  friendly_explanation: string;
  suggestion: string;
  line?: number | null;
  column?: number | null;
  source_line?: string | null;
  traceback_lines: string[];
}

export interface ExecutionOptionsPayload {
  max_steps?: number;
  timeout_seconds?: number;
  stdin?: string | null;
}

export interface ExecuteRequestPayload {
  source_code: string;
  options?: ExecutionOptionsPayload;
}

export interface ExecuteResponsePayload {
  execution_id: string;
  status: ExecutionRunStatus;
  execution_mode: ExecutionSandboxMode;
  security_notice: string;
  duration_ms: number;
  total_steps: number;
  stdout: string;
  steps: TraceStep[];
  error?: ExecutionErrorDetail | null;
}

export interface BackendHealthLimits {
  default_timeout_seconds: number;
  max_timeout_seconds: number;
  default_max_steps: number;
  hard_max_steps: number;
  max_memory_mb: number;
  max_output_bytes: number;
}

export interface BackendHealthResponse {
  status: "ok";
  service: string;
  version: string;
  python_version: string;
  execution_mode: ExecutionSandboxMode;
  security_notice: string;
  limits: BackendHealthLimits;
  timestamp: string;
}

export type BackendServiceStatus = "connected" | "offline" | "checking";

export interface ExecutionTraceRequest {
  sourceCode: string;
  language: SupportedLanguageId;
  stdin?: string;
  maxSteps?: number;
}

export interface CompareExecutionRequestPayload {
  brute_force_code: string;
  optimized_code: string;
  shared_input_code?: string;
  options?: ExecutionOptionsPayload;
}

export interface ComparisonMetricsPayload {
  brute_force_steps: number;
  optimized_steps: number;
  steps_saved: number;
  step_reduction_pct: number;
  step_speedup_ratio: number;
  brute_force_duration_ms: number;
  optimized_duration_ms: number;
  brute_force_peak_call_depth: number;
  optimized_peak_call_depth: number;
  brute_force_peak_variables: number;
  optimized_peak_variables: number;
  outputs_match: boolean;
  verdict_headline: string;
  verdict_details: string;
}

export interface CompareExecutionResponsePayload {
  brute_force: ExecuteResponsePayload;
  optimized: ExecuteResponsePayload;
  metrics: ComparisonMetricsPayload;
}

export interface SecurityAuditResponsePayload {
  environment: string;
  active_execution_mode: ExecutionSandboxMode;
  docker_cli_installed: boolean;
  docker_daemon_reachable: boolean;
  docker_sandbox_image: string;
  docker_sandbox_image_present: boolean;
  docker_isolation_verified: boolean;
  production_deployment_blocked: boolean;
  deployment_blockers: string[];
  docker_container_flags: string[];
  worker_sandbox_controls: string[];
}

export interface LearningProgressPayload {
  explored_topics: string[];
  explored_algorithms: string[];
  completed_lessons: string[];
  completed_exercises: string[];
  active_track_id: string;
  updated_at_iso: string;
}

