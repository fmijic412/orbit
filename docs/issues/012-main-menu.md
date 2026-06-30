# Issue 012: Main menu with Start button

- **Target date:** 2026-06-29
- **Labels:** ui, feature
- **Status:** done (PR prepared 2026-06-29)

## Motivation

A start screen frames the game and is the right place to unlock audio (user
gesture) before play begins.

## Acceptance criteria

- [x] On load, a menu overlay shows the title and a Start button (game does not
      run until Start is pressed).
- [x] Pressing Start begins a fresh round and resumes/creates the AudioContext.
- [x] The end-of-round screen can return to the menu.

## Technical notes

- Add a "menu" game state as the initial state; gate `update()`/input on it.
- Reuse the existing overlay system; wire the Start button to `start()`/
  `restart()`. If audio (005) exists, resume the context here.
