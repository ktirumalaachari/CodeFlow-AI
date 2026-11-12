from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import threading
import uuid

from app.core.config import settings
from app.schemas.tutor import (
    TutorActionType,
    TutorConversationDetailSchema,
    TutorConversationSummarySchema,
    TutorMessageSchema,
    TutorProviderId,
)


class TutorConversationStore:
    """
    SQLite-backed persistence repository for AI Tutor conversations and messages.
    Designed with a clean repository boundary ready for PostgreSQL migration in Phase 6.
    """

    def __init__(self, db_path: str | Path | None = None) -> None:
        self._db_path = Path(db_path or settings.tutor_db_path)
        self._lock = threading.Lock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self._db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_db(self) -> None:
        with self._lock:
            with self._connect() as conn:
                conn.executescript(
                    """
                    CREATE TABLE IF NOT EXISTS tutor_conversations (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        provider TEXT NOT NULL,
                        model TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS tutor_messages (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        action TEXT NOT NULL,
                        content TEXT NOT NULL,
                        provider TEXT NOT NULL,
                        model TEXT NOT NULL,
                        used_fallback INTEGER NOT NULL DEFAULT 0,
                        hint_mode INTEGER NOT NULL DEFAULT 0,
                        hint_level INTEGER,
                        step_number INTEGER,
                        line_number INTEGER,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES tutor_conversations(id) ON DELETE CASCADE
                    );

                    CREATE INDEX IF NOT EXISTS idx_tutor_messages_conv
                        ON tutor_messages(conversation_id, created_at);
                    """
                )

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_or_get_conversation(
        self,
        *,
        conversation_id: str | None,
        title: str,
        provider: TutorProviderId,
        model: str,
    ) -> str:
        now = self._now_iso()
        with self._lock:
            with self._connect() as conn:
                if conversation_id:
                    row = conn.execute(
                        "SELECT id FROM tutor_conversations WHERE id = ?",
                        (conversation_id,),
                    ).fetchone()
                    if row is not None:
                        conn.execute(
                            "UPDATE tutor_conversations SET provider = ?, model = ?, updated_at = ? WHERE id = ?",
                            (provider, model, now, conversation_id),
                        )
                        return str(row["id"])

                new_id = conversation_id or f"conv_{uuid.uuid4().hex[:12]}"
                clean_title = (title.strip()[:80] or "Workspace Code Session")
                conn.execute(
                    """
                    INSERT INTO tutor_conversations (id, title, provider, model, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (new_id, clean_title, provider, model, now, now),
                )
                return new_id

    def append_message(
        self,
        *,
        conversation_id: str,
        role: str,
        action: TutorActionType,
        content: str,
        provider: TutorProviderId,
        model: str,
        used_fallback: bool = False,
        hint_mode: bool = False,
        hint_level: int | None = None,
        step_number: int | None = None,
        line_number: int | None = None,
    ) -> TutorMessageSchema:
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        now = self._now_iso()
        with self._lock:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO tutor_messages (
                        id, conversation_id, role, action, content, provider, model,
                        used_fallback, hint_mode, hint_level, step_number, line_number, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        msg_id,
                        conversation_id,
                        role,
                        action,
                        content,
                        provider,
                        model,
                        1 if used_fallback else 0,
                        1 if hint_mode else 0,
                        hint_level,
                        step_number,
                        line_number,
                        now,
                    ),
                )
                conn.execute(
                    "UPDATE tutor_conversations SET updated_at = ?, provider = ?, model = ? WHERE id = ?",
                    (now, provider, model, conversation_id),
                )

        return TutorMessageSchema(
            id=msg_id,
            role="assistant" if role == "assistant" else "user",
            action=action,
            content=content,
            provider=provider,
            model=model,
            used_fallback=used_fallback,
            hint_mode=hint_mode,
            hint_level=hint_level,
            step_number=step_number,
            line_number=line_number,
            created_at=now,
        )

    def list_conversations(self, limit: int = 30) -> list[TutorConversationSummarySchema]:
        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT
                        c.id,
                        c.title,
                        c.provider,
                        c.model,
                        c.created_at,
                        c.updated_at,
                        COUNT(m.id) AS message_count
                    FROM tutor_conversations c
                    LEFT JOIN tutor_messages m ON m.conversation_id = c.id
                    GROUP BY c.id
                    ORDER BY c.updated_at DESC
                    LIMIT ?
                    """,
                    (limit,),
                ).fetchall()

        return [
            TutorConversationSummarySchema(
                id=str(r["id"]),
                title=str(r["title"]),
                provider=r["provider"],
                model=str(r["model"]),
                message_count=int(r["message_count"]),
                created_at=str(r["created_at"]),
                updated_at=str(r["updated_at"]),
            )
            for r in rows
        ]

    def get_conversation(
        self, conversation_id: str
    ) -> TutorConversationDetailSchema | None:
        with self._lock:
            with self._connect() as conn:
                conv = conn.execute(
                    "SELECT * FROM tutor_conversations WHERE id = ?",
                    (conversation_id,),
                ).fetchone()
                if conv is None:
                    return None

                msg_rows = conn.execute(
                    """
                    SELECT * FROM tutor_messages
                    WHERE conversation_id = ?
                    ORDER BY created_at ASC, rowid ASC
                    """,
                    (conversation_id,),
                ).fetchall()

        messages = [
            TutorMessageSchema(
                id=str(m["id"]),
                role="assistant" if m["role"] == "assistant" else "user",
                action=m["action"],
                content=str(m["content"]),
                provider=m["provider"],
                model=str(m["model"]),
                used_fallback=bool(m["used_fallback"]),
                hint_mode=bool(m["hint_mode"]),
                hint_level=m["hint_level"],
                step_number=m["step_number"],
                line_number=m["line_number"],
                created_at=str(m["created_at"]),
            )
            for m in msg_rows
        ]

        return TutorConversationDetailSchema(
            id=str(conv["id"]),
            title=str(conv["title"]),
            provider=conv["provider"],
            model=str(conv["model"]),
            created_at=str(conv["created_at"]),
            updated_at=str(conv["updated_at"]),
            messages=messages,
        )

    def delete_conversation(self, conversation_id: str) -> bool:
        with self._lock:
            with self._connect() as conn:
                cur = conn.execute(
                    "DELETE FROM tutor_conversations WHERE id = ?",
                    (conversation_id,),
                )
                return cur.rowcount > 0

