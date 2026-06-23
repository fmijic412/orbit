# Issue 006: Moving hazard cubes

- **Target date:** 2026-06-23
- **Labels:** gameplay, feature
- **Status:** done (PR prepared 2026-06-23)

## Motivation

Hazards introduce risk and force players to navigate, not just sweep the arena.

## Acceptance criteria

- [x] A few red hazard cubes roam the arena along simple paths.
- [x] Touching a hazard costs points (and/or breaks the combo) with a brief
      invulnerability window to avoid repeat hits.
- [x] Hazards stay inside the arena bounds.

## Technical notes

- Add `src/game/Hazards.ts` managing a `THREE.Group` of cubes with per-cube
  velocity; bounce off arena edges.
- In `Game.update`, check player-vs-hazard distance; on hit apply penalty and
  set a short `iFrames` timer (flash the player while active).
