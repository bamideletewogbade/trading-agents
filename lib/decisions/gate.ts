/**
 * Every Jev decision goes through `decide()`, so each gate gets the same
 * protection without writing it again:
 *
 * 1. **Rules first.** A gate may answer from plain rules (rung 0 of the
 *    ladder, plan §6.1): an obvious crisis phrase, a two-word reflection, a
 *    query the keyword search already answers. No call, no cost, no wait.
 * 2. **Off means authored.** Without Jev (no key, no credit, or switched
 *    off), the gate's authored fallback answers. Nothing a learner does
 *    ever waits on Jev being up.
 * 3. **A breaker.** Three failures in a row stop calls for a minute, then
 *    one trial call decides whether to resume; each further failure doubles
 *    the pause, up to ten minutes. A 402 (credit ran out) or a refused key
 *    pauses for half an hour. So an outage costs the learner nothing, not an 8-second wait per
 *    tap.
 * 4. **A cache.** The same question on the same words, within an hour,
 *    gets the same answer without a call. Chips and common phrases repeat.
 * 5. **A limit per person.** A burst of 20, then one call every 30 seconds,
 *    per learner or address. Past it, the authored path. A runaway loop or
 *    a script can't run up the bill.
 * 6. **One retry** when Jev answered with a server error, never after a
 *    timeout (the learner has already waited) or a 402.
 * 7. **Answers are checked** against a schema before any reader sees them;
 *    a malformed answer is a failure, not a guess.
 * 8. **A ledger.** Every decision, from whichever rung, is handed to
 *    `record` (the `decisions` table when there's a database): the gate and
 *    question-set version, a hash of the input (never the words), the
 *    verdict, the answers, cost and latency. Recording can't fail a
 *    decision.
 *
 * The hedge band (read.ts) stays each gate's business: a gate's `read`
 * decides what a hedged answer means there (a question back to the
 * learner, the safer path, a person).
 *
 * State lives in this module, so it's per Worker isolate: good enough to
 * stop a stampede, and it resets on deploy. Pure apart from that state;
 * time and the network are injected so `pnpm check` can drive every path.
 */

import { z } from 'zod';
import { askJev, JevError, type JevAnswer, type Question } from './jev.ts';

export type Source = 'rule' | 'jev' | 'cache' | 'fallback';
export type FallbackReason =
  | 'off'
  | 'breaker'
  | 'limited'
  | 'timeout'
  | 'error'
  | 'invalid';

export type Gate<I, V> = {
  id: string;
  /** Bump when the questions' words change: cached answers and probe results belong to one version. */
  version: number;
  /** A sure answer from plain rules, or null to ask Jev. */
  rule?: (input: I) => V | null;
  /** What Jev reads: the learner's words go here, as data, never into instructions. */
  state: (input: I) => Record<string, unknown>;
  questions: (input: I) => Record<string, Question>;
  /** Jev's checked answers to a verdict, hedge band applied. */
  read: (answers: Record<string, JevAnswer>, input: I) => V;
  /** The authored answer when Jev can't be asked. */
  fallback: (input: I, reason: FallbackReason) => V;
  /** The input, normalised, for the cache: equal keys must deserve equal verdicts. */
  key: (input: I) => string;
  timeoutMs?: number;
};

export type Decision<V> = {
  verdict: V;
  source: Source;
  reason?: FallbackReason;
  usdMicros: number;
  latencyMs: number;
  model?: string;
};

export type LedgerEntry = {
  gate: string;
  version: number;
  inputHash: string;
  source: Source;
  reason: FallbackReason | null;
  verdict: unknown;
  answers: Record<string, JevAnswer> | null;
  model: string | null;
  usdMicros: number;
  latencyMs: number;
  client: string | null;
};

export type DecideOptions = {
  /** capabilities().jev: false means the authored path, always. */
  enabled: boolean;
  /** Who's asking (learner id or address), for the limit. */
  client?: string;
  record?: (entry: LedgerEntry) => Promise<void> | void;
  /** Injected in checks. */
  ask?: typeof askJev;
  now?: () => number;
};

