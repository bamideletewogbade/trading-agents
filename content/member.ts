/**
 * Words for the signed-in side on a phone: the tab bar, the habit chips,
 * the lessons library and the Me screen. Short and plain on purpose.
 * Numbers arrive already worked out (lib/progress/habit.ts).
 */

export const TABS = {
  label: 'Main',
  items: [
    { href: '/desk', label: 'Learn', icon: 'path' },
    { href: '/practice', label: 'Practice', icon: 'practice' },
    { href: '/lessons', label: 'Lessons', icon: 'book' },
    { href: '/me', label: 'Me', icon: 'me' },
  ],
} as const;

export const TAB_DUE = (n: number) =>
  n === 1 ? '1 question to practise' : `${n} questions to practise`;

export const HABIT = {
  streak: (days: number) => (days === 1 ? '1 day' : `${days} days`),
  streakLabel: (days: number) =>
    days === 0 ? 'No streak yet' : `${days}-day streak`,
  xp: (xp: number) => `${xp.toLocaleString('en-GB')} XP`,
  level: (level: number) => `Level ${level}`,
  goal: (done: number, goal: number) => `${Math.min(done, goal)}/${goal} today`,
  goalMet: 'Goal met',
};

export const LIBRARY = {
  meta: { title: 'Lessons' },
  title: 'All lessons',
  lead: 'Pick any lesson. Each one stands on its own.',
  search: 'Search lessons',
  placeholder: 'e.g. RSI, stop loss, inflation',
  all: 'All',
  none: 'No lesson matches that yet. Try a shorter word.',
  done: 'Done',
  soon: 'Soon',
  minutes: (n: number) => `${n} min`,
};

export const ME = {
  meta: { title: 'Me' },
  title: 'Your progress',
  level: (level: number) => `Level ${level}`,
  toNext: (xp: number) => `${xp.toLocaleString('en-GB')} XP to the next level`,
  streak: 'Streak',
  best: (days: number) => `Best: ${days === 1 ? '1 day' : `${days} days`}`,
  lessons: 'Lessons done',
  xp: 'Total XP',
  goal: {
    title: 'Daily goal',
    lead: 'How many lessons a day? Small is fine. Every day beats a lot once.',
    label: 'Lessons a day',
    option: (n: number) => (n === 1 ? '1 lesson' : `${n} lessons`),
  },
  badges: {
    title: 'Badges',
    none: 'Finish your first lesson to earn your first badge.',
    first: 'First lesson',
    stage: (title: string) => `Finished: ${title}`,
    streak: (days: number) => `${days}-day streak`,
  },
  settings: {
    title: 'Settings',
    buzz: 'Buzz on answers',
    buzzHelp:
      'A short vibration when you answer. Phones that can’t buzz ignore it.',
    on: 'On',
    off: 'Off',
    palette: 'Up and down colours',
    standard: 'Standard',
    blueOrange: 'Blue–orange',
    paletteHelp:
      'Blue–orange is easier to tell apart if red and green look alike to you. Arrows and words stay either way.',
    redo: 'Redo the starting chat',
  },
  account: {
    title: 'Account',
    guest: 'You’re learning as a guest. Your progress is saved on this phone.',
    create: 'Create a free account to keep it everywhere',
  },
  honest:
    'XP counts learning, never money. Missing a day only resets your streak. Nothing else.',
};
