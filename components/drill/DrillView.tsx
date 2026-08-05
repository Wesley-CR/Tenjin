"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { Card, DrillConfig } from "@/lib/types";
import { DrillSession } from "@/lib/quizzing";
import { classifyInput } from "@/lib/matching";
import { masteryWeights, recordAttempt, recordSession, bestScore, resetAll } from "@/lib/stats";
import { DrawCanvas } from "@/components/drill/DrawCanvas";

export const KANA_FONT = `"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Source Han Serif JP",serif`;

interface Props {
  config: DrillConfig;
  cards: Card[];
  onReplay: () => void;
  onReview: (missed: Card[]) => void;
  onExit: () => void;
}

type Feedback = "none" | "ok" | "no";

const modeKey = (c: DrillConfig) => `${c.deck}|${c.direction}|${c.input}`;

export function DrillView({ config, cards, onReplay, onReview, onExit }: Props) {
  const weights = useMemo(() => masteryWeights(cards.map((c) => c.id)), [cards]);
  const [session] = useState(
    () =>
      new DrillSession(cards, {
        questionCount: config.count,
        weights: (id) => weights.get(id) ?? 0,
      })
  );
  const [, setTick] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [reveal, setReveal] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const finalizedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Marks that the current card was already scored as a miss, so repeated bad
   *  keystrokes (or repeated failed draws) don't inflate the count. */
  const scoredRef = useRef(false);

  const current = session.current();
  const key = modeKey(config);
  const best = useMemo(() => bestScore(key), [key]);

  // All answer choices for the pad (deduped by character).
  const padOptions = useMemo(() => {
    const map = new Map<string, Card>();
    for (const c of cards) map.set(c.answer, c);
    return [...map.values()];
  }, [cards]);

  // Keep focus on the input on every new question.
  useEffect(() => {
    if (!finished) inputRef.current?.focus();
  }, [session.position, finished]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  function bump() {
    setTick((n) => n + 1);
  }

  function flash(kind: Feedback) {
    setFeedback(kind);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFeedback("none"), 350);
  }

  function finalizeIfDone() {
    if (!session.finished || finalizedRef.current) return;
    finalizedRef.current = true;
    recordSession({
      mode: key,
      correct: session.correct,
      trials: session.correct + session.misses,
    });
    setFinished(true);
  }

  /** The card was answered correctly → score it and move on instantly. */
  function scoreCorrect(card: Card) {
    session.attempt(card.answer);
    recordAttempt(card.id, true);
    scoredRef.current = false;
    setInput("");
    setReveal(null);
    flash("ok");
    bump();
    finalizeIfDone();
  }

  /** An un-rescuable wrong input (or failed draw) → one miss on this card. */
  function scoreMiss(card: Card, raw: string) {
    session.attempt(raw); // check(raw) is false here → counts a miss, stays put
    recordAttempt(card.id, false);
    scoredRef.current = true;
    flash("no");
    bump();
  }

  function scoreDrawMiss(card: Card) {
    if (scoredRef.current) return;
    session.fail();
    recordAttempt(card.id, false);
    scoredRef.current = true;
  }

  /** React to typing: correct → advance, prefix → wait, useless → miss. */
  function onTypeChange(raw: string) {
    setInput(raw);
    const card = session.current();
    if (!card || session.finished) return;
    const status = classifyInput(card, raw);

    if (status === "correct") {
      scoreCorrect(card);
    } else if (status === "wrong") {
      scoreMiss(card, raw);
    } else if (status === "partial") {
      scoredRef.current = false; // new path is open again — resets the miss mark
    } else {
      scoredRef.current = false;
    }
  }

  /** Show answer first; press again (or Enter / Space) to advance. */
  function revealOrAdvance() {
    const card = session.current();
    if (!card || session.finished) return;
    if (!reveal) {
      setReveal(card.answer);
      setFeedback("none");
      return;
    }
    session.skip();
    recordAttempt(card.id, false);
    scoredRef.current = false;
    setReveal(null);
    setInput("");
    flash("no");
    bump();
    finalizeIfDone();
  }

  /** The pad: tap the exact answer character. */
  function pickTap(picked: string) {
    const card = session.current();
    if (!card || session.finished) return;
    if (card.check(picked)) scoreCorrect(card);
    else scoreMiss(card, picked);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      revealOrAdvance();
    } else if (e.key === " ") {
      e.preventDefault();
      if (!input) revealOrAdvance();
    }
  }

  /* ------------------------------- end screen ------------------------------- */

  if (finished) {
    const correct = session.correct;
    const total = session.correct + session.misses;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const missed = session.missedCards();

    const resetProgress = () => {
      if (confirm("Delete all local progress?")) resetAll();
    };

    return (
      <section className="result">
        <div className="result-score" aria-label={`${accuracy}% accuracy`}>
          <span className="result-number">{accuracy}%</span>
          <span className="result-label">accuracy</span>
        </div>

        <div className="result-stats" role="list">
          <div className="stat" role="listitem"><span className="stat-num">{correct}</span><span className="stat-label">correct</span></div>
          <div className="stat" role="listitem"><span className="stat-num">{session.misses}</span><span className="stat-label">missed</span></div>
          <div className="stat" role="listitem"><span className="stat-num">{session.answeredIds.size}</span><span className="stat-label">distinct kana</span></div>
        </div>

        {best && (
          <p className="result-best">
            Personal best for {config.label} · {Math.round(best.accuracy * 100)}%
          </p>
        )}

        {missed.length > 0 && (
          <div className="result-misses">
            <span className="result-misses-label">Needs practice:</span>
            <span className="result-misses-keys">
              {missed.map((m) => (
                <span key={m.id} className="miss-key" data-answer={m.answer}>
                  {m.prompt} <small>{m.answer}</small>
                </span>
              ))}
            </span>
          </div>
        )}

        <div className="result-actions">
          <button className="btn-primary" onClick={onReplay}>Shuffle again</button>
          {missed.length > 0 && (
            <button className="btn-secondary" onClick={() => onReview(missed)}>
              Review missed ({missed.length})
            </button>
          )}
          <button className="btn-ghost" onClick={onExit}>Change settings</button>
        </div>
        <button className="link-button" onClick={resetProgress}>Reset progress</button>
      </section>
    );
  }

  /* ------------------------------ in-progress ------------------------------ */

  return (
    <section className="drill">
      <div className="drill-top">
        <div className="drill-progress" aria-hidden>
          <div
            className="drill-progress-fill"
            style={{ width: `${(session.position / session.total) * 100}%` }}
          />
        </div>
        <div className="drill-meta">
          <span>
            {session.position + 1} / {session.total}
          </span>
          <span className={feedback === "no" ? "drill-feedback-no" : ""}>
            {feedback === "no" ? "Try again" : ""}
          </span>
        </div>
      </div>

      {current && (
        <>
          <div className="prompt-wrap" data-prompt>
            <span className="prompt-script">{current.sub}</span>
            <span className="prompt">{current.prompt}</span>
            {current.notes && <span className="prompt-notes">{current.notes}</span>}
          </div>

          {reveal && (
            <p className="reveal" role="status">
              Answer: <strong>{reveal}</strong> — press Enter, Space or Next to continue
            </p>
          )}

          {/* Type */}
          {config.input === "type" && (
            <div className="type-area">
              <input
                ref={inputRef}
                className={`type-input ${feedback === "no" ? "type-input--wrong" : ""}`}
                value={input}
                onChange={(e) => onTypeChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={config.direction === "toRomaji" ? "type reading…" : "type the kana…"}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                enterKeyHint="done"
              />
              <div className="type-hint">
                {config.direction === "toRomaji"
                  ? <>Type a reading; both Hepburn (shi) and Kunrei (si) work.</>
                  : <>Type the character (or its reading) to select it.</>}
              </div>
            </div>
          )}

          {/* Draw */}
          {config.input === "draw" && (
            <DrawCanvas
              key={current.id}
              target={current.answer}
              fontFamily={KANA_FONT}
              onPass={() => {
                const card = session.current();
                if (card) scoreCorrect(card);
              }}
              onFail={() => {
                const card = session.current();
                if (card) scoreDrawMiss(card);
              }}
            />
          )}

          {/* Kana pad */}
          {config.input === "picker" && (
            <div className={feedback === "no" ? "pad--wrong" : ""}>
              <div className="pad">
                {padOptions.map((c) => (
                  <button key={c.id} type="button" className="pad-key" onClick={() => pickTap(c.answer)}>
                    {c.answer}
                  </button>
                ))}
              </div>
              <div className="type-hint">Tap the correct character.</div>
            </div>
          )}

          <div className="drill-actions">
            <button className="btn-ghost" onClick={revealOrAdvance}>
              {reveal ? "Next →" : "Show answer"}
            </button>
          </div>
        </>
      )}

      {current == null && !finished && (
        <p className="empty">No characters match your selection.</p>
      )}
    </section>
  );
}
