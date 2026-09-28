/**
 * Words for the smaller public pages: courses, signals, features,
 * community and pricing. The landing page's are in content/landing.ts, the
 * IPO guide's in content/ipo.ts, and trading psychology's in
 * content/mindset.ts. Counts arrive as arguments, worked out from the
 * curriculum, never typed here.
 */

export const COURSES_PAGE = {
  meta: {
    title:
      'Trading courses: charts, technical and fundamental analysis, risk and strategy',
    description:
      'Seven courses from your first chart to a trading plan: how markets work, reading charts, risk, technical analysis, fundamental analysis and strategies. Short lessons you play, free to start.',
  },
  hero: {
    kicker: 'Courses',
    title: 'Seven courses, from zero to a plan.',
    lead: 'Each course is a set of short lessons you play: make a call, see what happens, learn why. Go in order, or pick any lesson on its own.',
  },
  ask: 'Or look for one topic',
  stagesLabel: 'Courses',
  stage: (n: number) => `Course ${n}`,
  lessons: (n: number) => `${n} lessons`,
  done: (done: number, total: number) => `${done} of ${total} done`,
  minutes: (n: number) => `${n} min`,
  truth: {
    simulation: 'Simulation',
    historical: 'Historical data',
    educational: 'Educational',
  },
  soon: 'Soon',
  start: (title: string) => `Start: ${title}`,
  next: (title: string) => `Next: ${title}`,
  again: 'Play this course again',
  row: { play: 'Play it', again: 'Play again', soon: 'Coming soon' },
  coming: 'This course is being built. The lessons above are coming soon.',
};

export const SIGNALS_PAGE = {
  meta: {
    title: 'Trading signals with their reasons and their record',
    description:
      'Buy and sell signals for crypto, gold and forex from fixed rules: entry, stop and target, the reasons for and against, and a record that keeps every loss.',
  },
  hero: {
    kicker: 'Signals',
    titleLead: 'Signals that show their work.',
    titleGold: 'Reasons, risks and a record.',
    lead: 'Every day at the close, fixed rules read crypto, gold and forex. When a setup appears you get the entry, the stop, the target, the reasons for and against it, and how the same rules have done on that market, losses included.',
    primary: 'See today’s signals',
    secondary: 'Learn the setups',
  },
  preview: {
    kicker: 'Right now',
    title: 'What the rules see today',
    all: 'See every market',
  },
  steps: {
    kicker: 'How a signal is made',
    items: [
      [
        'Real prices',
        'Daily prices from the market itself. Nothing is made up: when the data is down, the page says so.',
      ],
      [
        'Fixed rules',
        'A pullback in a trend, or a breakout from a tight range on heavy volume. The same rules for every market and every member.',
      ],
      [
        'Reasons both ways',
        'Each signal lists what supports it and what argues against it: stretched momentum, chasing, wild days, a cold run.',
      ],
      [
        'A record that keeps losses',
        'Every signal the rules gave, replayed on real prices, filled at the next open, with costs paid. Wins and losses side by side.',
      ],
    ] as const,
  },
  carries: {
    kicker: 'Every signal carries',
    items: [
      ['Entry', 'Where it starts: the next open after the daily close.'],
      ['Stop', 'Where it’s wrong, at least one normal day’s move away.'],
      ['Target', 'Twice what it risks, so one win pays for two losses.'],
      ['For and against', 'The facts behind it, and the ones that argue back.'],
      [
        'The lessons',
        'The courses that teach the setup, so you can judge it yourself.',
      ],
      [
        'Size and log',
        'One tap to size it for your account and put it in your journal.',
      ],
    ] as const,
  },
  rules: {
    kicker: 'Our rules for signals',
    items: [
      'No promised returns. The record says what happened; it can’t say what will.',
      'No urgency. One decision a day, on the close, and no countdowns.',
      'No hidden losses. Every signal stays in the record, win or lose.',
      'Paper first. Log a signal in your journal and watch it play out before you trust it with money.',
      'Not advice about your money. Signals are the same for everyone and don’t know your situation.',
    ],
  },
  faq: {
    kicker: 'Questions',
    items: [
      [
        'Are these financial advice?',
        'No. They are what fixed rules see in a market, the same for everyone, with their reasons and their record. What you do with your money is your decision.',
      ],
      [
        'Which markets?',
        'Bitcoin, Ether, Solana, XRP and gold today, with forex majors next. Ghanaian and Nigerian stocks once we have a clean source of prices.',
      ],
      [
        'How often is there a signal?',
        'Only when a setup appears. Most days, for most markets, there isn’t one, and the page says what the rules are waiting for instead.',
      ],
      [
        'Do they always win?',
        'No. Each market shows how many won, the average result and the worst losing run. Good rules still lose several times in a row; that’s why every signal has a stop.',
      ],
      [
        'Can I trade them?',
        'Follow them on paper in your journal first. If you trade one with a broker, that’s your money and your decision: size it small and use the stop.',
      ],
    ] as const,
  },
  closing: {
    title: 'See what the rules see today.',
    lead: 'Free to look. Every signal comes with its reasons and its record.',
    cta: 'Open the signals',
  },
};

