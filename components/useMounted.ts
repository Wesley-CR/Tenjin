"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration-safe "mounted" flag: false on the server AND during the hydration
 * render, true immediately after. Client-only data (direct localStorage
 * reads) should render only when this is true, so SSR and client HTML always
 * agree on first paint.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}