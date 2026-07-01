# PR: Levels / increasing difficulty over time (#013)

**Title:** `feat: levels with increasing difficulty over time (#013)`

**Branch:** `feat/levels-difficulty`

---

## Summary

Adds a time-based difficulty ramp so a round builds pressure from start to
finish instead of staying flat. The round is split into fixed-length **levels**;
each new level activates more hazards and speeds them up. The current level is
shown in the HUD, and every tuning value is a single named constant.

Closes #013.

## What changed

- **`src/game/Game.ts`**
  - New centralized ramp constants: `LEVEL_SECONDS` (15s per level),
    `HAZARDS_BASE` (4), `HAZARDS_PER_LEVEL` (+1), `HAZARDS_MAX` (10) and
    `HAZARD_SPEED_PER_LEVEL` (+0.15× speed per level).
  - Tracks a 1-based `level` derived from elapsed round time
    (`ROUND_SECONDS - timeLeft`) in `updateLevel()`; on a level step-up,
    `applyLevel()` sets the hazard count and speed scale.
  - HUD shows the level; `level` resets to 1 on restart; `Hazards` is now
    constructed with the base/max pool sizes.
- **`src/game/Hazards.ts`**
  - Builds a fixed pool of `maxCount` cubes up front and only simulates, draws
    and collides the first `activeCount` (no mid-round geometry allocation).
  - New `setActiveCount()` (re-seeds newly activated cubes so they don't spawn
    on top of the player) and `setSpeedScale()`; `reset()` returns count and
    speed to the level-1 floor.
- **`index.html`** — new `#level` HUD indicator between Time and audio status.
- **`src/style.css`** — styling for `#level` (warm accent).
- **Docs/version** — issue #013 marked done, DEVLOG entry prepended, ROADMAP
  item checked, `package.json` bumped to `0.1.13`.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173 and press **Start**. Then:

- Watch the **Level** indicator in the HUD: it reads `Level: 1` at the start and
  steps up every 15 seconds (`Level: 2` at ~15s, `Level: 3` at ~30s, …).
- As the level climbs, more red hazard cubes appear (up to 10) and they move
  noticeably faster, so dodging gets harder toward the end of the round.
- End the round (or press **Play again** / **Main menu** → **Start**) and
  confirm difficulty resets to Level 1 with 4 base-speed hazards.
- Optional: `npm run typecheck` should pass cleanly (strict mode,
  `noUnusedLocals` / `noUnusedParameters`).

## Windows command block

```
git checkout -b feat/levels-difficulty
git add -A
git commit -m "feat: levels with increasing difficulty over time (#013)"
git push -u origin feat/levels-difficulty
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: levels with increasing difficulty over time (#013)" --body-file docs/prs/013-levels-difficulty.md`),
review the diff, and merge.
