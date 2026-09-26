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
};
