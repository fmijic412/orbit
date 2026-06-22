# Issue 004: Particle burst on orb collect

- **Target date:** 2026-06-21
- **Labels:** polish, feature
- **Status:** done (PR prepared 2026-06-21)

## Motivation

A visual pop on collection makes pickups feel satisfying.

## Acceptance criteria

- [x] Collecting an orb spawns a short-lived particle burst at its position.
- [x] Particles fade/scale out and are removed when finished (no leaks).
- [x] Effect runs at a stable frame rate with several bursts on screen.

## Technical notes

- Add a `Particles` system (e.g. `src/game/Particles.ts`) using
  `THREE.Points` or a small pool of meshes; expose `burst(position, color)`
  and `update(dt)`.
- Have `Collectibles.update` return pickup positions, or emit an event the
  `Game` forwards to `Particles.burst`.
- Reuse/pool particles to avoid per-frame allocation.
