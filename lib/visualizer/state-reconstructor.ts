import type {
  TraceStep,
  VariableSnapshotItem,
} from "@/types/api";
import type {
  ArrayCellItem,
  ArrayVisualizationState,
  GraphVisualEdge,
  GraphVisualizationState,
  GraphVisualNode,
  HashMapEntryItem,
  HashMapVisualizationState,
  HeapVisualizationState,
  HeapVisualNode,
  LinkedListVariant,
  LinkedListVisualEdge,
  LinkedListVisualizationState,
  LinkedListVisualNode,
  MemoryReferenceBinding,
  QueueVisualizationItem,
  QueueVisualizationState,
  ReconstructedStructureState,
  RecursionMemoryVisualizationState,
  RecursionTreeNode,
  SnapshotVisualizationBundle,
  StackVisualizationItem,
  StackVisualizationState,
  TreeVisualEdge,
  TreeVisualizationState,
  TreeVisualNode,
  UnsupportedVisualizationState,
  VisualizationEvent,
} from "@/types/visualizer";
import {
  detectArrayPointers,
  detectStructuresInSnapshot,
  getMergedStepVariables,
  isLinkedListNodeObject,
  isTreeNodeObject,
} from "@/lib/visualizer/structure-detector";
import {
  collectObjectNodesFromVariables,
  diffMappingNodes,
  diffObjectGraphNodes,
  diffSequenceNodes,
  findVariableInStep,
} from "@/lib/visualizer/snapshot-diff";
import { generateStepVisualizationEvents } from "@/lib/visualizer/event-generator";
import {
  layoutBinaryTreeNodes,
  layoutGraphNodes,
  layoutHeapNodes,
  layoutLinkedListNodes,
  layoutRecursionTreeNodes,
} from "@/lib/visualizer/layout-engine";