export const FEATURES_PAGE = {
  meta: {
    title:
      'Features: courses, signals, a trading journal and tools in one place',
    description:
      'Your trading desk: courses you play, practice that brings back your mistakes, signals with a record, a journal that measures every trade in R, and the calculators traders use.',
  },
  hero: {
    kicker: 'Features',
    titleLead: 'Everything a trader needs.',
    titleGold: 'In one desk.',
    lead: 'Open your desk and see what to learn next, what the markets are doing and how your own trades are going. Everything here is free to try today, on any device.',
    cta: 'Open my desk',
  },
  modules: [
    {
      icon: 'desk',
      name: 'Your desk',
      title: 'Your day at a glance',
      body: 'Your next lesson, the mistakes due for practice, today’s signals and your journal, on one screen.',
      href: '/desk',
      cta: 'Open the desk',
    },
    {
      icon: 'path',
      name: 'Courses',
      title: 'Short lessons you play',
      body: 'From what a price is to building your own strategy. Every lesson is a small market you control: make a call, see what happens, learn why.',
      href: '/courses',
      cta: 'See the courses',
    },
    {
      icon: 'practice',
      name: 'Practice',
      title: 'Your mistakes come back',
      body: 'A question you get wrong returns a day later, then a few days after that, until it sticks.',
      href: '/practice',
      cta: 'Open practice',
    },
    {
      icon: 'signal',
      name: 'Signals',
      title: 'Signals that show their work',
      body: 'Entry, stop and target, the reasons for and against, and the rules’ full record on that market, losses included.',
      href: '/trading-signals',
      cta: 'How signals work',
    },
    {
      icon: 'paper',
      name: 'Paper account',
      title: 'Real prices, pretend money',
      body: 'Take a signal or your own idea with $10,000 of pretend money. Fills at the live bid and ask; your stop and target are watched for you.',
      href: '/paper',
      cta: 'Open the paper account',
    },
    {
      icon: 'journal',
      name: 'Journal',
      title: 'Every trade, measured in R',
      body: 'Log trades from a signal or your own idea. See your win rate beside your average result, whether you kept your stops, and which habit costs you most.',
      href: '/journal',
      cta: 'Open the journal',
    },
    {
      icon: 'tools',
      name: 'Tools',
      title: 'The sums before every trade',
      body: 'Position size, forex lots, risk and reward, the climb back from a loss, a check on promised returns, and your edge.',
      href: '/tools',
      cta: 'Open the tools',
    },
    {
      icon: 'me',
      name: 'Progress',
      title: 'Habits that stick',
      body: 'XP for learning, a daily streak, a goal you set and badges for finishing courses. Missing a day costs your streak, nothing else.',
      href: '/me',
      cta: 'See your progress',
    },
    {
      icon: 'words',
      name: 'Glossary',
      title: 'Every word, plainly',
      body: 'The words of trading and money in plain English, each linked to the lesson that teaches it.',
      href: '/glossary',
      cta: 'Open the glossary',
    },
  ] as const,
  soon: {
    kicker: 'Coming next',
    items: [
      [
        'Paper account',
        'Take signals and your own ideas with pretend money, filled like a real account.',
      ],
      [
        'Economic calendar',
        'The releases that move prices, and which lesson explains each one.',
      ],
      [
        'The Floor',
        'A community where traders share plans with their reasoning, not screenshots.',
      ],
      [
        'Live sessions',
        'Weekly sessions with mentors, and replays kept with the lessons they belong to.',
      ],
    ] as const,
  },
  owners: {
    title: 'Run a trading community?',
    body: 'Give your members this desk under your own brand, with your calls on the record.',
    cta: 'See how it works',
  },
};

