'use client';

import { useSyncExternalStore } from 'react';
import { missingFrom, unionById, type Logged } from '@/lib/sync/log';
import { sessionHeaders } from './session';

/**
 * The journal's and the paper account's logs on this device, and keeping
 * them in step with the server (app/api/sync). Each log only grows, so
 * syncing is: take what the server has that this device lacks, and send
 * what this device has that the server lacks (lib/sync/log.ts). Signed in,
 * the server's copy is the account's, so every device ends up with the
 * same log. Storage is always wrapped: a private tab still works, it just
 * forgets when closed.
 */

export type LogName = 'journal' | 'paper';

const KEY: Record<LogName, string> = {
  journal: 'sika:journal-log',
  paper: 'sika:paper-log',
};
const EVENT = 'sika:log';
const MAX = 5000;

function isLogged(value: unknown): value is Logged & { kind: string } {
  const e = value as { id?: unknown; at?: unknown; kind?: unknown };
  return (
    !!e &&
    typeof e.id === 'string' &&
    typeof e.at === 'number' &&
    typeof e.kind === 'string'
  );
}

function raw(name: LogName): string {
  try {
    return localStorage.getItem(KEY[name]) ?? '';
  } catch {
    return '';
  }
}

export function readLocal<T extends Logged>(name: LogName): T[] {
  try {
    const parsed = JSON.parse(raw(name) || '[]') as unknown;
    return Array.isArray(parsed)
      ? (parsed.filter(isLogged) as unknown as T[])
      : [];
  } catch {
    return [];
  }
}

function writeLocal(name: LogName, events: readonly Logged[]): void {
  try {
    localStorage.setItem(KEY[name], JSON.stringify(events.slice(-MAX)));
  } catch {
    // Storage blocked or full: the server copy, if any, still counts.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Add events to this device's log (once each). */
export function appendLocal<T extends Logged>(
  name: LogName,
  events: readonly T[],
): void {
  if (!events.length) return;
  const before = readLocal<T>(name);
  const after = unionById(before, events);
  if (after.length !== before.length) writeLocal(name, after);
}

const caches: Record<LogName, { raw: string; events: Logged[] }> = {
  journal: { raw: '', events: [] },
  paper: { raw: '', events: [] },
};
const NONE: Logged[] = [];

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** A log, live: re-renders when it grows anywhere on this device. */
export function useLocalLog<T extends Logged>(name: LogName): T[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const now = raw(name);
      if (now !== caches[name].raw)
        caches[name] = { raw: now, events: readLocal(name) };
      return caches[name].events;
    },
    () => NONE,
  ) as T[];
}

const lastSync: Record<LogName, number> = { journal: 0, paper: 0 };
export type SyncResult = 'synced' | 'device' | 'offline';

/**
 * Bring this device and the server together. At most every half minute
 * unless `force`, so opening screens doesn't hammer the server.
 */
export async function syncLog(
  name: LogName,
  force = false,
): Promise<SyncResult> {
  if (!force && Date.now() - lastSync[name] < 30_000) return 'synced';
  lastSync[name] = Date.now();
  try {
    const headers = await sessionHeaders();
    const pulled = await fetch(`/api/sync?log=${name}`, {
      headers,
      signal: AbortSignal.timeout(8_000),
    });
    if (!pulled.ok) return 'offline';
    const body = (await pulled.json()) as {
      available?: boolean;
      events?: unknown[];
    };
    if (!body.available) return 'device';
    const server = (body.events ?? []).filter(isLogged);
    appendLocal(name, server);
    const send = missingFrom(server, readLocal(name));
    for (let i = 0; i < send.length; i += 200) {
      const pushed = await fetch('/api/sync', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ log: name, events: send.slice(i, i + 200) }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!pushed.ok) return 'offline';
    }
    return 'synced';
  } catch {
    return 'offline';
  }
}
