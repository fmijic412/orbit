# PR: Animated gradient skybox (#014)

**Title:** `feat: animated gradient skybox (#014)`

**Branch:** `feat/animated-skybox`

---

## Summary

Replaces the flat clear colour with a **living gradient sky dome** for
atmosphere and depth. A large inward-facing sphere is rendered with a custom
`THREE.ShaderMaterial` that paints a smooth top→horizon gradient and animates
it subtly over time (a luminance-preserving hue rotation plus a slow drift of
the gradient band), driven by a `uTime` uniform. Fog is retuned so distant
geometry blends cleanly into the horizon, and gameplay readability is
preserved.

Closes #014.

## What changed

- **`src/game/Skybox.ts`** (new)
  - Large (radius 150) inward-facing `SphereGeometry` + `ShaderMaterial`
    (`side: BackSide`, `depthWrite: false`, `fog: false`, `renderOrder = -1`)
    so it draws first and all gameplay geometry sits on top of it.
  - Fragment shader maps the view direction's elevation to a smooth
    `smoothstep` gradient between `uTop` (deep night) and `uBottom` (dusky
    blue), then applies a hue rotation around the grey axis (preserves
    luminance) and a slow vertical drift — both driven by `uTime`.
  - `update(dt, cameraPosition)` advances `uTime` and re-centres the dome on
    the camera each frame so it reads as an infinite backdrop. All tuning
    (radius, hue/drift speed and amplitude, colours) lives as named constants
    at the top of the file. No per-frame allocations.
- **`src/game/Game.ts`**
  - Constructs the `Skybox` and adds it to the scene.
  - Ticks `skybox.update()` at the top of `update()` — before the menu/paused
    early-return — so the background stays animated on the menu and while
    paused.
  - Retunes `THREE.Fog` colour to `0x18233d` (toward the horizon colour) so
    fogged geometry dissolves into the gradient; darkens the fallback
    `scene.background` to `0x0a0d18`.
- **Docs/version** — issue #014 marked done, DEVLOG entry prepended, ROADMAP
  item checked, `package.json` bumped to `0.1.14`.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173. Then:

- On the **menu** and during play, note the background is now a smooth vertical
  gradient (deep at the top, dusky blue toward the horizon) rather than a flat
  colour.
- Watch for a while: the hue shifts very slowly and the gradient band drifts
  gently — subtle, never distracting.
- Move around with WASD/Arrows: the sky stays an infinite backdrop (it follows
  the camera) and distant fogged geometry blends into the horizon with no hard
  seam. Orbs, hazards and the player cube remain clearly readable.
- Optional: `npm run typecheck` should pass cleanly (strict mode,
  `noUnusedLocals` / `noUnusedParameters`).

## Windows command block

```
git checkout -b feat/animated-skybox
git add -A
git commit -m "feat: animated gradient skybox (#014)"
git push -u origin feat/animated-skybox
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: animated gradient skybox (#014)" --body-file docs/prs/014-animated-skybox.md`),
review the diff, and merge.
