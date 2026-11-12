import type {
  StructuredValueNode,
  TraceStep,
  VariableSnapshotItem,
} from "@/types/api";
import type {
  ArrayPointerMarker,
  DetectedStructureDescriptor,
  VisualizationStructureKind,
} from "@/types/visualizer";

const VALUE_ATTR_KEYS = new Set(["val", "value", "data", "key", "item"]);
const LINKED_LIST_NEXT_KEYS = new Set(["next", "next_node", "nxt"]);
const LINKED_LIST_PREV_KEYS = new Set(["prev", "previous", "prev_node"]);
const TREE_CHILD_KEYS = new Set(["left", "right", "children"]);

const CANONICAL_POINTER_ROLES: Record<
  string,
  "left" | "right" | "mid" | "iterator" | "boundary"
> = {
  left: "left",
  low: "left",
  lo: "left",
  start: "left",
  l: "left",
  slow: "left",
  write_idx: "left",
  best_start: "left",
  right: "right",
  high: "right",
  hi: "right",
  end: "right",
  r: "right",
  fast: "right",
  read_idx: "right",
  mid: "mid",
  middle: "mid",
  pivot: "mid",
  pivot_idx: "mid",
  min_idx: "mid",
  max_idx: "mid",
  i: "iterator",
  j: "iterator",
  idx: "iterator",
  index: "iterator",
  pos: "iterator",
  curr_idx: "iterator",
  k: "boundary",
};

const NON_POINTER_VALUE_NAMES = new Set([
  "target",
  "val",
  "value",
  "num",
  "number",
  "price",
  "score",
  "bonus",
  "total",
  "running_total",
  "sum",
  "current_sum",
  "window_sum",
  "best_sum",
  "best",
  "max_val",
  "min_val",
  "count",
  "result",
  "ans",
  "answer",
  "candidate",
  "guess",
  "leaving",
  "entering",
  "temperature",
  "n",
  "length",
  "size",
  "capacity",
  "found_at",
  "position",
]);

export function getAttrMap(
  node: StructuredValueNode | null | undefined
): Map<string, StructuredValueNode> {
  const map = new Map<string, StructuredValueNode>();
  if (!node || !node.attributes) return map;
  for (const entry of node.attributes) {
    map.set(entry.key, entry.value);
  }
  return map;
}

export function extractNodeValueDisplay(
  node: StructuredValueNode
): { key: string; valueNode: StructuredValueNode } | null {
  if (!node.attributes) return null;
  for (const attr of node.attributes) {
    if (VALUE_ATTR_KEYS.has(attr.key)) {
      return { key: attr.key, valueNode: attr.value };
    }
  }
  return null;
}

export function isNullOrNodeOrCircular(
  child: StructuredValueNode | undefined,
  validator: (n: StructuredValueNode, depth: number) => boolean,
  depth: number
): boolean {
  if (!child) return true;
  if (child.kind === "primitive" && child.type_name === "NoneType") return true;
  if (child.kind === "circular_ref") return true;
  if (child.kind === "object" && child.truncated) return true;
  if (child.kind === "object") {
    return depth >= 3 ? true : validator(child, depth + 1);
  }
  return false;
}

export function isTreeNodeObject(
  node: StructuredValueNode,
  depth = 0
): boolean {
  if (node.kind !== "object" || !node.attributes || node.attributes.length === 0) {
    return false;
  }
  const attrs = getAttrMap(node);
  const hasVal = Array.from(attrs.keys()).some((k) => VALUE_ATTR_KEYS.has(k));
  const hasLeftOrRight = attrs.has("left") || attrs.has("right");
  const hasLinkedListNext = Array.from(attrs.keys()).some((k) =>
    LINKED_LIST_NEXT_KEYS.has(k)
  );

  if (!hasVal || !hasLeftOrRight || hasLinkedListNext) {
    return false;
  }

  const leftChild = attrs.get("left");
  const rightChild = attrs.get("right");
  return (
    isNullOrNodeOrCircular(leftChild, isTreeNodeObject, depth) &&
    isNullOrNodeOrCircular(rightChild, isTreeNodeObject, depth)
  );
}

