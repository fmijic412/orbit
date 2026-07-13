import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_SECONDS,
  countdownLabel,
  tickCountdown,
} from "./countdown";

describe("tickCountdown", () => {
  it("counts down by dt without going below zero", () => {
    const step = tickCountdown(COUNTDOWN_SECONDS, 1);
    expect(step.remaining).toBeCloseTo(2);
    expect(step.done).toBe(false);
  });

  it("reports done exactly when the timer reaches zero", () => {
    const step = tickCountdown(0.5, 0.5);
    expect(step.remaining).toBe(0);
    expect(step.done).toBe(true);
  });

  it("clamps an overshooting step to zero and reports done", () => {
    const step = tickCountdown(0.2, 1);
    expect(step.remaining).toBe(0);
    expect(step.done).toBe(true);
  });

  it("treats an already-finished timer as a done no-op", () => {
    const step = tickCountdown(0, 0.016);
    expect(step.remaining).toBe(0);
    expect(step.done).toBe(true);
  });

  it("stays running for a mid-countdown step", () => {
    const step = tickCountdown(2, 0.016);
    expect(step.remaining).toBeCloseTo(1.984);
    expect(step.done).toBe(false);
  });
});

describe("countdownLabel", () => {
  it("shows the whole-second number while counting down", () => {
    expect(countdownLabel(3)).toBe("3");
    expect(countdownLabel(2.4)).toBe("3");
    expect(countdownLabel(2)).toBe("2");
    expect(countdownLabel(1.1)).toBe("2");
    expect(countdownLabel(1)).toBe("1");
    expect(countdownLabel(0.3)).toBe("1");
  });

  it("shows Go! at (and past) zero", () => {
    expect(countdownLabel(0)).toBe("Go!");
    expect(countdownLabel(-0.5)).toBe("Go!");
  });

  it("counts a full COUNTDOWN_SECONDS run down through 3, 2, 1", () => {
    const labels: string[] = [];
    let remaining = COUNTDOWN_SECONDS;
    for (let i = 0; i < 3; i++) {
      labels.push(countdownLabel(remaining));
      remaining = tickCountdown(remaining, 1).remaining;
    }
    expect(labels).toEqual(["3", "2", "1"]);
    expect(countdownLabel(remaining)).toBe("Go!");
  });
});
