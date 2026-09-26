/** Words for the path: the learner's home after onboarding. */
export const DESK = {
  meta: { title: 'Learn' },
  greeting: (part: 'morning' | 'afternoon' | 'evening', name?: string) =>
    `Good ${part}${name ? `, ${name}` : ''}`,
  welcome: 'Welcome. Let’s start with the basics.',
  loading: 'Opening your path…',
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
  open: 'Show lessons',
  close: 'Hide lessons',
  path: 'Your path',
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
} as const;
