# PR: Settings panel (volume + sensitivity) #018

## PR Title

```
feat: Settings panel with volume and sensitivity sliders (#018)
```

## PR Body

```markdown
## Summary

Implements a customizable Settings panel accessed from the main menu, allowing
players to adjust master volume (0–100%) and input sensitivity (0.5–2.0×) to
suit their preferences. All settings persist to localStorage and restore on
page reload.

## What Changed

- **New `src/game/Settings.ts`**: A small system managing volume and sensitivity
  with localStorage persistence. Values are clamped to valid ranges and
  gracefully degrade if localStorage is unavailable.

- **Updated `src/game/Audio.ts`**:
  - Changed `masterLevel` from a constant to a mutable field
  - Added `getVolume()` / `setVolume(fraction)` methods to control the master
    gain with immediate effect
  - Volume is normalized to a 0–1 user-facing range

- **Updated `src/game/Game.ts`**:
  - Constructs a `Settings` instance and loads persisted values on init
  - Player move speed multiplier now includes `settings.getSensitivity()` so
    the slider adjusts real-time responsiveness
  - Wired Settings button to show/hide the overlay
  - Connected slider inputs to update Settings and Audio immediately
  - Added methods: `showSettings()`, `hideSettings()`, `updateSettingsUI()`,
    `onVolumeChange()`, `onSensitivityChange()`, `applySettings()`

- **Updated `index.html`**:
  - Menu panel: added **Settings** button next to Start
  - New `#settings-screen` overlay with Volume and Sensitivity sliders, each
    with a live display of the current value
  - **Back** button returns to the menu

- **Updated `src/style.css`**:
  - Styled `#settings-panel` to match menu/pause aesthetic (centered, bordered,
    semi-transparent background)
  - Custom range slider styling: gold thumbs with glow effects, cleaner
    appearance across browsers
  - Setting labels in gold accent colour; values displayed on the right

- **Updated `package.json`**: Bumped version to 0.1.18

## Behaviour & Testing

The default volume (100%) and sensitivity (1.0×) match the current baseline, so
existing gameplay is unchanged. Settings are applied immediately and persist
across page reloads.

**To test locally:**

```bash
npm install
npm run dev
```

1. Open http://127.0.0.1:5173
2. From the main menu, click **Settings**
3. **Volume slider**:
   - Drag left to reduce volume (silent at 0%)
   - Drag right to restore (100% = normal)
   - Changes apply instantly; verify audio levels change live during gameplay
4. **Sensitivity slider**:
   - Drag left to 0.5× (move slower)
   - Default 1.0× (unchanged)
   - Drag right to 2.0× (move faster)
   - Start a round and verify the player cube's responsiveness reflects the slider
5. **Persistence**: Adjust both sliders, reload the page, verify they restore
6. **Back button**: Click Back, verify the menu reappears
7. **Gameplay**: Start a round and adjust settings while paused to verify they
   apply mid-round

## Closes #018
```

## Branch Name

```
feat/settings-panel
```

## Git Commands (Windows)

Copy and paste this block into PowerShell or Command Prompt in the repo root:

```bash
git checkout -b feat/settings-panel
git add -A
git commit -m "feat: Settings panel with volume and sensitivity sliders (#018)"
git push -u origin feat/settings-panel
```

Then open the PR on GitHub using the title and body above (or run
`gh pr create --title "feat: Settings panel with volume and sensitivity sliders (#018)" --body "..."` if you have the GitHub CLI installed), review, and merge.
