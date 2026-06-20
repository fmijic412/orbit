# PR: Combo multiplier for quick collections (#003)

**PR title:** `feat: combo multiplier for quick collections (#003)`

**Suggested branch:** `feat/combo-multiplier`

---

## Summary

Rewards fast, consecutive pickups with a combo multiplier. Collecting orbs in
quick succession raises the multiplier (x2, x3, …), and points awarded per orb
scale with it — adding score depth and skill expression to the core loop.

## What changed

- **`src/game/Game.ts`**
  - New constants: `BASE_POINTS` (1), `COMBO_WINDOW` (2s), `MAX_MULTIPLIER` (9).
  - New state: `multiplier` and `comboTimer`.
  - All scoring routed through a single `addScore(orbs)` helper: a pickup while
    the combo window is still open bumps the multiplier and refills the timer;
    otherwise the combo starts fresh at x1. Points per orb = `BASE_POINTS *
    multiplier`.
  - `decayCombo(dt)` counts the window down each frame in `update()` and resets
    the multiplier to x1 when it lapses.
  - `updateComboHud()` drives the new HUD element; `restart()` clears the combo.
- **`index.html`** — added a `#combo` HUD element (an `xN` label over a timer bar).
- **`src/style.css`** — styled `#combo`, `#combo-mult`, `#combo-bar`,
  `#combo-bar-fill`; the combo is hidden until a multiplier above x1 is active.
- **`package.json`** — version bumped to `0.1.3`.
- Docs: issue #003 marked done, DEVLOG entry added, ROADMAP item checked off.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and:

1. Collect an orb, then quickly grab another within ~2 seconds — the combo HUD
   appears showing `x2`, then `x3`, etc., with a shrinking timer bar.
2. Confirm the score jumps faster as the multiplier climbs (points = base ×
   multiplier).
3. Wait out the 2-second window without a pickup — the combo HUD disappears and
   the multiplier resets to x1.
4. Finish a round and hit "Play again" — the combo state is cleared.

Closes #003

---

## Windows command block (copy-paste)

```
git checkout -b feat/combo-multiplier
git add -A
git commit -m "feat: combo multiplier for quick collections (#003)"
git push -u origin feat/combo-multiplier
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: combo multiplier for quick collections (#003)" --body-file docs/prs/003-combo-multiplier.md`),
review the diff, and merge.
