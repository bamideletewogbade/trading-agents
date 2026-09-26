/**
 * Words shared by every marketing page: the nav, the announcement bar, the
 * footer. Who we're talking to, so every line can be checked against it:
 *
 * - Nigerians and Ghanaians, mostly 18–35: students, young professionals,
 *   people with a side hustle, and people already in a signals group.
 * - Curious because of the Dangote IPO, crypto, forex, or a friend's
 *   screenshot of profits.
 * - Want extra income. Have been burned, or know someone who has.
 *
 * The voice: a smart friend who trades properly. Direct, warm, a little
 * funny, never hype. We say "skill", "practice" and "risk" where others say
 * "profit", "signals" and "financial freedom".
 */

export const MARKETING = {
  skip: 'Skip to content',
  nav: {
    label: 'Main',
    links: [
      { href: '/roadmap', label: 'Roadmap' },
      { href: '/mindset', label: 'Mindset' },
      { href: '/ipo', label: 'IPO 101', badge: 'New' },
      { href: '/community', label: 'Community' },
      { href: '/pricing', label: 'Pricing' },
    ],
    signIn: 'Sign in',
    start: 'Start free',
    desk: 'Continue learning',
    menu: 'Menu',
    close: 'Close menu',
    menuNote: 'No signals. No real money. Just skill.',
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
    tagline: 'Trading is a skill. Practise it here first.',
    columns: [
      {
        title: 'Learn',
        links: [
          { href: '/roadmap', label: 'The roadmap' },
          { href: '/mindset', label: 'Noise vs signal' },
          { href: '/ipo', label: 'How IPOs work' },
          { href: '/#risk-lab', label: 'Risk Lab' },
        ],
      },
      {
        title: 'Sika Lab',
        links: [
          { href: '/community', label: 'Community' },
          { href: '/pricing', label: 'Pricing' },
          { href: '/sign-up', label: 'Start free' },
        ],
      },
    ],
    disclaimer:
      'Educational only. Not financial advice, and never a recommendation to buy or sell anything. Every price on this site is simulated or clearly marked as historical data. Nothing here moves real money.',
    made: 'Built for Ghana and Nigeria, then the rest of Africa.',
  },
} as const;
