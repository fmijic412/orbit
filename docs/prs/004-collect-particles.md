# PR: Particle burst on orb collect (#004)

**Title:** `feat: particle burst on orb collect (#004)`

**Branch:** `feat/collect-particles`

---

## Summary

Adds a satisfying visual pop when you grab an orb: a short-lived spray of
glowing shards bursts from the pickup point, then fades and shrinks away. The
effect is driven by a pooled particle system, so a rapid combo of pickups stays
smooth and allocates nothing after startup.

## What changed

- **New `src/game/Particles.ts`** — a `Particles` system backed by a fixed pool
  of 160 small `MeshBasicMaterial` meshes. Public API: `burst(position, color)`,
  `update(dt)`, `reset()`. Each burst spawns 16 shards with random outward +
  upward velocity; `update()` integrates gravity and drag and fades/shrinks each
  shard over its ~0.5s life before hiding and recycling it (no per-frame
  allocation, no leaks).
- **`src/game/Collectibles.ts`** — `update()` now returns the world positions of
  orbs collected this frame (`THREE.Vector3[]`) instead of a bare count, so the
  caller knows *where* to spawn each burst. Exported a shared `ORB_COLOR`
  constant, reused for the orb material and the burst tint.
- **`src/game/Game.ts`** — constructs the `Particles` system, adds its group to
  the scene, ticks `particles.update(dt)` every frame (so in-flight bursts keep
  animating even after the round ends), fires one burst per collected orb, and
  clears particles on `restart()`.
- Bumped version to **v0.1.4**; updated `DEVLOG.md` and `docs/ROADMAP.md`.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173 and drive the cube (WASD / arrow keys) into orbs.
Each pickup should pop a short burst of golden shards that arc outward, fall,
fade and shrink out. Chain several pickups quickly and confirm the frame rate
stays stable with multiple bursts on screen, and that "Play again" clears any
lingering particles. (Optional: `npm run typecheck` to confirm the build is
type-clean.)

Closes #004

---

## Windows command block (copy-paste)

```bat
git checkout -b feat/collect-particles
git add -A
git commit -m "feat: particle burst on orb collect (#004)"
git push -u origin feat/collect-particles
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: particle burst on orb collect (#004)" --body-file docs/prs/004-collect-particles.md`),
review the diff, and merge.
