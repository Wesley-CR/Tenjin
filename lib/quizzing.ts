import type { Card } from "@/lib/types";
import { buildQueue, cycle, shuffle } from "@/lib/util";

export interface AttemptResult {
  correct: boolean;
  /** True when the answer advanced to the next question. */
  advanced: boolean;
  next: Card | null;
}

export interface DrillSessionOptions {
  questionCount: number;
  rng?: () => number;
  /** Optional mastery hint per card id (0 = new, 1 = mastered). Weak cards get
      ordered earlier so they surface more often. */
  weights?: (id: string) => number;
}

/**
 * Pulls cards one at a time. Correct answers advance immediately. A wrong
 * answer stays on the same card (so the user retries it) and is scored as a
 * miss. `skip` forces a miss and advances.
 *
 * Pure & framework-independent — the UI layer only calls `attempt`/`skip`.
 */
export class DrillSession {
  private queue: Card[];
  private index = 0;
  private readonly weights?: (id: string) => number;

  readonly questionCount: number;
  correct = 0;
  misses = 0;
  /** Card ids correctly answered at least once this session. */
  answeredIds = new Set<string>();
  /** Cards that were missed (for "review missed" replays), deduped. */
  private missed = new Map<string, Card>();

  missedCards(): Card[] {
    return [...this.missed.values()];
  }

  constructor(pool: readonly Card[], opts: DrillSessionOptions) {
    this.questionCount = Math.max(0, opts.questionCount);
    this.weights = opts.weights;
    this.queue = this.weighted(pool);
  }

  /**
   * Weakest-first ordering (weight 0 = weakest) so weak cards surface early.
   * Statically-ordered so the weighting isn't later shuffled away; the engine
   * already re-orders per run through natural randomisation of the pool.
   */
  private weighted(pool: readonly Card[]): Card[] {
    if (!this.weights) {
      return buildQueue(pool, this.questionCount);
    }
    const ordered = [...pool].sort((a, b) => {
      const wa = this.weights!(a.id) ?? 0;
      const wb = this.weights!(b.id) ?? 0;
      if (Math.abs(wa - wb) > 1e-9) return wa - wb;
      return a.id.localeCompare(b.id);
    });
    return cycle(ordered, this.questionCount);
  }

  current(): Card | null {
    return this.queue[this.index] ?? null;
  }

  get position(): number {
    return this.index;
  }

  get total(): number {
    return this.queue.length;
  }

  get finished(): boolean {
    return this.index >= this.queue.length;
  }

  /** Try an answer for the current card. Correct → advance immediately. */
  attempt(input: string): AttemptResult {
    const card = this.current();
    if (!card) return { correct: false, advanced: false, next: null };

    if (card.check(input)) {
      this.correct++;
      this.answeredIds.add(card.id);
      this.index++;
      return { correct: true, advanced: true, next: this.current() };
    }
    this.misses++;
    this.missed.set(card.id, card);
    return { correct: false, advanced: false, next: card };
  }

  /** Forced skip: scored as a miss and advances (the "I give up" escape). */
  skip(): AttemptResult {
    const card = this.current();
    if (!card) return { correct: false, advanced: false, next: null };
    this.misses++;
    this.missed.set(card.id, card);
    this.index++;
    return { correct: false, advanced: true, next: this.current() };
  }

  /** Rebuild the queue order (normally overkill; exists for tests/replays). */
  reshuffle() {
    const rest = this.queue.slice(this.index);
    this.queue = shuffle(rest);
    this.index = 0;
  }

  accuracy(): number {
    return this.correct + this.misses === 0 ? 0 : this.correct / (this.correct + this.misses);
  }
}
