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
 * first-try score, plus the practice log (questions missed, practice
 * answers). The phone works out XP, streaks, badges and what to practise
 * from these (lib/progress/habit.ts, lib/progress/review.ts).
 */
export const GET = route(async (request) => {
  if (!capabilities().database)
    return json({ completed: [], log: [], practice: [] });
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
  // Practice: every question missed in a lesson and every practice answer.
  const answers = await db.execute(
    sql`select type, skill, created_at, data from learning_events
         where learner_id = ${learnerId} and type in ('question_missed', 'question_reviewed')
           and skill is not null
         order by created_at limit 5000`,
  );
  const practiceRows =
    (
      answers as unknown as {
        rows?: {
          type: string;
          skill: string;
          created_at: string | Date;
          data: unknown;
        }[];
      }
    ).rows ?? [];
  const practice = practiceRows.flatMap((row) => {
    const data = (row.data ?? {}) as { key?: unknown; right?: unknown };
    if (typeof data.key !== 'string') return [];
    const kind =
      row.type === 'question_missed'
        ? 'missed'
        : data.right === true
          ? 'right'
          : 'wrong';
    return [
      {
        kind,
        key: data.key,
        lesson: row.skill,
        at: new Date(row.created_at).getTime(),
      },
    ];
  });
  return json({ completed: [...new Set(log.map((c) => c.id))], log, practice });
});
