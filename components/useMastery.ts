"use client";

import { useMemo } from "react";
import { allCardStats, masteryLevel, type Mastery } from "@/lib/stats";
import { useStatsVersion } from "@/components/useStats";

/**
 * Reactive, hydration-safe view of per-card mastery. The snapshot is a *new*
 * function only when the stats version changes — crucially, an outer Map is
 * rebuilt via `useMemo`, so `useSyncExternalStore` never sees a fresh object
 * reference on every render.
 */
export function useMastery(): (id: string) => Mastery {
  const version = useStatsVersion();
  const cards = useMemo(
    () => {
      const m = new Map<string, Mastery>();
      for (const [id, stat] of allCardStats()) m.set(id, masteryLevel(stat));
      return m;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the change signal
    [version]
  );
  return useMemo(() => (id: string) => cards.get(id) ?? "new", [cards]);
}
