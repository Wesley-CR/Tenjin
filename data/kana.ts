import type { Card, DrillGroup, KanaDirection, Script } from "@/lib/types";

export type KanaKind =
  | "basic"
  | "dakuon"
  | "handakuon"
  | "youon"
  | "special";

export type groupId =
  | "a" | "ka" | "sa" | "ta" | "na" | "ha" | "ma" | "ya" | "ra" | "wa" | "n"
  | "ga" | "za" | "da" | "ba" | "pa"
  | "kya" | "sya" | "tya" | "nya" | "hya" | "mya" | "rya"
  | "gya" | "zya" | "dya" | "bya" | "pya"
  | "sokuon";

export interface KanaEntry {
  id: string;
  char: string;
  script: Script;
  /** Canonical Hepburn reading shown in the UI. */
  romaji: string;
  /** Additional accepted readings (Kunrei, alternative romanizations). */
  variants: string[];
  /** Gojuon-style row id the kana belongs to (a group in the config UI). */
  row: groupId;
  kind: KanaKind;
}

interface RowDef {
  id: groupId;
  label: string;
  read: string;
  kind: KanaKind;
  order: number;
  /** reading-key → [canonical reading, …accepted variants]. */
  record: Record<string, string[]>;
}

const KATA: Record<string, string> = {
  あ: "ア", い: "イ", う: "ウ", え: "エ", お: "オ",
  か: "カ", き: "キ", く: "ク", け: "ケ", こ: "コ",
  さ: "サ", し: "シ", す: "ス", せ: "セ", そ: "ソ",
  た: "タ", ち: "チ", つ: "ツ", て: "テ", と: "ト",
  な: "ナ", に: "ニ", ぬ: "ヌ", ね: "ネ", の: "ノ",
  は: "ハ", ひ: "ヒ", ふ: "フ", へ: "ヘ", ほ: "ホ",
  ま: "マ", み: "ミ", む: "ム", め: "メ", も: "モ",
  や: "ヤ", ゆ: "ユ", よ: "ヨ",
  ら: "ラ", り: "リ", る: "ル", れ: "レ", ろ: "ロ",
  わ: "ワ", を: "ヲ", ん: "ン",
  が: "ガ", ぎ: "ギ", ぐ: "グ", げ: "ゲ", ご: "ゴ",
  ざ: "ザ", じ: "ジ", ず: "ズ", ぜ: "ゼ", ぞ: "ゾ",
  だ: "ダ", ぢ: "ヂ", づ: "ヅ", で: "デ", ど: "ド",
  ば: "バ", び: "ビ", ぶ: "ブ", べ: "ベ", ぼ: "ボ",
  ぱ: "パ", ぴ: "ピ", ぷ: "プ", ぺ: "ペ", ぽ: "ポ",
  きゃ: "キャ", きゅ: "キュ", きょ: "キョ",
  しゃ: "シャ", しゅ: "シュ", しょ: "ショ",
  ちゃ: "チャ", ちゅ: "チュ", ちょ: "チョ",
  にゃ: "ニャ", にゅ: "ニュ", にょ: "ニョ",
  ひゃ: "ヒャ", ひゅ: "ヒュ", ひょ: "ヒョ",
  みゃ: "ミャ", みゅ: "ミュ", みょ: "ミョ",
  りゃ: "リャ", りゅ: "リュ", りょ: "リョ",
  ぎゃ: "ギャ", ぎゅ: "ギュ", ぎょ: "ギョ",
  じゃ: "ジャ", じゅ: "ジュ", じょ: "ジョ",
  ぢゃ: "ヂャ", ぢゅ: "ヂュ", ぢょ: "ヂョ",
  びゃ: "ビャ", びゅ: "ビュ", びょ: "ビョ",
  ぴゃ: "ピャ", ぴゅ: "ピュ", ぴょ: "ピョ",
};

/** reading-key → glyph (master for both scripts so they can't drift). */
const CHAR: Record<string, string> = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", shi: "し", su: "す", se: "せ", so: "そ",
  ta: "た", chi: "ち", tsu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", fu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を", n: "ん",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", dji: "ぢ", dzu: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ",
  dja: "ぢゃ", dju: "ぢゅ", djo: "ぢょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  sokuon: "っ",
};

/** Reading labels that differ from their key (display purpose only).
 *  Every label must be an accepted reading of that character. */
const LABEL: Record<string, string> = {
  sokuon: "っ",
  dji: "ji",
  dzu: "zu",
  dja: "ja",
  dju: "ju",
  djo: "jo",
};

const toKatakana = (hira: string) => KATA[hira] ?? hira;

