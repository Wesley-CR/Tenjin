"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useStreak } from "@/components/useStats";
import { NAV, matchesPath } from "@/lib/nav";

/**
 * App chrome, not a website header:
 *  - desktop (≥780px): one floating pill, top-center — brand, tabs, actions.
 *  - mobile: slim sticky brand bar on top, floating pill docked to the bottom
 *    with the tabs (native-app pattern, safe-area aware).
 */
export function NavBar() {
  const { toggle, theme } = useTheme();
  // Hydration-safe: 0 on the server, real value right after hydration.
  const streak = useStreak();
  const pathname = usePathname();

  const toggleButton = (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "◐" : "●"}
    </button>
  );

  const streakChip =
    streak > 0 ? (
      <span className="streak-chip" title="Day practice streak">
        <span aria-hidden>🔥</span> {streak}
      </span>
    ) : null;

  return (
    <>
      <div className="top-bar">
        <Link href="/" className="brand" title="Tenjin てんじん">
          <span className="brand-mark" aria-hidden>
            天
          </span>
          <span className="brand-name">Tenjin</span>
        </Link>
        <div className="top-bar-actions">
          {streakChip}
          {toggleButton}
        </div>
      </div>

      <nav className="nav-pill" aria-label="App sections">
        <Link href="/" className="nav-brand" title="Tenjin てんじん">
          <span className="brand-mark" aria-hidden>
            天
          </span>
          <span className="brand-name">Tenjin</span>
        </Link>
        <span className="nav-divider" aria-hidden />

        {NAV.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`nav-link ${matchesPath(tab, pathname) ? "is-active" : ""}`}
            aria-label={tab.hint}
          >
            <span aria-hidden>{tab.mark}</span>
            {tab.label}
          </Link>
        ))}

        <span className="nav-divider" aria-hidden />
        <div className="nav-actions">
          {streakChip}
          {toggleButton}
        </div>
      </nav>
    </>
  );
}