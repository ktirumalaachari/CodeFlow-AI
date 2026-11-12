from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
import threading
import uuid
from typing import Any

from app.core.config import settings

DEFAULT_STARTER_PROJECTS: list[dict[str, Any]] = [
    {
        "id": "proj-two-pointers",
        "name": "Two Pointers — Sorted Pair Target",
        "description": "Converging left and right index pointers eliminating nested O(n²) scans.",
        "language": "python",
        "topic_slug": "two-pointers",
        "created_at_iso": "2026-03-25T10:00:00.000Z",
        "last_modified_iso": "2026-03-28T16:20:00.000Z",
        "status": "Ready",
        "is_demo_seed": True,
        "code_preview": (
            "nums = [2, 5, 8, 11, 15]\n"
            "target = 16\n"
            "left = 0\n"
            "right = len(nums) - 1\n"
            "matched_pair = (-1, -1)\n\n"
            "while left < right:\n"
            "    current_sum = nums[left] + nums[right]\n"
            "    if current_sum == target:\n"
            "        matched_pair = (left, right)\n"
            "        break\n"
            "    elif current_sum < target:\n"
            "        left += 1\n"
            "    else:\n"
            "        right -= 1\n\n"
            "print('Matched indices:', matched_pair)"
        ),
    },
    {
        "id": "proj-sliding-window",
        "name": "Sliding Window — Max Subarray Sum (k=3)",
        "description": "Maintain a rolling window sum in O(1) per step by adding entering and subtracting leaving elements.",
        "language": "python",
        "topic_slug": "sliding-window",
        "created_at_iso": "2026-03-24T09:15:00.000Z",
        "last_modified_iso": "2026-03-28T12:10:00.000Z",
        "status": "Template",
        "is_demo_seed": True,
        "code_preview": (
            "nums = [4, 2, 1, 7, 8, 1, 2, 8]\n"
            "k = 3\n"
            "window_sum = sum(nums[:k])\n"
            "max_sum = window_sum\n\n"
            "for right in range(k, len(nums)):\n"
            "    left = right - k\n"
            "    window_sum += nums[right] - nums[left]\n"
            "    if window_sum > max_sum:\n"
            "        max_sum = window_sum\n\n"
            "print('Maximum sum of window k=3:', max_sum)"
        ),
    },
    {
        "id": "proj-recursion-stack",
        "name": "Recursive Call Stack — Factorial Trace",
        "description": "Inspect call frame allocation on recursive descent and return value propagation on unwind.",
        "language": "python",
        "topic_slug": "recursion",
        "created_at_iso": "2026-03-22T14:00:00.000Z",
        "last_modified_iso": "2026-03-27T18:45:00.000Z",
        "status": "Draft",
        "is_demo_seed": True,
        "code_preview": (
            "def factorial(n: int) -> int:\n"
            "    if n <= 1:\n"
            "        return 1\n"
            "    sub_result = factorial(n - 1)\n"
            "    return n * sub_result\n\n"
            "answer = factorial(4)\n"
            "print('4! =', answer)"
        ),
    },
    {
        "id": "proj-binary-search",
        "name": "Binary Search — Halving Search Interval",
        "description": "Track low, mid, and high boundaries across logarithmic interval halving.",
        "language": "python",
        "topic_slug": "sorting",
        "created_at_iso": "2026-03-20T11:30:00.000Z",
        "last_modified_iso": "2026-03-26T09:05:00.000Z",
        "status": "Ready",
        "is_demo_seed": True,
        "code_preview": (
            "nums = [3, 9, 14, 21, 29, 36, 44]\n"
            "target = 29\n"
            "low = 0\n"
            "high = len(nums) - 1\n"
            "found_index = -1\n\n"
            "while low <= high:\n"
            "    mid = (low + high) // 2\n"
            "    if nums[mid] == target:\n"
            "        found_index = mid\n"
            "        break\n"
            "    elif nums[mid] < target:\n"
            "        low = mid + 1\n"
            "    else:\n"
            "        high = mid - 1\n\n"
            "print('Found index:', found_index)"
        ),
    },
]

