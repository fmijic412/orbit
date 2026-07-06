# Roadmap / Feature Backlog

> **Sprint 1 is scheduled.** See `docs/PLAN.md` for the dated plan and
> `docs/issues/` for the pre-written issues. The daily task implements the
> issue whose target date is today. This file is the longer-term idea backlog;
> items marked `[x]` have shipped.

Keep each feature small enough to ship in a single PR. Add new ideas at the
bottom; they get scheduled into a future sprint.

## Gameplay

- [x] Countdown timer + end-of-round score screen with restart
- [x] Combo multiplier for collecting orbs in quick succession
- [x] Moving "hazard" cubes that cost points on contact
- [x] Power-ups (speed boost, magnet that pulls nearby orbs)
- [x] Multiple orb types worth different points
- [x] Levels / increasing difficulty over time

## Feel & polish

- [x] Particle burst when an orb is collected
- [x] Sound effects + background music (Web Audio)
- [x] Trail effect behind the player cube
- [x] Screen shake on hazard contact
- [x] Animated skybox / gradient background

## UI

- [x] Main menu with Start button
- [x] Pause (Esc) overlay
- [x] High-score persistence (in-memory, reset on reload)
- [x] Mobile touch / on-screen joystick controls

## Tech

- [x] Basic unit tests for scoring/collision math
- [ ] Simple object pooling for orbs/particles
- [ ] Settings panel (volume, sensitivity)