/* ── Tuning, in one place ─────────────────────────────────────────────── */

export const BREAKER = {
  failures: 3,
  firstPauseMs: 60_000,
  maxPauseMs: 10 * 60_000,
  noCreditPauseMs: 30 * 60_000,
} as const;
export const CACHE = { entries: 500, ttlMs: 60 * 60_000 } as const;
export const LIMIT = { burst: 20, refillMs: 30_000, clients: 5_000 } as const;
const DEFAULT_TIMEOUT_MS = 6_000;
const RECORD_TIMEOUT_MS = 1_500;

/* ── State (per isolate) ──────────────────────────────────────────────── */

type BreakerState = {
  failures: number;
  pauseMs: number;
  openUntil: number;
  trial: boolean;
};
const breaker: BreakerState = {
  failures: 0,
  pauseMs: BREAKER.firstPauseMs,
  openUntil: 0,
  trial: false,
};
const cache = new Map<string, { verdict: unknown; expires: number }>();
const buckets = new Map<string, { tokens: number; at: number }>();

/** For checks: forget everything. */
export function resetDecisions(): void {
  Object.assign(breaker, {
    failures: 0,
    pauseMs: BREAKER.firstPauseMs,
    openUntil: 0,
    trial: false,
  });
  cache.clear();
  buckets.clear();
}

/** For checks and the probe: is the breaker holding calls back right now? */
export function breakerOpen(now: number): boolean {
  return breaker.openUntil > now;
}

function mayCall(now: number): boolean {
  if (breaker.openUntil > now) return false;
  // After a pause, exactly one trial call at a time decides whether to resume.
  if (breaker.failures >= BREAKER.failures) {
    if (breaker.trial) return false;
    breaker.trial = true;
  }
  return true;
}

function succeeded(): void {
  breaker.failures = 0;
  breaker.pauseMs = BREAKER.firstPauseMs;
  breaker.openUntil = 0;
  breaker.trial = false;
}

function failed(now: number, noCredit: boolean): void {
  breaker.trial = false;
  breaker.failures += 1;
  if (noCredit) {
    breaker.openUntil = now + BREAKER.noCreditPauseMs;
    breaker.failures = Math.max(breaker.failures, BREAKER.failures);
    return;
  }
  if (breaker.failures >= BREAKER.failures) {
    breaker.openUntil = now + breaker.pauseMs;
    breaker.pauseMs = Math.min(breaker.pauseMs * 2, BREAKER.maxPauseMs);
  }
}

function cached(key: string, now: number): unknown {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires <= now) {
    cache.delete(key);
    return undefined;
  }
  // Touch it, so the map's order is least recently used first.
  cache.delete(key);
  cache.set(key, hit);
  return hit.verdict;
}

