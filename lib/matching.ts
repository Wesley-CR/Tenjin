import type { Card } from "@/lib/types";

/** Canonical input normalisation — must match what card check()s expect. */
export function normalizeInput(input: string): string {
  return input.toLowerCase().replace(/[\s]/g, "").trim();
}

export type MatchStatus = "correct" | "partial" | "wrong" | "empty";

/**
 * Classifies a *typed-so-far* input against a card. The product rule: a full
 * correct reading advances; a prefix of a valid reading is "partial" (still
 * typing, no penalty); anything else is a real miss. Guessing can never win,
 * but neither does a stray prefix get punished.
 */
export function classifyInput(card: Card, raw: string): MatchStatus {
  const norm = normalizeInput(raw);
  if (!norm) return "empty";
  if (card.check(norm)) return "correct";
  const readings = (card.readings ?? []).map(normalizeInput);
  if (readings.some((r) => r !== norm && r.startsWith(norm))) return "partial";
  return "wrong";
}
