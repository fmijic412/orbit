import { describe, expect, it } from "vitest";
import {
  type HaulRating,
  type HaulTier,
  haulFor,
  orbsSummary,
} from "./haul";

describe("haulFor", () => {
  it("earns the top rating for a huge haul", () => {
    expect(haulFor(60)).toBe("Voracious");
    expect(haulFor(45)).toBe("Voracious");
  });

  it("steps down through the tiers as the haul shrinks", () => {
    expect(haulFor(44)).toBe("Bountiful");
    expect(haulFor(30)).toBe("Bountiful");
    expect(haulFor(29)).toBe("Steady");
    expect(haulFor(15)).toBe("Steady");
    expect(haulFor(14)).toBe("Sparse");
    expect(haulFor(0)).toBe("Sparse");
  });

  it("treats a no-orb round (count 0) as the catch-all worst tier", () => {
    expect(haulFor(0)).toBe("Sparse");
  });

  it("clamps negative counts to the worst tier", () => {
    expect(haulFor(-1)).toBe("Sparse");
    expect(haulFor(-40)).toBe("Sparse");
  });

  it("floors fractional counts before comparing", () => {
    expect(haulFor(44.9)).toBe("Bountiful");
    expect(haulFor(15.9)).toBe("Steady");
  });

  it("honours custom tiers", () => {
    const tiers: HaulTier[] = [
      { rating: "Voracious" as HaulRating, minOrbs: 10 },
      { rating: "Sparse" as HaulRating, minOrbs: 0 },
    ];
    expect(haulFor(10, tiers)).toBe("Voracious");
    expect(haulFor(9, tiers)).toBe("Sparse");
  });
});

describe("orbsSummary", () => {
  it("uses no-orb wording when the player collected none", () => {
    expect(orbsSummary(0)).toBe("no orbs collected");
  });

  it("uses singular wording for exactly one orb", () => {
    expect(orbsSummary(1)).toBe("1 orb collected");
  });

  it("names the plural count for a bigger haul", () => {
    expect(orbsSummary(2)).toBe("2 orbs collected");
    expect(orbsSummary(48)).toBe("48 orbs collected");
  });

  it("clamps negative counts and floors fractions", () => {
    expect(orbsSummary(-3)).toBe("no orbs collected");
    expect(orbsSummary(12.8)).toBe("12 orbs collected");
  });
});
