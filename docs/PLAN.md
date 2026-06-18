# Orbit Runner — Feature Plan & Timeline

One feature ships per day at noon (local), built by the daily Cowork task and
delivered as a branch + PR for you to review and merge. Each row maps to a
pre-written issue in `docs/issues/`. The task implements the issue whose
**target date is today** (or the earliest still-open issue if a day was missed).

## Sprint 1 — Core loop → feel → UI (Jun 18 – Jul 1, 2026)

| #   | Date (2026) | Feature                                   | Theme     |
| --- | ----------- | ----------------------------------------- | --------- |
| 001 | Jun 18 (Thu)| Round timer + end-of-round score screen   | Gameplay  |
| 002 | Jun 19 (Fri)| High-score persistence (session)          | UI        |
| 003 | Jun 20 (Sat)| Combo multiplier for quick collections    | Gameplay  |
| 004 | Jun 21 (Sun)| Particle burst on orb collect             | Polish    |
| 005 | Jun 22 (Mon)| Sound effects + background music          | Polish    |
| 006 | Jun 23 (Tue)| Moving hazard cubes (cost points)         | Gameplay  |
| 007 | Jun 24 (Wed)| Screen shake on hazard contact            | Polish    |
| 008 | Jun 25 (Thu)| Power-ups: speed boost + orb magnet       | Gameplay  |
| 009 | Jun 26 (Fri)| Multiple orb types worth different points | Gameplay  |
| 010 | Jun 27 (Sat)| Trail effect behind the player cube       | Polish    |
| 011 | Jun 28 (Sun)| Pause (Esc) overlay                       | UI        |
| 012 | Jun 29 (Mon)| Main menu with Start button               | UI        |
| 013 | Jun 30 (Tue)| Levels / increasing difficulty over time  | Gameplay  |
| 014 | Jul 1  (Wed)| Animated gradient skybox                   | Polish    |

## After Sprint 1 (backlog, not yet dated)

Pulled from `docs/ROADMAP.md` once Sprint 1 is merged:
mobile touch / joystick controls, settings panel (volume, sensitivity),
object pooling for orbs/particles, unit tests for scoring/collision math.

## Notes

- Dates assume the app is open at noon each day; a missed run executes on next
  launch and the task falls back to the earliest open issue.
- Keep each PR small and focused so review/merge stays quick.
