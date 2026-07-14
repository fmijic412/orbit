/**
 * Pure end-of-round performance grade, extracted from Game so the letter-grade
 * mapping can be unit-tested with plain numbers — no renderer, DOM or three.js.
 * Game owns the mutable round state (final score) and delegates the lookup to
 * this function, matching the `scoring.ts` / `bonus.ts` / `countdown.ts` /
 * `leaderboard.ts` precedent.
 */

/** The letter grades a round can earn, best (`S`) to worst (`D`). */
export type Grade = "S" | "A" | "B" | "C" | "D";

/** A grade and the minimum final score needed to earn it. */
export interface GradeTier {
  readonly grade: Grade;
  readonly minScore: number;
}

/**
 * Score thresholds for each grade, ordered highest tier first. A final score at
 * or above a tier's `minScore` earns that tier's grade; the lowest tier's
 * `minScore` of 0 is the floor, so every completed round earns at least a `D`.
 */
export const GRADE_TIERS: readonly GradeTier[] = [
  { grade: "S", minScore: 600 },
  { grade: "A", minScore: 400 },
  { grade: "B", minScore: 250 },
  { grade: "C", minScore: 120 },
  { grade: "D", minScore: 0 },
];

/** CSS colour used to tint each grade on the end screen. */
export const GRADE_COLOR: Record<Grade, string> = {
  S: "#ffd23f",
  A: "#5cffb0",
  B: "#5cc8ff",
  C: "#c9a6ff",
  D: "#9aa6c0",
};

/**
 * Maps a final round score to its letter grade by walking `tiers` from the
 * highest down and returning the first the score reaches. Scores below every
 * tier (e.g. a negative score after hazard penalties) fall to the lowest tier,
 * so the return is always a valid `Grade`.
 */
export function gradeFor(
  score: number,
  tiers: readonly GradeTier[] = GRADE_TIERS,
): Grade {
  for (const tier of tiers) {
    if (score >= tier.minScore) return tier.grade;
  }
  return tiers[tiers.length - 1].grade;
}
