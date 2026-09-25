/**
 * Applies the SQL migrations in db/migrations to DATABASE_URL, once each.
 *
 *     pnpm db:generate     after changing db/schema.ts: writes the next migration
 *     pnpm db:migrate      applies any not yet applied (tracked by Drizzle)
 *
 * Over the same drivers the app uses (db/index.ts): Neon's HTTP driver for a
 * *.neon.tech URL, so it works from anywhere HTTPS does, including networks
 * that block Postgres's port 5432 (found 25 Sep 2026: `drizzle-kit push`
 * hangs in cloud sessions for exactly that reason); node-postgres for any
 * other URL, such as a local database or CI.
 *
 * Migration files are committed, so every database, local or production,
 * gets the same history in the same order.
 */

import { readFileSync } from 'node:fs';

function fromDevVars(key: string): string | undefined {
  try {
    for (const line of readFileSync('.dev.vars', 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match?.[1] === key)
        return match[2]?.trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .dev.vars: the environment is authoritative (CI, deploy).
  }
  return undefined;
}

const url = process.env.DATABASE_URL?.trim() || fromDevVars('DATABASE_URL');
if (!url) {
  console.error('DATABASE_URL is not set (environment or .dev.vars).');
  process.exit(1);
}

const host = new URL(url).hostname;
const folder = { migrationsFolder: 'db/migrations' };

if (host.endsWith('.neon.tech')) {
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(drizzle(neon(url)), folder);
} else {
  const { default: pg } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  await migrate(drizzle(pool), folder);
  await pool.end();
}
console.log(
  `✓ migrations applied to ${host.endsWith('.neon.tech') ? 'Neon' : host}`,
);
