/**
 * Pure, dependency-free leaderboard maths and (de)serialisation.
 *
 * Kept free of `three` and the DOM so the ranking/tie/validation rules can be
 * unit-tested in isolation (see `leaderboard.test.ts`). The `HighScores` class
 * wraps these helpers with `localStorage` persistence.
 */

/** How many entries the persistent table keeps. */
export const LEADERBOARD_SIZE = 5;

/** A single recorded round result. */
export interface ScoreEntry {
  /** Final score for the round (non-negative integer). */
  score: number;
  /** Difficulty level reached when the round ended (1-based). */
  level: number;
  /** ISO calendar date (YYYY-MM-DD) the round was played on. */
  date: string;
}

/** The outcome of inserting a fresh entry into a table. */
export interface InsertResult {
  /** The new score-descending, size-capped table. */
  entries: ScoreEntry[];
  /** 1-based rank of the inserted entry, or 0 if it missed the cut. */
  rank: number;
}

/**
 * Inserts `entry` into `entries`, re-sorts by score (descending) and caps the
 * table at `size`. Neither input is mutated.
 *
 * Ties favour the *existing* entry: the newcomer is appended before the sort
 * and `Array.prototype.sort` is stable, so merely matching the current best
 * does not steal rank 1 from it.
 */
export function insertScore(
  entries: readonly ScoreEntry[],
  entry: ScoreEntry,
  size: number = LEADERBOARD_SIZE,
): InsertResult {
  if (size <= 0) return { entries: [], rank: 0 };
  const merged = [...entries, entry].sort((a, b) => b.score - a.score);
  const kept = merged.slice(0, size);
  // Reference identity: `entry` is a distinct object from anything already in
  // the table, so indexOf finds exactly the row we just added (-1 if it was
  // pushed off the end by higher scores).
  return { entries: kept, rank: kept.indexOf(entry) + 1 };
}

/**
 * Narrows an unknown value (a row from parsed JSON) to a `ScoreEntry`, or
 * `null` if any field is missing or out of range.
 */
function toEntry(value: unknown): ScoreEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const { score, level, date } = value as Partial<
    Record<keyof ScoreEntry, unknown>
  >;
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
    return null;
  }
  if (typeof level !== "number" || !Number.isFinite(level) || level < 1) {
    return null;
  }
  if (typeof date !== "string") return null;
  return { score: Math.floor(score), level: Math.floor(level), date };
}

/**
 * Parses a stored JSON payload into a sorted, size-capped table. Any malformed
 * payload — bad JSON, a non-array, rows with missing/invalid fields — degrades
 * to dropping just the offending rows (or the whole table) rather than throwing,
 * so a corrupted `localStorage` value can never break the end screen.
 */
export function parseEntries(
  raw: string | null,
  size: number = LEADERBOARD_SIZE,
): ScoreEntry[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const valid: ScoreEntry[] = [];
  for (const row of parsed) {
    const entry = toEntry(row);
    if (entry) valid.push(entry);
  }
  return valid.sort((a, b) => b.score - a.score).slice(0, Math.max(0, size));
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Renders a `YYYY-MM-DD` entry date as a compact `Mon D` label. Anything that
 * isn't a well-formed ISO date is passed through untouched.
 */
export function formatEntryDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return date;
  return `${MONTHS[month - 1]} ${day}`;
}
