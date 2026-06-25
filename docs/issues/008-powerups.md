# Issue 008: Power-ups — speed boost + orb magnet

- **Target date:** 2026-06-25
- **Labels:** gameplay, feature
- **Status:** done (PR prepared 2026-06-25)

## Motivation

Power-ups create exciting moments and decisions about routing.

## Acceptance criteria

- [x] Occasionally a power-up spawns: Speed (temporary higher move speed) or
      Magnet (temporarily pulls nearby orbs toward the player).
- [x] Picking one up activates its effect for a fixed duration with a HUD
      indicator + countdown.
- [x] Effects cleanly expire and can be re-acquired.

## Technical notes

- Add `src/game/PowerUps.ts` for spawning/animating pickups and reporting
  which type was collected.
- Track active effects + timers in `Game.ts`; Speed scales the player's move
  speed, Magnet adds a steering force on orbs within a radius (extend
  `Collectibles.update` to accept an optional attract target).
