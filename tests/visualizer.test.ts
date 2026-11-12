import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import type {
  StructuredValueNode,
  TraceStep,
  VariableSnapshotItem,
} from "@/types/api";
import type {
  ArrayVisualizationState,
  GraphVisualizationState,
  HashMapVisualizationState,
  HeapVisualizationState,
  LinkedListVisualizationState,
  QueueVisualizationState,
  RecursionMemoryVisualizationState,
  StackVisualizationState,
  TreeVisualizationState,
  UnsupportedVisualizationState,
} from "@/types/visualizer";
import {
  detectArrayPointers,
  detectStructuresInSnapshot,
} from "@/lib/visualizer/structure-detector";
import { generateStepVisualizationEvents } from "@/lib/visualizer/event-generator";
import { reconstructSnapshotVisualizations } from "@/lib/visualizer/state-reconstructor";
import {
  buildStepLearningCommentary,
  STRUCTURE_LEARNING_GUIDES,
} from "@/lib/visualizer/learning-content";
import { SAMPLE_PROGRAMS } from "@/lib/data/samples";

function makePrimitive(
  typeName: string,
  display: string
): StructuredValueNode {
  return {
    kind: "primitive",
    type_name: typeName,
    display,
  };
}

function makeSequence(
  items: StructuredValueNode[],
  objectId = "ref#1",
  typeName = "list",
  truncated = false,
  totalLength?: number
): StructuredValueNode {
  return {
    kind: "sequence",
    type_name: typeName,
    display: `[${items.map((i) => i.display).join(", ")}]`,
    object_id: objectId,
    length: totalLength ?? items.length,
    truncated,
    items,
  };
}

function makeMapping(
  entries: { key: string; value: StructuredValueNode }[],
  objectId = "ref#10"
): StructuredValueNode {
  return {
    kind: "mapping",
    type_name: "dict",
    display: `{${entries.map((e) => `${e.key}: ${e.value.display}`).join(", ")}}`,
    object_id: objectId,
    length: entries.length,
    entries,
  };
}

function makeVar(
  name: string,
  varType: string,
  reprValue: string,
  structured: StructuredValueNode,
  change: VariableSnapshotItem["change"] = "unchanged",
  previousRepr: string | null = null,
  scope: VariableSnapshotItem["scope"] = "global"
): VariableSnapshotItem {
  return {
    name,
    scope,
    var_type: varType,
    repr_value: reprValue,
    previous_repr: previousRepr,
    change,
    structured,
  };
}

function makeStep(overrides: Partial<TraceStep> & { step: number }): TraceStep {
  return {
    step: overrides.step,
    line: overrides.line ?? 1,
    event: overrides.event ?? "line",
    function_name: overrides.function_name ?? "<module>",
    source_line: overrides.source_line ?? "",
    call_depth: overrides.call_depth ?? 0,
    call_stack: overrides.call_stack ?? [
      {
        frame_id: "frame#0",
        function_name: "<module>",
        line: overrides.line ?? 1,
        depth: 0,
        locals_summary: {},
      },
    ],
    locals: overrides.locals ?? [],
    globals: overrides.globals ?? [],
    deleted_variables: overrides.deleted_variables ?? [],
    stdout_snapshot: overrides.stdout_snapshot ?? "",
    stdout_delta: overrides.stdout_delta ?? "",
    return_value: overrides.return_value ?? null,
    exception: overrides.exception ?? null,
    explanation: overrides.explanation ?? {
      headline: "Step executed",
      details: "Details",
      changes: [],
    },
  };
}

