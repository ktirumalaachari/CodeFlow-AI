from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field

from app.schemas.execution import ExecuteResponseSchema, ExecutionOptionsSchema


class CompareExecutionRequestSchema(BaseModel):
    brute_force_code: str = Field(
        ...,
        min_length=1,
        max_length=25000,
        description="Brute-force Python implementation to trace.",
    )
    optimized_code: str = Field(
        ...,
        min_length=1,
        max_length=25000,
        description="Optimized Python implementation to trace.",
    )
    shared_input_code: str = Field(
        default="",
        max_length=10000,
        description="Optional shared input initialization prepended identically to both solutions.",
    )
    options: ExecutionOptionsSchema = Field(default_factory=ExecutionOptionsSchema)


class ComparisonMetricsSchema(BaseModel):
    brute_force_steps: int
    optimized_steps: int
    steps_saved: int
    step_reduction_pct: float
    step_speedup_ratio: float
    brute_force_duration_ms: float
    optimized_duration_ms: float
    brute_force_peak_call_depth: int
    optimized_peak_call_depth: int
    brute_force_peak_variables: int
    optimized_peak_variables: int
    outputs_match: bool
    verdict_headline: str
    verdict_details: str


class CompareExecutionResponseSchema(BaseModel):
    brute_force: ExecuteResponseSchema
    optimized: ExecuteResponseSchema
    metrics: ComparisonMetricsSchema


class SecurityAuditResponseSchema(BaseModel):
    environment: str
    active_execution_mode: Literal["docker_sandbox", "development_subprocess"]
    docker_cli_installed: bool
    docker_daemon_reachable: bool
    docker_sandbox_image: str
    docker_sandbox_image_present: bool
    docker_isolation_verified: bool
    production_deployment_blocked: bool
    deployment_blockers: list[str]
    docker_container_flags: list[str]
    worker_sandbox_controls: list[str]


class ProjectItemSchema(BaseModel):
    id: str
    name: str
    description: str
    language: str = "python"
    topicSlug: str = "python-basics"
    status: Literal["Ready", "Template", "Draft"] = "Draft"
    isDemoSeed: bool = False
    codePreview: str
    createdAtIso: str
    lastModifiedIso: str


class CreateProjectRequestSchema(BaseModel):
    id: str | None = None
    name: str = Field(..., min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    language: str = "python"
    topicSlug: str = "python-basics"
    status: Literal["Ready", "Template", "Draft"] = "Draft"
    isDemoSeed: bool = False
    codePreview: str = Field(default="", max_length=25000)


class UpdateProjectRequestSchema(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    topicSlug: str | None = None
    status: Literal["Ready", "Template", "Draft"] | None = None
    codePreview: str | None = Field(default=None, max_length=25000)


class ExecutionHistoryItemSchema(BaseModel):
    id: str
    title: str
    sourceCode: str
    language: str = "python"
    status: str
    totalSteps: int
    durationMs: float
    executionMode: str
    stdoutPreview: str
    errorTitle: str | None = None
    createdAtIso: str


class CreateHistoryRequestSchema(BaseModel):
    id: str | None = None
    title: str = Field(default="Workspace Execution", max_length=160)
    sourceCode: str = Field(..., max_length=25000)
    language: str = "python"
    status: str = "completed"
    totalSteps: int = 0
    durationMs: float = 0.0
    executionMode: str = "development_subprocess"
    stdoutPreview: str = ""
    errorTitle: str | None = None


class LearningProgressSchema(BaseModel):
    explored_topics: list[str] = Field(default_factory=list)
    explored_algorithms: list[str] = Field(default_factory=list)
    completed_lessons: list[str] = Field(default_factory=list)
    completed_exercises: list[str] = Field(default_factory=list)
    active_track_id: str = "track-foundations"
    updated_at_iso: str


class UpdateLearningProgressRequestSchema(BaseModel):
    explored_topics: list[str] | None = None
    explored_algorithms: list[str] | None = None
    completed_lessons: list[str] | None = None
    completed_exercises: list[str] | None = None
    active_track_id: str | None = None

