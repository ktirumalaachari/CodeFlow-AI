import type {
  AlgorithmCategory,
  AlgorithmCatalogItem,
  CodeProject,
  ComparisonScenario,
  LanguageRoadmapItem,
  LearningLesson,
  LearningTrack,
  NotificationItem,
  QuickStartTopic,
} from "@/types";

export const ALGORITHM_CATEGORIES: readonly ("All" | AlgorithmCategory)[] = [
  "All",
  "Searching",
  "Sorting",
  "Two Pointers",
  "Sliding Window",
  "Recursion",
  "Stack & Queue",
  "Linked Lists",
  "Trees & Graphs",
  "Dynamic Programming",
] as const;

export const QUICK_START_TOPICS: QuickStartTopic[] = [
  {
    slug: "python-basics",
    title: "Python Basics",
    subtitle: "Variables, control flow, loops, and stack frame basics",
    difficulty: "Beginner",
    accent: "emerald",
    concepts: ["Variables", "Conditionals", "For/While Loops"],
    estimatedMinutes: 15,
    targetRoute: "/learn?topic=python-basics",
    sampleCodeTitle: "FizzBuzz & Loop Accumulator",
  },
  {
    slug: "arrays",
    title: "Arrays",
    subtitle: "Contiguous indexing, prefix sums, and in-place mutations",
    difficulty: "Beginner",
    accent: "indigo",
    concepts: ["Indexing", "Prefix Sum", "In-Place Swap"],
    estimatedMinutes: 20,
    targetRoute: "/learn?topic=arrays",
    sampleCodeTitle: "Prefix Sum Builder",
  },
  {
    slug: "two-pointers",
    title: "Two Pointers",
    subtitle: "Converging & fast-slow indices across sorted sequences",
    difficulty: "Beginner",
    accent: "amber",
    concepts: ["Left/Right Convergence", "Deduplication", "Partitioning"],
    estimatedMinutes: 25,
    targetRoute: "/workspace?sample=two-pointers",
    sampleCodeTitle: "Sorted Pair Target Sum",
  },
  {
    slug: "sliding-window",
    title: "Sliding Window",
    subtitle: "Dynamic subarray bounds with O(1) incremental state updates",
    difficulty: "Intermediate",
    accent: "indigo",
    concepts: ["Fixed Window", "Variable Window", "Frequency Map"],
    estimatedMinutes: 30,
    targetRoute: "/workspace?sample=sliding-window",
    sampleCodeTitle: "Longest Unique Substring",
  },
  {
    slug: "hash-maps",
    title: "Hash Maps",
    subtitle: "Key-value lookups, complement tracking, and frequency tables",
    difficulty: "Beginner",
    accent: "violet",
    concepts: ["O(1) Lookup", "Complement Search", "Grouping"],
    estimatedMinutes: 20,
    targetRoute: "/learn?topic=hash-maps",
    sampleCodeTitle: "Two Sum Complement Map",
  },
  {
    slug: "linked-lists",
    title: "Linked Lists",
    subtitle: "Node references, pointer rewiring, and cycle detection",
    difficulty: "Intermediate",
    accent: "emerald",
    concepts: ["Next Pointer", "In-Place Reversal", "Floyd Cycle"],
    estimatedMinutes: 30,
    targetRoute: "/learn?topic=linked-lists",
    sampleCodeTitle: "Iterative Pointer Reversal",
  },
  {
    slug: "binary-trees",
    title: "Binary Trees",
    subtitle: "Hierarchical nodes, DFS traversals, and level-order BFS",
    difficulty: "Intermediate",
    accent: "amber",
    concepts: ["Inorder/Postorder", "Subtree Height", "BFS Queue"],
    estimatedMinutes: 35,
    targetRoute: "/algorithms?category=Trees+%26+Graphs",
    sampleCodeTitle: "Maximum Binary Tree Depth",
  },
  {
    slug: "graphs",
    title: "Graphs",
    subtitle: "Adjacency lists, visited sets, shortest paths, and topological order",
    difficulty: "Advanced",
    accent: "rose",
    concepts: ["BFS Frontier", "DFS Component", "Visited State"],
    estimatedMinutes: 45,
    targetRoute: "/algorithms?category=Trees+%26+Graphs",
    sampleCodeTitle: "Breadth-First Shortest Path",
  },
  {
    slug: "recursion",
    title: "Recursion",
    subtitle: "Call stack frames, base cases, and unwinding return values",
    difficulty: "Intermediate",
    accent: "violet",
    concepts: ["Call Stack", "Base Case", "Memoization"],
    estimatedMinutes: 30,
    targetRoute: "/workspace?sample=recursion",
    sampleCodeTitle: "Recursive Call Tree Trace",
  },
];

export const INITIAL_LOCAL_PROJECTS: CodeProject[] = [
  {
    id: "proj-two-pointers",
    name: "Two Pointers — Sorted Pair Target",
    description: "Converging left and right index pointers eliminating nested O(n²) scans.",
    language: "python",
    topicSlug: "two-pointers",
    lastModifiedIso: "2026-11-07T14:20:00.000Z",
    createdAtIso: "2026-11-05T10:15:00.000Z",
    status: "Ready",
    isDemoSeed: true,
    codePreview: `nums = [2, 5, 8, 11, 15]
target = 16
left = 0
right = len(nums) - 1
matched_pair = (-1, -1)

while left < right:
    current_sum = nums[left] + nums[right]
    if current_sum == target:
        matched_pair = (left, right)
        break
    elif current_sum < target:
        left += 1
    else:
        right -= 1

print("Matched indices:", matched_pair)`,
  },
  {
    id: "proj-sliding-window",
    name: "Sliding Window — Max Subarray Sum (k=3)",
    description: "Maintain a rolling window sum in O(1) per step by adding entering and subtracting leaving elements.",
    language: "python",
    topicSlug: "sliding-window",
    lastModifiedIso: "2026-11-06T18:45:00.000Z",
    createdAtIso: "2026-11-04T09:00:00.000Z",
    status: "Template",
    isDemoSeed: true,
    codePreview: `nums = [4, 2, 1, 7, 8, 1, 2, 8]
k = 3
window_sum = sum(nums[:k])
max_sum = window_sum

for right in range(k, len(nums)):
    left = right - k
    window_sum += nums[right] - nums[left]
    if window_sum > max_sum:
        max_sum = window_sum

print("Maximum sum of window k=3:", max_sum)`,
  },
  {
    id: "proj-recursion-stack",
    name: "Recursive Call Stack — Factorial Trace",
    description: "Inspect call frame allocation on recursive descent and return value propagation on unwind.",
    language: "python",
    topicSlug: "recursion",
    lastModifiedIso: "2026-11-05T11:30:00.000Z",
    createdAtIso: "2026-11-02T16:20:00.000Z",
    status: "Draft",
    isDemoSeed: true,
    codePreview: `def factorial(n: int) -> int:
    if n <= 1:
        return 1
    sub_result = factorial(n - 1)
    return n * sub_result

answer = factorial(4)
print("4! =", answer)`,
  },
  {
    id: "proj-binary-search",
    name: "Binary Search — Halving Search Interval",
    description: "Track low, mid, and high boundaries across logarithmic interval halving.",
    language: "python",
    topicSlug: "sorting",
    lastModifiedIso: "2026-11-03T20:10:00.000Z",
    createdAtIso: "2026-11-01T12:00:00.000Z",
    status: "Ready",
    isDemoSeed: true,
    codePreview: `nums = [3, 9, 14, 21, 29, 36, 44]
target = 29
low = 0
high = len(nums) - 1
found_index = -1

while low <= high:
    mid = (low + high) // 2
    if nums[mid] == target:
        found_index = mid
        break
    elif nums[mid] < target:
        low = mid + 1
    else:
        high = mid - 1

print("Found index:", found_index)`,
  },
];

