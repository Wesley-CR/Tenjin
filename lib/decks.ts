import type { Card, DrillGroup, InputKind } from "@/lib/types";
import { buildKanaCards, KANA_GROUPS, type KanaSettings } from "@/data/kana";
import { buildVocabCards, VOCAB_GROUPS, type VocabSettings } from "@/data/vocabulary";

/**
 * Registry of practice sections. Kana is the first one; kanji, vocabulary,
 * sentences… each become a new entry here with their own data module.
 *
 * To add a section:
 *   1. create data/<deck>.ts exposing groups + a buildCards(settings) fn
 *   2. add its settings type to `DeckSettings`
 *   3. append a DeckDef here
 * The runner, scheduler, stats and highscores already work for any deck.
 */
export type DeckId = "kana" | "vocabulary" | (string & {});

export type DeckSettings = KanaSettings | VocabSettings;

export interface DeckDef {
  id: DeckId;
  label: string;
  tagline: string;
  groups: DrillGroup[];
  /** Which answer methods this section makes sense for. */
  inputs: ReadonlyArray<InputKind>;
  buildCards(settings: DeckSettings): Card[];
}

const DECKS: DeckDef[] = [
  {
    id: "kana",
    label: "Kana",
    tagline: "hiragana & katakana — 216 characters",
    groups: KANA_GROUPS,
    inputs: ["type", "picker", "draw"],
    buildCards: buildKanaCards,
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    tagline: "common words & phrases — 80+ entries",
    groups: VOCAB_GROUPS,
    inputs: ["type"],
    buildCards: buildVocabCards,
  },
  // future:
  // { id: "kanji", label: "Kanji", tagline: "JLPT-level characters", groups: KANJI_GROUPS, inputs: ["type", "picker"], buildCards: buildKanjiCards },
];

/** Light descriptions for the section picker on the home page. */
export const SECTIONS = DECKS.map((d) => ({
  id: d.id,
  label: d.label,
  tagline: d.tagline,
}));

export function getDeck(id: string): DeckDef | undefined {
  return DECKS.find((d) => d.id === id);
}

export function getDeckOrFallback(id: string): DeckDef {
  return getDeck(id) ?? DECKS[0];
}

export function defaultSectionId(): string {
  return DECKS[0].id;
}
