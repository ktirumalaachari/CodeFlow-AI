from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException

from app.execution.runner import RunnerResponse, execution_runner
from app.schemas.execution import ExecuteResponseSchema
from app.schemas.platform import (
    CompareExecutionRequestSchema,
    CompareExecutionResponseSchema,
    ComparisonMetricsSchema,
    CreateHistoryRequestSchema,
    CreateProjectRequestSchema,
    ExecutionHistoryItemSchema,
    LearningProgressSchema,
    ProjectItemSchema,
    SecurityAuditResponseSchema,
    UpdateLearningProgressRequestSchema,
    UpdateProjectRequestSchema,
)
from app.storage.workspace_store import workspace_store

router = APIRouter(prefix="/api", tags=["platform"])


def _to_execute_response(result: RunnerResponse) -> ExecuteResponseSchema:
    payload = result.payload
    return ExecuteResponseSchema(
        execution_id=result.execution_id,
        status=payload.get("status", "runtime_error"),
        execution_mode=result.execution_mode,
        security_notice=result.security_notice,
        duration_ms=result.duration_ms,
        total_steps=payload.get("total_steps", 0),
        stdout=payload.get("stdout", ""),
        steps=payload.get("steps", []),
        error=payload.get("error"),
    )


def _peak_call_depth(steps: list[dict[str, Any]]) -> int:
    if not steps:
        return 0
    return max(int(s.get("call_depth", 1)) for s in steps)


def _peak_variables(steps: list[dict[str, Any]]) -> int:
    if not steps:
        return 0
    return max(
        len(s.get("locals", [])) + len(s.get("globals", []))
        for s in steps
    )


@router.post("/compare", response_model=CompareExecutionResponseSchema)
def compare_python_executions(
    body: CompareExecutionRequestSchema,
) -> CompareExecutionResponseSchema:
    shared_prefix = body.shared_input_code.strip()
    if shared_prefix:
        brute_full = f"{shared_prefix}\n\n{body.brute_force_code.strip()}\n"
        opt_full = f"{shared_prefix}\n\n{body.optimized_code.strip()}\n"
    else:
        brute_full = body.brute_force_code
        opt_full = body.optimized_code

    brute_run = execution_runner.run_trace(
        source_code=brute_full,
        max_steps=body.options.max_steps,
        timeout_seconds=body.options.timeout_seconds,
        stdin_data=body.options.stdin,
    )
    opt_run = execution_runner.run_trace(
        source_code=opt_full,
        max_steps=body.options.max_steps,
        timeout_seconds=body.options.timeout_seconds,
        stdin_data=body.options.stdin,
    )

    brute_resp = _to_execute_response(brute_run)
    opt_resp = _to_execute_response(opt_run)

    b_steps = brute_resp.total_steps
    o_steps = opt_resp.total_steps
    steps_saved = b_steps - o_steps
    reduction_pct = (
        round((steps_saved / b_steps) * 100.0, 1) if b_steps > 0 else 0.0
    )
    speedup_ratio = (
        round(b_steps / max(1, o_steps), 2) if b_steps > 0 else 1.0
    )

    b_raw_steps = brute_run.payload.get("steps", [])
    o_raw_steps = opt_run.payload.get("steps", [])
    b_depth = _peak_call_depth(b_raw_steps)
    o_depth = _peak_call_depth(o_raw_steps)
    b_vars = _peak_variables(b_raw_steps)
    o_vars = _peak_variables(o_raw_steps)

    outputs_match = (
        brute_resp.status == "completed"
        and opt_resp.status == "completed"
        and brute_resp.stdout.strip() == opt_resp.stdout.strip()
    )

    if brute_resp.status != "completed" or opt_resp.status != "completed":
        verdict_headline = (
            f"Execution status: Brute-Force ({brute_resp.status}) vs Optimized ({opt_resp.status})"
        )
        verdict_details = (
            f"Brute-Force recorded {b_steps} steps ({brute_resp.duration_ms} ms) and "
            f"Optimized recorded {o_steps} steps ({opt_resp.duration_ms} ms)."
        )
    elif steps_saved > 0:
        verdict_headline = (
            f"Optimized solution executed {steps_saved} fewer steps "
            f"({reduction_pct}% reduction · {speedup_ratio}x step efficiency)"
        )
        verdict_details = (
            f"On identical inputs, Brute-Force required {b_steps} traced execution steps "
            f"(peak call depth {b_depth}, {brute_resp.duration_ms} ms) while the Optimized "
            f"algorithm completed in {o_steps} steps (peak call depth {o_depth}, "
            f"{opt_resp.duration_ms} ms)."
        )
    elif steps_saved == 0:
        verdict_headline = f"Both solutions executed in {b_steps} traced steps on this input"
        verdict_details = (
            f"Increase input size in the Shared Input panel to observe asymptotic divergence "
            f"between the two approaches."
        )
    else:
        verdict_headline = (
            f"Brute-Force used {b_steps} steps vs {o_steps} steps for Optimized on small input"
        )
        verdict_details = (
            f"Auxiliary data structure initialization adds {abs(steps_saved)} setup steps on "
            f"small inputs before asymptotic gains dominate on larger inputs."
        )

    metrics = ComparisonMetricsSchema(
        brute_force_steps=b_steps,
        optimized_steps=o_steps,
        steps_saved=steps_saved,
        step_reduction_pct=reduction_pct,
        step_speedup_ratio=speedup_ratio,
        brute_force_duration_ms=brute_resp.duration_ms,
        optimized_duration_ms=opt_resp.duration_ms,
        brute_force_peak_call_depth=b_depth,
        optimized_peak_call_depth=o_depth,
        brute_force_peak_variables=b_vars,
        optimized_peak_variables=o_vars,
        outputs_match=outputs_match,
        verdict_headline=verdict_headline,
        verdict_details=verdict_details,
    )

    return CompareExecutionResponseSchema(
        brute_force=brute_resp,
        optimized=opt_resp,
        metrics=metrics,
    )


