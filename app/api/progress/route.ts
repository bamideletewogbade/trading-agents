import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { json, route } from '@/lib/api';
import { signedInUser } from '@/lib/auth/server';
import { capabilities } from '@/lib/capabilities';
import { learnerFrom } from '@/lib/learning/store';
import { learnerForAccount } from '@/lib/learning/profile';

/**
 * Finished lessons, derived from the event log (never stored as a column,
 * plan §3): every `lesson_completed` event for this device's learner, or
 * the account's learner when signed in, with when it happened and the
 * first-try score. The phone works out XP, streaks and badges from this
 * (lib/progress/habit.ts).
 */
export const GET = route(async (request) => {
  if (!capabilities().database) return json({ completed: [], log: [] });
  const device = learnerFrom(request);
  const db = await getDb();
  const learnerId = await learnerForAccount(
    db,
    await signedInUser(request),
    device.id,
  );
  const result = await db.execute(
    sql`select skill, created_at, data from learning_events
         where learner_id = ${learnerId} and type = 'lesson_completed' and skill is not null
         order by created_at limit 5000`,
  );
  const rows =
    (
      result as unknown as {
        rows?: { skill: string; created_at: string | Date; data: unknown }[];
      }
    ).rows ?? [];
  const count = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;
  const log = rows.map((row) => {
    const data = (row.data ?? {}) as { right?: unknown; total?: unknown };
    return {
      id: row.skill,
      at: new Date(row.created_at).getTime(),
      right: count(data.right),
      total: count(data.total),
    };
  });
  return json({ completed: [...new Set(log.map((c) => c.id))], log });
});
