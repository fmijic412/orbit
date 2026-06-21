# Dev Log

A dated record of what changed each day. Newest entries on top.

## 2026-06-21 — Particle burst on orb collect (#004)

- New `Particles` system (`src/game/Particles.ts`): a fixed pool of 160 small
  glowing meshes recycled across bursts, so a steady stream of pickups
  allocates nothing after construction. Exposes `burst(position, color)`,
  `update(dt)` and `reset()`.
- `burst()` sprays 16 shards outward with an upward kick; `update()` integrates
  gravity + drag and fades/shrinks each shard over its ~0.5s life, hiding and
  recycling it when finished (no leaks).
- `Collectibles.update()` now returns the world positions of orbs picked up
  this frame (instead of just a count); the orb's base colour is exported as
  `ORB_COLOR` and reused for both the orb material and its burst tint.
- `Game.ts` creates the system in its constructor, adds `particles.group` to
  the scene, ticks `particles.update(dt)` every frame (so in-flight bursts
  finish even after the round ends), fires a burst per collected orb, and
  clears particles in `restart()`.
- Bumped version to v0.1.4.

## 2026-06-20 — Combo multiplier for quick collections (#003)

- Added a combo system to `Game.ts`: new `multiplier` and `comboTimer` fields,
  with constants `BASE_POINTS`, `COMBO_WINDOW` (2s) and `MAX_MULTIPLIER` (9).
- All scoring now routes through a single `addScore(orbs)` helper — picking up
  an orb while the window is still open bumps the multiplier (x2, x3, …) and
  refills the timer; otherwise the combo starts fresh at x1. Points per orb =
  `BASE_POINTS * multiplier`.
- `decayCombo(dt)` counts the window down each frame and resets the multiplier
  to x1 when it lapses; `restart()` clears the combo state.
- New HUD combo readout (`#combo`) in `index.html` — a large `xN` label over a
  shrinking timer bar — styled in `src/style.css`. It shows only while a combo
  (>x1) is active and `updateComboHud()` keeps the bar fill in sync.
- Bumped version to v0.1.3.

## 2026-06-19 — High-score persistence (session) (#002)

- Added a `bestScore` field to `Game.ts` (in-memory; persists across "Play
  again" but resets on full page reload, per the issue).
- New `#best` HUD element ("Best: N") in `index.html`, styled in
  `src/style.css`; `updateHud()` now keeps it in sync.
- `endRound()` detects a new best (`score > bestScore`), updates `bestScore`,
  and toggles a highlighted "New best!" line (`#new-best`) on the end overlay.
- Bumped version to v0.1.2.

## 2026-06-18 — Round timer + end-of-round score screen (#001)

- Added a 60-second round timer tracked in `Game.ts` (`timeLeft`, decremented
  by `dt` in `update()`); remaining seconds shown in a new `#time` HUD element.
- Introduced a `GameState` ("playing" | "ended") that gates `update()` — when
  the timer hits 0 the round freezes (input, scoring and the clock all stop
  while the scene keeps rendering).
- Added a hidden end-screen overlay in `index.html` (final score + "Play
  again" button), styled in `src/style.css`; toggled via a `hidden` class.
- Wired "Play again" to a `restart()` method that resets score, timer, player
  position and orbs. Added `reset()` helpers to `Player` and `Collectibles`.
- Bumped version to v0.1.1.

## 2026-06-17 — Project scaffold (v0.1.0)

- Set up Three.js + Vite + TypeScript project.
- Arena with ground plane, grid, fog, and lighting.
- Player cube with WASD / arrow movement, clamped to the arena.
- Six collectible orbs with bob/spin animation and pickup detection.
- Score HUD and a follow camera.