DEFAULT_LEARNING_PROGRESS: dict[str, Any] = {
    "explored_topics": ["python-basics", "arrays", "sliding-window"],
    "explored_algorithms": ["binary-search", "sliding-window-subarray"],
    "completed_lessons": ["lesson-variables-memory"],
    "completed_exercises": [],
    "active_track_id": "track-foundations",
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class WorkspacePersistenceStore:
    """
    SQLite-backed persistence for CODEFLOW AI projects, execution history,
    and guided learning progress so user work survives application restarts.
    """

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or settings.workspace_db_path
        self._lock = threading.Lock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        path_obj = Path(self.db_path)
        path_obj.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._lock, self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS workspace_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    language TEXT NOT NULL,
                    topic_slug TEXT NOT NULL,
                    status TEXT NOT NULL,
                    is_demo_seed INTEGER NOT NULL DEFAULT 0,
                    code_preview TEXT NOT NULL,
                    created_at_iso TEXT NOT NULL,
                    last_modified_iso TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS execution_history (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    source_code TEXT NOT NULL,
                    language TEXT NOT NULL,
                    status TEXT NOT NULL,
                    total_steps INTEGER NOT NULL,
                    duration_ms REAL NOT NULL,
                    execution_mode TEXT NOT NULL,
                    stdout_preview TEXT NOT NULL,
                    error_title TEXT,
                    created_at_iso TEXT NOT NULL
                );
                """
            )
            seeded = conn.execute(
                "SELECT value FROM workspace_meta WHERE key = 'projects_seeded'"
            ).fetchone()
            if not seeded:
                self._seed_default_projects_locked(conn)
                conn.execute(
                    "INSERT OR REPLACE INTO workspace_meta (key, value) VALUES ('projects_seeded', '1')"
                )

            progress_row = conn.execute(
                "SELECT value FROM workspace_meta WHERE key = 'learning_progress'"
            ).fetchone()
            if not progress_row:
                initial_prog = {
                    **DEFAULT_LEARNING_PROGRESS,
                    "updated_at_iso": _utc_now_iso(),
                }
                conn.execute(
                    "INSERT INTO workspace_meta (key, value) VALUES ('learning_progress', ?)",
                    (json.dumps(initial_prog),),
                )
            conn.commit()

    def _seed_default_projects_locked(self, conn: sqlite3.Connection) -> None:
        conn.execute("DELETE FROM projects")
        for proj in DEFAULT_STARTER_PROJECTS:
            conn.execute(
                """
                INSERT INTO projects (
                    id, name, description, language, topic_slug, status,
                    is_demo_seed, code_preview, created_at_iso, last_modified_iso
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    proj["id"],
                    proj["name"],
                    proj["description"],
                    proj["language"],
                    proj["topic_slug"],
                    proj["status"],
                    1 if proj.get("is_demo_seed") else 0,
                    proj["code_preview"],
                    proj["created_at_iso"],
                    proj["last_modified_iso"],
                ),
            )

    @staticmethod
    def _row_to_project(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "language": row["language"],
            "topicSlug": row["topic_slug"],
            "status": row["status"],
            "isDemoSeed": bool(row["is_demo_seed"]),
            "codePreview": row["code_preview"],
            "createdAtIso": row["created_at_iso"],
            "lastModifiedIso": row["last_modified_iso"],
        }

    def list_projects(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM projects ORDER BY last_modified_iso DESC"
            ).fetchall()
            return [self._row_to_project(r) for r in rows]

    def get_project(self, project_id: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            return self._row_to_project(row) if row else None

    def create_project(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = _utc_now_iso()
        proj_id = payload.get("id") or f"proj_{uuid.uuid4().hex[:10]}"
        name = (payload.get("name") or "").strip() or "Untitled Visualization"
        description = (
            payload.get("description") or ""
        ).strip() or "Python program saved in CODEFLOW AI workspace."
        language = payload.get("language") or "python"
        topic_slug = payload.get("topicSlug") or payload.get("topic_slug") or "python-basics"
        status = payload.get("status") or "Draft"
        is_demo_seed = bool(payload.get("isDemoSeed", False))
        code_preview = payload.get("codePreview") or payload.get("code_preview") or (
            "def solve(items: list[int]) -> int:\n"
            "    total = 0\n"
            "    for value in items:\n"
            "        total += value\n"
            "    return total\n\n"
            "print(solve([10, 20, 30]))"
        )

        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO projects (
                    id, name, description, language, topic_slug, status,
                    is_demo_seed, code_preview, created_at_iso, last_modified_iso
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    proj_id,
                    name,
                    description,
                    language,
                    topic_slug,
                    status,
                    1 if is_demo_seed else 0,
                    code_preview,
                    payload.get("createdAtIso") or now,
                    now,
                ),
            )
            conn.commit()
            row = conn.execute(
                "SELECT * FROM projects WHERE id = ?", (proj_id,)
            ).fetchone()
            assert row is not None
            return self._row_to_project(row)

    def update_project(
        self, project_id: str, patch: dict[str, Any]
    ) -> dict[str, Any] | None:
        with self._lock, self._connect() as conn:
            existing = conn.execute(
                "SELECT * FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            if not existing:
                return None

            now = _utc_now_iso()
            name = (patch.get("name") or "").strip() or existing["name"]
            description = (
                patch.get("description")
                if patch.get("description") is not None
                else existing["description"]
            )
            topic_slug = (
                patch.get("topicSlug")
                or patch.get("topic_slug")
                or existing["topic_slug"]
            )
            status = patch.get("status") or existing["status"]
            code_preview = (
                patch.get("codePreview")
                if patch.get("codePreview") is not None
                else (
                    patch.get("code_preview")
                    if patch.get("code_preview") is not None
                    else existing["code_preview"]
                )
            )

            conn.execute(
                """
                UPDATE projects
                SET name = ?, description = ?, topic_slug = ?, status = ?,
                    code_preview = ?, last_modified_iso = ?
                WHERE id = ?
                """,
                (
                    name,
                    description,
                    topic_slug,
                    status,
                    code_preview,
                    now,
                    project_id,
                ),
            )
            conn.commit()
            row = conn.execute(
                "SELECT * FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            return self._row_to_project(row) if row else None

    def delete_project(self, project_id: str) -> bool:
        with self._lock, self._connect() as conn:
            cur = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            conn.commit()
            return cur.rowcount > 0

    def reset_demo_projects(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            self._seed_default_projects_locked(conn)
            conn.commit()
            rows = conn.execute(
                "SELECT * FROM projects ORDER BY last_modified_iso DESC"
            ).fetchall()
            return [self._row_to_project(r) for r in rows]

    # --- Execution History ---

    @staticmethod
    def _row_to_history(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "title": row["title"],
            "sourceCode": row["source_code"],
            "language": row["language"],
            "status": row["status"],
            "totalSteps": int(row["total_steps"]),
            "durationMs": float(row["duration_ms"]),
            "executionMode": row["execution_mode"],
            "stdoutPreview": row["stdout_preview"],
            "errorTitle": row["error_title"],
            "createdAtIso": row["created_at_iso"],
        }

    def list_history(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM execution_history ORDER BY created_at_iso DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return [self._row_to_history(r) for r in rows]

    def record_history(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = _utc_now_iso()
        entry_id = payload.get("id") or f"run_{uuid.uuid4().hex[:10]}"
        title = (payload.get("title") or "").strip() or "Workspace Execution"
        source_code = payload.get("sourceCode") or payload.get("source_code") or ""
        language = payload.get("language") or "python"
        status = payload.get("status") or "completed"
        total_steps = int(payload.get("totalSteps", payload.get("total_steps", 0)))
        duration_ms = float(payload.get("durationMs", payload.get("duration_ms", 0.0)))
        execution_mode = (
            payload.get("executionMode")
            or payload.get("execution_mode")
            or "development_subprocess"
        )
        stdout_preview = (
            payload.get("stdoutPreview")
            or payload.get("stdout_preview")
            or ""
        )[:500]
        error_title = payload.get("errorTitle") or payload.get("error_title")

        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO execution_history (
                    id, title, source_code, language, status, total_steps,
                    duration_ms, execution_mode, stdout_preview, error_title, created_at_iso
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    entry_id,
                    title,
                    source_code,
                    language,
                    status,
                    total_steps,
                    duration_ms,
                    execution_mode,
                    stdout_preview,
                    error_title,
                    payload.get("createdAtIso") or now,
                ),
            )
            conn.commit()
            row = conn.execute(
                "SELECT * FROM execution_history WHERE id = ?", (entry_id,)
            ).fetchone()
            assert row is not None
            return self._row_to_history(row)

    def delete_history_entry(self, entry_id: str) -> bool:
        with self._lock, self._connect() as conn:
            cur = conn.execute(
                "DELETE FROM execution_history WHERE id = ?", (entry_id,)
            )
            conn.commit()
            return cur.rowcount > 0

    def clear_history(self) -> int:
        with self._lock, self._connect() as conn:
            cur = conn.execute("DELETE FROM execution_history")
            conn.commit()
            return cur.rowcount

    # --- Learning Progress ---

    def get_learning_progress(self) -> dict[str, Any]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT value FROM workspace_meta WHERE key = 'learning_progress'"
            ).fetchone()
            if not row:
                return {
                    **DEFAULT_LEARNING_PROGRESS,
                    "updated_at_iso": _utc_now_iso(),
                }
            data = json.loads(row["value"])
            return {
                "explored_topics": list(data.get("explored_topics", [])),
                "explored_algorithms": list(data.get("explored_algorithms", [])),
                "completed_lessons": list(data.get("completed_lessons", [])),
                "completed_exercises": list(data.get("completed_exercises", [])),
                "active_track_id": data.get("active_track_id", "track-foundations"),
                "updated_at_iso": data.get("updated_at_iso", _utc_now_iso()),
            }

    def update_learning_progress(self, patch: dict[str, Any]) -> dict[str, Any]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT value FROM workspace_meta WHERE key = 'learning_progress'"
            ).fetchone()
            current = (
                json.loads(row["value"])
                if row
                else dict(DEFAULT_LEARNING_PROGRESS)
            )

            for list_key, camel_key in [
                ("explored_topics", "exploredTopics"),
                ("explored_algorithms", "exploredAlgorithms"),
                ("completed_lessons", "completedLessons"),
                ("completed_exercises", "completedExercises"),
            ]:
                incoming = patch.get(list_key)
                if incoming is None:
                    incoming = patch.get(camel_key)
                if incoming is not None:
                    seen: list[str] = []
                    for item in incoming:
                        s = str(item).strip()
                        if s and s not in seen:
                            seen.append(s)
                    current[list_key] = seen

            if "active_track_id" in patch or "activeTrackId" in patch:
                current["active_track_id"] = (
                    patch.get("active_track_id")
                    or patch.get("activeTrackId")
                    or "track-foundations"
                )

            current["updated_at_iso"] = _utc_now_iso()
            conn.execute(
                "INSERT OR REPLACE INTO workspace_meta (key, value) VALUES ('learning_progress', ?)",
                (json.dumps(current),),
            )
            conn.commit()
            return current

    def reset_learning_progress(self) -> dict[str, Any]:
        reset_data = {
            "explored_topics": [],
            "explored_algorithms": [],
            "completed_lessons": [],
            "completed_exercises": [],
            "active_track_id": "track-foundations",
            "updated_at_iso": _utc_now_iso(),
        }
        with self._lock, self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO workspace_meta (key, value) VALUES ('learning_progress', ?)",
                (json.dumps(reset_data),),
            )
            conn.commit()
        return reset_data


workspace_store = WorkspacePersistenceStore()

