import { getDb } from '@/db';
import { json, readJson, route } from '@/lib/api';
import { capabilities } from '@/lib/capabilities';
import {
  isTestTraffic,
  learnerCookie,
  learnerFrom,
  recordEvent,
} from '@/lib/learning/store';

/**
 * Something the learner did (lib/client/track.ts). Answers 204 and stores
 * nothing when there's no database: the learning works either way, only our
 * measurement of it needs one.
 */
export const POST = route(async (request) => {
  if (!capabilities().database || isTestTraffic(request))
    return new Response(null, { status: 204 });
  const learner = learnerFrom(request);
  await recordEvent(
    await getDb(),
    learner.id,
    await readJson(request, 8 * 1024),
    request.headers.get('cf-ipcountry'),
  );
  const secure = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true },
    201,
    learner.fresh
      ? { 'Set-Cookie': learnerCookie(learner.id, secure) }
      : undefined,
  );
});
