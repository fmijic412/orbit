/**
 * Pure end-of-round bonus math, extracted from Game so the "flawless round"
 * reward can be unit-tested with plain numbers — no renderer, DOM or three.js.
 * Game owns the mutable round state (score, hit count, level) and delegates the
 * arithmetic to this function, matching the `scoring.ts` / `countdown.ts` /
 * `leaderboard.ts` precedent.
 */

/** Points awarded for a flawless round before the per-level bonus is added. */
export const FLAWLESS_BASE = 25;
/** Extra flawless-bonus points earned for each difficulty level beyond the first. */
export const FLAWLESS_PER_LEVEL = 10;

/**
 * End-of-round reward for a "flawless" round — one finished without touching a
 * single hazard. A round that took a hit (`hits` > 0) or never scored
 * (`score` <= 0, e.g. idling the clock out) earns nothing, so the bonus can't
 * be farmed by doing nothing. A qualifying round earns `base` points plus
 * `perLevel` for each level reached beyond the first, so surviving deeper into
 * the difficulty ramp untouched is worth more.
 */
export function flawlessBonus(
  hits: number,
  level: number,
  score: number,
  base: number = FLAWLESS_BASE,
  perLevel: number = FLAWLESS_PER_LEVEL,
): number {
  if (hits > 0 || score <= 0) return 0;
  const reached = Math.max(1, Math.floor(level));
  return base + (reached - 1) * perLevel;
}
