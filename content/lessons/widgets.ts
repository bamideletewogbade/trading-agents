/**
 * The words inside the lesson widgets and the player. Numbers arrive
 * formatted from the widget, which gets them from lib/engines.
 */

export const PLAYER = {
  tags: {
    see: 'See it',
    touch: 'Touch it',
    predict: 'Predict',
    decide: 'Decide',
    consequence: 'What happened',
    why: 'Why',
    again: 'Again',
    check: 'Check',
  },
  continue: 'Continue',
  locked: 'Try it first',
  answer: 'Pick an answer',
  back: 'Back',
  exit: 'Leave lesson',
  step: (n: number, total: number) => `${n} of ${total}`,
  right: 'Right',
  notQuite: 'Not quite',
  finish: 'Finish',
  done: {
    kicker: 'Lesson complete',
    score: (right: number, total: number) =>
      total === 0 ? '' : `${right} of ${total} answered right first time`,
    remember: 'Remember',
    next: 'Next lesson',
    roadmap: 'Back to the roadmap',
    desk: 'Your desk',
    again: 'Play it again',
    saved: 'Progress saved',
    savedLocal: 'Progress saved on this phone',
  },
  notFound: {
    title: 'That lesson isn’t playable yet',
    body: 'It’s on the roadmap. Stages 1 to 3 are playable now.',
    cta: 'See the roadmap',
  },
};

