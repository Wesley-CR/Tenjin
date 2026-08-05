"use client";

import { useMemo } from "react";
import {
  KANA_ENTRIES,
  type KanaEntry,
  type groupId,
} from "@/data/kana";
import type { Mastery } from "@/lib/stats";

const COL_INDEX: Record<string, number> = { a: 0, i: 1, u: 2, e: 3, o: 4 };

/** Column (0-4) for gojuon-style placement based on the reading's final vowel. */
function colOf(entry: KanaEntry): number {
  if (entry.romaji === "n") return 0;
  return COL_INDEX[entry.romaji[entry.romaji.length - 1]] ?? 0;
}

interface RowView {
  rowId: groupId;
  label: string;
  cells: (KanaEntry | null)[]; // length 5
}

/** Builds the display rows (basic grid + dakuon + youon + special) for a script. */
export function buildChartRows(script: "hiragana" | "katakana"): RowView[] {
  const entries = KANA_ENTRIES.filter((e) => e.script === script);
  const byRow = new Map<groupId, KanaEntry[]>();
  for (const e of entries) {
    const arr = byRow.get(e.row) ?? [];
    arr.push(e);
    byRow.set(e.row, arr);
  }

  const order: groupId[] = [
    "a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa", "n",
    "ga", "za", "da", "ba", "pa",
    "kya", "sya", "tya", "nya", "hya", "mya", "rya", "gya", "zya", "dya", "bya", "pya",
    "sokuon",
  ];

  const rows: RowView[] = [];
  const label = (id: groupId) =>
    KANA_ENTRIES.find((e) => e.script === script && e.row === id)?.row ?? id;

  for (const rowId of order) {
    const list = byRow.get(rowId);
    if (!list || list.length === 0) continue;
    const cells: (KanaEntry | null)[] = [null, null, null, null, null];
    for (const e of list) cells[colOf(e)] = e;
    rows.push({ rowId, label: label(rowId), cells });
  }
  return rows;
}

export function KanaTable({
  script,
  mastery,
}: {
  script: "hiragana" | "katakana";
  mastery: (id: string) => Mastery;
}) {
  const rows = useMemo(() => buildChartRows(script), [script]);

  const header = useMemo(
    () => (script === "hiragana" ? "Hiragana" : "Katakana"),
    [script]
  );

  // Split into the presentation sections.
  const basic = rows.slice(0, 11);
  const voiced = rows.slice(11, 16);
  const youon = rows.slice(16, 28);
  const special = rows.slice(28);

  return (
    <section className="chart" aria-label={`${header} chart`}>
      <h3>{header}</h3>
      {basic.length > 0 && <Grid rows={basic} mastery={mastery} />}
      {voiced.length > 0 && (
        <>
          <h4>Voiced · dakuten</h4>
          <Grid rows={voiced} mastery={mastery} />
        </>
      )}
      {youon.length > 0 && (
        <>
          <h4>Contracted · yōon</h4>
          <Grid rows={youon} mastery={mastery} />
        </>
      )}
      {special.length > 0 && (
        <>
          <h4>Special</h4>
          <Grid rows={special} mastery={mastery} />
        </>
      )}
    </section>
  );
}

function Grid({
  rows,
  mastery,
}: {
  rows: RowView[];
  mastery: (id: string) => Mastery;
}) {
  return (
    <div className="chart-grid" role="grid">
      <span className="chart-cell chart-cell--head" role="columnheader" />{" "}
      {["A", "I", "U", "E", "O"].map((letter) => (
        <span key={letter} className="chart-cell chart-cell--head" role="columnheader">
          {letter}
        </span>
      ))}
      {rows.map((r) => (
        <RowCells key={r.rowId} row={r.cells} mastery={mastery} />
      ))}
    </div>
  );
}

function RowCells({
  row,
  mastery,
}: {
  row: (KanaEntry | null)[];
  mastery: (id: string) => Mastery;
}) {
  return (
    <>
      <span className="chart-cell chart-cell--head" role="rowheader">
        {row.find(Boolean)?.romaji ?? ""}
      </span>
      {row.map((entry, i) =>
        entry ? (
          <span
            key={entry.id}
            className={`chart-cell mastery-${mastery(entry.id)}`}
            data-kana={entry.char}
          >
            <span className="chart-kana">{entry.char}</span>
            <span className="chart-romanji">{entry.romaji}</span>
          </span>
        ) : (
          <span key={i} className="chart-cell chart-cell--empty" aria-hidden />
        )
      )}
    </>
  );
}
