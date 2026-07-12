/**
 * Pure round-start countdown math, extracted from Game so the "3 · 2 · 1 · Go!"
 * timing and labelling can be unit-tested with plain numbers — no renderer, DOM
 * or three.js. Game owns the mutable `countdown` timer and delegates the
 * arithmetic and label mapping to these functions, matching the `scoring.ts` /
 * `leaderboard.ts` precedent.
 */

/** How long the pre-round countdown runs, in seconds (counts 3 → 2 → 1). */
export const COUNTDOWN_SECONDS = 3;

/** Result of counting the round-start countdown down by one step. */
export interface CountdownTick {
  /** The countdown timer after decay, never below 0. */
  readonly remaining: number;
  /** True only on the step where the timer reaches (or passes) 0. */
  readonly done: boolean;
}

/**
 * Counts the countdown down by `dt` seconds. When the timer crosses to 0 the
 * countdown is finished and the caller should begin play. An already-finished
 * timer (<= 0) is a no-op that keeps reporting `done` so a late frame can't
 * revive the countdown.
 */
export function tickCountdown(remaining: number, dt: number): CountdownTick {
  if (remaining <= 0) return { remaining: 0, done: true };
  const next = Math.max(0, remaining - dt);
  return { remaining: next, done: next === 0 };
}

/**
 * Maps the remaining countdown time to the label shown on screen. With
 * `COUNTDOWN_SECONDS` = 3 the timer counts 3 → 2 → 1, so remaining in
 * (2, 3] shows "3", (1, 2] shows "2", (0, 1] shows "1", and 0 shows "Go!".
 */
export function countdownLabel(remaining: number): string {
  if (remaining <= 0) return "Go!";
  return `${Math.ceil(remaining)}`;
}
