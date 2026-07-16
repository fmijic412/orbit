/**
 * Pure end-of-round "defense rating", derived from how many times the player
 * was clipped by a hazard during the round. Like `grade.ts` it maps a single
 * round number to a label with no renderer, DOM or three.js — Game owns the
 * mutable round state (the hazard-hit count) and delegates the lookup here,
 * matching the `scoring.ts` / `bonus.ts` / `countdown.ts` / `leaderboard.ts` /
 * `grade.ts` / `nextGrade.ts` precedent.
 */

/** The defense ratings a round can earn, best (fewest hits) to worst. */
export type DefenseRating = "Untouchable" | "Nimble" | "Guarded" | "Reckless";

/** A rating and the most hazard hits a round may take and still earn it. */
export interface DefenseTier {
  readonly rating: DefenseRating;
  readonly maxHits: number;
}

/**
 * Hazard-hit thresholds for each rating, ordered best (fewest hits) first. A
 * round earns the first tier whose `maxHits` its hit count does not exceed. The
 * worst tier's `maxHits` of `Infinity` is the catch-all, so any hit count — no
 * matter how high — always maps to a valid rating.
 */
export const DEFENSE_TIERS: readonly DefenseTier[] = [
  { rating: "Untouchable", maxHits: 0 },
  { rating: "Nimble", maxHits: 2 },
  { rating: "Guarded", maxHits: 5 },
  { rating: "Reckless", maxHits: Infinity },
];

/** CSS colour used to tint each rating on the end screen. */
export const DEFENSE_COLOR: Record<DefenseRating, string> = {
  Untouchable: "#ffd23f",
  Nimble: "#5cffb0",
  Guarded: "#5cc8ff",
  Reckless: "#ff7a8a",
};

/**
 * Maps a round's hazard-hit count to its defense rating by walking `tiers` from
 * the best (fewest hits) down and returning the first whose `maxHits` the count
 * does not exceed. Negative counts (which shouldn't occur, but guard anyway)
 * are treated as 0 so they earn the top rating; the `Infinity` catch-all tier
 * guarantees the return is always a valid `DefenseRating`.
 */
export function defenseFor(
  hits: number,
  tiers: readonly DefenseTier[] = DEFENSE_TIERS,
): DefenseRating {
  const clamped = Math.max(0, hits);
  for (const tier of tiers) {
    if (clamped <= tier.maxHits) return tier.rating;
  }
  return tiers[tiers.length - 1].rating;
}

/**
 * A short, human-readable summary of the hazard hits taken, with correct
 * singular/plural wording: `"no hazard hits"`, `"1 hazard hit"`, or
 * `"N hazard hits"`. Negative counts are clamped to 0.
 */
export function hitsSummary(hits: number): string {
  const clamped = Math.max(0, Math.floor(hits));
  if (clamped === 0) return "no hazard hits";
  if (clamped === 1) return "1 hazard hit";
  return `${clamped} hazard hits`;
}
