/**
 * Pure end-of-round "momentum rating", derived from the highest combo
 * multiplier the player reached during the round. The combo system is central
 * to scoring, but nothing on the end screen reflects how well the player
 * *chained* their pickups — a run can hit the same score by grinding single
 * orbs or by stringing long, high-multiplier combos. This module turns the
 * round's peak multiplier into a named rating, giving that chaining skill its
 * own read on the end screen. Like `grade.ts` / `defense.ts` it maps a single
 * round number to a label with no renderer, DOM or three.js — Game owns the
 * mutable round state (the peak multiplier) and delegates the lookup here,
 * matching the `scoring.ts` / `bonus.ts` / `countdown.ts` / `leaderboard.ts` /
 * `grade.ts` / `nextGrade.ts` / `defense.ts` precedent.
 */

/** The momentum ratings a round can earn, best (longest chains) to worst. */
export type MomentumRating = "Unstoppable" | "Blazing" | "Warming Up" | "Cold";

/** A rating and the smallest peak multiplier a round needs to earn it. */
export interface MomentumTier {
  readonly rating: MomentumRating;
  readonly minMultiplier: number;
}

/**
 * Peak-multiplier thresholds for each rating, ordered best (highest chains)
 * first. A round earns the first tier whose `minMultiplier` its peak reaches.
 * The worst tier's `minMultiplier` of `1` is the catch-all — the multiplier is
 * never below 1, so any round always maps to a valid rating.
 */
export const MOMENTUM_TIERS: readonly MomentumTier[] = [
  { rating: "Unstoppable", minMultiplier: 7 },
  { rating: "Blazing", minMultiplier: 4 },
  { rating: "Warming Up", minMultiplier: 2 },
  { rating: "Cold", minMultiplier: 1 },
];

/** CSS colour used to tint each rating on the end screen. */
export const MOMENTUM_COLOR: Record<MomentumRating, string> = {
  Unstoppable: "#ffd23f",
  Blazing: "#ff9f4a",
  "Warming Up": "#5cc8ff",
  Cold: "#9aa6c0",
};

/**
 * Maps a round's peak combo multiplier to its momentum rating by walking
 * `tiers` from the best (highest chains) down and returning the first whose
 * `minMultiplier` the peak reaches. The peak is clamped to at least 1 (the
 * multiplier floor) so stray sub-1 values still earn the catch-all `Cold`
 * tier, guaranteeing a valid `MomentumRating`.
 */
export function momentumFor(
  peakMultiplier: number,
  tiers: readonly MomentumTier[] = MOMENTUM_TIERS,
): MomentumRating {
  const clamped = Math.max(1, Math.floor(peakMultiplier));
  for (const tier of tiers) {
    if (clamped >= tier.minMultiplier) return tier.rating;
  }
  return tiers[tiers.length - 1].rating;
}

/**
 * A short, human-readable summary of the peak combo reached: `"no combo
 * chained"` when the player never chained past the base multiplier, otherwise
 * `"peak xN combo"`. Peaks below 1 are clamped and fractions floored.
 */
export function peakSummary(peakMultiplier: number): string {
  const clamped = Math.max(1, Math.floor(peakMultiplier));
  if (clamped <= 1) return "no combo chained";
  return `peak x${clamped} combo`;
}
