'use client';

import { useSyncExternalStore } from 'react';
import {
  daysUntil,
  dueOf,
  mergePractice,
  nextDueOf,
  queueOf,
  type Item,
  type PracticeEvent,
} from '@/lib/progress/review';
import { sessionHeaders } from './session';

/**
 * The practice log on this phone: every question missed in a lesson and
 * every answer in a practice round. The queue (what's due, what's learned)
 * is replayed from it by lib/progress/review.ts. The server keeps the same
 * events (`question_missed`, `question_reviewed`) and /api/progress returns
 * them, so an account's practice follows it across phones. Storage access is
 * always wrapped: a private tab must not break a lesson.
 */

const KEY = 'sika:practice';
const EVENT = 'sika:practice';

function isEvent(value: unknown): value is PracticeEvent {
  const e = value as PracticeEvent;
  return (
    !!e &&
    (e.kind === 'missed' || e.kind === 'right' || e.kind === 'wrong') &&
    typeof e.key === 'string' &&
    typeof e.lesson === 'string' &&
    typeof e.at === 'number'
  );
}

function raw(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

function read(): PracticeEvent[] {
  try {
    const parsed: unknown = JSON.parse(raw() || '[]');
    return Array.isArray(parsed) ? parsed.filter(isEvent) : [];
  } catch {
    return [];
  }
}

function write(events: PracticeEvent[]): void {
  try {
    // The newest few thousand answers are plenty to replay the queue.
    localStorage.setItem(KEY, JSON.stringify(events.slice(-3000)));
  } catch {
    // Storage blocked: the server copy (if any) still counts.
  }
  window.dispatchEvent(new Event(EVENT));
}

let cache: { raw: string; events: PracticeEvent[] } = { raw: '', events: [] };
function snapshot(): PracticeEvent[] {
  const now = raw();
  if (now !== cache.raw) cache = { raw: now, events: read() };
  return cache.events;
}
const EMPTY: PracticeEvent[] = [];

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function usePracticeLog(): PracticeEvent[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function currentPractice(): PracticeEvent[] {
  return snapshot();
}

export type PracticeState = {
  items: Item[];
  learned: string[];
  /** Everything due now, oldest first (optionally from one lesson). */
  due: Item[];
  /** Days until the next question comes back, if none is due. */
  nextInDays: number | null;
  /** Practice answers that were right first time. */
  rights: number;
};

/** The queue as it stands right now on this phone's clock. */
export function practiceState(
  events: readonly PracticeEvent[],
  lesson?: string,
): PracticeState {
  const now = Date.now();
  const { items, learned } = queueOf(events);
  const next = nextDueOf(items, now);
  return {
    items,
    learned,
    due: dueOf(items, now, Number.POSITIVE_INFINITY, lesson),
    nextInDays: next === null ? null : daysUntil(next, now),
    rights: events.filter((e) => e.kind === 'right').length,
  };
}

export function usePractice(lesson?: string): PracticeState {
  return practiceState(usePracticeLog(), lesson);
}

function send(
  type: string,
  lesson: string,
  data: Record<string, unknown>,
): void {
  void (async () => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        keepalive: true,
        signal: AbortSignal.timeout(8_000),
        headers: {
          'content-type': 'application/json',
          ...(await sessionHeaders()),
        },
        body: JSON.stringify({ type, skill: lesson, data }),
      });
    } catch {
      // Offline: the phone's log still counts, and the next sync has no copy
      // to merge, so this answer lives on this phone only.
    }
  })();
}

/** A question answered wrong first time in a lesson: it joins the practice queue. */
export function recordMissed(lesson: string, key: string): void {
  write([...read(), { kind: 'missed', key, lesson, at: Date.now() }]);
  send('question_missed', lesson, { key });
}

/** A first answer in a practice round. */
export function recordReview(
  lesson: string,
  key: string,
  right: boolean,
): void {
  write([
    ...read(),
    { kind: right ? 'right' : 'wrong', key, lesson, at: Date.now() },
  ]);
  send('question_reviewed', lesson, { key, right });
}

/** Merge the server's practice log into the phone's. */
export function mergeServerPractice(server: unknown): void {
  if (!Array.isArray(server)) return;
  const incoming = server.filter(isEvent);
  const local = read();
  const merged = mergePractice(local, incoming);
  if (merged.length !== local.length) write(merged);
}
