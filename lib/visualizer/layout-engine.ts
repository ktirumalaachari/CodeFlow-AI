import { hierarchy, tree } from "d3-hierarchy";
import type {
  GraphVisualNode,
  HeapVisualNode,
  LinkedListVisualNode,
  RecursionTreeNode,
  TreeVisualNode,
} from "@/types/visualizer";

/**
 * Deterministic horizontal layout for Linked List nodes (Part 5 & Part 15).
 */
export function layoutLinkedListNodes(
  nodes: Omit<LinkedListVisualNode, "x" | "y">[]
): LinkedListVisualNode[] {
  const spacingX = 210;
  const startX = 48;
  const baseY = 120;

  return nodes.map((node, index) => ({
    ...node,
    x: startX + index * spacingX,
    y: baseY,
  }));
}

interface InternalTreeDatum {
  id: string;
  isPlaceholder?: boolean;
  children?: InternalTreeDatum[];
}

/**
 * Uses d3-hierarchy Reingold-Tilford tree layout to compute deterministic
 * parent-child coordinates for Binary Trees & BSTs (Part 2 & Part 6).
 * Preserves left-vs-right separation even when a node has only one child!
 */
export function layoutBinaryTreeNodes(
  rawNodes: Omit<TreeVisualNode, "x" | "y">[]
): TreeVisualNode[] {
  if (rawNodes.length === 0) return [];

  const byId = new Map<string, Omit<TreeVisualNode, "x" | "y">>();
  rawNodes.forEach((n) => byId.set(n.id, n));

  const rootCandidate =
    rawNodes.find((n) => n.isRoot) ??
    rawNodes.find((n) => !n.parentId) ??
    rawNodes[0];

  const visited = new Set<string>();

  function buildHierarchyDatum(nodeId: string, depth: number): InternalTreeDatum {
    visited.add(nodeId);
    const node = byId.get(nodeId);
    if (!node || depth > 18) {
      return { id: nodeId };
    }

    const hasLeft = Boolean(node.leftId && byId.has(node.leftId) && !visited.has(node.leftId));
    const hasRight = Boolean(
      node.rightId && byId.has(node.rightId) && !visited.has(node.rightId)
    );

    if (!hasLeft && !hasRight) {
      return { id: nodeId };
    }

    const leftDatum: InternalTreeDatum = hasLeft
      ? buildHierarchyDatum(node.leftId!, depth + 1)
      : { id: `__placeholder_L_${nodeId}`, isPlaceholder: true };

    const rightDatum: InternalTreeDatum = hasRight
      ? buildHierarchyDatum(node.rightId!, depth + 1)
      : { id: `__placeholder_R_${nodeId}`, isPlaceholder: true };

    return {
      id: nodeId,
      children: [leftDatum, rightDatum],
    };
  }

  const rootDatum = buildHierarchyDatum(rootCandidate.id, 0);
  const rootHierarchy = hierarchy<InternalTreeDatum>(rootDatum);
  const treeLayout = tree<InternalTreeDatum>().nodeSize([148, 118]);
  const laidOut = treeLayout(rootHierarchy);

  const coords = new Map<string, { x: number; y: number }>();
  let minX = 0;
  laidOut.each((d) => {
    if (!d.data.isPlaceholder) {
      if (d.x < minX) minX = d.x;
      coords.set(d.data.id, { x: d.x, y: d.y });
    }
  });

  const offsetX = Math.abs(minX) + 90;
  const offsetY = 48;

  // Position any disconnected nodes neatly to the right
  let disconnectedIdx = 0;

  return rawNodes.map((n) => {
    const pos = coords.get(n.id);
    if (pos) {
      return {
        ...n,
        x: Math.round(pos.x + offsetX),
        y: Math.round(pos.y + offsetY),
      };
    }
    disconnectedIdx++;
    return {
      ...n,
      x: Math.round(offsetX + 360 + disconnectedIdx * 150),
      y: offsetY,
    };
  });
}

/**
 * Deterministic complete binary tree layout for Min/Max Heaps using d3-hierarchy (Part 8).
 */
export function layoutHeapNodes(
  rawNodes: Omit<HeapVisualNode, "x" | "y">[]
): HeapVisualNode[] {
  if (rawNodes.length === 0) return [];

  function buildHeapDatum(index: number): InternalTreeDatum {
    const leftIdx = 2 * index + 1;
    const rightIdx = 2 * index + 2;
    const hasLeft = leftIdx < rawNodes.length;
    const hasRight = rightIdx < rawNodes.length;

    if (!hasLeft && !hasRight) {
      return { id: String(index) };
    }

    return {
      id: String(index),
      children: [
        hasLeft
          ? buildHeapDatum(leftIdx)
          : { id: `__ph_L_${index}`, isPlaceholder: true },
        hasRight
          ? buildHeapDatum(rightIdx)
          : { id: `__ph_R_${index}`, isPlaceholder: true },
      ],
    };
  }

  const rootHierarchy = hierarchy<InternalTreeDatum>(buildHeapDatum(0));
  const layout = tree<InternalTreeDatum>().nodeSize([112, 92]);
  const laidOut = layout(rootHierarchy);

  const coords = new Map<number, { x: number; y: number }>();
  let minX = 0;
  laidOut.each((d) => {
    if (!d.data.isPlaceholder) {
      if (d.x < minX) minX = d.x;
      coords.set(Number(d.data.id), { x: d.x, y: d.y });
    }
  });

  const offsetX = Math.abs(minX) + 64;
  const offsetY = 36;

  return rawNodes.map((node) => {
    const pos = coords.get(node.index) ?? { x: node.index * 90, y: 0 };
    return {
      ...node,
      x: Math.round(pos.x + offsetX),
      y: Math.round(pos.y + offsetY),
    };
  });
}

