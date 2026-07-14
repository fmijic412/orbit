import { describe, expect, it } from "vitest";
import { GRADE_COLOR, GRADE_TIERS, gradeFor, type Grade } from "./grade";

describe("gradeFor", () => {
  it("awards S at or above the top threshold", () => {
    expect(gradeFor(600)).toBe("S");
    expect(gradeFor(999)).toBe("S");
  });

  it("awards each mid tier at its exact threshold", () => {
    expect(gradeFor(400)).toBe("A");
    expect(gradeFor(250)).toBe("B");
    expect(gradeFor(120)).toBe("C");
  });

  it("returns the grade just below the next threshold", () => {
    expect(gradeFor(599)).toBe("A");
    expect(gradeFor(399)).toBe("B");
    expect(gradeFor(249)).toBe("C");
    expect(gradeFor(119)).toBe("D");
  });

  it("floors a scoreless round at D", () => {
    expect(gradeFor(0)).toBe("D");
  });

  it("falls to the lowest tier for a negative score", () => {
    expect(gradeFor(-50)).toBe("D");
  });

  it("honours custom tiers", () => {
    const tiers = [
      { grade: "S" as Grade, minScore: 100 },
      { grade: "A" as Grade, minScore: 0 },
    ];
    expect(gradeFor(100, tiers)).toBe("S");
    expect(gradeFor(50, tiers)).toBe("A");
    expect(gradeFor(-1, tiers)).toBe("A");
  });

  it("defines a colour for every grade tier", () => {
    for (const tier of GRADE_TIERS) {
      expect(GRADE_COLOR[tier.grade]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
