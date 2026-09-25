import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

/**
 * The database, over whichever driver fits the URL.
 *
 * - **Neon** (`*.neon.tech`, production and shared dev): Neon's HTTP driver.
 *   No connection to hold, which suits a Worker. No interactive
 *   transactions either, so anything that must land together is one SQL
 *   statement (plan §3).
 *   One client per isolate, keyed by URL so a rotated secret takes effect
 *   without a redeploy. (Pattern from Kanea Studio.)
 * - **Anything else** (a local Postgres, CI): node-postgres, loaded only
 *   then, so the Neon path never ships it. A new pool per request; see below.
 */

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let cached: { url: string; db: Db } | undefined;

export async function getDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error(
      'DATABASE_URL is not set; check capabilities().database first.',
    );
  if (cached?.url === url) return cached.db;

  if (new URL(url).hostname.endsWith('.neon.tech')) {
    const [{ neon }, { drizzle }] = await Promise.all([
      import('@neondatabase/serverless'),
      import('drizzle-orm/neon-http'),
    ]);
    const db = drizzle(neon(url), { schema }) as unknown as Db;
    cached = { url, db };
    return db;
  }

  /*
   * node-postgres: a fresh pool for every request, never cached. The Workers
   * runtime forbids one request from using a socket another request opened,
   * and a reused pool connection hangs until the runtime cancels the request
   * (found 25 Sep 2026: the second request after a restart always failed).
   * The sockets close with the request. This path is for a local Postgres
   * and CI only; production is Neon over HTTP, above.
   */
  const [{ default: pg }, { drizzle }] = await Promise.all([
    import('pg'),
    import('drizzle-orm/node-postgres'),
  ]);
  return drizzle(new pg.Pool({ connectionString: url, max: 1 }), {
    schema,
  }) as unknown as Db;
}

export { schema };
