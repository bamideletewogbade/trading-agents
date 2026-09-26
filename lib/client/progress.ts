'use client';

import { useSyncExternalStore } from 'react';
import { sessionHeaders } from './session';

/**
 * Which lessons this learner has finished. The phone keeps a copy so the
 * roadmap and desk tick instantly and work offline; the server keeps the
 * truth as `lesson_completed` events (lib/learning/store.ts), which follow
 * an account across phones. Storage access is always wrapped: a private tab
 * must not break the player.
 */

const KEY = 'sika:done';
const EVENT = 'sika:progress';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // Storage blocked: the server copy (if any) still counts.
  }
  window.dispatchEvent(new Event(EVENT));
}

let cache: { raw: string; ids: string[] } = { raw: '', ids: [] };
function snapshot(): string[] {
  let raw = '';
  try {
    raw = localStorage.getItem(KEY) ?? '';
  } catch {
    raw = '';
  }
  if (raw !== cache.raw) cache = { raw, ids: read() };
  return cache.ids;
}
const EMPTY: string[] = [];

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Finished lesson ids, live: re-renders when a lesson is completed anywhere on this phone. */
export function useCompleted(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Record a finished lesson. Resolves to where it was saved. */
export async function markCompleted(
  lessonId: string,
  score: { right: number; total: number },
): Promise<'server' | 'device'> {
  write([...read(), lessonId]);
  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
      headers: {
        'content-type': 'application/json',
        ...(await sessionHeaders()),
      },
      body: JSON.stringify({
        type: 'lesson_completed',
        skill: lessonId,
        data: score,
      }),
    });
    return response.status === 201 ? 'server' : 'device';
  } catch {
    return 'device';
  }
}

/** Pull the server's list into the phone's, so a second phone catches up. */
export async function syncCompleted(): Promise<void> {
  try {
    const response = await fetch('/api/progress', {
      headers: await sessionHeaders(),
      signal: AbortSignal.timeout(6_000),
    });
    if (response.status !== 200) return;
    const body = (await response.json()) as { completed?: unknown };
    if (Array.isArray(body.completed))
      write([
        ...read(),
        ...body.completed.filter((id): id is string => typeof id === 'string'),
      ]);
  } catch {
    // Offline: the phone's list stands.
  }
}
