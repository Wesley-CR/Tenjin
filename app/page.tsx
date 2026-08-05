"use client";

import { KanaTable } from "@/components/KanaTable";
import { PracticeSetup } from "@/components/PracticeSetup";
import { useMastery } from "@/components/useMastery";
import { useSettings } from "@/components/useSettings";
import { SECTIONS } from "@/lib/decks";
import { updateSettings } from "@/lib/settings";

/** Greyed-out placeholders that light up as sections are added. */
const UPCOMING = [
  { label: "Kanji", tagline: "characters, from first grade to JLPT" },
  { label: "Vocabulary", tagline: "words, readings & meanings" },
];

export default function Home() {
  const settings = useSettings();
  const mastery = useMastery();

  // Remembered section, validated against what exists today.
  const deckId =
    settings && SECTIONS.some((s) => s.id === settings.deck)
      ? settings.deck
      : SECTIONS[0].id;

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">
          Learn Japanese, <em>one character</em> at a time.
        </h1>
        <p className="hero-sub">
          No multiple choice, no guessing games. Read it, type it, pick it, or
          draw it — answer wrong and you try again. Pick a section to start.
        </p>
      </section>

      <section className="sections" aria-label="What to practice">
        <div className="section-cards">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`section-card ${s.id === deckId ? "is-active" : ""}`}
              onClick={() => updateSettings({ deck: s.id })}
              aria-pressed={s.id === deckId}
            >
              <span className="section-card-label">{s.label}</span>
              <span className="section-card-tagline">{s.tagline}</span>
            </button>
          ))}
          {UPCOMING.map((u) => (
            <div key={u.label} className="section-card section-card--soon" aria-disabled="true">
              <span className="section-card-label">{u.label}</span>
              <span className="section-card-tagline">{u.tagline}</span>
              <span className="section-card-soon">coming soon</span>
            </div>
          ))}
        </div>
      </section>

      <PracticeSetup key={deckId} deckId={deckId} />

      {deckId === "kana" && (
        <section className="charts">
          <KanaTable script="hiragana" mastery={mastery} />
          <KanaTable script="katakana" mastery={mastery} />
        </section>
      )}
    </div>
  );
}
