# PR: Power-ups — speed boost + orb magnet (#008)

**Title:** `feat: power-ups — speed boost + orb magnet (#008)`

**Suggested branch:** `feat/powerups`

---

## Summary

Adds collectible power-ups to Orbit Runner. Occasionally a pickup spawns in the
arena — **Speed** (a green octahedron) temporarily boosts the player's move
speed, and **Magnet** (a purple torus) temporarily reels nearby orbs toward the
player. Each effect runs for a fixed duration with a live HUD countdown, expires
cleanly, and can be re-acquired. Closes #008.

## What changed

- **New `src/game/PowerUps.ts`** — keeps at most one pickup in the arena at a
  time. A randomized spawn timer (8–14s) drops a random pickup that bobs and
  spins; `update(dt, playerPos)` reports the collected `PowerUpType` (or `null`)
  and re-arms the timer. Exports `POWERUP_COLOR` for HUD/particle tinting.
- **`src/game/Player.ts`** — `update()` takes an optional `speedScale` (default
  `1`) multiplying the base move speed. Speed power-up passes `1.6×` for `6s`.
- **`src/game/Collectibles.ts`** — `update()` takes an optional `attract` target.
  While Magnet is active (target = player), orbs within a `7`-unit radius are
  steered toward the player, pulling harder the closer they are and capped so
  they never overshoot. Magnet lasts `6s`.
- **`src/game/Game.ts`** — creates `PowerUps` in the constructor and ticks it
  from `update()`; owns `speedTimer`/`magnetTimer`; on pickup fires a particle
  burst and a new `Audio.powerup()` cue. Re-collecting a live effect refreshes
  its timer. Timers/indicators clear on round end and restart.
- **`src/game/Audio.ts`** — adds `powerup()`, a bright rising arpeggio so a
  power-up reads as a clearly positive, more significant event than an orb blip.
- **`index.html` + `src/style.css`** — new `#powerups` HUD showing ⚡ Speed and
  🧲 Magnet with a per-second countdown; hidden when inactive.
- Docs: marked issue #008 done, updated `DEVLOG.md` and `docs/ROADMAP.md`,
  bumped `package.json` to `0.1.8`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and:

1. Play a round; within ~8–14s a green octahedron (Speed) or purple torus
   (Magnet) appears. Drive into it.
2. **Speed:** the cube noticeably dashes faster for 6s; the ⚡ Speed HUD badge
   counts down and disappears at 0.
3. **Magnet:** orbs within range slide toward you for 6s; the 🧲 Magnet badge
   counts down. Grabbing the same type again refreshes the timer to full.
4. Confirm effects expire cleanly, the HUD badges hide on round end / Play
   again, and a fresh pickup spawns each round.

Optional: `npm run typecheck` should pass (strict, `noUnusedLocals`,
`noUnusedParameters`).

## Windows commands to push

```
git checkout -b feat/powerups
git add -A
git commit -m "feat: power-ups — speed boost + orb magnet (#008)"
git push -u origin feat/powerups
```

Then open the PR on GitHub with the title/body above (or run
`gh pr create --title "feat: power-ups — speed boost + orb magnet (#008)" --body-file docs/prs/008-powerups.md`),
review, and merge.
