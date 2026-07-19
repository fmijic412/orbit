import { describe, expect, it } from "vitest";
import {
  type UtilityRating,
  type UtilityTier,
  powerupsSummary,
  utilityFor,
} from "./utility";

describe("utilityFor", () => {
  it("earns the top rating for a power-up-heavy round", () => {
    expect(utilityFor(6)).toBe("Overclocked");
    expect(utilityFor(4)).toBe("Overclocked");
  });

  it("steps down through the tiers as the count shrinks", () => {
    expect(utilityFor(3)).toBe("Charged");
    expect(utilityFor(2)).toBe("Charged");
    expect(utilityFor(1)).toBe("Sparked");
    expect(utilityFor(0)).toBe("Unpowered");
  });

  it("treats a no-power-up round (count 0) as the catch-all worst tier", () => {
    expect(utilityFor(0)).toBe("Unpowered");
  });

  it("clamps negative counts to the worst tier", () => {
    expect(utilityFor(-1)).toBe("Unpowered");
    expect(utilityFor(-9)).toBe("Unpowered");
  });

  it("floors fractional counts before comparing", () => {
    expect(utilityFor(3.9)).toBe("Charged");
    expect(utilityFor(1.9)).toBe("Sparked");
  });

  it("honours custom tiers", () => {
    const tiers: UtilityTier[] = [
      { rating: "Overclocked" as UtilityRating, minPowerups: 5 },
      { rating: "Unpowered" as UtilityRating, minPowerups: 0 },
    ];
    expect(utilityFor(5, tiers)).toBe("Overclocked");
    expect(utilityFor(4, tiers)).toBe("Unpowered");
  });
});

describe("powerupsSummary", () => {
  it("uses no-power-up wording when the player grabbed none", () => {
    expect(powerupsSummary(0)).toBe("no power-ups grabbed");
  });

  it("uses singular wording for exactly one power-up", () => {
    expect(powerupsSummary(1)).toBe("1 power-up grabbed");
  });

  it("names the plural count for more than one", () => {
    expect(powerupsSummary(2)).toBe("2 power-ups grabbed");
    expect(powerupsSummary(5)).toBe("5 power-ups grabbed");
  });

  it("clamps negative counts and floors fractions", () => {
    expect(powerupsSummary(-3)).toBe("no power-ups grabbed");
    expect(powerupsSummary(4.7)).toBe("4 power-ups grabbed");
  });
});