export function isLinkedListNodeObject(
  node: StructuredValueNode,
  depth = 0
): boolean {
  if (node.kind !== "object" || !node.attributes || node.attributes.length === 0) {
    return false;
  }
  const attrs = getAttrMap(node);
  const hasVal = Array.from(attrs.keys()).some((k) => VALUE_ATTR_KEYS.has(k));
  const nextKey = Array.from(attrs.keys()).find((k) =>
    LINKED_LIST_NEXT_KEYS.has(k)
  );
  const hasTreeChildren = Array.from(attrs.keys()).some((k) =>
    TREE_CHILD_KEYS.has(k)
  );

  if (!hasVal || !nextKey || hasTreeChildren) {
    return false;
  }

  const nextChild = attrs.get(nextKey);
  if (!isNullOrNodeOrCircular(nextChild, isLinkedListNodeObject, depth)) {
    return false;
  }

  const prevKey = Array.from(attrs.keys()).find((k) =>
    LINKED_LIST_PREV_KEYS.has(k)
  );
  if (prevKey) {
    const prevChild = attrs.get(prevKey);
    if (!isNullOrNodeOrCircular(prevChild, isLinkedListNodeObject, depth)) {
      return false;
    }
  }

  return true;
}

export function isGraphAdjacencyMapping(
  varName: string,
  node: StructuredValueNode,
  sourceCode: string
): boolean {
  if (node.kind !== "mapping") return false;
  const entries = node.entries ?? [];
  const lowerName = varName.toLowerCase();
  const hasGraphName =
    lowerName === "graph" ||
    lowerName === "adj" ||
    lowerName === "adj_list" ||
    lowerName === "adjacency" ||
    lowerName === "network" ||
    lowerName === "edges" ||
    lowerName.endsWith("_graph") ||
    lowerName.startsWith("graph_");

  if (entries.length === 0) {
    return hasGraphName;
  }

  // Validate that every entry value is a sequence/set of neighbor keys or (neighbor, weight) pairs or mapping of weights
  let validLists = 0;
  for (const entry of entries) {
    const val = entry.value;
    if (val.kind === "sequence" || val.kind === "set") {
      const items = val.items ?? [];
      const allValidNeighbors = items.every(
        (it) =>
          (it.kind === "primitive" &&
            (it.type_name === "str" || it.type_name === "int")) ||
          (it.kind === "sequence" &&
            (it.items?.length === 2 || it.items?.length === 3))
      );
      if (allValidNeighbors) validLists++;
    } else if (val.kind === "mapping" && hasGraphName) {
      validLists++;
    }
  }

  if (validLists !== entries.length) return false;

  if (hasGraphName) return true;

  // If unnamed dict of lists, verify keys overlap with neighbor targets or BFS/DFS patterns exist in code
  const keySet = new Set(entries.map((e) => e.key));
  let neighborMatchesKey = 0;
  for (const entry of entries) {
    for (const item of entry.value.items ?? []) {
      if (keySet.has(item.display)) {
        neighborMatchesKey++;
      } else if (
        item.kind === "sequence" &&
        item.items?.[0] &&
        keySet.has(item.items[0].display)
      ) {
        neighborMatchesKey++;
      }
    }
  }

  if (neighborMatchesKey > 0 && entries.length >= 2) return true;
  if (/\b(bfs|dfs|visited|neighbor|neighbours|vertex|vertices)\b/i.test(sourceCode)) {
    return hasGraphName;
  }

  return false;
}

export function isHeapVariable(
  varName: string,
  node: StructuredValueNode,
  sourceCode: string
): boolean {
  if (node.kind !== "sequence" || node.type_name !== "list") return false;
  const lower = varName.toLowerCase();
  const hasHeapName =
    lower === "heap" ||
    lower === "min_heap" ||
    lower === "max_heap" ||
    lower === "pq" ||
    lower === "priority_queue" ||
    lower.endsWith("_heap");

  const escaped = escapeRegExp(varName);
  const usesHeapqOnVar = new RegExp(
    `\\b(heappush|heappop|heapify|heapreplace|heappushpop)\\s*\\(\\s*${escaped}\\b`,
    "m"
  ).test(sourceCode);

  if (usesHeapqOnVar) return true;
  if (hasHeapName && /\bheapq\b|sift|parent|heap/i.test(sourceCode)) return true;
  return hasHeapName;
}

export function isQueueVariable(
  varName: string,
  node: StructuredValueNode,
  sourceCode: string
): boolean {
  if (node.kind !== "sequence") return false;
  if (node.type_name === "deque") return true;
  if (node.type_name !== "list") return false;

  const lower = varName.toLowerCase();
  const escaped = escapeRegExp(varName);
  const usesPopZero = new RegExp(`\\b${escaped}\\.pop\\(\\s*0\\s*\\)`).test(
    sourceCode
  );
  const hasQueueName =
    lower === "queue" ||
    lower === "q" ||
    lower === "bfs_queue" ||
    lower === "frontier" ||
    lower.endsWith("_queue");

  if (usesPopZero) return true;
  if (hasQueueName) return true;
  return false;
}

