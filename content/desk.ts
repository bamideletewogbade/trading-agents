/** Words for the desk: the learner's home after onboarding. */
export const DESK = {
  meta: { title: 'Your desk' },
  greeting: (part: 'morning' | 'afternoon' | 'evening', name?: string) =>
    `Good ${part}${name ? `, ${name}` : ''}.`,
  loading: 'Opening your desk…',
  empty: {
    title: 'Let’s find your starting point',
    body: 'A few quick questions with Sika, your coach, and you’ll get a path that skips what you already know.',
    cta: 'Start the chat',
  },
  start: (stage: number, title: string) =>
    `You start at stage ${stage}: ${title}`,
  next: 'Start here',
  first: 'Your first lesson',
  continue: 'Continue where you left off',
  done: 'Done',
  play: 'Play',
  soon: 'Coming soon',
  path: 'Your roadmap',
  here: 'You are here',
  quick: {
    title: 'Try these today',
    items: [
      { href: '/ipo', label: 'IPO 101', note: 'The Dangote offer, explained' },
      {
        href: '/mindset',
        label: 'Noise vs signal',
        note: 'The trader’s mindset',
      },
      { href: '/#risk-lab', label: 'Risk Lab', note: 'Leverage, felt' },
      {
        href: '/community',
        label: 'The Floor',
        note: 'Join the founding circle',
      },
    ],
  },
  device: 'Your answers are saved on this phone.',
  account: 'Create an account to keep them everywhere',
  redo: 'Redo the chat',
} as const;
