/**
 * Words shared by every marketing page: the nav, the announcement bar, the
 * footer. Who we're talking to, so every line can be checked against it:
 *
 * - Nigerians and Ghanaians, mostly 18–35: students, young professionals,
 *   people with a side hustle, and people who already follow traders online.
 * - Curious because of the Dangote IPO, crypto, forex, or a friend's
 *   screenshot of profits.
 * - Want extra income. Have been burned, or know someone who has.
 *
 * The voice: a smart friend who trades properly. Direct, warm, a little
 * funny, never hype. We say "skill", "practice" and "risk" where others say
 * "profit" and "financial freedom".
 */

export const MARKETING = {
  skip: 'Skip to content',
  nav: {
    label: 'Main',
    /** Names people already use for these things, not our own. */
    links: [
      { href: '/courses', label: 'Courses' },
      { href: '/trading-signals', label: 'Signals' },
      { href: '/features', label: 'Features' },
      { href: '/community', label: 'Community' },
      { href: '/pricing', label: 'Pricing' },
    ],
    resources: {
      label: 'Resources',
      links: [
        {
          href: '/glossary',
          label: 'Glossary',
          note: 'Trading words in plain English',
        },
        {
          href: '/psychology',
          label: 'Trading psychology',
          note: 'Noise, signal and staying calm',
        },
        {
          href: '/labs',
          label: 'Interactive Labs',
          note: 'Flight checks, leverage & risk simulators',
          badge: 'Sim',
        },
        {
          href: '/ipo',
          label: 'IPO guide',
          note: 'How an IPO works, with the Dangote offer',
          badge: 'New',
        },
      ],
    },
    signIn: 'Sign in',
    start: 'Start free',
    desk: 'Open my desk',
    menu: 'Menu',
    close: 'Close menu',
    menuNote: 'Courses, signals and tools. Start from zero.',
  },

  announcement: {
    open: (closes: string) =>
      `Dangote Refinery IPO is open until ${closes}. Understand it before you apply`,
    closed:
      'The Dangote IPO has closed. See what happens between allotment and listing',
    upcoming: 'The Dangote Refinery IPO opens soon. Learn how IPOs work first',
    cta: 'IPO 101',
  },

  footer: {
    tagline: 'Read the market. Rehearse the decision. Pretend money first.',
    columns: [
      {
        title: 'Product',
        links: [
          { href: '/courses', label: 'Courses' },
          { href: '/trading-signals', label: 'Signals' },
          { href: '/features', label: 'Features' },
          { href: '/pricing', label: 'Pricing' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { href: '/glossary', label: 'Glossary' },
          { href: '/psychology', label: 'Trading psychology' },
          { href: '/ipo', label: 'IPO guide' },
        ],
      },
      {
        title: 'Community',
        links: [
          { href: '/community', label: 'The Floor' },
          { href: '/community#owners', label: 'For community owners' },
          { href: '/desk', label: 'Start free' },
        ],
      },
    ],
    disclaimer:
      'Educational only, not financial advice. Every price is labelled: simulated, historical or live market data. Signals come from fixed rules, are the same for everyone, and keep every loss in their record. Nothing here moves real money.',
    made: 'Built for Ghana and Nigeria, then the rest of Africa.',
  },
} as const;