export const WIDGET_COPY = {
  orderBook: {
    asks: 'Sellers (asks)',
    bids: 'Buyers (bids)',
    price: 'Price',
    size: 'Units',
    buySmall: (n: number) => `Buy ${n} at market`,
    buyBig: (n: number) => `Buy ${n} at market`,
    reset: 'Reset the book',
    last: 'Last trade',
    average: 'Your average price',
    filled: (n: number) => `${n} units bought`,
  },
  spread: {
    bid: 'Bid (you sell here)',
    ask: 'Ask (you buy here)',
    button: (n: number) => `Buy ${n}, then sell ${n} back`,
    trips: 'Round trips',
    cost: 'Spread paid',
    price: 'Price moved',
    none: 'not at all',
  },
  orderTypes: {
    kinds: {
      market: 'Market',
      limit: 'Limit',
      stop: 'Stop',
    },
    describe: {
      market: (price: string) => `Buy now at ${price}`,
      limit: (price: string) => `Buy only at ${price} or lower`,
      stop: (price: string) => `Buy once the price reaches ${price}`,
    },
    play: 'Play the market',
    filled: (price: string, step: number) =>
      `Filled at ${price}, ${step === 0 ? 'straight away' : `after ${step} ticks`}`,
    never: 'Never filled: the price never came to you',
    slipped: (amount: string) =>
      `That’s ${amount} worse than the trigger: slippage`,
  },
  sorter: {
    markets: ['Forex', 'Stocks', 'Crypto', 'Commodities'] as const,
    items: [
      {
        headline: 'Central bank raises its policy rate by 2 points',
        answer: 'Forex',
        why: 'Rates move the currency first: money flows towards higher rates.',
      },
      {
        headline: 'A big telecom company reports record yearly profit',
        answer: 'Stocks',
        why: 'Profits belong to shareholders. Its shares react first.',
      },
      {
        headline: 'A large crypto exchange says it was hacked',
        answer: 'Crypto',
        why: 'Trust in the whole market takes the hit, and coins sell off.',
      },
      {
        headline: 'Poor rains cut the cocoa harvest',
        answer: 'Commodities',
        why: 'Less supply of cocoa pushes its price up, and later the cedi feels it.',
      },
    ] as const,
    right: 'Right',
    wrong: (answer: string) => `It’s ${answer} first`,
  },
  costs: {
    deposit: 'Deposit',
    trades: 'Trades this month',
    nights: 'Nights holding overnight',
    subscription: 'Paying for a signals group',
    yes: 'Yes',
    no: 'No',
    spreads: 'Spreads',
    overnight: 'Overnight fees',
    signals: 'Signals subscription',
    left: 'Left, if every trade broke even',
  },
  chartTypes: {
    modes: { line: 'Line', bar: 'Bars', candle: 'Candles' },
    notes: {
      line: 'Only the closes, joined up. Clean, but the highs and lows are gone.',
      bar: 'Each bar: a line from low to high, a tick left for the open, right for the close.',
      candle:
        'Each candle: a body from open to close, and wicks to the high and low. Hollow is up, filled is down.',
    },
  },
  timeframes: {
    frames: { '1': '1 hour', '4': '4 hours', '24': '1 day' },
    note: (candles: number, direction: 'up' | 'down') =>
      `${candles} candles. Over what’s shown, the price is ${direction === 'up' ? 'higher ▲' : 'lower ▼'} than where it started the last stretch.`,
    hourly: 'On the hourly chart the last half-day looks like a slide.',
    daily: 'On the daily chart, the same slide is a small dip in a rise.',
  },
  swings: {
    charts: { up: 'Chart A', down: 'Chart B' },
    mark: 'Mark the swings',
    trend: { up: 'Uptrend ▲', down: 'Downtrend ▼', sideways: 'Sideways ◆' },
    legend: 'HH higher high · HL higher low · LH lower high · LL lower low',
  },
  sort: {
    trend: 'Trend',
    range: 'Range',
    efficiency: (pct: string) => `Travelled with ${pct} efficiency`,
    right: 'Right',
    wrong: (answer: string) => `It’s a ${answer.toLowerCase()}`,
  },
  breakout: {
    a: 'Breakout A',
    b: 'Breakout B',
    showVolume: 'Show volume',
    hideVolume: 'Hide volume',
    pick: 'Which one do you trust?',
    play: 'Play what happened',
    held: 'Held and kept going ▲',
    failed: 'Fell back into the range ▼',
    right: 'You picked the one with buyers behind it.',
    wrong: 'That one had thin volume. Few buyers were behind it.',
  },
  positionSize: {
    account: 'Account',
    risk: 'Risk per trade',
    entry: 'Buy at',
    stop: 'Stop at',
    distance: 'Stop distance',
    shares: 'Position',
    value: 'Position value',
    loss: 'Loss if stopped',
    units: (n: number) => `${n} shares`,
  },
  rMultiples: {
    winRate: 'Win rate',
    winSize: 'Average win',
    lossSize: 'Average loss',
    perTrade: 'Worth per trade, on average',
    ten: 'After ten trades',
    breakEven: (rate: string) =>
      `With wins this size you break even at a ${rate} win rate.`,
  },
  drawdown: {
    loss: 'You lose',
    need: 'To get back you need',
    trades: 'Winning trades of +10% each',
    never: 'More than 500: effectively never',
  },
  expectancy: {
    winRate: 'Win rate',
    winSize: 'Average win',
    risk: 'Risk per trade',
    run: 'Run 200 trades',
    rerun: 'Run again',
    start: 'Start',
    end: 'After 200 trades',
    drawdown: 'Worst fall from a peak',
    perTrade: 'Expectancy per trade',
  },
  trendline: {
    pick: 'Tap two lows to draw a line through them',
    low: (key: string) => `Low ${key}`,
    clear: 'Start again',
    copy: 'Copy it to the highs',
    touches: (n: number) => `${n} touches`,
    breaks: (n: number) =>
      n === 0
        ? 'price never closed through it'
        : `price closed through it ${n} times`,
    good: 'A line price keeps respecting. That’s a trendline.',
    trap: 'Any two points make a line. Price ignored this one, so it isn’t support.',
    channel: 'The same slope along the highs: a channel.',
  },
  averages: {
    type: 'Type of average',
    kind: { sma: 'SMA', ema: 'EMA' },
    length: 'Length',
    bars: (n: number) => `${n} bars`,
    lag: (kind: string, length: number, bars: number | null) =>
      bars === null
        ? `Your ${kind} ${length} hadn’t turned down by the end of the chart.`
        : `Price topped out. Your ${kind} ${length} only turned down ${bars} bars later.`,
    slow: 'Add a slow 30-bar average',
    crosses: (n: number, late: number | null) =>
      late === null
        ? `${n} crossovers, none after the top.`
        : `${n} crossovers. The sell cross came ${late} bars after the top.`,
    legend: {
      price: 'Price',
      fast: 'Your average',
      slow: 'Slow average (dashed)',
    },
  },
  rsiRun: {
    more: (n: number) => `Next ${n} bars`,
    value: 'RSI now',
    crossed: 'RSI passed 70 here',
    outcome: (sold: string, later: string, move: string) =>
      `Selling when RSI first passed 70 meant selling at ${sold}. Price went on to ${later}: ${move} more.`,
    legend: 'Lower pane: RSI, with lines at 30 and 70',
  },
  macdBuild: {
    next: 'Add the next piece',
    again: 'Start again',
    steps: [
      'Two averages of price: a fast one (12 bars, gold) and a slow one (26 bars, blue, dashed).',
      'The MACD line is the fast average minus the slow one. Above zero, the fast one is on top.',
      'The signal line is a 9-bar average of the MACD line (dashed). Crosses of the two are the “signals” people talk about.',
      'The histogram is the gap between them. It shrinks before the lines cross, which is why people watch it.',
    ],
    pane: 'MACD',
  },
  atrStops: {
    which: 'Market',
    market: { quiet: 'A quiet market', wild: 'A wild market' },
    atrNow: 'ATR now',
    multiple: 'Stop distance, in ATRs',
    times: (k: string) => `${k} × ATR`,
    guess: (stop: string, rate: string) =>
      `A guessed ${stop} stop: noise hits it ${rate} of the time here.`,
    yours: (rate: string) =>
      `Your ATR stop: noise hits it ${rate} of the time.`,
    bands:
      'Bollinger Bands (the grey lines) widen when the market gets wilder.',
  },
  patternTest: {
    run: 'Test on 200 simulated charts',
    names: {
      engulfing: 'Bullish engulfing',
      hammer: 'Hammer (pin bar)',
      doji: 'Doji',
      'any bar': 'Any candle at all',
    },
    kind: 'Pattern',
    found: 'Found',
    rose: 'Price higher 5 bars later',
    marked: 'Marked on the chart: E engulfing · H hammer · D doji',
    honest:
      'These charts have no edge built in, so nothing on them can predict anything. A pattern that scores like “any candle at all” is doing nothing more than a coin flip.',
  },
  doubleTop: {
    find: 'Where would the pattern be confirmed?',
    line: (key: string) => `Line ${key.toUpperCase()}`,
    right:
      'Yes: the neckline, the low between the two tops. Until it breaks, it’s just two highs.',
    wrong: 'Not that one. Look for the low between the two tops.',
    play: 'Play what happened',
    other: {
      break: 'Replay: what if it held?',
      fail: 'Replay: what if it broke?',
    },
    broke: (target: string) =>
      `The neckline broke. The textbook target is the pattern’s height below it: ${target}.`,
    held: 'The neckline held and price broke out above both tops. Two highs were never a pattern.',
  },
  fibTest: {
    show: 'Show made-up levels too',
    hide: 'Hide made-up levels',
    run: 'Test both on 300 random charts',
    fib: (levels: string) => `Fibonacci levels (${levels})`,
    madeUp: (levels: string) => `Made-up levels (${levels})`,
    rate: (reactions: number, chances: number, rate: string) =>
      `${reactions} bounces in ${chances} chances: ${rate}`,
  },
  timeframesTrade: {
    which: 'The bigger trend',
    trend: { up: 'Bigger trend up', down: 'Bigger trend down' },
    daily: 'Daily',
    hourly: 'Hourly, the last day and a half',
    run: 'Test buying hourly dips, 150 charts each way',
    rows: {
      up: 'Dips bought in an uptrend',
      down: 'Dips bought in a downtrend',
    },
    wins: 'Won',
    average: 'Average result',
  },
  divergence: {
    mark: 'Mark the two highs',
    price: (first: string, second: string) =>
      `Price: ${first} → ${second}, a higher high`,
    rsi: (first: string, second: string) =>
      `RSI: ${first} → ${second}, a lower high`,
    play: 'Play what happened',
    other: {
      reversal: 'Replay: the other way',
      continuation: 'Replay: the other way',
    },
    reversal: 'It rolled over. The divergence was an early warning.',
    continuation:
      'It kept rising anyway. Divergence is a warning, not a signal.',
    pane: 'RSI',
  },
};
