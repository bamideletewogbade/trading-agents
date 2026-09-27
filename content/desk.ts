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
  allDone:
    'You’ve finished every lesson that’s out so far. New ones are on the way.',
  stage: (n: number) => `Stage ${n}`,
  stageOf: (n: number, total: number) => `Stage ${n} of ${total}`,
  open: 'Show lessons',
  close: 'Hide lessons',
  path: 'Your path',
  openPath: 'Open the path',
  yourStart: 'You start here',
  progress: (done: number, total: number) => `${done} of ${total}`,
  done: 'Done',
  soon: 'Soon',
  here: 'Start',
  device: 'Your progress is saved on this device.',
  account: 'Create a free account to keep it everywhere',
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
  meta: { title: 'Path' },
  title: 'Your path',
  lead: 'Seven stages, from how markets work to proving it. Every lesson also stands on its own.',
} as const;
