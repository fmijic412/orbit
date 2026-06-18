# PR: Round timer + end-of-round score screen (#001)

**Title:** `feat: round timer + end-of-round score screen (#001)`

**Suggested branch:** `feat/round-timer-score-screen`

---

## Summary

Turns the open-ended sandbox into a timed game. Each round lasts 60 seconds;
players try to collect as many orbs as possible before time runs out. When the
timer hits 0 the round freezes and an overlay shows the final score with a
"Play again" button that starts a fresh round.

## What changed

- **`src/game/Game.ts`**
  - Added a `ROUND_SECONDS = 60` constant and a `GameState` ("playing" |
    "ended") that gates `update()`.
  - Track `timeLeft`, decremented by `dt` each frame; when it reaches 0,
    `endRound()` switches state to "ended" and reveals the overlay.
  - While ended, the scene keeps rendering but input, scoring and the timer are
    all skipped, so player input is ignored on the end screen.
  - New `updateHud()` (score + remaining seconds), `endRound()`, and a
    `restart()` method wired to the "Play again" button that resets score,
    timer, player position and orbs.
- **`index.html`** — added a `#time` span to the HUD and a hidden
  `#end-screen` overlay (final score + "Play again" button).
- **`src/style.css`** — styled the `#time` HUD element and the end-screen
  overlay/panel/button; `.hidden` toggles visibility.
- **`src/game/Collectibles.ts`** — added `reset()` to re-randomize all orbs.
- **`src/game/Player.ts`** — added `reset()` to recenter the player.
- **`package.json`** — version bumped to `0.1.1`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and verify:

1. The HUD shows `Time: 60` and counts down each second.
2. Collecting orbs raises the score during the round.
3. At `Time: 0`, the game freezes and the overlay shows the final score.
4. Movement keys do nothing while the end screen is visible.
5. Clicking "Play again" hides the overlay, resets score to 0 and timer to 60,
   recenters the player, repositions the orbs, and gameplay resumes.

Closes #001

---

## Copy-paste commands (Windows)

```bat
git checkout -b feat/round-timer-score-screen
git add -A
git commit -m "feat: round timer + end-of-round score screen (#001)"
git push -u origin feat/round-timer-score-screen
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: round timer + end-of-round score screen (#001)" --body-file docs/prs/001-round-timer-score-screen.md`),
review the diff, and merge.