export const ALGORITHM_CATALOG: AlgorithmCatalogItem[] = [
  // 1. Searching
  {
    id: "alg_linear_search",
    slug: "linear-search",
    title: "Linear Search (Sequential Scan)",
    category: "Searching",
    difficulty: "Beginner",
    timeComplexity: "O(n)",
    bestTimeComplexity: "O(1)",
    worstTimeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    complexityAssumption: "Works on any unsorted or sorted sequence without preprocessing.",
    summary: "Scans each index sequentially from left to right until the target element is matched or the array ends.",
    keyInsight: "Only algorithm capable of searching arbitrary unsorted arrays in a single pass without auxiliary memory.",
    howItWorksSteps: [
      "Start index i = 0 at the left boundary of the list.",
      "Compare items[i] against target at each step.",
      "Stop immediately and record i on match, or advance i += 1 until len(items).",
    ],
    codeExample: `items = [18, 42, 7, 91, 23, 56]
target = 23
found_at = -1

for i in range(len(items)):
    if items[i] == target:
        found_at = i
        break

print("Target found at index:", found_at)`,
    sampleSlug: "linear-search",
    tutorTopicSlug: "arrays-strings",
    comparisonScenarioId: "cmp_binary_vs_linear",
  },
  {
    id: "alg_binary_search",
    slug: "binary-search",
    title: "Binary Search (Logarithmic Halving)",
    category: "Searching",
    difficulty: "Beginner",
    timeComplexity: "O(log n)",
    bestTimeComplexity: "O(1)",
    worstTimeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    bruteForceComplexity: "O(n)",
    complexityAssumption: "Requires a sorted array (or a monotonic predicate over the search space).",
    summary: "Halves a monotonic search interval on every comparison by inspecting the midpoint index.",
    keyInsight: "Watch low, mid, and high pointers collapse the active search range by 50% on every loop iteration.",
    howItWorksSteps: [
      "Initialize low = 0 and high = len(nums) - 1.",
      "Compute midpoint mid = (low + high) // 2.",
      "If nums[mid] < target, discard left half (low = mid + 1); if nums[mid] > target, discard right half (high = mid - 1).",
    ],
    codeExample: `nums = [3, 9, 14, 21, 29, 36, 44]
target = 29
low = 0
high = len(nums) - 1
found_index = -1

while low <= high:
    mid = (low + high) // 2
    if nums[mid] == target:
        found_index = mid
        break
    elif nums[mid] < target:
        low = mid + 1
    else:
        high = mid - 1

print("Found index:", found_index)`,
    sampleSlug: "binary-search",
    tutorTopicSlug: "binary-search",
    comparisonScenarioId: "cmp_binary_vs_linear",
  },

  // 2. Sorting
  {
    id: "alg_merge_sort",
    slug: "merge-sort-divide-conquer",
    title: "Merge Sort (Divide & Conquer)",
    category: "Sorting",
    difficulty: "Intermediate",
    timeComplexity: "O(n log n)",
    bestTimeComplexity: "O(n log n)",
    worstTimeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    bruteForceComplexity: "O(n²)",
    complexityAssumption: "Allocates O(n) temporary slices during the two-finger merge phase.",
    summary: "Recursively bisects arrays to singletons and merges sorted halves in guaranteed O(n log n) time.",
    keyInsight: "Every recursion tree depth performs O(n) total two-finger merge comparisons across log2(n) levels.",
    howItWorksSteps: [
      "Base case: an array of length 0 or 1 is already sorted.",
      "Split array at mid = len(arr) // 2 and recursively sort left and right halves.",
      "Merge the two sorted halves using two pointers i and j comparing front elements.",
    ],
    codeExample: `def merge_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    return merged + left[i:] + right[j:]

print("Sorted:", merge_sort([38, 27, 43, 3, 9, 82]))`,
    sampleSlug: "merge-sort",
    tutorTopicSlug: "sorting",
  },
  {
    id: "alg_quick_sort",
    slug: "quick-sort-partition",
    title: "Quick Sort (In-Place Pivot Partition)",
    category: "Sorting",
    difficulty: "Intermediate",
    timeComplexity: "O(n log n)",
    bestTimeComplexity: "O(n log n)",
    worstTimeComplexity: "O(n²)",
    spaceComplexity: "O(log n)",
    bruteForceComplexity: "O(n²)",
    complexityAssumption: "Average O(n log n) with balanced pivots; degrades to O(n²) if pivot is extremum every step.",
    summary: "Partitions elements around a pivot so smaller items precede it and larger items follow it, then sorts partitions.",
    keyInsight: "After partitioning around pivot p, the pivot element is locked into its final globally sorted index.",
    howItWorksSteps: [
      "Choose a pivot element (e.g., high index).",
      "Partition subarray [low..high] so elements <= pivot move left of store_index.",
      "Swap pivot into store_index and recursively sort left and right subarrays.",
    ],
    codeExample: `def quick_sort(arr: list[int], low: int, high: int) -> None:
    if low < high:
        pivot = arr[high]
        i = low - 1
        for j in range(low, high):
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        p = i + 1
        quick_sort(arr, low, p - 1)
        quick_sort(arr, p + 1, high)

nums = [10, 7, 8, 9, 1, 5]
quick_sort(nums, 0, len(nums) - 1)
print("Quick sorted:", nums)`,
    sampleSlug: "quick-sort",
    tutorTopicSlug: "sorting",
  },

  // 3. Two Pointers
  {
    id: "alg_converging_pointers",
    slug: "container-two-pointers",
    title: "Converging Two Pointers (Sorted Pair Sum)",
    category: "Two Pointers",
    difficulty: "Beginner",
    timeComplexity: "O(n)",
    bestTimeComplexity: "O(1)",
    worstTimeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    bruteForceComplexity: "O(n²)",
    complexityAssumption: "Requires sorted input so moving left increases sum and moving right decreases sum.",
    summary: "Eliminates nested O(n²) loops by converging left and right boundary pointers inward in a single pass.",
    keyInsight: "Each comparison rules out an entire row or column of pairs in the n×n search matrix.",
    howItWorksSteps: [
      "Place left = 0 at the smallest element and right = len(nums) - 1 at the largest.",
      "Compute current_sum = nums[left] + nums[right].",
      "If current_sum < target, increment left; if current_sum > target, decrement right.",
    ],
    codeExample: `nums = [2, 5, 8, 11, 15]
target = 16
left = 0
right = len(nums) - 1
matched_pair = (-1, -1)

while left < right:
    current_sum = nums[left] + nums[right]
    if current_sum == target:
        matched_pair = (left, right)
        break
    elif current_sum < target:
        left += 1
    else:
        right -= 1

print("Matched indices:", matched_pair)`,
    sampleSlug: "two-pointers",
    tutorTopicSlug: "two-pointers",
    comparisonScenarioId: "cmp_two_sum",
  },

  // 4. Sliding Window
  {
    id: "alg_sliding_window_max",
    slug: "sliding-window-subarray",
    title: "Fixed & Dynamic Sliding Window",
    category: "Sliding Window",
    difficulty: "Intermediate",
    timeComplexity: "O(n)",
    bestTimeComplexity: "O(n)",
    worstTimeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    bruteForceComplexity: "O(n * k)",
    complexityAssumption: "Each index enters and leaves the window at most once.",
    summary: "Maintains a rolling subarray aggregate in O(1) per shift instead of rescanning k elements.",
    keyInsight: "Adding nums[right] and subtracting nums[right - k] updates the window sum in two arithmetic operations.",
    howItWorksSteps: [
      "Compute initial sum of the first k elements nums[:k].",
      "Slide right from k to len(nums) - 1.",
      "Update window_sum += nums[right] - nums[right - k] and track max_sum.",
    ],
    codeExample: `nums = [4, 2, 1, 7, 8, 1, 2, 8]
k = 3
window_sum = sum(nums[:k])
max_sum = window_sum

for right in range(k, len(nums)):
    left = right - k
    window_sum += nums[right] - nums[left]
    if window_sum > max_sum:
        max_sum = window_sum

print("Maximum sum of window k=3:", max_sum)`,
    sampleSlug: "sliding-window",
    tutorTopicSlug: "sliding-window",
    comparisonScenarioId: "cmp_max_subarray_k",
  },

  // 5. Recursion
  {
    id: "alg_recursion_call_stack",
    slug: "recursive-backtracking",
    title: "Recursive Call Stack & Frame Unwinding",
    category: "Recursion",
    difficulty: "Beginner",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    complexityAssumption: "Allocates one call stack frame per recursive call up to depth n.",
    summary: "Breaks a problem into self-similar subproblems until a base case returns and unwinds the call stack.",
    keyInsight: "Each frame suspends its local variables on the stack until its child call returns a value.",
    howItWorksSteps: [
      "Check the base case (n <= 1) first to stop infinite recursion.",
      "Push a new stack frame for factorial(n - 1).",
      "Multiply n * sub_result as each frame unwinds in LIFO order.",
    ],
    codeExample: `def factorial(n: int) -> int:
    if n <= 1:
        return 1
    sub_result = factorial(n - 1)
    return n * sub_result

answer = factorial(4)
print("4! =", answer)`,
    sampleSlug: "recursion",
    tutorTopicSlug: "recursion",
  },
  {
    id: "alg_recursion_tree_fib",
    slug: "recursion-call-tree",
    title: "Branching Recursion Call Tree (Fibonacci)",
    category: "Recursion",
    difficulty: "Intermediate",
    timeComplexity: "O(2^n)",
    spaceComplexity: "O(n)",
    bruteForceComplexity: "O(2^n)",
    complexityAssumption: "Unmemoized binary branching visits O(2^n) nodes with maximum stack height O(n).",
    summary: "Visualizes how two recursive calls per frame create an exponential binary call tree with overlapping subproblems.",
    keyInsight: "Notice how fib(2) and fib(1) are recomputed across multiple branches—motivating Memoization and DP.",
    howItWorksSteps: [
      "Return n directly for base cases n == 0 or n == 1.",
      "Branch left to compute fib(n - 1) completely before branching right for fib(n - 2).",
      "Sum left and right subtree return values.",
    ],
    codeExample: `def fib(n: int) -> int:
    if n <= 1:
        return n
    left = fib(n - 1)
    right = fib(n - 2)
    return left + right

result = fib(4)
print("fib(4) =", result)`,
    sampleSlug: "recursion-tree",
    tutorTopicSlug: "recursion",
    comparisonScenarioId: "cmp_fibonacci",
  },

  // 6. Stack & Queue
  {
    id: "alg_stack_lifo",
    slug: "stack-lifo-operations",
    title: "Stack (LIFO Push, Pop & Top Inspection)",
    category: "Stack & Queue",
    difficulty: "Beginner",
    timeComplexity: "O(1)",
    spaceComplexity: "O(n)",
    complexityAssumption: "Amortized O(1) append() and pop() at the tail of a Python list.",
    summary: "Last-In, First-Out (LIFO) linear structure used for bracket validation, undo history, and iterative DFS.",
    keyInsight: "All insertions and removals occur at the top (end) index, avoiding O(n) element shifts.",
    howItWorksSteps: [
      "Push items onto the top of the stack using stack.append(x).",
      "Inspect the most recent element in O(1) via stack[-1].",
      "Pop and return the top item in O(1) via stack.pop().",
    ],
    codeExample: `stack = []
stack.append(10)
stack.append(20)
stack.append(30)
top_popped = stack.pop()
stack.append(40)
print("Popped:", top_popped, "Remaining stack:", stack)`,
    sampleSlug: "stack",
    tutorTopicSlug: "stacks-queues",
  },
  {
    id: "alg_queue_fifo",
    slug: "queue-fifo-deque",
    title: "Queue (FIFO Deque Frontier)",
    category: "Stack & Queue",
    difficulty: "Beginner",
    timeComplexity: "O(1)",
    spaceComplexity: "O(n)",
    complexityAssumption: "Uses collections.deque (doubly-linked blocks) for true O(1) popleft().",
    summary: "First-In, First-Out (FIFO) structure essential for Breadth-First Search level-order frontiers and task scheduling.",
    keyInsight: "Items enter at the rear (append) and exit from the front (popleft) in strict arrival order.",
    howItWorksSteps: [
      "Initialize queue = deque() for O(1) operations at both ends.",
      "Enqueue arriving items at the back with queue.append(item).",
      "Dequeue the oldest item from the front with queue.popleft().",
    ],
    codeExample: `from collections import deque

queue = deque(["task_1", "task_2"])
queue.append("task_3")
first_served = queue.popleft()
queue.append("task_4")
print("Served:", first_served, "Queue:", list(queue))`,
    sampleSlug: "queue",
    tutorTopicSlug: "stacks-queues",
  },

  // 7. Linked Lists
  {
    id: "alg_singly_linked_list",
    slug: "singly-linked-list-pointers",
    title: "Singly & Doubly Linked List Pointer Rewiring",
    category: "Linked Lists",
    difficulty: "Intermediate",
    timeComplexity: "O(n) traversal · O(1) local rewiring",
    spaceComplexity: "O(1) auxiliary",
    complexityAssumption: "O(1) insertion/deletion once the predecessor node reference is known.",
    summary: "Chains heap-allocated Node objects via explicit .next (and .prev) object references instead of contiguous array slots.",
    keyInsight: "Always assign new_node.next = current.next BEFORE overwriting current.next = new_node so the tail chain is never orphaned.",
    howItWorksSteps: [
      "Allocate Node objects on the heap and link head.next -> second -> third.",
      "Walk a cursor pointer current = current.next until current is None.",
      "Splice or reverse pointers in-place by rebinding .next references.",
    ],
    codeExample: `class Node:
    def __init__(self, val: int, next_node=None):
        self.val = val
        self.next = next_node

head = Node(10, Node(20, Node(30)))
inserted = Node(25, head.next.next)
head.next.next = inserted

curr = head
values = []
while curr is not None:
    values.append(curr.val)
    curr = curr.next
print("Linked list values:", values)`,
    sampleSlug: "singly-linked-list",
    tutorTopicSlug: "linked-lists",
  },

  // 8. Trees & Graphs
  {
    id: "alg_tree_dfs_bfs",
    slug: "binary-tree-traversals",
    title: "Binary Search Tree (BST) Insert & Search",
    category: "Trees & Graphs",
    difficulty: "Intermediate",
    timeComplexity: "O(h) — O(log n) balanced, O(n) skewed",
    spaceComplexity: "O(h)",
    complexityAssumption: "Tree height h = O(log n) when balanced; degrades to O(n) on sorted insertion without rebalancing.",
    summary: "Enforces the BST ordering invariant (left.val < node.val < right.val) for logarithmic hierarchical lookup.",
    keyInsight: "Every comparison at a BST node eliminates an entire left or right subtree, mirroring binary search on a tree.",
    howItWorksSteps: [
      "Compare target key against root.val.",
      "If key < root.val, traverse root.left; if key > root.val, traverse root.right.",
      "Insert new TreeNode when an empty child pointer (None) is reached.",
    ],
    codeExample: `class TreeNode:
    def __init__(self, val: int):
        self.val = val
        self.left = None
        self.right = None

def bst_insert(root, val: int):
    if root is None:
        return TreeNode(val)
    if val < root.val:
        root.left = bst_insert(root.left, val)
    else:
        root.right = bst_insert(root.right, val)
    return root

root = None
for v in [20, 10, 30, 5, 15]:
    root = bst_insert(root, v)
print("Root:", root.val, "Left:", root.left.val, "Right:", root.right.val)`,
    sampleSlug: "binary-search-tree",
    tutorTopicSlug: "trees-graphs",
  },
  {
    id: "alg_graph_shortest_path",
    slug: "graph-bfs-traversal",
    title: "Graph Breadth-First Search (BFS Shortest Path)",
    category: "Trees & Graphs",
    difficulty: "Intermediate",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    complexityAssumption: "Adjacency list representation where each vertex V and edge E is inspected once.",
    summary: "Explores graph vertices in concentric distance layers using a FIFO queue and a visited set.",
    keyInsight: "Marking neighbors visited as soon as they are enqueued prevents duplicate queue entries and infinite cycles.",
    howItWorksSteps: [
      "Seed queue = deque([start]) and visited = {start}.",
      "Pop vertex u from the front of the queue and append to traversal order.",
      "For each neighbor v of u not in visited, add v to visited and enqueue v.",
    ],
    codeExample: `from collections import deque

graph = {
    "A": ["B", "C"],
    "B": ["D", "E"],
    "C": ["F"],
    "D": [],
    "E": ["F"],
    "F": [],
}
visited = {"A"}
queue = deque(["A"])
order = []

while queue:
    node = queue.popleft()
    order.append(node)
    for nei in graph[node]:
        if nei not in visited:
            visited.add(nei)
            queue.append(nei)

print("BFS traversal order:", order)`,
    sampleSlug: "graph-bfs",
    tutorTopicSlug: "trees-graphs",
  },

  // 9. Dynamic Programming
  {
    id: "alg_dp_tabulation",
    slug: "dynamic-programming-tabulation",
    title: "Dynamic Programming (Bottom-Up Tabulation)",
    category: "Dynamic Programming",
    difficulty: "Advanced",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n) table · O(1) space-optimized",
    bruteForceComplexity: "O(2^n)",
    complexityAssumption: "Each state dp[i] is computed in O(1) from previously solved states dp[i-1] and dp[i-2].",
    summary: "Solves overlapping subproblems once in topological order, turning exponential O(2^n) recursion into a linear loop.",
    keyInsight: "At house i, the optimal loot is max(skip house i -> dp[i-1], rob house i -> dp[i-2] + houses[i]).",
    howItWorksSteps: [
      "Define state dp[i] = maximum non-adjacent sum using prefix 0..i.",
      "Seed base cases dp[0] = houses[0] and dp[1] = max(houses[0], houses[1]).",
      "Iterate i from 2 to n - 1 filling dp[i] = max(dp[i - 1], dp[i - 2] + houses[i]).",
    ],
    codeExample: `houses = [3, 10, 3, 1, 2, 8]
dp = [0] * len(houses)
dp[0] = houses[0]
dp[1] = max(houses[0], houses[1])

for i in range(2, len(houses)):
    dp[i] = max(dp[i - 1], dp[i - 2] + houses[i])

print("DP table:", dp)
print("Max non-adjacent loot:", dp[-1])`,
    sampleSlug: "fibonacci",
    tutorTopicSlug: "dynamic-programming",
    comparisonScenarioId: "cmp_fibonacci",
  },
];

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: "track-foundations",
    slug: "python-execution-foundations",
    title: "1. Python Execution & Memory Foundations",
    level: "Beginner",
    description:
      "Build an accurate mental model of how Python evaluates expressions, binds references, iterates loops, and manages local scopes.",
    modulesCount: 3,
    estimatedHours: "2.0 hrs",
    concepts: ["Name Binding", "Control Flow", "Loop Accumulators", "Function Frames"],
    accent: "emerald",
  },
  {
    id: "track-linear-dsa",
    slug: "linear-structures-pointers",
    title: "2. Linear Data Structures & Pointer Patterns",
    level: "Beginner",
    description:
      "Master contiguous arrays, hash tables, two-pointer invariants, sliding windows, and linked list reference manipulation.",
    modulesCount: 3,
    estimatedHours: "3.0 hrs",
    concepts: ["Arrays", "Two Pointers", "Sliding Window", "Hash Maps"],
    accent: "indigo",
  },
  {
    id: "track-recursion-trees",
    slug: "recursion-and-trees",
    title: "3. Call Stacks, Recursion & Hierarchical Trees",
    level: "Intermediate",
    description:
      "Demystify recursion by watching call stack frames push and unwind across divide-and-conquer, stacks/queues, and binary search trees.",
    modulesCount: 3,
    estimatedHours: "3.5 hrs",
    concepts: ["Call Stack", "LIFO/FIFO", "Linked Nodes", "BST Invariants"],
    accent: "violet",
  },
  {
    id: "track-graphs-optimization",
    slug: "graphs-and-complexity",
    title: "4. Graph Traversals & Dynamic Programming",
    level: "Advanced",
    description:
      "Visualize BFS shortest-path frontiers, divide-and-conquer sorting, and bottom-up Dynamic Programming state transitions.",
    modulesCount: 3,
    estimatedHours: "4.0 hrs",
    concepts: ["Graph BFS/DFS", "Merge Sort", "DP Tabulation", "Complexity Tradeoffs"],
    accent: "amber",
  },
];

