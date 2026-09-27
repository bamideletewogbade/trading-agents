/**
 * Words for the signed-in side: the tab bar, the habit chips,
 * the lessons library and the Me screen. Short and plain on purpose.
 * Numbers arrive already worked out (lib/progress/habit.ts).
 */

/**
 * The signed-in app's navigation (docs/member-app-plan.md §2): grouped by
 * what you're doing. A module that isn't built yet shows as "Soon" and is
 * never a dead link. The phone's bottom bar carries four places and a Menu
 * that opens all of it.
 */
export const NAV = {
  label: 'Main',
  menu: 'Menu',
  close: 'Close',
  soon: 'Soon',
  groups: [
    {
      title: null,
      items: [{ href: '/desk', label: 'Desk', icon: 'desk' }],
    },
    {
      title: 'Learn',
      items: [
        { href: '/learn', label: 'Courses', icon: 'path' },
        { href: '/lessons', label: 'Lessons', icon: 'book' },
        { href: '/practice', label: 'Practice', icon: 'practice' },
        { href: '/learn/glossary', label: 'Glossary', icon: 'words' },
      ],
    },
    {
      title: 'Markets',
      items: [
        { href: '/signals', label: 'Signals', icon: 'signal' },
        { href: null, label: 'Calendar', icon: 'calendar' },
      ],
    },
    {
      title: 'Trade',
      items: [
        { href: '/journal', label: 'Journal', icon: 'journal' },
        { href: '/tools', label: 'Tools', icon: 'tools' },
        { href: null, label: 'Paper account', icon: 'paper' },
      ],
    },
    {
      title: 'Community',
      items: [
        { href: null, label: 'The Floor', icon: 'people' },
        { href: null, label: 'Live sessions', icon: 'live' },
      ],
    },
    {
      title: 'You',
      items: [{ href: '/me', label: 'Progress', icon: 'me' }],
    },
  ],
  /** The phone's bottom bar: each lights up for its whole group. */
  bar: [
    { href: '/desk', label: 'Desk', icon: 'desk', group: null },
    { href: '/learn', label: 'Learn', icon: 'path', group: 'Learn' },
    { href: '/signals', label: 'Signals', icon: 'signal', group: 'Markets' },
    { href: '/journal', label: 'Trade', icon: 'journal', group: 'Trade' },
  ],
} as const;

export type NavIcon = (typeof NAV.groups)[number]['items'][number]['icon'];

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
  stage: (n: number) => `Course ${n}`,
  progress: (done: number, total: number) => `${done} of ${total} done`,
  glossary: 'Stuck on a word? The glossary',
  row: { play: 'Play it', again: 'Play again', soon: 'Coming soon' },
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
  notes: {
    title: 'Your notes',
    none: 'When a lesson asks what you think, your answer is saved here.',
    where: (n: number) =>
      n > 10
        ? `The latest 10 of ${n}. Kept on this device only.`
        : 'Kept on this device only.',
  },
  settings: {
    title: 'Settings',
    buzz: 'Buzz on answers',
    buzzHelp: 'A short vibration when you answer, where your device can.',
    on: 'On',
    off: 'Off',
    palette: 'Up and down colours',
    standard: 'Standard',
    blueOrange: 'Blue–orange',
    paletteHelp:
      'Blue–orange is easier to tell apart if red and green look alike to you. Arrows and words stay either way.',
    redo: 'Find my level: 7 quick questions',
  },
  account: {
    title: 'Account',
    guest: 'You’re learning as a guest. Your progress is saved on this device.',
    create: 'Create a free account to keep it everywhere',
  },
  honest:
    'XP counts learning, never money. Missing a day only resets your streak. Nothing else.',
};
