# PR: Trail effect behind the player cube (#010)

**Title:** `feat: fading motion trail behind the player cube (#010)`

**Suggested branch:** `feat/player-trail`

---

## Summary

Adds a fading motion trail behind the player cube so movement reads as fast and
fluid. The trail is built from a fixed pool of "ghost" cubes that are dropped as
the player moves and fade out over half a second, so it disappears on its own
when the player stands still and never grows without bound.

## What changed

- **New `src/game/Trail.ts`** — a pooled, fading trail system:
  - A fixed pool of 24 ghost cubes (one shared `BoxGeometry`, per-ghost
    `MeshBasicMaterial`), recycled round-robin. Capped + zero per-frame
    allocation, matching the existing `Particles` style.
  - Drops a ghost at the player's position only after it has moved `MIN_STEP`
    (0.45u) since the last drop; each ghost fades and shrinks from
    `START_OPACITY` (0.5) / `START_SCALE` (0.9) to zero over `SEGMENT_LIFE`
    (0.5s). Ghosts are translucent (`transparent`, `depthWrite: false`) in the
    player's blue tint.
  - `update(dt, playerPosition)` advances/emits; `reset()` recycles all ghosts
    and clears the drop tracker on round restart.
- **`src/game/Game.ts`** — instantiate `Trail` in the constructor, add
  `trail.group` to the scene, tick `trail.update(dt, this.player.position)`
  alongside the particle update (so ghosts keep fading after the round ends),
  and call `trail.reset()` in `restart()`.
- **`package.json`** — version bumped to `0.1.10`.
- Docs: `DEVLOG.md`, `docs/ROADMAP.md`, and `docs/issues/010-player-trail.md`
  updated.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173 and:

- Move the cube around — a fading blue trail follows it.
- Stop moving — the trail fades away within ~half a second and leaves nothing
  behind.
- Drive in long loops for a while — the number of trail segments stays capped
  (no growing object count / memory creep).
- Finish or restart a round — any in-flight ghosts fade out cleanly and the
  trail is cleared on restart.

Closes #010

---

## Windows command block

```bat
git checkout -b feat/player-trail
git add -A
git commit -m "feat: fading motion trail behind the player cube (#010)"
git push -u origin feat/player-trail
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: fading motion trail behind the player cube (#010)" --body-file docs/prs/010-player-trail.md`),
review the diff, and merge.
