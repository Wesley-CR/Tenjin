"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { getStreak } from "@/lib/stats";

/** Reactive day-streak from the local stats store. */
function useStreak(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("kana-trainer:stats", onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("kana-trainer:stats", onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => getStreak().count,
    () => 0
  );
}

/** Shared top bar: brand, day streak, theme toggle. */
export function Header() {
  const { toggle, theme } = useTheme();
  const streak = useStreak();

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>あ</span>
        <span className="brand-name">Kana Trainer</span>
      </Link>

      <nav className="header-actions">
        {streak > 0 && (
          <span className="streak-chip" title="Day practice streak">
            <span aria-hidden>🔥</span> {streak}
          </span>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "◐" : "●"}
        </button>
      </nav>
    </header>
  );
}
