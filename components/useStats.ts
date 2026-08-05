"use client";

import { useSyncExternalStore } from "react";
import { statsVersion, subscribeStats } from "@/lib/stats";

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
