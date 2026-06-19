# PR: High-score persistence (session)

**Title:** `feat: session high-score tracking with HUD + end-screen highlight (#002)`

**Branch:** `feat/high-score-persistence`

---

## Summary

Adds a session best-score so players have something to beat across rounds. The
best score is shown in the HUD, survives "Play again", and the end screen calls
out when you set a new record. Best score is kept in memory on the `Game`
instance and resets on a full page reload (no localStorage, per the issue).

Closes #002

## What changed

- **`src/game/Game.ts`**
  - Added a `bestScore` field and a `#best` HUD reference (`bestEl`) plus a
    `#new-best` end-screen reference (`newBestEl`).
  - `updateHud()` now renders `Best: N`.
  - `endRound()` detects `score > bestScore`, updates `bestScore`, toggles the
    "New best!" line, and refreshes the HUD. Because `bestScore` lives on the
    instance, it carries across `restart()`.
- **`index.html`** — added `<span id="best">Best: 0</span>` to the HUD and a
  hidden `<p id="new-best">New best!</p>` line to the end panel.
- **`src/style.css`** — styled `#best` and `#new-best` (accent color) and a
  `#new-best.hidden` rule.
- **`package.json`** — version bumped to `0.1.2`.
- Docs: issue #002 marked done, ROADMAP item checked, DEVLOG entry added.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173 and:

1. Confirm the HUD shows `Best: 0` next to the score.
2. Collect some orbs, let the 60s round end — the end screen shows "New best!"
   and the HUD `Best:` updates to your score.
3. Click "Play again". The `Best:` value stays. Score below it ends the round
   with no "New best!" line; beating it shows the highlight and updates `Best:`.
4. Reload the page — `Best:` resets to 0 (expected; in-memory only).

## Suggested commands (Windows)

```
git checkout -b feat/high-score-persistence
git add -A
git commit -m "feat: session high-score tracking (#002)"
git push -u origin feat/high-score-persistence
```

Then open the PR on GitHub with the title and body above (or run
`gh pr create --title "feat: session high-score tracking with HUD + end-screen highlight (#002)" --body-file docs/prs/002-high-score-persistence.md`),
review, and merge.
