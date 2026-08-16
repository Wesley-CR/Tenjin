"use client";

import { useMemo } from "react";
import { KanaTable } from "@/components/KanaTable";
import { useMastery } from "@/components/useMastery";
import { useStatsVersion } from "@/components/useStats";
import { useMounted } from "@/components/useMounted";
import { KANA_ENTRIES } from "@/data/kana";
import {
  allCardStats,
  allScores,
  getStreak,
  masteryLevel,
} from "@/lib/stats";

interface Summary {
  streak: number;
  drills: number;
  best: number;
  mastered: number;
  seen: number;
  total: number;
}

const EMPTY_SUMMARY: Summary = {
  streak: 0,
  drills: 0,
  best: 0,
  mastered: 0,
  seen: 0,
  total: KANA_ENTRIES.length,
};

function summarize(): Summary {
  const scores = allScores();
  const best = scores.length > 0 ? Math.max(...scores.map((s) => s.accuracy)) : 0;
  const cardStats = allCardStats();
  const mastered = cardStats.filter(([, s]) => masteryLevel(s) === "mastered").length;
  return {
    streak: getStreak().count,
    drills: scores.length,
    best: Math.round(best * 100),
    mastered,
    seen: cardStats.length,
    total: KANA_ENTRIES.length,
  };
}

export default function ProgressPage() {
  const version = useStatsVersion();
  const mounted = useMounted();
  const mastery = useMastery();
  // localStorage reads only post-mount, so first paint matches SSR.
  const s = useMemo(
    () => (mounted ? summarize() : EMPTY_SUMMARY),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the change signal
    [version, mounted]
  );

  const tiles = [
    { label: "Day streak", value: s.streak, unit: s.streak === 1 ? "day" : "days" },
    { label: "Drills finished", value: s.drills, unit: "total" },
    { label: "Best accuracy", value: `${s.best}%`, unit: "single session" },
    { label: "Mastered", value: `${s.mastered}`, unit: `of ${s.total} kana (${s.seen} seen)` },
  ];

  return (
    <div className="progress">
      <section className="screen-header">
        <h1 className="screen-title">Progress</h1>
        <p className="screen-sub">
          Charts reflect real attempts — dashed means you&apos;re learning it,
          solid means it&apos;s yours. Everything stays on this device.
        </p>
      </section>

      <section className="stats-grid" aria-label="Summary">
        {tiles.map((t) => (
          <div key={t.label} className="stat-tile">
            <b>{t.value}</b>
            <span>{t.label}</span>
            <small>{t.unit}</small>
          </div>
        ))}
      </section>

      <section className="charts">
        <KanaTable script="hiragana" mastery={mastery} />
        <KanaTable script="katakana" mastery={mastery} />
      </section>
    </div>
  );
}