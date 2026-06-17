# Orbit Runner

A web-based 3D game built with **Three.js + Vite + TypeScript**. The player
drives a glowing cube around an arena and collects orbs for points. This repo
is grown a little every day by an automated Cowork task that adds one feature
at a time via a pull request.

## Getting started

```bash
npm install
npm run dev      # start the dev server (opens the browser)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

> Requires Node 18+.

## Controls

- **WASD** or **Arrow keys** — move
- Collect the glowing orbs to raise your score

## Project structure

```
index.html          entry HTML
src/main.ts         bootstraps the Game
src/style.css       HUD + canvas styling
src/game/Game.ts    renderer, scene, camera, main loop
src/game/Player.ts  player avatar + movement
src/game/Collectibles.ts  collectible orbs + scoring
src/game/input.ts   keyboard input state
docs/ROADMAP.md     backlog of features the daily task draws from
DEVLOG.md           dated log of what was added each day
```

## How the daily updates work

Each day a scheduled Cowork task:

1. Reads `DEVLOG.md` and `docs/ROADMAP.md` to decide the next feature.
2. Writes an issue note under `docs/issues/`.
3. Creates a feature branch and implements the feature.
4. Commits locally and writes a PR description under `docs/prs/`.

Because the task's environment cannot reach GitHub or npm, **you** push the
branch, open the PR from the prepared description, review it, and merge.
