/**
 * The curriculum: every lesson, where it sits in the roadmap, and what the
 * learner *does* in it. The landing page draws it; the lesson player will
 * read it. One list, so the roadmap and the single-lesson library can never
 * disagree.
 *
 * Two ways through it:
 *
 * - **The roadmap**: seven stages in order, from "what is a price" to a
 *   30-day paper challenge graded on process. Risk comes third, before any
 *   strategy, on purpose: you learn where you're wrong before you learn where
 *   to buy.
 * - **Single lessons**: any lesson on its own, filtered by topic, for people
 *   who already trade and want one thing (how RSI works, how to read an
 *   income statement). `needs` says what a lesson assumes, as a hint, never a
 *   lock.
 *
 * Every lesson is practical: `practice` is what the learner does, in the
 * second person, and it must be something you *do*, not something you read.
 */

export type Topic =
  | 'markets'
  | 'charts'
  | 'risk'
  | 'technical'
  | 'fundamental'
  | 'strategies'
  | 'mind';

export type Level = 'starter' | 'core' | 'advanced';

/** `live` is playable today; `next` is being built; `planned` is on the roadmap. */
export type LessonStatus = 'live' | 'next' | 'planned';

export type Lesson = {
  id: string;
  title: string;
  topic: Topic;
  level: Level;
  minutes: number;
  practice: string;
  /** How the lesson's world is labelled (CLAUDE.md rule 7). */
  truth: 'simulation' | 'historical' | 'educational';
  status: LessonStatus;
  /** Lesson ids this one assumes. A hint for single-lesson learners, not a gate. */
  needs?: string[];
  /** Where on the landing page it can be played today. */
  playAt?: string;
};

export const TOPICS: Record<Topic, { label: string; blurb: string }> = {
  markets: {
    label: 'How markets work',
    blurb: 'Prices, orders, spreads, leverage, and who makes money from you.',
  },
  charts: {
    label: 'Reading charts',
    blurb: 'Candles, timeframes, trends, support and resistance, volume.',
  },
  risk: {
    label: 'Risk',
    blurb: 'Stops, position size, risk-reward, drawdown and expectancy.',
  },
  technical: {
    label: 'Technical analysis',
    blurb: 'Indicators and patterns, with how often they actually worked.',
  },
  fundamental: {
    label: 'Fundamental analysis',
    blurb: 'Rates, inflation, earnings, valuation and what moves the cedi.',
  },
  strategies: {
    label: 'Strategies',
    blurb: 'Trend, range, breakout, news, investing, and your own rules.',
  },
  mind: {
    label: 'Mind and practice',
    blurb: 'Plans, journals, psychology, replays and the paper challenge.',
  },
};

export const LEVELS: Record<Level, string> = {
  starter: 'Starter',
  core: 'Core',
  advanced: 'Advanced',
};

