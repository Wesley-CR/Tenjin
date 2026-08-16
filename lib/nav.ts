/**
 * App navigations — the single registry for screens behind the navbar.
 * New destinations (kanji section home, settings, …) get a tab here.
 * Sections *within* a screen stay in lib/decks.ts.
 */

export interface NavDestination {
  id: string;
  label: string;
  href: string;
  /** Small geometric mark — the app has no icon font on purpose. */
  mark: string;
  hint: string;
}

export const NAV: NavDestination[] = [
  { id: "practice", label: "Practice", href: "/", mark: "◉", hint: "Practice drills" },
  { id: "progress", label: "Progress", href: "/progress/", mark: "▦", hint: "Progress and charts" },
];

/** "/" is the only root-level tab; everything else matches by prefix. */
export function matchesPath(tab: NavDestination, pathname: string): boolean {
  return tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
}