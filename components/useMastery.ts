"use client";

import { useSyncExternalStore } from "react";
import { allCardStats, masteryLevel, type Mastery } from "@/lib/stats";

/**
 * Reactive, SSR-safe view of the local progress store. Subscribes to a custom
 * event that the stats layer dispatches on every write, plus `storage` so any
 * other tab that practices refreshes the charts too.
 */
export function useMastery(): (id: string) => Mastery {
  const cards = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("kana-trainer:stats", onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("kana-trainer:stats", onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => {
      const m = new Map<string, Mastery>();
      for (const [id, stat] of allCardStats()) m.set(id, masteryLevel(stat));
      return m;
    },
    () => new Map<string, Mastery>()
  );
  return (id: string) => cards.get(id) ?? "new";
}
