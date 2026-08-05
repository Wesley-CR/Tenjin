/** Small framework-independent helpers shared by the engine. */

/** Unbiased Fisher–Yates shuffle; injectable rng for deterministic tests. */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Repeats `arr` until `count` items are produced (count <= 0 → one copy). */
export function cycle<T>(arr: readonly T[], count: number): T[] {
  if (count <= 0) return [...arr];
  const out: T[] = [];
  while (out.length < count) out.push(...arr);
  return out.slice(0, count);
}

/**
 * Builds the next-question queue: a shuffled run over the pool, cycled until
 * `count` questions are produced (count <= 0 → single run over the whole pool).
 */
export function buildQueue<T>(pool: readonly T[], count: number, rng: () => number = Math.random): T[] {
  const shuffled = shuffle(pool, rng);
  return cycle(shuffled, count);
}
