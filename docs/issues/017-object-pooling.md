# Issue 017: Simple object pooling for orbs/particles

- **Target date:** 2026-07-07
- **Labels:** tech, performance
- **Status:** done (PR prepared 2026-07-07)

## Motivation

Sprint 1 (issues #001–#016) is fully merged, so this pulls the topmost unchecked
item from `docs/ROADMAP.md` — "Simple object pooling for orbs/particles" — the
next entry in the "Tech" backlog.

The two effect systems already avoid runtime allocation in different ad-hoc ways:
`Particles` keeps a fixed pool with a hand-rolled round-robin `cursor`, and
`Collectibles` reuses a fixed set of orb meshes that re-roll in place. But there
is no shared, reusable pooling primitive, and one hot path still allocates every
frame: `Collectibles.update()` builds a fresh `OrbPickup[]` and a
`position.clone()` per pickup, producing steady garbage during collection chains.

Extracting a tiny generic `Pool<T>` utility and routing both systems through it
(a) removes the remaining per-frame allocations in the pickup path and (b)
replaces the bespoke particle recycling with one documented, testable primitive —
without changing any gameplay behaviour.

## Acceptance criteria

- [x] A small, reusable, three.js-free pooling utility exists
      (`src/game/Pool.ts`) that preallocates a fixed number of items via a
      factory and hands them back out (round-robin `acquire()` plus indexed
      access for callers that fill a per-frame buffer).
- [x] `Particles` is refactored to use `Pool<T>` for its particle recycling in
      place of the hand-rolled `cursor`/`acquire`, with identical burst/fade
      behaviour.
- [x] `Collectibles.update()` no longer allocates per frame: the returned
      pickups reuse a persistent pooled buffer (no `new`/`clone()` in the hot
      path) while callers still read `position`, `value` and `color` correctly.
- [x] The change is behaviour-preserving — particle bursts, orb collection,
      scoring and the magnet power-up all work exactly as before.
- [x] Code stays strict-TypeScript clean (no unused locals/params, correct
      three.js API) and is created in the existing systems' constructors and
      ticked from `update()` as today.

## Technical notes

- Keep `Pool.ts` free of `three` and the DOM so it stays trivially unit-testable
  and reusable for any future pooled system (hazards, power-ups, etc.).
- The pooled `OrbPickup` slots are consumed by `Game.update()` within the same
  frame (bursts `copy()` the position, scoring sums the value immediately), so
  reusing the same slot objects frame-to-frame is safe.
- Avoid re-introducing per-frame allocation via closures: iterate the pool's
  backing array directly in hot `update()` loops rather than allocating a
  callback each frame.
