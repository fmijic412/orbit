import { describe, expect, it } from "vitest";
import { bounce1D, withinRangeXZ } from "./collision";

describe("withinRangeXZ", () => {
  it("is true when the points are inside the reach", () => {
    expect(withinRangeXZ(0, 0, 0.5, 0.5, 1)).toBe(true);
    expect(withinRangeXZ(0, 0, 0, 0, 1)).toBe(true);
  });

  it("is false when the points are outside the reach", () => {
    expect(withinRangeXZ(0, 0, 3, 0, 1)).toBe(false);
    expect(withinRangeXZ(0, 0, 2, 2, 1)).toBe(false);
  });

  it("is strict at exactly the reach distance (matches the inline check)", () => {
    // Distance is exactly 1, reach is exactly 1 => not within (uses `<`).
    expect(withinRangeXZ(0, 0, 1, 0, 1)).toBe(false);
    expect(withinRangeXZ(0, 0, 1, 0, 1.0001)).toBe(true);
  });

  it("ignores the Y axis (planar test only)", () => {
    // Only X/Z are passed in, so vertical separation is irrelevant by design.
    expect(withinRangeXZ(0, 0, 0.1, 0.1, 1)).toBe(true);
  });
});

describe("bounce1D", () => {
  it("passes position and velocity through when in-bounds", () => {
    expect(bounce1D(2, 3, 10)).toEqual({ pos: 2, vel: 3 });
    expect(bounce1D(-4, -1, 10)).toEqual({ pos: -4, vel: -1 });
  });

  it("clamps at the upper wall and flips velocity inward", () => {
    expect(bounce1D(12, 5, 10)).toEqual({ pos: 10, vel: -5 });
    // Already moving inward: magnitude is preserved, sign forced negative.
    expect(bounce1D(11, -4, 10)).toEqual({ pos: 10, vel: -4 });
  });

  it("clamps at the lower wall and flips velocity inward", () => {
    expect(bounce1D(-12, -5, 10)).toEqual({ pos: -10, vel: 5 });
    expect(bounce1D(-11, 4, 10)).toEqual({ pos: -10, vel: 4 });
  });

  it("leaves a coordinate exactly on the wall untouched", () => {
    expect(bounce1D(10, 2, 10)).toEqual({ pos: 10, vel: 2 });
    expect(bounce1D(-10, -2, 10)).toEqual({ pos: -10, vel: -2 });
  });
});
