# Roadmap / Feature Backlog

The daily task picks the **topmost unchecked** item it can implement cleanly,
or invents a sensible new one if the list runs low. Keep each feature small
enough to ship in a single PR. Check items off as they ship and add new ideas
at the bottom.

## Gameplay

- [ ] Countdown timer + end-of-round score screen with restart
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
- [ ] High-score persistence (in-memory, reset on reload)
- [ ] Mobile touch / on-screen joystick controls

## Tech

- [ ] Basic unit tests for scoring/collision math
- [ ] Simple object pooling for orbs/particles
- [ ] Settings panel (volume, sensitivity)
