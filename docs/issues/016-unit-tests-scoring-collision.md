# Issue 016: Basic unit tests for scoring/collision math

- **Target date:** 2026-07-05
- **Labels:** tech, testing
- **Status:** done (PR prepared 2026-07-05)

## Motivation

The scoring, combo and collision math is the heart of how the game *feels*, yet
it lives tangled inside `Game.ts` and `Hazards.ts` next to renderer, DOM and
three.js code, so none of it can be exercised without a browser. A regression in
the combo curve, the hazard penalty clamp or the bounce/overlap test would ship
silently. Pulling the pure arithmetic into small, dependency-free modules and
covering it with a fast unit-test suite (Vitest) makes the rules explicit and
guards them on every change — the first item in the "Tech" backlog.

## Acceptance criteria

- [x] A test runner is wired up: `vitest` is a devDependency and `npm test`
      runs the suite headlessly (no browser, no build step required).
- [x] Scoring/combo math is extracted into a pure, three.js-free module
      (`src/game/scoring.ts`) and `Game.ts` uses it (no behaviour change).
- [x] Collision/bounce math is extracted into a pure module
      (`src/game/collision.ts`) and `Hazards.ts` uses it (no behaviour change).
- [x] Tests cover: combo multiplier stepping + cap, points-for-pickup, hazard
      penalty clamped at zero, combo-window decay/lapse, XZ range overlap, and
      the 1-D edge bounce (clamp + velocity flip, pass-through when in-bounds).
- [x] Test files are excluded from the production `tsc && vite build` so the
      shipped bundle is unchanged.

## Technical notes

- Keep the new modules free of `three` and the DOM so they run under Vitest's
  default `node` environment with no jsdom.
- Refactor should be behaviour-preserving: `Game.addScore` / `decayCombo` /
  hazard-penalty and `Hazards.collides` / `update` bounce should delegate to the
  new functions and produce identical results.
- Add `test` / `test:watch` scripts and a minimal `vitest.config.ts`; exclude
  `src/**/*.test.ts` from `tsconfig.json`'s build so production output is the
  same.