function row(
  id: groupId,
  label: string,
  read: string,
  kind: KanaKind,
  order: number,
  record: Record<string, string[]>
): RowDef {
  return { id, label, read, kind, order, record };
}

/** Full syllabus, ordered for the config UI and charts. */
const ROWS: Record<groupId, RowDef> = {
  a: row("a", "あ行", "A", "basic", 0, {
    a: ["a"], i: ["i"], u: ["u"], e: ["e"], o: ["o"],
  }),
  ka: row("ka", "か行", "KA", "basic", 1, {
    ka: ["ka"], ki: ["ki"], ku: ["ku"], ke: ["ke"], ko: ["ko"],
  }),
  sa: row("sa", "さ行", "SA", "basic", 2, {
    sa: ["sa"], shi: ["shi", "si"], su: ["su"], se: ["se"], so: ["so"],
  }),
  ta: row("ta", "た行", "TA", "basic", 3, {
    ta: ["ta"], chi: ["chi", "ti"], tsu: ["tsu", "tu"], te: ["te"], to: ["to"],
  }),
  na: row("na", "な行", "NA", "basic", 4, {
    na: ["na"], ni: ["ni"], nu: ["nu"], ne: ["ne"], no: ["no"],
  }),
  ha: row("ha", "は行", "HA", "basic", 5, {
    ha: ["ha"], hi: ["hi"], fu: ["fu", "hu"], he: ["he"], ho: ["ho"],
  }),
  ma: row("ma", "ま行", "MA", "basic", 6, {
    ma: ["ma"], mi: ["mi"], mu: ["mu"], me: ["me"], mo: ["mo"],
  }),
  ya: row("ya", "や行", "YA", "basic", 7, {
    ya: ["ya"], yu: ["yu"], yo: ["yo"],
  }),
  ra: row("ra", "ら行", "RA", "basic", 8, {
    ra: ["ra", "la"], ri: ["ri", "li"], ru: ["ru", "lu"], re: ["re", "le"], ro: ["ro", "lo"],
  }),
  wa: row("wa", "わ行", "WA", "basic", 9, {
    wa: ["wa"], wo: ["wo", "o"],
  }),
  // 「ん」 accepts n, nn and n' (single-letter matches are safe: the current
  // card is fixed, so a bare "n" can only ever answer ん, never な etc).
  n: row("n", "ん", "N", "special", 10, { n: ["n", "nn", "n'", "n’"] }),

  ga: row("ga", "が行", "GA", "dakuon", 11, {
    ga: ["ga"], gi: ["gi"], gu: ["gu"], ge: ["ge"], go: ["go"],
  }),
  za: row("za", "ざ行", "ZA", "dakuon", 12, {
    za: ["za"], ji: ["ji", "zi"], zu: ["zu"], ze: ["ze"], zo: ["zo"],
  }),
  da: row("da", "だ行", "DA", "dakuon", 13, {
    da: ["da"], dji: ["ji", "di", "dji"], dzu: ["zu", "du", "dzu"], de: ["de"], do: ["do"],
  }),
  ba: row("ba", "ば行", "BA", "dakuon", 14, {
    ba: ["ba"], bi: ["bi"], bu: ["bu"], be: ["be"], bo: ["bo"],
  }),
  pa: row("pa", "ぱ行", "PA", "handakuon", 15, {
    pa: ["pa"], pi: ["pi"], pu: ["pu"], pe: ["pe"], po: ["po"],
  }),

  kya: row("kya", "きゃ行", "KYA", "youon", 16, {
    kya: ["kya"], kyu: ["kyu"], kyo: ["kyo"],
  }),
  sya: row("sya", "しゃ行", "SYA", "youon", 17, {
    sha: ["sha", "sya"], shu: ["shu", "syu"], sho: ["sho", "syo"],
  }),
  tya: row("tya", "ちゃ行", "TYA", "youon", 18, {
    cha: ["cha", "tya", "cya"], chu: ["chu", "tyu", "cyu"], cho: ["cho", "tyo", "cyo"],
  }),
  nya: row("nya", "にゃ行", "NYA", "youon", 19, {
    nya: ["nya"], nyu: ["nyu"], nyo: ["nyo"],
  }),
  hya: row("hya", "ひゃ行", "HYA", "youon", 20, {
    hya: ["hya"], hyu: ["hyu"], hyo: ["hyo"],
  }),
  mya: row("mya", "みゃ行", "MYA", "youon", 21, {
    mya: ["mya"], myu: ["myu"], myo: ["myo"],
  }),
  rya: row("rya", "りゃ行", "RYA", "youon", 22, {
    rya: ["rya"], ryu: ["ryu"], ryo: ["ryo"],
  }),
  gya: row("gya", "ぎゃ行", "GYA", "youon", 23, {
    gya: ["gya"], gyu: ["gyu"], gyo: ["gyo"],
  }),
  zya: row("zya", "じゃ行", "JYA", "youon", 24, {
    ja: ["ja", "jya", "zya"], ju: ["ju", "jyu", "zyu"], jo: ["jo", "jyo", "zyo"],
  }),
  dya: row("dya", "ぢゃ行", "DYA", "youon", 25, {
    dja: ["ja", "dya", "jya"], dju: ["ju", "dyu", "jyu"], djo: ["jo", "dyo", "jyo"],
  }),
  bya: row("bya", "びゃ行", "BYA", "youon", 26, {
    bya: ["bya"], byu: ["byu"], byo: ["byo"],
  }),
  pya: row("pya", "ぴゃ行", "PYA", "youon", 27, {
    pya: ["pya"], pyu: ["pyu"], pyo: ["pyo"],
  }),

  sokuon: row("sokuon", "っ 促音", "っ", "special", 28, {
    sokuon: ["っ", "ッ", "xtsu", "ltsu", "xtu", "ltu"],
  }),
};

