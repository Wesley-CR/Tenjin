import type { Card, DrillGroup } from "@/lib/types";
import { normalizeInput } from "@/lib/matching";

export type VocabKind = "basic" | "intermediate" | "advanced";

export type VocabGroupId =
  | "greetings" | "numbers" | "time" | "family" | "food" | "directions"
  | "verbs" | "adjectives" | "particles" | "questions";

export interface VocabEntry {
  id: string;
  kana: string;
  kanji?: string;
  romaji: string;
  meaning: string;
  group: VocabGroupId;
  kind: VocabKind;
}

const VOCAB_ENTRIES: VocabEntry[] = [
  { id: "vocab-1", kana: "こんにちは", kanji: "今日は", romaji: "konnichiwa", meaning: "Hello / Good afternoon", group: "greetings", kind: "basic" },
  { id: "vocab-2", kana: "おはよう", kanji: "お早う", romaji: "ohayou", meaning: "Good morning", group: "greetings", kind: "basic" },
  { id: "vocab-3", kana: "こんばんは", kanji: "今晩は", romaji: "konbanwa", meaning: "Good evening", group: "greetings", kind: "basic" },
  { id: "vocab-4", kana: "さようなら", kanji: "左様なら", romaji: "sayounara", meaning: "Goodbye", group: "greetings", kind: "basic" },
  { id: "vocab-5", kana: "ありがとう", kanji: "有難う", romaji: "arigatou", meaning: "Thank you", group: "greetings", kind: "basic" },
  { id: "vocab-6", kana: "すみません", kanji: "済みません", romaji: "sumimasen", meaning: "Excuse me / Sorry", group: "greetings", kind: "basic" },
  { id: "vocab-7", kana: "はい", romaji: "hai", meaning: "Yes", group: "greetings", kind: "basic" },
  { id: "vocab-8", kana: "いいえ", romaji: "iie", meaning: "No", group: "greetings", kind: "basic" },

  { id: "vocab-9", kana: "いち", kanji: "一", romaji: "ichi", meaning: "One", group: "numbers", kind: "basic" },
  { id: "vocab-10", kana: "に", kanji: "二", romaji: "ni", meaning: "Two", group: "numbers", kind: "basic" },
  { id: "vocab-11", kana: "さん", kanji: "三", romaji: "san", meaning: "Three", group: "numbers", kind: "basic" },
  { id: "vocab-12", kana: "よん", kanji: "四", romaji: "yon", meaning: "Four", group: "numbers", kind: "basic" },
  { id: "vocab-13", kana: "ご", kanji: "五", romaji: "go", meaning: "Five", group: "numbers", kind: "basic" },
  { id: "vocab-14", kana: "ろく", kanji: "六", romaji: "roku", meaning: "Six", group: "numbers", kind: "basic" },
  { id: "vocab-15", kana: "なな", kanji: "七", romaji: "nana", meaning: "Seven", group: "numbers", kind: "basic" },
  { id: "vocab-16", kana: "はち", kanji: "八", romaji: "hachi", meaning: "Eight", group: "numbers", kind: "basic" },
  { id: "vocab-17", kana: "きゅう", kanji: "九", romaji: "kyuu", meaning: "Nine", group: "numbers", kind: "basic" },
  { id: "vocab-18", kana: "じゅう", kanji: "十", romaji: "juu", meaning: "Ten", group: "numbers", kind: "basic" },

  { id: "vocab-19", kana: "いま", kanji: "今", romaji: "ima", meaning: "Now", group: "time", kind: "basic" },
  { id: "vocab-20", kana: "あさ", kanji: "朝", romaji: "asa", meaning: "Morning", group: "time", kind: "basic" },
  { id: "vocab-21", kana: "ひる", kanji: "昼", romaji: "hiru", meaning: "Noon / Daytime", group: "time", kind: "basic" },
  { id: "vocab-22", kana: "よる", kanji: "夜", romaji: "yoru", meaning: "Night", group: "time", kind: "basic" },
  { id: "vocab-23", kana: "きょう", kanji: "今日", romaji: "kyou", meaning: "Today", group: "time", kind: "basic" },
  { id: "vocab-24", kana: "あした", kanji: "明日", romaji: "ashita", meaning: "Tomorrow", group: "time", kind: "basic" },
  { id: "vocab-25", kana: "きのう", kanji: "昨日", romaji: "kinou", meaning: "Yesterday", group: "time", kind: "basic" },
  { id: "vocab-26", kana: "らいしゅう", kanji: "来週", romaji: "raishuu", meaning: "Next week", group: "time", kind: "basic" },

  { id: "vocab-27", kana: "おかあさん", kanji: "お母さん", romaji: "okaasan", meaning: "Mother", group: "family", kind: "basic" },
  { id: "vocab-28", kana: "おとうさん", kanji: "お父さん", romaji: "otousan", meaning: "Father", group: "family", kind: "basic" },
  { id: "vocab-29", kana: "おにいさん", kanji: "お兄さん", romaji: "oniisan", meaning: "Older brother", group: "family", kind: "basic" },
  { id: "vocab-30", kana: "おねえさん", kanji: "お姉さん", romaji: "oneesan", meaning: "Older sister", group: "family", kind: "basic" },
  { id: "vocab-31", kana: "おとうと", kanji: "弟", romaji: "otouto", meaning: "Younger brother", group: "family", kind: "basic" },
  { id: "vocab-32", kana: "いもうと", kanji: "妹", romaji: "imouto", meaning: "Younger sister", group: "family", kind: "basic" },

  { id: "vocab-33", kana: "みず", kanji: "水", romaji: "mizu", meaning: "Water", group: "food", kind: "basic" },
  { id: "vocab-34", kana: "ごはん", kanji: "御飯", romaji: "gohan", meaning: "Rice / Meal", group: "food", kind: "basic" },
  { id: "vocab-35", kana: "パン", romaji: "pan", meaning: "Bread", group: "food", kind: "basic" },
  { id: "vocab-36", kana: "にく", kanji: "肉", romaji: "niku", meaning: "Meat", group: "food", kind: "basic" },
  { id: "vocab-37", kana: "さかな", kanji: "魚", romaji: "sakana", meaning: "Fish", group: "food", kind: "basic" },
  { id: "vocab-38", kana: "やさい", kanji: "野菜", romaji: "yasai", meaning: "Vegetables", group: "food", kind: "basic" },
  { id: "vocab-39", kana: "くだもの", kanji: "果物", romaji: "kudamono", meaning: "Fruit", group: "food", kind: "basic" },

  { id: "vocab-40", kana: "ひだり", kanji: "左", romaji: "hidari", meaning: "Left", group: "directions", kind: "basic" },
  { id: "vocab-41", kana: "みぎ", kanji: "右", romaji: "migi", meaning: "Right", group: "directions", kind: "basic" },
  { id: "vocab-42", kana: "まえ", kanji: "前", romaji: "mae", meaning: "Front", group: "directions", kind: "basic" },
  { id: "vocab-43", kana: "うしろ", kanji: "後ろ", romaji: "ushiro", meaning: "Back / Behind", group: "directions", kind: "basic" },
  { id: "vocab-44", kana: "うえ", kanji: "上", romaji: "ue", meaning: "Up / Above", group: "directions", kind: "basic" },
  { id: "vocab-45", kana: "した", kanji: "下", romaji: "shita", meaning: "Down / Below", group: "directions", kind: "basic" },
  { id: "vocab-46", kana: "なか", kanji: "中", romaji: "naka", meaning: "Inside / Middle", group: "directions", kind: "basic" },
  { id: "vocab-47", kana: "そと", kanji: "外", romaji: "soto", meaning: "Outside", group: "directions", kind: "basic" },

  { id: "vocab-48", kana: "たべる", kanji: "食べる", romaji: "taberu", meaning: "To eat", group: "verbs", kind: "basic" },
  { id: "vocab-49", kana: "のむ", kanji: "飲む", romaji: "nomu", meaning: "To drink", group: "verbs", kind: "basic" },
  { id: "vocab-50", kana: "いく", kanji: "行く", romaji: "iku", meaning: "To go", group: "verbs", kind: "basic" },
  { id: "vocab-51", kana: "くる", kanji: "来る", romaji: "kuru", meaning: "To come", group: "verbs", kind: "basic" },
  { id: "vocab-52", kana: "する", kanji: "為る", romaji: "suru", meaning: "To do", group: "verbs", kind: "basic" },
  { id: "vocab-53", kana: "みる", kanji: "見る", romaji: "miru", meaning: "To see / watch", group: "verbs", kind: "basic" },
  { id: "vocab-54", kana: "きく", kanji: "聞く", romaji: "kiku", meaning: "To listen / ask", group: "verbs", kind: "basic" },
  { id: "vocab-55", kana: "はなす", kanji: "話す", romaji: "hanasu", meaning: "To speak", group: "verbs", kind: "basic" },
  { id: "vocab-56", kana: "よむ", kanji: "読む", romaji: "yomu", meaning: "To read", group: "verbs", kind: "basic" },
  { id: "vocab-57", kana: "かく", kanji: "書く", romaji: "kaku", meaning: "To write", group: "verbs", kind: "basic" },

  { id: "vocab-58", kana: "おおきい", kanji: "大きい", romaji: "ookii", meaning: "Big", group: "adjectives", kind: "basic" },
  { id: "vocab-59", kana: "ちいさい", kanji: "小さい", romaji: "chiisai", meaning: "Small", group: "adjectives", kind: "basic" },
  { id: "vocab-60", kana: "いい", kanji: "良い", romaji: "ii", meaning: "Good", group: "adjectives", kind: "basic" },
  { id: "vocab-61", kana: "わるい", kanji: "悪い", romaji: "warui", meaning: "Bad", group: "adjectives", kind: "basic" },
  { id: "vocab-62", kana: "たかい", kanji: "高い", romaji: "takai", meaning: "Tall / Expensive", group: "adjectives", kind: "basic" },
  { id: "vocab-63", kana: "やすい", kanji: "安い", romaji: "yasui", meaning: "Short / Cheap", group: "adjectives", kind: "basic" },
  { id: "vocab-64", kana: "あつい", kanji: "熱い", romaji: "atsui", meaning: "Hot", group: "adjectives", kind: "basic" },
  { id: "vocab-65", kana: "さむい", kanji: "寒い", romaji: "samui", meaning: "Cold", group: "adjectives", kind: "basic" },
  { id: "vocab-66", kana: "あたらしい", kanji: "新しい", romaji: "atarashii", meaning: "New", group: "adjectives", kind: "basic" },
  { id: "vocab-67", kana: "ふるい", kanji: "古い", romaji: "furui", meaning: "Old", group: "adjectives", kind: "basic" },

  { id: "vocab-68", kana: "は", romaji: "wa", meaning: "Topic marker", group: "particles", kind: "basic" },
  { id: "vocab-69", kana: "が", romaji: "ga", meaning: "Subject marker", group: "particles", kind: "basic" },
  { id: "vocab-70", kana: "を", romaji: "wo", meaning: "Object marker", group: "particles", kind: "basic" },
  { id: "vocab-71", kana: "に", romaji: "ni", meaning: "Target / Location / Time", group: "particles", kind: "basic" },
  { id: "vocab-72", kana: "で", romaji: "de", meaning: "Location of action / Means", group: "particles", kind: "basic" },
  { id: "vocab-73", kana: "と", romaji: "to", meaning: "And / With", group: "particles", kind: "basic" },
  { id: "vocab-74", kana: "も", romaji: "mo", meaning: "Also / Too", group: "particles", kind: "basic" },
  { id: "vocab-75", kana: "の", romaji: "no", meaning: "Possession / Attribution", group: "particles", kind: "basic" },

  { id: "vocab-76", kana: "なんですか", kanji: "何ですか", romaji: "nan desu ka", meaning: "What is it?", group: "questions", kind: "basic" },
  { id: "vocab-77", kana: "どこですか", kanji: "どこですか", romaji: "doko desu ka", meaning: "Where is it?", group: "questions", kind: "basic" },
  { id: "vocab-78", kana: "いつですか", kanji: "いつですか", romaji: "itsu desu ka", meaning: "When is it?", group: "questions", kind: "basic" },
  { id: "vocab-79", kana: "だれですか", kanji: "誰ですか", romaji: "dare desu ka", meaning: "Who is it?", group: "questions", kind: "basic" },
  { id: "vocab-80", kana: "なぜですか", kanji: "なぜですか", romaji: "naze desu ka", meaning: "Why?", group: "questions", kind: "basic" },
  { id: "vocab-81", kana: "いくらですか", kanji: "いくらですか", romaji: "ikura desu ka", meaning: "How much?", group: "questions", kind: "basic" },
];

