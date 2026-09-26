import { getDb } from '@/db';
import { json, readJson, route } from '@/lib/api';
import { signedInUser } from '@/lib/auth/server';
import { capabilities } from '@/lib/capabilities';
import { isCountryCode } from '@/lib/core/country';
import {
  isTestTraffic,
  learnerCookie,
  learnerFrom,
} from '@/lib/learning/store';
import {
  learnerForAccount,
  loadProfile,
  parseProfile,
  saveProfile,
} from '@/lib/learning/profile';

/**
 * The onboarding profile: GET returns it (placed by the server), POST saves
 * answers and returns the placement. With no database, both answer 204 and
 * the browser keeps its own copy (components/onboarding). With an account,
 * the profile follows the account to any device: the device's cookie is
 * pointed at the account's learner.
 */

function cookieHeaders(request: Request, id: string, current: string) {
  if (id === current && !learnerFrom(request).fresh) return undefined;
  const secure = new URL(request.url).protocol === 'https:';
  return { 'Set-Cookie': learnerCookie(id, secure) };
}

export const GET = route(async (request) => {
  if (!capabilities().database) return new Response(null, { status: 204 });
  const device = learnerFrom(request);
  const clerkUserId = await signedInUser(request);
  const db = await getDb();
  const stored = await loadProfile(db, device.id, clerkUserId);
  // No profile yet is an ordinary answer, not an error: the desk offers the chat.
  return json(stored ?? { profile: null });
});

export const POST = route(async (request) => {
  const profile = parseProfile(await readJson(request, 4 * 1024));
  if (!capabilities().database || isTestTraffic(request))
    return new Response(null, { status: 204 });
  const device = learnerFrom(request);
  const clerkUserId = await signedInUser(request);
  const db = await getDb();
  const learnerId = await learnerForAccount(db, clerkUserId, device.id);
  const country = request.headers.get('cf-ipcountry');
  const stored = await saveProfile(
    db,
    learnerId,
    clerkUserId,
    profile,
    country && isCountryCode(country) ? country : null,
  );
  return json(stored, 201, cookieHeaders(request, learnerId, device.id));
});
