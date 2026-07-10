import {
  LEADERBOARD_SIZE,
  insertScore,
  parseEntries,
  type ScoreEntry,
} from "./leaderboard";

/** `localStorage` key holding the serialised leaderboard. */
const STORAGE_KEY = "leaderboard:entries";

/** Today's local calendar date as `YYYY-MM-DD`. */
function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * The persistent top-N table of finished rounds, backed by `localStorage`.
 * Mirrors the shape of `Settings`: load on construction, save on every write,
 * and treat an unavailable/corrupt store as "no scores yet" rather than an
 * error. All ranking rules live in the pure `leaderboard` module.
 */
export class HighScores {
  private entries: ScoreEntry[] = [];

  constructor() {
    this.load();
  }

  /** The current table, best first. */
  get list(): readonly ScoreEntry[] {
    return this.entries;
  }

  /** The highest recorded score, or 0 when the table is empty. */
  best(): number {
    return this.entries.length > 0 ? this.entries[0].score : 0;
  }

  /**
   * Records a finished round and returns its 1-based rank, or 0 if it missed
   * the cut. Scoreless rounds are ignored so an empty table isn't padded with
   * zeroes.
   */
  submit(score: number, level: number, date: string = todayISO()): number {
    if (score <= 0) return 0;
    const result = insertScore(
      this.entries,
      { score, level, date },
      LEADERBOARD_SIZE,
    );
    this.entries = result.entries;
    this.save();
    return result.rank;
  }

  private load(): void {
    try {
      this.entries = parseEntries(localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage might be unavailable; start from an empty table.
      this.entries = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // localStorage might be unavailable; silently continue in-memory only.
    }
  }
}
