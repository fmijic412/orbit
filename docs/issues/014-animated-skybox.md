# Issue 014: Animated gradient skybox

- **Target date:** 2026-07-01
- **Labels:** polish, feature
- **Status:** done (PR prepared 2026-07-01)

## Motivation

A living background adds atmosphere and depth versus a flat clear color.

## Acceptance criteria

- [x] The background is a smooth gradient (or large sky dome) rather than a
      solid color.
- [x] It animates subtly over time (slow hue/position shift).
- [x] Performance and fog/readability of gameplay are preserved.

## Technical notes

- Use a large inward-facing sphere with a custom `ShaderMaterial`
  (vertex world position → gradient), or a fullscreen background shader.
- Drive animation with a `uTime` uniform updated in `Game.update`. Ensure the
  existing `THREE.Fog` still blends nicely; adjust fog color if needed.
