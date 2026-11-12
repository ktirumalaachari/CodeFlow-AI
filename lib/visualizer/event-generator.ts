import type { TraceStep } from "@/types/api";
import type {
  DetectedStructureDescriptor,
  VisualizationEvent,
} from "@/types/visualizer";
import {
  detectArrayPointers,
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

function parsePrimitiveValue(display: string): unknown {
  const trimmed = display.trim();
  if (trimmed === "True") return true;
  if (trimmed === "False") return false;
  if (trimmed === "None") return null;
  if (/^-?\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return Number.parseFloat(trimmed);
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return display;
}

/**
 * Generates deterministic VisualizationEvents by comparing currentStep against previousStep
 * and inspecting actual runtime state changes (Part 9).
 */
export function generateStepVisualizationEvents(
  currentStep: TraceStep,
  previousStep: TraceStep | null | undefined,
  sourceCode: string,
  detectedStructures: DetectedStructureDescriptor[]
): VisualizationEvent[] {
  const events: VisualizationEvent[] = [];
  const currVars = getMergedStepVariables(currentStep);
  const prevVars = previousStep ? getMergedStepVariables(previousStep) : [];
  const stmt = currentStep.source_line.trim();

  // 1. Function Call / Return events for Recursion & Memory
  if (currentStep.event === "call") {
    events.push({
      id: `ev-${currentStep.step}-call-${currentStep.function_name}`,
      step: currentStep.step,
      line: currentStep.line,
      variable: currentStep.function_name,
      structure: "recursion-memory",
      operation: "call",
      currentValue: currentStep.call_depth,
      summary: `Called ${currentStep.function_name}() at depth ${currentStep.call_depth}`,
    });
  } else if (currentStep.event === "return") {
    events.push({
      id: `ev-${currentStep.step}-return-${currentStep.function_name}`,
      step: currentStep.step,
      line: currentStep.line,
      variable: currentStep.function_name,
      structure: "recursion-memory",
      operation: "return",
      currentValue: currentStep.return_value ?? "None",
      summary: `${currentStep.function_name}() returned ${currentStep.return_value ?? "None"}`,
    });
  }

  // 2. Structure-specific events
  for (const desc of detectedStructures) {
    if (desc.kind === "recursion-memory" || desc.kind === "unsupported") {
      continue;
    }

    const currVar = findVariableInStep(currentStep, desc.variableName);
    const prevVar = findVariableInStep(previousStep, desc.variableName);

    // ARRAY / STACK / QUEUE / HEAP sequence diffing
    if (
      desc.kind === "array" ||
      desc.kind === "stack" ||
      desc.kind === "queue" ||
      desc.kind === "heap"
    ) {
      if (!currVar) continue;
      const seqDiff = diffSequenceNodes(prevVar?.structured, currVar.structured);
      const currItems = currVar.structured.items ?? [];
      const prevItems = prevVar?.structured.items ?? [];

      if (seqDiff.operation === "create") {
        events.push({
          id: `ev-${currentStep.step}-${desc.variableName}-create`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: "create",
          currentValue: currVar.repr_value,
          summary: `Created ${desc.kind} '${desc.variableName}' with ${currItems.length} element${currItems.length === 1 ? "" : "s"}`,
        });
      } else if (seqDiff.operation === "swap" && seqDiff.swappedPair) {
        const [i, j] = seqDiff.swappedPair;
        events.push({
          id: `ev-${currentStep.step}-${desc.variableName}-swap-${i}-${j}`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: "swap",
          index: i,
          secondaryIndex: j,
          previousValue: parsePrimitiveValue(prevItems[i]?.display ?? ""),
          currentValue: parsePrimitiveValue(currItems[i]?.display ?? ""),
          summary: `Swapped ${desc.variableName}[${i}] (${currItems[j]?.display}) and ${desc.variableName}[${j}] (${currItems[i]?.display})`,
        });
      } else if (seqDiff.operation === "update") {
        for (const idx of seqDiff.changedIndices) {
          const prevDisp = seqDiff.previousByIndex.get(idx) ?? "";
          const currDisp = currItems[idx]?.display ?? "";
          events.push({
            id: `ev-${currentStep.step}-${desc.variableName}-update-${idx}`,
            step: currentStep.step,
            line: currentStep.line,
            variable: desc.variableName,
            structure: desc.kind,
            operation: "update",
            index: idx,
            previousValue: parsePrimitiveValue(prevDisp),
            currentValue: parsePrimitiveValue(currDisp),
            summary: `Updated ${desc.variableName}[${idx}] from ${prevDisp} to ${currDisp}`,
          });
        }
      } else if (
        seqDiff.operation === "append" ||
        seqDiff.operation === "insert"
      ) {
        const idx =
          seqDiff.insertedIndices[0] ?? Math.max(0, currItems.length - 1);
        const insertedDisp = currItems[idx]?.display ?? "";
        const op =
          desc.kind === "stack"
            ? "push"
            : desc.kind === "queue"
            ? "enqueue"
            : seqDiff.operation;
        events.push({
          id: `ev-${currentStep.step}-${desc.variableName}-${op}-${idx}`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: op,
          index: idx,
          currentValue: parsePrimitiveValue(insertedDisp),
          summary:
            op === "push"
              ? `Pushed ${insertedDisp} onto top of stack '${desc.variableName}'`
              : op === "enqueue"
              ? `Enqueued ${insertedDisp} at rear of queue '${desc.variableName}'`
              : op === "append"
              ? `Appended ${insertedDisp} at ${desc.variableName}[${idx}]`
              : `Inserted ${insertedDisp} at ${desc.variableName}[${idx}]`,
        });
      } else if (
        seqDiff.operation === "pop" ||
        seqDiff.operation === "delete"
      ) {
        const rem = seqDiff.removedItems[0];
        const remIdx = rem?.index ?? 0;
        const remDisp = rem?.display ?? "";
        const op =
          desc.kind === "stack"
            ? "pop"
            : desc.kind === "queue"
            ? "dequeue"
            : desc.kind === "heap"
            ? "extract"
            : seqDiff.operation;
        events.push({
          id: `ev-${currentStep.step}-${desc.variableName}-${op}-${remIdx}`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: op,
          index: remIdx,
          previousValue: parsePrimitiveValue(remDisp),
          summary:
            op === "pop"
              ? `Popped ${remDisp} from '${desc.variableName}'`
              : op === "dequeue"
              ? `Dequeued ${remDisp} from front of '${desc.variableName}'`
              : op === "extract"
              ? `Extracted root ${remDisp} from heap '${desc.variableName}'`
              : `Deleted ${remDisp} at ${desc.variableName}[${remIdx}]`,
        });
      }

      // Pointer movement & element access detection for arrays
      if (desc.kind === "array") {
        const pointers = detectArrayPointers(
          desc.variableName,
          currItems.length,
          currVars,
          sourceCode,
          prevVars
        );
        for (const ptr of pointers) {
          if (
            ptr.previousIndex !== null &&
            ptr.previousIndex !== undefined &&
            ptr.previousIndex !== ptr.index
          ) {
            events.push({
              id: `ev-${currentStep.step}-${desc.variableName}-ptr-${ptr.name}`,
              step: currentStep.step,
              line: currentStep.line,
              variable: desc.variableName,
              structure: "array",
              operation: "iterate",
              index: ptr.index,
              previousValue: ptr.previousIndex,
              currentValue: ptr.index,
              pointerName: ptr.name,
              summary: `Pointer '${ptr.name}' moved from index ${ptr.previousIndex} to ${ptr.index} (${desc.variableName}[${ptr.index}] = ${currItems[ptr.index]?.display ?? "?"})`,
            });
          } else if (
            stmt.includes(`${desc.variableName}[${ptr.name}]`) &&
            seqDiff.operation === "unchanged"
          ) {
            events.push({
              id: `ev-${currentStep.step}-${desc.variableName}-access-${ptr.name}`,
              step: currentStep.step,
              line: currentStep.line,
              variable: desc.variableName,
              structure: "array",
              operation:
                /\b(if|elif|while|==|<|>|<=|>=)\b/.test(stmt)
                  ? "search"
                  : "access",
              index: ptr.index,
              currentValue: parsePrimitiveValue(
                currItems[ptr.index]?.display ?? ""
              ),
              pointerName: ptr.name,
              summary: `Inspected ${desc.variableName}[${ptr.name}] (index ${ptr.index}, value ${currItems[ptr.index]?.display ?? "?"})`,
            });
          }
        }
      }
      continue;
    }

    // HASH MAP diffing
    if (desc.kind === "hash-map" && currVar) {
      const mapDiff = diffMappingNodes(prevVar?.structured, currVar.structured);
      const entriesMap = new Map(
        (currVar.structured.entries ?? []).map((e) => [e.key, e.value.display])
      );

      if (mapDiff.operation === "create") {
        events.push({
          id: `ev-${currentStep.step}-${desc.variableName}-create`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: "hash-map",
          operation: "create",
          currentValue: currVar.repr_value,
          summary: `Created dictionary '${desc.variableName}' with ${entriesMap.size} key${entriesMap.size === 1 ? "" : "s"}`,
        });
      } else {
        mapDiff.insertedKeys.forEach((k) => {
          const valDisp = entriesMap.get(k) ?? "";
          events.push({
            id: `ev-${currentStep.step}-${desc.variableName}-insert-${k}`,
            step: currentStep.step,
            line: currentStep.line,
            variable: desc.variableName,
            structure: "hash-map",
            operation: "insert",
            key: k,
            currentValue: parsePrimitiveValue(valDisp),
            summary: `Inserted ${desc.variableName}[${k}] = ${valDisp}`,
          });
        });

        mapDiff.updatedKeys.forEach((prevValDisp, k) => {
          const currValDisp = entriesMap.get(k) ?? "";
          events.push({
            id: `ev-${currentStep.step}-${desc.variableName}-update-${k}`,
            step: currentStep.step,
            line: currentStep.line,
            variable: desc.variableName,
            structure: "hash-map",
            operation: "update",
            key: k,
            previousValue: parsePrimitiveValue(prevValDisp),
            currentValue: parsePrimitiveValue(currValDisp),
            summary: `Updated ${desc.variableName}[${k}] from ${prevValDisp} to ${currValDisp}`,
          });
        });

        for (const delEntry of mapDiff.deletedEntries) {
          events.push({
            id: `ev-${currentStep.step}-${desc.variableName}-delete-${delEntry.key}`,
            step: currentStep.step,
            line: currentStep.line,
            variable: desc.variableName,
            structure: "hash-map",
            operation: "delete",
            key: delEntry.key,
            previousValue: parsePrimitiveValue(delEntry.previousValueDisplay),
            summary: `Deleted key ${delEntry.key} (was ${delEntry.previousValueDisplay}) from '${desc.variableName}'`,
          });
        }
      }
      continue;
    }

    // LINKED LIST / TREE diffing
    if (desc.kind === "linked-list" || desc.kind === "tree") {
      const predicate =
        desc.kind === "linked-list" ? isLinkedListNodeObject : isTreeNodeObject;
      const prevGraph = collectObjectNodesFromVariables(prevVars, predicate);
      const currGraph = collectObjectNodesFromVariables(currVars, predicate);
      const graphDiff = diffObjectGraphNodes(prevGraph, currGraph);

      graphDiff.insertedIds.forEach((oid) => {
        const nodeInfo = currGraph.get(oid);
        events.push({
          id: `ev-${currentStep.step}-${desc.kind}-insert-${oid}`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: "insert",
          nodeId: oid,
          currentValue: nodeInfo?.valueDisplay,
          summary: `Allocated ${desc.kind} node (${nodeInfo?.valueDisplay ?? oid}) at ${oid}`,
        });
      });

      graphDiff.updatedLinkEdges.forEach((edgeKey) => {
        const [oid, linkAttr] = edgeKey.split(":");
        const nodeInfo = currGraph.get(oid);
        events.push({
          id: `ev-${currentStep.step}-${desc.kind}-link-${edgeKey}`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: "link",
          nodeId: oid,
          currentValue: nodeInfo?.links[linkAttr] ?? "None",
          summary: `Updated pointer ${nodeInfo?.className ?? "Node"}(${nodeInfo?.valueDisplay ?? oid}).${linkAttr} → ${nodeInfo?.links[linkAttr] ?? "None"}`,
        });
      });

      for (const rem of graphDiff.removedNodes) {
        events.push({
          id: `ev-${currentStep.step}-${desc.kind}-unlink-${rem.objectId}`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: desc.kind,
          operation: "delete",
          nodeId: rem.objectId,
          previousValue: rem.valueDisplay,
          summary: `Unlinked node (${rem.valueDisplay}) [${rem.objectId}]`,
        });
      }
      continue;
    }

    // GRAPH traversal events
    if (desc.kind === "graph") {
      const visitedVar = currVars.find((v) =>
        /^(visited|seen|explored)$/i.test(v.name)
      );
      if (visitedVar && visitedVar.change !== "unchanged") {
        events.push({
          id: `ev-${currentStep.step}-${desc.variableName}-visit`,
          step: currentStep.step,
          line: currentStep.line,
          variable: desc.variableName,
          structure: "graph",
          operation: "traverse",
          currentValue: visitedVar.repr_value,
          summary: `Updated visited vertices: ${visitedVar.repr_value}`,
        });
      }
    }
  }

  return events;
}

