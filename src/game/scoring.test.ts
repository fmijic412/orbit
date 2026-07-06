import { describe, expect, it } from "vitest";
import {
  BASE_POINTS,
  MAX_MULTIPLIER,
  applyHazardPenalty,
  decayCombo,
  nextMultiplier,
  pointsFor,
} from "./scoring";

describe("nextMultiplier", () => {
  it("starts a fresh combo at x1 when the window has lapsed", () => {
    expect(nextMultiplier(1, false)).toBe(1);
    expect(nextMultiplier(7, false)).toBe(1);
  });

  it("steps up by one while the combo window is open", () => {
    expect(nextMultiplier(1, true)).toBe(2);
    expect(nextMultiplier(4, true)).toBe(5);
  });

  it("never exceeds the cap", () => {
    expect(nextMultiplier(MAX_MULTIPLIER, true)).toBe(MAX_MULTIPLIER);
    expect(nextMultiplier(MAX_MULTIPLIER - 1, true)).toBe(MAX_MULTIPLIER);
  });

  it("honours a custom cap", () => {
    expect(nextMultiplier(3, true, 3)).toBe(3);
    expect(nextMultiplier(1, true, 3)).toBe(2);
  });
});

describe("pointsFor", () => {
  it("multiplies orb value by the base points and the multiplier", () => {
    expect(pointsFor(1, 1)).toBe(BASE_POINTS);
    expect(pointsFor(3, 4)).toBe(12);
  });

  it("sums naturally for multi-orb frames via a pre-summed value", () => {
    // A frame that grabbed a common (1) + rare (3) at x2 => 4 * 2.
    expect(pointsFor(4, 2)).toBe(8);
  });

  it("respects a custom base", () => {
    expect(pointsFor(2, 3, 10)).toBe(60);
  });
});

describe("applyHazardPenalty", () => {
  it("subtracts the penalty from the score", () => {
    expect(applyHazardPenalty(20, 5)).toBe(15);
  });

  it("clamps at zero and never goes negative", () => {
    expect(applyHazardPenalty(3, 5)).toBe(0);
    expect(applyHazardPenalty(0, 5)).toBe(0);
  });
});

describe("decayCombo", () => {
  it("counts the window down without lapsing while time remains", () => {
    const r = decayCombo(2, 0.5);
    expect(r.comboTimer).toBeCloseTo(1.5);
    expect(r.lapsed).toBe(false);
  });

  it("reports a lapse exactly when the timer reaches zero", () => {
    const r = decayCombo(0.5, 0.5);
    expect(r.comboTimer).toBe(0);
    expect(r.lapsed).toBe(true);
  });

  it("clamps at zero when overshooting and still reports the lapse", () => {
    const r = decayCombo(0.3, 1);
    expect(r.comboTimer).toBe(0);
    expect(r.lapsed).toBe(true);
  });

  it("is a no-op for an already-expired timer (no repeat lapse)", () => {
    const r = decayCombo(0, 0.5);
    expect(r.comboTimer).toBe(0);
    expect(r.lapsed).toBe(false);
  });
});
