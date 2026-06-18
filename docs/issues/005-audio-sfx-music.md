# Issue 005: Sound effects + background music

- **Target date:** 2026-06-22
- **Labels:** polish, feature
- **Status:** open

## Motivation

Audio feedback dramatically improves game feel.

## Acceptance criteria

- [ ] A pickup sound plays on each orb collected.
- [ ] A subtle background ambience/music loop plays during a round.
- [ ] A mute toggle (e.g. "M" key) is available; state reflected in the HUD.
- [ ] Audio is created with the Web Audio API (no external asset files needed).

## Technical notes

- Add `src/game/Audio.ts` wrapping an `AudioContext`; synthesize tones with
  oscillators/gain envelopes for SFX, and a simple looped pad for ambience.
- Create/resume the `AudioContext` on first user gesture (browsers block
  autoplay) — start it from the first keypress or the menu Start button.
- Keep a master gain for the mute toggle.
