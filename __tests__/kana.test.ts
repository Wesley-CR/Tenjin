import { describe, expect, it } from "vitest";
import {
  KANA_ENTRIES,
  KANA_GROUPS,
  buildKanaCards,
} from "@/data/kana";

const HIRAGANA = ["hiragana", "katakana"] as const;

function all(script: (typeof HIRAGANA)[number]) {
  return KANA_ENTRIES.filter((e) => e.script === script);
}

describe("kana dataset integrity", () => {
  it("has exactly 46 basic kana per script (45 rows + ん)", () => {
    for (const script of HIRAGANA) {
      const rows = all(script).filter((e) =>
        ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"].includes(e.row)
      );
      const n = all(script).find((e) => e.row === "n");
      expect(rows.length, `${script} rows`).toBe(45);
      expect(n?.kind).toBe("special");
    }
  });

  it("has 216 entries and unique ids", () => {
    expect(KANA_ENTRIES.length).toBe(216);
    const ids = new Set(KANA_ENTRIES.map((e) => e.id));
    expect(ids.size).toBe(KANA_ENTRIES.length);
  });

  it("covers the full syllabus: dakuon, handakuon, youon, sokuon", () => {
    for (const script of HIRAGANA) {
      const e = all(script);
      expect(e.filter((x) => x.kind === "basic").length).toBe(45);
      expect(e.filter((x) => x.kind === "dakuon").length).toBe(20);
      expect(e.filter((x) => x.kind === "handakuon").length).toBe(5);
      expect(e.filter((x) => x.kind === "youon").length).toBe(36);
    }
    // sokuon exists in both scripts
    expect(KANA_ENTRIES.filter((e) => e.row === "sokuon").map((e) => e.script).sort()).toEqual([
      "hiragana",
      "katakana",
    ]);
  });

  it("every kana group is selectable in the config UI", () => {
    expect(KANA_GROUPS.length).toBe(29);
    const rowIds = new Set(KANA_GROUPS.map((g) => g.id));
    for (const e of KANA_ENTRIES) expect(rowIds.has(e.row)).toBe(true);
  });
});

type ScriptKey = (typeof HIRAGANA)[number];

describe("direction-aware cards", () => {
  const settings = (direction: "toRomaji" | "toKana") => ({
    scripts: new Set<ScriptKey>(["hiragana", "katakana"]),
    groups: new Set(KANA_GROUPS.map((g) => g.id)),
    direction,
  });

  it("drops cards for unselected scripts", () => {
    const cards = buildKanaCards({
      scripts: new Set(["hiragana"]),
      groups: new Set(["sa"]),
      direction: "toRomaji",
    });
    expect(cards.length).toBe(5);
    expect(cards.every((c) => c.sub === "hiragana")).toBe(true);
  });

  it("kana → romaji accepts canonical and variant readings", () => {
    const cards = buildKanaCards(settings("toRomaji"));
    const shi = cards.find((c) => c.prompt === "し")!;
    expect(shi.answer).toBe("shi");
    expect(shi.check("shi")).toBe(true);
    expect(shi.check("si")).toBe(true); // Kunrei
    expect(shi.check("sa")).toBe(false);

    const chi = cards.find((c) => c.prompt === "ち")!;
    expect(chi.check("ti")).toBe(true);
  });

  it("romaji → kana accepts the char, its reading, or variants", () => {
    const cards = buildKanaCards(settings("toKana"));
    const shi = cards.find((c) => c.answer === "し")!;
    expect(shi.prompt).toBe("shi");
    expect(shi.check("し")).toBe(true);
    expect(shi.check("shi")).toBe(true);
    expect(shi.check("si")).toBe(true);
    expect(shi.check("へ")).toBe(false);
  });

  it("ん can be answered with n, nn or n'", () => {
    for (const direction of ["toRomaji", "toKana"] as const) {
      const cards = buildKanaCards(settings(direction));
      const n = direction === "toRomaji"
        ? cards.find((c) => c.prompt === "ん")!
        : cards.find((c) => c.answer === "ん")!;
      expect(n.check("n")).toBe(true);
      expect(n.check("nn")).toBe(true);
      expect(n.check("n'")).toBe(true);
    }
  });

  it("every card's canonical answer passes its own check", () => {
    for (const direction of ["toRomaji", "toKana"] as const) {
      for (const card of buildKanaCards(settings(direction))) {
        expect(card.check(card.answer), `${direction} · ${card.id}`).toBe(true);
      }
    }
  });
});
