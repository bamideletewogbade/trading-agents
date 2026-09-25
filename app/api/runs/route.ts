import { getDb } from '@/db';
import { json, readJson, route } from '@/lib/api';
import { capabilities } from '@/lib/capabilities';
import {
  isTestTraffic,
  learnerCookie,
  learnerFrom,
  recordRun,
} from '@/lib/learning/store';

/**
 * A finished run: config, seed and actions. The server replays it through
 * its own copy of the engine before storing anything (lib/learning/store.ts).
 */
export const POST = route(async (request) => {
  if (!capabilities().database || isTestTraffic(request))
    return new Response(null, { status: 204 });
  const learner = learnerFrom(request);
  const { summary } = await recordRun(
    await getDb(),
    learner.id,
    await readJson(request, 32 * 1024),
  );
  const secure = new URL(request.url).protocol === 'https:';
  return json(
    { summary },
    201,
    learner.fresh
      ? { 'Set-Cookie': learnerCookie(learner.id, secure) }
      : undefined,
  );
});
