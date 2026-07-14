# Dev Log

A dated record of what changed each day. Newest entries on top.

## 2026-07-14 — End-of-round performance grade (#022)

- Every dated issue (#001–#021) is done and every item in `docs/ROADMAP.md` was
  already checked, so the plan is exhausted. Per the plan's "future runs add a
  new idea, file it as the next issue, and build it" rule, today adds a new UI
  idea — an end-of-round letter grade — to the roadmap, files it as issue #022,
  and builds it.
- New `src/game/grade.ts`: the pure, `three`- and DOM-free grading layer,
  following the `scoring.ts` / `bonus.ts` / `countdown.ts` / `leaderboard.ts`
  precedent. Exports a `Grade` union (`S`/`A`/`B`/`C`/`D`), `GRADE_TIERS`
  (grade + `minScore`, highest first: S≥600, A≥400, B≥250, C≥120, D≥0), a
  `GRADE_COLOR` map, and `gradeFor(score, tiers = GRADE_TIERS)` — walks the
  tiers high→low and returns the first the score reaches, falling to the lowest
  tier for sub-floor/negative scores so the result is always a valid grade.
- New `src/game/grade.test.ts`: 7 vitest cases over the top tier, exact
  thresholds, just-below-threshold boundaries, the scoreless floor, negative
  scores, custom tiers, and that every tier has a hex colour.
- Updated `src/game/Game.ts`: imports `gradeFor` / `GRADE_COLOR`; in
  `endRound()`, after the final score (incl. any flawless bonus) is set, it
  grades the run, writes the letter into the new `#grade` element, tints it via
  `GRADE_COLOR`, and restarts the pop animation with the same remove-class /
  reflow / add-class trick used for the countdown label.
- Updated `index.html` / `src/style.css`: a large `#grade` element on the end
  panel above the final score, with a `#grade.pop` keyframe pop-in.
- No change to scoring, collision, the difficulty ramp or the flawless bonus —
  the grade is a pure read of the already-final score. `package.json` bumped to
  `0.1.22`.

## 2026-07-11 — Flawless round bonus (#021)

- Every dated issue (#001–#020) is done and every item in `docs/ROADMAP.md` was
  already checked, so the plan is exhausted. Per the plan's "future runs add a
  new idea, file it as the next issue, and build it" rule, today adds a new
  gameplay idea — a flawless (no-hit) round bonus — to the roadmap, files it as
  issue #021, and builds it.
- New `src/game/bonus.ts`: the pure, `three`- and DOM-free scoring layer,
  following the `scoring.ts` / `countdown.ts` precedent. `FLAWLESS_BASE` (25),
  `FLAWLESS_PER_LEVEL` (10), and `flawlessBonus(hits, level, score)` → the bonus
  for a clean round: `0` when the player took a hit (`hits > 0`) or never scored
  (`score <= 0`, so idle rounds can't farm it), otherwise `base + (floor(level)
  − 1) * perLevel` so surviving deeper into the ramp untouched pays more.
- New `src/game/bonus.test.ts`: 6 vitest cases over the base award, the per-level
  scaling, hit forfeiture, the scoreless-round guard, fractional/floored levels,
  and custom base/per-level overrides.
- Updated `src/game/Game.ts`: tracks a per-round `hitCount` (reset in `restart()`,
  incremented in `updateHazards()` on each fresh hazard contact). `endRound()`
  now computes `flawlessBonus(...)` and adds it to the score *before* deciding
  `isNewBest` and submitting to the leaderboard, so the bonus counts toward both;
  a positive bonus shows the `#flawless-bonus` end-screen line and fires a mint
  celebratory particle burst.
- Updated `index.html` / `src/style.css`: a `#flawless-bonus` end-screen line
  (hidden unless earned), styled in mint (`#5cffb0`) to read as a reward,
  distinct from the gold "New best!".
- No change to base scoring, collision or the difficulty ramp — only a new
  end-of-round reward. `package.json` bumped to `0.1.21`.

## 2026-07-10 — Round-start countdown "3 · 2 · 1 · Go!" (#020)

- Every dated issue (#001–#019) is done and every item in `docs/ROADMAP.md` was
  already checked, so the plan is exhausted. Per the plan's "future runs add a
  new idea, file it as the next issue, and build it" rule, today adds a new
  polish idea — a round-start countdown — to the roadmap, files it as issue #020,
  and builds it.
- New `src/game/countdown.ts`: the pure, `three`- and DOM-free timing layer,
  following the `scoring.ts` / `leaderboard.ts` precedent. `COUNTDOWN_SECONDS`
  (3), `tickCountdown(remaining, dt)` → `{ remaining, done }` (clamps at 0 and
  keeps reporting `done` so a late frame can't revive the countdown), and
  `countdownLabel(remaining)` mapping remaining seconds to `"3"`/`"2"`/`"1"` and
  `0` to `"Go!"`.
- New `src/game/countdown.test.ts`: 8 vitest cases over the down-count, the
  zero-crossing `done` flag, overshoot clamping, the finished no-op, and the
  label mapping through a full 3 → 2 → 1 → Go! run.
- Updated `src/game/Game.ts`: adds a `"countdown"` `GameState`. `restart()` now
  enters `"countdown"` (seeding `countdown` + a short `goHold`) instead of going
  straight to `"playing"`, so Start / Play again open on the countdown. `update()`
  gains a countdown branch that keeps the skybox animating and eases the camera
  in behind the player while the round clock, hazards, orbs, power-ups and
  scoring stay frozen; when the timer reaches "Go!" a brief `GO_HOLD_SECONDS`
  (0.45s) keeps the word readable before `beginPlay()` unfreezes into live play.
  A new `updateCountdownHud()` re-pops the label only when the digit changes.
- Updated `index.html` / `src/style.css`: a non-blocking `#countdown-screen`
  overlay with a large gold `#countdown-label`, a per-tick `countdown-pop`
  keyframe, and `pointer-events: none` so the touch joystick underneath stays
  usable; z-index 19 sits it above the HUD but below the pause/menu overlays.
- No scoring, collision or difficulty change — only *when* a round starts moves.
  `package.json` bumped to `0.1.20`.

## 2026-07-09 — Persistent top-5 leaderboard (#019)

- Every issue (#001–#018) is done and every item in `docs/ROADMAP.md` was
  checked, so the dated plan is exhausted. Today opens the next batch: the first
  new backlog idea — a persistent top-5 leaderboard on the end screen — is added
  to the roadmap's UI section and filed as issue #019 before being built.
- New `src/game/leaderboard.ts`: the pure, `three`- and DOM-free ranking layer,
  following the `scoring.ts` / `collision.ts` precedent. `insertScore()` merges a
  fresh entry, sorts descending, caps at `LEADERBOARD_SIZE` (5) and returns the
  new table plus the entry's 1-based rank (0 if it missed the cut) — without
  mutating its input. Because the newcomer is appended *before* a stable sort,
  ties favour the incumbent: matching the current best does not steal rank 1.
  `parseEntries()` validates a stored JSON payload row by row (bad JSON, a
  non-array, or rows with missing/negative/non-numeric fields are dropped rather
  than thrown), and `formatEntryDate()` renders `2026-07-09` as `Jul 9`.
- New `src/game/HighScores.ts`: a thin `localStorage` persistence class shaped
  like `Settings.ts` — load in the constructor, save on every write, and treat an
  unavailable or corrupt store as "no scores yet". `submit(score, level)` returns
  the round's rank and ignores scoreless rounds, so the table never fills with
  zeroes. `best()` exposes the top score.
- New `src/game/leaderboard.test.ts`: 15 vitest cases over sorting, the size cap,
  tie behaviour, rank 0 on a miss, input immutability, JSON validation and date
  formatting.
- Updated `src/game/Game.ts`: constructs `HighScores` and seeds `bestScore` from
  it, so the HUD's "Best: N" now survives a page reload (previously in-memory
  only, per #002). `endRound()` compares against the old best *before* submitting
  — otherwise the round just recorded would tie itself — then renders the table
  through a new `renderLeaderboard(rank)` that builds the rows and marks the row
  of the round that just finished.
- New `#leaderboard` block inside `#end-panel` in `index.html` (a `Top 5`
  heading, an `<ol>`, and an empty state for a first-time player), styled in
  `src/style.css` to match the existing panel aesthetic: dim rows, a gold
  highlight on the current round, and `L<level> · <Mon D>` metadata per entry.
- No gameplay change — scoring, collision and the difficulty ramp are untouched.
  `package.json` bumped to `0.1.19`.
- Tooling note: `src/game/__scratch_test.ts` (an empty `export {};` module left
  by an earlier sandbox run) still can't be deleted from this environment — it is
  harmless but safe to remove before committing.
- Run locally with `npm install` then `npm run dev` at http://127.0.0.1:5173.

## 2026-07-07 — Settings panel: volume + sensitivity (#018)

- After Sprint 1 and the pooling refactor, the final unchecked item in `docs/ROADMAP.md` — a Settings panel for customizing volume and input sensitivity — is implemented and filed as issue #018.
- New `src/game/Settings.ts`: a tiny system managing volume (0–1) and sensitivity (0.5–2.0) with `localStorage` persistence. Getters and setters clamp and validate all values; `load()` / `save()` handle browser storage (graceful no-op if unavailable).
- Updated `src/game/Audio.ts`: changed `masterLevel` from a constant to a field so `setVolume(fraction)` can scale it. New `getVolume()` / `setVolume()` methods normalize the internal gain (0–0.5) to a user-facing 0–1 range.
- Updated `src/game/Game.ts`: constructs `Settings`, loads/applies defaults on init via `applySettings()`. Player move speed now scales by `settings.getSensitivity()` each frame, so the slider controls responsiveness live. Wired Settings button in the menu to show/hide the overlay, and connected the sliders to update both Settings and Audio.
- New `#settings-screen` overlay in `index.html` with a **Volume** slider (0–100%, displays %) and **Sensitivity** slider (0.5–2.0×, displays multiplier), plus a **Back** button to return to the menu. Menu panel gains a **Settings** button next to Start.
- Styling in `src/style.css`: `#settings-panel` matches the menu/pause aesthetic (centered, bordered, semi-transparent). Range sliders are styled with gold thumbs and glow; labels and display values keep the UI readable.
- Settings applied immediately on slider input; persisted to `localStorage` on change. On page load, saved values restore automatically — users' preferences carry across sessions until reload.
- Behaviour-preserving: no gameplay change. The default sensitivity (1.0×) and volume (100%) match the current baseline so existing rounds play identically. `package.json` bumped to `0.1.18`.
- Run locally with `npm install` then `npm run dev` at http://127.0.0.1:5173.

## 2026-07-07 — Simple object pooling for orbs/particles (#017)

- Sprint 1 (issues #001–#016) is fully merged, so today pulls the topmost
  unchecked item from `docs/ROADMAP.md` — object pooling for orbs/particles —
  and files it as issue #017 before building it.
- Added a tiny, reusable, three.js-free pooling primitive `src/game/Pool.ts`:
  `Pool<T>` preallocates `size` items via a factory and hands them back out
  round-robin (`acquire()`, wrapping to overwrite the oldest once full) plus
  indexed/iterable access (`get(i)`, `items`, `size`) for callers that fill a
  per-frame buffer. No `three`/DOM dependency, so it stays trivially reusable.
- Refactored `Particles` onto `Pool<Particle>`: the constructor now builds the
  pool via a factory and `burst()` calls `pool.acquire()`, replacing the
  hand-rolled `cursor`/private `acquire()`. `update()`/`reset()` iterate
  `pool.items` directly (no per-frame closure). Burst/fade behaviour is
  identical.
- Made `Collectibles.update()` allocation-free: it previously built a fresh
  `OrbPickup[]` and a `position.clone()` per pickup every frame. It now reuses a
  persistent `picked` buffer (`length = 0` each frame) backed by a `Pool` of
  mutable `PickupSlot` objects (one per orb, so it never overflows); each pickup
  fills a pooled slot in place via `position.copy()`. Callers in `Game.update()`
  consume the buffer the same frame, so recycling slots is safe — scoring, the
  collect-particle bursts and the magnet power-up are unchanged.
- Behaviour-preserving: no gameplay change; this only removes steady per-frame
  garbage from the collection/particle hot paths. `package.json` bumped to
  `0.1.17`.
- Tooling note: the sandbox left a stray `src/game/__scratch_test.ts` (an empty
  `export {};` module) that it lacked permission to delete — safe to remove
  before committing.
- Run locally with `npm install` then `npm run dev` at http://127.0.0.1:5173.

## 2026-07-05 — Basic unit tests for scoring/collision math (#016)

- Sprint 1 (issues #001–#015) is fully merged, so today pulls the topmost
  unchecked item from `docs/ROADMAP.md` — unit tests for the scoring/collision
  math — and files it as issue #016 before building it.
- Extracted the pure arithmetic that used to be tangled inside renderer/DOM code
  into two small, dependency-free modules so it can be tested without a browser:
  - `src/game/scoring.ts`: `nextMultiplier` (combo step + cap), `pointsFor`
    (value × base × multiplier), `applyHazardPenalty` (subtract, clamp at 0) and
    `decayCombo` (window countdown + lapse flag). The `BASE_POINTS`,
    `COMBO_WINDOW` and `MAX_MULTIPLIER` constants now live here (previously
    defined inline in `Game.ts`).
  - `src/game/collision.ts`: `withinRangeXZ` (squared-distance planar overlap,
    strict `<` to match the old inline test) and `bounce1D` (clamp to a wall +
    flip velocity inward, pass-through when in-bounds).
- Refactored the callers to delegate to those modules — **behaviour-preserving**,
  no gameplay change:
  - `Game.ts` imports the scoring helpers; `addScore` uses `nextMultiplier` +
    `pointsFor`, the hazard hit uses `applyHazardPenalty`, and the renamed
    `tickComboWindow` (was `decayCombo`) uses the pure `decayCombo`.
  - `Hazards.ts` `collides()` uses `withinRangeXZ` and `update()`'s edge bounce
    uses `bounce1D` for both axes.
- Added **Vitest**: `vitest` devDependency, `test` / `test:watch` scripts, a
  minimal `vitest.config.ts` (node environment, no jsdom), and two suites —
  `src/game/scoring.test.ts` and `src/game/collision.test.ts` — covering the
  combo curve + cap, points math, penalty clamp, window decay/lapse, the strict
  range check and every bounce case (both walls, on-wall, in-bounds).
- Test files are excluded from the production build via `tsconfig.json`
  `exclude: ["src/**/*.test.ts"]`, so `tsc && vite build` output is unchanged.
  `package.json` bumped to `0.1.16`.
- Run the suite with `npm install` then `npm test` (or `npm run test:watch`).

## 2026-07-02 — Mobile touch / on-screen joystick controls (#015)

- Sprint 1 (issues #001–#014) is fully implemented, so today pulls the topmost
  unchecked item from `docs/ROADMAP.md` — mobile touch controls — and files it
  as issue #015 before building it.
- New `src/game/Joystick.ts`: a self-contained, **analog on-screen joystick**.
  It mounts its own DOM overlay (a floating base ring + knob) inside a
  lower-left "active zone" and translates pointer drags into a normalized axis
  in `[-1, 1]` per component. The joystick is **dynamic** — the base recenters
  under wherever you first press within the zone — with a `KNOB_RADIUS = 52`px
  travel and a small `DEAD_ZONE = 0.12` to swallow jitter. It uses Pointer
  Events with `setPointerCapture`, so a drag keeps tracking even if the finger
  leaves the zone, and snaps back to zero on release/cancel.
- It **only activates on touch devices** (`matchMedia("(pointer: coarse)")` /
  `ontouchstart` / `maxTouchPoints`). On a mouse-only desktop the zone keeps
  `pointer-events: none`, so it never touches the cursor, buttons or keyboard
  path. `touch-action: none` on the zone stops drags from scrolling/zooming.
- `src/game/input.ts` gained an **analog channel**: `setAxis(x, z)` is summed
  with the keyboard in `moveX`/`moveZ`, each clamped to `[-1, 1]`. Gameplay
  keeps reading a single source-agnostic axis.
- `src/game/Player.ts` now **clamps the move vector to a max length of 1**
  instead of always normalizing. Keyboard cardinals (len 1) and diagonals
  (len ~1.41, capped) behave exactly as before, but a partially-tilted joystick
  (len < 1) keeps its magnitude and moves proportionally slower — true analog
  control.
- `src/game/Game.ts` constructs the `Joystick` and, each playing frame, calls
  `input.setAxis(joystick.x, joystick.y)` right before `player.update`. The
  joystick's `y` flips screen-down to the game's "up = forward" convention.
- The HUD hint and menu controls text now mention drag-to-move. Overlay
  z-index ordering (joystick `15` < menu/pause/end `20`+) means those screens
  still capture touches when visible. `package.json` bumped to `0.1.15`.

## 2026-07-01 — Animated gradient skybox (#014)

- Replaced the flat clear colour with a **living gradient sky dome**. New
  `src/game/Skybox.ts` builds a large (radius 150) inward-facing
  `SphereGeometry` rendered with a custom `THREE.ShaderMaterial`: the fragment
  shader paints a smooth top→horizon gradient (`uTop` deep night, `uBottom`
  dusky blue) driven by the view direction's elevation.
- The sky **animates subtly** via a `uTime` uniform: a luminance-preserving
  hue rotation around the grey axis (`±0.22 rad`, `HUE_SPEED = 0.08`) plus a
  slow vertical drift of the gradient band (`DRIFT_SPEED = 0.1`,
  `DRIFT_AMPLITUDE = 0.03`). All tuning lives as constants at the top of the
  file. Because the shift preserves luminance, gameplay readability is
  unaffected.
- `Skybox.update(dt, cameraPosition)` advances `uTime` and re-centres the dome
  on the camera each frame, so it reads as an infinite backdrop wherever the
  player roams. It's ticked from the top of `Game.update()` — before the
  menu/paused early-return — so the background stays alive on the menu and
  while paused too.
- Blending: the material opts out of fog (`fog: false`) with `depthWrite:false`
  and `renderOrder = -1` so it draws first and gameplay geometry sits on top.
  `THREE.Fog` colour was retuned to `0x18233d` (toward the horizon colour) so
  distant fogged geometry dissolves into the gradient instead of a flat band;
  the fallback `scene.background` was darkened to `0x0a0d18`.
- Performance: one extra draw call, a single low-cost sphere with a cheap
  fragment shader and no per-frame allocations.

## 2026-06-30 — Levels / increasing difficulty over time (#013)

- The round now ramps in difficulty over time. Elapsed play is divided into
  fixed-length **levels** (`LEVEL_SECONDS = 15`): each level beyond the first
  activates more hazards (`HAZARDS_PER_LEVEL`, capped at `HAZARDS_MAX = 10`) and
  scales their travel speed (`HAZARD_SPEED_PER_LEVEL = 0.15` per level). All
  ramp values are centralized constants at the top of `Game.ts`, so the curve
  is trivial to tune.
- `Game.ts` derives a 1-based `level` from `ROUND_SECONDS - timeLeft` each
  frame (`updateLevel()`); on a step-up it calls `applyLevel()`, which pushes
  the new hazard count and speed scale into the `Hazards` system. `level` is
  reset to 1 on restart.
- `Hazards.ts` now builds a fixed pool of `HAZARDS_MAX` cubes up front but only
  simulates/draws/collides the first `activeCount`. New methods
  `setActiveCount()` (re-seeds newly activated cubes so they don't pop in on the
  player) and `setSpeedScale()` drive the ramp; `reset()` returns count and
  speed to their level-1 floor. No geometry is allocated mid-round.
- HUD: added a **Level** indicator (`#level`) between Time and the audio status,
  updated every frame in `updateHud()` and styled with a warm accent.

## 2026-06-29 — Main menu with Start button (#012)

- The game now opens on a **main menu** instead of dropping straight into a
  round. Added a `"menu"` game state and made it the initial state; `update()`
  treats `menu` exactly like `paused` (an early return before any simulation,
  scoring, audio, particle/trail or camera work), so the scene sits idle behind
  the overlay until the player presses Start.
- New `#menu-screen` overlay in `index.html` shows the title "Orbit Runner", a
  one-line tagline, a prominent **Start** button, and a controls hint. It reuses
  the existing overlay/panel styling and sits at a higher `z-index` (30) than the
  end/pause screens so it always wins during transitions.
- The **Start** button is wired to the existing `restart()`, which resets the
  round and — being a user gesture — resumes/creates the `AudioContext` and
  starts the ambience. `restart()` now also hides the menu overlay.
- The end-of-round screen gained a secondary **Main menu** button (next to
  **Play again**) wired to a new `toMenu()` handler that stops ambience, hides
  the end screen and re-shows the menu, leaving the round frozen in `menu` state
  until Start is pressed for a clean fresh round.

## 2026-06-28 — Pause (Esc) overlay (#011)

- Added a `"paused"` branch to the game state. Pressing **Esc** mid-round
  toggles pause; a `#pause-screen` overlay (title "Paused" + a **Resume**
  button) fades in over the scene. Esc again, or clicking Resume, continues
  exactly where the round left off.
- In `Game.update()`, the `paused` state returns immediately before any
  simulation, scoring, particle/trail or camera work runs — so the timer and
  all motion truly freeze while the loop keeps re-rendering the last frame. The
  loop already clamps `clock.getDelta()` to 0.05s, so no `dt` spike accumulates
  across the pause.
- Audio now ducks (rather than fully muting) while paused: `Audio.setDucked()`
  ramps the master gain to 25% of normal, composing with the existing mute flag
  via a single `applyMasterGain()` helper so the two effects never fight.
- `restart()` defensively hides the pause overlay and unducks audio; the HUD
  hint now mentions "Esc to pause".
- Files: `src/game/Game.ts`, `src/game/Audio.ts`, `index.html`,
  `src/style.css`. Bumped version to 0.1.11.

## 2026-06-27 — Trail effect behind the player cube (#010)

- Added `src/game/Trail.ts`: a pooled, fading motion trail. A fixed pool of 24
  "ghost" cubes (shared `BoxGeometry`, per-ghost `MeshBasicMaterial`) is
  recycled round-robin, so the trail is capped and allocates nothing after
  construction. A ghost is dropped at the player's position only once it has
  moved `MIN_STEP` (0.45u) since the last drop, then fades and shrinks from
  `START_OPACITY`/`START_SCALE` to zero over `SEGMENT_LIFE` (0.5s).
- Because new ghosts are only emitted while moving, the trail fades out on its
  own when the player stands still. The trail uses the player's blue tint and
  is drawn additively-soft (`transparent`, `depthWrite: false`).
- `Game.ts` creates the `Trail` in the constructor, adds `trail.group` to the
  scene, ticks `trail.update(dt, player.position)` alongside the particle
  update (so ghosts keep fading after the round ends), and calls `trail.reset()`
  on restart. Bumped version to 0.1.10.

- Reworked `src/game/Collectibles.ts` around an `OrbTier` model. Three tiers,
  each with its own colour, size and value: **common** (gold, 1pt), **rare**
  (cyan, 1.28×, 3pt) and **bonus** (magenta, 1.55×, 5pt). An `ORB_TIERS` table
  drives the styling so adding/tuning a tier is a one-line change.
- Spawn selection is weighted by rarity (`weight` 70 / 24 / 6), so commons
  dominate and bonuses are scarce. The bonus tier is **time-limited**: each orb
  carries a `life` (6s for bonus, `Infinity` otherwise); when it lapses the orb
  re-rolls a new tier and teleports, so an ignored high-value orb won't linger.
- `Collectibles.update()` now returns `OrbPickup[]` — `{ position, value,
  color }` per orb — instead of bare positions, so scoring reflects value and
  each collect burst is tinted in the orb's own tier colour.
- `Game.ts` sums the picked orbs' `value` and routes it through `addScore()`
  (renamed param `orbs` → `value`), so the combo multiplier still applies on top
  of tier value. Dropped the now-unused `ORB_COLOR` import; bursts use per-orb
  colour. Bumped version to 0.1.9.

## 2026-06-25 — Power-ups: speed boost + orb magnet (#008)

- Added `src/game/PowerUps.ts`: a small system that keeps at most one pickup in
  the arena. A randomized spawn timer (`SPAWN_MIN`..`SPAWN_MAX`, 8–14s) drops a
  random pickup — a green octahedron for **Speed**, a purple torus for
  **Magnet** — which bobs and spins until collected. `update(dt, playerPos)`
  returns the collected `PowerUpType` (or `null`) and re-arms the timer.
- `Player.update()` gained an optional `speedScale` (default 1); an active Speed
  power-up passes `SPEED_BOOST_SCALE` (1.6×) for `SPEED_BOOST_SECONDS` (6s).
- `Collectibles.update()` gained an optional `attract` target; while Magnet is
  active (target = player) orbs within `MAGNET_RADIUS` (7u) are steered toward
  the player, pulling harder the closer they are, capped so they never
  overshoot. Magnet lasts `MAGNET_SECONDS` (6s).
- `Game.ts` owns `speedTimer`/`magnetTimer`, ticks them in `update()`, applies
  the effects, and on pickup fires a particle burst + a new `Audio.powerup()`
  rising arpeggio. Re-collecting a live effect refreshes its timer to full.
- HUD: new `#powerups` indicators (`index.html` + `style.css`) show ⚡ Speed and
  🧲 Magnet with a live second countdown; they hide on expiry, round end, and
  restart. `restart()`/`endRound()` clear both timers and `powerups.reset()`
  re-arms a fresh spawn.

## 2026-06-24 — Screen shake on hazard contact (#007)

- Added a decaying `trauma` value (0..1) and a `shake(amount)` method to the
  camera logic in `Game.ts`. A hazard hit calls `shake(HAZARD_SHAKE)` right
  after the existing penalty/burst/buzz, so the jolt lands with the impact.
- `updateCamera(dt)` now subtracts the previous frame's offset before running
  the follow lerp, then applies a fresh randomized offset on top — so the
  shake rides on the follow camera without ever accumulating or fighting the
  lerp toward the player. The offset is squared from trauma (`trauma²`) so
  small amounts stay gentle, and is capped at `SHAKE_MAX_OFFSET` (0.7 units)
  to avoid motion discomfort. Trauma bleeds out at `TRAUMA_DECAY` per second.
- The shake keeps decaying on the end screen (the frozen branch passes `dt`),
  so a hit landing as the timer expires doesn't freeze the camera mid-jolt.
- `restart()` resets `trauma` to 0 so a new round always starts steady.

## 2026-06-23 — Moving hazard cubes (#006)

- New `Hazards` system (`src/game/Hazards.ts`): a `THREE.Group` of 4 red cubes,
  each with its own per-axis velocity. `update(dt)` advances them along straight
  paths and bounces them off the arena edges, clamping position so they never
  leave the bounds. Cubes tumble slightly so they read as dangerous.
- `collides(playerPos)` does a cheap circular XZ test combining the hazard and
  player half-sizes, so contact feels fair rather than pixel-perfect.
- `Game.ts` creates the system in its constructor, adds its group to the scene,
  and ticks it from `update()` only while the round is playing (hazards freeze
  on the end screen).
- Hazard contact now costs `HAZARD_PENALTY` (5) points (floored at 0), breaks
  any active combo, and opens a 1.2s invulnerability window during which the
  player cube blinks; a fresh hit is only possible after the window lapses, so a
  single bump can't drain the score. Each hit also fires a red particle burst.
- New `Audio.hit()` plays a short descending sawtooth buzz so a penalty reads as
  clearly negative against the bright pickup blip.
- `restart()` and `endRound()` reset i-frames and restore player visibility so
  the cube is never left mid-blink.

## 2026-06-22 — Sound effects + background music (#005)

- New `Audio` system (`src/game/Audio.ts`): a thin wrapper around a single
  `AudioContext` with a master gain in front of the destination. No external
  asset files — every sound is synthesized with the Web Audio API.
- `pickup(step)` plays a short triangle-wave blip with a fast attack /
  exponential decay envelope and an upward pitch sweep; `step` walks a
  pentatonic scale so chained combo pickups rise in pitch.
- `startAmbience()` / `stopAmbience()` run a gentle looped pad — two detuned
  sawtooth oscillators through a lowpass filter, breathed by a slow LFO on the
  gain — with fade in/out. Idempotent and leak-free (oscillators are stopped
  on teardown).
- Mute is a single `toggleMute()` / `setMuted()` on the master gain (ramped to
  avoid clicks); `isMuted` is reflected in a new `#audio` HUD readout.
- `Game.ts` creates the system in its constructor and, because browsers block
  autoplay, resumes the context + starts ambience on the first user gesture
  (first keypress or the Play again button). It fires `pickup(multiplier - 1)`
  per collected-orb frame, stops ambience at round end, and restarts it on
  replay. "M" toggles mute and updates the HUD.
- `index.html` gains the `#audio` indicator and an "M to mute" hint; styled in
  `src/style.css`.
- Bumped version to v0.1.5.

## 2026-06-21 — Particle burst on orb collect (#004)

- New `Particles` system (`src/game/Particles.ts`): a fixed pool of 160 small
  glowing meshes recycled across bursts, so a steady stream of pickups
  allocates nothing after construction. Exposes `burst(position, color)`,
  `update(dt)` and `reset()`.
- `burst()` sprays 16 shards outward with an upward kick; `update()` integrates
  gravity + drag and fades/shrinks each shard over its ~0.5s life, hiding and
  recycling it when finished (no leaks).
- `Collectibles.update()` now returns the world positions of orbs picked up
  this frame (instead of just a count); the orb's base colour is exported as
  `ORB_COLOR` and reused for both the orb material and its burst tint.
- `Game.ts` creates the system in its constructor, adds `particles.group` to
  the scene, ticks `particles.update(dt)` every frame (so in-flight bursts
  finish even after the round ends), fires a burst per collected orb, and
  clears particles in `restart()`.
- Bumped version to v0.1.4.

## 2026-06-20 — Combo multiplier for quick collections (#003)

- Added a combo system to `Game.ts`: new `multiplier` and `comboTimer` fields,
  with constants `BASE_POINTS`, `COMBO_WINDOW` (2s) and `MAX_MULTIPLIER` (9).
- All scoring now routes through a single `addScore(orbs)` helper — picking up
  an orb while the window is still open bumps the multiplier (x2, x3, …) and
  refills the timer; otherwise the combo starts fresh at x1. Points per orb =
  `BASE_POINTS * multiplier`.
- `decayCombo(dt)` counts the window down each frame and resets the multiplier
  to x1 when it lapses; `restart()` clears the combo state.
- New HUD combo readout (`#combo`) in `index.html` — a large `xN` label over a
  shrinking timer bar — styled in `src/style.css`. It shows only while a combo
  (>x1) is active and `updateComboHud()` keeps the bar fill in sync.
- Bumped version to v0.1.3.

## 2026-06-19 — High-score persistence (session) (#002)

- Added a `bestScore` field to `Game.ts` (in-memory; persists across "Play
  again" but resets on full page reload, per the issue).
- New `#best` HUD element ("Best: N") in `index.html`, styled in
  `src/style.css`; `updateHud()` now keeps it in sync.
- `endRound()` detects a new best (`score > bestScore`), updates `bestScore`,
  and toggles a highlighted "New best!" line (`#new-best`) on the end overlay.
- Bumped version to v0.1.2.

## 2026-06-18 — Round timer + end-of-round score screen (#001)

- Added a 60-second round timer tracked in `Game.ts` (`timeLeft`, decremented
  by `dt` in `update()`); remaining seconds shown in a new `#time` HUD element.
- Introduced a `GameState` ("playing" | "ended") that gates `update()` — when
  the timer hits 0 the round freezes (input, scoring and the clock all stop
  while the scene keeps rendering).
- Added a hidden end-screen overlay in `index.html` (final score + "Play
  again" button), styled in `src/style.css`; toggled via a `hidden` class.
- Wired "Play again" to a `restart()` method that resets score, timer, player
  position and orbs. Added `reset()` helpers to `Player` and `Collectibles`.
- Bumped version to v0.1.1.

## 2026-06-17 — Project scaffold (v0.1.0)

- Set up Three.js + Vite + TypeScript project.
- Arena with ground plane, grid, fog, and lighting.
- Player cube with WASD / arrow movement, clamped to the arena.
- Six collectible orbs with bob/spin animation and pickup detection.
- Score HUD and a follow camera.
