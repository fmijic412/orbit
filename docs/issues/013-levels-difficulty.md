# Issue 013: Levels / increasing difficulty over time

- **Target date:** 2026-06-30
- **Labels:** gameplay, feature
- **Status:** open

## Motivation

A flat difficulty gets stale; ramping pressure keeps a round tense to the end.

## Acceptance criteria

- [ ] Difficulty increases as the round progresses (e.g. every 15s a new
      "level"): more/faster hazards, or faster orb churn.
- [ ] The current level is shown in the HUD.
- [ ] Ramp values are centralized constants, easy to tune.

## Technical notes

- Track `level` derived from elapsed time in `Game.ts`; on level-up, scale
  hazard count/speed (006) and/or orb behavior.
- Keep tuning constants together at the top of the relevant module.
