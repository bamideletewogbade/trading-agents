/**
 * Practise your mistakes: questions a learner got wrong in a lesson come
 * back, spaced out so they stick (a Leitner schedule). A new mistake is due
 * at once. Each right answer moves it along: back in 1 day, then 3, then 7,
 * and a right answer after that retires it as learned. A wrong answer sends
 * it back to the start.
 *
 * Like the habit loop, the queue is never stored. It is replayed from a log
 * of events (missed, right, wrong), which the phone keeps and the server
 * keeps as `question_missed` and `question_reviewed` events, so the rules
 * can change without a migration and a second phone catches up.
 *
 * Pure: `pnpm check` runs it under plain Node (scripts/check-progress.ts).
 */

import type { Option } from '../lessons/types.ts';

export type PracticeEvent = {
  kind: 'missed' | 'right' | 'wrong';
  /** The question: lesson id and a hash of its prompt (see questionKey). */
  key: string;
  lesson: string;
  /** ms since 1970. */
  at: number;
};

export type Item = {
  key: string;
  lesson: string;
  /** 0 = just missed; 3 = one right answer away from learned. */
  box: number;
  /** When it's next due, in ms since 1970. */
  due: number;
};

/** A question as a practice round shows it (built by /api/questions). */
export type PracticeQuestion = {
  key: string;
  lesson: string;
  lessonTitle: string;
  prompt: string;
  options: Option[];
};

/** Days until a question comes back after reaching each box. */
export const SPACING_DAYS = [0, 1, 3, 7] as const;
const LAST_BOX = SPACING_DAYS.length - 1;
const DAY_MS = 86_400_000;

/** A round is short on purpose: a few questions, then done. */
export const ROUND_SIZE = 5;

/**
 * A stable name for a question: its lesson and a 32-bit FNV-1a hash of its
 * prompt. The prompt, not its position, so moving a beat doesn't point an
 * old mistake at a different question; a reworded prompt simply retires it.
 */
export function questionKey(lesson: string, prompt: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < prompt.length; i += 1) {
    hash ^= prompt.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${lesson}:${hash.toString(16).padStart(8, '0')}`;
}

export function lessonOfKey(key: string): string {
  return key.slice(0, key.lastIndexOf(':'));
}

/** Replay the log into the queue, and the questions retired as learned. */
export function queueOf(events: readonly PracticeEvent[]): {
  items: Item[];
  learned: string[];
} {
  const items = new Map<string, Item>();
  const learned = new Set<string>();
  for (const event of [...events].sort((a, b) => a.at - b.at)) {
    const item = items.get(event.key);
    if (event.kind === 'missed') {
      learned.delete(event.key);
      items.set(event.key, {
        key: event.key,
        lesson: event.lesson,
        box: 0,
        due: event.at,
      });
      continue;
    }
    // A review of something not in the queue changes nothing.
    if (!item) continue;
    if (event.kind === 'wrong') {
      items.set(event.key, { ...item, box: 0, due: event.at });
    } else if (item.box >= LAST_BOX) {
      items.delete(event.key);
      learned.add(event.key);
    } else {
      const box = item.box + 1;
      items.set(event.key, {
        ...item,
        box,
        due: event.at + (SPACING_DAYS[box] ?? 0) * DAY_MS,
      });
    }
  }
  return { items: [...items.values()], learned: [...learned] };
}

/** What's due now: oldest first, then the least-learned, at most `limit`. */
export function dueOf(
  items: readonly Item[],
  now: number,
  limit = ROUND_SIZE,
  lesson?: string,
): Item[] {
  return items
    .filter((item) => item.due <= now && (!lesson || item.lesson === lesson))
    .sort(
      (a, b) => a.due - b.due || a.box - b.box || a.key.localeCompare(b.key),
    )
    .slice(0, limit);
}

/** When the next question comes back, if nothing is due now. */
export function nextDueOf(items: readonly Item[], now: number): number | null {
  const later = items.filter((item) => item.due > now).map((item) => item.due);
  return later.length ? Math.min(...later) : null;
}

/** Whole days from now until `at`, rounded up: 0 means today. */
export function daysUntil(at: number, now: number): number {
  return Math.max(0, Math.ceil((at - now) / DAY_MS));
}

/**
 * The phone's log and the server's merged, one record per answer: the same
 * kind of event on the same question within five minutes is the same one.
 */
export function mergePractice(
  a: readonly PracticeEvent[],
  b: readonly PracticeEvent[],
): PracticeEvent[] {
  const out = [...a];
  for (const event of b)
    if (
      !out.some(
        (other) =>
          other.kind === event.kind &&
          other.key === event.key &&
          Math.abs(other.at - event.at) < 300_000,
      )
    )
      out.push(event);
  return out.sort((x, y) => x.at - y.at);
}
