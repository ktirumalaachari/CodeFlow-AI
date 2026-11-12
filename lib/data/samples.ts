export type SampleCategory = "Python Basics" | "DSA" | "Advanced";

export interface SampleProgram {
  id: string;
  slug: string;
  title: string;
  category: SampleCategory;
  description: string;
  code: string;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  // ───────────────────────── PYTHON BASICS (7) ─────────────────────────
  {
    id: "sample_hello_world",
    slug: "hello-world",
    title: "Hello World",
    category: "Python Basics",
    description: "First steps with variables, string formatting, and print() output.",
    code: `greeting = "Hello, CODEFLOW AI!"
learner = "Python Explorer"
message = f"{greeting} Welcome, {learner}."
print(message)
print("Every line executes top to bottom.")
`,
  },
  {
    id: "sample_variables",
    slug: "variables",
    title: "Variables",
    category: "Python Basics",
    description: "Watch variables initialize, update, and swap values step by step.",
    code: `score = 10
bonus = 5
total = score + bonus
score = total * 2

# Python tuple unpacking swap
left, right = 1, 9
left, right = right, left
print("total:", total, "| swapped:", left, right)
`,
  },
  {
    id: "sample_data_types",
    slug: "data-types",
    title: "Data Types",
    category: "Python Basics",
    description: "Inspect integers, floats, booleans, strings, lists, tuples, sets, and dicts.",
    code: `count = 42
pi_approx = 3.14159
is_valid = True
label = "visualizer"
numbers = [2, 4, 6]
point = (10, 20)
unique_tags = {"py", "dsa", "py"}
profile = {"lang": "Python", "version": 3.12}
print(type(numbers).__name__, len(unique_tags), profile["lang"])
`,
  },
  {
    id: "sample_conditions",
    slug: "conditions",
    title: "Conditions",
    category: "Python Basics",
    description: "Observe how Python evaluates if / elif / else branches.",
    code: `temperature = 28

if temperature >= 35:
    advisory = "Extreme heat"
elif temperature >= 24:
    advisory = "Warm and pleasant"
else:
    advisory = "Cool weather"

is_outdoor_friendly = 18 <= temperature <= 30
print(f"{temperature}°C -> {advisory} (outdoor={is_outdoor_friendly})")
`,
  },
  {
    id: "sample_for_loop",
    slug: "for-loop",
    title: "For Loop",
    category: "Python Basics",
    description: "Step through iteration variables and running accumulators.",
    code: `prices = [12, 8, 15, 5]
running_total = 0
expensive_items = []

for price in prices:
    running_total += price
    if price >= 10:
        expensive_items.append(price)

print("Total:", running_total, "| >=10:", expensive_items)
`,
  },
  {
    id: "sample_while_loop",
    slug: "while-loop",
    title: "While Loop",
    category: "Python Basics",
    description: "See a while-loop repeat while its condition stays True, then exit cleanly.",
    code: `n = 18
steps = 0
sequence = [n]

while n > 1:
    if n % 2 == 0:
        n = n // 2
    else:
        n = 3 * n + 1
    sequence.append(n)
    steps += 1
    if steps == 6:
        break

print("Visited:", sequence)
`,
  },
  {
    id: "sample_functions",
    slug: "functions",
    title: "Functions",
    category: "Python Basics",
    description: "Inspect local stack frames, parameter binding, and return values.",
    code: `def rectangle_metrics(width: int, height: int) -> dict[str, int]:
    area = width * height
    perimeter = 2 * (width + height)
    return {"area": area, "perimeter": perimeter}

small_box = rectangle_metrics(4, 3)
large_box = rectangle_metrics(7, 5)
print("Small:", small_box, "| Large:", large_box)
`,
  },

