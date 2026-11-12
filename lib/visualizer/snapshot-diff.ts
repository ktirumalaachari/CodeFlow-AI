import type {
  StructuredValueNode,
  TraceStep,
  VariableSnapshotItem,
} from "@/types/api";
import {
  extractNodeValueDisplay,
  getAttrMap,
  getMergedStepVariables,
} from "@/lib/visualizer/structure-detector";

export interface SequenceDiffResult {
  operation:
    | "create"
    | "append"
    | "insert"
    | "pop"
    | "delete"
    | "swap"
    | "update"
    | "unchanged";
  changedIndices: number[];
  insertedIndices: number[];
  swappedPair?: [number, number] | null;
  removedItems: { index: number; display: string }[];
  previousByIndex: Map<number, string>;
}

export interface MappingDiffResult {
  operation: "create" | "insert" | "update" | "delete" | "unchanged";
  insertedKeys: Set<string>;
  updatedKeys: Map<string, string>;
  deletedEntries: { key: string; previousValueDisplay: string }[];
}

export interface ObjectGraphNodeSummary {
  objectId: string;
  className: string;
  valueDisplay: string;
  links: Record<string, string | null>;
}

export interface ObjectGraphDiffResult {
  insertedIds: Set<string>;
  modifiedValueIds: Set<string>;
  updatedLinkEdges: Set<string>;
  removedNodes: { objectId: string; valueDisplay: string }[];
}

export function findVariableInStep(
  step: TraceStep | null | undefined,
  varName: string
): VariableSnapshotItem | null {
  if (!step) return null;
  const vars = getMergedStepVariables(step);
  return vars.find((v) => v.name === varName) ?? null;
}

export function diffSequenceNodes(
  prevNode: StructuredValueNode | null | undefined,
  currNode: StructuredValueNode
): SequenceDiffResult {
  const currItems = (currNode.items ?? []).map((it) => it.display);

  if (!prevNode || prevNode.kind !== "sequence") {
    return {
      operation: "create",
      changedIndices: [],
      insertedIndices: currItems.map((_, idx) => idx),
      swappedPair: null,
      removedItems: [],
      previousByIndex: new Map(),
    };
  }

  const prevItems = (prevNode.items ?? []).map((it) => it.display);
  const previousByIndex = new Map<number, string>();
  prevItems.forEach((val, idx) => previousByIndex.set(idx, val));

  // Case 1: Same length -> check unchanged, single/multi update, or swap
  if (currItems.length === prevItems.length) {
    const diffIndices: number[] = [];
    for (let i = 0; i < currItems.length; i++) {
      if (currItems[i] !== prevItems[i]) {
        diffIndices.push(i);
      }
    }

    if (diffIndices.length === 0) {
      return {
        operation: "unchanged",
        changedIndices: [],
        insertedIndices: [],
        swappedPair: null,
        removedItems: [],
        previousByIndex,
      };
    }

    if (
      diffIndices.length === 2 &&
      currItems[diffIndices[0]] === prevItems[diffIndices[1]] &&
      currItems[diffIndices[1]] === prevItems[diffIndices[0]]
    ) {
      return {
        operation: "swap",
        changedIndices: diffIndices,
        insertedIndices: [],
        swappedPair: [diffIndices[0], diffIndices[1]],
        removedItems: [],
        previousByIndex,
      };
    }

    return {
      operation: "update",
      changedIndices: diffIndices,
      insertedIndices: [],
      swappedPair: null,
      removedItems: [],
      previousByIndex,
    };
  }

  // Case 2: Length increased -> check append vs interior/front insert
  if (currItems.length > prevItems.length) {
    const delta = currItems.length - prevItems.length;
    if (delta === 1) {
      // Find first mismatch index
      let insertIdx = currItems.length - 1;
      for (let i = 0; i < prevItems.length; i++) {
        if (currItems[i] !== prevItems[i]) {
          insertIdx = i;
          break;
        }
      }
      const isAppend = insertIdx === currItems.length - 1;
      return {
        operation: isAppend ? "append" : "insert",
        changedIndices: [],
        insertedIndices: [insertIdx],
        swappedPair: null,
        removedItems: [],
        previousByIndex,
      };
    }

    const newIndices: number[] = [];
    for (let i = prevItems.length; i < currItems.length; i++) {
      newIndices.push(i);
    }
    return {
      operation: "append",
      changedIndices: [],
      insertedIndices: newIndices,
      swappedPair: null,
      removedItems: [],
      previousByIndex,
    };
  }

  // Case 3: Length decreased -> check pop (from end) vs delete/dequeue (from front/interior)
  const delta = prevItems.length - currItems.length;
  if (delta === 1) {
    let removedIdx = prevItems.length - 1;
    for (let i = 0; i < currItems.length; i++) {
      if (currItems[i] !== prevItems[i]) {
        removedIdx = i;
        break;
      }
    }
    const isPopEnd = removedIdx === prevItems.length - 1;
    return {
      operation: isPopEnd ? "pop" : "delete",
      changedIndices: [],
      insertedIndices: [],
      swappedPair: null,
      removedItems: [{ index: removedIdx, display: prevItems[removedIdx] }],
      previousByIndex,
    };
  }

  const removed: { index: number; display: string }[] = [];
  for (let i = currItems.length; i < prevItems.length; i++) {
    removed.push({ index: i, display: prevItems[i] });
  }
  return {
    operation: "delete",
    changedIndices: [],
    insertedIndices: [],
    swappedPair: null,
    removedItems: removed,
    previousByIndex,
  };
}

