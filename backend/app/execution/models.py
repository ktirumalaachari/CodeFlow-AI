from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

EventType = Literal["line", "call", "return", "exception"]
ChangeType = Literal["unchanged", "created", "modified", "deleted"]
ScopeType = Literal["local", "global"]
ExecutionStatus = Literal[
    "completed",
    "runtime_error",
    "syntax_error",
    "timeout",
    "step_limit_exceeded",
    "security_blocked",
]


@dataclass
class KeyValueEntry:
    key: str
    value: "StructuredValue"


@dataclass
class StructuredValue:
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
    items: list["StructuredValue"] | None = None
    entries: list[KeyValueEntry] | None = None
    attributes: list[KeyValueEntry] | None = None


@dataclass
class VariableSnapshotData:
    name: str
    scope: ScopeType
    var_type: str
    repr_value: str
    structured: StructuredValue
    change: ChangeType = "unchanged"
    previous_repr: str | None = None


@dataclass
class DeletedVariableData:
    name: str
    scope: ScopeType
    previous_type: str
    previous_repr: str


@dataclass
class CallStackFrameData:
    frame_id: str
    function_name: str
    line: int
    depth: int
    locals_summary: dict[str, str] = field(default_factory=dict)


@dataclass
class StepExplanationData:
    headline: str
    details: str
    changes: list[str] = field(default_factory=list)


@dataclass
class StepExceptionData:
    error_type: str
    message: str
    friendly_explanation: str


@dataclass
class TraceStepData:
    step: int
    line: int
    event: EventType
    function_name: str
    call_depth: int
    source_line: str
    locals: list[VariableSnapshotData] = field(default_factory=list)
    globals: list[VariableSnapshotData] = field(default_factory=list)
    deleted_variables: list[DeletedVariableData] = field(default_factory=list)
    call_stack: list[CallStackFrameData] = field(default_factory=list)
    return_value: str | None = None
    stdout_snapshot: str = ""
    stdout_delta: str = ""
    explanation: StepExplanationData = field(
        default_factory=lambda: StepExplanationData(headline="", details="")
    )
    exception: StepExceptionData | None = None


@dataclass
class ExecutionErrorData:
    error_type: str
    message: str
    friendly_title: str
    friendly_explanation: str
    suggestion: str
    line: int | None = None
    column: int | None = None
    source_line: str | None = None
    traceback_lines: list[str] = field(default_factory=list)


@dataclass
class WorkerTracePayload:
    status: ExecutionStatus
    total_steps: int
    stdout: str
    steps: list[TraceStepData] = field(default_factory=list)
    error: ExecutionErrorData | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

