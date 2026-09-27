import { getDb } from '@/db';
import { ApiError, json, readJson, route } from '@/lib/api';
import { capabilities } from '@/lib/capabilities';
import { learnerOf } from '@/lib/learning/account';
import { learnerCookie } from '@/lib/learning/store';
import { parseLog, type LogName } from '@/lib/sync/schemas';
import { appendLog, readLog } from '@/lib/sync/store';

/**
 * The journal's and the paper account's logs, kept with the learner (the
 * account's, when signed in) so they follow a person between devices.
 * GET pulls the whole log; POST adds events the server hasn't seen. Both
 * logs only ever grow, so the device and the server meet by keeping
 * everything either has (lib/sync/log.ts).
 *
 * Pulling while signed in also moves this device's guest history into the
 * account, once. Without a database, the answer says so and the device
 * keeps its own log.
 */

function logName(value: unknown): LogName {
  if (value === 'journal' || value === 'paper') return value;
  throw new ApiError(400, 'Which log? journal or paper.');
}

function withCookie(fresh: boolean, id: string, request: Request) {
  return fresh
    ? {
        'Set-Cookie': learnerCookie(
          id,
          new URL(request.url).protocol === 'https:',
        ),
      }
    : undefined;
}

export const GET = route(async (request) => {
  const name = logName(new URL(request.url).searchParams.get('log'));
  if (!capabilities().database) return json({ available: false, events: [] });
  const db = await getDb();
  const who = await learnerOf(db, request, { merge: true });
  const events = await readLog(db, who.id, name);
  return json(
    { available: true, signedIn: who.signedIn, events },
    200,
    withCookie(who.device.fresh, who.device.id, request),
  );
});

export const POST = route(
  async (request) => {
    const body = (await readJson(request, 512 * 1024)) as {
      log?: unknown;
      events?: unknown;
    };
    const name = logName(body.log);
    if (!capabilities().database) return json({ available: false, stored: 0 });
    const { events, refused } = parseLog(name, body.events);
    const db = await getDb();
    const who = await learnerOf(db, request);
    await appendLog(db, who.id, name, events);
    return json(
      { available: true, stored: events.length, refused },
      200,
      withCookie(who.device.fresh, who.device.id, request),
    );
  },
  { maxBytes: 512 * 1024 },
);