@router.get("/security/audit", response_model=SecurityAuditResponseSchema)
def get_security_audit() -> SecurityAuditResponseSchema:
    report = execution_runner.audit_security_status()
    return SecurityAuditResponseSchema(**report)


# --- Persisted User Projects Endpoints ---


@router.get("/projects", response_model=list[ProjectItemSchema])
def list_projects() -> list[ProjectItemSchema]:
    items = workspace_store.list_projects()
    return [ProjectItemSchema(**item) for item in items]


@router.get("/projects/{project_id}", response_model=ProjectItemSchema)
def get_project(project_id: str) -> ProjectItemSchema:
    item = workspace_store.get_project(project_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return ProjectItemSchema(**item)


@router.post("/projects", response_model=ProjectItemSchema)
def create_project(body: CreateProjectRequestSchema) -> ProjectItemSchema:
    created = workspace_store.create_project(body.model_dump())
    return ProjectItemSchema(**created)


@router.put("/projects/{project_id}", response_model=ProjectItemSchema)
def update_project(
    project_id: str, body: UpdateProjectRequestSchema
) -> ProjectItemSchema:
    updated = workspace_store.update_project(
        project_id, body.model_dump(exclude_none=True)
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return ProjectItemSchema(**updated)


@router.delete("/projects/{project_id}")
def delete_project(project_id: str) -> dict[str, Any]:
    deleted = workspace_store.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return {"deleted": True, "id": project_id}


@router.post("/projects/reset", response_model=list[ProjectItemSchema])
def reset_projects() -> list[ProjectItemSchema]:
    items = workspace_store.reset_demo_projects()
    return [ProjectItemSchema(**item) for item in items]


# --- Persisted Execution History Endpoints ---


@router.get("/history", response_model=list[ExecutionHistoryItemSchema])
def list_execution_history() -> list[ExecutionHistoryItemSchema]:
    items = workspace_store.list_history()
    return [ExecutionHistoryItemSchema(**item) for item in items]


@router.post("/history", response_model=ExecutionHistoryItemSchema)
def create_execution_history_entry(
    body: CreateHistoryRequestSchema,
) -> ExecutionHistoryItemSchema:
    entry = workspace_store.record_history(body.model_dump())
    return ExecutionHistoryItemSchema(**entry)


@router.delete("/history/{entry_id}")
def delete_execution_history_entry(entry_id: str) -> dict[str, Any]:
    deleted = workspace_store.delete_history_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"History entry '{entry_id}' not found.")
    return {"deleted": True, "id": entry_id}


@router.delete("/history")
def clear_execution_history() -> dict[str, Any]:
    count = workspace_store.clear_history()
    return {"cleared": True, "deleted_count": count}


# --- Persisted Guided Learning Progress Endpoints ---


@router.get("/learn/progress", response_model=LearningProgressSchema)
def get_learning_progress() -> LearningProgressSchema:
    data = workspace_store.get_learning_progress()
    return LearningProgressSchema(**data)


@router.put("/learn/progress", response_model=LearningProgressSchema)
def update_learning_progress(
    body: UpdateLearningProgressRequestSchema,
) -> LearningProgressSchema:
    updated = workspace_store.update_learning_progress(
        body.model_dump(exclude_none=True)
    )
    return LearningProgressSchema(**updated)


@router.post("/learn/reset", response_model=LearningProgressSchema)
def reset_learning_progress() -> LearningProgressSchema:
    reset = workspace_store.reset_learning_progress()
    return LearningProgressSchema(**reset)

