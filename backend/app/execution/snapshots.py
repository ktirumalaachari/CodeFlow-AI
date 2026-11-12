from __future__ import annotations

from typing import Any

from app.execution.models import (
    DeletedVariableData,
    ScopeType,
    VariableSnapshotData,
)
from app.execution.serializer import ValueSerializer, should_include_variable


class SnapshotDiffTracker:
    """
    Tracks per-frame and global variable states across execution steps so each
    snapshot accurately marks newly created, modified, unchanged, and deleted
    variables—supporting instantaneous forward/backward step restoration on the
    frontend without re-executing Python.
    """

    def __init__(self, serializer: ValueSerializer) -> None:
        self._serializer = serializer
        # Keyed by frame Key (0 for globals / module, id(frame) for function frames)
        self._frame_prev: dict[int, dict[str, tuple[str, str]]] = {}

    def capture_scope(
        self,
        frame_key: int,
        raw_mapping: dict[str, Any],
        scope: ScopeType,
        exclude_names: set[str] | None = None,
    ) -> tuple[list[VariableSnapshotData], list[DeletedVariableData]]:
        prev_map = self._frame_prev.get(frame_key, {})
        next_map: dict[str, tuple[str, str]] = {}
        snapshots: list[VariableSnapshotData] = []

        for name, value in raw_mapping.items():
            if exclude_names and name in exclude_names:
                continue
            if not should_include_variable(name, value):
                continue

            structured = self._serializer.serialize(value)
            repr_val = structured.display
            var_type = structured.type_name

            if name not in prev_map:
                change = "created"
                prev_repr = None
            else:
                old_type, old_repr = prev_map[name]
                if old_repr != repr_val or old_type != var_type:
                    change = "modified"
                    prev_repr = old_repr
                else:
                    change = "unchanged"
                    prev_repr = None

            next_map[name] = (var_type, repr_val)
            snapshots.append(
                VariableSnapshotData(
                    name=name,
                    scope=scope,
                    var_type=var_type,
                    repr_value=repr_val,
                    structured=structured,
                    change=change,  # type: ignore[arg-type]
                    previous_repr=prev_repr,
                )
            )

        deleted: list[DeletedVariableData] = []
        for old_name, (old_type, old_repr) in prev_map.items():
            if exclude_names and old_name in exclude_names:
                continue
            if old_name not in next_map:
                deleted.append(
                    DeletedVariableData(
                        name=old_name,
                        scope=scope,
                        previous_type=old_type,
                        previous_repr=old_repr,
                    )
                )

        self._frame_prev[frame_key] = next_map
        return snapshots, deleted

    def clear_frame(self, frame_key: int) -> None:
        self._frame_prev.pop(frame_key, None)

