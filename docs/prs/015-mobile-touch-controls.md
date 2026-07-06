# PR: Mobile touch / on-screen joystick controls (#015)

**Title:** `feat: mobile touch / on-screen joystick controls (#015)`

**Branch:** `feat/mobile-touch-controls`

---

## Summary

Sprint 1 (#001–#014) is fully implemented, so this pulls the topmost unchecked
`docs/ROADMAP.md` item — mobile touch controls — filed as issue #015.

Adds an **analog on-screen joystick** so the game is playable on phones and
tablets. On touch devices a floating joystick appears where you press in the
lower-left of the screen; dragging drives the player cube, and how far you tilt
sets how fast it moves. Keyboard play on desktop is unchanged, and the joystick
is fully inert on non-touch devices.

Closes #015.

## What changed

- **`src/game/Joystick.ts`** (new)
  - Self-contained system that mounts its own DOM overlay (a floating base ring
    `.joy-base` + `.joy-knob`) inside a lower-left active zone and converts
    pointer drags into a normalized axis in `[-1, 1]` per component.
  - **Dynamic** joystick: the base recenters under the first press within the
    zone. `KNOB_RADIUS = 52`px of knob travel and a `DEAD_ZONE = 0.12` swallow
    jitter near centre. Uses Pointer Events with `setPointerCapture`, so a drag
    keeps tracking off-zone and snaps back to zero on release/cancel.
  - **Only activates on touch devices** (`matchMedia("(pointer: coarse)")`,
    `ontouchstart`, or `navigator.maxTouchPoints`). Otherwise the zone stays
    `pointer-events: none` and never touches the cursor, buttons or keyboard.
  - Exposes `x` (screen right) and `y` (flips screen-down to the game's
    "up = forward" convention). `dispose()` tears down listeners and DOM.
- **`src/game/input.ts`**
  - Added an analog channel: `setAxis(x, z)` summed with the keyboard in
    `moveX`/`moveZ`, each clamped to `[-1, 1]`. Gameplay still reads one
    source-agnostic axis.
- **`src/game/Player.ts`**
  - `update()` now clamps the move vector to a **max length of 1** instead of
    always normalizing. Keyboard cardinals (len 1) and diagonals (len ~1.41,
    capped) are unchanged; a partial joystick tilt (len < 1) keeps its
    magnitude and moves proportionally slower — true analog control.
- **`src/game/Game.ts`**
  - Constructs the `Joystick`; each playing frame calls
    `input.setAxis(joystick.x, joystick.y)` right before `player.update`.
- **`index.html` / `src/style.css`**
  - Joystick styles; hint + menu-controls text mention drag-to-move. Overlay
    z-index: joystick `15` < menu/pause/end `20`+ so those screens still
    capture touches when visible. `touch-action: none` prevents page scroll.
- **Docs/version** — issue #015 created + marked done, DEVLOG entry prepended,
  ROADMAP item checked, `package.json` bumped to `0.1.15`.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173. Then:

- **Desktop (mouse + keyboard):** play as before with WASD / Arrows. No
  joystick appears, and the mouse/cursor and all buttons behave normally.
- **Touch (real device or browser device emulation):** open DevTools →
  toggle device toolbar (so `pointer: coarse` matches), reload, press Start.
  Press-and-drag anywhere in the lower-left: a joystick appears under your
  finger and the cube follows. Tilt a little → the cube creeps; tilt to the
  edge → full speed, in any direction. Release → the cube stops and the
  joystick fades out.
- Confirm dragging never scrolls or zooms the page, and that the menu, pause
  (Esc) and end-of-round overlays still receive taps when shown.
- Optional: `npm run typecheck` should pass cleanly (strict mode,
  `noUnusedLocals` / `noUnusedParameters`).

## Windows command block

```
git checkout -b feat/mobile-touch-controls
git add -A
git commit -m "feat: mobile touch / on-screen joystick controls (#015)"
git push -u origin feat/mobile-touch-controls
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: mobile touch / on-screen joystick controls (#015)" --body-file docs/prs/015-mobile-touch-controls.md`),
review the diff, and merge.
