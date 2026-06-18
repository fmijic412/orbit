# Issue 001: Round timer + end-of-round score screen

- **Target date:** 2026-06-18
- **Labels:** gameplay, feature
- **Status:** done (PR prepared 2026-06-18)

## Motivation

The game currently runs forever with no goal. A timed round gives players a
clear objective (maximize score before time runs out) and a reason to replay.

## Acceptance criteria

- [x] A round lasts 60 seconds; remaining time is shown in the HUD.
- [x] When time hits 0, gameplay stops and an overlay shows the final score.
- [x] The overlay has a "Play again" button that resets score, timer, and orbs.
- [x] Player input is ignored while the end screen is shown.

## Technical notes

- Track `timeLeft` in `Game.ts`; decrement by `dt` in `update()`.
- Add a `GameState` ("playing" | "ended") to gate `update()` and input.
- Add the overlay markup to `index.html` (hidden by default) and style in
  `src/style.css`; toggle a class from `Game.ts`. Wire the button to a
  `restart()` method.
