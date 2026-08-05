"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { Card, DrillConfig } from "@/lib/types";
import { DrillSession } from "@/lib/quizzing";
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

  function submit(raw: string) {
    const card = session.current();
    if (!card) return;
    const res = session.attempt(raw);
    recordAttempt(card.id, res.correct);
    if (res.correct) {
      setInput("");
      setReveal(null);
      flash("ok");
      bump();
      finalizeIfDone();
    } else {
      setReveal(null);
      flash("no");
      bump();
    }
  }

  /** First press reveals the answer; a second press reveals & moves on. */
  function skip() {
    const card = session.current();
    if (!card || session.finished) return;
    if (reveal) {
      session.skip();
      recordAttempt(card.id, false);
      setReveal(null);
      flash("no");
      bump();
      finalizeIfDone();
    } else {
      setReveal(card.answer);
      flash("no");
    }
  }

  /* ------------------------------- end screen ------------------------------- */

  if (finished) {
    const correct = session.correct;
    const total = session.correct + session.misses;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const resetProgress = () => {
      if (confirm("Delete all local progress?")) {
        resetAll();
      }
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

        <div className="result-actions">
          <button className="btn-primary" onClick={onReplay}>Shuffle again</button>
          {session.missedCards().length > 0 && (
            <button className="btn-secondary" onClick={() => onReview(session.missedCards())}>
              Review missed ({session.missedCards().length})
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
          <span className={`${feedback === "ok" ? "drill-feedback-ok" : ""}${feedback === "no" ? "drill-feedback-no" : ""}`}>
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
            <p className="reveal">
              Answer: <strong>{reveal}</strong> — moving on
            </p>
          )}

          {/* Type */}
          {config.input === "type" && (
            <div className="type-area">
              <input
                ref={inputRef}
                className={`type-input ${feedback === "no" ? "type-input--wrong" : ""}`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  submit(e.target.value);
                }}
                placeholder={config.direction === "toRomaji" ? "type reading…" : "type the kana…"}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                enterKeyHint="go"
              />
              <div className="type-hint">
                {config.direction === "toRomaji" ? (
                  <>Type a reading. Both Hepburn (shi) and Kunrei (si) work.</>
                ) : (
                  <>Type the character (or its reading) to select it.</>
                )}
              </div>
            </div>
          )}

          {/* Draw */}
          {config.input === "draw" && (
            <DrawCanvas
              key={current.id}
              target={current.answer}
              fontFamily={KANA_FONT}
              onPass={() => submit(current.answer)}
              onFail={() => recordAttempt(current.id, false)}
            />
          )}

          {/* Kana pad */}
          {config.input === "picker" && (
            <div className={feedback === "no" ? "pad--wrong" : ""}>
              <div className="pad">
                {padOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="pad-key"
                    onClick={() => submit(c.answer)}
                  >
                    {c.answer}
                  </button>
                ))}
              </div>
              <div className="type-hint">Tap the correct character.</div>
            </div>
          )}

          <div className="drill-actions">
            <button className="btn-ghost" onClick={skip}>Skip · show answer</button>
          </div>
        </>
      )}

      {current == null && !finished && (
        <p className="empty">No characters match your selection.</p>
      )}
    </section>
  );
}
