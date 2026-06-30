# PR: Main menu with Start button (#012)

**Title:** feat: main menu with Start button (#012)

**Suggested branch:** `feat/main-menu`

---

## Summary

Adds a main menu that frames the game on load. Instead of dropping straight into
a round, the game opens on an "Orbit Runner" overlay with a **Start** button;
nothing simulates until Start is pressed. Start is also the user gesture that
resumes/creates the `AudioContext`. The end-of-round screen gains a **Main menu**
button so players can return to the menu. Closes #012.

## What changed

- **`src/game/Game.ts`**
  - New `"menu"` member of `GameState`, and it is now the **initial** state.
  - `update()` treats `menu` like `paused` — an early return before any
    simulation, scoring, audio, particle/trail or camera work — so the scene
    sits idle behind the overlay until Start is pressed.
  - Wired the `#start-game` button to the existing `restart()`, which resets the
    round and (being a user gesture) resumes the `AudioContext` and starts the
    ambience. `restart()` now also hides the menu overlay.
  - New `toMenu()` handler wired to the end screen's `#to-menu` button: it stops
    ambience, unducks audio, hides the end screen and re-shows the menu, leaving
    the round frozen in `menu` state until Start is pressed.
- **`index.html`**
  - Added the `#menu-screen` overlay (title, tagline, **Start** button, controls
    hint), shown by default (no `hidden` class) since menu is the initial state.
  - Added a **Main menu** button (`#to-menu`) next to **Play again** on the end
    screen, grouped in a `#end-buttons` row.
- **`src/style.css`** — styles for `#menu-screen` / `#menu-panel` / `#start-game`
  (reusing the existing overlay look, with a higher `z-index` so the menu wins
  during transitions) and the secondary `#to-menu` button + `#end-buttons` row.
- **`package.json`** — version bumped to `0.1.12`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and:

1. On load, the **Orbit Runner** menu appears and the game does not run — the
   timer stays at 60 and nothing moves behind the overlay.
2. Click **Start** — the menu disappears, a fresh round begins (score 0, timer
   counting down), and background audio/ambience plays (Start is the gesture
   that unblocks the `AudioContext`).
3. Let the timer run out (or play a round). On the end screen, click **Main
   menu** — you return to the menu with everything frozen. Click **Start** again
   to confirm it begins a clean fresh round. **Play again** still works too.

## Acceptance criteria

- [x] On load, a menu overlay shows the title and a Start button (game does not
      run until Start is pressed).
- [x] Pressing Start begins a fresh round and resumes/creates the AudioContext.
- [x] The end-of-round screen can return to the menu.

---

## Windows command block (copy-paste)

```
git checkout -b feat/main-menu
git add -A
git commit -m "feat: main menu with Start button (#012)"
git push -u origin feat/main-menu
```

Then open the PR on GitHub using the **Title** and **Summary** above (or run
`gh pr create --title "feat: main menu with Start button (#012)" --body-file docs/prs/012-main-menu.md`),
review the diff, and merge. Remember to include "Closes #012" in the PR body so
the issue auto-closes on merge.
