import { describe, expect, it } from "vitest";
import { FLAWLESS_BASE, FLAWLESS_PER_LEVEL, flawlessBonus } from "./bonus";

describe("flawlessBonus", () => {
  it("awards the base bonus for a flawless level-1 round", () => {
    expect(flawlessBonus(0, 1, 40)).toBe(FLAWLESS_BASE);
  });

  it("adds the per-level bonus for each level beyond the first", () => {
    expect(flawlessBonus(0, 3, 120)).toBe(
      FLAWLESS_BASE + 2 * FLAWLESS_PER_LEVEL,
    );
  });

  it("awards nothing once the player has taken a hit", () => {
    expect(flawlessBonus(1, 4, 200)).toBe(0);
    expect(flawlessBonus(5, 2, 80)).toBe(0);
  });

  it("awards nothing for a round that never scored", () => {
    expect(flawlessBonus(0, 3, 0)).toBe(0);
    expect(flawlessBonus(0, 1, -5)).toBe(0);
  });

  it("floors a fractional level and never drops below level 1", () => {
    expect(flawlessBonus(0, 2.9, 60)).toBe(FLAWLESS_BASE + FLAWLESS_PER_LEVEL);
    expect(flawlessBonus(0, 0, 10)).toBe(FLAWLESS_BASE);
  });

  it("honours custom base and per-level overrides", () => {
    expect(flawlessBonus(0, 2, 30, 100, 50)).toBe(150);
  });
});