export const LEARNING_LESSONS: LearningLesson[] = [
  // Track 1: Beginner Foundations
  {
    id: "lesson-variables-memory",
    trackId: "track-foundations",
    slug: "variables-and-name-binding",
    title: "Variables, Name Binding & Step Snapshots",
    level: "Beginner",
    topicSlug: "python-basics",
    sampleSlug: "variables",
    estimatedMinutes: 15,
    conceptSummary:
      "In Python, variables are labels bound to heap objects. Each assignment statement evaluates the right-hand expression first, then binds or rebinds the variable name on the left.",
    mentalModel:
      "Think of a variable not as a fixed memory box, but as a sticky note pointing to a value object. Reassigning `x = x + 5` reads the current object `x` points to, creates a new integer object, and moves the sticky note.",
    keyTakeaways: [
      "Right-hand side expressions always evaluate completely before left-hand binding.",
      "Immutable objects (int, str, tuple) allocate a new value on update; mutable containers (list, dict) mutate in-place.",
      "The Variable Inspector highlights newly created variables in green and mutated bindings in amber.",
    ],
    exampleCode: `price = 120
discount = 25
final_price = price - discount
price = final_price + 10
print("Final price:", final_price, "Updated price:", price)`,
    exercise: {
      id: "ex-variables-swap",
      title: "Compute Total Order Cost After Tax",
      prompt:
        "Given `subtotal = 80` and `tax = 12`, compute `total = subtotal + tax` and print `Total: 92`.",
      starterCode: `subtotal = 80
tax = 12
total = subtotal + tax
print("Total:", total)`,
      solutionHint: "Ensure `total = subtotal + tax` and `print('Total:', total)` outputs `Total: 92`.",
      expectedOutputSubstring: "Total: 92",
      targetComplexity: "Time: O(1) · Space: O(1)",
    },
  },
  {
    id: "lesson-loops-accumulators",
    trackId: "track-foundations",
    slug: "loops-and-accumulators",
    title: "Loops, Conditions & Running Accumulators",
    level: "Beginner",
    topicSlug: "python-basics",
    sampleSlug: "for-loop",
    estimatedMinutes: 20,
    conceptSummary:
      "A loop accumulator maintains a running summary (sum, count, maximum, or filtered list) across iterations so you only inspect one element at a time.",
    mentalModel:
      "Before iteration `i`, the accumulator holds the exact answer for the prefix `items[0..i-1]`. Inside the loop body, incorporating `items[i]` extends the invariant to `items[0..i]`.",
    keyTakeaways: [
      "Initialize accumulators (`total = 0`, `best = nums[0]`) before the loop starts.",
      "Check how branch conditions (`if / elif / else`) selectively update state on each step.",
      "Every `for` loop step advances the loop variable and records the delta in the timeline.",
    ],
    exampleCode: `scores = [14, 27, 9, 32, 18]
running_sum = 0
highest = scores[0]

for s in scores:
    running_sum += s
    if s > highest:
        highest = s

print("Sum:", running_sum, "Highest:", highest)`,
    exercise: {
      id: "ex-even-sum",
      title: "Sum of Even Numbers in Array",
      prompt:
        "Iterate through `nums = [4, 7, 10, 3, 8]` and accumulate the sum of only the even numbers (`s % 2 == 0`), then print `Even sum: 22`.",
      starterCode: `nums = [4, 7, 10, 3, 8]
even_sum = 0

for n in nums:
    if n % 2 == 0:
        even_sum += n

print("Even sum:", even_sum)`,
      solutionHint: "Use `if n % 2 == 0:` inside the loop to add `n` into `even_sum`.",
      expectedOutputSubstring: "Even sum: 22",
      targetComplexity: "Time: O(n) · Space: O(1)",
    },
  },
  {
    id: "lesson-functions-scopes",
    trackId: "track-foundations",
    slug: "functions-and-local-scopes",
    title: "Functions, Call Frames & Local Scope Isolation",
    level: "Beginner",
    topicSlug: "python-basics",
    sampleSlug: "functions",
    estimatedMinutes: 20,
    conceptSummary:
      "Every function call pushes a dedicated stack frame with its own local variable dictionary. When `return` executes, the value is passed back to the caller and the local frame is reclaimed.",
    mentalModel:
      "Local variables inside a function live on a scratchpad created when the function is called and shredded the instant `return` runs.",
    keyTakeaways: [
      "`call` events push a new frame onto the Call Stack with parameter bindings.",
      "`return` events capture the return value and pop the frame.",
      "Local variables in one frame cannot collide with variables of the same name in another frame.",
    ],
    exampleCode: `def rectangle_area(width: int, height: int) -> int:
    area = width * height
    return area

first = rectangle_area(5, 4)
second = rectangle_area(3, 6)
print("Areas:", first, second)`,
    exercise: {
      id: "ex-func-square-sum",
      title: "Write a Hypotenuse Squared Helper Function",
      prompt:
        "Complete `hypotenuse_sq(a, b)` so it returns `a * a + b * b`, and print `Result: 25` for `(3, 4)`.",
      starterCode: `def hypotenuse_sq(a: int, b: int) -> int:
    return a * a + b * b

res = hypotenuse_sq(3, 4)
print("Result:", res)`,
      solutionHint: "Return `a * a + b * b` from `hypotenuse_sq(3, 4)`.",
      expectedOutputSubstring: "Result: 25",
      targetComplexity: "Time: O(1) · Space: O(1)",
    },
  },

  // Track 2: Linear DSA & Pointer Patterns
  {
    id: "lesson-arrays-prefix",
    trackId: "track-linear-dsa",
    slug: "arrays-and-index-traversal",
    title: "Arrays, O(1) Indexing & Prefix Sums",
    level: "Beginner",
    topicSlug: "arrays",
    sampleSlug: "array-traversal",
    estimatedMinutes: 25,
    conceptSummary:
      "Python lists store object references in contiguous memory slots, giving O(1) random lookup by index and enabling O(1) subarray sum queries via prefix sums.",
    mentalModel:
      "Precomputing `prefix[i] = sum(nums[0..i-1])` lets you compute any subarray sum `nums[L..R]` via `prefix[R+1] - prefix[L]` in a single subtraction.",
    keyTakeaways: [
      "`nums[i]` is O(1), while `nums.insert(0, x)` or `nums.pop(0)` shifts O(n) elements.",
      "Index variables (`i`, `left`, `right`) are automatically rendered as pointer pills on the Array Visualizer.",
      "Prefix sums trade O(n) space to reduce repeated range queries from O(n) to O(1).",
    ],
    exampleCode: `nums = [5, 10, 15, 20]
prefix = [0]
for x in nums:
    prefix.append(prefix[-1] + x)

range_1_to_3 = prefix[4] - prefix[1]
print("Prefix:", prefix, "Sum[1..3]:", range_1_to_3)`,
    exercise: {
      id: "ex-array-max-diff",
      title: "Compute Prefix Sum of Array",
      prompt:
        "Build the cumulative sum of `nums = [3, 6, 2, 9]` and print `Total sum: 20`.",
      starterCode: `nums = [3, 6, 2, 9]
running = 0
for val in nums:
    running += val
print("Total sum:", running)`,
      solutionHint: "Accumulate each `val` in `nums` into `running`.",
      expectedOutputSubstring: "Total sum: 20",
      targetComplexity: "Time: O(n) · Space: O(1)",
    },
  },
  {
    id: "lesson-two-pointers",
    trackId: "track-linear-dsa",
    slug: "converging-two-pointers",
    title: "Converging Two Pointers on Sorted Arrays",
    level: "Beginner",
    topicSlug: "two-pointers",
    sampleSlug: "two-pointers",
    estimatedMinutes: 25,
    conceptSummary:
      "By placing `left = 0` and `right = n - 1` on a sorted array, each comparison eliminates either the leftmost or rightmost element, finding target pairs in O(n) time and O(1) space.",
    mentalModel:
      "If `nums[left] + nums[right]` is too small, `nums[left]` paired with anything smaller than `nums[right]` will also be too small—so `left` must advance.",
    keyTakeaways: [
      "Replaces O(n²) nested loops with a single O(n) inward pass.",
      "Requires O(1) auxiliary space—only two integer index variables.",
      "Loop terminates when `left >= right` or the target pair is found.",
    ],
    exampleCode: `nums = [2, 5, 8, 11, 15]
target = 16
left, right = 0, len(nums) - 1
pair = (-1, -1)

while left < right:
    s = nums[left] + nums[right]
    if s == target:
        pair = (left, right)
        break
    elif s < target:
        left += 1
    else:
        right -= 1

print("Pair:", pair)`,
    exercise: {
      id: "ex-two-pointers-pair",
      title: "Find Sorted Pair Summing to 14",
      prompt:
        "Use converging `left` and `right` pointers on `nums = [1, 4, 6, 8, 10, 13]` to find the indices summing to `target = 14` (`(0, 5)` or `(1, 4)`), and print `Found: True`.",
      starterCode: `nums = [1, 4, 6, 8, 10, 13]
target = 14
left = 0
right = len(nums) - 1
found = False

while left < right:
    s = nums[left] + nums[right]
    if s == target:
        found = True
        break
    elif s < target:
        left += 1
    else:
        right -= 1

print("Found:", found)`,
      solutionHint: "Advance `left += 1` when `s < target` and `right -= 1` when `s > target`.",
      expectedOutputSubstring: "Found: True",
      targetComplexity: "Time: O(n) · Space: O(1)",
    },
  },
  {
    id: "lesson-sliding-window-hash",
    trackId: "track-linear-dsa",
    slug: "sliding-window-and-hashing",
    title: "Sliding Window & Hash Map Complement Lookups",
    level: "Intermediate",
    topicSlug: "sliding-window",
    sampleSlug: "sliding-window",
    estimatedMinutes: 30,
    conceptSummary:
      "Sliding Window maintains a dynamic subarray `[left..right]` in O(n) time, while Hash Maps provide O(1) average key lookups for instant complement and frequency tracking.",
    mentalModel:
      "Don't recompute overlapping work: update the window incrementally as `right` enters and `left` leaves, or store seen values in a dictionary for O(1) recall.",
    keyTakeaways: [
      "Fixed windows slide both `left` and `right` together once size `k` is reached.",
      "Hash Maps (`dict`) trade O(n) memory to reduce O(n) linear searches to O(1) lookups.",
      "Combine both patterns to solve substring and subarray frequency problems in O(n).",
    ],
    exampleCode: `nums = [3, 8, 12, 4, 7]
target = 11
seen = {}
match = (-1, -1)

for i, x in enumerate(nums):
    need = target - x
    if need in seen:
        match = (seen[need], i)
        break
    seen[x] = i

print("Complement indices:", match)`,
    exercise: {
      id: "ex-sliding-window-k",
      title: "Maximum Window Sum of Size k=2",
      prompt:
        "Find the maximum sum of any contiguous window of length `k = 2` in `nums = [5, 2, 9, 4, 1]` and print `Max window: 13`.",
      starterCode: `nums = [5, 2, 9, 4, 1]
k = 2
win = sum(nums[:k])
best = win

for r in range(k, len(nums)):
    win += nums[r] - nums[r - k]
    if win > best:
        best = win

print("Max window:", best)`,
      solutionHint: "Slide `r` from `k` to `len(nums) - 1` updating `win += nums[r] - nums[r - k]`.",
      expectedOutputSubstring: "Max window: 13",
      targetComplexity: "Time: O(n) · Space: O(1)",
    },
  },

  // Track 3: Call Stacks, Recursion & Hierarchical Trees
  {
    id: "lesson-stacks-queues",
    trackId: "track-recursion-trees",
    slug: "stacks-and-queues",
    title: "Stacks (LIFO) & Queues (FIFO Frontiers)",
    level: "Intermediate",
    topicSlug: "recursion",
    sampleSlug: "stack",
    estimatedMinutes: 25,
    conceptSummary:
      "Stacks process the most recently added item first (LIFO, driving DFS and backtracking), whereas Queues process items in arrival order (FIFO, driving BFS level-order search).",
    mentalModel:
      "A Stack is a vertical tray stack (`append` + `pop`), while a Queue is a checkout line (`append` + `deque.popleft`).",
    keyTakeaways: [
      "Always use `collections.deque` for FIFO queues so `popleft()` is O(1) instead of `list.pop(0)` which is O(n).",
      "Monotonic stacks maintain sorted order to find next-greater elements in O(n).",
      "Every recursive function implicitly uses the call stack as a LIFO structure.",
    ],
    exampleCode: `from collections import deque

stack = [1, 2]
stack.append(3)
lifo_out = stack.pop()

queue = deque([1, 2])
queue.append(3)
fifo_out = queue.popleft()

print("LIFO:", lifo_out, "FIFO:", fifo_out)`,
    exercise: {
      id: "ex-stack-pop",
      title: "Verify LIFO vs FIFO Ordering",
      prompt:
        "Push `10, 20, 30` onto a stack, pop the top item, and print `Top popped: 30`.",
      starterCode: `stack = [10, 20]
stack.append(30)
popped = stack.pop()
print("Top popped:", popped)`,
      solutionHint: "`stack.pop()` removes and returns the last element `30`.",
      expectedOutputSubstring: "Top popped: 30",
      targetComplexity: "Time: O(1) · Space: O(n)",
    },
  },
  {
    id: "lesson-linked-lists-recursion",
    trackId: "track-recursion-trees",
    slug: "linked-lists-and-recursion",
    title: "Linked List Nodes & Recursive Unwinding",
    level: "Intermediate",
    topicSlug: "linked-lists",
    sampleSlug: "singly-linked-list",
    estimatedMinutes: 30,
    conceptSummary:
      "Linked lists connect Node objects via `.next` pointers on the heap, while recursion walks chains or trees by delegating subproblems down the call stack.",
    mentalModel:
      "Follow `.next` references step by step in the Linked List Visualizer and watch shared `ref#N` object identity badges track aliases.",
    keyTakeaways: [
      "Save `next_temp = curr.next` before rebinding `curr.next` during in-place reversal.",
      "Fast and slow pointers (`fast = fast.next.next`) find midpoints and detect cycles in O(1) space.",
      "Recursive base cases (`if node is None: return`) prevent `AttributeError` on null pointers.",
    ],
    exampleCode: `class Node:
    def __init__(self, val: int, nxt=None):
        self.val = val
        self.next = nxt

head = Node(1, Node(2, Node(3)))
prev = None
curr = head
while curr:
    nxt = curr.next
    curr.next = prev
    prev = curr
    curr = nxt

print("New head after reversal:", prev.val)`,
    exercise: {
      id: "ex-linked-list-sum",
      title: "Sum Values in a 3-Node Linked List",
      prompt:
        "Traverse the linked list `10 -> 20 -> 30` and print `Node sum: 60`.",
      starterCode: `class Node:
    def __init__(self, val: int, nxt=None):
        self.val = val
        self.next = nxt

head = Node(10, Node(20, Node(30)))
total = 0
curr = head
while curr is not None:
    total += curr.val
    curr = curr.next

print("Node sum:", total)`,
      solutionHint: "Advance `curr = curr.next` after adding `curr.val` to `total`.",
      expectedOutputSubstring: "Node sum: 60",
      targetComplexity: "Time: O(n) · Space: O(1)",
    },
  },
  {
    id: "lesson-binary-trees-bst",
    trackId: "track-recursion-trees",
    slug: "binary-trees-and-bst",
    title: "Binary Trees, DFS Orders & BST Search",
    level: "Intermediate",
    topicSlug: "binary-trees",
    sampleSlug: "binary-search-tree",
    estimatedMinutes: 35,
    conceptSummary:
      "Binary trees organize nodes hierarchically with `.left` and `.right` children. Inorder traversal of a Binary Search Tree visits values in non-decreasing sorted order.",
    mentalModel:
      "At every BST node, all keys in `node.left` are strictly smaller and all keys in `node.right` are strictly larger.",
    keyTakeaways: [
      "Preorder (`Node -> Left -> Right`), Inorder (`Left -> Node -> Right`), Postorder (`Left -> Right -> Node`).",
      "BST lookup takes O(h) steps where h is tree height.",
      "The Tree Visualizer automatically validates the BST ordering invariant across all subtrees.",
    ],
    exampleCode: `class TreeNode:
    def __init__(self, val: int, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

root = TreeNode(10, TreeNode(5), TreeNode(15))
order = []
def inorder(node):
    if not node:
        return
    inorder(node.left)
    order.append(node.val)
    inorder(node.right)

inorder(root)
print("Inorder:", order)`,
    exercise: {
      id: "ex-tree-inorder",
      title: "Inorder Traversal of BST",
      prompt:
        "Run the inorder traversal on `root = TreeNode(8, TreeNode(3), TreeNode(12))` and print `Sorted BST: [3, 8, 12]`.",
      starterCode: `class TreeNode:
    def __init__(self, val: int, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

root = TreeNode(8, TreeNode(3), TreeNode(12))
result = []

def inorder(node):
    if node is None:
        return
    inorder(node.left)
    result.append(node.val)
    inorder(node.right)

inorder(root)
print("Sorted BST:", result)`,
      solutionHint: "Visit `inorder(node.left)`, append `node.val`, then visit `inorder(node.right)`.",
      expectedOutputSubstring: "Sorted BST: [3, 8, 12]",
      targetComplexity: "Time: O(n) · Space: O(h)",
    },
  },

  // Track 4: Advanced Graphs & Dynamic Programming
  {
    id: "lesson-graph-bfs-dfs",
    trackId: "track-graphs-optimization",
    slug: "graph-bfs-and-dfs",
    title: "Graph Adjacency Lists, BFS Frontiers & Cycle Guards",
    level: "Advanced",
    topicSlug: "graphs",
    sampleSlug: "graph-bfs",
    estimatedMinutes: 35,
    conceptSummary:
      "Graphs model arbitrary pairwise relationships via adjacency lists. Breadth-First Search explores vertices layer-by-layer to guarantee shortest paths in unweighted graphs.",
    mentalModel:
      "Always guard graph traversals with a `visited` set—without it, any cycle will trap BFS or DFS in an infinite loop.",
    keyTakeaways: [
      "Add neighbors to `visited` at enqueue time, not dequeue time, to avoid duplicate frontier entries.",
      "BFS runs in O(V + E) time and O(V) space.",
      "The Graph Visualizer highlights the active node, visited set, and queue frontier on every step.",
    ],
    exampleCode: `from collections import deque

graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}
visited = {"A"}
q = deque(["A"])
order = []

while q:
    u = q.popleft()
    order.append(u)
    for v in graph[u]:
        if v not in visited:
            visited.add(v)
            q.append(v)

print("Order:", order)`,
    exercise: {
      id: "ex-graph-bfs-count",
      title: "Count Reachable Nodes via BFS",
      prompt:
        "Run BFS starting from `'A'` on `graph = {'A': ['B', 'C'], 'B': ['D'], 'C': [], 'D': []}` and print `Reachable: 4`.",
      starterCode: `from collections import deque

graph = {"A": ["B", "C"], "B": ["D"], "C": [], "D": []}
visited = {"A"}
q = deque(["A"])

while q:
    node = q.popleft()
    for nei in graph[node]:
        if nei not in visited:
            visited.add(nei)
            q.append(nei)

print("Reachable:", len(visited))`,
      solutionHint: "`len(visited)` after BFS completes gives the total reachable vertices (`4`).",
      expectedOutputSubstring: "Reachable: 4",
      targetComplexity: "Time: O(V + E) · Space: O(V)",
    },
  },
  {
    id: "lesson-divide-conquer-sorting",
    trackId: "track-graphs-optimization",
    slug: "divide-and-conquer-sorting",
    title: "Divide & Conquer Sorting & Complexity Tradeoffs",
    level: "Advanced",
    topicSlug: "sorting",
    sampleSlug: "merge-sort",
    estimatedMinutes: 30,
    conceptSummary:
      "Divide-and-Conquer splits an input of size n into balanced subproblems of size n/2, reducing quadratic O(n²) sorting to O(n log n).",
    mentalModel:
      "With log2(n) levels in the recursion tree and O(n) linear merge work per level, total work is O(n log n).",
    keyTakeaways: [
      "Merge Sort guarantees O(n log n) worst-case time using O(n) auxiliary space.",
      "Quick Sort sorts in-place with O(log n) stack space on average.",
      "Compare step counts directly in the `/comparison` lab to see empirical scaling.",
    ],
    exampleCode: `nums = [9, 3, 7, 1, 5]
sorted_nums = sorted(nums)
print("Sorted:", sorted_nums)`,
    exercise: {
      id: "ex-two-finger-merge",
      title: "Merge Two Sorted Lists in Linear Time",
      prompt:
        "Merge `left = [1, 4, 7]` and `right = [2, 5, 8]` using two pointers and print `Merged: [1, 2, 4, 5, 7, 8]`.",
      starterCode: `left = [1, 4, 7]
right = [2, 5, 8]
merged = []
i = j = 0

while i < len(left) and j < len(right):
    if left[i] <= right[j]:
        merged.append(left[i])
        i += 1
    else:
        merged.append(right[j])
        j += 1

merged.extend(left[i:])
merged.extend(right[j:])
print("Merged:", merged)`,
      solutionHint: "Compare `left[i]` and `right[j]` at each step and append the smaller one.",
      expectedOutputSubstring: "Merged: [1, 2, 4, 5, 7, 8]",
      targetComplexity: "Time: O(n + m) · Space: O(n + m)",
    },
  },
  {
    id: "lesson-dynamic-programming",
    trackId: "track-graphs-optimization",
    slug: "dynamic-programming-tabulation",
    title: "Dynamic Programming: Memoization & Bottom-Up Tabulation",
    level: "Advanced",
    topicSlug: "recursion",
    sampleSlug: "fibonacci",
    estimatedMinutes: 40,
    conceptSummary:
      "Dynamic Programming eliminates redundant recursive subtrees by caching subproblem answers in a table (`dp[i]`), collapsing O(2^n) exponential time to O(n).",
    mentalModel:
      "Solve each small subproblem `dp[0]`, `dp[1]`, `dp[2]` once in order so when `dp[i]` needs `dp[i-1]` and `dp[i-2]`, both answers are already waiting in O(1).",
    keyTakeaways: [
      "Identify overlapping subproblems and write the recurrence relation (`dp[i] = ...`).",
      "Bottom-up tabulation avoids recursion call stack overhead entirely.",
      "When `dp[i]` only depends on the last two states, space can be compressed from O(n) to O(1).",
    ],
    exampleCode: `n = 7
dp = [0] * (n + 1)
dp[1] = 1
for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

print("DP table:", dp)
print("fib(7) =", dp[n])`,
    exercise: {
      id: "ex-dp-climbing-stairs",
      title: "Climbing Stairs DP Table (n = 5)",
      prompt:
        "Compute the number of distinct ways to climb `n = 5` stairs taking 1 or 2 steps at a time (`dp[i] = dp[i-1] + dp[i-2]`, with `dp[1]=1, dp[2]=2`) and print `Ways: 8`.",
      starterCode: `n = 5
dp = [0] * (n + 1)
dp[1] = 1
dp[2] = 2

for i in range(3, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

print("Ways:", dp[n])`,
      solutionHint: "Fill `dp[i] = dp[i - 1] + dp[i - 2]` from `i = 3` to `5`.",
      expectedOutputSubstring: "Ways: 8",
      targetComplexity: "Time: O(n) · Space: O(n)",
    },
  },
];

