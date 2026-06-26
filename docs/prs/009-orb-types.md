# PR: Multiple orb types worth different points (#009)

**Title:** `feat: multiple orb types worth different points (#009)`

**Suggested branch:** `feat/orb-types`

---

## Summary

Adds three orb tiers to Orbit Runner so collecting rewards prioritization and
the arena reads with more variety. **Common** orbs (gold, 1pt) are plentiful,
**rare** orbs (cyan, larger, 3pt) appear less often, and a scarce **bonus** orb
(magenta, largest, 5pt) is time-limited — it re-rolls into a new tier if you
don't grab it in time. Points awarded reflect each orb's value and still respect
the combo multiplier. Closes #009.

## What changed

- **`src/game/Collectibles.ts`** — reworked around an `OrbTier` model. An
  `ORB_TIERS` table defines each tier's colour, emissive, mesh scale, point
  `value`, spawn `weight` and `life`. Spawn selection is weighted by rarity
  (`70 / 24 / 6`), so commons dominate. Each orb carries a current tier and a
  remaining `life`; the bonus tier's `6s` lifetime causes it to re-roll and
  reposition when it lapses (`Infinity` for the permanent tiers). `update()` now
  returns `OrbPickup[]` (`{ position, value, color }`) instead of bare
  positions, exposing both the value for scoring and the tier colour for the
  collect burst. The magnet-pull behaviour from #008 is preserved.
- **`src/game/Game.ts`** — sums the picked orbs' `value` and routes the total
  through `addScore()` (param renamed `orbs` → `value`), so tier value and the
  combo multiplier compound correctly. Each collect burst is now tinted in the
  orb's own tier colour. Removed the now-unused `ORB_COLOR` import.
- Docs/version: marked issue #009 done, updated `DEVLOG.md` and
  `docs/ROADMAP.md`, bumped `package.json` to `0.1.9`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and:

1. Play a round and watch the orbs: most are small gold (common), some are
   larger cyan (rare), and occasionally a large magenta orb (bonus) appears.
2. Collect a **rare** orb and confirm the score jumps by 3 (× any active combo
   multiplier); a **bonus** orb adds 5. A **common** adds 1.
3. Confirm the collect particle burst matches each orb's colour (gold / cyan /
   magenta).
4. Leave a magenta **bonus** orb alone for ~6s and confirm it disappears /
   re-rolls into a different orb rather than sitting forever.
5. Chain pickups quickly and confirm the combo multiplier still stacks on top of
   the tier value, and that the Magnet power-up still pulls orbs of every tier.

Optional: `npm run typecheck` should pass (strict, `noUnusedLocals`,
`noUnusedParameters`).

## Windows command block

```
git checkout -b feat/orb-types
git add -A
git commit -m "feat: multiple orb types worth different points (#009)"
git push -u origin feat/orb-types
```

Then open the PR on GitHub with the title/body above (or run `gh pr create`
and paste them), review the diff, and merge.