export const COMMUNITY_PAGE = {
  meta: {
    title: 'The Floor: a trading community that shows its reasoning',
    description:
      'Share your chart, thesis and stop before the market moves, and learn from wins and losses alike. No account managers, no profit screenshots.',
  },
  hero: {
    kicker: 'Community · Coming soon',
    titleLead: 'Trade ideas in the open.',
    titleGold: 'Show your reasoning.',
    lead: 'The Floor is where people share the why behind a trade: the chart, the thesis, the stop, and what happened next. Everyone learns from the wins and the losses.',
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
        'Experienced traders run cohorts here and teach their process. Their calls carry an entry, a stop and a reason, and a public record.',
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
      'A call comes with its reasoning: an entry, a stop, a target and why. It goes on the record, win or lose.',
      'No DMs selling anything. No “account managers”, managed accounts or pooled money. Ever.',
      'No profit screenshots without the full picture: size, risk, and the losses around them.',
      'Losses are welcome. They teach the most.',
    ],
  },
  safety: {
    kicker: 'How we keep it clean',
    items: [
      'Every post is checked before it appears. A call without a stop or a reason doesn’t go up, and unclear cases go to a person, not a guess.',
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
    note: 'Example',
  },
  owners: {
    kicker: 'For community owners',
    title: 'Run your trading community on Sika Lab.',
    lead: 'Forex and crypto educators: move your group off scattered channels, drives and spreadsheets. Your members get courses, signals with a record, a journal and tools. You get your brand, your calls and a clear view of who is learning.',
    items: [
      [
        'Your brand',
        'Your name, logo and colour on the desk your members open every day.',
      ],
      [
        'Your calls, on the record',
        'Post calls with an entry, a stop, a target and a reason. Results are tracked for you, wins and losses, so members can trust them.',
      ],
      [
        'A school built in',
        'Our courses, practice and glossary for your members, plus lessons of your own.',
      ],
      [
        'See who is learning',
        'Who is active, who is stuck, who keeps their stops. Never their private notes.',
      ],
      [
        'Paid simply',
        'Members pay you by mobile money, card or transfer, and nothing renews without asking them.',
      ],
      [
        'Live sessions',
        'Schedule sessions and keep the replays beside the lessons they belong to.',
      ],
    ] as const,
    cta: 'Talk to us',
    done: 'Thanks. We’ll be in touch about your community.',
    fallback: 'Create an account so we can reach you',
    note: 'Now welcoming our first communities. Early partners help shape it.',
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
      'Free to start: courses, tools, a journal and today’s signals. A pass adds every course, every market’s signals and the coach, paid by mobile money, card or transfer, and nothing renews without asking you.',
  },
  hero: {
    kicker: 'Pricing',
    titleLead: 'Free to start.',
    titleGold: 'Pay only if it helps.',
    lead: 'Learn the basics, use the tools, keep a journal and read today’s signals free, for as long as you like. A pass will add every course, every market’s signals and the coach. We’re setting the price with our first members, so it isn’t here yet.',
  },
  tiers: [
    {
      name: 'Free',
      price: '₦0 / GH₵0',
      blurb: 'Start here, stay as long as you like.',
      items: [
        'The first course, and a free lesson each week',
        'Tools, the trading journal and the paper account',
        'Today’s signals, with their reasons',
        'The glossary and the IPO guide',
      ],
      cta: 'Start free',
      href: '/desk',
    },
    {
      name: 'Pass',
      price: 'Price coming soon',
      blurb: 'Every course, every signal and a coach.',
      items: [
        'All seven courses and every single lesson',
        'Signals on every market, with their full records',
        'The AI coach, which remembers your habits (soon)',
        'Market replays on historical data (soon)',
        'A certificate at the end of each course (soon)',
        'Monthly or yearly, by MoMo, card or bank transfer',
        'Nothing renews without asking you first',
      ],
      cta: 'Start free, upgrade later',
      href: '/desk',
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
    title: 'For trading communities, brokers, banks and universities',
    body: 'Give your members, customers or students the whole desk under your name: courses, signals with a record, the journal and tools, with reporting on what they’ve learned. People who understand risk stay longer.',
    cta: 'Talk to us',
    done: 'Thanks. We’ll be in touch.',
    fallback: 'Create an account so we can reach you',
  },
  faq: {
    kicker: 'Questions',
    items: [
      [
        'I know nothing about trading. Can I start?',
        'Yes. The first lesson starts with what a price is. Every lesson takes a few minutes and uses pretend money.',
      ],
      [
        'Can I lose money on Sika Lab?',
        'Not here. Lessons use pretend money, and signals are information, not trades. If you act on anything with a broker, that’s your money and your decision, so start on paper.',
      ],
      [
        'Are the signals financial advice?',
        'No. They come from fixed rules, are the same for everyone, and show their reasons and their full record, losses included.',
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

export const LABS_PAGE = {
  available: (n: number) => n + ' interactive labs available',
  directory: 'Choose a lab',
  open: 'Try this lab',
  riskSteps: [
    ['Choose your exposure', 'Leverage increases the size of a position relative to its collateral. It does not make the underlying price more or less volatile.'],
    ['Change the price', 'The same price move has a larger effect on your collateral when exposure is larger. Both gains and losses are amplified.'],
    ['Read the model limits', 'This simplified simulation does not reproduce a broker’s margin rules, fees, slippage or liquidation process. Even an unleveraged asset can lose value.'],
  ] as const,
  ipoSteps: [
    ['Read the offer', 'Start with the published price, minimum application, business accounts and risks. An application is not a guaranteed allocation.'],
    ['Model an allocation', 'The calculator illustrates proportional allocation when demand exceeds supply. Actual allocation follows the offer terms and approved allotment basis.'],
    ['Separate allocation from return', 'Receiving shares does not determine their future market price. Listing prices can rise or fall; this exercise makes no return forecast.'],
  ] as const,
  ipoMore: 'Read the case study and sources',
  noiseNote: 'Smoothing changes how a chart looks. It does not prove that a trend will continue or that a strategy is profitable.',
  quiz: 'Try the signal or noise quiz',
  nextTitle: 'Turn a useful experiment into a habit.',
  nextBody: (live: number, planned: number) => live + ' lessons are available now; ' + planned + ' are planned. Practise a decision, review the explanation, then try again.',
  tryLesson: 'Try a free lesson',
  curriculum: 'Explore the curriculum',
  meta: {
    title: 'Interactive Labs: Market Simulators & Flight Checks',
    description:
      'Hands-on trading simulators. Test leverage in the Risk Lab, calculate allotment in the Market & IPO Lab, deconstruct candlestick anatomy, and separate signal from noise with zero financial risk.',
  },
  hero: {
    kicker: 'Interactive Simulators · Zero Financial Risk',
    titleLead: 'Touch the market.',
    titleGold: 'Feel the consequence.',
    lead: 'Reading theory doesn’t build trading instincts. Each lab lets you change an input and see what happens. Test leverage, model public offerings, and filter market noise with zero real money at stake.',
  },
  labs: [
    {
      id: 'risk-lab',
      kicker: 'Simulator 01 · Capital Preservation',
      title: 'Risk Lab: The Leverage Trap',
      lead: 'See how fast leverage wipes out an account on an ordinary 2% market wobble. Adjust your leverage from 1x to 50x and test your capital survival rate.',
      href: '/#risk-lab',
      badge: 'Core Skill',
    },
    {
      id: 'ipo-lab',
      kicker: 'Simulator 02 · Public Offerings',
      title: 'Market & IPO Lab: Dangote & Public Listings',
      lead: 'Understand what buying an IPO really means. Explore an illustrative allocation, valuation and listing scenario. Actual offer terms determine how shares are allocated.',
      href: '/ipo',
      badge: 'Real World Case',
    },
    {
      id: 'chart-lab',
      kicker: 'Simulator 03 · Price Action',
      title: 'Chart Anatomy Lab: Candlesticks & Support',
      lead: 'Step through raw candlestick wicks and bodies. Find where buyers consistently defend the floor, and plan an invalidation level before you buy.',
      href: '/#demo',
      badge: 'Interactive Demo',
    },
    {
      id: 'noise-lab',
      kicker: 'Simulator 04 · Market Psychology',
      title: 'Noise Filter Lab: Signal vs Noise',
      lead: 'Tune out the chatter. Slide a moving average filter to strip away random price swings, and see how smoothing changes the picture.',
      href: '/mindset#filter',
      badge: 'Discipline',
    },
  ],
};
