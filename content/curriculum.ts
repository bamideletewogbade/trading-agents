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
  /** Where it can be played today: a page, or a page and an anchor. */
  playAt?: string;
  /**
   * Words people use when they're looking for this lesson but don't know
   * its name ("dangote", "overbought"). The open-ended "what do you want to
   * understand?" box matches on these as well as the title.
   */
  keywords?: string[];
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
    lessons: ['m0', 'm1', 'm2', 'm3', 'm4', 'f0', 'm5', 'm6'],
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
    id: 'm0',
    title: 'Noise and signal: how traders think',
    topic: 'mind',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/m0',
    keywords: [
      'mindset',
      'noise',
      'signal',
      'hype',
      'psychology',
      'beginner',
      'start',
      'get rich',
      'extra income',
      'side hustle',
    ],
    practice:
      'Slide a filter over a jumpy price until the real direction shows, then sort headlines into noise and signal.',
  },
  {
    id: 'f0',
    title: 'How an IPO works: the Dangote offer',
    topic: 'fundamental',
    level: 'starter',
    minutes: 8,
    truth: 'educational',
    status: 'live',
    playAt: '/lesson/f0',
    keywords: [
      'ipo',
      'dangote',
      'refinery',
      'offer',
      'allotment',
      'listing',
      'shares',
      'subscribe',
      'prospectus',
      'ngx',
      'public offer',
    ],
    practice:
      'Put a budget into an application, see what oversubscription does to it, and size the company up at the offer price.',
  },
  {
    id: 'm1',
    title: 'What a price actually is',
    topic: 'markets',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/m1',
    practice:
      'Watch buyers and sellers meet in an order book. Move one order and see the price change.',
  },
  {
    id: 'm2',
    keywords: ['spread', 'bid', 'ask', 'fees'],
    title: 'Bid, ask and the spread',
    topic: 'markets',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/m2',
    practice:
      'Buy and sell ten times in a row and watch the spread take its cut every time.',
  },
  {
    id: 'm3',
    keywords: ['order', 'limit', 'stop order', 'market order', 'buy', 'sell'],
    title: 'Market, limit and stop orders',
    topic: 'markets',
    level: 'starter',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/m3',
    needs: ['m2'],
    practice:
      'Place each kind of order in a moving market. See which fill, when, and at what price.',
  },
  {
    id: 'm4',
    keywords: [
      'forex',
      'fx',
      'stocks',
      'crypto',
      'bitcoin',
      'cocoa',
      'gold',
      'oil',
      'commodities',
    ],
    title: 'Forex, stocks, crypto, commodities',
    topic: 'markets',
    level: 'starter',
    minutes: 7,
    truth: 'educational',
    status: 'live',
    playAt: '/lesson/m4',
    practice:
      'Sort a dozen headlines by the market they move: USD/GHS, the NGX, bitcoin, cocoa.',
  },
  {
    id: 'm5',
    keywords: [
      'leverage',
      'margin',
      'liquidation',
      'liquidated',
      'lot size',
      'forex',
    ],
    title: 'Leverage and margin',
    topic: 'markets',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/m5',
    practice:
      'You have $100. Choose your leverage, predict the damage of a 3% fall, then watch the market do it.',
  },
  {
    id: 'm6',
    keywords: [
      'broker',
      'signals',
      'account manager',
      'scam',
      'telegram',
      'whatsapp group',
    ],
    title: 'Who makes money from you',
    topic: 'markets',
    level: 'starter',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/m6',
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
    status: 'live',
    playAt: '/lesson/c1',
    practice: 'See the same week as three charts and find what each one hides.',
  },
  {
    id: 'c2',
    keywords: ['candle', 'candlestick', 'wick', 'open', 'close', 'chart'],
    title: 'Anatomy of a candle',
    topic: 'charts',
    level: 'starter',
    minutes: 4,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/c2',
    practice:
      'Step through a chart candle by candle: open, high, low, close, and who won each one.',
  },
  {
    id: 'c3',
    keywords: ['timeframe', 'daily', 'hourly', 'chart'],
    title: 'Timeframes',
    topic: 'charts',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/c3',
    needs: ['c2'],
    practice:
      'Zoom a month into days into hours. The same move tells three different stories.',
  },
  {
    id: 'c4',
    keywords: ['trend', 'uptrend', 'downtrend', 'higher highs', 'chart'],
    title: 'Trends: higher highs, higher lows',
    topic: 'charts',
    level: 'starter',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/c4',
    needs: ['c2'],
    practice:
      'Mark the swing highs and lows yourself, and watch a trend form or fail.',
  },
  {
    id: 'c5',
    keywords: [
      'support',
      'resistance',
      'level',
      'chart',
      'read the market',
      'read a chart',
    ],
    title: 'Support and resistance',
    topic: 'charts',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/c5',
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
    status: 'live',
    playAt: '/lesson/c6',
    needs: ['c4', 'c5'],
    practice:
      'Sort ten charts into ranges and trends, and see why a tool that works in one fails in the other.',
  },
  {
    id: 'c7',
    keywords: ['volume', 'breakout'],
    title: 'Volume: who showed up',
    topic: 'charts',
    level: 'core',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/c7',
    needs: ['c5'],
    practice:
      'Hide and show volume, and watch a breakout go from convincing to empty.',
  },

  // Risk first
  {
    id: 'r1',
    keywords: ['stop loss', 'stop', 'stopped out', 'sl', 'risk'],
    title: 'Stop losses: where am I wrong?',
    topic: 'risk',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/r1',
    needs: ['c5'],
    practice:
      'Set your stop before you buy, then replay the same trade with a tight stop, a stop with room, and none.',
  },
  {
    id: 'r2',
    keywords: ['position size', 'lot size', 'how much to buy', '1%', 'risk'],
    title: 'Position size and the 1% rule',
    topic: 'risk',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/r2',
    needs: ['r1'],
    practice:
      'Drag your stop and watch the position size itself so a loss is always 1% of the account.',
  },
  {
    id: 'r3',
    keywords: ['risk reward', 'r multiple', 'win rate'],
    title: 'Risk-reward and R-multiples',
    topic: 'risk',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/r3',
    needs: ['r2'],
    practice:
      'Score ten trades in R instead of cedis, and see how a 40% win rate can still pay.',
  },
  {
    id: 'r4',
    keywords: ['drawdown', 'lost money', 'blew my account', 'recover'],
    title: 'Drawdown and the climb back',
    topic: 'risk',
    level: 'starter',
    minutes: 5,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/r4',
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
    status: 'live',
    playAt: '/lesson/r5',
    needs: ['m5', 'r2'],
    practice:
      'The same trade at 5× and at 25×. Watch the path, not the ending.',
  },
  {
    id: 'r6',
    keywords: ['expectancy', 'edge', 'win rate'],
    title: 'Expectancy',
    topic: 'risk',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/r6',
    needs: ['r3'],
    practice:
      'Run a strategy for 200 simulated trades and see its edge, or its lack of one, appear.',
  },

  // Technical analysis
  {
    id: 't1',
    keywords: ['trendline', 'trend line', 'channel', 'support line'],
    title: 'Trendlines and channels',
    topic: 'technical',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t1',
    needs: ['c4'],
    practice:
      'Draw lines through the lows of a chart and see which ones price respects, and which one is a trap.',
  },
  {
    id: 't2',
    keywords: ['moving average', 'sma', 'ema', 'crossover', 'indicator'],
    title: 'Moving averages',
    topic: 'technical',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t2',
    needs: ['c4'],
    practice:
      'Drag the length of an SMA and an EMA. Watch them lag, and watch crossovers arrive late.',
  },
  {
    id: 't3',
    keywords: ['rsi', 'overbought', 'oversold', 'momentum', 'indicator'],
    title: 'RSI and momentum',
    topic: 'technical',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t3',
    needs: ['c4'],
    practice:
      'Play a strong run bar by bar, watch RSI pass 70, and learn why "overbought" doesn’t mean "sell".',
  },
  {
    id: 't4',
    keywords: ['macd', 'indicator'],
    title: 'MACD',
    topic: 'technical',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t4',
    needs: ['t2'],
    practice:
      'Build MACD yourself from two moving averages, one step at a time.',
  },
  {
    id: 't5',
    keywords: ['bollinger', 'atr', 'volatility', 'indicator'],
    title: 'Volatility: Bollinger Bands and ATR',
    topic: 'technical',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t5',
    needs: ['r1'],
    practice:
      'Use ATR to put your stop outside the everyday noise, and compare it with a guess.',
  },
  {
    id: 't6',
    keywords: ['candlestick pattern', 'engulfing', 'pin bar', 'doji', 'hammer'],
    title: 'Candlestick patterns, honestly',
    topic: 'technical',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t6',
    needs: ['c2', 'c5'],
    practice:
      'Spot engulfing candles, hammers and dojis, then count how often they beat any candle at all, on charts with no edge built in.',
  },
  {
    id: 't7',
    keywords: [
      'head and shoulders',
      'double top',
      'flag',
      'triangle',
      'pattern',
    ],
    title: 'Chart patterns',
    topic: 'technical',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t7',
    needs: ['c5', 't1'],
    practice:
      'Find a double top’s neckline, then play both endings of the same chart. Nothing is a pattern until its line breaks.',
  },
  {
    id: 't8',
    keywords: ['fibonacci', 'fib', 'retracement'],
    title: 'Fibonacci, with a sceptic',
    topic: 'technical',
    level: 'advanced',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t8',
    needs: ['c4'],
    practice:
      'Draw the levels, then test them on charts that were generated at random.',
  },
  {
    id: 't9',
    keywords: ['timeframe', 'multi timeframe', 'daily', 'hourly', 'top down'],
    title: 'Reading several timeframes',
    topic: 'technical',
    level: 'advanced',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t9',
    needs: ['c3', 't2'],
    practice:
      'Take the direction from the daily chart and the timing from the hourly.',
  },
  {
    id: 't10',
    keywords: [
      'divergence',
      'bearish divergence',
      'rsi divergence',
      'momentum',
    ],
    title: 'Divergence',
    topic: 'technical',
    level: 'advanced',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/t10',
    needs: ['t3'],
    practice:
      'Price makes a new high and RSI doesn’t. Mark it, then play both endings of the same chart.',
  },

  // Fundamental analysis
  {
    id: 'f1',
    keywords: ['news', 'fundamentals', 'what moves prices'],
    title: 'What moves prices',
    topic: 'fundamental',
    level: 'starter',
    minutes: 6,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f1',
    practice:
      'Feed a simulated market a rate decision, an inflation figure and company profits, and see that only the surprise moves it.',
  },
  {
    id: 'f2',
    keywords: [
      'interest rate',
      'central bank',
      'cbn',
      'bank of ghana',
      'mpr',
      'policy rate',
    ],
    title: 'Central banks and interest rates',
    topic: 'fundamental',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f2',
    needs: ['f1'],
    practice:
      'Set the policy rate as the central bank, and watch the currency, bonds and stocks answer.',
  },
  {
    id: 'f3',
    keywords: ['inflation', 'naira', 'cedi', 'devaluation', 'currency'],
    title: 'Inflation and your currency',
    topic: 'fundamental',
    level: 'core',
    minutes: 8,
    truth: 'historical',
    status: 'live',
    playAt: '/lesson/f3',
    needs: ['f1'],
    practice:
      'Step through Ghana’s 2022 and Nigeria’s 2023 month by month, on the published figures, and see what they did to savings.',
  },
  {
    id: 'f4',
    keywords: [
      'income statement',
      'earnings',
      'profit',
      'revenue',
      'financial statements',
    ],
    title: 'Reading an income statement',
    topic: 'fundamental',
    level: 'core',
    minutes: 10,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f4',
    practice:
      'Take apart a made-up Kumasi cocoa processor: revenue, each layer of cost, and what’s left.',
  },
  {
    id: 'f5',
    keywords: ['valuation', 'p/e', 'pe ratio', 'dividend', 'cheap stock'],
    title: 'Valuation: cheap or just bad?',
    topic: 'fundamental',
    level: 'core',
    minutes: 9,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f5',
    needs: ['f4'],
    practice:
      'Price two companies by P/E and dividend yield, play five years, and find the value trap.',
  },
  {
    id: 'f6',
    keywords: [
      'economic calendar',
      'news trading',
      'nfp',
      'rate decision',
      'slippage',
    ],
    title: 'The economic calendar',
    topic: 'fundamental',
    level: 'core',
    minutes: 7,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f6',
    needs: ['f2'],
    practice:
      'Trade a rate-decision day twice: holding a tight stop through it, and waiting for it to settle.',
  },
  {
    id: 'f7',
    keywords: ['cocoa', 'oil', 'gold', 'commodities', 'naira', 'cedi'],
    title: 'Commodities and African currencies',
    topic: 'fundamental',
    level: 'core',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f7',
    needs: ['f1'],
    practice:
      'Move oil, gold and cocoa prices and watch the dollars two model economies earn against what they need.',
  },
  {
    id: 'f8',
    keywords: [
      'carry trade',
      'interest rate differential',
      't-bill',
      'devaluation',
      'forex',
    ],
    title: 'Forex: interest-rate differentials',
    topic: 'fundamental',
    level: 'advanced',
    minutes: 8,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f8',
    needs: ['f2'],
    practice:
      'Borrow cheap and lend dear, month by month, until the currency falls. Then see Ghana’s 2022 from a dollar investor’s side.',
  },
  {
    id: 'f9',
    keywords: ['fundamental and technical', 'entry', 'timing', 'pullback'],
    title: 'Fundamentals and technicals together',
    topic: 'fundamental',
    level: 'advanced',
    minutes: 9,
    truth: 'simulation',
    status: 'live',
    playAt: '/lesson/f9',
    needs: ['f2', 'c5'],
    practice:
      'Let the news pick the direction and the chart pick the moment, then replay the ending where the news fades.',
  },

  // Strategies
  {
    id: 's1',
    keywords: ['trend following', 'strategy'],
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
    keywords: ['range trading', 'mean reversion', 'strategy'],
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
    keywords: ['breakout', 'strategy'],
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
    keywords: [
      'investing',
      'long term',
      'dca',
      'dollar cost averaging',
      'retirement',
    ],
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
    keywords: ['backtest', 'strategy', 'system', 'rules'],
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
    keywords: ['trading plan', 'plan'],
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
    keywords: ['journal', 'trading journal'],
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
    keywords: [
      'fomo',
      'revenge trading',
      'overtrading',
      'psychology',
      'emotions',
      'discipline',
    ],
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
