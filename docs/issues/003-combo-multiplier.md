# Issue 003: Combo multiplier for quick collections

- **Target date:** 2026-06-20
- **Labels:** gameplay, feature
- **Status:** open

## Motivation

Rewarding fast, consecutive pickups adds skill expression and score depth.

## Acceptance criteria

- [ ] Collecting orbs within a short window (e.g. 2s of each other) raises a
      combo multiplier (x2, x3, ...).
- [ ] Points awarded per orb = base * current multiplier.
- [ ] The multiplier and a shrinking combo timer are shown in the HUD.
- [ ] The combo resets to x1 when the window lapses.

## Technical notes

- Track `comboTimer` and `multiplier` in `Game.ts`; refill the timer on each
  pickup, decay it in `update()`, reset multiplier when it reaches 0.
- Route scoring through a single `addScore(orbs)` helper so the multiplier is
  applied in one place.
