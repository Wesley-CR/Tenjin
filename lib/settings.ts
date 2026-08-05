import type { Script } from "@/lib/types";

/**
 * Persisted UI options (survive reloads), exposed as a tiny reactive store so
 * components can read them with `useSyncExternalStore` — no localStorage reads
 * at render time, no effect-driven setState.
 *
 * `getSettings` returns a *cached* object reference that only changes when an
 * update is actually applied, so the store snapshot is safe for React.
 */
const KEY = "tenjin:settings:v1";

export interface StoredSetup {
  deck: string;
  scripts: Script[];
  groups: string[];
  modeId: string;
  count: number;
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null; // storage disabled (e.g. private browsing)
  }
}

let current: StoredSetup | null = null;
let loaded = false;
let version = 0;
const listeners = new Set<() => void>();

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  const s = storage();
  if (!s) return;
  try {
    const raw = s.getItem(KEY);
    current = raw ? (JSON.parse(raw) as StoredSetup) : null;
  } catch {
    current = null;
  }
}

/** Reactive (SSR-safe) read of the stored options; returns null before any save. */
export function getSettings(): StoredSetup | null {
  ensureLoaded();
  return current;
}

export function settingsVersion(): number {
  return version;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Merge-and-save a change, then notify subscribers. */
export function updateSettings(
  patch: Partial<Omit<StoredSetup, "deck">> & { deck: string }
): void {
  ensureLoaded();
  const base: StoredSetup =
    current ?? { deck: patch.deck, scripts: [], groups: [], modeId: "", count: 0 };
  current = { ...base, ...patch };
  const s = storage();
  if (s) {
    try {
      s.setItem(KEY, JSON.stringify(current));
    } catch {
      /* storage unavailable — keep in-memory state */
    }
  }
  version++;
  for (const l of [...listeners]) l();
}

/** Remembered section, valid against the given ids, else null. */
export function rememberedDeck(validIds: readonly string[]): string | null {
  const setup = getSettings();
  return setup && validIds.includes(setup.deck) ? setup.deck : null;
}
