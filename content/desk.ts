/** Words for the path: the learner's home after onboarding. */
export const DESK = {
  meta: { title: 'Learn' },
  greeting: (part: 'morning' | 'afternoon' | 'evening', name?: string) =>
    `Good ${part}${name ? `, ${name}` : ''}`,
  loading: 'Opening your path…',
  empty: {
    title: 'Let’s find where you start',
    body: 'Answer a few quick questions and we’ll skip what you already know.',
    cta: 'Start the chat',
    skip: 'Or start from the first lesson',
  },
  first: 'Your first lesson',
  continue: 'Up next',
  start: 'Start',
  resume: 'Continue',
  minutes: (n: number) => `${n} min`,
  allDone:
    'You’ve finished every lesson that’s out so far. New ones are on the way.',
  stage: (n: number) => `Stage ${n}`,
  yourStart: 'You start here',
  progress: (done: number, total: number) => `${done} of ${total}`,
  done: 'Done',
  soon: 'Soon',
  here: 'Start',
  device: 'Your progress is saved on this phone.',
  account: 'Create a free account to keep it everywhere',
  streak: 'Streak',
  level: 'Level',
  today: 'Today',
} as const;
