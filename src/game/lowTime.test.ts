import { describe, expect, it } from "vitest";
import { LOW_TIME_SECONDS, isLowTime, shouldTick } from "./lowTime";

describe("isLowTime", () => {
  it("is false well above the threshold", () => {
    expect(isLowTime(60)).toBe(false);
    expect(isLowTime(10.01)).toBe(false);
  });

  it("is true at and below the threshold", () => {
    expect(isLowTime(LOW_TIME_SECONDS)).toBe(true);
    expect(isLowTime(5)).toBe(true);
    expect(isLowTime(0.01)).toBe(true);
  });

  it("is false at exactly zero (the round has already ended)", () => {
    expect(isLowTime(0)).toBe(false);
  });

  it("is false for a negative time (defensive; shouldn't occur)", () => {
    expect(isLowTime(-1)).toBe(false);
  });
});

describe("shouldTick", () => {
  it("fires on the frame the displayed second first drops to 10", () => {
    expect(shouldTick(10.02, 9.99)).toBe(true);
  });

  it("fires on each subsequent whole-second crossing down to 1", () => {
    expect(shouldTick(9.02, 8.99)).toBe(true);
    expect(shouldTick(2.02, 1.99)).toBe(true);
  });

  it("does not fire between crossings, within the same displayed second", () => {
    expect(shouldTick(9.8, 9.5)).toBe(false);
  });

  it("does not fire outside the low-time window", () => {
    expect(shouldTick(15, 14)).toBe(false);
    expect(shouldTick(11.02, 10.99)).toBe(false);
  });

  it("does not fire on the crossing into exactly zero", () => {
    expect(shouldTick(0.5, 0)).toBe(false);
  });

  it("does not fire once time is already at zero", () => {
    expect(shouldTick(0, 0)).toBe(false);
  });
});
