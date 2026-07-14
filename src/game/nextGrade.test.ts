import { describe, expect, it } from "vitest";
import { type Grade, type GradeTier } from "./grade";
import { nextGradeProgress } from "./nextGrade";

describe("nextGradeProgress", () => {
  it("reports no next grade at the top tier", () => {
    const p = nextGradeProgress(600);
    expect(p.atTop).toBe(true);
    expect(p.nextGrade).toBeNull();
    expect(p.pointsToNext).toBe(0);
  });

  it("stays at the top for scores well above S", () => {
    expect(nextGradeProgress(9999).atTop).toBe(true);
  });

  it("measures the gap to the next grade up from a mid tier", () => {
    // 400 earns A; S is 600 -> 200 to go.
    expect(nextGradeProgress(400)).toEqual({
      atTop: false,
      nextGrade: "S",
      pointsToNext: 200,
    });
    // 250 earns B; A is 400 -> 150 to go.
    expect(nextGradeProgress(250)).toEqual({
      atTop: false,
      nextGrade: "A",
      pointsToNext: 150,
    });
  });

  it("needs 1 point when one below the next threshold", () => {
    const p = nextGradeProgress(599);
    expect(p.nextGrade).toBe("S");
    expect(p.pointsToNext).toBe(1);
  });

  it("points a scoreless round at the next grade up (C)", () => {
    const p = nextGradeProgress(0);
    expect(p.atTop).toBe(false);
    expect(p.nextGrade).toBe("C");
    expect(p.pointsToNext).toBe(120);
  });

  it("never returns a negative gap for a negative score", () => {
    const p = nextGradeProgress(-50);
    expect(p.nextGrade).toBe("C");
    expect(p.pointsToNext).toBe(170);
    expect(p.pointsToNext).toBeGreaterThan(0);
  });

  it("rounds a fractional gap up to a whole number", () => {
    // A tier at 100.5: from 100 the gap is 0.5, ceil -> 1.
    const tiers: GradeTier[] = [
      { grade: "S" as Grade, minScore: 100.5 },
      { grade: "A" as Grade, minScore: 0 },
    ];
    const p = nextGradeProgress(100, tiers);
    expect(p.nextGrade).toBe("S");
    expect(p.pointsToNext).toBe(1);
  });

  it("honours custom tiers", () => {
    const tiers: GradeTier[] = [
      { grade: "S" as Grade, minScore: 100 },
      { grade: "A" as Grade, minScore: 0 },
    ];
    expect(nextGradeProgress(100, tiers).atTop).toBe(true);
    expect(nextGradeProgress(40, tiers)).toEqual({
      atTop: false,
      nextGrade: "S",
      pointsToNext: 60,
    });
  });
});
