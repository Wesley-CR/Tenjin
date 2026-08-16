"use client";

import { useSyncExternalStore } from "react";
import { getStreak, statsVersion, subscribeStats } from "@/lib/stats";

/**
 * Stable subscription + snapshot for the local stats store.
 *
 * `getSnapshot` returns a cached *primitive* (a version counter), never a new
 * object, so `useSyncExternalStore` can't get stuck in an update loop — the
 * classic pitfall this module exists to prevent.
 */
function subscribe(onChange: () => void): () => void {
  const unsubscribe = subscribeStats(onChange);
  const onStorage = () => onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    unsubscribe();
    window.removeEventListener("storage", onStorage);
  };
}

export function useStatsVersion(): number {
  return useSyncExternalStore(subscribe, statsVersion, () => 0);
}

/**
 * Day-streak count, hydration-safe: the server (and the hydration render)
 * always see 0, so the chip can't mismatch; the real value appears right
 * after hydration and stays reactive to store writes.
 */
export function useStreak(): number {
  return useSyncExternalStore(subscribe, () => getStreak().count, () => 0);
}
