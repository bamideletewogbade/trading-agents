'use client';

import { useSyncExternalStore } from 'react';
import { STAGES } from '@/content/curriculum';
import type { PracticeEvent } from '@/lib/progress/review';
import {
  DAILY_GOALS,
  XP,
  badgesOf,
  dayOf,
  daysOf,
  goalOf,
  levelOf,
  mergeLogs,
  streakOf,
  xpOf,
  type Badge,
  type Completion,
  type Goal,
  type Level,
  type Streak,
} from '@/lib/progress/habit';
import { mergeServerPractice, usePracticeLog } from './practice';
import { sessionHeaders } from './session';

/**
 * Which lessons this learner has finished, and when. The phone keeps a log
 * so the path, streak and XP update instantly and work offline; the server
 * keeps the truth as `lesson_completed` events (lib/learning/store.ts),
 * which follow an account across phones. Everything shown as progress (XP,
 * level, streak, goal, badges) is worked out from the log by
 * lib/progress/habit.ts. Storage access is always wrapped: a private tab
 * must not break the player.
 */

const LOG = 'sika:log';
/** The older list of finished ids, before finishes had times. Still read. */
const DONE = 'sika:done';
const GOAL = 'sika:goal';
const EVENT = 'sika:progress';

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function isCompletion(value: unknown): value is Completion {
  const c = value as Completion;
  return (
    !!c &&
    typeof c.id === 'string' &&
    typeof c.at === 'number' &&
    typeof c.right === 'number' &&
    typeof c.total === 'number'
  );
}

function readLog(): Completion[] {
  const log = readJson(LOG);
  const timed = Array.isArray(log) ? log.filter(isCompletion) : [];
  const old = readJson(DONE);
  const untimed = Array.isArray(old)
    ? old
        .filter((id): id is string => typeof id === 'string')
        .map((id) => ({ id, at: 0, right: 0, total: 0 }))
    : [];
  return mergeLogs(timed, untimed);
}

function writeLog(log: Completion[]): void {
  try {
    localStorage.setItem(LOG, JSON.stringify(log));
  } catch {
    // Storage blocked: the server copy (if any) still counts.
  }
  window.dispatchEvent(new Event(EVENT));
}

function rawOf(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

let cache: { raw: string; log: Completion[]; ids: string[] } = {
  raw: '',
  log: [],
  ids: [],
};
function logSnapshot(): typeof cache {
  const raw = `${rawOf(LOG)}|${rawOf(DONE)}`;
  if (raw !== cache.raw) {
    const log = readLog();
    cache = { raw, log, ids: [...new Set(log.map((c) => c.id))] };
  }
  return cache;
}
const EMPTY = { raw: '', log: [] as Completion[], ids: [] as string[] };

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
  return useSyncExternalStore(
    subscribe,
    () => logSnapshot().ids,
    () => EMPTY.ids,
  );
}

/** Every finish, oldest first. */
export function useLog(): Completion[] {
  return useSyncExternalStore(
    subscribe,
    () => logSnapshot().log,
    () => EMPTY.log,
  );
}

/** The log as it stands now, outside React (for the finish screen's "what did this earn"). */
export function currentLog(): Completion[] {
  return logSnapshot().log;
}

function goalSnapshot(): number {
  const raw = Number(rawOf(GOAL));
  return (DAILY_GOALS as readonly number[]).includes(raw)
    ? raw
    : DAILY_GOALS[0];
}

export function useDailyGoal(): number {
  return useSyncExternalStore(subscribe, goalSnapshot, () => DAILY_GOALS[0]);
}

export function setDailyGoal(goal: number): void {
  try {
    localStorage.setItem(GOAL, String(goal));
  } catch {
    // Blocked storage: the default goal stands.
  }
  window.dispatchEvent(new Event(EVENT));
}

export type Habit = {
  xp: number;
  level: Level;
  streak: Streak;
  goal: Goal;
  badges: Badge[];
  completed: string[];
};

/** Today's calendar day and time zone offset on this phone. */
export function clock(): { today: string; offset: number } {
  const now = Date.now();
  const offset = new Date(now).getTimezoneOffset();
  return { today: dayOf(now, offset), offset };
}

/**
 * Everything the path and the profile show, worked out from the lesson log
 * and the practice log. Practice counts: each mistake fixed earns a little
 * XP, and a day spent practising keeps the streak alive.
 */
export function habitOf(
  log: readonly Completion[],
  goal: number,
  practice: readonly PracticeEvent[] = [],
): Habit {
  const { today, offset } = clock();
  const completed = [...new Set(log.map((c) => c.id))];
  const answers = practice.filter((e) => e.kind !== 'missed');
  const xp =
    xpOf(log) + XP.review * answers.filter((e) => e.kind === 'right').length;
  const streak = streakOf(
    [...daysOf(log, offset), ...answers.map((e) => dayOf(e.at, offset))],
    today,
  );
  return {
    xp,
    level: levelOf(xp),
    streak,
    goal: goalOf(log, today, offset, goal),
    badges: badgesOf(completed, STAGES, streak.best),
    completed,
  };
}

export function useHabit(): Habit {
  return habitOf(useLog(), useDailyGoal(), usePracticeLog());
}

/** Record a finished lesson. Resolves to where it was saved. */
export async function markCompleted(
  lessonId: string,
  score: { right: number; total: number },
): Promise<'server' | 'device'> {
  writeLog([...readLog(), { id: lessonId, at: Date.now(), ...score }]);
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

/** Pull the server's log into the phone's, so a second phone catches up. */
export async function syncCompleted(): Promise<void> {
  try {
    const response = await fetch('/api/progress', {
      headers: await sessionHeaders(),
      signal: AbortSignal.timeout(6_000),
    });
    if (response.status !== 200) return;
    const body = (await response.json()) as {
      log?: unknown;
      practice?: unknown;
    };
    mergeServerPractice(body.practice);
    if (!Array.isArray(body.log)) return;
    const server = body.log.filter(isCompletion);
    const merged = mergeLogs(readLog(), server);
    if (merged.length !== readLog().length) writeLog(merged);
  } catch {
    // Offline: the phone's log stands.
  }
}
