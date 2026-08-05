"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KANA_GROUPS } from "@/data/kana";
import type { InputKind, KanaDirection, Script } from "@/lib/types";

interface Mode {
  id: string;
  direction: KanaDirection;
  input: InputKind;
  title: string;
  subtitle: string;
}

const MODES: Mode[] = [
  { id: "read", direction: "toRomaji", input: "type", title: "Read", subtitle: "kana → romaji" },
  { id: "write", direction: "toKana", input: "picker", title: "Write", subtitle: "romaji → kana" },
  { id: "draw", direction: "toKana", input: "draw", title: "Draw", subtitle: "romaji → write" },
];

const COUNTS = [
  { value: 0, label: "All" },
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
];

const defaultGroups = () => {
  const s = new Set<string>();
  for (const g of KANA_GROUPS) if (g.header === "Basic") s.add(g.id);
  return s;
};

export function PracticeSetup() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Set<Script>>(new Set(["hiragana", "katakana"]));
  const [groups, setGroups] = useState<Set<string>>(defaultGroups);
  const [modeId, setModeId] = useState<string>(MODES[0].id);
  const [count, setCount] = useState<number>(0);

  const sections = useMemo(() => {
    const map = new Map<string, typeof KANA_GROUPS>();
    for (const g of KANA_GROUPS) {
      const list = map.get(g.header) ?? [];
      list.push(g);
      map.set(g.header, list);
    }
    return [...map.entries()];
  }, []);

  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const canStart = scripts.size > 0 && groups.size > 0;

  function toggleScript(s: Script) {
    setScripts((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleGroup(id: string) {
    setGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSection(header: string) {
    const ids = sections.find(([h]) => h === header)?.[1].map((g) => g.id) ?? [];
    const allOn = ids.every((id) => groups.has(id));
    setGroups((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams();
    params.set("deck", "hiragana");
    params.set("scripts", [...scripts].sort().join(","));
    params.set("groups", [...groups].sort().join(","));
    params.set("dir", mode.direction);
    params.set("input", mode.input);
    params.set("count", String(count));
    router.push(`/practice/?${params.toString()}`);
  }

  return (
    <div className="setup">
      <div className="field">
        <label className="field-label">Script</label>
        <div className="segmented" role="group" aria-label="Script">
          {(["hiragana", "katakana"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`segmented-item ${scripts.has(s) ? "is-active" : ""}`}
              onClick={() => toggleScript(s)}
              aria-pressed={scripts.has(s)}
            >
              {s === "hiragana" ? "Hiragana" : "Katakana"}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Groups</label>
        {sections.map(([header, list]) => {
          const ids = list.map((g) => g.id);
          const allOn = ids.every((id) => groups.has(id));
          const someOn = ids.some((id) => groups.has(id));
          return (
            <div key={header} className="group-section">
              <button
                type="button"
                className="group-header"
                onClick={() => toggleSection(header)}
                aria-pressed={allOn}
              >
                <span className={`checkbox ${allOn ? "checked" : someOn ? "partial" : ""}`} aria-hidden>
                  {allOn ? "✓" : someOn ? "–" : ""}
                </span>
                {header}
              </button>
              <div className="chips">
                {list.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`chip ${groups.has(g.id) ? "is-active" : ""}`}
                    onClick={() => toggleGroup(g.id)}
                    aria-pressed={groups.has(g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="field">
        <label className="field-label">Mode</label>
        <div className="mode-grid" role="group" aria-label="Practice mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-card ${modeId === m.id ? "is-active" : ""}`}
              onClick={() => setModeId(m.id)}
              aria-pressed={modeId === m.id}
            >
              <span className="mode-title">{m.title}</span>
              <span className="mode-subtitle">{m.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Questions</label>
        <div className="segmented" role="group" aria-label="Question count">
          {COUNTS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`segmented-item ${count === c.value ? "is-active" : ""}`}
              onClick={() => setCount(c.value)}
              aria-pressed={count === c.value}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={start} disabled={!canStart}>
        Start practicing
      </button>
    </div>
  );
}
