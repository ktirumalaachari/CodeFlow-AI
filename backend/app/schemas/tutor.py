from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, field_validator

TutorProviderId = Literal["gemini", "openai", "execution_grounded"]
TutorActionType = Literal[
    "chat",
    "explain_program",
    "explain_line",
    "explain_step",
    "explain_why",
    "debug_error",
    "hint",
    "dsa_topic",
]


class TutorVariableItemSchema(BaseModel):
    name: str = Field(..., max_length=120)
    scope: Literal["local", "global"] = "global"
    var_type: str = Field(..., max_length=80)
    repr_value: str = Field(..., max_length=1200)
    change: Literal["unchanged", "created", "modified", "deleted"] = "unchanged"
    previous_repr: str | None = Field(default=None, max_length=1200)
    object_id: str | None = Field(default=None, max_length=60)


class TutorCallFrameSchema(BaseModel):
    frame_id: str = Field(..., max_length=60)
    function_name: str = Field(..., max_length=120)
    line: int = Field(..., ge=0)
    depth: int = Field(..., ge=0)
    locals_summary: dict[str, str] = Field(default_factory=dict)


class TutorStepSnapshotSchema(BaseModel):
    step: int = Field(..., ge=1)
    line: int = Field(..., ge=1)
    event: Literal["line", "call", "return", "exception"] = "line"
    function_name: str = Field(default="<module>", max_length=120)
    call_depth: int = Field(default=0, ge=0)
    source_line: str = Field(default="", max_length=800)
    locals: list[TutorVariableItemSchema] = Field(default_factory=list)
    globals: list[TutorVariableItemSchema] = Field(default_factory=list)
    call_stack: list[TutorCallFrameSchema] = Field(default_factory=list)
    return_value: str | None = Field(default=None, max_length=600)
    stdout_snapshot: str = Field(default="", max_length=6000)
    stdout_delta: str = Field(default="", max_length=2000)
    explanation_headline: str = Field(default="", max_length=400)
    explanation_details: str = Field(default="", max_length=1200)


class TutorErrorSnapshotSchema(BaseModel):
    error_type: str = Field(..., max_length=120)
    message: str = Field(..., max_length=1500)
    friendly_title: str = Field(default="", max_length=300)
    friendly_explanation: str = Field(default="", max_length=1500)
    suggestion: str = Field(default="", max_length=1200)
    line: int | None = None
    source_line: str | None = Field(default=None, max_length=800)
    traceback_lines: list[str] = Field(default_factory=list)


class TutorDetectedStructureSchema(BaseModel):
    id: str = Field(..., max_length=120)
    kind: str = Field(..., max_length=60)
    variable_name: str = Field(..., max_length=120)
    title: str = Field(..., max_length=160)
    subtitle: str = Field(default="", max_length=300)
    active_operation: str | None = Field(default=None, max_length=80)
    summary: str = Field(default="", max_length=1200)


class TutorExecutionContextSchema(BaseModel):
    source_code: str = Field(default="", max_length=25000)
    selected_line_start: int | None = Field(default=None, ge=1)
    selected_line_end: int | None = Field(default=None, ge=1)
    selected_code: str | None = Field(default=None, max_length=5000)
    execution_status: str = Field(default="idle", max_length=60)
    total_steps: int = Field(default=0, ge=0)
    current_step: TutorStepSnapshotSchema | None = None
    previous_step: TutorStepSnapshotSchema | None = None
    stdout: str = Field(default="", max_length=8000)
    error: TutorErrorSnapshotSchema | None = None
    detected_structures: list[TutorDetectedStructureSchema] = Field(
        default_factory=list
    )


class TutorChatRequestSchema(BaseModel):
    action: TutorActionType = "chat"
    message: str = Field(default="", max_length=4000)
    provider: TutorProviderId = "gemini"
    model: str | None = Field(default=None, max_length=120)
    conversation_id: str | None = Field(default=None, max_length=120)
    hint_mode: bool = False
    hint_level: int = Field(default=1, ge=1, le=3)
    topic_slug: str | None = Field(default=None, max_length=80)
    allow_fallback: bool = True
    execution_context: TutorExecutionContextSchema = Field(
        default_factory=TutorExecutionContextSchema
    )

    @field_validator("message")
    @classmethod
    def validate_message_or_action(cls, value: str) -> str:
        return value.strip()


class TutorMessageSchema(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    action: TutorActionType
    content: str
    provider: TutorProviderId
    model: str
    used_fallback: bool = False
    hint_mode: bool = False
    hint_level: int | None = None
    step_number: int | None = None
    line_number: int | None = None
    created_at: str


class TutorChatResponseSchema(BaseModel):
    conversation_id: str
    message: TutorMessageSchema
    provider: TutorProviderId
    model: str
    used_fallback: bool = False
    fallback_reason: str | None = None
    suggested_questions: list[str] = Field(default_factory=list)


class TutorConversationSummarySchema(BaseModel):
    id: str
    title: str
    provider: TutorProviderId
    model: str
    message_count: int
    created_at: str
    updated_at: str


class TutorConversationDetailSchema(BaseModel):
    id: str
    title: str
    provider: TutorProviderId
    model: str
    created_at: str
    updated_at: str
    messages: list[TutorMessageSchema] = Field(default_factory=list)


class TutorModelInfoSchema(BaseModel):
    id: str
    label: str
    description: str
    is_default: bool = False


class TutorProviderInfoSchema(BaseModel):
    id: TutorProviderId
    name: str
    role: str
    configured: bool
    status: Literal["ready", "missing_api_key", "local_ready"]
    default_model: str
    models: list[TutorModelInfoSchema]
    env_var: str | None = None
    notes: str


class TutorProvidersResponseSchema(BaseModel):
    default_provider: TutorProviderId
    active_provider: TutorProviderId
    fallback_available: bool
    providers: list[TutorProviderInfoSchema]


class DSABruteForceVsOptimizedSchema(BaseModel):
    problem_title: str
    brute_force_approach: str
    brute_force_time: str
    brute_force_space: str
    brute_force_code: str
    optimized_approach: str
    optimized_time: str
    optimized_space: str
    optimized_code: str
    key_insight: str


class DSAPracticeQuestionSchema(BaseModel):
    id: str
    title: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    prompt: str
    starter_code: str
    progressive_hints: list[str]
    target_complexity: str


class DSATopicGuideSchema(BaseModel):
    slug: str
    title: str
    category: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    summary: str
    concept_explanation: str
    how_it_works_steps: list[str]
    time_complexity: str
    space_complexity: str
    complexity_assumptions: str
    sample_slug: str
    step_by_step_example: str
    comparison: DSABruteForceVsOptimizedSchema
    progressive_hints: list[str]
    practice_questions: list[DSAPracticeQuestionSchema]

