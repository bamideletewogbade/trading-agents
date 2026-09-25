/**
 * Sends the Worker its secrets, printing names and lengths only, never
 * values. Run after a build, so dist/server/wrangler.json exists.
 *
 *     pnpm secrets --site https://sika-lab.<you>.workers.dev
 *
 * Values come from the environment first (CI, a cloud session), then from
 * .dev.vars. Three rules are enforced, not just documented:
 *
 * - Only names on ALLOW are ever sent.
 * - A DATABASE_URL pointing at this machine (localhost, 127.0.0.1) is
 *   refused: a local development database must never become production's.
 * - SITE_URL is always the production address given with --site (or
 *   SITE_URL_PRODUCTION), never the localhost value in .dev.vars, because it
 *   goes into metadata and every link we send.
 *
 * Ported from Kanea Studio.
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ALLOW = ['DATABASE_URL', 'OPENROUTER_API_KEY', 'OPENROUTER_HAS_CREDIT'];

function devVars() {
  try {
    return Object.fromEntries(
      readFileSync('.dev.vars', 'utf8')
        .replace(/^﻿/, '')
        .split(/\r?\n/)
        .map((line) => /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line))
        .filter(Boolean)
        .map((match) => [match[1], match[2].trim()]),
    );
  } catch {
    return {};
  }
}

const file = devVars();
const value = (name) => (process.env[name]?.trim() || file[name] || '').trim();

const siteFlag = process.argv.indexOf('--site');
const site = (
  siteFlag > -1 ? process.argv[siteFlag + 1] : process.env.SITE_URL_PRODUCTION
)?.replace(/\/$/, '');
if (!site || !site.startsWith('https://')) {
  console.error(
    'Give the production address: pnpm secrets --site https://sika-lab.<you>.workers.dev',
  );
  process.exit(1);
}

const toSend = {};
for (const name of ALLOW) {
  const found = value(name);
  if (!found) continue;
  if (
    name === 'DATABASE_URL' &&
    /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(found)
  ) {
    console.log(
      `– ${name.padEnd(24)} refused: it points at this machine, not a production database`,
    );
    continue;
  }
  toSend[name] = found;
}
toSend.SITE_URL = site;

let failed = false;
for (const [name, secret] of Object.entries(toSend)) {
  const result = spawnSync(
    'npx',
    [
      'wrangler',
      'secret',
      'put',
      name,
      '--config',
      'dist/server/wrangler.json',
    ],
    {
      input: secret,
      encoding: 'utf8',
    },
  );
  const ok = result.status === 0;
  failed ||= !ok;
  const reason = ok
    ? ''
    : `  ${(result.stderr || result.stdout).split('\n').find((line) => /error|✘/i.test(line)) ?? 'failed'}`;
  console.log(
    `${ok ? '✓' : '✗'} ${name.padEnd(24)} ${secret.length} chars${reason}`,
  );
}
process.exit(failed ? 1 : 0);