export const COMPARISON_SCENARIOS: ComparisonScenario[] = [
  {
    id: "cmp_two_sum",
    slug: "pair-sum-lookup",
    title: "Target Pair Search on Sorted Array",
    category: "Two Pointers O(n) vs. Nested Loops O(n²)",
    sharedInputCode: `nums = [2, 4, 7, 11, 15, 19, 24, 30]
target = 44`,
    bruteForce: {
      approach: "Nested index loops checking all (i, j) pairs",
      timeComplexity: "O(n²)",
      spaceComplexity: "O(1)",
      code: `matched = (-1, -1)
for i in range(len(nums)):
    for j in range(i + 1, len(nums)):
        if nums[i] + nums[j] == target:
            matched = (i, j)
            break
    if matched != (-1, -1):
        break
print("Matched pair:", matched)`,
    },
    optimized: {
      approach: "Converging left and right pointers in a single pass",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      code: `left = 0
right = len(nums) - 1
matched = (-1, -1)
while left < right:
    current_sum = nums[left] + nums[right]
    if current_sum == target:
        matched = (left, right)
        break
    elif current_sum < target:
        left += 1
    else:
        right -= 1
print("Matched pair:", matched)`,
    },
    summary:
      "Contrasts quadratic all-pairs scanning against monotonic boundary convergence on identical sorted input.",
    keyInsight:
      "Every comparison in Two Pointers eliminates an entire row or column of candidate pairs, cutting traced step count dramatically.",
    complexityExplanation:
      "Brute-Force inspects up to n(n-1)/2 pairs (O(n²) time, O(1) space). Optimized Two Pointers moves either `left` or `right` inward on each iteration, guaranteeing at most n comparisons (O(n) time, O(1) space).",
  },
  {
    id: "cmp_max_subarray_k",
    slug: "fixed-window-sum",
    title: "Maximum Sum Subarray of Size K",
    category: "Sliding Window O(n) vs. Slice Re-Summation O(n·k)",
    sharedInputCode: `nums = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]
k = 4`,
    bruteForce: {
      approach: "Re-accumulate k elements with an inner loop at every start index",
      timeComplexity: "O(n * k)",
      spaceComplexity: "O(1)",
      code: `max_sum = -1
for i in range(len(nums) - k + 1):
    current_sum = 0
    for j in range(i, i + k):
        current_sum += nums[j]
    if current_sum > max_sum:
        max_sum = current_sum
print("Max window sum:", max_sum)`,
    },
    optimized: {
      approach: "Maintain rolling window sum by adding entering and subtracting leaving item",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      code: `window_sum = sum(nums[:k])
max_sum = window_sum
for right in range(k, len(nums)):
    window_sum += nums[right] - nums[right - k]
    if window_sum > max_sum:
        max_sum = window_sum
print("Max window sum:", max_sum)`,
    },
    summary:
      "Eliminates k - 1 redundant additions per window shift while maintaining O(1) auxiliary memory.",
    keyInsight:
      "Consecutive windows of size k share k - 1 overlapping elements; only the two boundary elements change.",
    complexityExplanation:
      "Brute-Force executes an inner loop of length k for each of the n - k + 1 windows (O(n·k) time). Sliding Window updates `window_sum` in O(1) per shift, completing in a single linear O(n) pass.",
  },
  {
    id: "cmp_fibonacci",
    slug: "fibonacci-memoization",
    title: "N-th Fibonacci Number Computation",
    category: "Bottom-Up DP O(n) vs. Naive Tree Recursion O(2^n)",
    sharedInputCode: `n = 6`,
    bruteForce: {
      approach: "Unmemoized binary tree recursion recomputing identical subproblems",
      timeComplexity: "O(2^n)",
      spaceComplexity: "O(n) stack",
      code: `def fib_naive(k: int) -> int:
    if k <= 1:
        return k
    return fib_naive(k - 1) + fib_naive(k - 2)

ans = fib_naive(n)
print("Fibonacci result:", ans)`,
    },
    optimized: {
      approach: "Bottom-up Dynamic Programming tabulation in a single loop",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n) table",
      code: `dp = [0] * (n + 1)
dp[1] = 1
for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

ans = dp[n]
print("Fibonacci result:", ans)`,
    },
    summary:
      "Demonstrates how storing subproblem states collapses an exponential branching tree into a tiny linear loop.",
    keyInsight:
      "Even for n = 6, naive recursion spawns 25 function calls and repeated stack frames, whereas bottom-up DP executes a 5-iteration loop at call depth 1.",
    complexityExplanation:
      "Naive recursion branches twice at every call (`T(n) = T(n-1) + T(n-2) = O(2^n)` time, `O(n)` call stack depth). Bottom-up DP computes each state `dp[2..n]` once in `O(n)` time and call depth 1.",
  },
  {
    id: "cmp_binary_vs_linear",
    slug: "binary-vs-linear-search",
    title: "Sorted Array Target Lookup",
    category: "Binary Search O(log n) vs. Linear Scan O(n)",
    sharedInputCode: `nums = [3, 7, 12, 18, 25, 31, 42, 56, 68, 79, 88, 95]
target = 88`,
    bruteForce: {
      approach: "Sequential left-to-right scan inspecting every element until match",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      code: `found_idx = -1
for i in range(len(nums)):
    if nums[i] == target:
        found_idx = i
        break
print("Found at:", found_idx)`,
    },
    optimized: {
      approach: "Binary search halving [low..high] interval around midpoint",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
      code: `low = 0
high = len(nums) - 1
found_idx = -1
while low <= high:
    mid = (low + high) // 2
    if nums[mid] == target:
        found_idx = mid
        break
    elif nums[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
print("Found at:", found_idx)`,
    },
    summary:
      "Compares checking elements one-by-one against bisecting the sorted search interval at each step.",
    keyInsight:
      "When the target sits near the end of a sorted array, Linear Search visits nearly all n elements while Binary Search jumps across midpoints in at most log2(n) steps.",
    complexityExplanation:
      "Linear Search requires up to n comparisons (O(n) time). Binary Search halves the remaining candidate interval on every comparison, requiring at most floor(log2(n)) + 1 comparisons (O(log n) time, O(1) space).",
  },
  {
    id: "cmp_duplicate_check",
    slug: "duplicate-detection-hashset",
    title: "Array Duplicate Detection",
    category: "Hash Set O(n) vs. All-Pairs Comparison O(n²)",
    sharedInputCode: `nums = [14, 29, 8, 41, 19, 33, 52, 19]`,
    bruteForce: {
      approach: "Compare every element against all subsequent elements",
      timeComplexity: "O(n²)",
      spaceComplexity: "O(1)",
      code: `has_dup = False
for i in range(len(nums)):
    for j in range(i + 1, len(nums)):
        if nums[i] == nums[j]:
            has_dup = True
            break
    if has_dup:
        break
print("Duplicate found:", has_dup)`,
    },
    optimized: {
      approach: "Single pass recording visited values in an O(1) Hash Set",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      code: `seen = set()
has_dup = False
for x in nums:
    if x in seen:
        has_dup = True
        break
    seen.add(x)
print("Duplicate found:", has_dup)`,
    },
    summary:
      "Trades O(n) auxiliary set memory to eliminate nested O(n²) pairwise comparisons.",
    keyInsight:
      "Checking `x in seen` on a Python set is O(1) average time via hash table bucket lookup.",
    complexityExplanation:
      "Brute-Force performs O(n²) pairwise equality checks with O(1) space. The Hash Set approach performs at most n constant-time membership checks and insertions (O(n) time, O(n) space).",
  },
];

