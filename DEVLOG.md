# Dev Log

A dated record of what changed each day. Newest entries on top.

## 2026-06-24 — Screen shake on hazard contact (#007)

- Added a decaying `trauma` value (0..1) and a `shake(amount)` method to the
  camera logic in `Game.ts`. A hazard hit calls `shake(HAZARD_SHAKE)` right
  after the existing penalty/burst/buzz, so the jolt lands with the impact.
- `updateCamera(dt)` now subtracts the previous frame's offset before running
  the follow lerp, then applies a fresh randomized offset on top — so the
  shake rides on the follow camera without ever accumulating or fighting the
  lerp toward the player. The offset is squared from trauma (`trauma²`) so
  small amounts stay gentle, and is capped at `SHAKE_MAX_OFFSET` (0.7 units)
  to avoid motion discomfort. Trauma bleeds out at `TRAUMA_DECAY` per second.
- The shake keeps decaying on the end screen (the frozen branch passes `dt`),
  so a hit landing as the timer expires doesn't freeze the camera mid-jolt.
- `restart()` resets `trauma` to 0 so a new round always starts steady.

## 2026-06-23 — Moving hazard cubes (#006)

- New `Hazards` system (`src/game/Hazards.ts`): a `THREE.Group` of 4 red cubes,
  each with its own per-axis velocity. `update(dt)` advances them along straight
  paths and bounces them off the arena edges, clamping position so they never
  leave the bounds. Cubes tumble slightly so they read as dangerous.
- `collides(playerPos)` does a cheap circular XZ test combining the hazard and
  player half-sizes, so contact feels fair rather than pixel-perfect.
- `Game.ts` creates the system in its constructor, adds its group to the scene,
  and ticks it from `update()` only while the round is playing (hazards freeze
  on the end screen).
- Hazard contact now costs `HAZARD_PENALTY` (5) points (floored at 0), breaks
  any active combo, and opens a 1.2s invulnerability window during which the
  player cube blinks; a fresh hit is only possible after the window lapses, so a
  single bump can't drain the score. Each hit also fires a red particle burst.
- New `Audio.hit()` plays a short descending sawtooth buzz so a penalty reads as
  clearly negative against the bright pickup blip.
- `restart()` and `endRound()` reset i-frames and restore player visibility so
  the cube is never left mid-blink.

## 2026-06-22 — Sound effects + background music (#005)

- New `Audio` system (`src/game/Audio.ts`): a thin wrapper around a single
  `AudioContext` with a master gain in front of the destination. No external
  asset files — every sound is synthesized with the Web Audio API.
- `pickup(step)` plays a short triangle-wave blip with a fast attack /
  exponential decay envelope and an upward pitch sweep; `step` walks a
  pentatonic scale so chained combo pickups rise in pitch.
- `startAmbience()` / `stopAmbience()` run a gentle looped pad — two detuned
  sawtooth oscillators through a lowpass filter, breathed by a slow LFO on the
  gain — with fade in/out. Idempotent and leak-free (oscillators are stopped
  on teardown).
- Mute is a single `toggleMute()` / `setMuted()` on the master gain (ramped to
  avoid clicks); `isMuted` is reflected in a new `#audio` HUD readout.
- `Game.ts` creates the system in its constructor and, because browsers block
  autoplay, resumes the context + starts ambience on the first user gesture
  (first keypress or the Play again button). It fires `pickup(multiplier - 1)`
  per collected-orb frame, stops ambience at round end, and restarts it on
  replay. "M" toggles mute and updates the HUD.
- `index.html` gains the `#audio` indicator and an "M to mute" hint; styled in
  `src/style.css`.
- Bumped version to v0.1.5.

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
