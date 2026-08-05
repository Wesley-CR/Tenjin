"use client";

import { useEffect } from "react";

/**
 * Registers the tiny cache-first service worker so the app works offline and
 * is installable as a PWA. Kept as a separate client component so the rest of
 * the tree stays server-renderable.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // non-fatal; app still works without a sw
    });
  }, []);
  return null;
}