function remember(key: string, verdict: unknown, now: number): void {
  cache.set(key, { verdict, expires: now + CACHE.ttlMs });
  while (cache.size > CACHE.entries) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/** A token bucket per client: `burst` calls at once, then one per `refillMs`. */
function allowed(client: string | undefined, now: number): boolean {
  if (!client) return true;
  const bucket = buckets.get(client) ?? { tokens: LIMIT.burst, at: now };
  let { tokens, at } = bucket;
  const earned = Math.floor((now - at) / LIMIT.refillMs);
  if (earned > 0) {
    tokens = Math.min(LIMIT.burst, tokens + earned);
    at += earned * LIMIT.refillMs;
  }
  // A full bucket earns nothing by waiting: its clock starts at the next call.
  if (tokens >= LIMIT.burst) at = now;
  buckets.delete(client);
  if (tokens <= 0) {
    buckets.set(client, { tokens: 0, at });
    return false;
  }
  buckets.set(client, { tokens: tokens - 1, at });
  while (buckets.size > LIMIT.clients) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
  return true;
}

/* ── Checking Jev's answers ───────────────────────────────────────────── */

const probability = z.number().min(0).max(1);
const answerSchema = z.object({
  type: z.enum(['noul', 'choice', 'score']),
  noul: probability.optional(),
  choice: z.string().optional(),
  confidence: probability.optional(),
  probabilities: z.record(z.string(), probability).optional(),
});

/** Every question asked must come back, well formed. */
function checkedAnswers(
  answers: unknown,
  asked: readonly string[],
): Record<string, JevAnswer> | null {
  const parsed = z.record(z.string(), answerSchema).safeParse(answers);
  if (!parsed.success) return null;
  for (const name of asked) if (!parsed.data[name]) return null;
  return parsed.data as Record<string, JevAnswer>;
}

/** FNV-1a, 32-bit, as hex: enough to group repeats in the ledger without keeping the words. */
export function hashOf(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/* ── decide() ─────────────────────────────────────────────────────────── */

export async function decide<I, V>(
  gate: Gate<I, V>,
  input: I,
  options: DecideOptions,
): Promise<Decision<V>> {
  const now = options.now ?? Date.now;
  const started = now();
  const key = `${gate.id}@${gate.version}:${gate.key(input)}`;
  let answers: Record<string, JevAnswer> | null = null;

  const finish = async (
    decision: Omit<Decision<V>, 'latencyMs'>,
  ): Promise<Decision<V>> => {
    const done = { ...decision, latencyMs: Math.max(0, now() - started) };
    if (options.record) {
      const entry: LedgerEntry = {
        gate: gate.id,
        version: gate.version,
        inputHash: hashOf(gate.key(input)),
        source: done.source,
        reason: done.reason ?? null,
        verdict: done.verdict,
        answers,
        model: done.model ?? null,
        usdMicros: done.usdMicros,
        latencyMs: done.latencyMs,
        client: options.client ?? null,
      };
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          Promise.resolve(options.record(entry)),
          new Promise((resolve) => {
            timer = setTimeout(resolve, RECORD_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        console.error('[decisions] could not record', gate.id, error);
      } finally {
        clearTimeout(timer);
      }
    }
    return done;
  };
  const fallback = (reason: FallbackReason) =>
    finish({
      verdict: gate.fallback(input, reason),
      source: 'fallback',
      reason,
      usdMicros: 0,
    });

  const ruled = gate.rule?.(input) ?? null;
  if (ruled !== null)
    return finish({ verdict: ruled, source: 'rule', usdMicros: 0 });
  if (!options.enabled) return fallback('off');

  const hit = cached(key, now());
  if (hit !== undefined)
    return finish({ verdict: hit as V, source: 'cache', usdMicros: 0 });

  if (!allowed(options.client, now())) return fallback('limited');
  if (!mayCall(now())) return fallback('breaker');

  const questions = gate.questions(input);
  const ask = options.ask ?? askJev;
  const call = () =>
    ask({
      state: gate.state(input),
      questions,
      timeoutMs: gate.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });

  let result: Awaited<ReturnType<typeof askJev>>;
  try {
    try {
      result = await call();
    } catch (error) {
      // One retry, only for a server error: a timeout has already cost the
      // learner the wait, and a 402 won't fix itself in a second.
      if (error instanceof JevError && error.status === 502)
        result = await call();
      else throw error;
    }
  } catch (error) {
    const status = error instanceof JevError ? error.status : 0;
    if (status === 503) {
      // Not configured: not Jev's failure, but a trial must still end.
      breaker.trial = false;
      return fallback('off');
    }
    // No credit, or a refused key: neither fixes itself in a minute.
    failed(now(), status === 402 || status === 401);
    return fallback(status === 504 ? 'timeout' : 'error');
  }

  answers = checkedAnswers(result.answers, Object.keys(questions));
  if (!answers) {
    failed(now(), false);
    return fallback('invalid');
  }
  succeeded();
  const verdict = gate.read(answers, input);
  remember(key, verdict, now());
  return finish({
    verdict,
    source: 'jev',
    usdMicros: result.usdMicros,
    model: result.model,
  });
}
