# PR: Simple object pooling for orbs/particles (#017)

**Title:** feat: object pooling for orbs/particles — allocation-free collect path (#017)

**Suggested branch:** `feat/object-pooling`

---

## Summary

Sprint 1 (issues #001–#016) is fully merged, so this pulls the topmost unchecked
item from `docs/ROADMAP.md` — **"Simple object pooling for orbs/particles"** — the
next entry in the Tech backlog.

It adds a tiny reusable `Pool<T>` primitive and routes the two effect systems
through it. The particle system already recycled from a fixed pool via a
hand-rolled cursor; the orb collection path, however, still allocated a fresh
`OrbPickup[]` plus a `Vector3.clone()` **every frame a pickup happened**. That
per-frame garbage is now gone. This is a behaviour-preserving performance change —
no gameplay difference.

## What changed

- **New `src/game/Pool.ts`** — a small, `three`/DOM-free generic object pool.
  `Pool<T>` preallocates `size` items with a factory and exposes:
  - `acquire()` — round-robin hand-out, wrapping to overwrite the oldest slot
    once every slot has been used (exactly what a capped particle system wants);
  - `items` / `get(i)` / `size` — direct, allocation-free access for callers that
    fill a per-frame buffer.
- **`src/game/Particles.ts`** — refactored onto `Pool<Particle>`. The constructor
  builds the pool from a factory; `burst()` uses `pool.acquire()`; `update()` and
  `reset()` iterate `pool.items` directly. The bespoke `cursor` field and private
  `acquire()` are removed. Burst/fade behaviour is identical.
- **`src/game/Collectibles.ts`** — `update()` is now allocation-free. It reuses a
  persistent `picked` result buffer (`length = 0` each frame) backed by a `Pool`
  of mutable `PickupSlot` objects (one per orb, so it can never overflow). Each
  pickup fills a pooled slot in place via `position.copy()` instead of
  `position.clone()` + a new object literal. Callers in `Game.update()` consume
  the buffer within the same frame, so recycling the slots is safe. Scoring, the
  collect-particle bursts and the magnet power-up are unchanged.
- **Docs/meta** — `docs/issues/017-object-pooling.md` filed and marked done;
  `DEVLOG.md` entry prepended; `docs/ROADMAP.md` box checked; `package.json`
  bumped to `0.1.17`.

## How to test locally

```
npm install
npm run dev
```

Open http://127.0.0.1:5173 and play a round:

- Orbs still spawn in three tiers, rotate/bob, and are collected on contact;
  collecting still fires a colour-matched particle burst and scores correctly
  (combo multiplier intact).
- Grab a **Magnet** power-up and confirm nearby orbs still reel toward you.
- Collect several orbs in a chain and confirm bursts/scoring behave as before.
- Optional: run `npm run typecheck` (`tsc --noEmit`) and `npm test` — both should
  stay green (no behaviour change; existing scoring/collision suites unaffected).

> Note: the automated sandbox left a stray, empty `src/game/__scratch_test.ts`
> (`export {};`) that it lacked permission to delete. Please delete it before
> committing (`git rm src/game/__scratch_test.ts` or remove it in Explorer).

Closes #017

---

## Copy-paste commands (Windows)

```
del src\game\__scratch_test.ts
git checkout -b feat/object-pooling
git add -A
git commit -m "feat: object pooling for orbs/particles (#017)"
git push -u origin feat/object-pooling
```

Then open the PR on GitHub using the **Title** and **Summary** above (or run
`gh pr create --fill --title "feat: object pooling for orbs/particles (#017)"`),
review the diff, and merge.
