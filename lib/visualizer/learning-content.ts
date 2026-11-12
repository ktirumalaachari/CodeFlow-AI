import type {
  ArrayVisualizationState,
  GraphVisualizationState,
  HashMapVisualizationState,
  HeapVisualizationState,
  LinkedListVisualizationState,
  QueueVisualizationState,
  ReconstructedStructureState,
  RecursionMemoryVisualizationState,
  StackVisualizationState,
  TreeVisualizationState,
  VisualizationStructureKind,
} from "@/types/visualizer";

export interface StructureOperationComplexity {
  operation: string;
  averageCase: string;
  worstCase?: string;
  assumption: string;
}

export interface StructureLearningGuide {
  kind: VisualizationStructureKind;
  title: string;
  tagline: string;
  definition: string;
  whenUsed: string[];
  operations: StructureOperationComplexity[];
  spaceComplexity: string;
  spaceAssumption: string;
  realWorldExamples: string[];
  pythonSnippet: string;
  keyTakeaways: string[];
}

export const STRUCTURE_LEARNING_GUIDES: Record<
  VisualizationStructureKind,
  StructureLearningGuide
> = {
  array: {
    kind: "array",
    title: "Arrays & Python Lists",
    tagline: "Contiguous indexed elements with O(1) random access by position.",
    definition:
      "A Python list acts as a dynamic array of object references stored sequentially in memory slots indexed from 0 to n - 1. Because index positions sit sequentially, Python computes the address of index i immediately without walking earlier elements.",
    whenUsed: [
      "Two-pointer scans, binary search on sorted sequences, and sliding windows",
      "Prefix sums, matrix grids (2D lists), and frequency tables",
      "Any ordered collection where reading by index nums[i] is frequent",
    ],
    operations: [
      {
        operation: "Index access nums[i]",
        averageCase: "O(1)",
        assumption: "Random index calculation inside allocated dynamic array.",
      },
      {
        operation: "Append at end .append(x)",
        averageCase: "O(1) amortized",
        worstCase: "O(n) resize",
        assumption: "CPython over-allocates capacity and copies only occasionally.",
      },
      {
        operation: "Insert / Delete at middle or front",
        averageCase: "O(n)",
        assumption: "All elements right of the index must shift one slot.",
      },
      {
        operation: "Linear scan / unsorted search",
        averageCase: "O(n)",
        assumption: "Requires checking elements one by one up to target.",
      },
    ],
    spaceComplexity: "O(n)",
    spaceAssumption: "Assumes n stored element references in the list buffer.",
    realWorldExamples: [
      "Image pixel grids, audio sample buffers, and tabular rows",
      "Sorted price/timestamp logs queried with binary search",
    ],
    pythonSnippet: `nums = [2, 5, 8, 11]
nums.append(15)   # O(1) amortized
nums.insert(1, 3) # O(n) shift right`,
    keyTakeaways: [
      "Changing elements at the end is fast; shifting from index 0 costs O(n).",
      "Two-pointer & sliding-window patterns reduce nested O(n²) loops down to O(n).",
    ],
  },
  stack: {
    kind: "stack",
    title: "Stack (LIFO)",
    tagline: "Last-In, First-Out: only the newest element on top is removed next.",
    definition:
      "A stack enforces Last-In, First-Out (LIFO) ordering: elements are pushed onto the top and popped back off from the same top end. Think of a stack of plates — only the top plate is immediately accessible.",
    whenUsed: [
      "Matching nested brackets, HTML tags, and expression parsing",
      "Undo/redo history, browser back-navigation, and monotonic stack problems",
      "Iterative DFS and Python's own function call stack",
    ],
    operations: [
      {
        operation: "Push .append(x)",
        averageCase: "O(1) amortized",
        assumption: "Appending to the top end of a Python list or deque.",
      },
      {
        operation: "Pop .pop()",
        averageCase: "O(1)",
        assumption: "Removing only the final element requires zero shifting.",
      },
      {
        operation: "Peek stack[-1]",
        averageCase: "O(1)",
        assumption: "Direct lookup of the top slot without mutating size.",
      },
      {
        operation: "Search for item x",
        averageCase: "O(n)",
        assumption: "Requires popping or scanning through n items.",
      },
    ],
    spaceComplexity: "O(n)",
    spaceAssumption: "Assumes up to n items simultaneously pushed on the stack.",
    realWorldExamples: [
      "Parentheses/syntax validation inside code editors and compilers",
      "Undo history stacks and function execution call frames",
    ],
    pythonSnippet: `stack = []
stack.append("(")  # Push onto top
top = stack[-1]    # Peek top -> "("
stack.pop()        # Pop top in O(1)`,
    keyTakeaways: [
      "Always guard stack[-1] or stack.pop() with an emptiness check first.",
      "Using Python list.append() and list.pop() avoids expensive left-shifting.",
    ],
  },
  queue: {
    kind: "queue",
    title: "Queue (FIFO)",
    tagline: "First-In, First-Out: items enter at the rear and leave from the front.",
    definition:
      "A queue enforces First-In, First-Out (FIFO) ordering, just like a waiting line. New elements enqueue at the rear, while dequeue always removes the oldest waiting element at the front.",
    whenUsed: [
      "Breadth-First Search (BFS) shortest-path exploration",
      "Task scheduling, request buffering, and rate-limited pipelines",
      "Tree level-order traversal",
    ],
    operations: [
      {
        operation: "Enqueue deque.append(x)",
        averageCase: "O(1)",
        assumption: "Using collections.deque doubly-linked block buffer.",
      },
      {
        operation: "Dequeue deque.popleft()",
        averageCase: "O(1)",
        assumption: "collections.deque pops from the front without shifting.",
      },
      {
        operation: "Front dequeue on list: list.pop(0)",
        averageCase: "O(n)",
        assumption: "Avoid list.pop(0) for large queues — it shifts every remaining item!",
      },
    ],
    spaceComplexity: "O(n)",
    spaceAssumption: "Assumes up to n queued elements waiting simultaneously.",
    realWorldExamples: [
      "Job queues (Celery/Redis), print spoolers, and chat message buffers",
      "Network router packet queues and BFS graph frontier traversal",
    ],
    pythonSnippet: `from collections import deque
q = deque(["A", "B"])
q.append("C")       # Enqueue at rear
first = q.popleft() # Dequeue from front in O(1)`,
    keyTakeaways: [
      "Prefer collections.deque over plain list when dequeuing from index 0.",
      "FIFO guarantees BFS explores all distance-k nodes before distance-(k+1).",
    ],
  },
  "linked-list": {
    kind: "linked-list",
    title: "Linked List",
    tagline: "Heap-allocated nodes chained dynamically via .next / .prev references.",
    definition:
      "Unlike contiguous arrays, a Linked List stores each element in its own Node object in heap memory alongside object pointers (.next, and optionally .prev) linking one node to the next. Nodes do not sit side by side in memory — identity matters!",
    whenUsed: [
      "O(1) splicing, insertion, or removal once you hold a node reference",
      "LRU Caches (Doubly Linked List + Hash Map) and deque implementations",
      "Two-pointer fast/slow cycle detection and in-place reversal interviews",
    ],
    operations: [
      {
        operation: "Access k-th node",
        averageCase: "O(n)",
        assumption: "Must walk k pointer hops sequentially from head.",
      },
      {
        operation: "Insert/Delete at head",
        averageCase: "O(1)",
        assumption: "Only updates head pointer and one .next link.",
      },
      {
        operation: "Insert/Delete after known node",
        averageCase: "O(1)",
        assumption: "Assumes pointer to predecessor (or target in doubly linked list) is held.",
      },
    ],
    spaceComplexity: "O(n)",
    spaceAssumption: "Stores n node objects plus 1 (singly) or 2 (doubly) reference pointers each.",
    realWorldExamples: [
      "Browser back/forward history and music playlist prev/next navigation",
      "CPython dict ordering & OS allocator free lists",
    ],
    pythonSnippet: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next`,
    keyTakeaways: [
      "Always save node.next before overwriting it during reversal so nodes aren't lost!",
      "Circular linked lists connect tail.next back to head (or an interior cycle entry).",
    ],
  },
  tree: {
    kind: "tree",
    title: "Binary Tree & BST",
    tagline: "Hierarchical parent-child nodes branching into left and right subtrees.",
    definition:
      "A Binary Tree links each node to at most two children (.left and .right). In a Binary Search Tree (BST), all values in every node's left subtree are strictly smaller, and all right-subtree values are larger — cutting search space at each decision.",
    whenUsed: [
      "Hierarchical data (AST syntax trees, file systems, JSON DOM)",
      "Ordered lookups, range queries, and sorted iteration via In-order traversal",
      "Divide-and-conquer recursive tree traversals",
    ],
    operations: [
      {
        operation: "BST Search / Insert",
        averageCase: "O(log n)",
        worstCase: "O(n) skewed",
        assumption: "Balanced BST gives height h ≈ log₂ n; degenerate chain gives h = n.",
      },
      {
        operation: "DFS / BFS Tree Traversal",
        averageCase: "O(n)",
        assumption: "Visits every node exactly once.",
      },
    ],
    spaceComplexity: "O(h) call stack + O(n) nodes",
    spaceAssumption: "Recursive traversal uses call stack depth equal to tree height h.",
    realWorldExamples: [
      "Python's Abstract Syntax Tree (AST) parsing your source code before tracing",
      "Database B-Tree indexes and expression evaluators",
    ],
    pythonSnippet: `def inorder(node):
    if not node:
        return
    inorder(node.left)
    visit(node.val)
    inorder(node.right)`,
    keyTakeaways: [
      "In-order traversal (Left → Node → Right) visits any valid BST in sorted ascending order.",
      "Pre-order copies tree structure; Post-order deletes children before parents.",
    ],
  },
  graph: {
    kind: "graph",
    title: "Graphs (BFS & DFS)",
    tagline: "Vertices connected by directed, undirected, or weighted edges.",
    definition:
      "A Graph G = (V, E) models pairwise relationships between vertices V via edges E. Adjacency lists ({node: [neighbors]}) store only actual edges cleanly in O(V + E) memory.",
    whenUsed: [
      "Shortest path in unweighted graphs (BFS) or weighted networks (Dijkstra)",
      "Dependency resolution, cycle detection, and connected components (DFS)",
      "Social networks, maps, package dependency graphs, and state machines",
    ],
    operations: [
      {
        operation: "BFS / DFS traversal",
        averageCase: "O(V + E)",
        assumption: "Adjacency list representation tracking a visited set to avoid loops.",
      },
      {
        operation: "Edge lookup (u → v)",
        averageCase: "O(deg(u))",
        assumption: "Scanning adjacency list of vertex u (O(1) if neighbors stored in set/dict).",
      },
    ],
    spaceComplexity: "O(V + E)",
    spaceAssumption: "Adjacency dictionary stores V vertex lists totaling E directed edges.",
    realWorldExamples: [
      "GPS routing algorithms, compiler control-flow graphs, and package resolvers",
      "Friend recommendations and web crawler link graphs",
    ],
    pythonSnippet: `visited = {start}
queue = deque([start])
while queue:
    u = queue.popleft()
    for v in graph[u]:
        if v not in visited:
            visited.add(v); queue.append(v)`,
    keyTakeaways: [
      "Without a visited set, cyclic graphs cause infinite loops!",
      "Mark neighbors visited BEFORE or WHEN pushing to BFS queue so duplicates never pile up.",
    ],
  },
  heap: {
    kind: "heap",
    title: "Min / Max Heap",
    tagline: "Complete binary tree packed inside a 0-indexed list for O(1) extremum peek.",
    definition:
      "A Binary Heap is a complete binary tree stored compactly in an array without node pointer objects: for node at index i, its children live at 2i + 1 and 2i + 2, and its parent sits at (i - 1) // 2. In a Min Heap, every parent <= children; Python's heapq implements a Min Heap.",
    whenUsed: [
      "Priority queues, Dijkstra's shortest path, and task schedulers",
      "Top-K largest/smallest elements and running median problems",
      "Event-driven simulations extracting the earliest scheduled timestamp",
    ],
    operations: [
      {
        operation: "Peek min/max heap[0]",
        averageCase: "O(1)",
        assumption: "Global minimum (or maximum) always sits at array index 0.",
      },
      {
        operation: "Push heapq.heappush / Pop heappop",
        averageCase: "O(log n)",
        assumption: "Sifts element up or down along tree height log₂ n.",
      },
      {
        operation: "Build heap heapq.heapify",
        averageCase: "O(n)",
        assumption: "Bottom-up Floyd sift-down runs in linear total work.",
      },
    ],
    spaceComplexity: "O(n)",
    spaceAssumption: "Single array buffer of length n — zero per-node object overhead.",
    realWorldExamples: [
      "OS thread priority schedulers and hospital ER triage queues",
      "Merging K sorted streams and network packet QoS queues",
    ],
    pythonSnippet: `import heapq
heap = [9, 4, 7, 1]
heapq.heapify(heap)   # O(n) -> root is 1
heapq.heappush(heap, 2)`,
    keyTakeaways: [
      "Only parent-child ordering is guaranteed — siblings or array indices > 0 need NOT be globally sorted!",
      "Python heapq provides a Min Heap; negate values (-x) when simulating a Max Heap.",
    ],
  },
  "hash-map": {
    kind: "hash-map",
    title: "Hash Map (Python dict)",
    tagline: "Logical key-value associations with amortized O(1) lookup by hashable key.",
    definition:
      "A Python dict maps unique keys (like ints, strings, or tuples) to values. Note: CODEFLOW AI displays your dictionary's logical insertion-ordered key-value state as Python maintains it — NOT CPython's internal sparse hash-slot memory array or collision probing table.",
    whenUsed: [
      "Two Sum complement lookups and deduplication / grouping",
      "Frequency counting, caching, and memoization (e.g. Fibonacci DP)",
      "Fast ID-to-record indexing in O(1) expected time",
    ],
    operations: [
      {
        operation: "Lookup / Insert / Delete d[k]",
        averageCase: "O(1) expected",
        worstCase: "O(n) adversarial hash collision",
        assumption: "Key hash computes quickly and bucket load factor stays bounded.",
      },
      {
        operation: "Iterate items()",
        averageCase: "O(n)",
        assumption: "Python 3.7+ preserves insertion order across n entries.",
      },
    ],
    spaceComplexity: "O(n)",
    spaceAssumption: "Stores n logical key-value associations plus hash table load factor slack.",
    realWorldExamples: [
      "Symbol tables in Python frames (globals() / locals() are dicts!)",
      "API response caches, configuration maps, and memoized DP tables",
    ],
    pythonSnippet: `seen = {}
seen[4] = 0        # Insert key 4 -> 0
if 4 in seen:      # O(1) average lookup
    idx = seen[4]`,
    keyTakeaways: [
      "Only immutable/hashable keys (int, str, tuple of immutables) can be dictionary keys — lists cannot.",
      "Using a dict memo turns exponential O(2ⁿ) naive Fibonacci recursion into O(n).",
    ],
  },
  "recursion-memory": {
    kind: "recursion-memory",
    title: "Recursion Call Stack & Object References",
    tagline: "Live call frame stack, recursive call tree, and ref#N Python reference bindings.",
    definition:
      "Each active Python function invocation creates its own stack frame holding local variable bindings. Assigning b = a binds another variable name to the exact same object ID (ref#N) rather than copying the underlying data. Note: ref#N is CODEFLOW AI's educational object-identity view of live runtime data, not CPython C-struct heap addresses.",
    whenUsed: [
      "Understanding recursive call winding and return-value unwinding",
      "Debugging shared mutable reference bugs (aliasing two variables to the same list)",
      "Tracking divide-and-conquer depth and base-case termination",
    ],
    operations: [
      {
        operation: "Frame Push / Pop",
        averageCase: "O(1) per call/return",
        assumption: "Python pushes a frame object on entry and unwinds it on return or exception.",
      },
      {
        operation: "Alias Assignment b = a",
        averageCase: "O(1)",
        assumption: "Rebinds reference without duplicating elements inside a.",
      },
    ],
    spaceComplexity: "O(d)",
    spaceAssumption: "Call stack consumes memory proportional to maximum active recursion depth d.",
    realWorldExamples: [
      "Recursive tree/graph traversals, backtracking, and divide-and-conquer sorting",
      "Diagnosing accidental in-place mutation across caller/callee shared lists",
    ],
    pythonSnippet: `def factorial(n):
    if n <= 1:
        return 1       # Base case unwinds stack
    return n * factorial(n - 1)`,
    keyTakeaways: [
      "Every recursive function needs a reachable base case so call frames unwind cleanly.",
      "When two variables share the same ref#N tag, mutating via one changes what both see!",
    ],
  },
  unsupported: {
    kind: "unsupported",
    title: "Custom Python Object",
    tagline: "Inspect arbitrary object attributes cleanly in the Variable Inspector.",
    definition:
      "Custom classes that don't expose standard Linked List (.next) or Binary Tree (.left/.right) node contracts are displayed with their runtime type and object identity.",
    whenUsed: [
      "Domain models, records, dataclasses, and stateful helper objects",
    ],
    operations: [
      {
        operation: "Attribute Access obj.attr",
        averageCase: "O(1) expected",
        assumption: "Dictionary or __slots__ attribute lookup on the instance.",
      },
    ],
    spaceComplexity: "O(a)",
    spaceAssumption: "Proportional to number of bound instance attributes a.",
    realWorldExamples: ["Dataclasses, geometric points, state wrappers"],
    pythonSnippet: `class Point:
    def __init__(self, x, y):
        self.x = x; self.y = y`,
    keyTakeaways: [
      "Expand the object inside the Variable Inspector to see every live field and ref#N ID.",
    ],
  },
};

/**
 * Generates contextual, beginner-friendly step-specific Learning Mode commentary
 * anchored in the currently reconstructed structure snapshot.
 */
export function buildStepLearningCommentary(
  state: ReconstructedStructureState | null
): string | null {
  if (!state) return null;

  switch (state.kind) {
    case "array": {
      const s = state as ArrayVisualizationState;
      const ptrDesc =
        s.pointers.length > 0
          ? ` Active index pointer${s.pointers.length > 1 ? "s" : ""}: ${s.pointers
              .map((p) => `${p.name}=${p.index}`)
              .join(", ")}.`
          : "";
      return `List '${s.variableName}' currently holds ${s.length} element${
        s.length === 1 ? "" : "s"
      }.${ptrDesc}${s.operationSummary ? ` ${s.operationSummary}.` : ""}`;
    }
    case "stack": {
      const s = state as StackVisualizationState;
      const topItem = s.items[s.items.length - 1];
      return `Stack '${s.variableName}' has ${s.items.length} item${
        s.items.length === 1 ? "" : "s"
      }${topItem ? ` (top is ${topItem.display})` : " (currently empty)"}. LIFO only touches the top end in O(1) time.`;
    }
    case "queue": {
      const s = state as QueueVisualizationState;
      const front = s.items[0];
      const rear = s.items[s.items.length - 1];
      return `Queue '${s.variableName}' contains ${s.items.length} waiting item${
        s.items.length === 1 ? "" : "s"
      }${
        front ? ` (front: ${front.display}, rear: ${rear?.display})` : ""
      }. FIFO removes from front and adds at rear.`;
    }
    case "linked-list": {
      const s = state as LinkedListVisualizationState;
      return `${
        s.variant === "doubly"
          ? "Doubly"
          : s.variant === "circular"
          ? "Circular"
          : "Singly"
      } Linked List rooted at '${s.variableName}' contains ${
        s.nodes.length
      } linked node${s.nodes.length === 1 ? "" : "s"} connected by object references.`;
    }
    case "tree": {
      const s = state as TreeVisualizationState;
      return `${
        s.isBinarySearchTree ? "Binary Search Tree (BST)" : "Binary Tree"
      } rooted at '${s.variableName}' has ${s.nodes.length} node${
        s.nodes.length === 1 ? "" : "s"
      }.${
        s.traversalSequence.length > 0
          ? ` Recorded ${s.traversalTypeLabel}: [${s.traversalSequence.join(", ")}].`
          : ""
      }`;
    }
    case "graph": {
      const s = state as GraphVisualizationState;
      return `${s.isDirected ? "Directed" : "Undirected"}${
        s.isWeighted ? " weighted" : ""
      } Graph '${s.variableName}' (${s.nodes.length} vertices, ${
        s.edges.length
      } edges) · ${s.visitedOrder.length}/${s.nodes.length} visited.`;
    }
    case "heap": {
      const s = state as HeapVisualizationState;
      const root = s.nodes[0];
      return `${s.variant === "max" ? "Max" : "Min"} Heap '${
        s.variableName
      }' has ${s.nodes.length} element${s.nodes.length === 1 ? "" : "s"}${
        root ? ` (root = ${root.valueDisplay})` : ""
      }. Heap property: ${
        s.heapPropertySatisfied
          ? "satisfied across all parent-child pairs."
          : "currently rebalancing."
      }`;
    }
    case "hash-map": {
      const s = state as HashMapVisualizationState;
      return `Dictionary '${s.variableName}' maps ${s.entries.length} unique key${
        s.entries.length === 1 ? "" : "s"
      }. Logical key-value entries shown below (amortized O(1) lookup).`;
    }
    case "recursion-memory": {
      const s = state as RecursionMemoryVisualizationState;
      return `${s.activeFrames.length} active stack frame${
        s.activeFrames.length === 1 ? "" : "s"
      } (max depth reached so far: ${s.maxDepthReached}), ${
        s.callTreeNodes.length
      } call node${s.callTreeNodes.length === 1 ? "" : "s"} recorded, ${
        s.memoryBindings.length
      } heap reference binding${s.memoryBindings.length === 1 ? "" : "s"}.`;
    }
    case "unsupported":
      return state.reason;
  }
}

