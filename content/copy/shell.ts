/**
 * Every word in the product shell. Components read from here and never hold
 * copy of their own, so localising a country or rewording a line is an edit
 * to content, not to code.
 */

export const TABS = [
  { key: 'home', href: '/home', label: 'Home' },
  { key: 'learn', href: '/learn', label: 'Learn' },
  { key: 'practice', href: '/practice', label: 'Practice' },
  { key: 'progress', href: '/progress', label: 'Progress' },
  { key: 'coach', href: '/coach', label: 'Coach' },
] as const;

export type TabKey = (typeof TABS)[number]['key'];

export const HOME = {
  title: 'Home',
  opener: 'Let’s test how you think about money.',
  openerDetail:
    'One payday, a few decisions, and what they lead to. About three minutes.',
  start: 'Start',
  mapTitle: 'Your financial intelligence map',
  mapEmpty: 'Play one simulation and your map starts filling in.',
  dailyTitle: 'Today’s challenge',
  dailyEmpty:
    'A new 60-second challenge every day, once you’ve played your first simulation.',
} as const;

/** The six domains of the map (spec §87). */
export const MAP_DOMAINS = [
  'Money fundamentals',
  'Risk management',
  'Investing',
  'Business finance',
  'Market knowledge',
  'Decision discipline',
] as const;

export const LEARN = {
  title: 'Learn',
  intro:
    'Worlds unlock as you show you can use what’s in them, not when you’ve read them.',
  lessons: (count: number) => `${count} lessons`,
  locked: 'Later',
} as const;

export const PRACTICE = {
  title: 'Practice',
  intro: 'Labs are for trying things. Change one number and see what it does.',
  daily: 'Daily challenge',
  dailyDetail: '60 seconds. One decision. Back tomorrow with a new one.',
  soon: 'Coming',
} as const;

export const PROGRESS = {
  title: 'Progress',
  intro: 'What you can do, not what you’ve opened.',
  levelsTitle: 'How a skill grows',
  levels: [
    ['Seen it', 'You’ve met the idea.'],
    ['Tried it', 'You changed a number and watched what happened.'],
    ['Explained it', 'You said why, in your own words.'],
    ['Used it', 'You got a new scenario right without a hint.'],
    [
      'Carried it over',
      'You used it somewhere different, like a business instead of a trade.',
    ],
    ['Kept it', 'You still had it a week later.'],
  ],
  remembersTitle: 'What the coach remembers',
  remembersEmpty:
    'Nothing yet. Whatever it notes about how you learn will be listed here, and you can delete any of it.',
  settingsTitle: 'Settings',
  paletteLabel: 'Gain and loss colours',
  paletteStandard: 'Standard',
  paletteBlueOrange: 'Blue–orange',
  paletteHelp:
    'Blue–orange is easier to tell apart if red and green look alike to you. Arrows and words stay either way.',
} as const;

export const COACH = {
  title: 'Coach',
  intro:
    'Ask about a money decision. The coach will usually answer with a question, then show you.',
  tryLabel: 'Try asking',
  suggestions: [
    'Should I use 20× leverage?',
    'How big should my emergency fund be?',
    'Is 15% a month on a loan app a lot?',
  ],
  inputLabel: 'Your question',
  inputPlaceholder: 'Ask about a money decision',
  notReady: 'The coach arrives after the first simulations are in.',
} as const;
