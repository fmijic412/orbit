import { describe, expect, it } from "vitest";
import {
  type MomentumRating,
  type MomentumTier,
  momentumFor,
  peakSummary,
} from "./momentum";

describe("momentumFor", () => {
  it("earns the top rating for a long high-multiplier chain", () => {
    expect(momentumFor(9)).toBe("Unstoppable");
    expect(momentumFor(7)).toBe("Unstoppable");
  });

  it("steps down through the tiers as the peak shrinks", () => {
    expect(momentumFor(6)).toBe("Blazing");
    expect(momentumFor(4)).toBe("Blazing");
    expect(momentumFor(3)).toBe("Warming Up");
    expect(momentumFor(2)).toBe("Warming Up");
    expect(momentumFor(1)).toBe("Cold");
  });

  it("treats a never-chained round (peak 1) as the catch-all worst tier", () => {
    expect(momentumFor(1)).toBe("Cold");
  });

  it("clamps peaks below the multiplier floor of 1 to the worst tier", () => {
    expect(momentumFor(0)).toBe("Cold");
    expect(momentumFor(-4)).toBe("Cold");
  });

  it("floors fractional peaks before comparing", () => {
    expect(momentumFor(6.9)).toBe("Blazing");
    expect(momentumFor(3.9)).toBe("Warming Up");
  });

  it("honours custom tiers", () => {
    const tiers: MomentumTier[] = [
      { rating: "Unstoppable" as MomentumRating, minMultiplier: 5 },
      { rating: "Cold" as MomentumRating, minMultiplier: 1 },
    ];
    expect(momentumFor(5, tiers)).toBe("Unstoppable");
    expect(momentumFor(4, tiers)).toBe("Cold");
  });
});

describe("peakSummary", () => {
  it("uses no-combo wording when the player never chained", () => {
    expect(peakSummary(1)).toBe("no combo chained");
  });

  it("names the peak multiplier for a chained round", () => {
    expect(peakSummary(2)).toBe("peak x2 combo");
    expect(peakSummary(9)).toBe("peak x9 combo");
  });

  it("clamps sub-1 peaks and floors fractions", () => {
    expect(peakSummary(0)).toBe("no combo chained");
    expect(peakSummary(-3)).toBe("no combo chained");
    expect(peakSummary(4.8)).toBe("peak x4 combo");
  });
});