function parseNumberOrNull(display: string): number | null {
  const cleaned = display.trim();
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function unquoteDisplay(display: string): string {
  const trimmed = display.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function reconstructArrayState(
  varItem: VariableSnapshotItem,
  prevVarItem: VariableSnapshotItem | null,
  currentStep: TraceStep,
  prevStep: TraceStep | null,
  sourceCode: string,
  stepEvents: VisualizationEvent[]
): ArrayVisualizationState {
  const node = varItem.structured;
  const items = node.items ?? [];
  const currVars = getMergedStepVariables(currentStep);
  const prevVars = prevStep ? getMergedStepVariables(prevStep) : undefined;

  const seqDiff = diffSequenceNodes(prevVarItem?.structured, node);
  const pointers = detectArrayPointers(
    varItem.name,
    items.length,
    currVars,
    sourceCode,
    prevVars
  );

  const pointersByIndex = new Map<number, typeof pointers>();
  for (const ptr of pointers) {
    const group = pointersByIndex.get(ptr.index) ?? [];
    group.push(ptr);
    pointersByIndex.set(ptr.index, group);
  }

  const insertedSet = new Set(seqDiff.insertedIndices);
  const changedSet = new Set(seqDiff.changedIndices);
  const swappedSet = new Set(seqDiff.swappedPair ?? []);

  const relevantEvents = stepEvents.filter((e) => e.variable === varItem.name);
  const searchIndices = new Set(
    relevantEvents
      .filter((e) => e.operation === "search" && typeof e.index === "number")
      .map((e) => e.index!)
  );

  const cells: ArrayCellItem[] = items.map((child, idx) => {
    const cellPointers = pointersByIndex.get(idx) ?? [];
    let status: ArrayCellItem["status"] = "default";
    if (swappedSet.has(idx)) {
      status = "swapped";
    } else if (insertedSet.has(idx) && seqDiff.operation !== "create") {
      status = "inserted";
    } else if (changedSet.has(idx)) {
      status = "updated";
    } else if (searchIndices.has(idx)) {
      status = "searched";
    } else if (cellPointers.length > 0) {
      status = "active";
    }

    return {
      index: idx,
      display: child.display,
      typeName: child.type_name,
      status,
      previousDisplay: seqDiff.previousByIndex.get(idx) ?? null,
      pointers: cellPointers,
    };
  });

  // Detect 2D Matrix (list of non-empty lists/tuples)
  const is2DMatrix =
    items.length >= 2 &&
    items.every(
      (row) =>
        row.kind === "sequence" &&
        (row.items?.length ?? 0) > 0 &&
        (row.items?.length ?? 0) <= 16
    );

  const matrixRows = is2DMatrix
    ? items.map((row, rIdx) => ({
        rowIndex: rIdx,
        cells: (row.items ?? []).map((cell, cIdx) => ({
          colIndex: cIdx,
          display: cell.display,
          isActive: pointers.some((p) => p.index === rIdx),
        })),
      }))
    : undefined;

  const primaryEvent = relevantEvents[0];

  return {
    kind: "array",
    variableName: varItem.name,
    typeName: varItem.var_type,
    objectId: node.object_id,
    length: typeof node.length === "number" ? node.length : items.length,
    truncated: Boolean(node.truncated),
    cells,
    pointers,
    removedItems: seqDiff.removedItems,
    activeOperation: primaryEvent?.operation,
    operationSummary: primaryEvent?.summary,
    is2DMatrix,
    matrixRows,
  };
}

function reconstructStackState(
  varItem: VariableSnapshotItem,
  prevVarItem: VariableSnapshotItem | null,
  currentStep: TraceStep,
  stepEvents: VisualizationEvent[]
): StackVisualizationState {
  const node = varItem.structured;
  const rawItems = node.items ?? [];
  const seqDiff = diffSequenceNodes(prevVarItem?.structured, node);
  const stmt = currentStep.source_line.trim();
  const isPeekingTop =
    rawItems.length > 0 && stmt.includes(`${varItem.name}[-1]`);

  const insertedSet = new Set(seqDiff.insertedIndices);
  const changedSet = new Set(seqDiff.changedIndices);

  const items: StackVisualizationItem[] = rawItems.map((child, idx) => {
    const isTop = idx === rawItems.length - 1;
    let status: StackVisualizationItem["status"] = "default";
    if (insertedSet.has(idx) && seqDiff.operation !== "create") {
      status = "pushed";
    } else if (changedSet.has(idx)) {
      status = "updated";
    } else if (isTop && isPeekingTop) {
      status = "peeked";
    }

    return {
      index: idx,
      display: child.display,
      typeName: child.type_name,
      isTop,
      status,
    };
  });

  const poppedItem =
    seqDiff.removedItems.length > 0
      ? {
          display: seqDiff.removedItems[0].display,
          index: seqDiff.removedItems[0].index,
        }
      : null;

  const primaryEvent = stepEvents.find((e) => e.variable === varItem.name);

  return {
    kind: "stack",
    variableName: varItem.name,
    backingType: varItem.var_type,
    objectId: node.object_id,
    items,
    poppedItem,
    activeOperation:
      primaryEvent?.operation ?? (isPeekingTop ? "peek" : undefined),
    operationSummary:
      primaryEvent?.summary ??
      (isPeekingTop && rawItems.length > 0
        ? `Peeked top of stack '${varItem.name}': ${rawItems[rawItems.length - 1].display}`
        : undefined),
  };
}

function reconstructQueueState(
  varItem: VariableSnapshotItem,
  prevVarItem: VariableSnapshotItem | null,
  currentStep: TraceStep,
  stepEvents: VisualizationEvent[]
): QueueVisualizationState {
  const node = varItem.structured;
  const rawItems = node.items ?? [];
  const seqDiff = diffSequenceNodes(prevVarItem?.structured, node);
  const stmt = currentStep.source_line.trim();
  const isPeekingFront =
    rawItems.length > 0 && stmt.includes(`${varItem.name}[0]`);

  const insertedSet = new Set(seqDiff.insertedIndices);
  const changedSet = new Set(seqDiff.changedIndices);

  const items: QueueVisualizationItem[] = rawItems.map((child, idx) => {
    const isFront = idx === 0;
    const isRear = idx === rawItems.length - 1;
    let status: QueueVisualizationItem["status"] = "default";
    if (insertedSet.has(idx) && seqDiff.operation !== "create") {
      status = "enqueued";
    } else if (changedSet.has(idx)) {
      status = "updated";
    } else if (isFront && isPeekingFront) {
      status = "peeked";
    }

    return {
      index: idx,
      display: child.display,
      typeName: child.type_name,
      isFront,
      isRear,
      status,
    };
  });

  const dequeuedItem =
    seqDiff.removedItems.length > 0
      ? { display: seqDiff.removedItems[0].display }
      : null;

  const primaryEvent = stepEvents.find((e) => e.variable === varItem.name);

  return {
    kind: "queue",
    variableName: varItem.name,
    backingType: varItem.var_type,
    objectId: node.object_id,
    items,
    dequeuedItem,
    activeOperation: primaryEvent?.operation,
    operationSummary: primaryEvent?.summary,
  };
}

function reconstructLinkedListState(
  primaryVarName: string,
  currentStep: TraceStep,
  prevStep: TraceStep | null,
  stepEvents: VisualizationEvent[]
): LinkedListVisualizationState {
  const currVars = getMergedStepVariables(currentStep);
  const prevVars = prevStep ? getMergedStepVariables(prevStep) : [];

  const prevGraph = collectObjectNodesFromVariables(
    prevVars,
    isLinkedListNodeObject
  );
  const currGraph = collectObjectNodesFromVariables(
    currVars,
    isLinkedListNodeObject
  );
  const graphDiff = diffObjectGraphNodes(prevGraph, currGraph);

  // Map objectId -> pointer variable names pointing directly to that node
  const pointerVarsByOid = new Map<string, string[]>();
  const linkedListVars = currVars.filter((v) =>
    isLinkedListNodeObject(v.structured)
  );
  for (const v of linkedListVars) {
    const oid = v.structured.object_id;
    if (!oid) continue;
    const list = pointerVarsByOid.get(oid) ?? [];
    list.push(v.name);
    pointerVarsByOid.set(oid, list);
  }

  // Extract nextId and prevId for every discovered node
  const nextKeys = ["next", "next_node", "nxt"];
  const prevKeys = ["prev", "previous", "prev_node"];

  const nextByOid = new Map<string, string | null>();
  const prevByOid = new Map<string, string | null>();
  let hasPrevLinks = false;

  currGraph.forEach((summary, oid) => {
    let nextTarget: string | null = null;
    for (const k of nextKeys) {
      if (k in summary.links) {
        nextTarget = summary.links[k];
        break;
      }
    }
    nextByOid.set(oid, nextTarget);

    let prevTarget: string | null = null;
    for (const k of prevKeys) {
      if (k in summary.links) {
        hasPrevLinks = true;
        prevTarget = summary.links[k];
        break;
      }
    }
    prevByOid.set(oid, prevTarget);
  });

  // Order nodes starting from primaryVarName's objectId, following next links
  const primaryVar =
    linkedListVars.find((v) => v.name === primaryVarName) ?? linkedListVars[0];
  const startOid = primaryVar?.structured.object_id ?? null;

  const orderedOids: string[] = [];
  const visitedOids = new Set<string>();
  const cycleTargetOids = new Set<string>();
  let isCircular = false;

  function walkChain(fromOid: string | null) {
    let curr = fromOid;
    const chainAncestors = new Set<string>();
    while (curr && currGraph.has(curr)) {
      if (chainAncestors.has(curr)) {
        isCircular = true;
        cycleTargetOids.add(curr);
        break;
      }
      if (visitedOids.has(curr)) {
        break;
      }
      visitedOids.add(curr);
      chainAncestors.add(curr);
      orderedOids.push(curr);
      curr = nextByOid.get(curr) ?? null;
    }
  }

  if (startOid) {
    walkChain(startOid);
  }
  // Walk any remaining nodes (e.g. a newly allocated node not yet linked into head)
  currGraph.forEach((_, oid) => {
    if (!visitedOids.has(oid)) {
      walkChain(oid);
    }
  });

  const variant: LinkedListVariant = isCircular
    ? "circular"
    : hasPrevLinks
    ? "doubly"
    : "singly";

  const edges: LinkedListVisualEdge[] = [];
  const rawNodes: Omit<LinkedListVisualNode, "x" | "y">[] = orderedOids.map(
    (oid, idx) => {
      const summary = currGraph.get(oid)!;
      const nextId = nextByOid.get(oid) ?? null;
      const prevId = prevByOid.get(oid) ?? null;
      const pointers = pointerVarsByOid.get(oid) ?? [];

      const isHead = idx === 0;
      const isTail =
        !nextId ||
        (isCircular && idx === orderedOids.length - 1);

      if (nextId && currGraph.has(nextId)) {
        const targetIndex = orderedOids.indexOf(nextId);
        const isBackCycleEdge = targetIndex !== -1 && targetIndex <= idx;
        edges.push({
          id: `ll-edge-next-${oid}-${nextId}`,
          source: oid,
          target: nextId,
          kind: isBackCycleEdge ? "circular" : "next",
          label: isBackCycleEdge ? "cycle ↺" : "next",
          isUpdated: graphDiff.updatedLinkEdges.has(`${oid}:next`),
        });
      }

      if (prevId && currGraph.has(prevId)) {
        edges.push({
          id: `ll-edge-prev-${oid}-${prevId}`,
          source: oid,
          target: prevId,
          kind: "prev",
          label: "prev",
          isUpdated: graphDiff.updatedLinkEdges.has(`${oid}:prev`),
        });
      }

      let status: LinkedListVisualNode["status"] = "default";
      if (graphDiff.insertedIds.has(oid) && prevGraph.size > 0) {
        status = "inserted";
      } else if (graphDiff.modifiedValueIds.has(oid)) {
        status = "modified";
      } else if (
        pointers.some((p) =>
          /^(curr|current|node|slow|fast|temp|target|runner)$/i.test(p)
        )
      ) {
        status = "active";
      }

      return {
        id: oid,
        objectId: oid,
        className: summary.className,
        valueDisplay: summary.valueDisplay,
        nextId,
        prevId,
        isHead,
        isTail,
        isCycleTarget: cycleTargetOids.has(oid),
        pointers,
        status,
      };
    }
  );

  const laidOutNodes = layoutLinkedListNodes(rawNodes);
  const relevantEvent = stepEvents.find((e) => e.structure === "linked-list");

  return {
    kind: "linked-list",
    variableName: primaryVarName,
    variant,
    nodes: laidOutNodes,
    edges,
    removedNodes: graphDiff.removedNodes,
    activeOperation: relevantEvent?.operation,
    operationSummary: relevantEvent?.summary,
  };
}

function reconstructTreeState(
  primaryVarName: string,
  currentStep: TraceStep,
  prevStep: TraceStep | null,
  sourceCode: string,
  stepEvents: VisualizationEvent[]
): TreeVisualizationState {
  const currVars = getMergedStepVariables(currentStep);
  const prevVars = prevStep ? getMergedStepVariables(prevStep) : [];

  const prevGraph = collectObjectNodesFromVariables(prevVars, isTreeNodeObject);
  const currGraph = collectObjectNodesFromVariables(currVars, isTreeNodeObject);
  const graphDiff = diffObjectGraphNodes(prevGraph, currGraph);

  // Map objectId -> variable names pointing directly to that tree node
  const pointerVarsByOid = new Map<string, string[]>();
  for (const v of currVars) {
    if (isTreeNodeObject(v.structured) && v.structured.object_id) {
      const oid = v.structured.object_id;
      const list = pointerVarsByOid.get(oid) ?? [];
      list.push(v.name);
      pointerVarsByOid.set(oid, list);
    }
  }

  // Build parent map and child links
  const parentByOid = new Map<string, string>();
  currGraph.forEach((summary, oid) => {
    const leftId = summary.links.left ?? null;
    const rightId = summary.links.right ?? null;
    if (leftId && currGraph.has(leftId) && leftId !== oid) {
      parentByOid.set(leftId, oid);
    }
    if (rightId && currGraph.has(rightId) && rightId !== oid) {
      parentByOid.set(rightId, oid);
    }
  });

  // Identify root node (prefer variable named root/tree/bst or node with no parent)
  const rootVar =
    currVars.find(
      (v) =>
        isTreeNodeObject(v.structured) && /^(root|tree|bst)$/i.test(v.name)
    ) ?? currVars.find((v) => isTreeNodeObject(v.structured));

  let rootOid = rootVar?.structured.object_id ?? null;
  if (rootOid && parentByOid.has(rootOid)) {
    const seen = new Set<string>();
    while (rootOid && parentByOid.has(rootOid) && !seen.has(rootOid)) {
      seen.add(rootOid);
      rootOid = parentByOid.get(rootOid)!;
    }
  }
  if (!rootOid) {
    const firstKey = currGraph.keys().next();
    rootOid = firstKey.done ? null : firstKey.value;
  }

  // Compute depths & search path from root to active pointer (curr/node)
  const activePointerOids = new Set<string>();
  pointerVarsByOid.forEach((varNames, oid) => {
    if (
      varNames.some((n) =>
        /^(node|curr|current|target_node|found|focus|ptr)$/i.test(n)
      )
    ) {
      activePointerOids.add(oid);
    }
  });

  const searchPathOids = new Set<string>();
  activePointerOids.forEach((activeOid) => {
    let walker: string | undefined = activeOid;
    const guard = new Set<string>();
    while (walker && !guard.has(walker)) {
      guard.add(walker);
      searchPathOids.add(walker);
      walker = parentByOid.get(walker);
    }
  });

  // Extract traversal sequence from user traversal list if present (e.g. inorder, preorder, postorder, bfs)
  const traversalVar = currVars.find(
    (v) =>
      v.structured.kind === "sequence" &&
      /^(inorder|preorder|postorder|level_order|traversal|visited|order|result)$/i.test(
        v.name
      )
  );
  const recordedTraversal = (traversalVar?.structured.items ?? []).map(
    (it) => it.display
  );
  const visitedValueSet = new Set(recordedTraversal);

  // Compute depths & check BST property
  const depthByOid = new Map<string, number>();
  let isValidBst = currGraph.size > 0;
  let allNumeric = true;

  function validateSubtree(
    oid: string | null,
    depth: number,
    minBound: number,
    maxBound: number,
    visited: Set<string>
  ) {
    if (!oid || !currGraph.has(oid) || visited.has(oid)) return;
    visited.add(oid);
    depthByOid.set(oid, depth);
    const summary = currGraph.get(oid)!;
    const numVal = parseNumberOrNull(summary.valueDisplay);
    if (numVal === null) {
      allNumeric = false;
    } else if (numVal <= minBound || numVal >= maxBound) {
      isValidBst = false;
    }

    const leftId = summary.links.left ?? null;
    const rightId = summary.links.right ?? null;
    validateSubtree(
      leftId,
      depth + 1,
      minBound,
      numVal ?? maxBound,
      visited
    );
    validateSubtree(
      rightId,
      depth + 1,
      numVal ?? minBound,
      maxBound,
      visited
    );
  }

  if (rootOid) {
    validateSubtree(
      rootOid,
      0,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      new Set()
    );
  }

  const edges: TreeVisualEdge[] = [];
  const rawNodes: Omit<TreeVisualNode, "x" | "y">[] = [];

  currGraph.forEach((summary, oid) => {
    const leftId =
      summary.links.left && currGraph.has(summary.links.left)
        ? summary.links.left
        : null;
    const rightId =
      summary.links.right && currGraph.has(summary.links.right)
        ? summary.links.right
        : null;

    if (leftId) {
      edges.push({
        id: `tree-edge-L-${oid}-${leftId}`,
        source: oid,
        target: leftId,
        branch: "left",
        isHighlighted:
          searchPathOids.has(oid) && searchPathOids.has(leftId),
      });
    }
    if (rightId) {
      edges.push({
        id: `tree-edge-R-${oid}-${rightId}`,
        source: oid,
        target: rightId,
        branch: "right",
        isHighlighted:
          searchPathOids.has(oid) && searchPathOids.has(rightId),
      });
    }

    const isActive = activePointerOids.has(oid);
    const isOnSearchPath = searchPathOids.has(oid);
    const traversalIdx = recordedTraversal.indexOf(summary.valueDisplay);

    let status: TreeVisualNode["status"] = "default";
    if (isActive) {
      status = "active";
    } else if (graphDiff.insertedIds.has(oid) && prevGraph.size > 0) {
      status = "inserted";
    } else if (visitedValueSet.has(summary.valueDisplay)) {
      status = "visited";
    } else if (isOnSearchPath) {
      status = "search-path";
    }

    rawNodes.push({
      id: oid,
      objectId: oid,
      className: summary.className,
      valueDisplay: summary.valueDisplay,
      numericValue: parseNumberOrNull(summary.valueDisplay),
      leftId,
      rightId,
      parentId: parentByOid.get(oid) ?? null,
      depth: depthByOid.get(oid) ?? 0,
      isRoot: oid === rootOid,
      isActive,
      isOnSearchPath,
      status,
      pointers: pointerVarsByOid.get(oid) ?? [],
      traversalOrderIndex: traversalIdx >= 0 ? traversalIdx + 1 : null,
    });
  });

  const laidOutNodes = layoutBinaryTreeNodes(rawNodes);
  const traversalTypeLabel = traversalVar
    ? `${traversalVar.name}`
    : /\bpreorder\b/i.test(sourceCode)
    ? "Pre-order"
    : /\bpostorder\b/i.test(sourceCode)
    ? "Post-order"
    : /\b(deque|level_order)\b/i.test(sourceCode)
    ? "Level-order"
    : "In-order";

  const relevantEvent = stepEvents.find((e) => e.structure === "tree");

  return {
    kind: "tree",
    variableName: primaryVarName,
    isBinarySearchTree:
      (isValidBst && allNumeric && currGraph.size >= 2) ||
      /\bbst\b|binary_search_tree|insert_bst|search_bst/i.test(sourceCode),
    nodes: laidOutNodes,
    edges,
    traversalSequence: recordedTraversal,
    traversalTypeLabel,
    activeOperation: relevantEvent?.operation,
    operationSummary: relevantEvent?.summary,
  };
}

function reconstructGraphState(
  varItem: VariableSnapshotItem,
  currentStep: TraceStep,
  sourceCode: string,
  stepEvents: VisualizationEvent[]
): GraphVisualizationState {
  const entries = varItem.structured.entries ?? [];
  const currVars = getMergedStepVariables(currentStep);

  const vertexSet = new Set<string>();
  const adjacency = new Map<string, string[]>();
  const rawDirectedEdges: {
    source: string;
    target: string;
    weight: string | null;
  }[] = [];
  let isWeighted = false;

  for (const entry of entries) {
    const u = unquoteDisplay(entry.key);
    vertexSet.add(u);
    const neighbors: string[] = [];
    const val = entry.value;

    if (val.kind === "sequence" || val.kind === "set") {
      for (const item of val.items ?? []) {
        if (item.kind === "sequence" && (item.items?.length ?? 0) >= 2) {
          const v = unquoteDisplay(item.items![0].display);
          const w = item.items![1].display;
          isWeighted = true;
          vertexSet.add(v);
          neighbors.push(v);
          rawDirectedEdges.push({ source: u, target: v, weight: w });
        } else {
          const v = unquoteDisplay(item.display);
          vertexSet.add(v);
          neighbors.push(v);
          rawDirectedEdges.push({ source: u, target: v, weight: null });
        }
      }
    } else if (val.kind === "mapping") {
      isWeighted = true;
      for (const sub of val.entries ?? []) {
        const v = unquoteDisplay(sub.key);
        const w = sub.value.display;
        vertexSet.add(v);
        neighbors.push(v);
        rawDirectedEdges.push({ source: u, target: v, weight: w });
      }
    }

    adjacency.set(u, neighbors);
  }

  // Check if graph is symmetric (undirected) or directed
  const edgeKeyMap = new Map<string, string | null>();
  for (const e of rawDirectedEdges) {
    edgeKeyMap.set(`${e.source}->${e.target}`, e.weight);
  }
  const allSymmetric =
    rawDirectedEdges.length >= 2 &&
    rawDirectedEdges.every((e) =>
      edgeKeyMap.has(`${e.target}->${e.source}`)
    );
  const isDirected = !allSymmetric;

  // Detect BFS vs DFS algorithm mode
  const queueVar = currVars.find((v) =>
    /^(queue|q|bfs_queue|frontier)$/i.test(v.name)
  );
  const stackVar = currVars.find((v) =>
    /^(stack|dfs_stack)$/i.test(v.name)
  );
  const orderVar = currVars.find((v) =>
    /^(bfs_order|dfs_order|order|visited_order|traversal)$/i.test(v.name)
  );
  const visitedVar = currVars.find((v) =>
    /^(visited|seen|explored)$/i.test(v.name)
  );

  const algorithmMode: GraphVisualizationState["algorithmMode"] =
    queueVar || /\bbfs\b|popleft/i.test(sourceCode)
      ? "bfs"
      : stackVar || /\bdfs\b/i.test(sourceCode)
      ? "dfs"
      : "general";

  // Extract visited vertices and visit order
  const visitedOrder: string[] = [];
  if (orderVar && orderVar.structured.items) {
    for (const item of orderVar.structured.items) {
      const clean = unquoteDisplay(item.display);
      if (!visitedOrder.includes(clean)) visitedOrder.push(clean);
    }
  }
  if (visitedVar && visitedVar.structured.items) {
    for (const item of visitedVar.structured.items) {
      const clean = unquoteDisplay(item.display);
      if (!visitedOrder.includes(clean)) visitedOrder.push(clean);
    }
  }
  const visitedSet = new Set(visitedOrder);

  // Extract frontier (BFS queue or DFS stack)
  const frontierVar = queueVar ?? stackVar;
  const frontierItems = (frontierVar?.structured.items ?? []).map((it) =>
    unquoteDisplay(it.display)
  );
  const frontierSet = new Set(frontierItems);

  // Active vertex & neighbor in current frame
  const activeVertexVar = currVars.find(
    (v) =>
      /^(vertex|node|curr|current|u|src)$/i.test(v.name) &&
      vertexSet.has(unquoteDisplay(v.repr_value))
  );
  const activeNeighborVar = currVars.find(
    (v) =>
      /^(neighbor|neighbour|nxt|v|dst)$/i.test(v.name) &&
      vertexSet.has(unquoteDisplay(v.repr_value))
  );

  const activeNodeId = activeVertexVar
    ? unquoteDisplay(activeVertexVar.repr_value)
    : null;
  const activeNeighborId = activeNeighborVar
    ? unquoteDisplay(activeNeighborVar.repr_value)
    : null;

  const rawNodes: Omit<GraphVisualNode, "x" | "y">[] = Array.from(
    vertexSet
  ).map((vId) => {
    const orderIdx = visitedOrder.indexOf(vId);
    return {
      id: vId,
      label: vId,
      isCurrent: vId === activeNodeId,
      isVisited: visitedSet.has(vId),
      visitOrder: orderIdx >= 0 ? orderIdx + 1 : null,
      inFrontier: frontierSet.has(vId),
    };
  });

  const laidOutNodes = layoutGraphNodes(rawNodes, adjacency);

  // Deduplicate undirected edges if !isDirected
  const seenUndirected = new Set<string>();
  const edges: GraphVisualEdge[] = [];

  for (const e of rawDirectedEdges) {
    if (!isDirected) {
      const pairKey = [e.source, e.target].sort().join("--");
      if (seenUndirected.has(pairKey)) continue;
      seenUndirected.add(pairKey);
    }
    const isActiveEdge =
      (e.source === activeNodeId && e.target === activeNeighborId) ||
      (!isDirected &&
        e.target === activeNodeId &&
        e.source === activeNeighborId);
    const isTraversed =
      visitedSet.has(e.source) && visitedSet.has(e.target);

    edges.push({
      id: `graph-edge-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      weight: e.weight,
      isDirected,
      isTraversed,
      isActiveEdge,
    });
  }

  const relevantEvent = stepEvents.find((e) => e.structure === "graph");

  return {
    kind: "graph",
    variableName: varItem.name,
    isDirected,
    isWeighted,
    algorithmMode,
    nodes: laidOutNodes,
    edges,
    visitedOrder,
    frontierItems,
    frontierLabel:
      algorithmMode === "bfs"
        ? `BFS Queue (${queueVar?.name ?? "queue"})`
        : algorithmMode === "dfs"
        ? `DFS Frontier`
        : "Frontier",
    activeNodeId,
    activeOperation: relevantEvent?.operation,
    operationSummary: relevantEvent?.summary,
  };
}

function reconstructHeapState(
  varItem: VariableSnapshotItem,
  prevVarItem: VariableSnapshotItem | null,
  currentStep: TraceStep,
  prevStep: TraceStep | null,
  sourceCode: string,
  stepEvents: VisualizationEvent[]
): HeapVisualizationState {
  const arrayState = reconstructArrayState(
    varItem,
    prevVarItem,
    currentStep,
    prevStep,
    sourceCode,
    stepEvents
  );
  const items = varItem.structured.items ?? [];
  const seqDiff = diffSequenceNodes(prevVarItem?.structured, varItem.structured);
  const isMaxHeap = /max_heap/i.test(varItem.name);
  const variant: "min" | "max" = isMaxHeap ? "max" : "min";

  const insertedSet = new Set(seqDiff.insertedIndices);
  const swappedSet = new Set(seqDiff.swappedPair ?? []);

  let heapPropertySatisfied = true;

  const rawNodes: Omit<HeapVisualNode, "x" | "y">[] = items.map(
    (item, index) => {
      const numVal = parseNumberOrNull(item.display);
      const parentIndex = index > 0 ? Math.floor((index - 1) / 2) : null;
      const leftIndex = 2 * index + 1 < items.length ? 2 * index + 1 : null;
      const rightIndex = 2 * index + 2 < items.length ? 2 * index + 2 : null;
      const depth = Math.floor(Math.log2(index + 1));

      let violatesHeap = false;
      if (parentIndex !== null && numVal !== null) {
        const parentVal = parseNumberOrNull(items[parentIndex].display);
        if (parentVal !== null) {
          if (variant === "min" && numVal < parentVal) {
            violatesHeap = true;
            heapPropertySatisfied = false;
          } else if (variant === "max" && numVal > parentVal) {
            violatesHeap = true;
            heapPropertySatisfied = false;
          }
        }
      }

      let status: HeapVisualNode["status"] = "default";
      if (swappedSet.has(index)) {
        status = "swapped";
      } else if (insertedSet.has(index) && seqDiff.operation !== "create") {
        status = "inserted";
      } else if (index === 0) {
        status = "root";
      }

      return {
        index,
        id: `heap-node-${index}`,
        valueDisplay: item.display,
        numericValue: numVal,
        parentIndex,
        leftIndex,
        rightIndex,
        depth,
        status,
        violatesHeap,
      };
    }
  );

  const laidOutNodes = layoutHeapNodes(rawNodes);
  const extractedValue =
    seqDiff.removedItems.length > 0 ? seqDiff.removedItems[0].display : null;
  const relevantEvent = stepEvents.find((e) => e.variable === varItem.name);

  return {
    kind: "heap",
    variableName: varItem.name,
    variant,
    heapPropertySatisfied,
    nodes: laidOutNodes,
    arrayCells: arrayState.cells,
    extractedValue,
    activeOperation: relevantEvent?.operation,
    operationSummary: relevantEvent?.summary,
  };
}

function reconstructHashMapState(
  varItem: VariableSnapshotItem,
  prevVarItem: VariableSnapshotItem | null,
  currentStep: TraceStep,
  stepEvents: VisualizationEvent[]
): HashMapVisualizationState {
  const node = varItem.structured;
  const rawEntries = node.entries ?? [];
  const mapDiff = diffMappingNodes(prevVarItem?.structured, node);
  const stmt = currentStep.source_line.trim();

  let activeKey: string | null = null;
  const entries: HashMapEntryItem[] = rawEntries.map((entry) => {
    let status: HashMapEntryItem["status"] = "default";
    const isInserted =
      mapDiff.insertedKeys.has(entry.key) && mapDiff.operation !== "create";
    const isUpdated = mapDiff.updatedKeys.has(entry.key);
    const isLookedUp =
      !isInserted &&
      !isUpdated &&
      (stmt.includes(`[${entry.key}]`) || stmt.includes(`${entry.key} in ${varItem.name}`));

    if (isInserted) {
      status = "inserted";
      activeKey = entry.key;
    } else if (isUpdated) {
      status = "updated";
      activeKey = entry.key;
    } else if (isLookedUp) {
      status = "lookup";
      activeKey = entry.key;
    }

    return {
      key: entry.key,
      valueDisplay: entry.value.display,
      valueType: entry.value.type_name,
      objectId: entry.value.object_id,
      status,
      previousValueDisplay: mapDiff.updatedKeys.get(entry.key) ?? null,
    };
  });

  const relevantEvent = stepEvents.find((e) => e.variable === varItem.name);

  return {
    kind: "hash-map",
    variableName: varItem.name,
    typeName: varItem.var_type,
    objectId: node.object_id,
    entries,
    deletedEntries: mapDiff.deletedEntries,
    activeKey,
    activeOperation: relevantEvent?.operation,
    operationSummary: relevantEvent?.summary,
  };
}

function reconstructRecursionMemoryState(
  steps: TraceStep[],
  stepIndex: number,
  stepEvents: VisualizationEvent[]
): RecursionMemoryVisualizationState {
  const currentStep = steps[stepIndex];
  const rawNodes: Omit<RecursionTreeNode, "x" | "y">[] = [];
  const frameIdToNode = new Map<string, Omit<RecursionTreeNode, "x" | "y">>();
  let maxDepthReached = 1;

  // Replay steps[0..stepIndex] to deterministically build the exact recursion call tree
  for (let i = 0; i <= stepIndex; i++) {
    const st = steps[i];
    if (st.call_depth > maxDepthReached) {
      maxDepthReached = st.call_depth;
    }

    const functionFrames = st.call_stack.filter(
      (f) => f.function_name !== "<module>"
    );

    for (let fIdx = 0; fIdx < functionFrames.length; fIdx++) {
      const frame = functionFrames[fIdx];
      if (!frameIdToNode.has(frame.frame_id)) {
        const parentFrame = fIdx > 0 ? functionFrames[fIdx - 1] : null;
        const parentNode = parentFrame
          ? frameIdToNode.get(parentFrame.frame_id)
          : null;

        // Format compact argument preview from local variables at call time
        const argPreview =
          fIdx === functionFrames.length - 1
            ? st.locals
                .slice(0, 3)
                .map((v) => `${v.name}=${v.repr_value}`)
                .join(", ")
            : "";

        const newNode: Omit<RecursionTreeNode, "x" | "y"> = {
          id: frame.frame_id,
          functionName: frame.function_name,
          argsDisplay: argPreview,
          depth: fIdx + 1,
          callStep: st.step,
          returnStep: null,
          returnValue: null,
          status: "completed",
          parentId: parentNode?.id ?? null,
        };
        frameIdToNode.set(frame.frame_id, newNode);
        rawNodes.push(newNode);
      }
    }

    if (st.event === "return" && functionFrames.length > 0) {
      const returningFrame = functionFrames[functionFrames.length - 1];
      const node = frameIdToNode.get(returningFrame.frame_id);
      if (node) {
        node.returnStep = st.step;
        node.returnValue = st.return_value ?? "None";
      }
    }
  }

  // Update node status based on currentStep's active call stack
  const activeFunctionFrames = currentStep.call_stack.filter(
    (f) => f.function_name !== "<module>"
  );
  const activeFrameIds = new Set(activeFunctionFrames.map((f) => f.frame_id));
  const topFrameId =
    activeFunctionFrames.length > 0
      ? activeFunctionFrames[activeFunctionFrames.length - 1].frame_id
      : null;

  for (const node of rawNodes) {
    if (node.id === topFrameId) {
      node.status = "active";
    } else if (activeFrameIds.has(node.id)) {
      node.status = "pending-child";
    } else {
      node.status = "completed";
    }
  }

  const laidOutTree = layoutRecursionTreeNodes(rawNodes);

  // Build Object Reference Bindings (`ref#N`) across locals and globals
  const allBindings: MemoryReferenceBinding[] = [];
  const oidCounts = new Map<string, number>();

  const frameLabel =
    currentStep.function_name === "<module>"
      ? "<module>"
      : `${currentStep.function_name}()`;

  const combinedVars = [
    ...currentStep.locals.map((v) => ({ v, frame: frameLabel })),
    ...currentStep.globals
      .filter((g) => !currentStep.locals.some((l) => l.name === g.name))
      .map((v) => ({ v, frame: "<module>" })),
  ];

  for (const { v } of combinedVars) {
    const oid = v.structured.object_id;
    if (oid) {
      oidCounts.set(oid, (oidCounts.get(oid) ?? 0) + 1);
    }
  }

  for (const { v, frame } of combinedVars) {
    const oid = v.structured.object_id;
    if (!oid) continue;
    allBindings.push({
      variableName: v.name,
      scope: v.scope,
      frameName: frame,
      objectId: oid,
      typeName: v.var_type,
      display: v.repr_value,
      isSharedAlias: (oidCounts.get(oid) ?? 0) > 1,
    });
  }

  const relevantEvent = stepEvents.find(
    (e) => e.structure === "recursion-memory"
  );

  return {
    kind: "recursion-memory",
    variableName: currentStep.function_name,
    activeFrames: currentStep.call_stack,
    maxDepthReached,
    callTreeNodes: laidOutTree,
    memoryBindings: allBindings,
    activeOperation: relevantEvent?.operation,
    operationSummary: relevantEvent?.summary,
  };
}

function reconstructUnsupportedState(
  varItem: VariableSnapshotItem
): UnsupportedVisualizationState {
  return {
    kind: "unsupported",
    variableName: varItem.name,
    typeName: varItem.var_type,
    display: varItem.repr_value,
    reason: `Custom object '${varItem.var_type}' does not match standard Linked List (.next) or Binary Tree (.left/.right) node contracts. Inspect its attributes directly in the Variable Inspector.`,
  };
}

/**
 * Directly reconstructs all detected data structure visualizations for `steps[stepIndex]`.
 * Pure & deterministic — works identically for Step Forward, Step Backward, Timeline Scrub, Jump, and Reset.
 */
export function reconstructSnapshotVisualizations(
  steps: TraceStep[],
  stepIndex: number,
  sourceCode: string,
  preferredStructureId?: string | null
): SnapshotVisualizationBundle | null {
  if (!steps || steps.length === 0) return null;

  const clampedIndex = Math.max(0, Math.min(steps.length - 1, stepIndex));
  const currentStep = steps[clampedIndex];
  const prevStep = clampedIndex > 0 ? steps[clampedIndex - 1] : null;

  const detectedStructures = detectStructuresInSnapshot(
    currentStep,
    sourceCode,
    steps
  );
  const stepEvents = generateStepVisualizationEvents(
    currentStep,
    prevStep,
    sourceCode,
    detectedStructures
  );

  const allStatesById: Record<string, ReconstructedStructureState> = {};

  for (const desc of detectedStructures) {
    if (desc.kind === "recursion-memory") {
      allStatesById[desc.id] = reconstructRecursionMemoryState(
        steps,
        clampedIndex,
        stepEvents
      );
      continue;
    }

    if (desc.kind === "linked-list") {
      allStatesById[desc.id] = reconstructLinkedListState(
        desc.variableName,
        currentStep,
        prevStep,
        stepEvents
      );
      continue;
    }

    if (desc.kind === "tree") {
      allStatesById[desc.id] = reconstructTreeState(
        desc.variableName,
        currentStep,
        prevStep,
        sourceCode,
        stepEvents
      );
      continue;
    }

    const currVar = findVariableInStep(currentStep, desc.variableName);
    const prevVar = findVariableInStep(prevStep, desc.variableName);
    if (!currVar) continue;

    switch (desc.kind) {
      case "array":
        allStatesById[desc.id] = reconstructArrayState(
          currVar,
          prevVar,
          currentStep,
          prevStep,
          sourceCode,
          stepEvents
        );
        break;
      case "stack":
        allStatesById[desc.id] = reconstructStackState(
          currVar,
          prevVar,
          currentStep,
          stepEvents
        );
        break;
      case "queue":
        allStatesById[desc.id] = reconstructQueueState(
          currVar,
          prevVar,
          currentStep,
          stepEvents
        );
        break;
      case "graph":
        allStatesById[desc.id] = reconstructGraphState(
          currVar,
          currentStep,
          sourceCode,
          stepEvents
        );
        break;
      case "heap":
        allStatesById[desc.id] = reconstructHeapState(
          currVar,
          prevVar,
          currentStep,
          prevStep,
          sourceCode,
          stepEvents
        );
        break;
      case "hash-map":
        allStatesById[desc.id] = reconstructHashMapState(
          currVar,
          prevVar,
          currentStep,
          stepEvents
        );
        break;
      case "unsupported":
        allStatesById[desc.id] = reconstructUnsupportedState(currVar);
        break;
    }
  }

  let activeStructureId: string | null = null;
  if (
    preferredStructureId &&
    detectedStructures.some((d) => d.id === preferredStructureId)
  ) {
    activeStructureId = preferredStructureId;
  } else if (detectedStructures.length > 0) {
    activeStructureId = detectedStructures[0].id;
  }

  const activeState = activeStructureId
    ? allStatesById[activeStructureId] ?? null
    : null;

  return {
    stepNumber: currentStep.step,
    line: currentStep.line,
    detectedStructures,
    activeStructureId,
    activeState,
    allStatesById,
    stepEvents,
    currentStep,
  };
}
