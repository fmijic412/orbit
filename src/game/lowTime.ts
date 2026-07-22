/**
 * Pure "low time" warning logic for the round's final seconds: when the timer
 * should visually pulse and when a per-second tick sound should fire. Like
 * `countdown.ts` this is time-window math with no renderer, DOM or three.js —
 * Game owns the mutable `timeLeft` and delegates the check here, matching the
 * `scoring.ts` / `bonus.ts` / `countdown.ts` precedent.
 */

/** Seconds remaining at which the low-time warning kicks in. */
export const LOW_TIME_SECONDS = 10;

/**
 * True once the round has `LOW_TIME_SECONDS` or fewer seconds left but hasn't
 * yet hit zero — the end-of-round flow (and its own flawless/grade feedback)
 * takes over at exactly 0, so the warning has nothing left to add there.
 */
export function isLowTime(timeLeft: number): boolean {
  return timeLeft > 0 && timeLeft <= LOW_TIME_SECONDS;
}

/**
 * Whether a tick sound should fire this frame: `timeLeft` just crossed into a
 * new, lower whole second while inside the low-time window. Comparing the
 * ceiling of the previous and current time — the same rounding the HUD label
 * already uses via `Math.ceil` — means the tick lines up exactly with the
 * number the player sees change, and requiring `isLowTime` on the new value
 * keeps it silent for the rest of the round and at the final 0.
 */
export function shouldTick(prevTimeLeft: number, timeLeft: number): boolean {
  if (!isLowTime(timeLeft)) return false;
  return Math.ceil(timeLeft) !== Math.ceil(prevTimeLeft);
}
