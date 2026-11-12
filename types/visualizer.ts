import type {
  CallStackFrameItem,
  StructuredValueNode,
  TraceStep,
  VariableScopeType,
} from "@/types/api";

export type WorkspaceViewMode = "code" | "visualize" | "split";

export type VisualizationStructureKind =
  | "array"
  | "stack"
  | "queue"
  | "linked-list"
  | "tree"
  | "graph"
  | "heap"
  | "hash-map"
  | "recursion-memory"
  | "unsupported";

export type VisualizationOperationType =
  | "create"
  | "access"
  | "insert"
  | "delete"
  | "append"
  | "pop"
  | "update"
  | "iterate"
  | "search"
  | "swap"
  | "push"
  | "peek"
  | "enqueue"
  | "dequeue"
  | "link"
  | "unlink"
  | "traverse"
  | "heapify"
  | "extract"
  | "lookup"
  | "call"
  | "return";

export interface VisualizationEvent {
  id: string;
  step: number;
  line: number;
  variable: string;
  structure: VisualizationStructureKind;
  operation: VisualizationOperationType;
  index?: number;
  secondaryIndex?: number;
  key?: string;
  nodeId?: string;
  previousValue?: unknown;
  currentValue?: unknown;
  pointerName?: string;
  summary: string;
}

export interface DetectedStructureDescriptor {
  id: string;
  variableName: string;
  scope: VariableScopeType | "runtime";
  kind: VisualizationStructureKind;
  title: string;
  subtitle: string;
  objectId?: string | null;
  priority: number;
}

export interface ArrayPointerMarker {
  name: string;
  index: number;
  role: "left" | "right" | "mid" | "iterator" | "boundary";
  previousIndex?: number | null;
}

export interface ArrayCellItem {
  index: number;
  display: string;
  typeName: string;
  status: "default" | "active" | "inserted" | "updated" | "swapped" | "searched";
  previousDisplay?: string | null;
  pointers: ArrayPointerMarker[];
}

export interface ArrayVisualizationState {
  kind: "array";
  variableName: string;
  typeName: string;
  objectId?: string | null;
  length: number;
  truncated: boolean;
  cells: ArrayCellItem[];
  pointers: ArrayPointerMarker[];
  removedItems: { index: number; display: string }[];
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
  is2DMatrix?: boolean;
  matrixRows?: {
    rowIndex: number;
    cells: { colIndex: number; display: string; isActive: boolean }[];
  }[];
}

export interface StackVisualizationItem {
  index: number;
  display: string;
  typeName: string;
  isTop: boolean;
  status: "default" | "pushed" | "peeked" | "updated";
}

