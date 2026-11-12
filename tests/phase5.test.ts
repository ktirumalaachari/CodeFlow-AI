import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALGORITHM_CATALOG,
  ALGORITHM_CATEGORIES,
  COMPARISON_SCENARIOS,
  LEARNING_LESSONS,
  LEARNING_TRACKS,
} from "@/lib/data/catalog";

describe("Phase 5 — Algorithm Library, Guided Learning & Comparison Catalogs", () => {
  it("covers all 9 required algorithm categories with complete runnable blueprints", () => {
    const requiredCategories = [
      "Searching",
      "Sorting",
      "Two Pointers",
      "Sliding Window",
      "Recursion",
      "Stack & Queue",
      "Linked Lists",
      "Trees & Graphs",
      "Dynamic Programming",
    ];

    for (const cat of requiredCategories) {
      assert.ok(
        ALGORITHM_CATEGORIES.includes(
          cat as (typeof ALGORITHM_CATEGORIES)[number]
        ),
        `ALGORITHM_CATEGORIES must include ${cat}`
      );
      const matching = ALGORITHM_CATALOG.filter((a) => a.category === cat);
      assert.ok(
        matching.length >= 1,
        `At least one algorithm must exist for category ${cat}`
      );
    }

    assert.ok(ALGORITHM_CATALOG.length >= 14);
    for (const alg of ALGORITHM_CATALOG) {
      assert.ok(
        alg.codeExample.trim().length > 20,
        `${alg.slug} needs codeExample`
      );
      assert.ok(
        alg.howItWorksSteps.length >= 3,
        `${alg.slug} needs at least 3 steps`
      );
      assert.ok((alg.bestTimeComplexity ?? alg.timeComplexity).startsWith("O("));
      assert.ok(alg.timeComplexity.startsWith("O("));
      assert.ok(
        (alg.worstTimeComplexity ?? alg.timeComplexity).startsWith("O(")
      );
      assert.ok(alg.spaceComplexity.startsWith("O("));
      assert.ok(alg.complexityAssumption.trim().length > 10);
    }
  });

  it("provides Beginner, Intermediate, and Advanced learning paths and 12 verified lessons", () => {
    const levels = new Set(LEARNING_TRACKS.map((t) => t.level));
    assert.ok(levels.has("Beginner"));
    assert.ok(levels.has("Intermediate"));
    assert.ok(levels.has("Advanced"));

    assert.equal(LEARNING_LESSONS.length, 12);
    for (const lesson of LEARNING_LESSONS) {
      assert.ok(lesson.mentalModel.length > 20);
      assert.ok(lesson.keyTakeaways.length >= 2);
      assert.ok(lesson.exampleCode.includes("print"));
      assert.ok(lesson.exercise.starterCode.length > 10);
      assert.ok(lesson.exercise.solutionHint.length > 10);
      assert.ok(lesson.exercise.expectedOutputSubstring.length >= 1);
    }
  });

  it("provides 5 dual-runner comparison scenarios with shared inputs and distinct complexities", () => {
    assert.equal(COMPARISON_SCENARIOS.length, 5);
    for (const scenario of COMPARISON_SCENARIOS) {
      assert.ok(scenario.sharedInputCode.trim().length >= 3);
      assert.ok(scenario.bruteForce.code.trim().length > 20);
      assert.ok(scenario.optimized.code.trim().length > 20);
      assert.notEqual(
        scenario.bruteForce.timeComplexity,
        scenario.optimized.timeComplexity
      );
    }
  });
});
