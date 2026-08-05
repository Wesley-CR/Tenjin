"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

const THEME_KEY = "kana-trainer:theme";

// useLayoutEffect warns on the server; use it only where it's meaningful (client).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Resolve the effective theme without touching DOM (SSR-safe). */
function resolveTheme(): Theme {
  const stored = (() => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  })();
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Apply the saved/system theme to <html> before React hydrates, so there's no
 * flash of the wrong color scheme — and no <script> tag (React 19 warns on
 * scripts rendered from components). Runs when the client bundle is evaluated,
 * i.e. before first paint.
 */
if (typeof window !== "undefined") {
  document.documentElement.dataset.theme = resolveTheme();
}

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start "light" on BOTH server and first client render so hydration can't
  // mismatch; the real theme is applied right after (before paint).
  const [theme, setTheme] = useState<Theme>("light");

  useIsoLayoutEffect(() => {
    setTheme(resolveTheme());
  }, []);

  useIsoLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    }),
    [theme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}
