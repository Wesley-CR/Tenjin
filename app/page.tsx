"use client";

import { KanaTable } from "@/components/KanaTable";
import { PracticeSetup } from "@/components/PracticeSetup";
import { useMastery } from "@/components/useMastery";

export default function Home() {
  const mastery = useMastery();

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">
          Learn to read <em>hiragana</em> &amp; <em>katakana</em>.
        </h1>
        <p className="hero-sub">
          No multiple choice, no guessing games. Read the character, write the
          answer — type it, pick it, or draw it. Progress stays on your device.
        </p>
      </section>

      <PracticeSetup />

      <section className="charts">
        <KanaTable script="hiragana" mastery={mastery} />
        <KanaTable script="katakana" mastery={mastery} />
      </section>
    </div>
  );
}