interface RowDef {
  id: VocabGroupId;
  label: string;
  read: string;
  kind: VocabKind;
  order: number;
  record: Record<string, { kana: string; kanji?: string; romaji: string; meaning: string }>;
}

function row(
  id: VocabGroupId,
  label: string,
  read: string,
  kind: VocabKind,
  order: number,
  record: RowDef["record"]
): RowDef {
  return { id, label, read, kind, order, record };
}

const ROWS: Record<VocabGroupId, RowDef> = {
  greetings: row("greetings", "挨拶", "GREETINGS", "basic", 0, {
    vocab1: { kana: "こんにちは", kanji: "今日は", romaji: "konnichiwa", meaning: "Hello / Good afternoon" },
    vocab2: { kana: "おはよう", kanji: "お早う", romaji: "ohayou", meaning: "Good morning" },
    vocab3: { kana: "こんばんは", kanji: "今晩は", romaji: "konbanwa", meaning: "Good evening" },
    vocab4: { kana: "さようなら", kanji: "左様なら", romaji: "sayounara", meaning: "Goodbye" },
    vocab5: { kana: "ありがとう", kanji: "有難う", romaji: "arigatou", meaning: "Thank you" },
    vocab6: { kana: "すみません", kanji: "済みません", romaji: "sumimasen", meaning: "Excuse me / Sorry" },
    vocab7: { kana: "はい", romaji: "hai", meaning: "Yes" },
    vocab8: { kana: "いいえ", romaji: "iie", meaning: "No" },
  }),
  numbers: row("numbers", "数", "NUMBERS", "basic", 1, {
    vocab9: { kana: "いち", kanji: "一", romaji: "ichi", meaning: "One" },
    vocab10: { kana: "に", kanji: "二", romaji: "ni", meaning: "Two" },
    vocab11: { kana: "さん", kanji: "三", romaji: "san", meaning: "Three" },
    vocab12: { kana: "よん", kanji: "四", romaji: "yon", meaning: "Four" },
    vocab13: { kana: "ご", kanji: "五", romaji: "go", meaning: "Five" },
    vocab14: { kana: "ろく", kanji: "六", romaji: "roku", meaning: "Six" },
    vocab15: { kana: "なな", kanji: "七", romaji: "nana", meaning: "Seven" },
    vocab16: { kana: "はち", kanji: "八", romaji: "hachi", meaning: "Eight" },
    vocab17: { kana: "きゅう", kanji: "九", romaji: "kyuu", meaning: "Nine" },
    vocab18: { kana: "じゅう", kanji: "十", romaji: "juu", meaning: "Ten" },
  }),
  time: row("time", "時間", "TIME", "basic", 2, {
    vocab19: { kana: "いま", kanji: "今", romaji: "ima", meaning: "Now" },
    vocab20: { kana: "あさ", kanji: "朝", romaji: "asa", meaning: "Morning" },
    vocab21: { kana: "ひる", kanji: "昼", romaji: "hiru", meaning: "Noon / Daytime" },
    vocab22: { kana: "よる", kanji: "夜", romaji: "yoru", meaning: "Night" },
    vocab23: { kana: "きょう", kanji: "今日", romaji: "kyou", meaning: "Today" },
    vocab24: { kana: "あした", kanji: "明日", romaji: "ashita", meaning: "Tomorrow" },
    vocab25: { kana: "きのう", kanji: "昨日", romaji: "kinou", meaning: "Yesterday" },
    vocab26: { kana: "らいしゅう", kanji: "来週", romaji: "raishuu", meaning: "Next week" },
  }),
  family: row("family", "家族", "FAMILY", "basic", 3, {
    vocab27: { kana: "おかあさん", kanji: "お母さん", romaji: "okaasan", meaning: "Mother" },
    vocab28: { kana: "おとうさん", kanji: "お父さん", romaji: "otousan", meaning: "Father" },
    vocab29: { kana: "おにいさん", kanji: "お兄さん", romaji: "oniisan", meaning: "Older brother" },
    vocab30: { kana: "おねえさん", kanji: "お姉さん", romaji: "oneesan", meaning: "Older sister" },
    vocab31: { kana: "おとうと", kanji: "弟", romaji: "otouto", meaning: "Younger brother" },
    vocab32: { kana: "いもうと", kanji: "妹", romaji: "imouto", meaning: "Younger sister" },
  }),
  food: row("food", "食べ物", "FOOD", "basic", 4, {
    vocab33: { kana: "みず", kanji: "水", romaji: "mizu", meaning: "Water" },
    vocab34: { kana: "ごはん", kanji: "御飯", romaji: "gohan", meaning: "Rice / Meal" },
    vocab35: { kana: "パン", romaji: "pan", meaning: "Bread" },
    vocab36: { kana: "にく", kanji: "肉", romaji: "niku", meaning: "Meat" },
    vocab37: { kana: "さかな", kanji: "魚", romaji: "sakana", meaning: "Fish" },
    vocab38: { kana: "やさい", kanji: "野菜", romaji: "yasai", meaning: "Vegetables" },
    vocab39: { kana: "くだもの", kanji: "果物", romaji: "kudamono", meaning: "Fruit" },
  }),
  directions: row("directions", "方向", "DIRECTIONS", "basic", 5, {
    vocab40: { kana: "ひだり", kanji: "左", romaji: "hidari", meaning: "Left" },
    vocab41: { kana: "みぎ", kanji: "右", romaji: "migi", meaning: "Right" },
    vocab42: { kana: "まえ", kanji: "前", romaji: "mae", meaning: "Front" },
    vocab43: { kana: "うしろ", kanji: "後ろ", romaji: "ushiro", meaning: "Back / Behind" },
    vocab44: { kana: "うえ", kanji: "上", romaji: "ue", meaning: "Up / Above" },
    vocab45: { kana: "した", kanji: "下", romaji: "shita", meaning: "Down / Below" },
    vocab46: { kana: "なか", kanji: "中", romaji: "naka", meaning: "Inside / Middle" },
    vocab47: { kana: "そと", kanji: "外", romaji: "soto", meaning: "Outside" },
  }),
  verbs: row("verbs", "動詞", "VERBS", "basic", 6, {
    vocab48: { kana: "たべる", kanji: "食べる", romaji: "taberu", meaning: "To eat" },
    vocab49: { kana: "のむ", kanji: "飲む", romaji: "nomu", meaning: "To drink" },
    vocab50: { kana: "いく", kanji: "行く", romaji: "iku", meaning: "To go" },
    vocab51: { kana: "くる", kanji: "来る", romaji: "kuru", meaning: "To come" },
    vocab52: { kana: "する", kanji: "為る", romaji: "suru", meaning: "To do" },
    vocab53: { kana: "みる", kanji: "見る", romaji: "miru", meaning: "To see / watch" },
    vocab54: { kana: "きく", kanji: "聞く", romaji: "kiku", meaning: "To listen / ask" },
    vocab55: { kana: "はなす", kanji: "話す", romaji: "hanasu", meaning: "To speak" },
    vocab56: { kana: "よむ", kanji: "読む", romaji: "yomu", meaning: "To read" },
    vocab57: { kana: "かく", kanji: "書く", romaji: "kaku", meaning: "To write" },
  }),
  adjectives: row("adjectives", "形容詞", "ADJECTIVES", "basic", 7, {
    vocab58: { kana: "おおきい", kanji: "大きい", romaji: "ookii", meaning: "Big" },
    vocab59: { kana: "ちいさい", kanji: "小さい", romaji: "chiisai", meaning: "Small" },
    vocab60: { kana: "いい", kanji: "良い", romaji: "ii", meaning: "Good" },
    vocab61: { kana: "わるい", kanji: "悪い", romaji: "warui", meaning: "Bad" },
    vocab62: { kana: "たかい", kanji: "高い", romaji: "takai", meaning: "Tall / Expensive" },
    vocab63: { kana: "やすい", kanji: "安い", romaji: "yasui", meaning: "Short / Cheap" },
    vocab64: { kana: "あつい", kanji: "熱い", romaji: "atsui", meaning: "Hot" },
    vocab65: { kana: "さむい", kanji: "寒い", romaji: "samui", meaning: "Cold" },
    vocab66: { kana: "あたらしい", kanji: "新しい", romaji: "atarashii", meaning: "New" },
    vocab67: { kana: "ふるい", kanji: "古い", romaji: "furui", meaning: "Old" },
  }),
  particles: row("particles", "助詞", "PARTICLES", "basic", 8, {
    vocab68: { kana: "は", romaji: "wa", meaning: "Topic marker" },
    vocab69: { kana: "が", romaji: "ga", meaning: "Subject marker" },
    vocab70: { kana: "を", romaji: "wo", meaning: "Object marker" },
    vocab71: { kana: "に", romaji: "ni", meaning: "Target / Location / Time" },
    vocab72: { kana: "で", romaji: "de", meaning: "Location of action / Means" },
    vocab73: { kana: "と", romaji: "to", meaning: "And / With" },
    vocab74: { kana: "も", romaji: "mo", meaning: "Also / Too" },
    vocab75: { kana: "の", romaji: "no", meaning: "Possession / Attribution" },
  }),
  questions: row("questions", "疑問詞", "QUESTIONS", "basic", 9, {
    vocab76: { kana: "なんですか", kanji: "何ですか", romaji: "nan desu ka", meaning: "What is it?" },
    vocab77: { kana: "どこですか", kanji: "どこですか", romaji: "doko desu ka", meaning: "Where is it?" },
    vocab78: { kana: "いつですか", kanji: "いつですか", romaji: "itsu desu ka", meaning: "When is it?" },
    vocab79: { kana: "だれですか", kanji: "誰ですか", romaji: "dare desu ka", meaning: "Who is it?" },
    vocab80: { kana: "なぜですか", kanji: "なぜですか", romaji: "naze desu ka", meaning: "Why?" },
    vocab81: { kana: "いくらですか", kanji: "いくらですか", romaji: "ikura desu ka", meaning: "How much?" },
  }),
};