export function diffMappingNodes(
  prevNode: StructuredValueNode | null | undefined,
  currNode: StructuredValueNode
): MappingDiffResult {
  const currEntries = currNode.entries ?? [];

  if (!prevNode || prevNode.kind !== "mapping") {
    return {
      operation: "create",
      insertedKeys: new Set(currEntries.map((e) => e.key)),
      updatedKeys: new Map(),
      deletedEntries: [],
    };
  }

  const prevMap = new Map<string, string>();
  for (const entry of prevNode.entries ?? []) {
    prevMap.set(entry.key, entry.value.display);
  }

  const currKeys = new Set<string>();
  const insertedKeys = new Set<string>();
  const updatedKeys = new Map<string, string>();

  for (const entry of currEntries) {
    currKeys.add(entry.key);
    if (!prevMap.has(entry.key)) {
      insertedKeys.add(entry.key);
    } else {
      const oldVal = prevMap.get(entry.key)!;
      if (oldVal !== entry.value.display) {
        updatedKeys.set(entry.key, oldVal);
      }
    }
  }

  const deletedEntries: { key: string; previousValueDisplay: string }[] = [];
  prevMap.forEach((oldVal, key) => {
    if (!currKeys.has(key)) {
      deletedEntries.push({ key, previousValueDisplay: oldVal });
    }
  });

  let operation: MappingDiffResult["operation"] = "unchanged";
  if (insertedKeys.size > 0) operation = "insert";
  else if (updatedKeys.size > 0) operation = "update";
  else if (deletedEntries.length > 0) operation = "delete";

  return {
    operation,
    insertedKeys,
    updatedKeys,
    deletedEntries,
  };
}

export function collectObjectNodesFromVariables(
  variables: VariableSnapshotItem[],
  predicate: (node: StructuredValueNode) => boolean
): Map<string, ObjectGraphNodeSummary> {
  const map = new Map<string, ObjectGraphNodeSummary>();

  function visit(node: StructuredValueNode) {
    if (node.kind !== "object" || !node.object_id) return;
    if (!predicate(node)) return;
    if (map.has(node.object_id)) return;

    const valEntry = extractNodeValueDisplay(node);
    const attrs = getAttrMap(node);
    const links: Record<string, string | null> = {};

    attrs.forEach((attrVal, attrKey) => {
      if (attrKey === valEntry?.key) return;
      if (attrVal.kind === "object" || attrVal.kind === "circular_ref") {
        links[attrKey] = attrVal.object_id ?? null;
      } else if (
        attrVal.kind === "primitive" &&
        attrVal.type_name === "NoneType"
      ) {
        links[attrKey] = null;
      }
    });

    map.set(node.object_id, {
      objectId: node.object_id,
      className: node.type_name,
      valueDisplay: valEntry ? valEntry.valueNode.display : node.display,
      links,
    });

    attrs.forEach((attrVal) => {
      if (attrVal.kind === "object") {
        visit(attrVal);
      }
    });
  }

  for (const v of variables) {
    if (v.structured.kind === "object") {
      visit(v.structured);
    }
  }

  return map;
}

export function diffObjectGraphNodes(
  prevMap: Map<string, ObjectGraphNodeSummary>,
  currMap: Map<string, ObjectGraphNodeSummary>
): ObjectGraphDiffResult {
  const insertedIds = new Set<string>();
  const modifiedValueIds = new Set<string>();
  const updatedLinkEdges = new Set<string>();
  const removedNodes: { objectId: string; valueDisplay: string }[] = [];

  if (prevMap.size === 0) {
    currMap.forEach((_, id) => insertedIds.add(id));
    return {
      insertedIds,
      modifiedValueIds,
      updatedLinkEdges,
      removedNodes,
    };
  }

  currMap.forEach((currNode, id) => {
    const prevNode = prevMap.get(id);
    if (!prevNode) {
      insertedIds.add(id);
      return;
    }
    if (prevNode.valueDisplay !== currNode.valueDisplay) {
      modifiedValueIds.add(id);
    }
    for (const [linkKey, targetId] of Object.entries(currNode.links)) {
      if (prevNode.links[linkKey] !== targetId) {
        updatedLinkEdges.add(`${id}:${linkKey}`);
      }
    }
  });

  prevMap.forEach((prevNode, id) => {
    if (!currMap.has(id)) {
      removedNodes.push({
        objectId: id,
        valueDisplay: prevNode.valueDisplay,
      });
    }
  });

  return {
    insertedIds,
    modifiedValueIds,
    updatedLinkEdges,
    removedNodes,
  };
}

