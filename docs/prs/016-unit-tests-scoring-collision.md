# PR: Unit tests for scoring/collision math (#016)

**Title:** `test: add Vitest unit tests for scoring & collision math (#016)`

**Suggested branch:** `feat/unit-tests-scoring-collision`

---

## Summary

Sprint 1 (issues #001–#015) is fully merged, so this pulls the topmost unchecked
"Tech" item from `docs/ROADMAP.md`: unit tests for the scoring and collision
math. The core arithmetic that decides how the game *feels* — the combo curve,
the hazard penalty, the overlap and bounce tests — was tangled inside renderer,
DOM and three.js code and couldn't be exercised without a browser. This PR pulls
that math into two small, dependency-free modules and covers them with a fast
Vitest suite. The refactor is **behaviour-preserving**: gameplay is unchanged.

## What changed

- **New `src/game/scoring.ts`** (pure, no three.js/DOM): `nextMultiplier`
  (combo step-up + cap), `pointsFor` (value × base × multiplier),
  `applyHazardPenalty` (subtract, clamp at 0), `decayCombo` (window countdown +
  lapse flag). The `BASE_POINTS`, `COMBO_WINDOW`, `MAX_MULTIPLIER` constants now
  live here instead of being defined inline in `Game.ts`.
- **New `src/game/collision.ts`** (pure): `withinRangeXZ` (squared-distance
  planar overlap, strict `<` to match the previous inline check) and `bounce1D`
  (clamp to a wall + flip velocity inward; pass-through when in-bounds).
- **`src/game/Game.ts`**: imports the scoring helpers; `addScore` uses
  `nextMultiplier` + `pointsFor`; the hazard hit uses `applyHazardPenalty`; the
  combo-window method was renamed `decayCombo` → `tickComboWindow` and delegates
  to the pure `decayCombo`. Removed the now-duplicated local constants.
- **`src/game/Hazards.ts`**: `collides()` uses `withinRangeXZ`; the edge bounce
  in `update()` uses `bounce1D` for both the X and Z axes.
- **Tests**: `src/game/scoring.test.ts` and `src/game/collision.test.ts` cover
  the combo curve + cap, points math (incl. summed multi-orb frames), penalty
  clamp, window decay/lapse (incl. overshoot and already-expired no-op), the
  strict range check (planar, on-boundary) and every bounce case (both walls,
  on-wall, in-bounds pass-through).
- **Tooling**: added `vitest` devDependency, `test` (`vitest run`) and
  `test:watch` scripts, and a minimal `vitest.config.ts` (node environment).
  Test files are excluded from the production build via `tsconfig.json`
  `exclude: ["src/**/*.test.ts"]`, so `tsc && vite build` output is unchanged.
  Bumped `package.json` to `0.1.16`.

## How to test locally

```
npm install
npm test          # runs the Vitest suite headlessly
npm run dev        # then open http://127.0.0.1:5173 and confirm gameplay is unchanged
```

Expected: both suites pass. In-game, combos, the hazard penalty and hazard
bouncing/collision behave exactly as before (this is a pure refactor + tests).

Closes #016

---

## Windows command block (copy-paste)

```
git checkout -b feat/unit-tests-scoring-collision
git add -A
git commit -m "test: add Vitest unit tests for scoring & collision math (#016)"
git push -u origin feat/unit-tests-scoring-collision
```

Then open the PR on GitHub with the title/body above (or run
`gh pr create --title "test: add Vitest unit tests for scoring & collision math (#016)" --body-file docs/prs/016-unit-tests-scoring-collision.md`),
review, and merge.
