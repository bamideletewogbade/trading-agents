/**
 * The habit loop: XP, levels, the daily streak, the daily goal and badges.
 * All of it is derived from the list of finished lessons, never stored: the
 * event log is the truth (db/schema.ts), and these rules can change without
 * a migration.
 *
 * Honest by design (CLAUDE.md rule 9). XP rewards learning, never trading
 * results. A streak counts days you practised; missing a day costs the
 * streak number and nothing else. Nothing counts down, nothing locks.
 *
 * Pure: `pnpm check` runs it under plain Node (scripts/check-progress.ts).
 */

export type Completion = {
  id: string;
  /** When it was finished, in ms since 1970. 0 for an old record with no time. */
  at: number;
  /** Questions answered right first time, out of `total`. */
  right: number;
  total: number;
};

export const XP = {
  /** Finishing a lesson for the first time. */
  lesson: 10,
  /** Each question right on the first try, the first time through. */
  firstTry: 5,
  /** Playing a lesson again: practice counts, a little. */
  replay: 2,
} as const;

/** Streak lengths that earn a badge. */
export const STREAK_BADGES = [3, 7, 30] as const;

/** Lessons a day a learner can aim for. */
export const DAILY_GOALS = [1, 2, 3] as const;

const DAY_MS = 86_400_000;

/**
 * The learner's calendar day for a moment, as YYYY-MM-DD. `offsetMinutes` is
 * what `Date.prototype.getTimezoneOffset()` returns on their phone (−60 in
 * Lagos, 0 in Accra), so a lesson at 23:30 UTC counts for the next day in
 * Lagos.
 */
export function dayOf(at: number, offsetMinutes: number): string {
  return new Date(at - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

function dayNumber(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

/** Total XP: the first finish of each lesson in full, every replay a little. */
export function xpOf(log: readonly Completion[]): number {
  const seen = new Set<string>();
  let xp = 0;
  for (const entry of [...log].sort((a, b) => a.at - b.at)) {
    if (seen.has(entry.id)) {
      xp += XP.replay;
      continue;
    }
    seen.add(entry.id);
    xp +=
      XP.lesson + XP.firstTry * Math.max(0, Math.min(entry.right, entry.total));
  }
  return xp;
}

export type Level = {
  level: number;
  /** XP where this level started and where the next one starts. */
  from: number;
  to: number;
  /** Progress through this level, in basis points. */
  progressBp: number;
};

/** Level k starts at 50·k·(k − 1) XP: 0, 100, 300, 600, 1,000… Each takes a little longer. */
export function levelOf(xp: number): Level {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level += 1;
  const from = 50 * level * (level - 1);
  const to = 50 * (level + 1) * level;
  return {
    level,
    from,
    to,
    progressBp: Math.floor(((xp - from) * 10_000) / (to - from)),
  };
}

export type Streak = {
  /** Days in a row with at least one lesson, ending today or yesterday. */
  current: number;
  best: number;
  /** Whether today already counts. */
  today: boolean;
};

/** The streak, from the days lessons were finished on. */
export function streakOf(days: readonly string[], today: string): Streak {
  const numbers = [...new Set(days)].map(dayNumber).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous = Number.NaN;
  for (const n of numbers) {
    run = n === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = n;
  }
  const now = dayNumber(today);
  const set = new Set(numbers);
  const doneToday = set.has(now);
  // A streak is still alive until the end of the day after its last lesson.
  let cursor = doneToday ? now : now - 1;
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, best, today: doneToday };
}

/** Days with a lesson, in the learner's calendar. Old records with no time don't count. */
export function daysOf(
  log: readonly Completion[],
  offsetMinutes: number,
): string[] {
  return log
    .filter((entry) => entry.at > 0)
    .map((entry) => dayOf(entry.at, offsetMinutes));
}

export type Goal = { goal: number; done: number; met: boolean };

/** Lessons finished today against the daily goal. */
export function goalOf(
  log: readonly Completion[],
  today: string,
  offsetMinutes: number,
  goal: number,
): Goal {
  const done = daysOf(log, offsetMinutes).filter((day) => day === today).length;
  return { goal, done, met: done >= goal };
}

export type Badge =
  | { kind: 'first' }
  | { kind: 'stage'; stage: string }
  | { kind: 'streak'; days: number };

/** Badges earned: a first lesson, each stage finished, each streak milestone reached. */
export function badgesOf(
  completed: readonly string[],
  stages: readonly { key: string; lessons: readonly string[] }[],
  bestStreak: number,
): Badge[] {
  const done = new Set(completed);
  const badges: Badge[] = [];
  if (done.size > 0) badges.push({ kind: 'first' });
  for (const stage of stages)
    if (stage.lessons.length > 0 && stage.lessons.every((id) => done.has(id)))
      badges.push({ kind: 'stage', stage: stage.key });
  for (const days of STREAK_BADGES)
    if (bestStreak >= days) badges.push({ kind: 'streak', days });
  return badges;
}

/**
 * What one finish earned, for the end-of-lesson screen: the XP it added,
 * and whether it started, kept or grew the streak.
 */
export function earned(
  before: readonly Completion[],
  entry: Completion,
): { xp: number; firstTime: boolean } {
  const firstTime = !before.some((b) => b.id === entry.id);
  return {
    xp: firstTime
      ? XP.lesson +
        XP.firstTry * Math.max(0, Math.min(entry.right, entry.total))
      : XP.replay,
    firstTime,
  };
}

/**
 * Two copies of the log (the phone's and the server's) merged, keeping one
 * record per finish: the server's timestamp differs from the phone's by the
 * time the request took, so records of the same lesson within five minutes
 * are the same finish, and an old untimed record gives way to a timed one.
 */
export function mergeLogs(
  a: readonly Completion[],
  b: readonly Completion[],
): Completion[] {
  const out = [...a];
  for (const entry of b) {
    const same = out.some(
      (other) =>
        other.id === entry.id &&
        (other.at === entry.at ||
          (other.at > 0 &&
            entry.at > 0 &&
            Math.abs(other.at - entry.at) < 300_000)),
    );
    if (!same) out.push(entry);
  }
  // An old record with no time is the same finish as a timed one of that lesson.
  const timed = new Set(
    out.filter((entry) => entry.at > 0).map((entry) => entry.id),
  );
  return out
    .filter((entry) => entry.at > 0 || !timed.has(entry.id))
    .sort((x, y) => x.at - y.at);
}