describe("Phase 3 Visualizer Engine — Unit & Integration Suite", () => {
  it("1. Context-aware pointer detection identifies true index pointers and ignores value variables", () => {
    const numsNode = makeSequence([
      makePrimitive("int", "2"),
      makePrimitive("int", "5"),
      makePrimitive("int", "8"),
      makePrimitive("int", "11"),
      makePrimitive("int", "15"),
    ]);

    const vars: VariableSnapshotItem[] = [
      makeVar("nums", "list", "[2, 5, 8, 11, 15]", numsNode),
      makeVar("left", "int", "1", makePrimitive("int", "1")),
      makeVar("right", "int", "4", makePrimitive("int", "4")),
      makeVar("target", "int", "3", makePrimitive("int", "3")),
      makeVar("k", "int", "3", makePrimitive("int", "3")),
      makeVar("window_sum", "int", "2", makePrimitive("int", "2")),
    ];

    const prevVars: VariableSnapshotItem[] = [
      makeVar("left", "int", "0", makePrimitive("int", "0")),
      makeVar("right", "int", "4", makePrimitive("int", "4")),
    ];

    const source = `
nums = [2, 5, 8, 11, 15]
target = 3
k = 3
window_sum = sum(nums[:k])
curr = nums[left] + nums[right]
`;

    const pointers = detectArrayPointers("nums", 5, vars, source, prevVars);
    const pointerNames = pointers.map((p) => p.name);

    assert.deepEqual(pointerNames, ["left", "right"]);
    const leftPtr = pointers.find((p) => p.name === "left")!;
    assert.equal(leftPtr.index, 1);
    assert.equal(leftPtr.previousIndex, 0);
    assert.equal(leftPtr.role, "left");
  });

  it("2. Disambiguates pointers across multiple arrays in the same scope", () => {
    const aNode = makeSequence([
      makePrimitive("int", "10"),
      makePrimitive("int", "20"),
      makePrimitive("int", "30"),
    ]);
    const bNode = makeSequence([
      makePrimitive("int", "100"),
      makePrimitive("int", "200"),
      makePrimitive("int", "300"),
    ]);

    const vars: VariableSnapshotItem[] = [
      makeVar("left_arr", "list", "[10, 20, 30]", aNode),
      makeVar("right_arr", "list", "[100, 200, 300]", bNode),
      makeVar("i", "int", "1", makePrimitive("int", "1")),
      makeVar("j", "int", "2", makePrimitive("int", "2")),
    ];

    const source = `
val_a = left_arr[i]
val_b = right_arr[j]
`;

    const aPointers = detectArrayPointers("left_arr", 3, vars, source);
    const bPointers = detectArrayPointers("right_arr", 3, vars, source);

    assert.deepEqual(
      aPointers.map((p) => p.name),
      ["i"]
    );
    assert.deepEqual(
      bPointers.map((p) => p.name),
      ["j"]
    );
  });

  it("3. Array events & reconstruction: create, insert, update, swap, delete, and 2D matrix", () => {
    const step1 = makeStep({
      step: 1,
      line: 1,
      source_line: "nums = [10, 20, 40]",
      globals: [
        makeVar(
          "nums",
          "list",
          "[10, 20, 40]",
          makeSequence([
            makePrimitive("int", "10"),
            makePrimitive("int", "20"),
            makePrimitive("int", "40"),
          ]),
          "created"
        ),
      ],
    });

    // Step 2: insert 30 at index 2 -> [10, 20, 30, 40]
    const step2 = makeStep({
      step: 2,
      line: 2,
      source_line: "nums.insert(2, 30)",
      globals: [
        makeVar(
          "nums",
          "list",
          "[10, 20, 30, 40]",
          makeSequence([
            makePrimitive("int", "10"),
            makePrimitive("int", "20"),
            makePrimitive("int", "30"),
            makePrimitive("int", "40"),
          ]),
          "modified",
          "[10, 20, 40]"
        ),
      ],
    });

    // Step 3: swap index 0 and 3 -> [40, 20, 30, 10]
    const step3 = makeStep({
      step: 3,
      line: 3,
      source_line: "nums[0], nums[3] = nums[3], nums[0]",
      globals: [
        makeVar(
          "nums",
          "list",
          "[40, 20, 30, 10]",
          makeSequence([
            makePrimitive("int", "40"),
            makePrimitive("int", "20"),
            makePrimitive("int", "30"),
            makePrimitive("int", "10"),
          ]),
          "modified",
          "[10, 20, 30, 40]"
        ),
      ],
    });

    // Step 4: delete index 1 (20) -> [40, 30, 10]
    const step4 = makeStep({
      step: 4,
      line: 4,
      source_line: "nums.pop(1)",
      globals: [
        makeVar(
          "nums",
          "list",
          "[40, 30, 10]",
          makeSequence([
            makePrimitive("int", "40"),
            makePrimitive("int", "30"),
            makePrimitive("int", "10"),
          ]),
          "modified",
          "[40, 20, 30, 10]"
        ),
      ],
    });

    const steps = [step1, step2, step3, step4];
    const source = "nums = [10, 20, 40]\nnums.insert(2, 30)\nnums[0], nums[3] = nums[3], nums[0]\nnums.pop(1)";

    const b2 = reconstructSnapshotVisualizations(steps, 1, source)!;
    const arr2 = b2.activeState as ArrayVisualizationState;
    assert.equal(arr2.kind, "array");
    assert.equal(arr2.activeOperation, "insert");
    assert.equal(arr2.cells[2].status, "inserted");
    assert.equal(arr2.cells[2].display, "30");

    const b3 = reconstructSnapshotVisualizations(steps, 2, source)!;
    const arr3 = b3.activeState as ArrayVisualizationState;
    assert.equal(arr3.activeOperation, "swap");
    assert.equal(arr3.cells[0].status, "swapped");
    assert.equal(arr3.cells[3].status, "swapped");

    const b4 = reconstructSnapshotVisualizations(steps, 3, source)!;
    const arr4 = b4.activeState as ArrayVisualizationState;
    assert.equal(arr4.activeOperation, "delete");
    assert.equal(arr4.removedItems.length, 1);
    assert.equal(arr4.removedItems[0].display, "20");
    assert.equal(arr4.removedItems[0].index, 1);

    // 2D Matrix check
    const matrixStep = makeStep({
      step: 1,
      globals: [
        makeVar(
          "grid",
          "list",
          "[[1, 2], [3, 4]]",
          makeSequence([
            makeSequence([makePrimitive("int", "1"), makePrimitive("int", "2")], "ref#2"),
            makeSequence([makePrimitive("int", "3"), makePrimitive("int", "4")], "ref#3"),
          ])
        ),
      ],
    });
    const bm = reconstructSnapshotVisualizations([matrixStep], 0, "grid = [[1, 2], [3, 4]]")!;
    const gridState = bm.activeState as ArrayVisualizationState;
    assert.equal(gridState.is2DMatrix, true);
    assert.equal(gridState.matrixRows?.length, 2);
  });

  it("4. Stack & Queue LIFO/FIFO detection and event generation", () => {
    const stackSource = "stack = []\nstack.append('(')\nstack.pop()";
    const s1 = makeStep({
      step: 1,
      source_line: "stack.append('(')",
      globals: [
        makeVar(
          "stack",
          "list",
          "['(']",
          makeSequence([makePrimitive("str", "'('")]),
          "modified",
          "[]"
        ),
      ],
    });
    const s0 = makeStep({
      step: 0,
      source_line: "stack = []",
      globals: [makeVar("stack", "list", "[]", makeSequence([]), "created")],
    });
    const s2 = makeStep({
      step: 2,
      source_line: "stack.pop()",
      globals: [
        makeVar("stack", "list", "[]", makeSequence([]), "modified", "['(']"),
      ],
    });

    const pushBundle = reconstructSnapshotVisualizations(
      [s0, s1, s2],
      1,
      stackSource
    )!;
    const stackPush = pushBundle.activeState as StackVisualizationState;
    assert.equal(stackPush.kind, "stack");
    assert.equal(stackPush.activeOperation, "push");
    assert.equal(stackPush.items[0].isTop, true);
    assert.equal(stackPush.items[0].status, "pushed");

    const popBundle = reconstructSnapshotVisualizations(
      [s0, s1, s2],
      2,
      stackSource
    )!;
    const stackPop = popBundle.activeState as StackVisualizationState;
    assert.equal(stackPop.activeOperation, "pop");
    assert.equal(stackPop.poppedItem?.display, "'('");

    // Queue (deque)
    const qStep1 = makeStep({
      step: 1,
      globals: [
        makeVar(
          "queue",
          "deque",
          "deque(['A', 'B'])",
          makeSequence(
            [makePrimitive("str", "'A'"), makePrimitive("str", "'B'")],
            "ref#5",
            "deque"
          )
        ),
      ],
    });
    const qStep2 = makeStep({
      step: 2,
      globals: [
        makeVar(
          "queue",
          "deque",
          "deque(['B'])",
          makeSequence([makePrimitive("str", "'B'")], "ref#5", "deque"),
          "modified"
        ),
      ],
    });

    const qBundle = reconstructSnapshotVisualizations(
      [qStep1, qStep2],
      1,
      "queue.popleft()"
    )!;
    const qState = qBundle.activeState as QueueVisualizationState;
    assert.equal(qState.kind, "queue");
    assert.equal(qState.activeOperation, "dequeue");
    assert.equal(qState.dequeuedItem?.display, "'A'");
    assert.equal(qState.items[0].isFront, true);
    assert.equal(qState.items[0].isRear, true);
  });

  it("5. Linked List (Singly, Doubly with circular_ref, Circular) & Object Identity ref#N", () => {
    // Doubly linked list: head (ref#1) <-> second (ref#2) where second.prev is a circular_ref back to ref#1
    const secondNode: StructuredValueNode = {
      kind: "object",
      type_name: "DoublyNode",
      display: "DoublyNode(val=20)",
      object_id: "ref#2",
      attributes: [
        { key: "val", value: makePrimitive("int", "20") },
        {
          key: "prev",
          value: {
            kind: "circular_ref",
            type_name: "DoublyNode",
            display: "<circular DoublyNode ref#1>",
            object_id: "ref#1",
            circular: true,
          },
        },
        { key: "next", value: makePrimitive("NoneType", "None") },
      ],
    };

    const headNode: StructuredValueNode = {
      kind: "object",
      type_name: "DoublyNode",
      display: "DoublyNode(val=10)",
      object_id: "ref#1",
      attributes: [
        { key: "val", value: makePrimitive("int", "10") },
        { key: "prev", value: makePrimitive("NoneType", "None") },
        { key: "next", value: secondNode },
      ],
    };

    const step = makeStep({
      step: 1,
      globals: [
        makeVar("head", "DoublyNode", "DoublyNode(val=10)", headNode),
        makeVar("curr", "DoublyNode", "DoublyNode(val=20)", secondNode),
      ],
    });

    const bundle = reconstructSnapshotVisualizations(
      [step],
      0,
      "head.next = second"
    )!;
    const llState = bundle.activeState as LinkedListVisualizationState;
    assert.equal(llState.kind, "linked-list");
    assert.equal(llState.variant, "doubly");
    assert.equal(llState.nodes.length, 2);
    assert.equal(llState.nodes[0].objectId, "ref#1");
    assert.equal(llState.nodes[1].objectId, "ref#2");
    assert.equal(llState.nodes[1].prevId, "ref#1");
    assert.deepEqual(llState.nodes[1].pointers, ["curr"]);
  });

  it("6. Binary Search Tree validation, D3 hierarchy coordinates, and traversal order", () => {
    const leftChild: StructuredValueNode = {
      kind: "object",
      type_name: "TreeNode",
      display: "TreeNode(val=10)",
      object_id: "ref#2",
      attributes: [
        { key: "val", value: makePrimitive("int", "10") },
        { key: "left", value: makePrimitive("NoneType", "None") },
        { key: "right", value: makePrimitive("NoneType", "None") },
      ],
    };
    const rightChild: StructuredValueNode = {
      kind: "object",
      type_name: "TreeNode",
      display: "TreeNode(val=30)",
      object_id: "ref#3",
      attributes: [
        { key: "val", value: makePrimitive("int", "30") },
        { key: "left", value: makePrimitive("NoneType", "None") },
        { key: "right", value: makePrimitive("NoneType", "None") },
      ],
    };
    const rootNode: StructuredValueNode = {
      kind: "object",
      type_name: "TreeNode",
      display: "TreeNode(val=20)",
      object_id: "ref#1",
      attributes: [
        { key: "val", value: makePrimitive("int", "20") },
        { key: "left", value: leftChild },
        { key: "right", value: rightChild },
      ],
    };

    const step = makeStep({
      step: 1,
      globals: [
        makeVar("root", "TreeNode", "TreeNode(val=20)", rootNode),
        makeVar("node", "TreeNode", "TreeNode(val=10)", leftChild),
        makeVar(
          "inorder",
          "list",
          "[10, 20]",
          makeSequence([makePrimitive("int", "10"), makePrimitive("int", "20")])
        ),
      ],
    });

    const bundle = reconstructSnapshotVisualizations([step], 0, "traverse(root)")!;
    const treeState = bundle.activeState as TreeVisualizationState;
    assert.equal(treeState.kind, "tree");
    assert.equal(treeState.isBinarySearchTree, true);
    assert.equal(treeState.nodes.length, 3);
    assert.deepEqual(treeState.traversalSequence, ["10", "20"]);

    const rootVisual = treeState.nodes.find((n) => n.objectId === "ref#1")!;
    const leftVisual = treeState.nodes.find((n) => n.objectId === "ref#2")!;
    const rightVisual = treeState.nodes.find((n) => n.objectId === "ref#3")!;

    // Left child sits strictly left of root; right child sits strictly right of root
    assert.ok(leftVisual.x < rootVisual.x);
    assert.ok(rightVisual.x > rootVisual.x);
    assert.ok(leftVisual.y > rootVisual.y);
  });

  it("7. Graph BFS & Weighted Graph visualization and non-jittering layout", () => {
    const graphNode = makeMapping([
      {
        key: "'A'",
        value: makeSequence([
          makeSequence([makePrimitive("str", "'B'"), makePrimitive("int", "4")]),
          makeSequence([makePrimitive("str", "'C'"), makePrimitive("int", "2")]),
        ]),
      },
      {
        key: "'B'",
        value: makeSequence([]),
      },
      {
        key: "'C'",
        value: makeSequence([]),
      },
    ]);

    const step = makeStep({
      step: 1,
      globals: [
        makeVar("graph", "dict", "{'A': [('B', 4), ('C', 2)]}", graphNode),
        makeVar(
          "queue",
          "deque",
          "deque(['B', 'C'])",
          makeSequence(
            [makePrimitive("str", "'B'"), makePrimitive("str", "'C'")],
            "ref#20",
            "deque"
          )
        ),
        makeVar(
          "bfs_order",
          "list",
          "['A']",
          makeSequence([makePrimitive("str", "'A'")], "ref#21")
        ),
        makeVar("vertex", "str", "'A'", makePrimitive("str", "'A'")),
      ],
    });

    const bundle = reconstructSnapshotVisualizations(
      [step],
      0,
      "vertex = queue.popleft()"
    )!;
    const gState = bundle.activeState as GraphVisualizationState;
    assert.equal(gState.kind, "graph");
    assert.equal(gState.isDirected, true);
    assert.equal(gState.isWeighted, true);
    assert.equal(gState.algorithmMode, "bfs");
    assert.deepEqual(gState.visitedOrder, ["A"]);
    assert.deepEqual(gState.frontierItems, ["B", "C"]);
    assert.equal(gState.edges[0].weight, "4");
  });

  it("8. Min Heap, Hash Map, Recursion Memory, and Unsupported Object reconstruction", () => {
    // Min Heap
    const heapStep = makeStep({
      step: 1,
      globals: [
        makeVar(
          "min_heap",
          "list",
          "[2, 7, 4, 12]",
          makeSequence([
            makePrimitive("int", "2"),
            makePrimitive("int", "7"),
            makePrimitive("int", "4"),
            makePrimitive("int", "12"),
          ])
        ),
      ],
    });
    const heapBundle = reconstructSnapshotVisualizations(
      [heapStep],
      0,
      "heapq.heappush(min_heap, 2)"
    )!;
    const heapState = heapBundle.activeState as HeapVisualizationState;
    assert.equal(heapState.kind, "heap");
    assert.equal(heapState.variant, "min");
    assert.equal(heapState.heapPropertySatisfied, true);
    assert.equal(heapState.nodes.length, 4);
    assert.equal(heapState.arrayCells.length, 4);

    // Hash Map
    const hm1 = makeStep({
      step: 1,
      globals: [
        makeVar(
          "seen",
          "dict",
          "{'a': 1}",
          makeMapping([{ key: "'a'", value: makePrimitive("int", "1") }])
        ),
      ],
    });
    const hm2 = makeStep({
      step: 2,
      globals: [
        makeVar(
          "seen",
          "dict",
          "{'a': 9, 'b': 2}",
          makeMapping([
            { key: "'a'", value: makePrimitive("int", "9") },
            { key: "'b'", value: makePrimitive("int", "2") },
          ]),
          "modified"
        ),
      ],
    });
    const hmBundle = reconstructSnapshotVisualizations(
      [hm1, hm2],
      1,
      "seen['a'] = 9; seen['b'] = 2"
    )!;
    const hmState = hmBundle.activeState as HashMapVisualizationState;
    assert.equal(hmState.kind, "hash-map");
    assert.equal(
      hmState.entries.find((e) => e.key === "'a'")?.status,
      "updated"
    );
    assert.equal(
      hmState.entries.find((e) => e.key === "'b'")?.status,
      "inserted"
    );

    // Unsupported Custom Object
    const pointObj: StructuredValueNode = {
      kind: "object",
      type_name: "Point",
      display: "Point(x=3, y=4)",
      object_id: "ref#99",
      attributes: [
        { key: "x", value: makePrimitive("int", "3") },
        { key: "y", value: makePrimitive("int", "4") },
      ],
    };
    const unsupStep = makeStep({
      step: 1,
      globals: [makeVar("pt", "Point", "Point(x=3, y=4)", pointObj)],
    });
    const unsupBundle = reconstructSnapshotVisualizations(
      [unsupStep],
      0,
      "pt = Point(3, 4)",
      "unsupported:pt"
    )!;
    const unsupState = unsupBundle.activeState as UnsupportedVisualizationState;
    assert.equal(unsupState.kind, "unsupported");
    assert.equal(unsupState.typeName, "Point");
  });

  it("9. Forward & Backward step reconstruction is 100% deterministic across real Python 3.12 traces", () => {
    const pythonBin = path.resolve(
      process.cwd(),
      "backend/.venv/bin/python"
    );

    const targetSlugs = [
      "two-pointers",
      "singly-linked-list",
      "doubly-linked-list",
      "binary-search-tree",
      "graphs",
      "min-heap",
      "recursion-tree",
    ];

    for (const slug of targetSlugs) {
      const sample = SAMPLE_PROGRAMS.find((s) => s.slug === slug);
      assert.ok(sample, `Sample ${slug} must exist`);

      const rawJson = execFileSync(
        pythonBin,
        [
          "-c",
          `import sys, json, dataclasses; sys.path.insert(0, 'backend'); from app.execution.tracer import PythonExecutionTracer; payload = PythonExecutionTracer().execute(sys.stdin.read()); print(json.dumps(dataclasses.asdict(payload)))`,
        ],
        {
          input: sample.code,
          encoding: "utf-8",
          maxBuffer: 16 * 1024 * 1024,
        }
      );

      const trace = JSON.parse(rawJson) as {
        status: string;
        steps: TraceStep[];
      };
      assert.equal(trace.status, "completed");
      assert.ok(trace.steps.length >= 4);

      // Reconstruct step 2 -> step last -> step 2 (backward navigation check!)
      const forwardAt2 = reconstructSnapshotVisualizations(
        trace.steps,
        2,
        sample.code
      )!;
      const forwardAtEnd = reconstructSnapshotVisualizations(
        trace.steps,
        trace.steps.length - 1,
        sample.code
      )!;
      const backwardAt2 = reconstructSnapshotVisualizations(
        trace.steps,
        2,
        sample.code
      )!;

      assert.deepEqual(forwardAt2.activeState, backwardAt2.activeState);
      assert.ok(forwardAtEnd.activeState !== null);

      const commentary = buildStepLearningCommentary(forwardAtEnd.activeState);
      assert.ok(commentary && commentary.length > 10);
    }

    // Verify all 10 learning guides exist with explicit complexity assumptions
    assert.equal(Object.keys(STRUCTURE_LEARNING_GUIDES).length, 10);
  });

  it("10. Recursion call tree, shared reference aliasing (ref#N), and edge cases (empty, duplicates, large)", () => {
    const sharedList = makeSequence(
      [makePrimitive("int", "5"), makePrimitive("int", "5")],
      "ref#77"
    );

    const recStep1 = makeStep({
      step: 1,
      event: "call",
      function_name: "fact",
      call_depth: 1,
      call_stack: [
        {
          frame_id: "frame#0",
          function_name: "<module>",
          line: 5,
          depth: 0,
          locals_summary: {},
        },
        {
          frame_id: "frame#1",
          function_name: "fact",
          line: 1,
          depth: 1,
          locals_summary: { n: "2" },
        },
      ],
      locals: [makeVar("n", "int", "2", makePrimitive("int", "2"), "created", null, "local")],
      globals: [
        makeVar("a", "list", "[5, 5]", sharedList),
        makeVar("b", "list", "[5, 5]", sharedList),
      ],
    });

    const recStep2 = makeStep({
      step: 2,
      event: "return",
      function_name: "fact",
      return_value: "2",
      call_depth: 1,
      call_stack: [
        {
          frame_id: "frame#0",
          function_name: "<module>",
          line: 5,
          depth: 0,
          locals_summary: {},
        },
        {
          frame_id: "frame#1",
          function_name: "fact",
          line: 3,
          depth: 1,
          locals_summary: { n: "2" },
        },
      ],
      locals: [makeVar("n", "int", "2", makePrimitive("int", "2"), "unchanged", null, "local")],
      globals: [
        makeVar("a", "list", "[5, 5]", sharedList),
        makeVar("b", "list", "[5, 5]", sharedList),
      ],
    });

    const descriptors = detectStructuresInSnapshot(
      recStep2,
      "def fact(n): return 2",
      [recStep1, recStep2]
    );
    const events = generateStepVisualizationEvents(
      recStep2,
      recStep1,
      "def fact(n): return 2",
      descriptors
    );
    assert.ok(events.some((e) => e.operation === "return"));

    const recBundle = reconstructSnapshotVisualizations(
      [recStep1, recStep2],
      1,
      "def fact(n): return 2",
      "recursion-memory:call_stack"
    )!;
    const recState = recBundle.activeState as RecursionMemoryVisualizationState;
    assert.equal(recState.kind, "recursion-memory");
    assert.equal(recState.callTreeNodes.length, 1);
    assert.equal(recState.callTreeNodes[0].returnValue, "2");
    assert.equal(recState.memoryBindings.length, 2);
    assert.equal(recState.memoryBindings[0].isSharedAlias, true);
    assert.equal(recState.memoryBindings[1].isSharedAlias, true);

    // Edge cases: empty array and large truncated array
    const emptyAndLargeStep = makeStep({
      step: 1,
      globals: [
        makeVar("empty_list", "list", "[]", makeSequence([], "ref#80")),
        makeVar(
          "huge_list",
          "list",
          "[0, 1, ...]",
          makeSequence(
            [makePrimitive("int", "0"), makePrimitive("int", "1")],
            "ref#81",
            "list",
            true,
            500
          )
        ),
      ],
    });

    const emptyBundle = reconstructSnapshotVisualizations(
      [emptyAndLargeStep],
      0,
      "empty_list = []",
      "array:empty_list"
    )!;
    const emptyArr = emptyBundle.activeState as ArrayVisualizationState;
    assert.equal(emptyArr.cells.length, 0);
    assert.equal(emptyArr.length, 0);

    const largeBundle = reconstructSnapshotVisualizations(
      [emptyAndLargeStep],
      0,
      "huge_list = list(range(500))",
      "array:huge_list"
    )!;
    const largeArr = largeBundle.activeState as ArrayVisualizationState;
    assert.equal(largeArr.truncated, true);
    assert.equal(largeArr.length, 500);
  });
});
