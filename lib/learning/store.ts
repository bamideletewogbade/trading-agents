import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db';
import { ApiError } from '@/lib/api';
import { isCountryCode } from '@/lib/core/country';
import { experience } from '@/lib/experiences/registry';
import { replay } from '@/lib/experiences/types';

/**
 * Saving what learners do: who (an anonymous learner id in a cookie), what
 * they played (runs), and what happened (events).
 *
 * Every write is **one SQL statement** that also creates the learner if this
 * is their first visit, so a learner row exists before anything points at it
 * without a second round trip, and a Neon HTTP connection (no transactions)
 * can never leave half a write behind.
 */

export const LEARNER_COOKIE = 'sika_lid';
const ONE_YEAR = 60 * 60 * 24 * 365;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** The learner this request belongs to: the cookie's id, or a new one. */
export function learnerFrom(request: Request): { id: string; fresh: boolean } {
  const cookie = request.headers.get('cookie') ?? '';
  const match = new RegExp(`(?:^|;\\s*)${LEARNER_COOKIE}=([^;]+)`).exec(cookie);
  const id = match?.[1];
  return id && UUID.test(id)
    ? { id, fresh: false }
    : { id: crypto.randomUUID(), fresh: true };
}

/**
 * HttpOnly, so no script can read it; Lax, so it rides along when someone
 * follows a link in; a year, because learning takes longer than a session.
 * It identifies a device's progress and nothing else.
 */
export function learnerCookie(id: string, secure: boolean): string {
  return `${LEARNER_COOKIE}=${id}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

const eventSchema = z.object({
  type: z.string().regex(/^[a-z][a-z_]{1,39}$/),
  runId: z.string().regex(UUID).optional(),
  skill: z.string().max(60).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});

export async function recordEvent(
  db: Db,
  learnerId: string,
  input: unknown,
  country: string | null,
): Promise<void> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(422, 'That event is not one we record.');
  const event = parsed.data;
  const data = JSON.stringify(event.data);
  if (data.length > 4096)
    throw new ApiError(413, 'That event carries too much.');
  const place = country && isCountryCode(country) ? country : null;
  await db.execute(sql`
    with learner as (
      insert into learners (id, country) values (${learnerId}, ${place})
      on conflict (id) do update set last_seen_at = now()
      returning id
    )
    insert into learning_events (learner_id, run_id, type, skill, data)
    select learner.id, ${event.runId ?? null}, ${event.type}, ${event.skill ?? null}, ${data}::jsonb from learner
  `);
}

const runSchema = z.object({
  id: z.string().regex(UUID),
  parentId: z.string().regex(UUID).optional(),
  experience: z.string().max(40),
  version: z.number().int().min(1),
  config: z.unknown(),
  seed: z.string().min(1).max(64),
  actions: z.array(z.unknown()).max(200),
});

/**
 * Save a run, after replaying it here. The browser sends inputs only; the
 * summary stored is what this server's copy of the engine says those inputs
 * produce. A run that doesn't replay (tampered, or an old engine version) is
 * refused rather than stored.
 */
export async function recordRun(
  db: Db,
  learnerId: string,
  input: unknown,
): Promise<{ summary: unknown }> {
  const parsed = runSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(422, 'That run is not one we can read.');
  const run = parsed.data;

  let summary: unknown;
  let config: unknown;
  let actions: unknown[];
  try {
    const found = experience(run.experience);
    config = found.parseConfig(run.config);
    actions = run.actions.map((action) => found.parseAction(action));
    const { state } = replay(found, {
      experience: run.experience,
      version: run.version,
      config,
      seed: run.seed,
      actions,
    });
    summary = found.facts(state);
  } catch {
    throw new ApiError(422, 'That run does not replay.');
  }

  await db.execute(sql`
    with learner as (
      insert into learners (id) values (${learnerId})
      on conflict (id) do update set last_seen_at = now()
      returning id
    )
    insert into experience_runs (id, learner_id, parent_id, experience, engine_version, config, seed, actions, summary)
    select ${run.id}, learner.id, ${run.parentId ?? null}, ${run.experience}, ${run.version},
           ${JSON.stringify(config)}::jsonb, ${run.seed}, ${JSON.stringify(actions)}::jsonb, ${JSON.stringify(summary)}::jsonb
      from learner
    on conflict (id) do nothing
  `);
  return { summary };
}
