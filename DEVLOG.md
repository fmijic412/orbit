# Dev Log

A dated record of what changed each day. Newest entries on top.

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
