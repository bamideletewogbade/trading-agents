import { readFileSync } from 'node:fs';
import type { Config } from 'drizzle-kit';

/**
 * drizzle-kit runs in plain Node, outside the Worker, so nothing has loaded
 * `.dev.vars` for it. Reading the file here means `pnpm db:push` uses exactly
 * the database the dev server uses. (Ported from Kanea Studio.)
 */
function fromDevVars(key: string): string | undefined {
  try {
    const contents = readFileSync('.dev.vars', 'utf8').replace(/^﻿/, '');
    for (const line of contents.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match?.[1] === key)
        return match[2]?.trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Absent in CI and in production, where the environment is authoritative.
  }
  return undefined;
}

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? fromDevVars('DATABASE_URL') ?? '',
  },
} satisfies Config;
