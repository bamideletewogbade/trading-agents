/**
 * `decide()`'s options for a request: whether Jev is on, who's asking (for
 * the per-person limit), and where the ledger goes. Routes call
 * `decideFor(request, gate, input)` and never think about any of it.
 */

import { getDb } from '@/db';
import { decisions } from '@/db/schema';
import { capabilities } from '@/lib/capabilities';
import { isTestTraffic, learnerFrom } from '@/lib/learning/store';
import { decide, type Decision, type Gate, type LedgerEntry } from './gate';

/** The learner's id when they have one; otherwise their address, so a guest still has a limit. */
function clientOf(request: Request): {
  client: string;
  learnerId: string | null;
} {
  const learner = learnerFrom(request);
  if (!learner.fresh) return { client: learner.id, learnerId: learner.id };
  const address =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  return { client: `ip:${address}`, learnerId: null };
}

async function recordTo(entry: LedgerEntry, learnerId: string | null) {
  const db = await getDb();
  await db.insert(decisions).values({
    gate: entry.gate,
    version: entry.version,
    inputHash: entry.inputHash,
    source: entry.source,
    reason: entry.reason,
    verdict: entry.verdict as object,
    answers: entry.answers,
    model: entry.model,
    usdMicros: entry.usdMicros,
    latencyMs: entry.latencyMs,
    learnerId,
  });
}

export function decideFor<I, V>(
  request: Request,
  gate: Gate<I, V>,
  input: I,
): Promise<Decision<V>> {
  const can = capabilities();
  const { client, learnerId } = clientOf(request);
  // Walks and screenshots mark themselves as tests: they still decide, but
  // stay out of the ledger that measures real learners.
  const ledger = can.database && !isTestTraffic(request);
  return decide(gate, input, {
    enabled: can.jev,
    client,
    record: ledger ? (entry) => recordTo(entry, learnerId) : undefined,
  });
}
