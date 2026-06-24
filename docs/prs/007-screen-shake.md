# PR: Screen shake on hazard contact (#007)

**Title:** feat: screen shake on hazard contact (#007)

**Branch:** `feat/screen-shake`

---

## Summary

Adds a brief **camera shake** when the player touches a hazard. It uses a
decaying `trauma` value so the jolt punches in on impact and bleeds smoothly
back to steady. The shake is layered on top of the existing follow camera
without ever permanently offsetting it or fighting its lerp, and the intensity
is kept deliberately small to avoid motion discomfort.

## What changed

- **`src/game/Game.ts`**
  - New `trauma` field (0..1) and a `shake(amount)` method that adds trauma,
    clamped to 1 so repeated hits intensify without exceeding the cap.
  - `updateCamera(dt)` now subtracts the previous frame's stored `shakeOffset`
    before the follow lerp, lerps/`lookAt`s from that clean position, then
    decays trauma and applies a fresh randomized offset on top. Resetting the
    offset every frame means it can never accumulate or drift the camera.
  - The positional offset is derived from `trauma²` (so small amounts stay
    gentle) and capped at `SHAKE_MAX_OFFSET` (0.7 world units). Trauma decays
    at `TRAUMA_DECAY` (1.6) per second.
  - A hazard hit calls `shake(HAZARD_SHAKE)` (0.6) alongside the existing
    penalty, burst and buzz.
  - The frozen/end-screen branch now passes `dt` to `updateCamera`, so an
    in-flight shake keeps decaying instead of freezing mid-jolt.
  - `restart()` resets `trauma` to 0 so each round starts steady.
- **`package.json`** — version bump `0.1.6` → `0.1.7`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173.

- Drive the player into a hazard cube: the camera should give a brief, subtle
  shake that decays smoothly back to a steady follow within ~half a second.
- Confirm the camera returns to its normal position afterward — no permanent
  offset, drift, or jitter once trauma is gone.
- Hit two hazards in quick succession and confirm the shake intensifies a
  little but never becomes nauseating.
- Let a hit land right as the timer hits 0 and confirm the shake still settles
  on the end screen rather than freezing mid-shake.
- Press **Play again** and confirm the camera starts perfectly still.

## Acceptance criteria

- [x] Hitting a hazard triggers a brief camera shake that decays smoothly.
- [x] Shake does not permanently offset the follow camera or fight its lerp.
- [x] Intensity is subtle enough to avoid motion discomfort.

Closes #007

---

## Windows command block

```
git checkout -b feat/screen-shake
git add -A
git commit -m "feat: screen shake on hazard contact (#007)"
git push -u origin feat/screen-shake
```

Then open the PR on GitHub using the **Title** and body above (or run
`gh pr create --title "feat: screen shake on hazard contact (#007)" --body-file docs/prs/007-screen-shake.md`),
review the diff, and merge.
