from __future__ import annotations

from app.execution.tracer import PythonExecutionTracer


def _get_global(step, name: str):
    for v in step.globals:
        if v.name == name:
            return v
    return None


def test_variable_lifecycle_created_modified_deleted():
    code = (
        "counter = 10\n"
        "counter += 5\n"
        "other = 99\n"
        "del counter\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"
    assert len(payload.steps) == 4

    # Step 1: counter created
    c1 = _get_global(payload.steps[0], "counter")
    assert c1 is not None and c1.change == "created" and c1.repr_value == "10"

    # Step 2: counter modified from 10 to 15
    c2 = _get_global(payload.steps[1], "counter")
    assert c2 is not None
    assert c2.change == "modified"
    assert c2.previous_repr == "10"
    assert c2.repr_value == "15"

    # Step 3: counter unchanged, other created
    c3 = _get_global(payload.steps[2], "counter")
    o3 = _get_global(payload.steps[2], "other")
    assert c3 is not None and c3.change == "unchanged"
    assert o3 is not None and o3.change == "created"

    # Step 4: counter deleted
    assert _get_global(payload.steps[3], "counter") is None
    assert len(payload.steps[3].deleted_variables) == 1
    deleted = payload.steps[3].deleted_variables[0]
    assert deleted.name == "counter"
    assert deleted.previous_repr == "15"


def test_list_and_dict_mutations_preserve_historical_snapshots():
    code = (
        "items = [10, 20]\n"
        "items.append(30)\n"
        "counts = {'a': 1}\n"
        "counts['b'] = 2\n"
        "counts['a'] = 9\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    # Backward navigation check: Step 1 MUST still show [10, 20], NOT [10, 20, 30]
    step1_items = _get_global(payload.steps[0], "items")
    step2_items = _get_global(payload.steps[1], "items")
    assert step1_items is not None and step1_items.repr_value == "[10, 20]"
    assert len(step1_items.structured.items or []) == 2

    assert step2_items is not None and step2_items.repr_value == "[10, 20, 30]"
    assert step2_items.change == "modified"
    assert step2_items.previous_repr == "[10, 20]"

    # Dict mutation check across Steps 3, 4, 5
    c_step3 = _get_global(payload.steps[2], "counts")
    c_step4 = _get_global(payload.steps[3], "counts")
    c_step5 = _get_global(payload.steps[4], "counts")
    assert c_step3 is not None and c_step3.repr_value == "{'a': 1}"
    assert c_step4 is not None and c_step4.repr_value == "{'a': 1, 'b': 2}"
    assert c_step5 is not None and c_step5.repr_value == "{'a': 9, 'b': 2}"
    assert c_step5.change == "modified"


def test_object_identity_aliasing_and_circular_references():
    code = (
        "primary = [1, 2]\n"
        "alias = primary\n"
        "alias.append(3)\n"
        "cycle = []\n"
        "cycle.append(cycle)\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    # At step 3, both primary and alias share the exact same object_id and updated list
    step3 = payload.steps[2]
    prim = _get_global(step3, "primary")
    ali = _get_global(step3, "alias")
    assert prim is not None and ali is not None
    assert prim.structured.object_id is not None
    assert prim.structured.object_id == ali.structured.object_id
    assert prim.repr_value == "[1, 2, 3]"
    assert ali.repr_value == "[1, 2, 3]"

    # At final step, circular list serializes cleanly without RecursionError
    cyc = _get_global(payload.steps[-1], "cycle")
    assert cyc is not None
    assert cyc.structured.items is not None
    assert cyc.structured.items[0].circular is True


def test_nested_structures_sets_tuples_and_custom_objects():
    code = (
        "class Node:\n"
        "    def __init__(self, val, nxt=None):\n"
        "        self.val = val\n"
        "        self.nxt = nxt\n"
        "\n"
        "head = Node(1, Node(2))\n"
        "graph = {'A': ['B', 'C'], 'B': ['D']}\n"
        "visited = {'A', 'B'}\n"
        "coords = (4, 7)\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    final_step = payload.steps[-1]
    head_var = _get_global(final_step, "head")
    graph_var = _get_global(final_step, "graph")
    visited_var = _get_global(final_step, "visited")
    coords_var = _get_global(final_step, "coords")

    assert head_var is not None and head_var.var_type == "Node"
    assert head_var.structured.attributes is not None
    assert head_var.structured.attributes[0].key == "val"
    assert head_var.structured.attributes[0].value.display == "1"

    assert graph_var is not None and graph_var.structured.kind == "mapping"
    assert visited_var is not None and visited_var.structured.kind == "set"
    assert coords_var is not None and coords_var.var_type == "tuple"


def test_deep_linked_list_and_slots_object_serialization():
    code = (
        "class SlotNode:\n"
        "    __slots__ = ('val', 'next')\n"
        "    def __init__(self, val):\n"
        "        self.val = val\n"
        "        self.next = None\n"
        "\n"
        "head = SlotNode(0)\n"
        "curr = head\n"
        "for i in range(1, 10):\n"
        "    curr.next = SlotNode(i)\n"
        "    curr = curr.next\n"
    )
    payload = PythonExecutionTracer().execute(code)
    assert payload.status == "completed"

    final_step = payload.steps[-1]
    head_var = _get_global(final_step, "head")
    assert head_var is not None
    assert head_var.var_type == "SlotNode"
    assert head_var.structured.object_id is not None

    # Walk serialized chain at least 8 levels deep (previously truncated at max_depth=5)
    cursor = head_var.structured
    values = []
    while cursor is not None and cursor.attributes:
        attr_map = {a.key: a.value for a in cursor.attributes}
        if "val" in attr_map:
            values.append(attr_map["val"].display)
        nxt = attr_map.get("next")
        cursor = nxt if nxt and nxt.kind == "object" and not nxt.truncated else None

    assert len(values) == 10
    assert values == [str(i) for i in range(10)]


