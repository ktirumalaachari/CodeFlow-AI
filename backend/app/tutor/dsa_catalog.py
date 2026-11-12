from __future__ import annotations

from app.schemas.tutor import (
    DSABruteForceVsOptimizedSchema,
    DSAPracticeQuestionSchema,
    DSATopicGuideSchema,
)

DSA_TOPIC_GUIDES: list[DSATopicGuideSchema] = [
    DSATopicGuideSchema(
        slug="arrays-strings",
        title="Arrays & Strings",
        category="Linear Foundations",
        difficulty="Beginner",
        summary="Contiguous indexed sequences supporting O(1) random access, prefix sums, and in-place mutations.",
        concept_explanation=(
            "In Python, `list` is a dynamic contiguous array of object references and `str` is an immutable "
            "contiguous sequence of Unicode characters. Random index lookup `arr[i]` runs in O(1) time, whereas "
            "inserting or deleting in the middle (`arr.insert(i, x)` or `arr.pop(i)`) shifts O(n) elements."
        ),
        how_it_works_steps=[
            "Allocate a contiguous block of index slots [0 .. n-1].",
            "Read or overwrite any slot arr[i] in O(1) constant time using its integer offset.",
            "Precompute running prefix sums or frequency counts in a single O(n) left-to-right pass to answer range queries in O(1).",
        ],
        time_complexity="Access: O(1) · Append/Pop-End: O(1) amortized · Insert/Delete Middle: O(n) · Search: O(n)",
        space_complexity="O(n) for storing n elements (O(1) auxiliary for in-place traversal)",
        complexity_assumptions="Assumes CPython dynamic array over-allocation for amortized O(1) append.",
        sample_slug="array-traversal",
        step_by_step_example=(
            "Given `scores = [72, 88, 95, 64, 91]`, a single traversal maintains `running_total` and `highest` "
            "by inspecting each `index` from `0` to `4` without nested re-scans."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Range Sum Queries on Static Array",
            brute_force_approach="Slice and sum `sum(nums[left:right+1])` for each query.",
            brute_force_time="O(n) per query · O(q * n) total",
            brute_force_space="O(1) auxiliary",
            brute_force_code=(
                "def range_sum_brute(nums: list[int], left: int, right: int) -> int:\n"
                "    total = 0\n"
                "    for i in range(left, right + 1):\n"
                "        total += nums[i]\n"
                "    return total"
            ),
            optimized_approach="Build a prefix sum array once in O(n), then answer any range query in O(1).",
            optimized_time="O(n) build · O(1) per query",
            optimized_space="O(n) prefix array",
            optimized_code=(
                "def build_prefix(nums: list[int]) -> list[int]:\n"
                "    prefix = [0]\n"
                "    for x in nums:\n"
                "        prefix.append(prefix[-1] + x)\n"
                "    return prefix\n\n"
                "def range_sum_opt(prefix: list[int], left: int, right: int) -> int:\n"
                "    return prefix[right + 1] - prefix[left]"
            ),
            key_insight="Prefix sums turn repeated O(n) subarray additions into a single subtraction `prefix[R+1] - prefix[L]`.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): Ask which values are recomputed repeatedly when you scan from index L to R.",
            "Hint 2 (Structure): Store cumulative totals `prefix[i] = sum(nums[0..i-1])` so any slice sum is the difference of two prefix entries.",
            "Hint 3 (Blueprint): Initialize `prefix = [0]`, append `prefix[-1] + num` for each element, and compute `prefix[right + 1] - prefix[left]`.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-arrays-pivot",
                title="Find Equilibrium Pivot Index",
                difficulty="Beginner",
                prompt="Return the leftmost index where the sum of numbers strictly to the left equals the sum strictly to the right.",
                starter_code=(
                    "nums = [1, 7, 3, 6, 5, 6]\n"
                    "total_sum = sum(nums)\n"
                    "left_sum = 0\n"
                    "pivot = -1\n\n"
                    "for i, val in enumerate(nums):\n"
                    "    right_sum = total_sum - left_sum - val\n"
                    "    if left_sum == right_sum:\n"
                    "        pivot = i\n"
                    "        break\n"
                    "    left_sum += val\n\n"
                    "print('Pivot index:', pivot)"
                ),
                progressive_hints=[
                    "If you know `total_sum` and `left_sum`, you do not need a loop to compute `right_sum`.",
                    "At index `i`, `right_sum` is always `total_sum - left_sum - nums[i]`.",
                    "Compare `left_sum == right_sum` before adding `nums[i]` into `left_sum`.",
                ],
                target_complexity="Time: O(n) · Space: O(1)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="two-pointers",
        title="Two Pointers",
        category="Pointer Patterns",
        difficulty="Beginner",
        summary="Coordinate two index variables (`left`/`right` or `slow`/`fast`) to eliminate nested O(n²) loops.",
        concept_explanation=(
            "Two Pointers uses two synchronized indices over a sequence. In converging pointers (`left = 0`, `right = n - 1` "
            "on a sorted array), each comparison eliminates an entire row or column of candidate pairs. In fast/slow pointers, "
            "`fast` scans ahead while `slow` tracks the write boundary."
        ),
        how_it_works_steps=[
            "Place `left = 0` at the start and `right = len(nums) - 1` at the end of a sorted list.",
            "Inspect `current_sum = nums[left] + nums[right]`.",
            "If `current_sum < target`, increment `left` to increase the sum; if `current_sum > target`, decrement `right` to decrease it.",
        ],
        time_complexity="Traversal: O(n) — each pointer moves at most n steps",
        space_complexity="O(1) auxiliary memory",
        complexity_assumptions="Requires sorted input for converging sum search (O(n log n) if sorting is needed first).",
        sample_slug="two-pointers",
        step_by_step_example=(
            "In `nums = [2, 5, 8, 11, 15]` with `target = 16`, `left=0 (2)` and `right=4 (15)` give `17 > 16`, "
            "so `right` moves to `3 (11)`. Next `2 + 11 = 13 < 16`, so `left` moves to `1 (5)`, finding `5 + 11 == 16`."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Two Sum II on Sorted Array",
            brute_force_approach="Check every pair `(i, j)` with nested loops.",
            brute_force_time="O(n²)",
            brute_force_space="O(1)",
            brute_force_code=(
                "def pair_sum_brute(nums: list[int], target: int) -> tuple[int, int]:\n"
                "    for i in range(len(nums)):\n"
                "        for j in range(i + 1, len(nums)):\n"
                "            if nums[i] + nums[j] == target:\n"
                "                return (i, j)\n"
                "    return (-1, -1)"
            ),
            optimized_approach="Converge `left` and `right` inward using sorted order monotonicity.",
            optimized_time="O(n)",
            optimized_space="O(1)",
            optimized_code=(
                "def pair_sum_two_pointers(nums: list[int], target: int) -> tuple[int, int]:\n"
                "    left, right = 0, len(nums) - 1\n"
                "    while left < right:\n"
                "        s = nums[left] + nums[right]\n"
                "        if s == target:\n"
                "            return (left, right)\n"
                "        if s < target:\n"
                "            left += 1\n"
                "        else:\n"
                "            right -= 1\n"
                "    return (-1, -1)"
            ),
            key_insight="When `nums[left] + nums[right] < target`, `nums[left]` paired with any smaller index `< right` is also too small, eliminating all of them in O(1).",
        ),
        progressive_hints=[
            "Hint 1 (Concept): Use the fact that the array is sorted—what happens to the sum when you move the left index right vs. the right index left?",
            "Hint 2 (Strategy): Start with `left = 0` and `right = len(nums) - 1` and compare `nums[left] + nums[right]` to `target`.",
            "Hint 3 (Blueprint): Loop while `left < right`; increment `left` when the sum is too small and decrement `right` when the sum is too large.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-two-pointers-palindrome",
                title="Valid Palindrome Check",
                difficulty="Beginner",
                prompt="Check whether a word reads the same forward and backward using `left` and `right` pointers.",
                starter_code=(
                    "word = 'racecar'\n"
                    "left = 0\n"
                    "right = len(word) - 1\n"
                    "is_palindrome = True\n\n"
                    "while left < right:\n"
                    "    if word[left] != word[right]:\n"
                    "        is_palindrome = False\n"
                    "        break\n"
                    "    left += 1\n"
                    "    right -= 1\n\n"
                    "print('Is palindrome:', is_palindrome)"
                ),
                progressive_hints=[
                    "Compare the outermost characters first.",
                    "If `word[left] == word[right]`, step both pointers inward (`left += 1`, `right -= 1`).",
                    "Stop early as soon as a mismatch occurs or `left >= right`.",
                ],
                target_complexity="Time: O(n) · Space: O(1)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="sliding-window",
        title="Sliding Window",
        category="Pointer Patterns",
        difficulty="Intermediate",
        summary="Maintain a dynamic subarray `[left..right]` and update window state incrementally in O(1) per shift.",
        concept_explanation=(
            "Sliding Window avoids recomputing overlapping contiguous subarrays. As `right` expands the window by one "
            "element, we add `nums[right]` to the running state; when the window violates a size or uniqueness constraint, "
            "`left` advances and removes `nums[left]`."
        ),
        how_it_works_steps=[
            "Initialize window state (`window_sum`, frequency map, or set) and `left = 0`.",
            "Advance `right` across `0 .. n-1`, incorporating `nums[right]` into the window.",
            "Shrink from `left` while the window exceeds size `k` or violates the invariant, updating the best answer at each valid window.",
        ],
        time_complexity="O(n) — `left` and `right` each advance at most n times",
        space_complexity="O(1) for fixed numeric window · O(k) for window frequency map",
        complexity_assumptions="Each element enters the window once and leaves the window at most once (2n pointer ops).",
        sample_slug="sliding-window",
        step_by_step_example=(
            "For `nums = [4, 2, 1, 7, 8, 1, 2, 8]`, `k = 3`: initial window `[4, 2, 1]` sums to `7`. "
            "Sliding to index 3 adds `7` and subtracts `4`, yielding `2 + 1 + 7 = 10` in O(1) without summing 3 elements again."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Maximum Sum Subarray of Size K",
            brute_force_approach="Recompute `sum(nums[i:i+k])` from scratch at every starting index `i`.",
            brute_force_time="O(n * k)",
            brute_force_space="O(1)",
            brute_force_code=(
                "def max_window_brute(nums: list[int], k: int) -> int:\n"
                "    best = float('-inf')\n"
                "    for i in range(len(nums) - k + 1):\n"
                "        best = max(best, sum(nums[i:i + k]))\n"
                "    return int(best)"
            ),
            optimized_approach="Maintain rolling `window_sum` by adding incoming `nums[right]` and subtracting outgoing `nums[right - k]`.",
            optimized_time="O(n)",
            optimized_space="O(1)",
            optimized_code=(
                "def max_window_sliding(nums: list[int], k: int) -> int:\n"
                "    window_sum = sum(nums[:k])\n"
                "    best = window_sum\n"
                "    for right in range(k, len(nums)):\n"
                "        window_sum += nums[right] - nums[right - k]\n"
                "        best = max(best, window_sum)\n"
                "    return best"
            ),
            key_insight="Adjacent windows of size `k` share `k - 1` identical elements; only the two boundary elements change.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): Compare window `[0, 1, 2]` and window `[1, 2, 3]`—which elements stayed the same?",
            "Hint 2 (Strategy): Subtract the element leaving at `right - k` and add the new element entering at `right`.",
            "Hint 3 (Blueprint): Seed `window_sum = sum(nums[:k])`, loop `right` from `k` to `len(nums) - 1`, and update `best = max(best, window_sum)`.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-sliding-window-threshold",
                title="Count Windows Above Average Threshold",
                difficulty="Intermediate",
                prompt="Count how many contiguous windows of size `k = 3` have a sum greater than or equal to `12`.",
                starter_code=(
                    "nums = [2, 5, 6, 3, 8, 1, 7]\n"
                    "k = 3\n"
                    "threshold_sum = 12\n"
                    "window_sum = sum(nums[:k])\n"
                    "qualifying_windows = 1 if window_sum >= threshold_sum else 0\n\n"
                    "for right in range(k, len(nums)):\n"
                    "    window_sum += nums[right] - nums[right - k]\n"
                    "    if window_sum >= threshold_sum:\n"
                    "        qualifying_windows += 1\n\n"
                    "print('Qualifying windows:', qualifying_windows)"
                ),
                progressive_hints=[
                    "Check the first window `nums[:k]` before starting the loop.",
                    "On each step `right`, update `window_sum += nums[right] - nums[right - k]`.",
                    "Increment `qualifying_windows` whenever `window_sum >= threshold_sum`.",
                ],
                target_complexity="Time: O(n) · Space: O(1)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="hash-maps-sets",
        title="Hash Maps & Sets",
        category="Hashing",
        difficulty="Beginner",
        summary="Trade O(n) memory for O(1) average-case key lookup, complement matching, and deduplication.",
        concept_explanation=(
            "Python's `dict` and `set` compute a hash of immutable keys (`int`, `str`, `tuple`) to jump directly "
            "to a table slot in O(1) average time. Replacing an inner O(n) linear scan with a `seen` dictionary "
            "reduces overall algorithm complexity from O(n²) to O(n)."
        ),
        how_it_works_steps=[
            "Initialize an empty dictionary `seen = {}` or set `visited = set()`.",
            "For each element `num` at index `i`, compute the required complement or key.",
            "Check `if complement in seen:` in O(1) average time before recording `seen[num] = i`.",
        ],
        time_complexity="Insert / Lookup / Delete: O(1) average · O(n) worst-case collision",
        space_complexity="O(n) to store up to n distinct keys",
        complexity_assumptions="Average O(1) assumes a well-distributed hash function and load factor < 2/3.",
        sample_slug="hash-map",
        step_by_step_example=(
            "In Two Sum (`nums = [3, 8, 12, 4, 7]`, `target = 11`): at `i=0 (3)`, `seen={3: 0}`. "
            "At `i=1 (8)`, `complement = 11 - 8 = 3` is already in `seen`, immediately returning `(0, 1)`."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Unsorted Two Sum",
            brute_force_approach="Scan all `(i, j)` pairs with nested loops.",
            brute_force_time="O(n²)",
            brute_force_space="O(1)",
            brute_force_code=(
                "def two_sum_brute(nums: list[int], target: int) -> tuple[int, int]:\n"
                "    for i in range(len(nums)):\n"
                "        for j in range(i + 1, len(nums)):\n"
                "            if nums[i] + nums[j] == target:\n"
                "                return (i, j)\n"
                "    return (-1, -1)"
            ),
            optimized_approach="Store each number's index in a dictionary and check `target - num in seen` in O(1).",
            optimized_time="O(n)",
            optimized_space="O(n)",
            optimized_code=(
                "def two_sum_hashmap(nums: list[int], target: int) -> tuple[int, int]:\n"
                "    seen: dict[int, int] = {}\n"
                "    for i, num in enumerate(nums):\n"
                "        need = target - num\n"
                "        if need in seen:\n"
                "            return (seen[need], i)\n"
                "        seen[num] = i\n"
                "    return (-1, -1)"
            ),
            key_insight="Remembering past elements in a `dict` turns a backward linear search into an O(1) key lookup.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): At index `i` with value `num`, what exact partner value do you need to reach `target`?",
            "Hint 2 (Structure): Map each value you have already visited to its index in a Python `dict`.",
            "Hint 3 (Blueprint): Check `if target - num in seen:` before setting `seen[num] = i` so you don't pair an element with itself.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-hashmap-first-unique",
                title="First Non-Repeating Character",
                difficulty="Beginner",
                prompt="Find the first character in a string that appears with frequency 1.",
                starter_code=(
                    "text = 'swiss'\n"
                    "counts: dict[str, int] = {}\n"
                    "for ch in text:\n"
                    "    counts[ch] = counts.get(ch, 0) + 1\n\n"
                    "first_unique = None\n"
                    "for ch in text:\n"
                    "    if counts[ch] == 1:\n"
                    "        first_unique = ch\n"
                    "        break\n\n"
                    "print('First unique character:', first_unique)"
                ),
                progressive_hints=[
                    "Build a frequency map `counts[ch]` in one pass over the string.",
                    "Do a second pass over `text` in order and check `counts[ch] == 1`.",
                    "Break on the first character whose count equals 1.",
                ],
                target_complexity="Time: O(n) · Space: O(k) unique characters",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="binary-search",
        title="Binary Search",
        category="Sorting & Searching",
        difficulty="Beginner",
        summary="Halve a sorted or monotonic search interval `[low..high]` on every midpoint comparison in O(log n) time.",
        concept_explanation=(
            "Binary Search inspects the midpoint `mid = (low + high) // 2` of a sorted interval. Because the sequence "
            "is ordered, a single comparison against `nums[mid]` proves whether the target can only lie in the left half "
            "`[low..mid-1]` or the right half `[mid+1..high]`, discarding 50% of the remaining elements each step."
        ),
        how_it_works_steps=[
            "Set `low = 0` and `high = len(nums) - 1`.",
            "While `low <= high`, compute `mid = (low + high) // 2` and inspect `nums[mid]`.",
            "If `nums[mid] == target`, return `mid`; if `nums[mid] < target`, set `low = mid + 1`; else set `high = mid - 1`.",
        ],
        time_complexity="Search: O(log n) — at most ⌊log₂(n)⌋ + 1 comparisons",
        space_complexity="O(1) iterative · O(log n) recursive call stack",
        complexity_assumptions="Requires random O(1) index access (`list`/`tuple`) and sorted monotonic order.",
        sample_slug="binary-search",
        step_by_step_example=(
            "Searching for `23` in 7 sorted elements `[3, 9, 14, 19, 23, 31, 42]`: Step 1 checks `mid=3 (19 < 23)`, "
            "updating `low=4`. Step 2 checks `mid=5 (31 > 23)`, updating `high=4`. Step 3 checks `mid=4 (23 == 23)`."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Sorted Array Target Lookup",
            brute_force_approach="Scan every index from `0` to `n - 1` sequentially.",
            brute_force_time="O(n)",
            brute_force_space="O(1)",
            brute_force_code=(
                "def linear_search(nums: list[int], target: int) -> int:\n"
                "    for i, val in enumerate(nums):\n"
                "        if val == target:\n"
                "            return i\n"
                "    return -1"
            ),
            optimized_approach="Bisect the active interval `[low, high]` using `mid = (low + high) // 2`.",
            optimized_time="O(log n)",
            optimized_space="O(1)",
            optimized_code=(
                "def binary_search(nums: list[int], target: int) -> int:\n"
                "    low, high = 0, len(nums) - 1\n"
                "    while low <= high:\n"
                "        mid = (low + high) // 2\n"
                "        if nums[mid] == target:\n"
                "            return mid\n"
                "        if nums[mid] < target:\n"
                "            low = mid + 1\n"
                "        else:\n"
                "            high = mid - 1\n"
                "    return -1"
            ),
            key_insight="For 1,000,000 sorted items, linear search takes up to 1,000,000 steps while binary search takes at most 20 steps.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): If the middle element is smaller than `target`, can `target` ever appear at or to the left of `mid`?",
            "Hint 2 (Strategy): Advance `low = mid + 1` when `nums[mid] < target` and `high = mid - 1` when `nums[mid] > target`.",
            "Hint 3 (Blueprint): Use `while low <= high:` so single-element intervals (`low == high`) are still checked.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-bsearch-insert-pos",
                title="Search Insert Position (Lower Bound)",
                difficulty="Beginner",
                prompt="Find the index where `target` is found, or the index where it should be inserted to keep `nums` sorted.",
                starter_code=(
                    "nums = [2, 4, 6, 9, 13]\n"
                    "target = 7\n"
                    "low, high = 0, len(nums) - 1\n\n"
                    "while low <= high:\n"
                    "    mid = (low + high) // 2\n"
                    "    if nums[mid] < target:\n"
                    "        low = mid + 1\n"
                    "    else:\n"
                    "        high = mid - 1\n\n"
                    "print('Insert position for', target, 'is index:', low)"
                ),
                progressive_hints=[
                    "Maintain the invariant that all elements at indices `< low` are strictly less than `target`.",
                    "When `nums[mid] >= target`, move `high = mid - 1`.",
                    "When the loop ends (`low > high`), `low` points to the exact insertion index.",
                ],
                target_complexity="Time: O(log n) · Space: O(1)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="recursion",
        title="Recursion & Call Stack",
        category="Recursion & Backtracking",
        difficulty="Intermediate",
        summary="Decompose problems into self-similar subproblems managed on Python's runtime call stack.",
        concept_explanation=(
            "Every recursive call allocates a new stack frame holding its own local arguments and return address. "
            "Execution pushes frames downward until a base case returns a concrete value, after which frames unwind "
            "in LIFO order, combining child results."
        ),
        how_it_works_steps=[
            "Define a strict base case (`if n <= 1: return 1`) that terminates recursion without further calls.",
            "Reduce the input toward the base case in each recursive call (`n - 1`).",
            "Combine the returned child values as the call stack unwinds.",
        ],
        time_complexity="Linear recursion: O(n) · Binary branching recursion: O(2^n) without memoization",
        space_complexity="O(d) call stack frames where d is maximum recursion depth",
        complexity_assumptions="Each active call frame consumes O(1) frame overhead on the call stack.",
        sample_slug="recursion-tree",
        step_by_step_example=(
            "`climb_ways(4)` branches into `climb_ways(3)` and `climb_ways(2)`, reaching base cases `steps_left <= 1` "
            "and unwinding return values `3 + 2 = 5`."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Nth Fibonacci Number",
            brute_force_approach="Unmemoized binary recursion `fib(n-1) + fib(n-2)` recomputing identical subtrees.",
            brute_force_time="O(2^n)",
            brute_force_space="O(n) stack depth",
            brute_force_code=(
                "def fib_naive(n: int) -> int:\n"
                "    if n <= 1:\n"
                "        return n\n"
                "    return fib_naive(n - 1) + fib_naive(n - 2)"
            ),
            optimized_approach="Cache computed results in a `memo` dictionary so each state `0..n` is solved once.",
            optimized_time="O(n)",
            optimized_space="O(n)",
            optimized_code=(
                "def fib_memo(n: int, memo: dict[int, int] | None = None) -> int:\n"
                "    if memo is None:\n"
                "        memo = {0: 0, 1: 1}\n"
                "    if n not in memo:\n"
                "        memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)\n"
                "    return memo[n]"
            ),
            key_insight="Caching repeated subproblems prunes exponential call trees into a linear O(n) DAG.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): Always verify that every recursive branch strictly shrinks the problem toward the base case.",
            "Hint 2 (Strategy): Inspect the Recursion & Memory visualizer tab to see if identical arguments are called multiple times.",
            "Hint 3 (Blueprint): Pass a `memo` dict or use bottom-up iteration when overlapping subproblems appear.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-recursion-sum-digits",
                title="Recursive Sum of Digits",
                difficulty="Beginner",
                prompt="Compute the sum of digits of a non-negative integer `n` recursively using `n % 10` and `n // 10`.",
                starter_code=(
                    "def sum_digits(n: int) -> int:\n"
                    "    if n < 10:\n"
                    "        return n\n"
                    "    return (n % 10) + sum_digits(n // 10)\n\n"
                    "result = sum_digits(4927)\n"
                    "print('Digit sum:', result)"
                ),
                progressive_hints=[
                    "What is the base case when `n` is a single digit (`n < 10`)?",
                    "Extract the last digit with `n % 10` and strip it with integer division `n // 10`.",
                    "Return `(n % 10) + sum_digits(n // 10)`.",
                ],
                target_complexity="Time: O(log₁₀ n) · Space: O(log₁₀ n) stack frames",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="sorting",
        title="Sorting Algorithms",
        category="Sorting & Searching",
        difficulty="Intermediate",
        summary="Compare O(n²) quadratic exchange sorts against O(n log n) divide-and-conquer Merge Sort and Quick Sort.",
        concept_explanation=(
            "Elementary sorts (Bubble, Insertion, Selection) compare adjacent or remaining elements in O(n²) time. "
            "Divide-and-Conquer sorts (Merge Sort, Quick Sort) partition the array into halves or around a pivot, "
            "performing O(n) work across O(log n) levels for O(n log n) total comparisons."
        ),
        how_it_works_steps=[
            "Divide: Split the array at midpoint `mid` (Merge Sort) or partition around a `pivot` (Quick Sort).",
            "Conquer: Recursively sort the left and right subarrays.",
            "Combine: Merge two sorted halves using two pointers in O(n) linear time.",
        ],
        time_complexity="Merge Sort: O(n log n) guaranteed · Quick Sort: O(n log n) average, O(n²) worst pivot",
        space_complexity="Merge Sort: O(n) auxiliary · In-place Quick Sort: O(log n) stack",
        complexity_assumptions="Comparison-based sorting requires Ω(n log n) comparisons in the decision-tree model.",
        sample_slug="merge-sort",
        step_by_step_example=(
            "`merge_sort([38, 27, 43, 3, 9, 10])` splits down to single-element lists and merges sorted pairs "
            "`[27, 38, 43]` and `[3, 9, 10]` via two pointers `i` and `j`."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Sorting n Comparable Elements",
            brute_force_approach="Bubble Sort / Selection Sort scanning remaining unsorted elements repeatedly.",
            brute_force_time="O(n²)",
            brute_force_space="O(1)",
            brute_force_code=(
                "def bubble_sort(nums: list[int]) -> list[int]:\n"
                "    arr = nums[:]\n"
                "    n = len(arr)\n"
                "    for i in range(n):\n"
                "        for j in range(0, n - i - 1):\n"
                "            if arr[j] > arr[j + 1]:\n"
                "                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n"
                "    return arr"
            ),
            optimized_approach="Divide-and-Conquer Merge Sort bisecting to base cases and merging in linear time.",
            optimized_time="O(n log n)",
            optimized_space="O(n)",
            optimized_code=(
                "def merge_sort(nums: list[int]) -> list[int]:\n"
                "    if len(nums) <= 1:\n"
                "        return nums\n"
                "    mid = len(nums) // 2\n"
                "    left = merge_sort(nums[:mid])\n"
                "    right = merge_sort(nums[mid:])\n"
                "    merged: list[int] = []\n"
                "    i = j = 0\n"
                "    while i < len(left) and j < len(right):\n"
                "        if left[i] <= right[j]:\n"
                "            merged.append(left[i]); i += 1\n"
                "        else:\n"
                "            merged.append(right[j]); j += 1\n"
                "    return merged + left[i:] + right[j:]"
            ),
            key_insight="Two already-sorted halves of total length `n` can be merged in just `n` comparisons using two advancing pointers.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): Why is merging two sorted lists of size `n/2` much faster than sorting from scratch?",
            "Hint 2 (Strategy): Compare only the front unconsumed elements `left[i]` and `right[j]` at each step.",
            "Hint 3 (Blueprint): Append the smaller of `left[i]` and `right[j]`, advance that pointer, and extend any remaining tail.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-sorting-insertion",
                title="In-Place Insertion Sort Trace",
                difficulty="Beginner",
                prompt="Sort a small list in-place by shifting larger elements right until `key` fits.",
                starter_code=(
                    "nums = [12, 5, 8, 3, 10]\n"
                    "for i in range(1, len(nums)):\n"
                    "    key = nums[i]\n"
                    "    j = i - 1\n"
                    "    while j >= 0 and nums[j] > key:\n"
                    "        nums[j + 1] = nums[j]\n"
                    "        j -= 1\n"
                    "    nums[j + 1] = key\n\n"
                    "print('Sorted:', nums)"
                ),
                progressive_hints=[
                    "Maintain `nums[0..i-1]` in sorted order before inserting `key = nums[i]`.",
                    "Shift `nums[j]` to `nums[j + 1]` while `j >= 0` and `nums[j] > key`.",
                    "Place `key` at `nums[j + 1]` once shifting stops.",
                ],
                target_complexity="Time: O(n²) worst, O(n) nearly-sorted · Space: O(1)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="stacks-queues",
        title="Stacks & Queues",
        category="Linear Foundations",
        difficulty="Beginner",
        summary="Control processing order with LIFO Stacks (`append`/`pop`) and FIFO Queues (`collections.deque`).",
        concept_explanation=(
            "A **Stack** follows Last-In, First-Out (LIFO): `stack.append(x)` pushes to the top and `stack.pop()` "
            "removes the most recent item in O(1)—ideal for matching nested delimiters and monotonic spans. "
            "A **Queue** follows First-In, First-Out (FIFO): `deque.append(x)` enqueues at the rear and `deque.popleft()` "
            "dequeues from the front in O(1)—essential for level-order BFS."
        ),
        how_it_works_steps=[
            "For LIFO matching, push opening tokens onto `stack` and pop/verify when a closing token arrives.",
            "For FIFO scheduling or BFS, use `collections.deque` so `popleft()` never shifts elements.",
            "Inspect the top (`stack[-1]`) or front (`queue[0]`) in O(1) time before popping.",
        ],
        time_complexity="Push / Pop / Enqueue / Dequeue (`deque`): O(1)",
        space_complexity="O(n) for up to n buffered elements",
        complexity_assumptions="Using `list.pop(0)` for a queue costs O(n); always use `collections.deque.popleft()` for O(1).",
        sample_slug="stack",
        step_by_step_example=(
            "Validating `'({[]})'`: `'('`, `'{'`, `'['` push onto `stack`. When `']'` arrives, `stack.pop()` returns `'['` "
            "(matched), continuing until `stack` is empty."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="FIFO Queue Dequeue Implementation in Python",
            brute_force_approach="Use a standard Python `list` and call `queue.pop(0)` to dequeue from the front.",
            brute_force_time="O(n) per dequeue · O(n²) for n dequeues",
            brute_force_space="O(n)",
            brute_force_code=(
                "def process_with_list_queue(tasks: list[str]) -> list[str]:\n"
                "    q = list(tasks)\n"
                "    order: list[str] = []\n"
                "    while q:\n"
                "        order.append(q.pop(0))  # Shifts all remaining items!\n"
                "    return order"
            ),
            optimized_approach="Use `collections.deque` and call `queue.popleft()` in O(1) pointer time.",
            optimized_time="O(1) per dequeue · O(n) total",
            optimized_space="O(n)",
            optimized_code=(
                "from collections import deque\n\n"
                "def process_with_deque(tasks: list[str]) -> list[str]:\n"
                "    q = deque(tasks)\n"
                "    order: list[str] = []\n"
                "    while q:\n"
                "        order.append(q.popleft())\n"
                "    return order"
            ),
            key_insight="`deque` is implemented as a doubly-linked chain of blocks, making both ends O(1) without array shifting.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): Does the problem require processing the most-recently seen item first (LIFO) or the oldest waiting item first (FIFO)?",
            "Hint 2 (Structure): Use `list` (`append`/`pop`) for a Stack and `collections.deque` (`append`/`popleft`) for a Queue.",
            "Hint 3 (Blueprint): Always guard `pop()` / `popleft()` with an emptiness check `if stack:` or `while queue:`.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-stack-next-greater",
                title="Monotonic Stack — Next Greater Element",
                difficulty="Intermediate",
                prompt="For each element in `nums`, find the next strictly greater element to its right using a monotonic decreasing stack of indices.",
                starter_code=(
                    "nums = [4, 2, 6, 5, 8]\n"
                    "result = [-1] * len(nums)\n"
                    "stack: list[int] = []  # stores waiting indices\n\n"
                    "for i, val in enumerate(nums):\n"
                    "    while stack and nums[stack[-1]] < val:\n"
                    "        prev_idx = stack.pop()\n"
                    "        result[prev_idx] = val\n"
                    "    stack.append(i)\n\n"
                    "print('Next greater elements:', result)"
                ),
                progressive_hints=[
                    "Store indices in `stack` whose next greater element has not been seen yet.",
                    "When `nums[i]` is larger than `nums[stack[-1]]`, pop that index and record `result[prev_idx] = nums[i]`.",
                    "Each index is pushed once and popped at most once, giving O(n) total time.",
                ],
                target_complexity="Time: O(n) · Space: O(n)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="linked-lists",
        title="Linked Lists",
        category="Pointer Patterns",
        difficulty="Intermediate",
        summary="Rewire heap node references (`.next` / `.prev`) in O(1) without shifting contiguous memory.",
        concept_explanation=(
            "A Linked List chains dynamically allocated node objects via `.next` (and `.prev` in doubly linked lists). "
            "While indexing the k-th node requires O(k) sequential traversal from `head`, splicing or deleting a node "
            "given a pointer to its predecessor rewires `.next` references in O(1) time."
        ),
        how_it_works_steps=[
            "Start traversal with `curr = head` and advance via `curr = curr.next` until `curr is None`.",
            "When splicing `new_node` after `prev`, always set `new_node.next = prev.next` BEFORE `prev.next = new_node` so the tail is never orphaned.",
            "For in-place reversal, maintain `prev = None`, `curr = head`, and save `nxt = curr.next` before flipping `curr.next = prev`.",
        ],
        time_complexity="Insert/Delete at Known Node: O(1) · Search / K-th Access: O(n)",
        space_complexity="O(n) for n heap node instances · O(1) auxiliary for pointer traversal",
        complexity_assumptions="O(1) insertion/deletion assumes you already hold a reference to the target/predecessor node.",
        sample_slug="singly-linked-list",
        step_by_step_example=(
            "Splicing `ListNode(30)` between `second (20)` and `third (40)` sets `new_node.next = second.next` (`ref#3`) "
            "and then `second.next = new_node` (`ref#4`)."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Reverse a Singly Linked List",
            brute_force_approach="Copy all node values into a Python list and allocate brand-new nodes in reverse order.",
            brute_force_time="O(n)",
            brute_force_space="O(n) extra nodes and list",
            brute_force_code=(
                "def reverse_copy(head):\n"
                "    vals = []\n"
                "    curr = head\n"
                "    while curr:\n"
                "        vals.append(curr.val)\n"
                "        curr = curr.next\n"
                "    # Requires allocating n new ListNodes..."
            ),
            optimized_approach="Rewire `.next` pointers in-place using three pointers (`prev`, `curr`, `nxt`) in O(1) extra space.",
            optimized_time="O(n)",
            optimized_space="O(1)",
            optimized_code=(
                "def reverse_in_place(head):\n"
                "    prev = None\n"
                "    curr = head\n"
                "    while curr is not None:\n"
                "        nxt = curr.next\n"
                "        curr.next = prev\n"
                "        prev = curr\n"
                "        curr = nxt\n"
                "    return prev"
            ),
            key_insight="Saving `nxt = curr.next` before overwriting `curr.next = prev` reverses every link in-place with zero node allocations.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): What happens to the rest of the list if you overwrite `curr.next` before saving its old value?",
            "Hint 2 (Strategy): Track `prev`, `curr`, and `nxt = curr.next` on each iteration.",
            "Hint 3 (Blueprint): Flip `curr.next = prev`, then advance `prev = curr` and `curr = nxt`.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-ll-reverse",
                title="In-Place Linked List Reversal",
                difficulty="Intermediate",
                prompt="Reverse a 3-node singly linked list `10 -> 20 -> 30` in-place so `prev` becomes `30 -> 20 -> 10`.",
                starter_code=(
                    "class ListNode:\n"
                    "    def __init__(self, val: int):\n"
                    "        self.val = val\n"
                    "        self.next: ListNode | None = None\n\n"
                    "head = ListNode(10)\n"
                    "head.next = ListNode(20)\n"
                    "head.next.next = ListNode(30)\n\n"
                    "prev = None\n"
                    "curr = head\n"
                    "while curr is not None:\n"
                    "    nxt = curr.next\n"
                    "    curr.next = prev\n"
                    "    prev = curr\n"
                    "    curr = nxt\n\n"
                    "head = prev\n"
                    "print('New head val:', head.val if head else None)"
                ),
                progressive_hints=[
                    "Save `nxt = curr.next` as the first line inside the loop.",
                    "Point `curr.next = prev` to reverse the arrow.",
                    "Advance `prev = curr` and `curr = nxt`; when `curr` is `None`, `prev` is the new head.",
                ],
                target_complexity="Time: O(n) · Space: O(1)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="trees-graphs",
        title="Trees & Graphs",
        category="Trees & Graphs",
        difficulty="Intermediate",
        summary="Navigate hierarchical Binary Search Trees and general Graph networks via DFS and BFS.",
        concept_explanation=(
            "**Binary Trees** organize nodes hierarchically with `.left` and `.right` children; a **BST** adds the ordering "
            "invariant `left.val < node.val < right.val` enabling O(h) search. **Graphs** generalize relationships to arbitrary "
            "vertices and edges (`V`, `E`), requiring a `visited` set during **BFS** (shortest unweighted path via FIFO queue) "
            "or **DFS** (connected components/cycles via recursion or stack)."
        ),
        how_it_works_steps=[
            "For BST lookup/insert, compare `key` with `curr.val` and branch left (`key < curr.val`) or right (`key > curr.val`).",
            "For Graph BFS, push the start vertex into a `deque` and mark it in `visited` immediately when enqueuing.",
            "Pop the front vertex, record it in traversal order, and enqueue all unvisited neighbors.",
        ],
        time_complexity="BST Search: O(log n) balanced, O(n) skewed · Graph BFS/DFS: O(V + E)",
        space_complexity="Tree DFS: O(h) · Graph BFS/DFS: O(V) for visited set and frontier",
        complexity_assumptions="Adjacency-list BFS/DFS inspects each vertex once (O(V)) and each directed/undirected edge once (O(E)).",
        sample_slug="graphs",
        step_by_step_example=(
            "In Graph BFS starting at `'A'`, `'A'` enqueues neighbors `'B'` and `'C'` (distance 1) before exploring `'D'`, `'E'`, `'F'` (distance 2)."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="Searching for a Key in a Binary Tree vs. Balanced BST",
            brute_force_approach="Exhaustive DFS visiting both left and right subtrees when ordering is ignored.",
            brute_force_time="O(n)",
            brute_force_space="O(h)",
            brute_force_code=(
                "def find_exhaustive(node, target: int) -> bool:\n"
                "    if node is None:\n"
                "        return False\n"
                "    if node.val == target:\n"
                "        return True\n"
                "    return find_exhaustive(node.left, target) or find_exhaustive(node.right, target)"
            ),
            optimized_approach="Exploit the BST invariant to prune an entire subtree at every level.",
            optimized_time="O(log n) balanced · O(h)",
            optimized_space="O(1) iterative",
            optimized_code=(
                "def find_bst_iterative(root, target: int) -> bool:\n"
                "    curr = root\n"
                "    while curr is not None:\n"
                "        if target == curr.val:\n"
                "            return True\n"
                "        curr = curr.left if target < curr.val else curr.right\n"
                "    return False"
            ),
            key_insight="The BST invariant turns tree search into binary search along a root-to-leaf path of length at most `h`.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): In a graph with cycles, what prevents BFS or DFS from looping infinitely?",
            "Hint 2 (Strategy): Add a neighbor to `visited` as soon as you enqueue it, not when you pop it later.",
            "Hint 3 (Blueprint): Use `deque([start])` for level-by-level shortest paths or recursion/stack for depth-first exploration.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-tree-max-depth",
                title="Maximum Depth of a Binary Tree",
                difficulty="Beginner",
                prompt="Compute the height (maximum root-to-leaf node count) of a binary tree recursively.",
                starter_code=(
                    "class TreeNode:\n"
                    "    def __init__(self, val: int, left=None, right=None):\n"
                    "        self.val = val\n"
                    "        self.left = left\n"
                    "        self.right = right\n\n"
                    "def max_depth(node: TreeNode | None) -> int:\n"
                    "    if node is None:\n"
                    "        return 0\n"
                    "    return 1 + max(max_depth(node.left), max_depth(node.right))\n\n"
                    "root = TreeNode(10, TreeNode(5, TreeNode(2)), TreeNode(15))\n"
                    "print('Max tree depth:', max_depth(root))"
                ),
                progressive_hints=[
                    "What is the depth of an empty subtree (`node is None`)?",
                    "A non-empty node adds `1` to the deeper of its left and right subtrees.",
                    "Return `1 + max(max_depth(node.left), max_depth(node.right))`.",
                ],
                target_complexity="Time: O(V) · Space: O(h)",
            )
        ],
    ),
    DSATopicGuideSchema(
        slug="dynamic-programming",
        title="Dynamic Programming",
        category="Recursion & Backtracking",
        difficulty="Advanced",
        summary="Solve overlapping subproblems and optimal substructure via Top-Down Memoization or Bottom-Up Tabulation.",
        concept_explanation=(
            "Dynamic Programming (DP) applies when a problem exhibits **overlapping subproblems** (the same state is "
            "needed repeatedly) and **optimal substructure** (the optimal answer is built from optimal sub-answers). "
            "Bottom-up tabulation fills a `dp` array iteratively from base cases `dp[0]`, `dp[1]` up to `dp[n]`, "
            "eliminating recursion overhead entirely."
        ),
        how_it_works_steps=[
            "Define the state `dp[i]` clearly (e.g., minimum cost or number of ways to reach index `i`).",
            "Write the state transition recurrence relating `dp[i]` to earlier states (`dp[i-1]`, `dp[i-2]`).",
            "Initialize base cases (`dp[0]`, `dp[1]`) and iterate `i` forward in topological order.",
        ],
        time_complexity="O(states × transitions_per_state) — typically O(n) or O(n * amount)",
        space_complexity="O(n) for 1D `dp` table · O(1) when compressed to rolling variables",
        complexity_assumptions="Assumes each state transition is computed in O(1) or bounded inner loop steps.",
        sample_slug="fibonacci",
        step_by_step_example=(
            "In bottom-up DP for Climbing Stairs / Fibonacci, `dp = [0, 1, 1, 2, 3, 5, 8, 13]` computes each entry "
            "in a single addition `dp[i] = dp[i-1] + dp[i-2]`."
        ),
        comparison=DSABruteForceVsOptimizedSchema(
            problem_title="House Robber / Maximum Non-Adjacent Sum",
            brute_force_approach="Branch recursively at every index `i`: rob `i` and skip to `i+2`, or skip `i` and move to `i+1`.",
            brute_force_time="O(2^n)",
            brute_force_space="O(n) call stack",
            brute_force_code=(
                "def rob_brute(nums: list[int], i: int = 0) -> int:\n"
                "    if i >= len(nums):\n"
                "        return 0\n"
                "    return max(nums[i] + rob_brute(nums, i + 2), rob_brute(nums, i + 1))"
            ),
            optimized_approach="Bottom-up DP table `dp[i] = max(dp[i-1], dp[i-2] + nums[i])` in O(n) time.",
            optimized_time="O(n)",
            optimized_space="O(n) table (or O(1) rolling)",
            optimized_code=(
                "def rob_dp(nums: list[int]) -> int:\n"
                "    if not nums:\n"
                "        return 0\n"
                "    if len(nums) == 1:\n"
                "        return nums[0]\n"
                "    dp = [0] * len(nums)\n"
                "    dp[0] = nums[0]\n"
                "    dp[1] = max(nums[0], nums[1])\n"
                "    for i in range(2, len(nums)):\n"
                "        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])\n"
                "    return dp[-1]"
            ),
            key_insight="Storing `dp[i]` in an array turns an exponential branching tree into a single linear `for` loop.",
        ),
        progressive_hints=[
            "Hint 1 (Concept): What is the subproblem decision at index `i`, and which previous indices does it depend on?",
            "Hint 2 (Strategy): Define `dp[i]` as the best answer for prefix `0..i` and express `dp[i]` using `dp[i-1]` and `dp[i-2]`.",
            "Hint 3 (Blueprint): Seed `dp[0]` and `dp[1]`, then fill `dp[i] = max(dp[i-1], dp[i-2] + nums[i])` from `i = 2` to `n - 1`.",
        ],
        practice_questions=[
            DSAPracticeQuestionSchema(
                id="prac-dp-house-robber",
                title="Bottom-Up House Robber DP Table",
                difficulty="Intermediate",
                prompt="Build a `dp` array where `dp[i]` stores the maximum loot from houses `0..i` without robbing adjacent houses.",
                starter_code=(
                    "houses = [3, 10, 3, 1, 2, 8]\n"
                    "dp = [0] * len(houses)\n"
                    "dp[0] = houses[0]\n"
                    "dp[1] = max(houses[0], houses[1])\n\n"
                    "for i in range(2, len(houses)):\n"
                    "    dp[i] = max(dp[i - 1], dp[i - 2] + houses[i])\n\n"
                    "print('DP table:', dp)\n"
                    "print('Max loot:', dp[-1])"
                ),
                progressive_hints=[
                    "At house `i`, you either skip it (`dp[i - 1]`) or rob it (`dp[i - 2] + houses[i]`).",
                    "Take `max(dp[i - 1], dp[i - 2] + houses[i])` at each step.",
                    "Watch the `dp` array fill left-to-right in the Array Visualizer!",
                ],
                target_complexity="Time: O(n) · Space: O(n)",
            )
        ],
    ),
]


def get_all_dsa_topics() -> list[DSATopicGuideSchema]:
    return DSA_TOPIC_GUIDES


def get_dsa_topic_by_slug(slug: str) -> DSATopicGuideSchema | None:
    normalized = slug.strip().lower()
    for topic in DSA_TOPIC_GUIDES:
        if topic.slug == normalized or normalized in topic.slug:
            return topic
    return None

