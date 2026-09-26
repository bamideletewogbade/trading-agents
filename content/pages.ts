/**
 * Words for the smaller marketing pages: the roadmap, community and pricing.
 * The landing page's are in content/landing.ts, IPO 101's in
 * content/ipo.ts, and the mindset page's in content/mindset.ts.
 */

export const ROADMAP_PAGE = {
  meta: {
    title: 'The roadmap: charts, TA, FA, risk and strategy',
    description:
      'A curated path from your first chart to a 30-day paper challenge, or any single lesson on its own: technical analysis, fundamental analysis, risk and strategies.',
  },
  hero: {
    kicker: 'The path',
    titleLead: 'From your first chart to',
    titleGold: 'trading with a plan.',
    lead: 'Seven stages, in order: how markets work, reading charts, risk, technical analysis, fundamental analysis, strategies, then proving it. Already trading? Pick any lesson on its own.',
  },
  ask: 'Or just ask',
};

export const COMMUNITY_PAGE = {
  meta: {
    title: 'The Floor: a trading community that shares reasoning, not signals',
    description:
      'Share your chart, thesis and stop before the market moves, and learn from wins and losses alike. No signals, no account managers, no profit screenshots.',
  },
  hero: {
    kicker: 'Community · Coming soon',
    titleLead: 'Trade ideas in the open.',
    titleGold: 'Reasoning, not signals.',
    lead: 'Signal groups sell you the what. The Floor is where people share the why: the chart, the thesis, the stop, and what happened next. Everyone learns from the wins and the losses.',
  },
  features: {
    kicker: 'What it will have',
    items: [
      [
        'Breakdowns',
        'Post a chart, your reasoning and your stop before the move. It locks. The market decides, and everyone sees how it played out.',
      ],
      [
        'Rooms',
        'NGX and GSE stocks, forex, crypto, commodities, IPOs. Each one moderated, each one on topic.',
      ],
      [
        'Replays together',
        'A weekly live session: a sealed historical chart, everyone writes a plan, then we press play.',
      ],
      [
        'Verified mentors',
        'Experienced traders run cohorts here. They teach their process. They may not sell calls.',
      ],
      [
        'Process score',
        'Your reputation comes from following your own plan and explaining your reasoning, never from profit screenshots.',
      ],
      [
        'Study groups',
        'Share your trading journal with a small group, or keep it private. Your choice, always.',
      ],
    ] as const,
  },
  rules: {
    kicker: 'House rules',
    items: [
      'No buy or sell calls on real assets. Explain your reasoning; don’t tell people what to do.',
      'No DMs selling anything. No “account managers”, managed accounts or pooled money. Ever.',
      'No profit screenshots without the full picture: size, risk, and the losses around them.',
      'Losses are welcome. They teach the most.',
    ],
  },
  safety: {
    kicker: 'How we keep it clean',
    items: [
      'Every post is checked for buy/sell instructions before it appears. Unclear cases go to a person, not a guess.',
      'New members can’t post links or send DMs until they’ve been around a while.',
      'Mentors are verified, and their track record on the platform is public.',
      'One tap to report. Scam patterns get people removed, not warned.',
    ],
  },
  preview: {
    initials: 'AO',
    author: 'Adaeze O. · Process score 82',
    kind: 'Breakdown · locked before the move',
    thesis: ['Thesis', 'Higher lows'],
    stop: ['Stop', 'Under the lows'],
    risk: ['Risk', '1% of account'],
    note: 'An illustration of a future feature. Not a real post or a real asset.',
  },
  join: {
    title: 'Be one of the first 500 on the Floor',
    body: 'Founding members help set the rules, get the first mentor cohorts, and keep a founder badge.',
    cta: 'Join the founding circle',
    done: 'You’re on the list. We’ll tell you the moment the doors open.',
    signUp: 'Create a free account so we can reach you',
  },
};

export const PRICING_PAGE = {
  meta: {
    title: 'Pricing',
    description:
      'Free to start. A pass when you want the whole roadmap and the coach, paid by mobile money, card or transfer, and nothing renews without asking you.',
  },
  hero: {
    kicker: 'Pricing',
    titleLead: 'Free to start.',
    titleGold: 'Pay only if it helps.',
    lead: 'Learn the basics free, for as long as you like. Later, a pass will add the coach and market replays. We’re setting the price with our first learners, so it isn’t here yet.',
  },
  tiers: [
    {
      name: 'Free',
      price: '₦0 / GH₵0',
      blurb: 'Start here, stay as long as you like.',
      items: [
        'Stage 1 of the roadmap',
        'IPO 101 and noise vs signal',
        'The Risk Lab',
        'Single lessons to try each week',
      ],
      cta: 'Start free',
      href: '/sign-up',
    },
    {
      name: 'Pass',
      price: 'Price set in the pilot',
      blurb: 'The whole roadmap and a coach.',
      items: [
        'All seven stages and every single lesson',
        'The AI coach, which remembers your habits',
        'Market replays on historical data',
        'A certificate at the end of each stage',
        'Monthly or yearly, by MoMo, card or bank transfer',
        'Nothing renews without asking you first',
      ],
      cta: 'Start free, upgrade later',
      href: '/sign-up',
      featured: true,
    },
    {
      name: 'The Floor',
      price: 'Coming soon',
      blurb: 'Community and mentor-led cohorts.',
      items: [
        'Breakdowns, rooms and weekly live replays',
        'Four-week cohorts with a verified mentor',
        'Study groups and shared journals',
      ],
      cta: 'Join the founding circle',
      href: '/community',
    },
  ],
  partners: {
    title: 'For brokers, banks, universities and employers',
    body: 'Give your customers, students or staff the whole roadmap under your name, with reporting on what they’ve learned. New investors who understand risk make better customers.',
    cta: 'Talk to us',
    done: 'Thanks. We’ll be in touch.',
    fallback: 'Create an account so we can reach you',
  },
  faq: {
    kicker: 'Questions',
    items: [
      [
        'Why no signals?',
        'Because signals make you dependent on someone else’s judgement, and the day they’re wrong you won’t know why. We teach the judgement.',
      ],
      [
        'Can I lose money on Sika Lab?',
        'No. Every market here is simulated or historical. Nothing you do moves real money.',
      ],
      [
        'Will this make me rich?',
        'No, and be careful of anyone who says their course will. It will make you a better decision-maker. For some people that becomes extra income, slowly.',
      ],
      [
        'Do brokers pay you?',
        'Not today. If we ever point you to one, we’ll say so plainly, show you more than one, and never push you to trade.',
      ],
      [
        'Which countries?',
        'Ghana and Nigeria first, in cedis and naira, with local markets and examples. More countries after.',
      ],
    ] as const,
  },
};
