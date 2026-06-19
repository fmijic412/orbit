# Roadmap / Feature Backlog

> **Sprint 1 is scheduled.** See `docs/PLAN.md` for the dated plan and
> `docs/issues/` for the pre-written issues. The daily task implements the
> issue whose target date is today. This file is the longer-term idea backlog;
> items marked `[x]` have shipped.

Keep each feature small enough to ship in a single PR. Add new ideas at the
bottom; they get scheduled into a future sprint.

## Gameplay

- [x] Countdown timer + end-of-round score screen with restart
- [ ] Combo multiplier for collecting orbs in quick succession
- [ ] Moving "hazard" cubes that cost points on contact
- [ ] Power-ups (speed boost, magnet that pulls nearby orbs)
- [ ] Multiple orb types worth different points
- [ ] Levels / increasing difficulty over time

## Feel & polish

- [ ] Particle burst when an orb is collected
- [ ] Sound effects + background music (Web Audio)
- [ ] Trail effect behind the player cube
- [ ] Screen shake on hazard contact
- [ ] Animated skybox / gradient background

## UI

- [ ] Main menu with Start button
- [ ] Pause (Esc) overlay
- [x] High-score persistence (in-memory, reset on reload)
- [ ] Mobile touch / on-screen joystick controls

## Tech

- [ ] Basic unit tests for scoring/collision math
- [ ] Simple object pooling for orbs/particles
- [ ] Settings panel (volume, sensitivity)
