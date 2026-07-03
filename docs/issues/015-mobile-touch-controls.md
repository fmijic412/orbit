# Issue 015: Mobile touch / on-screen joystick controls

- **Target date:** 2026-07-02
- **Labels:** ui, feature
- **Status:** done (PR prepared 2026-07-02)

## Motivation

The game is only playable with a keyboard, so it is unplayable on phones and
tablets. An on-screen virtual joystick lets touch users drive the player cube,
opening the game up to mobile.

## Acceptance criteria

- [x] On touch devices, an on-screen joystick appears and drives the player.
- [x] The joystick is analog: tilting it a little moves slowly, tilting it far
      moves at full speed (in any direction).
- [x] Keyboard controls still work unchanged on desktop; the joystick does not
      appear or interfere with mouse/UI on non-touch devices.
- [x] Touch input never scrolls/zooms the page or fights the menu, pause and
      end-of-round overlays.

## Technical notes

- Add a self-contained `Joystick` system (`src/game/Joystick.ts`) that renders
  a base + knob overlay and translates pointer drags into a normalized axis
  vector.
- Feed the axis into `Input` as an analog channel that is combined with the
  keyboard, so gameplay code stays source-agnostic.
- `Player.update` should preserve analog magnitude (clamp the move vector to a
  max length of 1 instead of always normalizing) so partial tilts move slower
  while keyboard diagonals stay speed-correct.
- Only enable on coarse-pointer / touch devices; keep `touch-action: none` on
  the joystick zone so dragging never scrolls the page.
