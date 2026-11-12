from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class ExecutionOptionsSchema(BaseModel):
    max_steps: int = Field(default=500, ge=10, le=1500)
    timeout_seconds: float = Field(default=3.0, ge=0.5, le=8.0)
    stdin: str | None = Field(default=None, max_length=4096)


class ExecuteRequestSchema(BaseModel):
    source_code: str = Field(..., max_length=25000)
    options: ExecutionOptionsSchema = Field(default_factory=ExecutionOptionsSchema)


class KeyValueEntrySchema(BaseModel):
    key: str
    value: "StructuredValueSchema"


class StructuredValueSchema(BaseModel):
    kind: Literal[
        "primitive",
        "sequence",
        "mapping",
        "set",
        "object",
        "circular_ref",
        "function",
    ]
    type_name: str
    display: str
    object_id: str | None = None
    length: int | None = None
    truncated: bool = False
    circular: bool = False
    items: list["StructuredValueSchema"] | None = None
    entries: list[KeyValueEntrySchema] | None = None
    attributes: list[KeyValueEntrySchema] | None = None


KeyValueEntrySchema.model_rebuild()
StructuredValueSchema.model_rebuild()


class VariableSnapshotSchema(BaseModel):
    name: str
    scope: Literal["local", "global"]
    var_type: str
    repr_value: str
    structured: StructuredValueSchema
    change: Literal["unchanged", "created", "modified", "deleted"] = "unchanged"
    previous_repr: str | None = None


class DeletedVariableSchema(BaseModel):
    name: str
    scope: Literal["local", "global"]
    previous_type: str
    previous_repr: str


class CallStackFrameSchema(BaseModel):
    frame_id: str
    function_name: str
    line: int
    depth: int
    locals_summary: dict[str, str] = Field(default_factory=dict)


class StepExplanationSchema(BaseModel):
    headline: str
    details: str
    changes: list[str] = Field(default_factory=list)


class StepExceptionSchema(BaseModel):
    error_type: str
    message: str
    friendly_explanation: str


class TraceStepSchema(BaseModel):
    step: int
    line: int
    event: Literal["line", "call", "return", "exception"]
    function_name: str
    call_depth: int
    source_line: str
    locals: list[VariableSnapshotSchema] = Field(default_factory=list)
    globals: list[VariableSnapshotSchema] = Field(default_factory=list)
    deleted_variables: list[DeletedVariableSchema] = Field(default_factory=list)
    call_stack: list[CallStackFrameSchema] = Field(default_factory=list)
    return_value: str | None = None
    stdout_snapshot: str = ""
    stdout_delta: str = ""
    explanation: StepExplanationSchema
    exception: StepExceptionSchema | None = None


class ExecutionErrorSchema(BaseModel):
    error_type: str
    message: str
    friendly_title: str
    friendly_explanation: str
    suggestion: str
    line: int | None = None
    column: int | None = None
    source_line: str | None = None
    traceback_lines: list[str] = Field(default_factory=list)


class ExecuteResponseSchema(BaseModel):
    execution_id: str
    status: Literal[
        "completed",
        "runtime_error",
        "syntax_error",
        "timeout",
        "step_limit_exceeded",
        "security_blocked",
    ]
    execution_mode: Literal["docker_sandbox", "development_subprocess"]
    security_notice: str
    duration_ms: float
    total_steps: int
    stdout: str
    steps: list[TraceStepSchema] = Field(default_factory=list)
    error: ExecutionErrorSchema | None = None


class HealthLimitsSchema(BaseModel):
    default_timeout_seconds: float
    max_timeout_seconds: float
    default_max_steps: int
    hard_max_steps: int
    max_memory_mb: int
    max_output_bytes: int


class HealthResponseSchema(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    python_version: str
    execution_mode: Literal["docker_sandbox", "development_subprocess"]
    security_notice: str
    limits: HealthLimitsSchema
    timestamp: str

