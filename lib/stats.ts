/**
 * Progress + achievements store. Everything lives in localStorage so the app
 * stays a static, dependency-free PWA; nothing ever leaves the device.
 * SSR-safe: on the server (or in tests without jsdom) an in-memory store is
 * used so importing the module never crashes.
 */

const DB_KEY = "kana-trainer:v1";

export interface CardStat {
  seen: number;
  correct: number;
  wrong: number;
  /** Current correct-in-a-row streak. */
  streak: number;
  lastSeen: number;
}

export type Mastery = "new" | "learning" | "familiar" | "mastered";

export interface ScoreEntry {
  date: string; // ISO
  correct: number;
  trials: number;
  accuracy: number;
  mode: string;
}

export interface DayStreak {
  count: number;
  lastDay: string; // YYYY-MM-DD (local)
}

interface DB {
  cards: Record<string, CardStat>;
  scores: Record<string, ScoreEntry[]>;
  streak: DayStreak;
}

const DEFAULT_DB: DB = { cards: {}, scores: {}, streak: { count: 0, lastDay: "" } };

let cache: DB | null = null;

function store(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null; // storage disabled (e.g. private browsing)
  }
}

export function loadDB(): DB {
  if (cache) return cache;
  const s = store();
  if (!s) return { ...DEFAULT_DB, cards: {}, scores: {} };
  try {
    const raw = s.getItem(DB_KEY);
    cache = raw ? (JSON.parse(raw) as DB) : { ...DEFAULT_DB, cards: {}, scores: {} };
  } catch {
    cache = { ...DEFAULT_DB, cards: {}, scores: {} };
  }
  return cache;
}

/* ------------------------ reactive subscription ---------------------- */

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

/** Subscribe to stat changes (any write invalidates local UI). */
export function subscribeStats(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Monotonic version bumped on every save — use as a useSyncExternalStore snapshot. */
export function statsVersion(): number {
  return version;
}

function notifyStats(): void {
  version++;
  for (const l of [...listeners]) l();
}

export function saveDB(): void {
  const s = store();
  if (!s || !cache) return;
  s.setItem(DB_KEY, JSON.stringify(cache));
  notifyStats();
}

export function resetAll(): void {
  cache = { ...DEFAULT_DB, cards: {}, scores: {} };
  saveDB();
}

/* ------------------------------- cards ------------------------------- */

export function getCardStat(id: string): CardStat {
  const db = loadDB();
  return db.cards[id] ?? { seen: 0, correct: 0, wrong: 0, streak: 0, lastSeen: 0 };
}

export function recordAttempt(id: string, correct: boolean): CardStat {
  const db = loadDB();
  const cur = getCardStat(id);
  const next: CardStat = {
    seen: cur.seen + 1,
    correct: cur.correct + (correct ? 1 : 0),
    wrong: cur.wrong + (correct ? 0 : 1),
    streak: correct ? cur.streak + 1 : 0,
    lastSeen: Date.now(),
  };
  db.cards[id] = next;
  saveDB();
  return next;
}

export function masteryLevel(stat: CardStat): Mastery {
  if (stat.seen === 0) return "new";
  if (stat.streak >= 5 && stat.correct / stat.seen >= 0.9) return "mastered";
  if (stat.correct >= 5) return "familiar";
  if (stat.correct >= 1) return "learning";
  return "new";
}

export function masteryScore(stat: CardStat): number {
  switch (masteryLevel(stat)) {
    case "mastered": return 1;
    case "familiar": return 0.75;
    case "learning": return 0.4;
    default: return 0;
  }
}

/** id → mastery score (0..1) for the weighted scheduler. */
export function masteryWeights(ids: Iterable<string>): Map<string, number> {
  const db = loadDB();
  const m = new Map<string, number>();
  for (const id of ids) {
    m.set(id, masteryScore(db.cards[id] ?? { seen: 0, correct: 0, wrong: 0, streak: 0, lastSeen: 0 }));
  }
  return m;
}

export function allCardStats(): Array<[string, CardStat]> {
  return Object.entries(loadDB().cards);
}

/* ------------------------------ sessions ----------------------------- */

/** Records a finished session: updates the day streak and the per-mode highscore. */
export function recordSession(meta: { mode: string; correct: number; trials: number }): void {
  const db = loadDB();
  updateStreak(db);
  const acc = meta.trials > 0 ? meta.correct / meta.trials : 0;
  const list = db.scores[meta.mode] ?? [];
  list.push({ date: new Date().toISOString(), correct: meta.correct, trials: meta.trials, accuracy: acc, mode: meta.mode });
  // Keep the 10 best (accuracy desc, then correctness).
  list.sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);
  db.scores[meta.mode] = list.slice(0, 10);
  saveDB();
}

export function getScores(mode: string): ScoreEntry[] {
  return loadDB().scores[mode] ?? [];
}

/** Every recorded session across all modes (for the Progress screen). */
export function allScores(): ScoreEntry[] {
  const db = loadDB();
  return Object.values(db.scores).flat();
}

export function bestScore(mode: string): ScoreEntry | null {
  return getScores(mode)[0] ?? null;
}

/* ------------------------------ streaks ------------------------------ */

function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterday(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return localDay(dt);
}

export function getStreak(): DayStreak {
  return loadDB().streak;
}

/** Marks today as active; bumps streak if yesterday was active, resets otherwise. */
function updateStreak(db: DB): void {
  const today = localDay(new Date());
  if (db.streak.lastDay === today) return;
  db.streak.count = db.streak.lastDay === yesterday(today) ? db.streak.count + 1 : 1;
  db.streak.lastDay = today;
}

/** The current streak, counting today's run to its duration. */
export function peekStreakToday(): number {
  const { count, lastDay } = loadDB().streak;
  return lastDay === localDay(new Date()) ? count : count;
}
