"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useStatsVersion } from "@/components/useStats";
import { getStreak } from "@/lib/stats";

/** Shared top bar: brand, day streak, theme toggle. */
export function Header() {
  const { toggle, theme } = useTheme();
  const version = useStatsVersion();
  const streak = useMemo(
    () => getStreak().count,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the change signal
    [version]
  );

  return (
    <header className="site-header">
      <Link href="/" className="brand" title="Tenjin てんじん">
        <span className="brand-mark" aria-hidden>天</span>
        <span className="brand-name">Tenjin</span>
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
