# Issue 007: Screen shake on hazard contact

- **Target date:** 2026-06-24
- **Labels:** polish, feature
- **Status:** open
- **Depends on:** 006

## Motivation

Screen shake sells the impact of hitting a hazard.

## Acceptance criteria

- [ ] Hitting a hazard triggers a brief camera shake that decays smoothly.
- [ ] Shake does not permanently offset the follow camera or fight its lerp.
- [ ] Intensity is subtle enough to avoid motion discomfort.

## Technical notes

- Add a `shake(amount)` method and a decaying `trauma` value to the camera
  logic in `Game.ts`; apply a small randomized positional offset AFTER the
  normal follow-camera positioning each frame.
- Reset the offset each frame before reapplying so it never accumulates.
