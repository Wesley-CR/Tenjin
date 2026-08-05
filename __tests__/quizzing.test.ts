import { describe, expect, it } from "vitest";
import { DrillSession } from "@/lib/quizzing";
import type { Card } from "@/lib/types";

function mk(id: string, answer = id): Card {
  return { id, prompt: id, answer, check: (i) => i === answer, deck: "hiragana" };
}

// Always pick j=0 → a stable, deterministic shuffle (reverses step by step).
const zeroRng = () => 0;

describe("DrillSession", () => {
  it("advances instantly on a correct answer", () => {
    const s = new DrillSession([mk("a"), mk("b"), mk("c")], {
      questionCount: 0,
      rng: zeroRng,
    });
    const first = s.current()!;
    const res = s.attempt(first.answer);
    expect(res.correct).toBe(true);
    expect(res.advanced).toBe(true);
    expect(s.position).toBe(1);
    expect(res.next).not.toBeNull();
  });

  it("stays on the same card on a wrong answer and counts a miss", () => {
    const s = new DrillSession([mk("a")], { questionCount: 0, rng: zeroRng });
    const before = s.current();
    const res = s.attempt("zzz");
    expect(res.correct).toBe(false);
    expect(res.advanced).toBe(false);
    expect(s.current()).toBe(before);
    expect(s.misses).toBe(1);
  });

  it("retries until correct, then finishes after the full queue", () => {
    const pool = [mk("a"), mk("b"), mk("c")];
    const s = new DrillSession(pool, { questionCount: 0, rng: zeroRng });
    let tries = 0;
    while (!s.finished && tries < 100) {
      const card = s.current()!;
      // Miss the first character twice on purpose.
      if (card.id === pool[0].id && s.missedCards().length === 0) s.attempt("x");
      s.attempt(card.answer);
      tries++;
    }
    expect(s.finished).toBe(true);
    expect(s.correct).toBe(3);
    expect(s.misses).toBeGreaterThanOrEqual(1);
    expect(s.missedCards().map((c) => c.id)).toContain(pool[0].id);
  });

  it("questionCount cycles the pool until the quota is met", () => {
    const s = new DrillSession([mk("a"), mk("b"), mk("c")], {
      questionCount: 5,
      rng: zeroRng,
    });
    expect(s.total).toBe(5);
    for (let i = 0; i < 100 && !s.finished; i++) s.attempt(s.current()!.answer);
    expect(s.correct).toBe(5);
    expect(s.finished).toBe(true);
  });

  it("count=0 means a single pass over the whole pool", () => {
    const s = new DrillSession([mk("a"), mk("b")], { questionCount: 0, rng: zeroRng });
    expect(s.total).toBe(2);
  });

  it("skip reveals-and-advances as a miss", () => {
    const s = new DrillSession([mk("a"), mk("b")], {
      questionCount: 0,
      rng: zeroRng,
    });
    const res = s.skip();
    expect(res.correct).toBe(false);
    expect(res.advanced).toBe(true);
    expect(s.misses).toBe(1);
    expect(s.position).toBe(1);
  });

  it("weights surface weak cards (weight 0) before strong ones", () => {
    const pool = [
      { ...mk("b"), id: "b", check: (i: string) => i === "b" },
      { ...mk("a"), id: "a", check: (i: string) => i === "a" },
    ];
    const s = new DrillSession(pool, {
      questionCount: 0,
      rng: zeroRng,
      weights: (id) => (id === "b" ? 1 : 0),
    });
    expect(s.current()!.id).toBe("a");
  });

  it("equal weights still produce a shuffled (non-id-ordered) run", () => {
    // With zeroRng, Fisher–Yates on [a, b, c] deterministically yields [b, c, a].
    const pool = [
      { ...mk("a"), id: "a", check: (i: string) => i === "a" },
      { ...mk("b"), id: "b", check: (i: string) => i === "b" },
      { ...mk("c"), id: "c", check: (i: string) => i === "c" },
    ];
    const s = new DrillSession(pool, {
      questionCount: 0,
      rng: zeroRng,
      weights: () => 0,
    });
    expect(s.current()!.id).toBe("b");
    expect(s.current()!.id).not.toBe("a"); // not the alphabetical/data order
  });

  it("different weights still shuffle within each mastery bucket", () => {
    // bucket weight 0 = [b, a] (shuffled by zeroRng → [a, b]), weight 1 = [c].
    const pool = [
      { ...mk("b"), id: "b", check: (i: string) => i === "b" },
      { ...mk("a"), id: "a", check: (i: string) => i === "a" },
      { ...mk("c"), id: "c", check: (i: string) => i === "c" },
    ];
    const s = new DrillSession(pool, {
      questionCount: 0,
      rng: zeroRng,
      weights: (id) => (id === "c" ? 1 : 0),
    });
    const first = s.current()!.id;
    expect(first).toBe("a"); // weakest bucket first, but b/a not in data order
  });
});