  // ───────────────────────────── DSA (12) ─────────────────────────────
  {
    id: "sample_array_traversal",
    slug: "arrays",
    title: "Array Traversal",
    category: "DSA",
    description: "Build a prefix sum array while tracking minimum and maximum elements.",
    code: `nums = [4, -2, 7, 1, 5]
prefix_sums = []
running = 0
max_val = nums[0]

for idx, val in enumerate(nums):
    running += val
    prefix_sums.append(running)
    if val > max_val:
        max_val = val

print("Prefix sums:", prefix_sums, "| Max:", max_val)
`,
  },
  {
    id: "sample_array_insert_delete",
    slug: "array-insert-delete",
    title: "Array Insertion & Deletion",
    category: "DSA",
    description: "Watch array indices shift on insert(), pop(), update, and in-place swap.",
    code: `nums = [10, 20, 40, 50]

# Insert 30 at index 2 (elements right of index 2 shift)
nums.insert(2, 30)

# Update element at index 0
nums[0] = 15

# Swap first and last elements in place
nums[0], nums[-1] = nums[-1], nums[0]

# Delete element at index 1 and pop tail
removed_mid = nums.pop(1)
removed_end = nums.pop()
print("Final array:", nums, "| removed:", removed_mid, removed_end)
`,
  },
  {
    id: "sample_two_pointers",
    slug: "two-pointers",
    title: "Two Pointers",
    category: "DSA",
    description: "Converge left and right indices on a sorted list to locate a target sum.",
    code: `nums = [2, 5, 8, 11, 15]
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

print("Matched indices:", matched_pair)
`,
  },
  {
    id: "sample_sliding_window",
    slug: "sliding-window",
    title: "Sliding Window",
    category: "DSA",
    description: "Compute maximum sum of any k-length subarray in O(n) rolling updates.",
    code: `nums = [3, 1, 6, 4, 2, 8, 1]
k = 3
window_sum = sum(nums[:k])
best_sum = window_sum
best_start = 0

for right in range(k, len(nums)):
    leaving = nums[right - k]
    entering = nums[right]
    window_sum = window_sum - leaving + entering
    if window_sum > best_sum:
        best_sum = window_sum
        best_start = right - k + 1

print("Best window:", nums[best_start:best_start + k], "-> sum =", best_sum)
`,
  },
  {
    id: "sample_linear_search",
    slug: "linear-search",
    title: "Linear Search",
    category: "DSA",
    description: "Scan elements sequentially and exit immediately when the target is found.",
    code: `items = [14, 9, 27, 6, 31, 18]
target = 27
found_at = -1

for index in range(len(items)):
    candidate = items[index]
    if candidate == target:
        found_at = index
        break

print(f"Target {target} found at index {found_at}")
`,
  },
  {
    id: "sample_binary_search",
    slug: "binary-search",
    title: "Binary Search",
    category: "DSA",
    description: "Halve the sorted search range [low..high] on every midpoint check.",
    code: `def binary_search(nums: list[int], target: int) -> int:
    low = 0
    high = len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        guess = nums[mid]
        if guess == target:
            return mid
        elif guess < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

sorted_nums = [3, 7, 12, 18, 24, 31, 42]
position = binary_search(sorted_nums, 24)
print("Found 24 at index:", position)
`,
  },
  {
    id: "sample_hash_map",
    slug: "hash-maps",
    title: "Hash Map",
    category: "DSA",
    description: "Find two numbers summing to target in one pass using a dictionary.",
    code: `nums = [11, 4, 7, 2, 15]
target = 9
seen_indices: dict[int, int] = {}
answer: tuple[int, int] | None = None

for idx, value in enumerate(nums):
    complement = target - value
    if complement in seen_indices:
        answer = (seen_indices[complement], idx)
        break
    seen_indices[value] = idx

print("Two Sum indices:", answer)
`,
  },
  {
    id: "sample_stack",
    slug: "stack",
    title: "Stack",
    category: "DSA",
    description: "Validate balanced brackets using a LIFO list stack.",
    code: `expression = "{[()]}"
pairs = {")": "(", "]": "[", "}": "{"}
stack: list[str] = []
is_balanced = True

for ch in expression:
    if ch in "([{":
        stack.append(ch)
    else:
        if not stack or stack[-1] != pairs[ch]:
            is_balanced = False
            break
        stack.pop()

is_balanced = is_balanced and len(stack) == 0
print(f"{expression} balanced -> {is_balanced}")
`,
  },
  {
    id: "sample_queue",
    slug: "queue",
    title: "Queue",
    category: "DSA",
    description: "Process tasks in FIFO order using collections.deque.",
    code: `from collections import deque

queue = deque(["parse", "compile", "trace"])
completed: list[str] = []

queue.append("visualize")
while queue:
    current_task = queue.popleft()
    completed.append(current_task.upper())

print("Processed FIFO:", completed)
`,
  },
  {
    id: "sample_dictionary_operations",
    slug: "dictionary-operations",
    title: "Dictionary Operations",
    category: "DSA",
    description: "Track key insertions, value updates, lookups, and key deletion in a dict.",
    code: `inventory: dict[str, int] = {"apples": 5, "bananas": 3}

# Insert a new key
inventory["cherries"] = 8

# Update an existing key
inventory["apples"] = inventory["apples"] + 4

# Lookup and delete a key
has_bananas = "bananas" in inventory
removed_count = inventory.pop("bananas")
print("Inventory:", inventory, "| removed bananas:", removed_count)
`,
  },
  {
    id: "sample_singly_linked_list",
    slug: "singly-linked-list",
    title: "Singly Linked List",
    category: "DSA",
    description: "Allocate ListNode objects, splice a new node in-place, and traverse .next pointers.",
    code: `class ListNode:
    def __init__(self, val: int, next=None):
        self.val = val
        self.next = next

head = ListNode(10)
second = ListNode(20)
third = ListNode(40)
head.next = second
second.next = third

# Splice 30 between second (20) and third (40)
new_node = ListNode(30)
new_node.next = second.next
second.next = new_node

# Traverse from head to None
visited_vals: list[int] = []
curr = head
while curr is not None:
    visited_vals.append(curr.val)
    curr = curr.next

print("Linked list values:", visited_vals)
`,
  },
  {
    id: "sample_doubly_linked_list",
    slug: "doubly-linked-list",
    title: "Doubly Linked List",
    category: "DSA",
    description: "Wire forward (.next) and backward (.prev) pointers across DoublyNode instances.",
    code: `class DoublyNode:
    def __init__(self, val: str):
        self.val = val
        self.prev = None
        self.next = None

head = DoublyNode("A")
middle = DoublyNode("B")
tail = DoublyNode("C")

head.next = middle
middle.prev = head
middle.next = tail
tail.prev = middle

# Walk backward from tail to head using .prev
reverse_path: list[str] = []
curr = tail
while curr is not None:
    reverse_path.append(curr.val)
    curr = curr.prev

print("Reverse traversal:", reverse_path)
`,
  },

