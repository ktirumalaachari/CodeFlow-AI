from __future__ import annotations

from collections import deque
import math
import types
from typing import Any

from app.execution.models import KeyValueEntry, StructuredValue

IGNORED_VARIABLE_NAMES = frozenset(
    {
        "__builtins__",
        "__name__",
        "__doc__",
        "__package__",
        "__loader__",
        "__spec__",
        "__annotations__",
        "__cached__",
        "__file__",
    }
)


def should_include_variable(name: str, value: Any) -> bool:
    """Filter out internal dunders, imported modules, class defs, and top-level function defs."""
    if not name or (name.startswith("__") and name.endswith("__")):
        return False
    if name in IGNORED_VARIABLE_NAMES:
        return False
    # Hide comprehension internal iterator targets in older bytecode if any (.0)
    if name.startswith("."):
        return False
    if isinstance(value, types.ModuleType):
        return False
    if isinstance(value, type):
        return False
    if isinstance(
        value,
        (
            types.FunctionType,
            types.BuiltinFunctionType,
            types.MethodType,
        ),
    ):
        return False
    return True


class ObjectIdentityTracker:
    """
    Preserves stable human-readable reference IDs (ref#1, ref#2, ...) for mutable
    containers and user objects across snapshots within a single trace run.
    """

    def __init__(self, max_retained: int = 1000) -> None:
        self._counter = 0
        self._id_to_label: dict[int, str] = {}
        self._retained_refs: list[Any] = []
        self._max_retained = max_retained

    def get_ref_id(self, obj: Any) -> str:
        raw_id = id(obj)
        existing = self._id_to_label.get(raw_id)
        if existing is not None:
            return existing
        self._counter += 1
        label = f"ref#{self._counter}"
        self._id_to_label[raw_id] = label
        if len(self._retained_refs) < self._max_retained:
            self._retained_refs.append(obj)
        return label


def _truncate_str(text: str, limit: int = 240) -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def _format_float(val: float) -> str:
    if math.isnan(val):
        return "nan"
    if math.isinf(val):
        return "inf" if val > 0 else "-inf"
    return repr(val)