export function isStackVariable(
  varName: string,
  node: StructuredValueNode,
  sourceCode: string
): boolean {
  if (node.kind !== "sequence" || node.type_name !== "list") return false;
  if (isHeapVariable(varName, node, sourceCode)) return false;
  if (isQueueVariable(varName, node, sourceCode)) return false;

  const lower = varName.toLowerCase();
  const hasStackName =
    lower === "stack" ||
    lower === "st" ||
    lower === "call_stack" ||
    lower === "dfs_stack" ||
    lower === "mono_stack" ||
    lower === "history_stack" ||
    lower.endsWith("_stack");

  if (hasStackName) return true;

  // Check if list is explicitly operated on with LIFO .append(...) AND .pop() (zero arguments)
  const escaped = escapeRegExp(varName);
  const hasAppend = new RegExp(`\\b${escaped}\\.append\\(`).test(sourceCode);
  const hasLifoPop = new RegExp(`\\b${escaped}\\.pop\\(\\s*\\)`).test(
    sourceCode
  );
  const hasIndexMutation = new RegExp(
    `\\b${escaped}\\[[^\\]]+\\]\\s*=`
  ).test(sourceCode);

  return hasAppend && hasLifoPop && !hasIndexMutation;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getMergedStepVariables(step: TraceStep): VariableSnapshotItem[] {
  // Prioritize local variables when inside a function, followed by global variables not shadowed
  const seen = new Set<string>();
  const merged: VariableSnapshotItem[] = [];
  for (const v of step.locals) {
    seen.add(v.name);
    merged.push(v);
  }
  for (const v of step.globals) {
    if (!seen.has(v.name)) {
      seen.add(v.name);
      merged.push(v);
    }
  }
  return merged;
}

/**
 * Context-aware pointer detection (Part 3).
 * Never blindly assumes every variable named left/right/i/j/k is an index pointer;
 * checks both numeric index validity and source code / execution context.
 */
export function detectArrayPointers(
  arrayVarName: string,
  arrayLength: number,
  variables: VariableSnapshotItem[],
  sourceCode: string,
  previousVariables?: VariableSnapshotItem[]
): ArrayPointerMarker[] {
  if (arrayLength <= 0) return [];

  const prevMap = new Map<string, number>();
  if (previousVariables) {
    for (const pv of previousVariables) {
      if (pv.var_type === "int") {
        const parsed = Number.parseInt(pv.repr_value, 10);
        if (!Number.isNaN(parsed)) {
          prevMap.set(pv.name, parsed);
        }
      }
    }
  }

  // Count how many sequence variables exist in current scope
  const sequenceVars = variables.filter(
    (v) => v.structured.kind === "sequence" && v.structured.type_name !== "range"
  );
  const multipleArrays = sequenceVars.length > 1;
  const escapedArr = escapeRegExp(arrayVarName);

  const pointers: ArrayPointerMarker[] = [];

  for (const v of variables) {
    if (v.var_type !== "int") continue;
    if (NON_POINTER_VALUE_NAMES.has(v.name.toLowerCase())) continue;

    const intVal = Number.parseInt(v.repr_value, 10);
    if (Number.isNaN(intVal)) continue;

    const lowerName = v.name.toLowerCase();
    const role = CANONICAL_POINTER_ROLES[lowerName];
    const escapedVar = escapeRegExp(v.name);

    // Check if variable is explicitly used to index THIS array: e.g. arr[i], arr[left:right], arr[right - k]
    const indexesThisArray = new RegExp(
      `\\b${escapedArr}\\[[^\\]]*\\b${escapedVar}\\b[^\\]]*\\]`
    ).test(sourceCode);

    // Check if variable is used to index a DIFFERENT array in scope
    const indexesOtherArray =
      multipleArrays &&
      sequenceVars.some(
        (other) =>
          other.name !== arrayVarName &&
          new RegExp(
            `\\b${escapeRegExp(other.name)}\\[[^\\]]*\\b${escapedVar}\\b[^\\]]*\\]`
          ).test(sourceCode)
      );

    // Check if variable is compared against an array element value (e.g. nums[mid] == k or item == k) -> value, not index!
    const comparedAsElementValue = new RegExp(
      `(\\b${escapedArr}\\[[^\\]]+\\]\\s*(==|!=|<|>|<=|>=)\\s*\\b${escapedVar}\\b)|(\\b${escapedVar}\\b\\s*(==|!=|<|>|<=|>=)\\s*\\b${escapedArr}\\[[^\\]]+\\])`
    ).test(sourceCode);

    if (comparedAsElementValue && !indexesThisArray) {
      continue;
    }

    // Special handling for 'k' (often a window size like k = 3 in sliding window rather than an index pointer)
    if (lowerName === "k") {
      const usedAsSliceOrWindowSize = new RegExp(
        `(\\b${escapedArr}\\[:\\s*k\\s*\\])|(\\b(right|i|end)\\s*-\\s*k\\b)|(\\brange\\(\\s*k\\s*,)`
      ).test(sourceCode);
      if (usedAsSliceOrWindowSize) continue;
      if (!indexesThisArray) continue;
    }

    // If neither a canonical pointer name nor explicitly indexing this array, skip
    if (!role && !indexesThisArray) continue;

    // If there are multiple arrays and this pointer only indexes a different array, skip
    if (multipleArrays && indexesOtherArray && !indexesThisArray) {
      continue;
    }

    // Bounds check: must be within 0..arrayLength-1 (or -1 / arrayLength only for boundary pointers explicitly indexing/comparing len)
    const inStrictBounds = intVal >= 0 && intVal < arrayLength;
    const isBoundaryIndex =
      (intVal === -1 || intVal === arrayLength) &&
      (indexesThisArray || role === "left" || role === "right");

    if (!inStrictBounds && !isBoundaryIndex) {
      continue;
    }

    pointers.push({
      name: v.name,
      index: intVal,
      role: role ?? "iterator",
      previousIndex: prevMap.has(v.name) ? prevMap.get(v.name)! : null,
    });
  }

  return pointers;
}

/**
 * Collects all object_ids reachable inside a Tree or Linked List node so we can
 * group pointer variables (head, curr, prev, root, node) into the same visual canvas.
 */
export function collectReachableObjectIds(
  node: StructuredValueNode,
  out = new Set<string>()
): Set<string> {
  if (node.object_id) {
    out.add(node.object_id);
  }
  for (const attr of node.attributes ?? []) {
    if (
      attr.value.kind === "object" ||
      attr.value.kind === "circular_ref"
    ) {
      if (attr.value.object_id && !out.has(attr.value.object_id)) {
        collectReachableObjectIds(attr.value, out);
      } else if (attr.value.object_id) {
        out.add(attr.value.object_id);
      }
    }
  }
  return out;
}

function classifySingleVariable(
  v: VariableSnapshotItem,
  sourceCode: string
): VisualizationStructureKind | null {
  const s = v.structured;

  if (s.kind === "primitive" || s.kind === "function") {
    return null;
  }

  if (s.kind === "object") {
    if (isTreeNodeObject(s)) return "tree";
    if (isLinkedListNodeObject(s)) return "linked-list";
    return "unsupported";
  }

  if (s.kind === "mapping") {
    if (isGraphAdjacencyMapping(v.name, s, sourceCode)) {
      return "graph";
    }
    return "hash-map";
  }

  if (s.kind === "sequence") {
    if (s.type_name === "range") return null;
    if (isHeapVariable(v.name, s, sourceCode)) return "heap";
    if (isQueueVariable(v.name, s, sourceCode)) return "queue";
    if (isStackVariable(v.name, s, sourceCode)) return "stack";
    return "array";
  }

  if (s.kind === "set") {
    // Sets that aren't helper visited sets can be shown as array/collection or skipped if graph exists
    return null;
  }

  return null;
}

const STRUCTURE_PRIORITY: Record<VisualizationStructureKind, number> = {
  graph: 100,
  tree: 95,
  "linked-list": 90,
  heap: 85,
  stack: 80,
  queue: 78,
  "hash-map": 70,
  array: 65,
  "recursion-memory": 55,
  unsupported: 20,
};

export function detectStructuresInSnapshot(
  step: TraceStep,
  sourceCode: string,
  allSteps?: TraceStep[]
): DetectedStructureDescriptor[] {
  const variables = getMergedStepVariables(step);
  const descriptors: DetectedStructureDescriptor[] = [];

  // 1. Group Linked List variables into unified Linked List structure(s)
  const linkedListVars = variables.filter((v) =>
    isLinkedListNodeObject(v.structured)
  );
  if (linkedListVars.length > 0) {
    // Prefer canonical head variable ('head', 'root', 'first', 'l1', 'list1') or the one with the largest reachable chain
    const ranked = [...linkedListVars].sort((a, b) => {
      const aIsHead = /^(head|first|start|l1|list1|node1)$/i.test(a.name) ? 1 : 0;
      const bIsHead = /^(head|first|start|l1|list1|node1)$/i.test(b.name) ? 1 : 0;
      if (aIsHead !== bIsHead) return bIsHead - aIsHead;
      return (
        collectReachableObjectIds(b.structured).size -
        collectReachableObjectIds(a.structured).size
      );
    });
    const primary = ranked[0];
    descriptors.push({
      id: `linked-list:${primary.name}`,
      variableName: primary.name,
      scope: primary.scope,
      kind: "linked-list",
      title: `Linked List (${primary.name})`,
      subtitle: `${linkedListVars.map((v) => v.name).join(", ")}`,
      objectId: primary.structured.object_id,
      priority: STRUCTURE_PRIORITY["linked-list"],
    });
  }

  // 2. Group Tree variables into unified Binary Tree / BST structure
  const treeVars = variables.filter((v) => isTreeNodeObject(v.structured));
  if (treeVars.length > 0) {
    const ranked = [...treeVars].sort((a, b) => {
      const aIsRoot = /^(root|tree|bst)$/i.test(a.name) ? 1 : 0;
      const bIsRoot = /^(root|tree|bst)$/i.test(b.name) ? 1 : 0;
      if (aIsRoot !== bIsRoot) return bIsRoot - aIsRoot;
      return (
        collectReachableObjectIds(b.structured).size -
        collectReachableObjectIds(a.structured).size
      );
    });
    const primary = ranked[0];
    descriptors.push({
      id: `tree:${primary.name}`,
      variableName: primary.name,
      scope: primary.scope,
      kind: "tree",
      title: `Binary Tree (${primary.name})`,
      subtitle: `${treeVars.map((v) => v.name).join(", ")}`,
      objectId: primary.structured.object_id,
      priority: STRUCTURE_PRIORITY.tree,
    });
  }

  // 3. Classify remaining variables (Graphs, Heaps, Stacks, Queues, Hash Maps, Arrays, Unsupported)
  for (const v of variables) {
    if (isLinkedListNodeObject(v.structured) || isTreeNodeObject(v.structured)) {
      continue;
    }

    const kind = classifySingleVariable(v, sourceCode);
    if (!kind) continue;

    // Lower priority of auxiliary traversal output lists (like bfs_order, dfs_order, inorder) when a Graph or Tree is already present
    const isAuxTraversalList =
      kind === "array" &&
      /^(bfs_order|dfs_order|inorder|preorder|postorder|level_order|order|visited_order|result_order)$/i.test(
        v.name
      ) &&
      (descriptors.some((d) => d.kind === "graph" || d.kind === "tree") ||
        variables.some((other) =>
          isGraphAdjacencyMapping(other.name, other.structured, sourceCode)
        ));

    const labelMap: Record<VisualizationStructureKind, string> = {
      array: `Array · ${v.name}`,
      stack: `Stack · ${v.name}`,
      queue: `Queue · ${v.name}`,
      "linked-list": `Linked List · ${v.name}`,
      tree: `Tree · ${v.name}`,
      graph: `Graph · ${v.name}`,
      heap: `Heap · ${v.name}`,
      "hash-map": `Hash Map · ${v.name}`,
      "recursion-memory": "Recursion & Memory",
      unsupported: `Object · ${v.name}`,
    };

    descriptors.push({
      id: `${kind}:${v.name}`,
      variableName: v.name,
      scope: v.scope,
      kind,
      title: labelMap[kind],
      subtitle: `${v.var_type}${
        typeof v.structured.length === "number"
          ? ` (${v.structured.length})`
          : ""
      }`,
      objectId: v.structured.object_id,
      priority: isAuxTraversalList ? 35 : STRUCTURE_PRIORITY[kind],
    });
  }

  // 4. Add Recursion & Memory descriptor when function frames or heap references exist
  const hasMultipleFramesEver =
    step.call_stack.length > 1 ||
    (allSteps?.some((st) => st.call_stack.length > 1) ?? false);
  const hasHeapObjects = variables.some((v) => Boolean(v.structured.object_id));

  if (hasMultipleFramesEver || hasHeapObjects) {
    // Boost priority to top when inside a recursive call and no other primary data structure container exists
    const isPureRecursion =
      hasMultipleFramesEver &&
      descriptors.every((d) => d.kind === "unsupported");
    descriptors.push({
      id: "recursion-memory:call_stack",
      variableName: step.function_name,
      scope: "runtime",
      kind: "recursion-memory",
      title: "Recursion & Memory",
      subtitle: `Depth ${step.call_depth} · ${step.call_stack.length} frame${
        step.call_stack.length === 1 ? "" : "s"
      }`,
      priority: isPureRecursion ? 110 : STRUCTURE_PRIORITY["recursion-memory"],
    });
  }

  return descriptors.sort((a, b) => b.priority - a.priority);
}