export const STAGES = [
  {
    key: 'markets',
    title: 'How markets work',
    outcome:
      'You can say what a price is, place every kind of order, and see where the fees hide.',
    lessons: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
  },
  {
    key: 'charts',
    title: 'Read a chart',
    outcome:
      'You can look at any chart and say what buyers and sellers have been doing.',
    lessons: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
  },
  {
    key: 'risk',
    title: 'Risk first',
    outcome:
      'You decide where you are wrong and how much it costs before you ever buy.',
    lessons: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  },
  {
    key: 'technical',
    title: 'Technical analysis',
    outcome:
      'You use indicators and patterns as evidence, and you know their failure rates.',
    lessons: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10'],
  },
  {
    key: 'fundamental',
    title: 'Fundamental analysis',
    outcome:
      'You can explain why a market moved: rates, inflation, earnings, commodities.',
    lessons: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'],
  },
  {
    key: 'strategies',
    title: 'Strategies',
    outcome:
      'You can run a strategy by its rules, and test it before trusting it.',
    lessons: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
  },
  {
    key: 'prove',
    title: 'Prove it',
    outcome:
      'You follow your own plan for 30 days on paper, and your journal shows it.',
    lessons: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
] as const;

export const LESSONS: Lesson[] = [
  // How markets work
  {
    id: 'm1',
    title: 'What a price actually is',
    topic: 'markets',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'planned',
    practice:
      'Watch buyers and sellers meet in an order book. Move one order and see the price change.',
  },
  {
    id: 'm2',
    title: 'Bid, ask and the spread',
    topic: 'markets',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'planned',
    practice:
      'Buy and sell ten times in a row and watch the spread take its cut every time.',
  },
  {
    id: 'm3',
    title: 'Market, limit and stop orders',
    topic: 'markets',
    level: 'starter',
    minutes: 8,
    truth: 'simulation',
    status: 'planned',
    needs: ['m2'],
    practice:
      'Place each kind of order in a moving market. See which fill, when, and at what price.',
  },
  {
    id: 'm4',
    title: 'Forex, stocks, crypto, commodities',
    topic: 'markets',
    level: 'starter',
    minutes: 7,
    truth: 'educational',
    status: 'planned',
    practice:
      'Sort a dozen headlines by the market they move: USD/GHS, the NGX, bitcoin, cocoa.',
  },
  {
    id: 'm5',
    title: 'Leverage and margin',
    topic: 'markets',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'live',
    playAt: '#risk-lab',
    practice:
      'You have $100. Choose your leverage, predict the damage of a 3% fall, then watch the market do it.',
  },
  {
    id: 'm6',
    title: 'Who makes money from you',
    topic: 'markets',
    level: 'starter',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['m2', 'm5'],
    practice:
      'Follow a $100 deposit through spreads, overnight fees and a signals subscription.',
  },

  // Read a chart
  {
    id: 'c1',
    title: 'Line, bar and candle charts',
    topic: 'charts',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'planned',
    practice: 'See the same week as three charts and find what each one hides.',
  },
  {
    id: 'c2',
    title: 'Anatomy of a candle',
    topic: 'charts',
    level: 'starter',
    minutes: 4,
    truth: 'simulation',
    status: 'live',
    playAt: '#demo',
    practice:
      'Step through a chart candle by candle: open, high, low, close, and who won each one.',
  },
  {
    id: 'c3',
    title: 'Timeframes',
    topic: 'charts',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'planned',
    needs: ['c2'],
    practice:
      'Zoom a month into days into hours. The same move tells three different stories.',
  },
  {
    id: 'c4',
    title: 'Trends: higher highs, higher lows',
    topic: 'charts',
    level: 'starter',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['c2'],
    practice:
      'Mark the swing highs and lows yourself, and watch a trend form or fail.',
  },
  {
    id: 'c5',
    title: 'Support and resistance',
    topic: 'charts',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '#demo',
    needs: ['c2'],
    practice:
      'Find where buyers keep stepping in. Then see what happens when price comes back.',
  },
  {
    id: 'c6',
    title: 'Ranges and trends',
    topic: 'charts',
    level: 'core',
    minutes: 6,
    truth: 'simulation',
    status: 'planned',
    needs: ['c4', 'c5'],
    practice:
      'Sort ten charts into ranges and trends, and see why a tool that works in one fails in the other.',
  },
  {
    id: 'c7',
    title: 'Volume: who showed up',
    topic: 'charts',
    level: 'core',
    minutes: 6,
    truth: 'simulation',
    status: 'planned',
    needs: ['c5'],
    practice:
      'Hide and show volume, and watch a breakout go from convincing to empty.',
  },

  // Risk first
  {
    id: 'r1',
    title: 'Stop losses: where am I wrong?',
    topic: 'risk',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '#demo',
    needs: ['c5'],
    practice:
      'Set your stop before you buy, then replay the same trade with a tight stop, a stop with room, and none.',
  },
  {
    id: 'r2',
    title: 'Position size and the 1% rule',
    topic: 'risk',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'next',
    needs: ['r1'],
    practice:
      'Drag your stop and watch the position size itself so a loss is always 1% of the account.',
  },
  {
    id: 'r3',
    title: 'Risk-reward and R-multiples',
    topic: 'risk',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['r2'],
    practice:
      'Score ten trades in R instead of cedis, and see how a 40% win rate can still pay.',
  },
  {
    id: 'r4',
    title: 'Drawdown and the climb back',
    topic: 'risk',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'planned',
    practice:
      'Lose half an account, then try to win it back one trade at a time.',
  },
  {
    id: 'r5',
    title: 'Leverage, revisited',
    topic: 'risk',
    level: 'core',
    minutes: 6,
    truth: 'simulation',
    status: 'next',
    needs: ['m5', 'r2'],
    practice:
      'The same trade at 5× and at 25×. Watch the path, not the ending.',
  },
  {
    id: 'r6',
    title: 'Expectancy',
    topic: 'risk',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'planned',
    needs: ['r3'],
    practice:
      'Run a strategy for 200 simulated trades and see its edge, or its lack of one, appear.',
  },

  // Technical analysis
  {
    id: 't1',
    title: 'Trendlines and channels',
    topic: 'technical',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['c4'],
    practice:
      'Draw them on a live chart and see how many touches it takes before a line means anything.',
  },
  {
    id: 't2',
    title: 'Moving averages',
    topic: 'technical',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'next',
    needs: ['c4'],
    practice:
      'Drag the length of an SMA and an EMA. Watch them lag, and watch crossovers arrive late.',
  },
  {
    id: 't3',
    title: 'RSI and momentum',
    topic: 'technical',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'next',
    needs: ['c4'],
    practice:
      'Push price up and watch RSI pass 70, and learn why "overbought" doesn’t mean "sell".',
  },
  {
    id: 't4',
    title: 'MACD',
    topic: 'technical',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['t2'],
    practice:
      'Build MACD yourself from two moving averages, one step at a time.',
  },
  {
    id: 't5',
    title: 'Volatility: Bollinger Bands and ATR',
    topic: 'technical',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['r1'],
    practice:
      'Use ATR to put your stop outside the everyday noise, and compare it with a guess.',
  },
  {
    id: 't6',
    title: 'Candlestick patterns, honestly',
    topic: 'technical',
    level: 'core',
    minutes: 8,
    truth: 'historical',
    status: 'planned',
    needs: ['c2', 'c5'],
    practice:
      'Spot engulfing candles, pin bars and dojis, then see how often they worked on real history.',
  },
  {
    id: 't7',
    title: 'Chart patterns',
    topic: 'technical',
    level: 'core',
    minutes: 9,
    truth: 'historical',
    status: 'planned',
    needs: ['c5', 't1'],
    practice:
      'Double tops, head and shoulders, flags and triangles. Spot them, then study the ones that failed.',
  },
  {
    id: 't8',
    title: 'Fibonacci, with a sceptic',
    topic: 'technical',
    level: 'advanced',
    minutes: 6,
    truth: 'simulation',
    status: 'planned',
    needs: ['c4'],
    practice:
      'Draw the levels, then test them on charts that were generated at random.',
  },
  {
    id: 't9',
    title: 'Reading several timeframes',
    topic: 'technical',
    level: 'advanced',
    minutes: 8,
    truth: 'simulation',
    status: 'planned',
    needs: ['c3', 't2'],
    practice:
      'Take the direction from the daily chart and the timing from the hourly.',
  },
  {
    id: 't10',
    title: 'Divergence',
    topic: 'technical',
    level: 'advanced',
    minutes: 7,
    truth: 'historical',
    status: 'planned',
    needs: ['t3'],
    practice:
      'Price makes a new high and RSI doesn’t. See what followed, across a hundred real cases.',
  },

  // Fundamental analysis
  {
    id: 'f1',
    title: 'What moves prices',
    topic: 'fundamental',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'planned',
    practice:
      'Feed a simulated market a rate rise, an inflation print and an earnings miss, and watch each land.',
  },
  {
    id: 'f2',
    title: 'Central banks and interest rates',
    topic: 'fundamental',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'next',
    needs: ['f1'],
    practice:
      'Set the policy rate as the central bank, and watch the currency, bonds and stocks answer.',
  },
  {
    id: 'f3',
    title: 'Inflation and your currency',
    topic: 'fundamental',
    level: 'core',
    minutes: 8,
    truth: 'historical',
    status: 'planned',
    needs: ['f1'],
    practice:
      'Replay the cedi through 2022 and the naira through 2023, month by month.',
  },
  {
    id: 'f4',
    title: 'Reading an income statement',
    topic: 'fundamental',
    level: 'core',
    minutes: 10,
    truth: 'simulation',
    status: 'planned',
    practice:
      'Take apart a made-up Kumasi cocoa company: revenue, costs, and what’s left.',
  },
  {
    id: 'f5',
    title: 'Valuation: cheap or just bad?',
    topic: 'fundamental',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'planned',
    needs: ['f4'],
    practice:
      'Price two companies by P/E and dividend yield, and find the value trap.',
  },
  {
    id: 'f6',
    title: 'The economic calendar',
    topic: 'fundamental',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['f2'],
    practice:
      'Trade through a rate-decision day twice: once with a plan, once without.',
  },
  {
    id: 'f7',
    title: 'Commodities and African currencies',
    topic: 'fundamental',
    level: 'core',
    minutes: 8,
    truth: 'historical',
    status: 'planned',
    needs: ['f1'],
    practice: 'See why the cedi and the naira follow cocoa, gold and oil.',
  },
  {
    id: 'f8',
    title: 'Forex: interest-rate differentials',
    topic: 'fundamental',
    level: 'advanced',
    minutes: 8,
    truth: 'simulation',
    status: 'planned',
    needs: ['f2'],
    practice:
      'Watch money flow to the higher rate, and see what happens when it runs out.',
  },
  {
    id: 'f9',
    title: 'Fundamentals and technicals together',
    topic: 'fundamental',
    level: 'advanced',
    minutes: 9,
    truth: 'historical',
    status: 'planned',
    needs: ['f2', 'c5'],
    practice:
      'Let fundamentals pick the direction and the chart pick the moment, on a real episode.',
  },

  // Strategies
  {
    id: 's1',
    title: 'Trend following',
    topic: 'strategies',
    level: 'core',
    minutes: 10,
    truth: 'historical',
    status: 'planned',
    needs: ['t2', 'r2'],
    practice:
      'Run the rules on a replay, including the long flat months nobody posts about.',
  },
  {
    id: 's2',
    title: 'Range trading',
    topic: 'strategies',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'planned',
    needs: ['c5', 'r1'],
    practice:
      'Buy support and sell resistance, until the range breaks. Then see what your rules did.',
  },
  {
    id: 's3',
    title: 'Breakouts',
    topic: 'strategies',
    level: 'core',
    minutes: 9,
    truth: 'historical',
    status: 'planned',
    needs: ['c7'],
    practice:
      'Tell real breakouts from fakes using closes and volume, then trade twenty of them.',
  },
  {
    id: 's4',
    title: 'Swing, day and position trading',
    topic: 'strategies',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['c3'],
    practice:
      'Trade the same market on three timeframes, and see what each one costs you in time.',
  },
  {
    id: 's5',
    title: 'News trading',
    topic: 'strategies',
    level: 'advanced',
    minutes: 7,
    truth: 'simulation',
    status: 'planned',
    needs: ['f6'],
    practice:
      'See why spreads widen and stops slip in the second the numbers drop.',
  },
  {
    id: 's6',
    title: 'Investing is not trading',
    topic: 'strategies',
    level: 'starter',
    minutes: 8,
    truth: 'historical',
    status: 'planned',
    practice:
      'Buy a little every month for ten years of history, against trading in and out of it.',
  },
  {
    id: 's7',
    title: 'Build your own strategy',
    topic: 'strategies',
    level: 'advanced',
    minutes: 15,
    truth: 'historical',
    status: 'planned',
    needs: ['r6', 's1'],
    practice:
      'Write your rules, backtest them on replays, then forward-test them on paper.',
  },

  // Prove it
  {
    id: 'p1',
    title: 'Your trading plan',
    topic: 'mind',
    level: 'core',
    minutes: 12,
    truth: 'educational',
    status: 'planned',
    needs: ['r2'],
    practice:
      'Write your markets, setups, risk and bad-day rules. The coach looks for the gaps.',
  },
  {
    id: 'p2',
    title: 'The trading journal',
    topic: 'mind',
    level: 'starter',
    minutes: 6,
    truth: 'educational',
    status: 'planned',
    practice:
      'Log why before every trade, and what happened after. The coach spots your patterns.',
  },
  {
    id: 'p3',
    title: 'FOMO, revenge and overtrading',
    topic: 'mind',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'planned',
    needs: ['r1'],
    practice:
      'Play a session built to tempt you, then see exactly what you did.',
  },
  {
    id: 'p4',
    title: 'Market replays',
    topic: 'mind',
    level: 'advanced',
    minutes: 15,
    truth: 'historical',
    status: 'planned',
    needs: ['r2'],
    practice:
      'Trade sealed historical episodes with no look-ahead: 2008, March 2020, the cedi in 2022.',
  },
  {
    id: 'p5',
    title: 'The 30-day paper challenge',
    topic: 'mind',
    level: 'advanced',
    minutes: 30,
    truth: 'simulation',
    status: 'planned',
    needs: ['p1', 'p2'],
    practice:
      'Thirty days on paper, graded on following your plan, not on profit.',
  },
];

export function lesson(id: string): Lesson {
  const found = LESSONS.find((item) => item.id === id);
  if (!found) throw new Error(`No lesson ${id}`);
  return found;
}
