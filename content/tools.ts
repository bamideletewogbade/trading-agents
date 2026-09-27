/**
 * Words for the Tools screen: the calculators the risk lessons teach.
 * Numbers arrive worked out by lib/engines/tools.ts.
 */

export const TOOLS = {
  meta: { title: 'Tools' },
  kicker: 'Trade',
  title: 'Tools',
  lead: 'The sums behind every good trade, done for you. Size first, then decide.',
  pick: 'Calculator',
  list: {
    size: {
      name: 'Position size',
      lead: 'How much to buy so that being wrong costs only what you chose to risk.',
      lesson: 'r2',
    },
    lots: {
      name: 'Forex lots',
      lead: 'Lots for a pair quoted in dollars (EUR/USD, GBP/USD, AUD/USD), at $10 a pip for a standard lot.',
      lesson: 'r2',
    },
    rr: {
      name: 'Risk and reward',
      lead: 'What the target pays in R, and the win rate you need to break even at it.',
      lesson: 'r3',
    },
    climb: {
      name: 'The climb back',
      lead: 'After a loss, the gain that gets you back to even. It’s always bigger.',
      lesson: 'r4',
    },
    promise: {
      name: 'Promise check',
      lead: 'What “10% a month” really claims, compounded. Then ask who could pay that.',
      lesson: 'm6',
    },
    edge: {
      name: 'Your edge',
      lead: 'What a strategy makes per trade on average, from its win rate and its wins and losses.',
      lesson: 'r6',
    },
  },
  fields: {
    account: 'Account size',
    accountHelp: 'In the currency the price is quoted in: dollars for BTC/USD.',
    risk: 'Risk per trade (%)',
    entry: 'Entry price',
    stop: 'Stop price',
    target: 'Target price',
    pips: 'Stop distance (pips)',
    loss: 'Loss so far (%)',
    gain: 'Gain per good trade (%)',
    amount: 'Starting amount',
    monthly: 'Promised return a month (%)',
    months: 'Months',
    winRate: 'Win rate (%)',
    winR: 'Average win (R)',
    lossR: 'Average loss (R)',
    currency: 'Currency',
    entryHint: 'e.g. 84,025.5',
    stopHint: 'e.g. 80,100',
    inDollars: 'In US dollars.',
    inCedis: 'In cedis.',
  },
  results: {
    risk: 'At risk',
    quantity: 'Buy or sell',
    value: 'Position value',
    exposure: 'Against your account',
    stopShare: 'Stop distance',
    lots: 'Lots',
    pipValue: 'Each pip is worth',
    reward: 'The target pays',
    breakEven: 'Break-even win rate',
    side: 'Direction',
    needed: 'Gain needed to get back',
    trades: 'Good trades in a row',
    never: 'More than 500',
    end: 'It would become',
    multiple: 'That’s',
    perTrade: 'Per trade',
    perHundred: 'Per 100 trades',
  },
  side: { buy: 'Buy (stop below)', sell: 'Sell (stop above)' },
  warn: {
    leverage:
      'This position is bigger than your account: it needs leverage. A tighter stop made it bigger; that is how leverage sneaks in.',
    tiny: 'Too small to trade: less than a broker’s smallest lot. Widen the account or the risk.',
    promise:
      'No honest investment promises this. Returns like these are paid from newer investors’ money until they stop.',
    negative:
      'This loses money on average. More trades make it worse, not better.',
  },
  invalid: 'Fill in the boxes above to see the answer.',
  wrongSide: 'The stop and target must sit on opposite sides of the entry.',
  learn: (title: string) => `Learn it: ${title}`,
  honest:
    'These are sums, not advice. They assume your stop fills at its price; in a fast market it may not.',
};
