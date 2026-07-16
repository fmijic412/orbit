import { describe, expect, it } from "vitest";
import {
  type DefenseRating,
  type DefenseTier,
  defenseFor,
  hitsSummary,
} from "./defense";

describe("defenseFor", () => {
  it("earns the top rating for a hit-free round", () => {
    expect(defenseFor(0)).toBe("Untouchable");
  });

  it("steps down through the tiers as hits accrue", () => {
    expect(defenseFor(1)).toBe("Nimble");
    expect(defenseFor(2)).toBe("Nimble");
    expect(defenseFor(3)).toBe("Guarded");
    expect(defenseFor(5)).toBe("Guarded");
    expect(defenseFor(6)).toBe("Reckless");
  });

  it("maps any large hit count to the catch-all worst tier", () => {
    expect(defenseFor(999)).toBe("Reckless");
  });

  it("treats a negative hit count as zero (top rating)", () => {
    expect(defenseFor(-3)).toBe("Untouchable");
  });

  it("honours custom tiers", () => {
    const tiers: DefenseTier[] = [
      { rating: "Untouchable" as DefenseRating, maxHits: 0 },
      { rating: "Reckless" as DefenseRating, maxHits: Infinity },
    ];
    expect(defenseFor(0, tiers)).toBe("Untouchable");
    expect(defenseFor(1, tiers)).toBe("Reckless");
  });
});

describe("hitsSummary", () => {
  it("uses no-hit wording at zero", () => {
    expect(hitsSummary(0)).toBe("no hazard hits");
  });

  it("uses the singular for exactly one hit", () => {
    expect(hitsSummary(1)).toBe("1 hazard hit");
  });

  it("uses the plural for several hits", () => {
    expect(hitsSummary(4)).toBe("4 hazard hits");
  });

  it("clamps negatives and floors fractions", () => {
    expect(hitsSummary(-2)).toBe("no hazard hits");
    expect(hitsSummary(2.9)).toBe("2 hazard hits");
  });
});
