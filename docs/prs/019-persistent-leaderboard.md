# PR: Persistent top-5 leaderboard (#019)

**Branch:** `feat/persistent-leaderboard`

---

## PR title

```
feat: persistent top-5 leaderboard on the end screen (#019)
```

## PR body

### Summary

Sprint 1 and the whole `docs/ROADMAP.md` backlog are shipped, so this opens the
next batch. Rounds are now recorded to a persistent **top-5 table** in
`localStorage`, shown on the end screen with the just-finished round highlighted.
The HUD's `Best: N` — in-memory since #002 — is seeded from that table, so it
finally survives a page reload.

### What changed

**New — `src/game/leaderboard.ts` (pure, no `three`, no DOM)**

- `insertScore(entries, entry, size)` — merges, sorts descending, caps at
  `LEADERBOARD_SIZE` (5) and returns `{ entries, rank }` where `rank` is 1-based
  (`0` = missed the cut). Inputs are never mutated. The newcomer is appended
  *before* a stable sort, so **ties favour the incumbent**: matching the current
  best does not steal rank 1 from it.
- `parseEntries(raw, size)` — defensive JSON validation. Bad JSON, a non-array
  payload, or rows with missing / non-numeric / out-of-range fields are dropped
  rather than thrown, so a corrupted store can never break the end screen.
- `formatEntryDate("2026-07-09")` → `"Jul 9"`; malformed dates pass through.

**New — `src/game/HighScores.ts`**

A thin `localStorage` persistence class shaped like `Settings.ts`: load in the
constructor, save on every write, treat an unavailable/corrupt store as "no
scores yet". `submit(score, level)` returns the round's rank and **ignores
scoreless rounds** so the table never fills with zeroes. `best()` exposes the top
score. Key: `leaderboard:entries`.

**New — `src/game/leaderboard.test.ts`**

15 vitest cases covering sorting, the size cap, tie behaviour, rank 0 on a miss,
input immutability, JSON validation and date formatting.

**Updated — `src/game/Game.ts`**

- Constructs `HighScores`; `bestScore` is seeded from `highScores.best()`.
- `endRound()` compares against the old best **before** submitting (otherwise the
  round just recorded would tie itself), then calls a new
  `renderLeaderboard(rank)` which rebuilds the rows and marks the current one.

**Updated — `index.html` / `src/style.css`**

A `#leaderboard` block inside `#end-panel`: a `Top 5` heading, an `<ol>`, and an
empty state for a first-time player. Styled to match the existing panel
aesthetic — dim rows, a gold highlight on the current round, and
`L<level> · <Mon D>` metadata per entry.

No gameplay change: scoring, collision and the difficulty ramp are untouched.
`package.json` bumped to `0.1.19`.

### How to test locally

```
npm install
npm run dev
```

Then open <http://127.0.0.1:5173>.

1. Press **Start**, collect a few orbs, let the 60s round end. The end screen
   shows **Top 5** with your run at rank 1, highlighted in gold, and `New best!`.
2. **Play again** and score *less*. Your new row appears below the first, still
   highlighted; `New best!` is hidden and the HUD `Best:` is unchanged.
3. Play a round scoring **exactly** your best. It lands at rank 2 (the incumbent
   keeps rank 1) and does not read as a new best.
4. Reload the page. The table and the HUD `Best: N` both persist.
5. Play six rounds — the table stays capped at five. A run worse than 5th place
   is not shown and highlights nothing.
6. End a round with **0 points** — nothing is recorded.
7. In DevTools, set `localStorage['leaderboard:entries'] = 'garbage'` and reload:
   the end screen shows the empty state, no console error.
8. `npm run typecheck` and `npm test` should both pass.

Closes #019

---

## Suggested branch name

```
feat/persistent-leaderboard
```

## Copy-pasteable commands (Windows)

Optionally remove the stray scratch file left by an earlier sandbox run first
(it's an empty `export {};` module — harmless, but noise):

```
del src\game\__scratch_test.ts
```

Then:

```
git checkout -b feat/persistent-leaderboard
git add -A
git commit -m "feat: persistent top-5 leaderboard on the end screen (#019)"
git push -u origin feat/persistent-leaderboard
```

Then open the PR on GitHub using the **title** and **body** above — or, with the
GitHub CLI:

```
gh pr create --title "feat: persistent top-5 leaderboard on the end screen (#019)" --body-file docs\prs\019-persistent-leaderboard.md
```

Review the diff, confirm `npm run typecheck` and `npm test` are green, and merge.

## Files changed

| File | Change |
| --- | --- |
| `src/game/leaderboard.ts` | new — pure ranking / parsing / date helpers |
| `src/game/HighScores.ts` | new — `localStorage`-backed top-5 table |
| `src/game/leaderboard.test.ts` | new — vitest coverage |
| `src/game/Game.ts` | seeds `bestScore`, submits on `endRound()`, renders the table |
| `index.html` | `#leaderboard` block in `#end-panel` |
| `src/style.css` | leaderboard styling |
| `package.json` | version → `0.1.19` |
| `docs/issues/019-persistent-leaderboard.md` | new — the issue |
| `docs/ROADMAP.md` | checked off the new UI item |
| `DEVLOG.md` | dated entry |
