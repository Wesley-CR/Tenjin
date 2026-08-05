import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  allCardStats,
  getScores,
  getStreak,
  masteryLevel,
  recordAttempt,
  recordSession,
  resetAll,
} from "@/lib/stats";

// Provide an environment-agnostic localStorage so these tests run under any
// vitest environment (jsdom or bare node) without special config.
function makeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
  } as Storage;
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = makeStorage();
});
afterEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = undefined;
  resetAll();
  vi.useRealTimers();
});

const statOf = (id: string) =>
  allCardStats().find(([cardId]) => cardId === id)![1];

describe("per-card stats", () => {
  it("counts attempts and resets the streak on a miss", () => {
    recordAttempt("hiragana-ki", true);
    recordAttempt("hiragana-ki", true);
    recordAttempt("hiragana-ki", true);
    recordAttempt("hiragana-ki", false);
    recordAttempt("hiragana-ki", true);

    const s = statOf("hiragana-ki");
    expect(s.seen).toBe(5);
    expect(s.correct).toBe(4);
    expect(s.wrong).toBe(1);
    expect(s.streak).toBe(1);
  });

  it("crosses the mastered threshold with a clean run", () => {
    for (let i = 0; i < 6; i++) recordAttempt("hiragana-ku", true);
    expect(masteryLevel(statOf("hiragana-ku"))).toBe("mastered");
  });

  it("is 'new' until anything is seen", () => {
    expect(masteryLevel({ seen: 0, correct: 0, wrong: 0, streak: 0, lastSeen: 0 })).toBe("new");
  });
});

describe("highscores", () => {
  it("keeps the best first, accuracy then correctness", () => {
    // [trials, correct]
    const entries: Array<[number, number]> = [
      [2, 2], // 100%
      [3, 2], // 66%
      [4, 2], // 50%
      [1, 1], // 100%
      [3, 3], // 100%
    ];
    for (const [trials, correct] of entries) {
      recordSession({ mode: "hiragana|toRomaji|type", trials, correct });
    }
    const scores = getScores("hiragana|toRomaji|type");
    expect(scores[0].correct).toBe(3); // 100% accuracy, most correct
    expect(scores[0].accuracy).toBe(1);
  });

  it("caps the leaderboard at 10 entries", () => {
    for (let i = 0; i < 30; i++) recordSession({ mode: "m", correct: 1, trials: 1 });
    expect(getScores("m").length).toBeLessThanOrEqual(10);
  });
});

describe("day streak", () => {
  it("bumps only on consecutive days and ignores the same day twice", () => {
    vi.useFakeTimers();
    try {
      const day = (s: string) => new Date(`${s}T12:00:00`);

      vi.setSystemTime(day("2026-08-01"));
      recordSession({ mode: "x", correct: 1, trials: 1 });
      expect(getStreak().count).toBe(1);

      vi.setSystemTime(day("2026-08-02"));
      recordSession({ mode: "x", correct: 1, trials: 1 });
      expect(getStreak().count).toBe(2);

      vi.setSystemTime(day("2026-08-02"));
      recordSession({ mode: "x", correct: 1, trials: 1 });
      expect(getStreak().count).toBe(2); // same day → no double count

      vi.setSystemTime(day("2026-08-04"));
      recordSession({ mode: "x", correct: 1, trials: 1 });
      expect(getStreak().count).toBe(1); // gap → restart

      vi.setSystemTime(day("2026-08-05"));
      recordSession({ mode: "x", correct: 1, trials: 1 });
      expect(getStreak().count).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
