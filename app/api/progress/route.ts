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
 * the account's learner when signed in.
 */
export const GET = route(async (request) => {
  if (!capabilities().database) return json({ completed: [] });
  const device = learnerFrom(request);
  const db = await getDb();
  const learnerId = await learnerForAccount(
    db,
    await signedInUser(request),
    device.id,
  );
  const result = await db.execute(
    sql`select distinct skill from learning_events where learner_id = ${learnerId} and type = 'lesson_completed' and skill is not null`,
  );
  const rows = (result as unknown as { rows?: { skill: string }[] }).rows ?? [];
  return json({ completed: rows.map((row) => row.skill) });
});
