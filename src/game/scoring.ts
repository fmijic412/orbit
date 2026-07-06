/**
 * Pure scoring & combo math, extracted from Game so the rules can be unit-tested
 * with plain numbers — no renderer, DOM or three.js. Game owns the mutable round
 * state (score, multiplier, timers) and delegates the arithmetic to these
 * functions, so the behaviour lives in exactly one, testable place.
 */

/** Base points awarded per orb before the combo multiplier is applied. */
export const BASE_POINTS = 1;
/** Seconds you have after a pickup to chain the next one and keep the combo. */
export const COMBO_WINDOW = 2;
/** Upper bound on the combo multiplier. */
export const MAX_MULTIPLIER = 9;

/**
 * The multiplier a fresh pickup should use. While the combo window is still open
 * (`comboActive`) the multiplier steps up by one, capped at `max`; otherwise the
 * pickup starts a new combo back at x1.
 */
export function nextMultiplier(
  multiplier: number,
  comboActive: boolean,
  max: number = MAX_MULTIPLIER,
): number {
  return comboActive ? Math.min(multiplier + 1, max) : 1;
}

/** Points earned for orbs worth `value` total, at the given multiplier. */
export function pointsFor(
  value: number,
  multiplier: number,
  base: number = BASE_POINTS,
): number {
  return value * base * multiplier;
}

/** Score after touching a hazard: `penalty` points off, clamped at zero. */
export function applyHazardPenalty(score: number, penalty: number): number {
  return Math.max(0, score - penalty);
}

/** Result of counting the combo window down by one step. */
export interface ComboDecay {
  /** The combo timer after decay, never below 0. */
  readonly comboTimer: number;
  /** True only on the step where the window reaches 0 and the combo lapses. */
  readonly lapsed: boolean;
}

/**
 * Counts the combo window down by `dt` seconds. When the timer crosses to 0 the
 * combo has lapsed and the caller should reset the multiplier to 1. An already
 * -expired timer (<= 0) is a no-op and never re-reports a lapse.
 */
export function decayCombo(comboTimer: number, dt: number): ComboDecay {
  if (comboTimer <= 0) return { comboTimer: 0, lapsed: false };
  const next = Math.max(0, comboTimer - dt);
  return { comboTimer: next, lapsed: next === 0 };
}
