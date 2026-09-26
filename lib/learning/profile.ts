/**
 * Onboarding profiles: validated, placed by the server, stored in one SQL
 * statement.
 *
 * The browser sends answers only. Placement (where the learner starts) is
 * recomputed here with the same pure code the browser used
 * (lib/onboarding/flow.ts), so a tampered request can't place itself
 * anywhere odd. That's the same rule runs follow (CLAUDE.md: never trust a
 * number from the browser).
 */

import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db';
import { ApiError } from '@/lib/api';
import {
  EXPERIENCES,
  GOALS,
  MARKETS,
  MINUTES,
  SCAM_READS,
  placement,
  type Placement,
  type Profile,
} from '@/lib/onboarding/flow';

export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(24).optional(),
    goal: z.enum(GOALS).optional(),
    experience: z.enum(EXPERIENCES).optional(),
    markets: z.array(z.enum(MARKETS)).max(MARKETS.length).optional(),
    recoveryAnswerBp: z
      .number()
      .int()
      .min(0)
      .max(100_000)
      .nullable()
      .optional(),
    scam: z.enum(SCAM_READS).optional(),
    minutes: z
      .number()
      .refine((value): value is (typeof MINUTES)[number] =>
        (MINUTES as readonly number[]).includes(value),
      )
      .optional(),
  })
  .strict();

export type Stored = { profile: Profile; placement: Placement };

export function parseProfile(input: unknown): Profile {
  const parsed = profileSchema.safeParse(
    (input as { profile?: unknown } | null)?.profile,
  );
  if (!parsed.success)
    throw new ApiError(422, 'Those answers aren’t in a shape we can keep.');
  return parsed.data as Profile;
}

/**
 * The learner id to store under: the account's, if this account already has
 * a profile from another device; otherwise this device's.
 */
export async function learnerForAccount(
  db: Db,
  clerkUserId: string | null,
  deviceLearnerId: string,
): Promise<string> {
  if (!clerkUserId) return deviceLearnerId;
  const found = await db.execute(
    sql`select learner_id from learner_profiles where clerk_user_id = ${clerkUserId} limit 1`,
  );
  const row = (found as unknown as { rows?: { learner_id: string }[] })
    .rows?.[0];
  return row?.learner_id ?? deviceLearnerId;
}

export async function saveProfile(
  db: Db,
  learnerId: string,
  clerkUserId: string | null,
  profile: Profile,
  country: string | null,
): Promise<Stored> {
  const placed = placement(profile);
  await db.execute(sql`
    with learner as (
      insert into learners (id, country) values (${learnerId}, ${country})
      on conflict (id) do update set last_seen_at = now()
      returning id
    )
    insert into learner_profiles (learner_id, clerk_user_id, profile, placement)
    select learner.id, ${clerkUserId}, ${JSON.stringify(profile)}::jsonb, ${JSON.stringify(placed)}::jsonb from learner
    on conflict (learner_id) do update set
      clerk_user_id = coalesce(excluded.clerk_user_id, learner_profiles.clerk_user_id),
      profile = excluded.profile,
      placement = excluded.placement,
      updated_at = now()
  `);
  return { profile, placement: placed };
}

export async function loadProfile(
  db: Db,
  learnerId: string,
  clerkUserId: string | null,
): Promise<Stored | null> {
  const found = await db.execute(
    clerkUserId
      ? sql`select profile from learner_profiles where clerk_user_id = ${clerkUserId} or learner_id = ${learnerId} order by (clerk_user_id = ${clerkUserId}) desc nulls last limit 1`
      : sql`select profile from learner_profiles where learner_id = ${learnerId} limit 1`,
  );
  const row = (found as unknown as { rows?: { profile: unknown }[] }).rows?.[0];
  if (!row) return null;
  const parsed = profileSchema.safeParse(row.profile);
  if (!parsed.success) return null;
  const profile = parsed.data as Profile;
  // Placed again on the way out: a change to the placement rules reaches
  // everyone on their next visit, with no migration.
  return { profile, placement: placement(profile) };
}