/** Flat, ordered list of all kana entries — source of truth for charts & drills. */
export const KANA_ENTRIES: KanaEntry[] = (() => {
  const out: KanaEntry[] = [];
  for (const r of Object.values(ROWS)) {
    for (const [reading, accepted] of Object.entries(r.record)) {
      const hira = CHAR[reading];
      const romaji = LABEL[reading] ?? reading;
      out.push({
        id: `hiragana-${reading}`,
        char: hira,
        script: "hiragana",
        romaji,
        variants: accepted,
        row: r.id,
        kind: r.kind,
      });
      out.push({
        id: `katakana-${reading}`,
        char: toKatakana(hira),
        script: "katakana",
        romaji,
        variants: accepted,
        row: r.id,
        kind: r.kind,
      });
    }
  }
  return out;
})();

export const HIRAGANA_ENTRIES = KANA_ENTRIES.filter(
  (e) => e.script === "hiragana"
);
export const KATAKANA_ENTRIES = KANA_ENTRIES.filter(
  (e) => e.script === "katakana"
);

export function isKanaChar(c: string): boolean {
  return KANA_ENTRIES.some((e) => e.char === c);
}

/** Ordered list of rows, grouped by kind for the config UI. */
export const GROUP_LIST = Object.values(ROWS).sort((a, b) => a.order - b.order);

/* ------------------------------------------------------------------ */
/* Kana deck — mirrors the shape a future kanji/vocab deck will take.   */
/* ------------------------------------------------------------------ */

export interface KanaSettings {
  scripts: Set<Script>;
  groups: Set<string>;
  direction: KanaDirection;
}

const KIND_HEADERS: Record<KanaKind, string> = {
  basic: "Basic",
  dakuon: "Voiced",
  handakuon: "Semi-voiced",
  youon: "Contracted (y-row)",
  special: "Special",
};

/** Groups available for practice, ordered by syllabus. */
export const KANA_GROUPS: DrillGroup[] = GROUP_LIST.map((r) => ({
  id: r.id,
  label: r.label,
  header: KIND_HEADERS[r.kind],
}));

function normalizeInput(input: string): string {
  return input.toLowerCase().replace(/[\s]/g, "").trim();
}

/**
 * Builds direction-ready cards for the selected scripts and rows.
 * This is the one function a future deck module must provide.
 */
export function buildKanaCards(settings: KanaSettings): Card[] {
  const out: Card[] = [];
  for (const entry of KANA_ENTRIES) {
    if (!settings.scripts.has(entry.script)) continue;
    if (!settings.groups.has(entry.row)) continue;

    if (settings.direction === "toRomaji") {
      out.push({
        id: entry.id,
        prompt: entry.char,
        answer: entry.romaji,
        sub: entry.script,
        deck: "hiragana",
        group: entry.row,
        check: (input) => entry.variants.includes(normalizeInput(input)),
      });
    } else {
      // Prompt = reading, answer = kana. Both the character itself and any
      // valid reading count, so typing and picking are equally forgiving.
      out.push({
        id: entry.id,
        prompt: entry.romaji,
        answer: entry.char,
        sub: entry.script,
        deck: "hiragana",
        group: entry.row,
        check: (input) => {
          const norm = normalizeInput(input);
          return norm === entry.char || entry.variants.includes(norm);
        },
      });
    }
  }
  return out;
}
