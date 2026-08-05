import { describe, expect, it } from "vitest";
import { buildKanaCards } from "@/data/kana";
import { classifyInput } from "@/lib/matching";
import { DrillSession } from "@/lib/quizzing";
import type { Card } from "@/lib/types";

const settings = (direction: "toRomaji" | "toKana") => ({
  scripts: new Set(["hiragana", "katakana"] as const),
  groups: new Set<string>([
    "a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa", "n",
    "ga", "za", "da", "ba", "pa",
    "kya", "sya", "tya", "nya", "hya", "mya", "rya", "gya", "zya", "dya", "bya", "pya",
    "sokuon",
  ]),
  direction,
});

function card(prompt: string, direction: "toRomaji" | "toKana"): Card {
  return buildKanaCards(settings(direction)).find((c) => c.prompt === prompt)!;
}

describe("classifyInput", () => {
  it("a full reading is correct and advances", () => {
    const ka = card("か", "toRomaji");
    expect(classifyInput(ka, "ka")).toBe("correct");
  });

  it("a prefix of a reading is 'partial' (keep typing, no penalty)", () => {
    const ka = card("か", "toRomaji");
    expect(classifyInput(ka, "k")).toBe("partial");

    const shi = card("し", "toRomaji");
    expect(classifyInput(shi, "s")).toBe("partial");
    expect(classifyInput(shi, "sh")).toBe("partial");
  });

  it("a dead-end input is 'wrong'", () => {
    expect(classifyInput(card("か", "toRomaji"), "q")).toBe("wrong");
    expect(classifyInput(card("し", "toRomaji"), "sa")).toBe("wrong");
    expect(classifyInput(card("し", "toRomaji"), "sza")).toBe("wrong");
  });

  it("empty input reports 'empty' and is never scored", () => {
    expect(classifyInput(card("か", "toRomaji"), "")).toBe("empty");
  });

  it("ん answers to a bare n (single-letter answer)", () => {
    const n = card("ん", "toRomaji");
    expect(classifyInput(n, "n")).toBe("correct");
  });

  it("full reading into ん (nn / n') is still correct", () => {
    const n = card("ん", "toRomaji");
    expect(classifyInput(n, "nn")).toBe("correct");
    expect(classifyInput(n, "n'")).toBe("correct");
  });

  it("toKana cards treat the character itself as correct", () => {
    const shi = card("shi", "toKana");
    expect(classifyInput(shi, "し")).toBe("correct");
    expect(classifyInput(shi, "shi")).toBe("correct");
    expect(classifyInput(shi, "si")).toBe("correct");
  });
});

describe("DrillSession.fail", () => {
  it("records one miss on the current card without advancing", () => {
    const s = new DrillSession([card("か", "toRomaji")], { questionCount: 0 });
    const before = s.current();
    s.fail();
    expect(s.position).toBe(0);
    expect(s.current()).toBe(before);
    expect(s.misses).toBe(1);
    expect(s.missedCards().map((c) => c.id)).toContain(before!.id);
  });
});