export interface StackVisualizationState {
  kind: "stack";
  variableName: string;
  backingType: string;
  objectId?: string | null;
  items: StackVisualizationItem[];
  poppedItem?: { display: string; index: number } | null;
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface QueueVisualizationItem {
  index: number;
  display: string;
  typeName: string;
  isFront: boolean;
  isRear: boolean;
  status: "default" | "enqueued" | "peeked" | "updated";
}

export interface QueueVisualizationState {
  kind: "queue";
  variableName: string;
  backingType: string;
  objectId?: string | null;
  items: QueueVisualizationItem[];
  dequeuedItem?: { display: string } | null;
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export type LinkedListVariant = "singly" | "doubly" | "circular";

export interface LinkedListVisualNode {
  id: string;
  objectId: string;
  className: string;
  valueDisplay: string;
  nextId: string | null;
  prevId: string | null;
  isHead: boolean;
  isTail: boolean;
  isCycleTarget: boolean;
  pointers: string[];
  status: "default" | "active" | "inserted" | "modified" | "removed";
  x: number;
  y: number;
}

export interface LinkedListVisualEdge {
  id: string;
  source: string;
  target: string;
  kind: "next" | "prev" | "circular";
  label?: string;
  isUpdated?: boolean;
}

export interface LinkedListVisualizationState {
  kind: "linked-list";
  variableName: string;
  variant: LinkedListVariant;
  nodes: LinkedListVisualNode[];
  edges: LinkedListVisualEdge[];
  removedNodes: { objectId: string; valueDisplay: string }[];
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface TreeVisualNode {
  id: string;
  objectId: string;
  className: string;
  valueDisplay: string;
  numericValue?: number | null;
  leftId: string | null;
  rightId: string | null;
  parentId: string | null;
  depth: number;
  isRoot: boolean;
  isActive: boolean;
  isOnSearchPath: boolean;
  status: "default" | "active" | "inserted" | "visited" | "search-path";
  pointers: string[];
  traversalOrderIndex?: number | null;
  x: number;
  y: number;
}

export interface TreeVisualEdge {
  id: string;
  source: string;
  target: string;
  branch: "left" | "right";
  isHighlighted: boolean;
}

export interface TreeVisualizationState {
  kind: "tree";
  variableName: string;
  isBinarySearchTree: boolean;
  nodes: TreeVisualNode[];
  edges: TreeVisualEdge[];
  traversalSequence: string[];
  traversalTypeLabel: string;
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface GraphVisualNode {
  id: string;
  label: string;
  isCurrent: boolean;
  isVisited: boolean;
  visitOrder?: number | null;
  inFrontier: boolean;
  x: number;
  y: number;
}

export interface GraphVisualEdge {
  id: string;
  source: string;
  target: string;
  weight?: string | null;
  isDirected: boolean;
  isTraversed: boolean;
  isActiveEdge: boolean;
}

export interface GraphVisualizationState {
  kind: "graph";
  variableName: string;
  isDirected: boolean;
  isWeighted: boolean;
  algorithmMode: "bfs" | "dfs" | "general";
  nodes: GraphVisualNode[];
  edges: GraphVisualEdge[];
  visitedOrder: string[];
  frontierItems: string[];
  frontierLabel: string;
  activeNodeId?: string | null;
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface HeapVisualNode {
  index: number;
  id: string;
  valueDisplay: string;
  numericValue?: number | null;
  parentIndex: number | null;
  leftIndex: number | null;
  rightIndex: number | null;
  depth: number;
  status: "default" | "root" | "inserted" | "swapped" | "active";
  violatesHeap?: boolean;
  x: number;
  y: number;
}

export interface HeapVisualizationState {
  kind: "heap";
  variableName: string;
  variant: "min" | "max";
  heapPropertySatisfied: boolean;
  nodes: HeapVisualNode[];
  arrayCells: ArrayCellItem[];
  extractedValue?: string | null;
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface HashMapEntryItem {
  key: string;
  valueDisplay: string;
  valueType: string;
  objectId?: string | null;
  status: "default" | "inserted" | "updated" | "deleted" | "lookup";
  previousValueDisplay?: string | null;
}

export interface HashMapVisualizationState {
  kind: "hash-map";
  variableName: string;
  typeName: string;
  objectId?: string | null;
  entries: HashMapEntryItem[];
  deletedEntries: { key: string; previousValueDisplay: string }[];
  activeKey?: string | null;
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface RecursionTreeNode {
  id: string;
  functionName: string;
  argsDisplay: string;
  depth: number;
  callStep: number;
  returnStep?: number | null;
  returnValue?: string | null;
  status: "active" | "pending-child" | "completed";
  parentId: string | null;
  x: number;
  y: number;
}

export interface MemoryReferenceBinding {
  variableName: string;
  scope: string;
  frameName: string;
  objectId: string;
  typeName: string;
  display: string;
  isSharedAlias: boolean;
}

export interface RecursionMemoryVisualizationState {
  kind: "recursion-memory";
  variableName: string;
  activeFrames: CallStackFrameItem[];
  maxDepthReached: number;
  callTreeNodes: RecursionTreeNode[];
  memoryBindings: MemoryReferenceBinding[];
  activeOperation?: VisualizationOperationType;
  operationSummary?: string;
}

export interface UnsupportedVisualizationState {
  kind: "unsupported";
  variableName: string;
  typeName: string;
  display: string;
  reason: string;
}

export type ReconstructedStructureState =
  | ArrayVisualizationState
  | StackVisualizationState
  | QueueVisualizationState
  | LinkedListVisualizationState
  | TreeVisualizationState
  | GraphVisualizationState
  | HeapVisualizationState
  | HashMapVisualizationState
  | RecursionMemoryVisualizationState
  | UnsupportedVisualizationState;

export interface SnapshotVisualizationBundle {
  stepNumber: number;
  line: number;
  detectedStructures: DetectedStructureDescriptor[];
  activeStructureId: string | null;
  activeState: ReconstructedStructureState | null;
  allStatesById: Record<string, ReconstructedStructureState>;
  stepEvents: VisualizationEvent[];
  currentStep: TraceStep;
}

