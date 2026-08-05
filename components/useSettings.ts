"use client";

import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings, type StoredSetup } from "@/lib/settings";

/**
 * Reactive, hydration-safe read of the persisted practice options.
 * Snapshot is a cached object reference (see lib/settings.ts), so this can't
 * cause render loops; server-side it returns null (defaults win on first paint).
 */
export function useSettings(): StoredSetup | null {
  return useSyncExternalStore(subscribeSettings, getSettings, () => null);
}
