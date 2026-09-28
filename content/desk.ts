/**
 * Words for the desk (the signed-in home, /desk) and the path (/learn).
 * Numbers arrive worked out: habit from lib/progress/habit.ts, signals from
 * lib/engines/signals.ts, the journal from lib/engines/journal.ts.
 */
export const DESK = {
  meta: { title: 'Desk' },
  greeting: (part: 'morning' | 'afternoon' | 'evening', name?: string) =>
    `Good ${part}${name ? `, ${name}` : ''}`,
  welcome: 'Welcome. Let’s start with the basics.',
  lead: 'Your lessons, the markets and your trades, in one place.',
  loading: 'Opening your desk…',
  skipAhead: {
    title: 'Already trading?',
    body: 'Answer 7 quick questions and we’ll skip what you already know.',
    cta: 'Find my level',
  },
  first: 'Start here',
  continue: 'Up next',
  start: 'Start',
  resume: 'Continue',
  minutes: (n: number) => `${n} min`,
  /** Where the next lesson sits in its course, under the "Up next" card. */
  lessonOf: (n: number, total: number) => `Lesson ${n} of ${total}`,
  lessonMark: {
    done: 'done',
    now: 'up next',
    later: 'still to come',
    soon: 'coming soon',
  },
  courseMark: {
    done: 'finished',
    now: 'you are here',
    later: 'ahead',
  },
  allDone:
    'You’ve finished every lesson that’s out so far. New ones are on the way.',
  stage: (n: number) => `Course ${n}`,
  stageOf: (n: number, total: number) => `Course ${n} of ${total}`,
  open: 'Show lessons',
  close: 'Hide lessons',
  path: 'Your courses',
  openPath: 'All courses',
  yourStart: 'You start here',
  progress: (done: number, total: number) => `${done} of ${total}`,
  done: 'Done',
  soon: 'Soon',
  here: 'Start',
  account: 'Create a free account',
  accountWhy:
    'Keep your courses, journal and paper account wherever you sign in.',
  streak: 'Streak',
  level: 'Level',
  today: 'Today',
  signals: {
    title: 'Markets now',
    all: 'All signals',
    loading: 'Reading the markets…',
    error: 'Market data is unavailable right now.',
    none: 'No signals today. The rules are watching.',
  },
  journal: {
    title: 'Your journal',
    empty: 'Log your trades, paper ones too, and see them measured in R.',
    cta: 'Log a trade',
    open: 'Open the journal',
    closed: 'Closed',
    won: 'Won',
    average: 'Average',
    openTrades: (n: number) => (n === 1 ? '1 trade open' : `${n} trades open`),
  },
  paper: {
    title: 'Paper account',
    empty:
      'Trade real prices with $10,000 of pretend money. Every trade gets a stop, and the journal measures it.',
    cta: 'Start paper trading',
    open: 'Open it',
    value: 'Value',
    returned: 'Return',
    positions: 'Open',
  },
  tools: {
    title: 'Tools',
    all: 'All tools',
    quick: ['size', 'lots', 'rr', 'promise'] as const,
  },
  word: {
    title: 'Word of the day',
    more: 'The glossary',
  },
  later: {
    title: 'Coming to your desk',
    body: 'The Floor, where traders share plans rather than calls, and live sessions with replays.',
  },
} as const;

export const PATH = {
  meta: { title: 'Courses' },
  title: 'Your courses',
  lead: 'Seven courses, from how markets work to proving it. Every lesson also stands on its own.',
  /** Across every lesson that's out, under the title. */
  overall: (done: number, total: number) => `${done} of ${total} lessons done`,
  /** Under a course's title: its size, and how long its lessons take. */
  size: (lessons: number, minutes: number | null) =>
    `${lessons} lessons · ${minutes === null ? 'Coming soon' : `${minutes} min`}`,
  done: (done: number, total: number) => `${done} of ${total} done`,
  whereAmI: (course: number, n: number, total: number) =>
    `Course ${course} · Lesson ${n} of ${total}`,
  here: 'You are here',
  finished: 'Finished',
  action: {
    next: 'Start',
    open: 'Play',
    again: 'Replay',
    soon: 'Soon',
  },
  lessonState: {
    done: 'done',
    next: 'up next',
    open: 'not started',
    soon: 'coming soon',
  },
} as const;
