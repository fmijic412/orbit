# Issue 002: High-score persistence (session)

- **Target date:** 2026-06-19
- **Labels:** ui, feature
- **Status:** done (PR prepared 2026-06-19)

## Motivation

Showing a best score gives players something to beat across rounds within a
session.

## Acceptance criteria

- [x] The best score so far is tracked and shown in the HUD ("Best: N").
- [x] When a round ends with a new best, the end screen highlights it.
- [x] Best score persists across "Play again" within the same page session.

## Technical notes

- Keep `bestScore` in memory on the `Game` instance (do NOT use localStorage —
  it is not required and keeps things simple; reset on full page reload).
- Update the HUD element on change; add a "New best!" line to the end overlay
  when `score > previousBest`.
