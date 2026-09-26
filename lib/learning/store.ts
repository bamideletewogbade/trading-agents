import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db';
import { ApiError } from '@/lib/api';
import { isCountryCode } from '@/lib/core/country';

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

export const TEST_COOKIE = 'sika_test';

/**
 * Traffic from our own checks (`pnpm walk --test` after a deploy) carries
 * this cookie and is answered but never stored, so the pilot's numbers count
 * learners, not robots.
 */
export function isTestTraffic(request: Request): boolean {
  return new RegExp(`(?:^|;\\s*)${TEST_COOKIE}=1(?:;|$)`).test(
    request.headers.get('cookie') ?? '',
  );
}

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
