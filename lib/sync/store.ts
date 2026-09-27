/**
 * The journal's and the paper account's logs in the database: rows of
 * `learning_events` whose id is the event's own id, so storing an event
 * twice (a retry, a second device) is a no-op, and a learner's log is
 * every row of its type. Append only: nothing here updates or deletes.
 */

import { sql } from 'drizzle-orm';
import type { Db } from '@/db';
import type { JournalEvent } from '@/lib/engines/journal';
import type { PaperEvent } from '@/lib/engines/paper';
import type { LogName } from './schemas';

const TYPE: Record<LogName, string> = {
  journal: 'journal_event',
  paper: 'paper_event',
};

export async function readLog<T extends JournalEvent | PaperEvent>(
  db: Db,
  learnerId: string,
  name: LogName,
): Promise<T[]> {
  const result = await db.execute(
    sql`select data from learning_events
         where learner_id = ${learnerId} and type = ${TYPE[name]}
         order by created_at limit 5000`,
  );
  return ((result as unknown as { rows?: { data: T }[] }).rows ?? []).map(
    (row) => row.data,
  );
}

/** Store events not seen before, in one statement. */
export async function appendLog(
  db: Db,
  learnerId: string,
  name: LogName,
  events: readonly (JournalEvent | PaperEvent)[],
): Promise<void> {
  if (!events.length) return;
  const rows = JSON.stringify(events.map((e) => ({ id: e.id, data: e })));
  await db.execute(sql`
    with learner as (
      insert into learners (id) values (${learnerId})
      on conflict (id) do update set last_seen_at = now()
      returning id
    )
    insert into learning_events (id, learner_id, type, data)
    select (row->>'id')::uuid, learner.id, ${TYPE[name]}, row->'data'
      from learner, jsonb_array_elements(${rows}::jsonb) as row
    on conflict (id) do nothing`);
}
