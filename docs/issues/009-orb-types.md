# Issue 009: Multiple orb types worth different points

- **Target date:** 2026-06-26
- **Labels:** gameplay, feature
- **Status:** done (PR prepared 2026-06-26)

## Motivation

Varied orb values reward prioritization and add visual variety.

## Acceptance criteria

- [x] At least three orb tiers (e.g. common=1, rare=3, bonus=5) with distinct
      colors/sizes.
- [x] Rarer orbs spawn less often; rarest may be time-limited.
- [x] Points awarded reflect the orb's value (and still respect the combo
      multiplier).

## Technical notes

- Extend `Collectibles.ts` so each orb carries a `value` and tier styling;
  weight spawn selection by rarity.
- Have `update()` return total value collected (not just a count) so scoring
  stays correct with the multiplier.
