/**
 * Append-only logs that merge by id. The journal and the paper account
 * keep what happened as events that never change once written, each with
 * its own id, so bringing two copies together (this device and the
 * account, or two devices) is keeping every event either side has. Nothing
 * is overwritten, so nothing is lost when both changed.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

export type Logged = { readonly id: string; readonly at: number };

function byTime(a: Logged, b: Logged): number {
  return a.at - b.at || a.id.localeCompare(b.id);
}

/** Every event from both sides, once each, in time order. On an id clash the first side's copy stays. */
export function unionById<T extends Logged>(
  a: readonly T[],
  b: readonly T[],
): T[] {
  const kept = new Map<string, T>();
  for (const event of [...a, ...b])
    if (!kept.has(event.id)) kept.set(event.id, event);
  return [...kept.values()].sort(byTime);
}

/** The events in `from` that `have` lacks: what to send the other side. */
export function missingFrom<T extends Logged>(
  have: readonly Logged[],
  from: readonly T[],
): T[] {
  const ids = new Set(have.map((e) => e.id));
  return from.filter((e) => !ids.has(e.id));
}
