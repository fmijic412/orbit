# Issue 011: Pause (Esc) overlay

- **Target date:** 2026-06-28
- **Labels:** ui, feature
- **Status:** open

## Motivation

Players need to be able to pause without losing their round.

## Acceptance criteria

- [ ] Pressing Esc pauses the game and shows a "Paused" overlay with Resume.
- [ ] While paused, the timer and all motion freeze; pressing Esc or Resume
      continues exactly where it left off.
- [ ] Audio (if present) ducks or pauses while paused.

## Technical notes

- Add a "paused" branch to the game state; in `update()`, skip simulation but
  keep rendering. Be careful with `clock.getDelta()` so no huge `dt` spike
  occurs on resume (clamp dt, which the loop already does).
- Toggle the overlay element class from `Game.ts`.
