/**
 * Pure end-of-round "haul rating", derived from the total number of orbs the
 * player collected during the round. Score already folds in the combo
 * multiplier and per-orb tier values, so the final number says nothing about how
 * *much* the player actually swept up — a big score can come from a modest haul
 * chained well, or a large haul at low multipliers. This module turns the
 * round's raw orb count into a named rating, giving collection its own read on
 * the end screen. Like `grade.ts` / `defense.ts` / `momentum.ts` it maps a
 * single round number to a label with no renderer, DOM or three.js — Game owns
 * the mutable round state (the orb count) and delegates the lookup here,
 * matching the `scoring.ts` / `bonus.ts` / `countdown.ts` / `leaderboard.ts` /
 * `grade.ts` / `nextGrade.ts` / `defense.ts` / `momentum.ts` precedent.
 */

/** The haul ratings a round can earn, best (biggest haul) to worst. */
export type HaulRating = "Voracious" | "Bountiful" | "Steady" | "Sparse";

/** A rating and the smallest orb count a round needs to earn it. */
export interface HaulTier {
  readonly rating: HaulRating;
  readonly minOrbs: number;
}

/**
 * Orb-count thresholds for each rating, ordered best (biggest haul) first. A
 * round earns the first tier whose `minOrbs` its count reaches. The worst tier's
 * `minOrbs` of `0` is the catch-all — the count is never below 0, so any round
 * always maps to a valid rating.
 */
export const HAUL_TIERS: readonly HaulTier[] = [
  { rating: "Voracious", minOrbs: 45 },
  { rating: "Bountiful", minOrbs: 30 },
  { rating: "Steady", minOrbs: 15 },
  { rating: "Sparse", minOrbs: 0 },
];

/** CSS colour used to tint each rating on the end screen. */
export const HAUL_COLOR: Record<HaulRating, string> = {
  Voracious: "#ffd23f",
  Bountiful: "#7ce38b",
  Steady: "#5cc8ff",
  Sparse: "#9aa6c0",
};

/**
 * Maps a round's total orb count to its haul rating by walking `tiers` from the
 * best (biggest haul) down and returning the first whose `minOrbs` the count
 * reaches. The count is clamped to at least 0 and fractions are floored so stray
 * negative or fractional values still earn a valid rating — the catch-all
 * `Sparse` tier (`minOrbs: 0`) guarantees a result.
 */
export function haulFor(
  orbs: number,
  tiers: readonly HaulTier[] = HAUL_TIERS,
): HaulRating {
  const clamped = Math.max(0, Math.floor(orbs));
  for (const tier of tiers) {
    if (clamped >= tier.minOrbs) return tier.rating;
  }
  return tiers[tiers.length - 1].rating;
}

/**
 * A short, human-readable summary of the haul: `"no orbs collected"` when the
 * player collected none, `"1 orb collected"`, otherwise `"N orbs collected"`.
 * Negative counts are clamped to 0 and fractions floored.
 */
export function orbsSummary(orbs: number): string {
  const clamped = Math.max(0, Math.floor(orbs));
  if (clamped === 0) return "no orbs collected";
  if (clamped === 1) return "1 orb collected";
  return `${clamped} orbs collected`;
}
