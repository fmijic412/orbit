# Issue 010: Trail effect behind the player cube

- **Target date:** 2026-06-27
- **Labels:** polish, feature
- **Status:** done (PR prepared 2026-06-27)

## Motivation

A motion trail makes movement feel fast and fluid.

## Acceptance criteria

- [x] The player leaves a fading trail while moving.
- [x] The trail fades out when the player is stationary.
- [x] No unbounded growth of trail objects over time.

## Technical notes

- Add `src/game/Trail.ts` — either a ribbon built from recent positions
  (BufferGeometry updated each frame) or a small pool of fading ghost quads.
- Cap the number of segments; recycle the oldest. Update from `Game.update`
  using the player's position/velocity.
