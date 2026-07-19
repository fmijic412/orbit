/**
 * Pure end-of-round "utility rating", derived from the number of power-ups the
 * player collected during the round. Score, the combo multiplier and the orb
 * count all reward *collecting orbs*; nothing on the end screen reflects how
 * well the player worked the power-ups (speed boosts and magnets) that make
 * those hauls possible. This module turns the round's power-up count into a
 * named rating, giving power-up usage its own read on the end screen. Like
 * `grade.ts` / `defense.ts` / `momentum.ts` / `haul.ts` it maps a single round
 * number to a label with no renderer, DOM or three.js — Game owns the mutable
 * round state (the power-up count) and delegates the lookup here, matching the
 * `scoring.ts` / `bonus.ts` / `countdown.ts` / `leaderboard.ts` / `grade.ts` /
 * `nextGrade.ts` / `defense.ts` / `momentum.ts` / `haul.ts` precedent.
 */

/** The utility ratings a round can earn, best (most power-ups) to worst. */
export type UtilityRating = "Overclocked" | "Charged" | "Sparked" | "Unpowered";

/** A rating and the smallest power-up count a round needs to earn it. */
export interface UtilityTier {
  readonly rating: UtilityRating;
  readonly minPowerups: number;
}

/**
 * Power-up-count thresholds for each rating, ordered best (most power-ups)
 * first. A round earns the first tier whose `minPowerups` its count reaches.
 * The worst tier's `minPowerups` of `0` is the catch-all — the count is never
 * below 0, so any round always maps to a valid rating.
 */
export const UTILITY_TIERS: readonly UtilityTier[] = [
  { rating: "Overclocked", minPowerups: 4 },
  { rating: "Charged", minPowerups: 2 },
  { rating: "Sparked", minPowerups: 1 },
  { rating: "Unpowered", minPowerups: 0 },
];

/** CSS colour used to tint each rating on the end screen. */
export const UTILITY_COLOR: Record<UtilityRating, string> = {
  Overclocked: "#ffd23f",
  Charged: "#7ce38b",
  Sparked: "#5cc8ff",
  Unpowered: "#9aa6c0",
};

/**
 * Maps a round's power-up count to its utility rating by walking `tiers` from
 * the best (most power-ups) down and returning the first whose `minPowerups`
 * the count reaches. The count is clamped to at least 0 and fractions are
 * floored so stray negative or fractional values still earn a valid rating —
 * the catch-all `Unpowered` tier (`minPowerups: 0`) guarantees a result.
 */
export function utilityFor(
  powerups: number,
  tiers: readonly UtilityTier[] = UTILITY_TIERS,
): UtilityRating {
  const clamped = Math.max(0, Math.floor(powerups));
  for (const tier of tiers) {
    if (clamped >= tier.minPowerups) return tier.rating;
  }
  return tiers[tiers.length - 1].rating;
}

/**
 * A short, human-readable summary of the power-ups grabbed: `"no power-ups
 * grabbed"` when the player collected none, `"1 power-up grabbed"`, otherwise
 * `"N power-ups grabbed"`. Negative counts are clamped to 0 and fractions
 * floored.
 */
export function powerupsSummary(powerups: number): string {
  const clamped = Math.max(0, Math.floor(powerups));
  if (clamped === 0) return "no power-ups grabbed";
  if (clamped === 1) return "1 power-up grabbed";
  return `${clamped} power-ups grabbed`;
}
