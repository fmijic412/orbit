/**
 * Pure "distance to the next grade" helper, sitting on top of the grade tiers
 * so the end screen can tell the player how close they came to a better letter.
 * Like `grade.ts` it has no renderer, DOM or three.js — Game owns the final
 * score and delegates the lookup here, matching the `scoring.ts` / `bonus.ts` /
 * `countdown.ts` / `leaderboard.ts` / `grade.ts` precedent.
 */

import { GRADE_TIERS, type Grade, type GradeTier } from "./grade";

/**
 * How far a final score is from the next grade up.
 *
 * `atTop` is true when the score already earns the highest tier, in which case
 * there is nothing above it: `nextGrade` is `null` and `pointsToNext` is 0.
 * Otherwise `nextGrade` is the grade immediately above the one earned and
 * `pointsToNext` is the (always positive, whole-number) score still needed to
 * reach it.
 */
export interface NextGradeProgress {
  readonly atTop: boolean;
  readonly nextGrade: Grade | null;
  readonly pointsToNext: number;
}

/**
 * Computes the progress toward the next grade for `score`. Walks the tiers from
 * the highest down to find the first the score reaches; the tier listed just
 * before it (if any) is the next one up. Scores below every tier are treated as
 * sitting on the lowest tier, so the result is always well-defined and the
 * returned `pointsToNext` is never negative.
 */
export function nextGradeProgress(
  score: number,
  tiers: readonly GradeTier[] = GRADE_TIERS,
): NextGradeProgress {
  // Index of the earned tier: the first (highest) whose minScore the score
  // reaches. Falls back to the lowest tier when the score is below them all.
  let earnedIndex = tiers.length - 1;
  for (let i = 0; i < tiers.length; i++) {
    if (score >= tiers[i].minScore) {
      earnedIndex = i;
      break;
    }
  }

  // The next grade up is the tier immediately before the earned one in the
  // highest-first list. Index 0 is already the top tier, so there is none.
  if (earnedIndex === 0) {
    return { atTop: true, nextGrade: null, pointsToNext: 0 };
  }

  const next = tiers[earnedIndex - 1];
  const pointsToNext = Math.max(0, Math.ceil(next.minScore - score));
  return { atTop: false, nextGrade: next.grade, pointsToNext };
}