  // ─────────────────────────── ADVANCED (10) ───────────────────────────
  {
    id: "sample_recursion",
    slug: "recursion",
    title: "Recursion",
    category: "Advanced",
    description: "Watch call frames push down to n=1 and multiply as they unwind.",
    code: `def factorial(n: int) -> int:
    if n <= 1:
        return 1
    subproblem = factorial(n - 1)
    return n * subproblem

result = factorial(4)
print("4! =", result)
`,
  },
  {
    id: "sample_fibonacci",
    slug: "fibonacci",
    title: "Fibonacci",
    category: "Advanced",
    description: "Memoized top-down Fibonacci avoiding redundant recursive subtrees.",
    code: `memo: dict[int, int] = {0: 0, 1: 1}

def fib(n: int) -> int:
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]

sixth_fib = fib(6)
print("fib(6) =", sixth_fib, "| cache:", memo)
`,
  },
  {
    id: "sample_merge_sort",
    slug: "merge-sort",
    title: "Merge Sort",
    category: "Advanced",
    description: "Divide an array into halves and merge sorted slices in O(n log n).",
    code: `def merge(left: list[int], right: list[int]) -> list[int]:
    merged: list[int] = []
    i, j = 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged

def merge_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left_half = merge_sort(arr[:mid])
    right_half = merge_sort(arr[mid:])
    return merge(left_half, right_half)

unsorted = [14, 7, 3, 12, 9]
sorted_result = merge_sort(unsorted)
print("Sorted:", sorted_result)
`,
  },
  {
    id: "sample_quick_sort",
    slug: "quick-sort",
    title: "Quick Sort",
    category: "Advanced",
    description: "Partition elements around a pivot recursively.",
    code: `def quick_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    smaller = [x for x in arr if x < pivot]
    equal = [x for x in arr if x == pivot]
    larger = [x for x in arr if x > pivot]
    return quick_sort(smaller) + equal + quick_sort(larger)

data = [10, 3, 8, 15, 6]
ordered = quick_sort(data)
print("Quick sorted:", ordered)
`,
  },
  {
    id: "sample_binary_tree_traversal",
    slug: "binary-trees",
    title: "Binary Tree Traversal",
    category: "Advanced",
    description: "Traverse a binary tree in-order (Left -> Node -> Right) recursively.",
    code: `class TreeNode:
    def __init__(self, val: int, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

root = TreeNode(20, TreeNode(10, TreeNode(5), TreeNode(15)), TreeNode(30))
inorder: list[int] = []

def traverse(node) -> None:
    if node is None:
        return
    traverse(node.left)
    inorder.append(node.val)
    traverse(node.right)

traverse(root)
print("In-order traversal:", inorder)
`,
  },
  {
    id: "sample_graph_bfs",
    slug: "graphs",
    title: "Graph BFS",
    category: "Advanced",
    description: "Explore graph vertices layer by layer using a FIFO queue and visited set.",
    code: `from collections import deque

graph = {
    "A": ["B", "C"],
    "B": ["D"],
    "C": ["D", "E"],
    "D": ["F"],
    "E": [],
    "F": [],
}

visited = {"A"}
queue = deque(["A"])
bfs_order: list[str] = []

while queue:
    vertex = queue.popleft()
    bfs_order.append(vertex)
    for neighbor in graph[vertex]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)

print("BFS order:", bfs_order)
`,
  },
  {
    id: "sample_graph_dfs",
    slug: "graph-dfs",
    title: "Graph DFS",
    category: "Advanced",
    description: "Explore deep graph paths recursively while tracking visited vertices.",
    code: `graph = {
    "A": ["B", "C"],
    "B": ["D"],
    "C": ["E"],
    "D": [],
    "E": ["F"],
    "F": [],
}

visited: set[str] = set()
dfs_order: list[str] = []

def dfs(node: str) -> None:
    visited.add(node)
    dfs_order.append(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(neighbor)

dfs("A")
print("DFS order:", dfs_order)
`,
  },
  {
    id: "sample_binary_search_tree",
    slug: "binary-search-tree",
    title: "Binary Search Tree",
    category: "Advanced",
    description: "Insert keys into a BST and follow the O(log n) search path to locate a target.",
    code: `class BSTNode:
    def __init__(self, val: int, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def insert_bst(root, val: int):
    if root is None:
        return BSTNode(val)
    if val < root.val:
        root.left = insert_bst(root.left, val)
    else:
        root.right = insert_bst(root.right, val)
    return root

root = None
for key in [50, 30, 70, 20, 40, 60, 80]:
    root = insert_bst(root, key)

# Search for 40 by walking left/right branches
curr = root
search_path: list[int] = []
target = 40
while curr is not None:
    search_path.append(curr.val)
    if target == curr.val:
        break
    elif target < curr.val:
        curr = curr.left
    else:
        curr = curr.right

print("BST search path to 40:", search_path)
`,
  },
  {
    id: "sample_min_heap",
    slug: "min-heap",
    title: "Min Heap",
    category: "Advanced",
    description: "Heapify an array, push a smaller key, and extract the minimum root with heapq.",
    code: `import heapq

min_heap = [18, 7, 25, 12, 4]
heapq.heapify(min_heap)

# Push a new minimum element (sifts up to root index 0)
heapq.heappush(min_heap, 2)

# Extract the two smallest elements in O(log n)
first_min = heapq.heappop(min_heap)
second_min = heapq.heappop(min_heap)
print("Extracted:", first_min, second_min, "| Remaining heap:", min_heap)
`,
  },
  {
    id: "sample_recursion_tree",
    slug: "recursion-tree",
    title: "Recursion Tree",
    category: "Advanced",
    description: "Visualize branching recursive subcalls and return values unwinding in a call tree.",
    code: `def climb_ways(steps_left: int) -> int:
    if steps_left <= 1:
        return 1
    take_one = climb_ways(steps_left - 1)
    take_two = climb_ways(steps_left - 2)
    return take_one + take_two

total_ways = climb_ways(4)
print("Distinct ways to climb 4 steps:", total_ways)
`,
  },
];

export const DEFAULT_WORKSPACE_SAMPLE = SAMPLE_PROGRAMS.find(
  (s) => s.slug === "two-pointers"
)!;

