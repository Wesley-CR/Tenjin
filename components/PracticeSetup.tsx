"use client";

import { useRouter } from "next/navigation";
import { getDeckOrFallback } from "@/lib/decks";
import { useSettings } from "@/components/useSettings";
import { updateSettings } from "@/lib/settings";
import type { InputKind, KanaDirection, Script } from "@/lib/types";

interface Mode {
  id: string;
  direction: KanaDirection;
  input: InputKind;
  title: string;
  subtitle: string;
}

/** The three kana-specific ways to answer. */
const KANA_MODES: Mode[] = [
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
const VALID_COUNTS = new Set(COUNTS.map((c) => c.value));

const ALL_SCRIPTS: Script[] = ["hiragana", "katakana"];

/** Default to the first group section (for kana that's the basic rows). */
function defaultGroups(deckId: string): Set<string> {
  const def = getDeckOrFallback(deckId);
  const firstHeader = def.groups[0]?.header;
  const s = new Set<string>();
  for (const g of def.groups) {
    if (g.header === firstHeader) s.add(g.id);
  }
  return s;
}

/**
 * Practice configuration. Controlled directly by the persisted settings store
 * (single source of truth), so every change survives a reload with no extra
 * state or effects.
 */
export function PracticeSetup({ deckId }: { deckId: string }) {
  const router = useRouter();
  const deck = getDeckOrFallback(deckId);
  const settings = useSettings();
  const savedHere = settings?.deck === deck.id ? settings : null;
  const isKana = deck.id === "kana";

  const sections: Array<[string, typeof deck.groups]> = (() => {
    const map = new Map<string, typeof deck.groups>();
    for (const g of deck.groups) {
      const list = map.get(g.header) ?? [];
      list.push(g);
      map.set(g.header, list);
    }
    return [...map.entries()];
  })();

  const modes: Mode[] = isKana
    ? KANA_MODES
    : deck.inputs.map((input) => ({
        id: input,
        direction: "toKana" as const,
        input,
        title: input,
        subtitle: "",
      }));

  // Derived from the store each render (validated against THIS deck — these
  // are tiny sets; React Compiler handles any memoization worth doing).
  const scripts: Set<Script> = (() => {
    const base = isKana && savedHere && savedHere.scripts.length > 0
      ? savedHere.scripts
      : ALL_SCRIPTS;
    const set = new Set<Script>();
    for (const s of base) if (s === "hiragana" || s === "katakana") set.add(s);
    return set;
  })();

  const validGroupIds = new Set(deck.groups.map((g) => g.id));
  const storedGroups = savedHere
    ? savedHere.groups.filter((g) => validGroupIds.has(g))
    : null;
  const groups = storedGroups && storedGroups.length > 0
    ? new Set(storedGroups)
    : defaultGroups(deckId);

  const modeId = savedHere && modes.some((m) => m.id === savedHere.modeId)
    ? savedHere.modeId
    : modes[0].id;
  const count = savedHere && VALID_COUNTS.has(savedHere.count) ? savedHere.count : 0;
  const mode = modes.find((m) => m.id === modeId) ?? modes[0];

  const canStart = groups.size > 0 && (!isKana || scripts.size > 0);

  function toggleScript(s: Script) {
    const next = new Set(scripts);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    updateSettings({ deck: deck.id, scripts: [...next] });
  }

  function toggleGroup(id: string) {
    const next = new Set(groups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSettings({ deck: deck.id, groups: [...next] });
  }

  function toggleSection(header: string) {
    const ids = sections.find(([h]) => h === header)?.[1].map((g) => g.id) ?? [];
    const allOn = ids.every((id) => groups.has(id));
    const next = new Set(groups);
    for (const id of ids) {
      if (allOn) next.delete(id);
      else next.add(id);
    }
    updateSettings({ deck: deck.id, groups: [...next] });
  }

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams();
    params.set("deck", deck.id);
    if (isKana) {
      params.set("scripts", [...scripts].sort().join(","));
      params.set("dir", mode.direction);
    }
    params.set("groups", [...groups].sort().join(","));
    params.set("input", mode.input);
    params.set("count", String(count));
    router.push(`/practice/?${params.toString()}`);
  }

  return (
    <div className="setup">
      {isKana && (
        <div className="field">
          <label className="field-label">Script</label>
          <div className="segmented" role="group" aria-label="Script">
            {ALL_SCRIPTS.map((s) => (
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
      )}

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
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-card ${modeId === m.id ? "is-active" : ""}`}
              onClick={() => updateSettings({ deck: deck.id, modeId: m.id })}
              aria-pressed={modeId === m.id}
            >
              <span className="mode-title">{m.title}</span>
              {m.subtitle && <span className="mode-subtitle">{m.subtitle}</span>}
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
              onClick={() => updateSettings({ deck: deck.id, count: c.value })}
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
