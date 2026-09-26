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
      total === 0 ? '' : `${right} of ${total} right first time`,
    xp: (xp: number) => `+${xp} XP`,
    xpUnit: 'XP',
    replay: 'Practice',
    streakStarted: 'Streak started',
    streakDay: (days: number) => `${days}-day streak`,
    goal: (done: number, goal: number) =>
      `${Math.min(done, goal)} of ${goal} today`,
    goalMet: 'Daily goal met',
    stage: (title: string) => `Stage finished: ${title}`,
    badge: 'New badge on your Me page',
    remember: 'Remember',
    next: 'Next lesson',
    path: 'Back to your path',
    again: 'Play it again',
    saved: 'Progress saved',
    savedLocal: 'Progress saved on this phone',
  },
  xpLabel: (xp: number) => `${xp} XP this lesson`,
  loading: 'Loading…',
  notFound: {
    title: 'That lesson isn’t ready yet',
    body: 'It’s on the path, and it’s coming. Here are the ones you can play now.',
    cta: 'See all lessons',
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
  newsSurprise: {
    which: 'The news',
    kinds: {
      rates: 'Rate decision',
      inflation: 'Inflation figure',
      earnings: 'Company profits',
    },
    expected: {
      rates: (pts: string) => `Expected: rates up ${pts} points`,
      inflation: (rate: string) => `Expected: inflation at ${rate}`,
      earnings: (rate: string) => `Expected: profits up ${rate}`,
    },
    actual: 'What actually happened',
    shown: {
      rates: (pts: string) => `Rates up ${pts} points`,
      inflation: (rate: string) => `Inflation at ${rate}`,
      earnings: (rate: string, up: boolean) =>
        up ? `Profits up ${rate}` : `Profits down ${rate}`,
    },
    news: 'NEWS',
    before:
      'Before the news, the price had already moved on what people expected.',
    result: (surprise: string, move: string) =>
      `Surprise: ${surprise} points. The price on the day: ${move}.`,
    none: 'No surprise: the news was already in the price, so it barely moved.',
  },
  rateSetter: {
    rate: 'The policy rate',
    start: (rate: string) => `Starting from ${rate}`,
    deposit: (amount: string) => `${amount} saved for a year earns`,
    loan: (amount: string, months: number) =>
      `A ${amount} loan over ${months} months costs, a month`,
    bond: (years: number, face: string, coupon: string) =>
      `A ${years}-year bond bought for ${face} paying ${coupon}, now worth`,
    share: (dividend: string) =>
      `A share paying ${dividend} a year, and growing, now worth`,
    change: (delta: string) => `${delta} from the start`,
  },
  inflationReplay: {
    which: 'Which year',
    years: { ghana: 'Ghana 2022', nigeria: 'Nigeria 2023' },
    keep: 'Where the money sat',
    places: {
      cash: 'Cash at home',
      savings: (rate: string) => `Savings at ${rate}`,
      bills: '91-day T-bills',
    },
    billsNote:
      'T-bills rolled every three months at the Bank of Ghana’s published rates.',
    savingsNote: (rate: string) =>
      `A ${rate} savings rate is our example, not a published figure.`,
    next: 'Next month',
    again: 'Start the year again',
    now: (month: string, rate: string) =>
      `${month}: prices ${rate} higher than a year before`,
    legend: {
      inflation: 'Inflation, year on year',
      policy: 'Bank of Ghana policy rate (dashed)',
    },
    saved: (start: string, end: string) => `Saved ${start}, it became ${end}.`,
    bought: (rate: string, real: string) =>
      `Prices rose ${rate} over the year, so it buys what ${real} bought when you saved it.`,
    phone: (price: string, before: string, after: string) =>
      `A ${price} phone: ${before} at the start of the year, ${after} at the end.`,
    source: 'Source',
  },
  incomeStatement: {
    tonnes: 'Tonnes sold',
    tonnesShown: (n: string) => `${n} t`,
    beans: 'Cost of beans, a tonne',
    lines: {
      revenue: 'Revenue',
      costOfSales: 'Cost of sales (beans and processing)',
      grossProfit: 'Gross profit',
      operatingCosts: 'Running costs (salaries, rent)',
      operatingProfit: 'Operating profit',
      interest: 'Interest on loans',
      profitBeforeTax: 'Profit before tax',
      tax: (rate: string) => `Tax at ${rate}`,
      netProfit: 'Net profit',
    },
    grossMargin: 'Gross margin',
    netMargin: 'Net margin',
    eps: 'Earnings per share',
    versus: (change: string) => `Net profit ${change} against the first year.`,
  },
  valueTrap: {
    names: {
      cheap: 'Company A: a cement maker',
      dear: 'Company B: a payments company',
    },
    pe: 'P/E',
    yield: 'Dividend yield',
    times: (n: string) => `${n}×`,
    play: (years: number) => `Play ${years} years`,
    story: {
      cheap: 'Its one big contract ends this year.',
      dear: 'Signing up shops fast.',
    },
    invested: (amount: string) =>
      `${amount} invested in each, P/E kept the same:`,
    ended: (value: string, change: string) =>
      `Ended at ${value} (${change}), dividends included`,
    earnings: 'Earnings a share, each year',
    slider: 'Company A’s earnings, each year',
    shrink: (rate: string) =>
      `Company A could have shrunk ${rate} a year and still not lost money.`,
    change: (rate: string) =>
      rate.startsWith('−') ? `down ${rate.slice(1)}` : `up ${rate}`,
  },
  releaseDay: {
    plan: 'Your plan',
    plans: { hold: 'Hold through the news', wait: 'Wait for it to settle' },
    play: 'Play the day',
    another: 'Try another day',
    news: 'RATE DECISION',
    entry: 'Entry',
    stop: 'Stop',
    planned: (amount: string) => `Planned to lose at most ${amount}.`,
    slipped: (fill: string, stop: string) =>
      `The stop was at ${stop}. The first price after the release was lower, so it filled at ${fill}.`,
    filled: (fill: string) => `Stopped out at ${fill}.`,
    result: (pnl: string) => `Result: ${pnl}.`,
    side: { long: 'Bought', short: 'Sold' },
    at: (side: string, price: string) => `${side} at ${price}.`,
    spread: (normal: string, wide: string) =>
      `The spread: ${normal} most of the day, ${wide} at the release.`,
  },
  dollarEarnings: {
    prices: {
      oil: 'Oil, a barrel',
      gold: 'Gold, an ounce',
      cocoa: 'Cocoa, a tonne',
    },
    countries: { oil: 'Sells mostly oil', mixed: 'Sells gold, cocoa and oil' },
    earned: 'Dollars earned',
    needs: 'Dollars needed',
    gap: 'Left over',
    support: 'More dollars coming in than going out: the currency has support.',
    pressure: 'Short of dollars: pressure on the currency.',
    ofNeeds: (share: string) => `${share} of what it needs`,
    illustrative: 'Sizes are illustrative, not either country’s statistics.',
  },
  carryTrade: {
    next: (n: number) => `Next ${n} months`,
    again: 'Replay without the devaluation',
    withIt: 'Replay with the devaluation',
    profit: 'Profit if you closed now',
    fx: 'Local currency per dollar',
    month: (n: number) => `Month ${n}`,
    devalued: (loss: string) =>
      `The currency was devalued: it lost ${loss} of its value against the dollar in one month.`,
    summary: (earned: string, now: string) =>
      `Before the devaluation the trade was up ${earned}. At the end: ${now}.`,
    calm: (now: string) =>
      `No devaluation this time: the trade ends at ${now}.`,
    zero: 'Break-even',
  },
  newsPullback: {
    headline:
      'Headline: the central bank raises rates more than expected. Banks earn more when rates are high.',
    support: 'Old range top',
    plan: 'Your plan',
    plans: {
      chase: 'Buy on the news',
      pullback: 'Buy the pullback',
      fade: 'Sell: too far, too fast',
    },
    play: 'Play what happened',
    other: {
      holds: 'Replay: what if the good news fades?',
      fails: 'Replay: what if it holds?',
    },
    result: (r: string) => `Your result: ${r}`,
    all: 'All three plans, on this chart',
    endings: {
      holds: 'The move held.',
      fails: 'The good news faded and price fell back into the range.',
    },
    entry: 'Entry',
    stop: 'Stop',
  },
  /* Stage 6: strategies */
  backtest: {
    account: 'Account',
    start: 'Start',
    price: 'Price',
    trades: 'Trades',
    wins: 'Wins',
    winRate: 'Win rate',
    result: 'Result',
    worst: 'Worst trade',
    value: 'Account now',
    time: 'Play through time',
    bar: (n: number, of: number) => `Bar ${n} of ${of}`,
    toEnd: 'Play to the end',
    buy: 'BUY',
    sell: 'SELL',
    made: 'Made up: a simulation, not a real market.',
  },
  trendRules: {
    market: 'The market',
    markets: { trendy: 'Trends', choppy: 'Mostly sideways' },
    rules:
      'Buy when the 10-bar average crosses above the 30-bar one. Sell when it crosses back. Stop 3 ATRs below, risking 1% a trade.',
    legend: { fast: '10-bar average', slow: '30-bar average' },
    flat: 'Bars since the account’s last high',
    longest: (n: number) => `Longest wait so far: ${n} bars`,
    seeBoth: 'Now play the other market to the end.',
  },
  rangeRules: {
    plan: 'Your rules',
    plans: {
      none: 'No stop',
      stop: 'Stop',
      aside: 'Stop, then stand aside',
    },
    rules:
      'Buy when price closes below the lower band. Sell when it gets back to the middle.',
    help: {
      none: 'Hold until price comes back to the middle, however long that takes.',
      stop: 'A stop 1.5 ATRs below the entry. After a stop, keep trading the rules.',
      aside:
        'A stop 1.5 ATRs below. After a stop, take no more trades: the range may be over.',
    },
    legend: { middle: 'Middle band', lower: 'Lower band' },
    breaks: 'RANGE BREAKS',
    seeOther: 'Now try it with a different plan.',
  },
  breakoutPicks: {
    count: (n: number, of: number) => `Breakout ${n} of ${of}`,
    ceiling: 'Ceiling',
    volume: 'Volume on the breakout',
    times: (x: string) => `${x}× the range’s average`,
    take: 'Take it',
    skip: 'Skip it',
    took: (r: string) => `You took it: ${r}.`,
    skipped: (r: string) => `You skipped it. Taking it would have made ${r}.`,
    stopped: 'Fell back into the range and hit the stop.',
    held: 'It kept going.',
    next: 'Next breakout',
    rule: 'Buy the breakout’s close. Stop just back inside the range. Out after 10 bars.',
    summary: 'All twelve',
    rows: {
      you: 'Your picks',
      all: 'Take every one',
      volume: 'Only heavy volume (2× or more)',
    },
    taken: 'Taken',
    total: 'Total',
    each: 'Per trade',
  },
  tradeStyles: {
    style: 'The style',
    styles: { day: 'Day', swing: 'Swing', position: 'Position' },
    about: {
      day: 'Hourly candles. Out by every evening.',
      swing: 'Four-hour candles. Holds for days or weeks.',
      position: 'Daily candles. Holds for weeks or months.',
    },
    rules:
      'Same market, same trend rule, the whole account in when it buys. Only the chart changes.',
    spread: 'Spread paid',
    hours: 'Hours at the screen',
    hoursValue: (n: number) => `${n} h`,
    market: (move: string, months: number) =>
      `The market itself moved ${move} over these ${months} months.`,
    table: 'All three',
    seeAll: 'Look at all three styles.',
  },
  newsRules: {
    plan: 'Your plan',
    plans: { straddle: 'Straddle', wait: 'Wait for it to settle' },
    help: {
      straddle:
        'Before the release: an order to buy a little above the price and one to sell a little below. The first to fill wins; the other level becomes the stop.',
      wait: 'Let the release bar finish and three more go by. Then trade the way it settled, with the stop beyond the release bar.',
    },
    release: (n: number, of: number) => `Release ${n} of ${of}`,
    news: 'NUMBERS OUT',
    entry: 'Entry',
    stop: 'Stop',
    level: 'Order level',
    next: 'Next release',
    filled: (side: string, price: string) => `${side} at ${price}.`,
    side: { long: 'Bought', short: 'Sold' },
    slipped: (amount: string) =>
      `Slippage: ${amount}. The fills came at worse prices than the orders asked for.`,
    stopped: (price: string) => `Stopped out at ${price}.`,
    result: (pnl: string) => `Result: ${pnl}.`,
    planned: (amount: string) => `Planned to risk ${amount}.`,
    season: 'Play the whole season',
    table: (n: number) => `All ${n} releases`,
    rows: { straddle: 'Straddle', wait: 'Wait', out: 'Sit it out' },
    total: 'Total',
    worst: 'Worst day',
    over: 'Lost more than planned',
    days: (n: number) => (n === 1 ? '1 day' : `${n} days`),
  },
  investVsTrade: {
    month: (n: number) => `Month ${n} of 120`,
    time: 'Ten years, a month at a time',
    index: 'A made-up stock index',
    crash: 'CRASH',
    savers: {
      steady: 'Buys every month',
      timer: 'Sells after falls, buys after rises',
      missed: 'Buys every month, missed the 10 best',
    },
    paid: 'Paid in',
    value: 'Worth now',
    switches: (n: number) =>
      `The timer switched ${n} times, paying 1% each time.`,
    pane: 'What each saver has',
  },
  strategyBuilder: {
    entry: 'Buy when',
    entries: {
      'ma-cross': 'Averages cross up',
      breakout: 'New 20-bar high',
      'band-low': 'Below the lower band',
      'rsi-dip': 'RSI dips under 30',
    },
    exit: 'Sell when',
    exits: {
      signal: 'Its own exit',
      target: 'Up 2R',
      time: '10 bars pass',
    },
    exitHelp: {
      'ma-cross': 'Its own exit: the averages cross back down.',
      breakout: 'Its own exit: a new 10-bar low.',
      'band-low': 'Its own exit: back to the middle band.',
      'rsi-dip': 'Its own exit: RSI back above 50.',
    },
    stop: 'Stop',
    stops: { 10: '1 ATR', 20: '2 ATR', 30: '3 ATR' },
    risk: 'Every trade risks 1% of the account.',
    backtest: 'Backtest on the past',
    forward: 'Forward-test on what came next',
    optimise: 'Let the computer optimise',
    past: 'The past',
    next: 'What came next',
    yours: 'Your rules',
    optimised: (rules: string) => `The optimiser’s pick: ${rules}`,
    tried: (n: number) =>
      `It tried all ${n} combinations on the past and kept the best.`,
    rank: (rank: number, of: number) =>
      `On what came next it ranked ${rank} of ${of}.`,
    average: (bp: string) => `An average pick made ${bp} on what came next.`,
    changed: 'You changed the rules: backtest again.',
  },
};
