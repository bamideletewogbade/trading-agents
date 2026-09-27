/**
 * Whose data a request reads and writes (docs/member-app-plan.md, account
 * sync).
 *
 * A device starts as an anonymous learner, an id in a cookie
 * (lib/learning/store.ts). Signed in, it's the account's learner instead:
 * the first sign-in links the account to a learner (the one holding its
 * onboarding profile, if it made one, or this device's), in one SQL
 * statement, and every device signed in to the account uses it from then
 * on. So lessons, practice, the journal and the paper account follow a
 * person, not a device.
 *
 * `merge` moves what this device did as a guest into the account, once it
 * signs in: its events join the account's learner, unless this device's
 * learner already belongs to someone (a shared device). The sync route asks
 * for it; plain reads don't pay for it.
 *
 * If the accounts table isn't there yet (the migration hasn't been applied)
 * it falls back to the older rule (the profile's learner, or the device's),
 * so a deploy that runs ahead of a migration degrades instead of failing.
 */

import { sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { signedInUser } from '@/lib/auth/server';
import { learnerForAccount } from './profile';
import { learnerFrom } from './store';

export type Who = {
  /** The learner to read and write. */
  id: string;
  /** This device's cookie learner, and whether the cookie is new. */
  device: { id: string; fresh: boolean };
  signedIn: boolean;
};

function rowsOf<T>(result: unknown): T[] {
  return (result as { rows?: T[] }).rows ?? [];
}

async function linkedLearner(
  db: Db,
  user: string,
  deviceId: string,
): Promise<string> {
  const linked = rowsOf<{ learner_id: string }>(
    await db.execute(sql`
      with found as (
        select learner_id from accounts where clerk_user_id = ${user}
      ),
      legacy as (
        select learner_id from learner_profiles
         where clerk_user_id = ${user} limit 1
      ),
      device as (
        insert into learners (id) values (${deviceId})
        on conflict (id) do update set last_seen_at = now()
        returning id
      ),
      linked as (
        insert into accounts (clerk_user_id, learner_id)
        select ${user}, coalesce((select learner_id from legacy), (select id from device))
         where not exists (select 1 from found)
        on conflict (clerk_user_id) do nothing
        returning learner_id
      )
      select learner_id from found
      union all
      select learner_id from linked
      limit 1`),
  )[0]?.learner_id;
  if (linked) return linked;
  // Two first requests raced; the other one's link stands.
  const again = rowsOf<{ learner_id: string }>(
    await db.execute(
      sql`select learner_id from accounts where clerk_user_id = ${user}`,
    ),
  )[0]?.learner_id;
  return again ?? deviceId;
}

export async function learnerOf(
  db: Db,
  request: Request,
  options: { merge?: boolean } = {},
): Promise<Who> {
  const device = learnerFrom(request);
  const user = await signedInUser(request);
  if (!user) return { id: device.id, device, signedIn: false };
  let id: string;
  try {
    id = await linkedLearner(db, user, device.id);
  } catch (error) {
    console.error('[account] link failed; using the older rule', error);
    return {
      id: await learnerForAccount(db, user, device.id),
      device,
      signedIn: true,
    };
  }
  if (options.merge && id !== device.id && !device.fresh) {
    try {
      await db.execute(sql`
        update learning_events set learner_id = ${id}
         where learner_id = ${device.id}
           and not exists (select 1 from accounts where learner_id = ${device.id})
           and not exists (
             select 1 from learner_profiles
              where learner_id = ${device.id} and clerk_user_id is not null
           )`);
    } catch (error) {
      console.error('[account] could not move guest events', error);
    }
  }
  return { id, device, signedIn: true };
}
