# Issue 010: Trail effect behind the player cube

- **Target date:** 2026-06-27
- **Labels:** polish, feature
- **Status:** open

## Motivation

A motion trail makes movement feel fast and fluid.

## Acceptance criteria

- [ ] The player leaves a fading trail while moving.
- [ ] The trail fades out when the player is stationary.
- [ ] No unbounded growth of trail objects over time.

## Technical notes

- Add `src/game/Trail.ts` — either a ribbon built from recent positions
  (BufferGeometry updated each frame) or a small pool of fading ghost quads.
- Cap the number of segments; recycle the oldest. Update from `Game.update`
  using the player's position/velocity.
