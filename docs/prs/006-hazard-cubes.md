# PR: Moving hazard cubes (#006)

**Title:** feat: moving hazard cubes that cost points on contact (#006)

**Branch:** `feat/hazard-cubes`

---

## Summary

Adds roaming red **hazard cubes** to the arena. They bounce around inside the
bounds, and touching one costs points and breaks your combo — introducing risk
so the round is about navigation, not just sweeping. A short invulnerability
window after a hit (with the player cube blinking) prevents a single bump from
draining your whole score.

## What changed

- **New `src/game/Hazards.ts`** — a `THREE.Group` of 4 red cubes, each with its
  own per-axis velocity. `update(dt)` moves them along straight paths and
  bounces them off the arena edges, clamping position so they always stay inside
  the bounds. `collides(playerPos)` does a cheap circular XZ overlap test
  combining the hazard and player half-sizes. `reset()` re-seeds positions and
  headings on round restart.
- **`src/game/Game.ts`** — constructs the `Hazards` system, adds its group to
  the scene, and ticks it from `update()` while the round is playing. On contact
  it deducts `HAZARD_PENALTY` (5) points (floored at 0), resets the combo,
  opens a 1.2s i-frames window during which the player cube blinks, fires a red
  particle burst, and plays the new hit sound. `restart()`/`endRound()` clear
  i-frames and restore player visibility.
- **`src/game/Audio.ts`** — new `hit()` SFX: a short descending sawtooth buzz so
  a penalty reads as clearly negative against the bright pickup blip.
- **`package.json`** — version bump `0.1.5` → `0.1.6`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173.

- Confirm a few red cubes roam the arena and bounce off the edges without ever
  leaving the play area.
- Drive the player into a hazard: the score drops by 5 (not below 0), any active
  combo resets, the cube blinks for ~1.2s, a red burst plays, and you hear the
  buzz.
- While blinking you should not take a second hit until the window ends.
- Press **Play again** and confirm hazards re-seed and the player is fully
  visible again.

## Acceptance criteria

- [x] A few red hazard cubes roam the arena along simple paths.
- [x] Touching a hazard costs points and breaks the combo, with a brief
      invulnerability window to avoid repeat hits.
- [x] Hazards stay inside the arena bounds.

Closes #006

---

## Windows command block

```bat
git checkout -b feat/hazard-cubes
git add -A
git commit -m "feat: moving hazard cubes that cost points on contact (#006)"
git push -u origin feat/hazard-cubes
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: moving hazard cubes that cost points on contact (#006)" --body-file docs/prs/006-hazard-cubes.md`),
review the diff, and merge.
