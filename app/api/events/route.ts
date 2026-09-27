import { getDb } from '@/db';
import { json, readJson, route } from '@/lib/api';
import { capabilities } from '@/lib/capabilities';
import { learnerOf } from '@/lib/learning/account';
import {
  isTestTraffic,
  learnerCookie,
  recordEvent,
} from '@/lib/learning/store';

/**
 * Something the learner did (lib/client/progress.ts), kept under the
 * account's learner when signed in, so every device sees it
 * (lib/learning/account.ts). Answers 204 and stores nothing when there's no
 * database: the learning works either way, only our record of it needs one.
 */
export const POST = route(async (request) => {
  if (!capabilities().database || isTestTraffic(request))
    return new Response(null, { status: 204 });
  const db = await getDb();
  const who = await learnerOf(db, request);
  await recordEvent(
    db,
    who.id,
    await readJson(request, 8 * 1024),
    request.headers.get('cf-ipcountry'),
  );
  const secure = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true },
    201,
    who.device.fresh
      ? { 'Set-Cookie': learnerCookie(who.device.id, secure) }
      : undefined,
  );
});
