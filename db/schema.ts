import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * The Phase 1 database: who is learning, what they played, and what
 * happened. Plan §12 lists the rest, which arrives with the phases that need
 * it.
 *
 * Progress is an **event log**, not columns on the learner (plan §3):
 * `learning_events` is append-only, and anything shown as progress is derived
 * from it. Gamification rules will change weekly; migrations shouldn't.
 */

/**
 * One row per person, or per device until they sign in: a learner starts
 * anonymous (no phone) with an id kept in a cookie, and gains a phone number
 * when they continue on WhatsApp (plan §10.4). No name, no email. The phone
 * is the only personal data we hold, and only once they give it.
 */
export const learners = pgTable('learners', {
  id: uuid('id').primaryKey(),
  phone: text('phone').unique(),
  country: text('country'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A run is its inputs (`config`, `seed`, `actions`) and nothing else that
 * matters: the server replays those through the engine and stores what came
 * out as `summary`, so a number sent by a browser is never trusted (plan
 * §4.3). A What-If is a run whose `parent_id` is the run it changed.
 */
export const experienceRuns = pgTable(
  'experience_runs',
  {
    id: uuid('id').primaryKey(),
    learnerId: uuid('learner_id')
      .notNull()
      .references(() => learners.id),
    parentId: uuid('parent_id'),
    experience: text('experience').notNull(),
    engineVersion: integer('engine_version').notNull(),
    config: jsonb('config').notNull(),
    seed: text('seed').notNull(),
    actions: jsonb('actions').notNull(),
    summary: jsonb('summary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('experience_runs_learner_idx').on(table.learnerId, table.createdAt),
  ],
);

/**
 * What happened, one row per thing: `played`, `whatif_played`,
 * `another_requested`. Phase 1's exit criteria are counted from here (the
 * share of people who ask for another month or try a What-If unprompted).
 */
export const learningEvents = pgTable(
  'learning_events',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    learnerId: uuid('learner_id')
      .notNull()
      .references(() => learners.id),
    runId: uuid('run_id'),
    type: text('type').notNull(),
    skill: text('skill'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('learning_events_learner_idx').on(table.learnerId, table.createdAt),
    index('learning_events_type_idx').on(table.type, table.createdAt),
  ],
);

/**
 * What onboarding learned about someone, and where it placed them. One row
 * per learner. `clerk_user_id` joins a device's learner to an account, so
 * signing in on a second phone finds the same profile.
 *
 * `placement` is what the server's copy of lib/onboarding/flow.ts computed
 * from `profile`, never what a browser sent. The profile is small on
 * purpose: a first name and answers to seven questions. No email, no phone.
 */
export const learnerProfiles = pgTable('learner_profiles', {
  learnerId: uuid('learner_id')
    .primaryKey()
    .references(() => learners.id),
  clerkUserId: text('clerk_user_id').unique(),
  profile: jsonb('profile').notNull(),
  placement: jsonb('placement').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
