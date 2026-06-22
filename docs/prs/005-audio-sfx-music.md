# PR: Sound effects + background music (#005)

**Title:** `feat: sound effects + background music (Web Audio) (#005)`

**Suggested branch:** `feat/audio-sfx-music`

---

## Summary

Adds game audio built entirely on the Web Audio API — no external asset files.
Orbs now make a satisfying pickup blip (rising in pitch with the combo), a
gentle ambience pad loops during a round, and an "M" mute toggle is shown in
the HUD. The audio context is unblocked on the first user gesture so it
complies with browser autoplay policies.

## What changed

- **New `src/game/Audio.ts`** — wraps a single `AudioContext` behind a master
  gain:
  - `pickup(step)` — short triangle-wave blip (fast attack, exponential decay,
    upward pitch sweep). `step` walks a pentatonic scale so combo chains rise
    in pitch.
  - `startAmbience()` / `stopAmbience()` — looped pad of two detuned sawtooth
    oscillators through a lowpass filter, breathed by a slow LFO, with fade
    in/out. Idempotent and leak-free.
  - `resume()` — resumes a suspended context (call on first gesture).
  - `toggleMute()` / `setMuted()` / `isMuted` — click-free mute via a ramped
    master gain.
- **`src/game/Game.ts`** — creates the `Audio` system in the constructor;
  resumes the context and starts ambience on the first user gesture (first
  keypress or the Play again button); plays `pickup(multiplier - 1)` on each
  collected-orb frame; stops ambience at round end and restarts it on replay;
  "M" toggles mute and updates the HUD.
- **`index.html`** — new `#audio` HUD indicator and an "M to mute" hint.
- **`src/style.css`** — styling for `#audio` (and its `.muted` state).
- **`package.json`** — version bumped to `0.1.5`.

## How to test locally

```
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and:

1. Press a movement key (WASD / arrows) — a soft ambience pad fades in.
2. Collect orbs — each pickup plays a blip; chaining pickups for a combo makes
   the blips rise in pitch.
3. Press **M** — audio mutes/unmutes and the HUD indicator switches between
   "♪ Sound (M)" and "♪ Muted (M)".
4. Let the round end — ambience fades out; press **Play again** — it resumes.

Optional: `npm run typecheck` to confirm the strict-TS build is clean.

Closes #005

---

## Commands (Windows / PowerShell or Git Bash)

```bat
git checkout -b feat/audio-sfx-music
git add -A
git commit -m "feat: sound effects + background music (Web Audio) (#005)"
git push -u origin feat/audio-sfx-music
```

Then open the PR on GitHub using the **Title** and **Summary** above (or run
`gh pr create --title "feat: sound effects + background music (Web Audio) (#005)" --body-file docs/prs/005-audio-sfx-music.md`),
review the diff, and merge.
