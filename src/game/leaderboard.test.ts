import { describe, expect, it } from "vitest";
import {
  LEADERBOARD_SIZE,
  formatEntryDate,
  insertScore,
  parseEntries,
  type ScoreEntry,
} from "./leaderboard";

const entry = (score: number, level = 1, date = "2026-07-09"): ScoreEntry => ({
  score,
  level,
  date,
});

describe("insertScore", () => {
  it("places the first entry at rank 1", () => {
    const r = insertScore([], entry(10));
    expect(r.rank).toBe(1);
    expect(r.entries).toHaveLength(1);
  });

  it("sorts the table by score, descending", () => {
    const r = insertScore([entry(30), entry(10)], entry(20));
    expect(r.entries.map((e) => e.score)).toEqual([30, 20, 10]);
    expect(r.rank).toBe(2);
  });

  it("does not mutate the table it was given", () => {
    const existing = [entry(30)];
    insertScore(existing, entry(40));
    expect(existing).toHaveLength(1);
    expect(existing[0].score).toBe(30);
  });

  it("lets an existing entry keep its rank on a tie", () => {
    const r = insertScore([entry(50)], entry(50));
    expect(r.rank).toBe(2);
  });

  it("caps the table at the requested size", () => {
    const full = [entry(50), entry(40), entry(30)];
    const r = insertScore(full, entry(45), 3);
    expect(r.entries.map((e) => e.score)).toEqual([50, 45, 40]);
    expect(r.rank).toBe(2);
  });

  it("reports rank 0 when the score misses the cut", () => {
    const full = [entry(50), entry(40), entry(30)];
    const r = insertScore(full, entry(5), 3);
    expect(r.rank).toBe(0);
    expect(r.entries.map((e) => e.score)).toEqual([50, 40, 30]);
  });

  it("defaults to LEADERBOARD_SIZE rows", () => {
    const many = [60, 50, 40, 30, 20].map((s) => entry(s));
    const r = insertScore(many, entry(10));
    expect(r.entries).toHaveLength(LEADERBOARD_SIZE);
    expect(r.rank).toBe(0);
  });

  it("is a no-op for a zero-sized table", () => {
    const r = insertScore([entry(10)], entry(99), 0);
    expect(r.entries).toEqual([]);
    expect(r.rank).toBe(0);
  });
});

describe("parseEntries", () => {
  it("returns an empty table for null, empty or invalid JSON", () => {
    expect(parseEntries(null)).toEqual([]);
    expect(parseEntries("")).toEqual([]);
    expect(parseEntries("{ not json")).toEqual([]);
  });

  it("returns an empty table when the payload is not an array", () => {
    expect(parseEntries('{"score":10}')).toEqual([]);
  });

  it("round-trips a valid payload, sorted and capped", () => {
    const raw = JSON.stringify([entry(10), entry(30, 2), entry(20)]);
    expect(parseEntries(raw).map((e) => e.score)).toEqual([30, 20, 10]);
    expect(parseEntries(raw, 2)).toHaveLength(2);
  });

  it("drops rows with missing or invalid fields", () => {
    const raw = JSON.stringify([
      entry(20),
      { score: "10", level: 1, date: "2026-07-09" },
      { score: 15, level: 0, date: "2026-07-09" },
      { score: -5, level: 1, date: "2026-07-09" },
      { score: 12, level: 1 },
      null,
    ]);
    expect(parseEntries(raw).map((e) => e.score)).toEqual([20]);
  });

  it("floors fractional scores and levels", () => {
    const raw = JSON.stringify([{ score: 12.7, level: 3.9, date: "2026-07-09" }]);
    expect(parseEntries(raw)[0]).toEqual({
      score: 12,
      level: 3,
      date: "2026-07-09",
    });
  });
});

describe("formatEntryDate", () => {
  it("renders an ISO date as a compact month/day label", () => {
    expect(formatEntryDate("2026-07-09")).toBe("Jul 9");
    expect(formatEntryDate("2026-01-31")).toBe("Jan 31");
    expect(formatEntryDate("2026-12-01")).toBe("Dec 1");
  });

  it("passes malformed dates through unchanged", () => {
    expect(formatEntryDate("yesterday")).toBe("yesterday");
    expect(formatEntryDate("2026-13-01")).toBe("2026-13-01");
    expect(formatEntryDate("2026-7-9")).toBe("2026-7-9");
  });
});