class ValueSerializer:
    def __init__(
        self,
        identity_tracker: ObjectIdentityTracker,
        max_items: int = 64,
        max_depth: int = 18,
    ) -> None:
        self._tracker = identity_tracker
        self._max_items = max_items
        self._max_depth = max_depth

    def serialize(self, value: Any) -> StructuredValue:
        return self._serialize_inner(value, depth=0, active_ids=set())

    def _serialize_inner(
        self,
        value: Any,
        depth: int,
        active_ids: set[int],
    ) -> StructuredValue:
        try:
            # 1. Primitives (check bool BEFORE int!)
            if value is None:
                return StructuredValue(
                    kind="primitive", type_name="NoneType", display="None"
                )
            if isinstance(value, bool):
                return StructuredValue(
                    kind="primitive",
                    type_name="bool",
                    display="True" if value else "False",
                )
            if isinstance(value, int):
                return StructuredValue(
                    kind="primitive",
                    type_name="int",
                    display=_truncate_str(str(value), 120),
                )
            if isinstance(value, float):
                return StructuredValue(
                    kind="primitive",
                    type_name="float",
                    display=_format_float(value),
                )
            if isinstance(value, str):
                return StructuredValue(
                    kind="primitive",
                    type_name="str",
                    display=_truncate_str(repr(value), 200),
                    length=len(value),
                )
            if isinstance(value, bytes):
                return StructuredValue(
                    kind="primitive",
                    type_name="bytes",
                    display=_truncate_str(repr(value), 160),
                    length=len(value),
                )
            if isinstance(value, range):
                items_preview = list(value[: self._max_items])
                return StructuredValue(
                    kind="sequence",
                    type_name="range",
                    display=repr(value),
                    length=len(value),
                    truncated=len(value) > self._max_items,
                    items=[
                        StructuredValue(
                            kind="primitive", type_name="int", display=str(v)
                        )
                        for v in items_preview
                    ],
                )

            raw_id = id(value)
            type_name = type(value).__name__

            # 2. Cycle detection for containers & objects
            if raw_id in active_ids:
                ref_id = self._tracker.get_ref_id(value)
                return StructuredValue(
                    kind="circular_ref",
                    type_name=type_name,
                    display=f"<circular {type_name} {ref_id}>",
                    object_id=ref_id,
                    circular=True,
                )

            # 3. Depth limit check
            if depth >= self._max_depth:
                return StructuredValue(
                    kind="object",
                    type_name=type_name,
                    display=_safe_short_repr(value, type_name),
                    object_id=self._tracker.get_ref_id(value),
                    truncated=True,
                )

            next_active = active_ids | {raw_id}

            # 4. Sequences: list, tuple, deque
            if isinstance(value, (list, tuple, deque)):
                is_mutable = isinstance(value, (list, deque))
                ref_id = self._tracker.get_ref_id(value) if is_mutable else None
                seq_list = list(value)
                total_len = len(seq_list)
                sliced = seq_list[: self._max_items]
                serialized_items = [
                    self._serialize_inner(item, depth + 1, next_active)
                    for item in sliced
                ]
                inner_text = ", ".join(it.display for it in serialized_items)
                if total_len > self._max_items:
                    inner_text += f", ... (+{total_len - self._max_items} more)"
                if isinstance(value, list):
                    disp = f"[{inner_text}]"
                elif isinstance(value, tuple):
                    disp = (
                        f"({inner_text},)"
                        if total_len == 1
                        else f"({inner_text})"
                    )
                else:
                    disp = f"deque([{inner_text}])"

                return StructuredValue(
                    kind="sequence",
                    type_name=type_name,
                    display=_truncate_str(disp, 260),
                    object_id=ref_id,
                    length=total_len,
                    truncated=total_len > self._max_items,
                    items=serialized_items,
                )

            # 5. Sets: set, frozenset
            if isinstance(value, (set, frozenset)):
                is_mutable = isinstance(value, set)
                ref_id = self._tracker.get_ref_id(value) if is_mutable else None
                total_len = len(value)
                sorted_elems = sorted(list(value), key=lambda x: (type(x).__name__, repr(x)))
                sliced = sorted_elems[: self._max_items]
                serialized_items = [
                    self._serialize_inner(item, depth + 1, next_active)
                    for item in sliced
                ]
                if total_len == 0:
                    disp = "set()" if is_mutable else "frozenset()"
                else:
                    inner_text = ", ".join(it.display for it in serialized_items)
                    if total_len > self._max_items:
                        inner_text += f", ... (+{total_len - self._max_items} more)"
                    disp = (
                        f"{{{inner_text}}}"
                        if is_mutable
                        else f"frozenset({{{inner_text}}})"
                    )

                return StructuredValue(
                    kind="set",
                    type_name=type_name,
                    display=_truncate_str(disp, 260),
                    object_id=ref_id,
                    length=total_len,
                    truncated=total_len > self._max_items,
                    items=serialized_items,
                )

            # 6. Mappings: dict (including defaultdict, Counter)
            if isinstance(value, dict):
                ref_id = self._tracker.get_ref_id(value)
                total_len = len(value)
                entries: list[KeyValueEntry] = []
                for idx, (k, v) in enumerate(value.items()):
                    if idx >= self._max_items:
                        break
                    key_struct = self._serialize_inner(k, depth + 1, next_active)
                    val_struct = self._serialize_inner(v, depth + 1, next_active)
                    entries.append(KeyValueEntry(key=key_struct.display, value=val_struct))

                inner_pairs = ", ".join(f"{e.key}: {e.value.display}" for e in entries)
                if total_len > self._max_items:
                    inner_pairs += f", ... (+{total_len - self._max_items} more)"
                disp = f"{{{inner_pairs}}}"
                if type_name != "dict":
                    disp = f"{type_name}({disp})"

                return StructuredValue(
                    kind="mapping",
                    type_name=type_name,
                    display=_truncate_str(disp, 260),
                    object_id=ref_id,
                    length=total_len,
                    truncated=total_len > self._max_items,
                    entries=entries,
                )

            # 7. Custom User Class Instances (e.g., TreeNode, ListNode)
            if hasattr(value, "__dict__") or hasattr(value, "__slots__"):
                ref_id = self._tracker.get_ref_id(value)
                raw_attrs: dict[str, Any] = {}
                if hasattr(value, "__dict__"):
                    raw_attrs.update(
                        {
                            k: v
                            for k, v in vars(value).items()
                            if not k.startswith("__")
                        }
                    )
                if hasattr(value, "__slots__"):
                    slots = getattr(value, "__slots__", ())
                    if isinstance(slots, str):
                        slots = (slots,)
                    for slot_name in slots:
                        if not slot_name.startswith("__") and hasattr(value, slot_name):
                            raw_attrs[slot_name] = getattr(value, slot_name)
                attr_entries: list[KeyValueEntry] = []
                for idx, (k, v) in enumerate(raw_attrs.items()):
                    if idx >= self._max_items:
                        break
                    attr_entries.append(
                        KeyValueEntry(
                            key=str(k),
                            value=self._serialize_inner(v, depth + 1, next_active),
                        )
                    )
                summary_parts = ", ".join(
                    f"{a.key}={a.value.display}" for a in attr_entries[:4]
                )
                if len(attr_entries) > 4:
                    summary_parts += ", ..."
                disp = f"{type_name}({summary_parts})"
                return StructuredValue(
                    kind="object",
                    type_name=type_name,
                    display=_truncate_str(disp, 240),
                    object_id=ref_id,
                    length=len(raw_attrs),
                    attributes=attr_entries,
                )

            # 8. Fallback for other standard library objects
            return StructuredValue(
                kind="object",
                type_name=type_name,
                display=_safe_short_repr(value, type_name),
            )

        except Exception as exc:  # Defensive serialization guard
            return StructuredValue(
                kind="object",
                type_name=type(value).__name__,
                display=f"<unserializable {type(value).__name__}: {exc}>",
            )


def _safe_short_repr(value: Any, type_name: str) -> str:
    try:
        return _truncate_str(repr(value), 160)
    except Exception:
        return f"<{type_name} instance>"

