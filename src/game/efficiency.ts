/**
 * Pure end-of-round "efficiency rating", derived from how many points the
 * round scored *per orb collected* (final score ÷ orbs). The other end-screen
 * reads each answer one question: the haul rating counts how many orbs were
 * swept up, the momentum rating reports the single highest combo multiplier
 * reached, and the grade reads the raw score. None of them says how well the
 * player *converted* each pickup into points across the whole round — a big
 * haul at x1 and a small haul chained at x8 can post the same score, and a
 * round that peaks at x9 once (great momentum) can still average poorly if the
 * rest was collected cold. Efficiency is that sustained-conversion read: high
 * when the player kept combos alive and favoured rare/bonus orbs, low when
 * pickups came at x1. Like `grade.ts` / `defense.ts` / `momentum.ts` /
 * `haul.ts` / `utility.ts` it maps a single round number to a label with no
 * renderer, DOM or three.js — Game owns the mutable round state (score and orb
 * count) and delegates the ratio and lookup here, matching the `scoring.ts` /
 * `bonus.ts` / `countdown.ts` / `leaderboard.ts` / `grade.ts` / `nextGrade.ts`
 * / `defense.ts` / `momentum.ts` / `haul.ts` / `utility.ts` precedent.
 */

/** The efficiency ratings a round can earn, best (most points per orb) to worst. */
export type EfficiencyRating = "Masterful" | "Efficient" | "Scrappy" | "Wasteful";

/** A rating and the smallest points-per-orb a round needs to earn it. */
export interface EfficiencyTier {
  readonly rating: EfficiencyRating;
  readonly minPerOrb: number;
}

/**
 * Points-per-orb thresholds for each rating, ordered best (most points per orb)
 * first. A round earns the first tier whose `minPerOrb` its ratio reaches. The
 * worst tier's `minPerOrb` of `0` is the catch-all — the ratio is never below
 * 0, so any round always maps to a valid rating. Values are tuned for the base
 * scoring economy (orb values 1/3/5, combo multiplier up to x9): a round that
 * never chains sits near the average orb value (~2), while sustained chains on
 * rarer orbs push well into double digits.
 */
export const EFFICIENCY_TIERS: readonly EfficiencyTier[] = [
  { rating: "Masterful", minPerOrb: 10 },
  { rating: "Efficient", minPerOrb: 6 },
  { rating: "Scrappy", minPerOrb: 3 },
  { rating: "Wasteful", minPerOrb: 0 },
];

/** CSS colour used to tint each rating on the end screen. */
export const EFFICIENCY_COLOR: Record<EfficiencyRating, string> = {
  Masterful: "#ffd23f",
  Efficient: "#7ce38b",
  Scrappy: "#5cc8ff",
  Wasteful: "#9aa6c0",
};

/**
 * The round's points-per-orb: `score` divided by the number of orbs collected.
 * Returns 0 when no orbs were collected (nothing to convert — no division by
 * zero) and clamps a negative score to 0 so a penalty-battered round can't post
 * a negative ratio. Orb counts are floored and clamped at 0 so stray
 * fractional or negative values still yield a sensible number.
 */
export function pointsPerOrb(score: number, orbs: number): number {
  const orbCount = Math.max(0, Math.floor(orbs));
  if (orbCount === 0) return 0;
  return Math.max(0, score) / orbCount;
}

/**
 * Maps a round's points-per-orb ratio to its efficiency rating by walking
 * `tiers` from the best (most points per orb) down and returning the first
 * whose `minPerOrb` the ratio reaches. The ratio is clamped to at least 0 so
 * stray negative values still earn a valid rating — the catch-all `Wasteful`
 * tier (`minPerOrb: 0`) guarantees a result.
 */
export function efficiencyFor(
  perOrb: number,
  tiers: readonly EfficiencyTier[] = EFFICIENCY_TIERS,
): EfficiencyRating {
  const clamped = Math.max(0, perOrb);
  for (const tier of tiers) {
    if (clamped >= tier.minPerOrb) return tier.rating;
  }
  return tiers[tiers.length - 1].rating;
}

/**
 * A short, human-readable summary of the conversion: `"no orbs collected"` when
 * the player collected none, otherwise the points-per-orb to one decimal, e.g.
 * `"8.4 pts per orb"`. Uses the same clamping as `pointsPerOrb`.
 */
export function efficiencySummary(score: number, orbs: number): string {
  const orbCount = Math.max(0, Math.floor(orbs));
  if (orbCount === 0) return "no orbs collected";
  return `${pointsPerOrb(score, orbs).toFixed(1)} pts per orb`;
}
