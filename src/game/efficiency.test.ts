import { describe, expect, it } from "vitest";
import {
  type EfficiencyRating,
  type EfficiencyTier,
  efficiencyFor,
  efficiencySummary,
  pointsPerOrb,
} from "./efficiency";

describe("pointsPerOrb", () => {
  it("divides score by the orb count", () => {
    expect(pointsPerOrb(80, 10)).toBe(8);
    expect(pointsPerOrb(45, 15)).toBe(3);
  });

  it("returns 0 when no orbs were collected (no divide by zero)", () => {
    expect(pointsPerOrb(120, 0)).toBe(0);
    expect(pointsPerOrb(0, 0)).toBe(0);
  });

  it("clamps a negative score to 0", () => {
    expect(pointsPerOrb(-40, 8)).toBe(0);
  });

  it("floors and clamps a fractional or negative orb count", () => {
    expect(pointsPerOrb(20, 4.9)).toBe(5);
    expect(pointsPerOrb(20, -3)).toBe(0);
  });
});

describe("efficiencyFor", () => {
  it("earns the top rating for a high points-per-orb round", () => {
    expect(efficiencyFor(10)).toBe("Masterful");
    expect(efficiencyFor(24)).toBe("Masterful");
  });

  it("steps down through the tiers as the ratio shrinks", () => {
    expect(efficiencyFor(9.9)).toBe("Efficient");
    expect(efficiencyFor(6)).toBe("Efficient");
    expect(efficiencyFor(5.9)).toBe("Scrappy");
    expect(efficiencyFor(3)).toBe("Scrappy");
    expect(efficiencyFor(2.9)).toBe("Wasteful");
    expect(efficiencyFor(0)).toBe("Wasteful");
  });

  it("treats a zero ratio as the catch-all worst tier", () => {
    expect(efficiencyFor(0)).toBe("Wasteful");
  });

  it("clamps a negative ratio to the worst tier", () => {
    expect(efficiencyFor(-1)).toBe("Wasteful");
    expect(efficiencyFor(-50)).toBe("Wasteful");
  });

  it("honours custom tiers", () => {
    const tiers: EfficiencyTier[] = [
      { rating: "Masterful" as EfficiencyRating, minPerOrb: 20 },
      { rating: "Wasteful" as EfficiencyRating, minPerOrb: 0 },
    ];
    expect(efficiencyFor(20, tiers)).toBe("Masterful");
    expect(efficiencyFor(19, tiers)).toBe("Wasteful");
  });

  it("maps a round's raw score/orbs through the ratio to a rating", () => {
    // 8 pts/orb -> Efficient; 2 pts/orb -> Wasteful.
    expect(efficiencyFor(pointsPerOrb(96, 12))).toBe("Efficient");
    expect(efficiencyFor(pointsPerOrb(30, 15))).toBe("Wasteful");
  });
});

describe("efficiencySummary", () => {
  it("uses no-orb wording when the player collected none", () => {
    expect(efficiencySummary(100, 0)).toBe("no orbs collected");
  });

  it("reports the points-per-orb to one decimal", () => {
    expect(efficiencySummary(84, 10)).toBe("8.4 pts per orb");
    expect(efficiencySummary(45, 15)).toBe("3.0 pts per orb");
  });

  it("clamps a negative score to a 0.0 ratio", () => {
    expect(efficiencySummary(-20, 5)).toBe("0.0 pts per orb");
  });
});