export const LANGUAGE_ROADMAP: LanguageRoadmapItem[] = [
  {
    id: "python",
    name: "Python",
    monogram: "PY",
    extension: ".py",
    availability: "primary",
    statusLabel: "Active Production Engine (Python 3.12)",
    runtimeNote: "Python 3.12 AST & frame tracer architecture",
    description:
      "Clean syntax ideal for visualizing variables, object references, recursion stacks, and core data structures without boilerplate.",
    capabilities: [
      "Line-by-line frame & local scope inspection",
      "List, dict, set, tree & graph structure detection",
      "Recursion call-tree & return value tracking",
    ],
  },
  {
    id: "javascript",
    name: "JavaScript",
    monogram: "JS",
    extension: ".js",
    availability: "planned",
    statusLabel: "Planned",
    runtimeNote: "Future V8 / AST instrumentation milestone",
    description:
      "Planned support for closures, lexical scopes, array methods, Maps/Sets, and asynchronous event-loop intuition.",
    capabilities: ["Closure scope chains", "Array & Map visualizations", "Call stack step tracing"],
  },
  {
    id: "java",
    name: "Java",
    monogram: "JV",
    extension: ".java",
    availability: "planned",
    statusLabel: "Planned",
    runtimeNote: "Future JVM JDWP debugger trace adapter",
    description:
      "Planned support for object-oriented heap references, generics, collections framework, and university CS curricula.",
    capabilities: ["Stack vs. Heap object references", "Collections visualization", "Class method frames"],
  },
  {
    id: "c",
    name: "C",
    monogram: "C",
    extension: ".c",
    availability: "planned",
    statusLabel: "Planned",
    runtimeNote: "Future low-level memory & pointer inspector",
    description:
      "Planned support for raw memory addresses, pointer arithmetic, stack frames, and manual heap allocations.",
    capabilities: ["Pointer address arrows", "Contiguous byte/array layout", "malloc / free tracking"],
  },
  {
    id: "cpp",
    name: "C++",
    monogram: "C++",
    extension: ".cpp",
    availability: "planned",
    statusLabel: "Planned",
    runtimeNote: "Future STL & competitive programming runtime",
    description:
      "Planned support for STL containers (vector, unordered_map, priority_queue), iterators, and competitive DSA workflows.",
    capabilities: ["STL container rendering", "Reference & iterator state", "Template recursion frames"],
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_phase5",
    title: "CODEFLOW AI v1.0 Complete",
    description:
      "Dual-runner code comparison, 9-category algorithm library, interactive guided learning, AI Tutor, and SQLite persistence are active.",
    timestampLabel: "Active",
    read: false,
    tag: "Platform",
  },
  {
    id: "notif_shortcut",
    title: "Quick Navigation Tip",
    description:
      "Press Cmd+K (or Ctrl+K) anywhere in the dashboard to search routes, DSA topics, algorithms, and saved projects.",
    timestampLabel: "Guide",
    read: false,
    tag: "Tip",
  },
  {
    id: "notif_tutor",
    title: "Execution-Aware AI Tutor Ready",
    description:
      "Click 'AI Tutor' in the workspace or visit /tutor for step-grounded code explanations, progressive hints, and complexity coaching.",
    timestampLabel: "Feature",
    read: true,
    tag: "Platform",
  },
];
