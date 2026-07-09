# Issue 018: Settings panel (volume, sensitivity)

- **Target date:** 2026-07-08
- **Labels:** ui, feature
- **Status:** done (PR prepared 2026-07-07)

## Motivation

Currently volume and input sensitivity are fixed. A settings panel in the main menu lets players customize audio levels and responsiveness to their preference, improving accessibility and personalization.

## Acceptance criteria

- [x] A **Settings** button appears in the main menu (secondary button alongside Start).
- [x] Clicking **Settings** overlays a panel showing two sliders: **Volume** (0–100%) and **Sensitivity** (e.g. 0.5–2.0× for move speed).
- [x] The Volume slider controls the master gain on the `Audio` system; changes apply immediately.
- [x] The Sensitivity slider controls player move speed scaling (passed to `Player.update()` or input normalization).
- [x] Settings are **persisted to `localStorage`** and restored on page reload (`settings:volume` and `settings:sensitivity` keys).
- [x] A **Back** or **Close** button returns to the main menu; Start still works from the settings overlay.
- [x] Settings are applied during gameplay and can be changed while paused or in the menu.

## Technical notes

- New `src/game/Settings.ts`: a simple system managing volume and sensitivity with getters and a `load()/save()` pair for `localStorage`.
- `index.html` gains a `#settings-screen` overlay (hidden by default) with two `<input type="range">` sliders and a **Back** button.
- `Game.ts` constructs `Settings`, loads persisted values on init, and applies them during `update()`.
- The main menu gains a **Settings** button wired to show the overlay and hide the menu.
- Style the panel consistently with existing menu/pause overlays (centered, semi-transparent, readable text).
- Ensure settings are readable and reactive with no latency.