export const VOCAB_GROUPS: DrillGroup[] = Object.values(ROWS)
  .sort((a, b) => a.order - b.order)
  .map((r) => ({ id: r.id, label: r.label, header: r.kind }));

export interface VocabSettings {
  groups: Set<string>;
  direction: "toRomaji" | "toKana";
}

export function buildVocabCards(settings: VocabSettings): Card[] {
  const out: Card[] = [];
  for (const entry of VOCAB_ENTRIES) {
    if (!settings.groups.has(entry.group)) continue;

    const prompt = entry.kana;
    const answer = entry.romaji;
    const readings = [entry.romaji].map(normalizeInput);

    if (settings.direction === "toRomaji") {
      out.push({
        id: entry.id,
        prompt,
        answer,
        sub: entry.kanji ? `${entry.kanji} — ${entry.meaning}` : entry.meaning,
        notes: entry.meaning,
        deck: "vocabulary",
        group: entry.group,
        readings,
        check: (input) => readings.includes(normalizeInput(input)),
      });
    } else {
      const revReadings = [prompt, ...readings];
      out.push({
        id: entry.id,
        prompt: answer,
        answer: prompt,
        sub: entry.kanji ? `${entry.kanji} — ${entry.meaning}` : entry.meaning,
        notes: entry.meaning,
        deck: "vocabulary",
        group: entry.group,
        readings: revReadings,
        check: (input) => {
          const norm = normalizeInput(input);
          return norm === prompt || readings.includes(norm);
        },
      });
    }
  }
  return out;
}

export function getVocabEntries(): VocabEntry[] {
  return VOCAB_ENTRIES;
}