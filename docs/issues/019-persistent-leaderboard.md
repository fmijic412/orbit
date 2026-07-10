# Issue 019: Persistent top-5 leaderboard on the end screen

- **Target date:** 2026-07-09
- **Labels:** ui, feature
- **Status:** done (PR prepared 2026-07-09)

## Motivation

Sprint 1 and the whole `docs/ROADMAP.md` backlog are shipped, so this is the
first item of the next batch. Issue #002 gave us an in-memory "Best" that resets
on reload, and #018 introduced `localStorage` persistence for settings. The
natural next step is to remember more than one round: a top-5 table on the
end screen turns each round into a run at a target rather than a one-off number,
and makes the existing "Best: N" HUD readout survive a page reload.

## Acceptance criteria

- [x] Finished rounds are recorded to a persistent top-5 table in `localStorage`
      (key `leaderboard:entries`).
- [x] Each entry stores the **score**, the **level** reached, and the **date**
      the round was played.
- [x] The end screen shows the table (rank, score, `L<level> · <Mon D>`), best
      first, below the "New best!" line.
- [x] The row for the round that just finished is **highlighted**; a round that
      misses the cut simply highlights nothing.
- [x] The HUD "Best: N" readout is seeded from the stored table, so it survives a
      page reload.
- [x] Ties favour the incumbent: matching the current best does not displace it
      from rank 1 (and does not read as a "New best!").
- [x] Scoreless (0-point) rounds are not recorded, so the table never fills with
      zeroes.
- [x] A missing, unavailable or corrupted `localStorage` value degrades to an
      empty table and an explanatory empty state, never a thrown error.
- [x] The ranking / tie / validation rules are covered by unit tests.

## Technical notes

- New `src/game/leaderboard.ts`: pure, `three`- and DOM-free helpers —
  `insertScore()` (sort, cap, stable ties, 1-based rank), `parseEntries()`
  (defensive JSON validation) and `formatEntryDate()`. Mirrors the split already
  used by `scoring.ts` / `collision.ts` so it is unit-testable.
- New `src/game/HighScores.ts`: a small persistence class wrapping the pure
  module, shaped like `Settings.ts` (load in the constructor, save on write,
  swallow storage errors).
- New `src/game/leaderboard.test.ts`: vitest coverage for the above.
- `Game.ts` constructs `HighScores`, seeds `bestScore` from it, submits the score
  in `endRound()` and renders the table via a new `renderLeaderboard(rank)`.
- `index.html` gains a `#leaderboard` block inside `#end-panel`; `style.css`
  styles it to match the existing panel aesthetic (gold highlight for the
  current row).
