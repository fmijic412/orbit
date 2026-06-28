# PR: Pause (Esc) overlay (#011)

**Title:** feat: pause (Esc) overlay with audio ducking (#011)

**Suggested branch:** `feat/pause-overlay`

---

## Summary

Adds the ability to pause a round with **Esc**. A "Paused" overlay with a
**Resume** button fades in over the scene; the timer and all motion freeze and
resume exactly where they left off. Audio ducks (lowers) while paused. Closes
#011.

## What changed

- **`src/game/Game.ts`**
  - New `"paused"` member of `GameState`.
  - `Esc` (via the existing `onKeyDown`) toggles pause through a new
    `togglePause()`/`pause()`/`resume()` trio, but only mid-round — Esc on the
    end screen does nothing.
  - `update()` returns immediately in the `paused` state *before* any
    simulation, scoring, particle/trail or camera work, so the round is fully
    frozen while the loop keeps re-rendering the last frame. `dt` is already
    clamped to 0.05s in the loop, so no spike accumulates across the pause.
  - Wired the `#resume` button to `resume()`; `restart()` defensively hides the
    overlay and unducks audio.
- **`src/game/Audio.ts`**
  - New `setDucked(boolean)` plus a private `applyMasterGain()` that composes
    the mute and duck states in one place (muted → silence; ducked → 25% of
    the normal master level).
- **`index.html`** — added the `#pause-screen` overlay (title + Resume button)
  and appended "Esc to pause" to the HUD hint.
- **`src/style.css`** — styles for `#pause-screen` / `#pause-panel` / `#resume`,
  sharing the look of the existing end screen.
- **`package.json`** — version bumped to `0.1.11`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and:

1. Move with WASD / arrows, then press **Esc** — the "Paused" overlay appears and
   the time, orbs, hazards and player all stop. Background audio drops in volume.
2. Press **Esc** again (or click **Resume**) — play continues from the exact
   point it froze; the timer picks up where it left off with no jump.
3. Confirm Esc does nothing on the end screen, and that pressing **M** while
   paused still toggles mute correctly (mute wins over ducking).

## Acceptance criteria

- [x] Pressing Esc pauses the game and shows a "Paused" overlay with Resume.
- [x] While paused, the timer and all motion freeze; Esc or Resume continues
      exactly where it left off.
- [x] Audio ducks while paused.

---

## Windows command block (copy-paste)

```
git checkout -b feat/pause-overlay
git add -A
git commit -m "feat: pause (Esc) overlay with audio ducking (#011)"
git push -u origin feat/pause-overlay
```

Then open the PR on GitHub using the **Title** and **Summary** above (or run
`gh pr create --title "feat: pause (Esc) overlay with audio ducking (#011)" --body-file docs/prs/011-pause-overlay.md`),
review the diff, and merge. Remember to include "Closes #011" in the PR body so
the issue auto-closes on merge.
