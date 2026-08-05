/**
 * Shared contracts for the whole app.
 *
 * Big idea: every learning item (kana today; kanji, vocabulary, sentences
 * tomorrow) is normalized into a `Card` before reaching the drill runner.
 * Content authors add a "deck" module (see data/kana.ts for the shape); the
 * runner, scheduler, stats and setup UI already work for any deck.
 */

/** Stable identifier for a deck of learning items. */
export type DeckId =
  | "hiragana"
  // Future decks plug in here (each gets its own data/ module):
  // | "kanji"
  // | "vocabulary"
  // | "sentences"
  | (string & {});

export type Script = "hiragana" | "katakana";

/** How the user answers. Decides which input widget the runner renders. */
export type InputKind = "type" | "picker" | "draw";

/** Direction of a drill: read (kana → romaji) or write (romaji → kana). */
export type KanaDirection = "toRomaji" | "toKana";

/** One question, ready to render. `check` decides acceptance instantly —
 *  there is never an explicit confirmation step, per product decision. */
export interface Card {
  /** Stable id, also used as the stats key (deck-scoped). */
  id: string;
  /** Primary thing shown to the user ("prompt"). */
  prompt: string;
  /** The answer, shown for feedback / rendered for pickers & draw. */
  answer: string;
  /** Small secondary line under the prompt (e.g. script label, reading). */
  sub?: string;
  /** Free-form notes shown beneath the prompt (future: kanji meaning…). */
  notes?: string;
  /** Accepts raw user input; must be pure & side-effect free. */
  check: (input: string) => boolean;
  /**
   * The accepted typed forms (already normalised). Enables prefix-aware
   * matching so typing "k…" toward "ka" isn't marked wrong mid-word.
   */
  readings?: string[];
  /** Which deck this card came from (drives stats scope). */
  deck?: DeckId;
  /** Which subgroup (row / JLPT level / topic). */
  group?: string;
}

/** A selectable subgroup shown in the config UI. */
export interface DrillGroup {
  id: string;
  label: string;
  header: string;
}

/** Fully-resolved description of a practice session. */
export interface DrillConfig {
  deck: DeckId;
  label: string;
  input: InputKind;
  direction: KanaDirection;
  /** Number of questions; 0 = whole selected set. */
  count: number;
}