/**
 * Deterministic Graph layout (Part 7 & Part 15).
 * Computes layered BFS levels from the first vertex (or symmetric polygon ring for cyclic graphs)
 * keyed strictly by vertex IDs so positions NEVER jitter across execution steps.
 */
export function layoutGraphNodes(
  rawNodes: Omit<GraphVisualNode, "x" | "y">[],
  adjacency: Map<string, string[]>
): GraphVisualNode[] {
  if (rawNodes.length === 0) return [];

  const n = rawNodes.length;
  const sortedIds = rawNodes.map((v) => v.id);

  // Compute deterministic BFS layers starting from the first vertex
  const levelById = new Map<string, number>();
  const queue: string[] = [];

  for (const startId of sortedIds) {
    if (!levelById.has(startId)) {
      levelById.set(startId, 0);
      queue.push(startId);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currLvl = levelById.get(curr) ?? 0;
        const neighbors = adjacency.get(curr) ?? [];
        for (const nb of neighbors) {
          if (!levelById.has(nb)) {
            levelById.set(nb, currLvl + 1);
            queue.push(nb);
          }
        }
      }
    }
  }

  const maxLevel = Math.max(0, ...Array.from(levelById.values()));

  // Use clean layered layout when graph has >= 2 distinct depth layers and <= 4 nodes per layer
  const layers = new Map<number, string[]>();
  sortedIds.forEach((id) => {
    const lvl = levelById.get(id) ?? 0;
    const group = layers.get(lvl) ?? [];
    group.push(id);
    layers.set(lvl, group);
  });

  const maxLayerWidth = Math.max(
    1,
    ...Array.from(layers.values()).map((g) => g.length)
  );

  const coords = new Map<string, { x: number; y: number }>();

  if (maxLevel >= 2 && maxLayerWidth <= 4 && n <= 14) {
    const layerSpacingX = 195;
    const nodeSpacingY = 120;
    const centerY = 175;

    layers.forEach((ids, lvl) => {
      const count = ids.length;
      ids.forEach((id, idxInLayer) => {
        const offsetFromCenter = idxInLayer - (count - 1) / 2;
        coords.set(id, {
          x: Math.round(72 + lvl * layerSpacingX),
          y: Math.round(centerY + offsetFromCenter * nodeSpacingY),
        });
      });
    });
  } else {
    // Deterministic circular / elliptical layout
    const radiusX = Math.max(150, Math.min(260, n * 32));
    const radiusY = Math.max(125, Math.min(200, n * 25));
    const centerX = radiusX + 80;
    const centerY = radiusY + 60;

    sortedIds.forEach((id, idx) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * idx) / n;
      coords.set(id, {
        x: Math.round(centerX + radiusX * Math.cos(angle)),
        y: Math.round(centerY + radiusY * Math.sin(angle)),
      });
    });
  }

  return rawNodes.map((node) => {
    const pos = coords.get(node.id) ?? { x: 80, y: 80 };
    return {
      ...node,
      x: pos.x,
      y: pos.y,
    };
  });
}

/**
 * Deterministic D3 hierarchy layout for Recursive Call Trees (Part 11).
 */
export function layoutRecursionTreeNodes(
  rawNodes: Omit<RecursionTreeNode, "x" | "y">[]
): RecursionTreeNode[] {
  if (rawNodes.length === 0) return [];

  const childrenByParent = new Map<string | null, Omit<RecursionTreeNode, "x" | "y">[]>();
  rawNodes.forEach((node) => {
    const key = node.parentId ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(node);
    childrenByParent.set(key, list);
  });

  const roots = childrenByParent.get(null) ?? [rawNodes[0]];

  function buildRecDatum(node: Omit<RecursionTreeNode, "x" | "y">): InternalTreeDatum {
    const kids = childrenByParent.get(node.id) ?? [];
    return {
      id: node.id,
      children: kids.length > 0 ? kids.map(buildRecDatum) : undefined,
    };
  }

  const rootDatum: InternalTreeDatum =
    roots.length === 1
      ? buildRecDatum(roots[0])
      : {
          id: "__virtual_root__",
          isPlaceholder: true,
          children: roots.map(buildRecDatum),
        };

  const hRoot = hierarchy<InternalTreeDatum>(rootDatum);
  const layout = tree<InternalTreeDatum>().nodeSize([155, 96]);
  const laidOut = layout(hRoot);

  const coords = new Map<string, { x: number; y: number }>();
  let minX = 0;
  laidOut.each((d) => {
    if (!d.data.isPlaceholder) {
      if (d.x < minX) minX = d.x;
      coords.set(d.data.id, { x: d.x, y: d.y });
    }
  });

  const offsetX = Math.abs(minX) + 75;
  const offsetY = roots.length === 1 ? 36 : -40;

  return rawNodes.map((node) => {
    const pos = coords.get(node.id) ?? { x: 80, y: node.depth * 96 };
    return {
      ...node,
      x: Math.round(pos.x + offsetX),
      y: Math.round(pos.y + offsetY),
    };
  });
}

