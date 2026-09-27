/**
 * Words for signals (docs/member-app-plan.md §4): the feed, one market, the
 * reasons for and against, and the record. Every number arrives from the
 * engine (lib/engines/signals.ts), including the rules' own settings, so
 * the words can't drift from what the code does.
 */

import { formatBp } from '@/lib/core/money';
import { SIGNAL_RULES as R, type Fact, type Side } from '@/lib/engines/signals';
import { formatR, formatTimes } from '@/lib/engines/trades';
import { formatPrice } from '@/lib/markets/catalog';
import type { NowView, Summary } from '@/lib/markets/view';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Seconds since 1970 → "26 Sep 2026", in UTC like the daily close itself. */
export function day(seconds: number, withYear = true): string {
  const d = new Date(seconds * 1000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ''}`;
}

const above = (side: Side) => (side === 'buy' ? 'above' : 'below');
const below = (side: Side) => (side === 'buy' ? 'below' : 'above');

/** One sentence per fact the engine can report. */
export function factText(fact: Fact): string {
  switch (fact.kind) {
    case 'trend':
      return `The trend is ${fact.side === 'buy' ? 'up' : 'down'}: price is ${formatBp(fact.beyondBp)} ${above(fact.side)} its ${R.slow}-day average, which ${fact.side === 'buy' ? 'rose' : 'fell'} ${formatBp(fact.slopeBp)} over ${R.slopeBars} days.`;
    case 'big-trend':
      return fact.agrees
        ? `The bigger picture agrees: price is ${formatBp(fact.beyondBp)} ${above(fact.side)} its ${R.long}-day average.`
        : `The bigger picture disagrees: price is ${formatBp(fact.beyondBp)} ${below(fact.side)} its ${R.long}-day average.`;
    case 'pullback':
      return `It came back to its ${R.fast}-day average and RSI cooled to ${fact.rsi}: a pause in the trend, not a turn.`;
    case 'resumed':
      return fact.side === 'buy'
        ? 'Then it closed above the day before’s high: buyers came back.'
        : 'Then it closed below the day before’s low: sellers came back.';
    case 'base':
      return `It spent ${fact.bars} days in a tight range, ${formatBp(fact.heightBp)} tall (${formatTimes(fact.atrTenths)} a normal day’s move).`;
    case 'volume':
      return `It broke out on ${formatTimes(fact.tenths)} the range’s usual volume: people showed up.`;
    case 'stretched':
      return `RSI is already ${fact.rsi}: much of the move may be done.`;
    case 'extended':
      return `Price is ${formatTimes(fact.atrTenths)} a normal day’s move from its ${R.fast}-day average: this is chasing.`;
    case 'volatile':
      return `Days are ${formatTimes(fact.tenths)} their usual size: noise hits stops more often.`;
    case 'losing-run':
      return `The last ${fact.count} signals here were losses. Rules have cold runs; keep size small.`;
    case 'weak-record':
      return `On this market these rules have lost ${formatR(-fact.avgR, { signed: false })} a signal on average, over ${fact.signals} signals.`;
  }
}

export const SIGNALS = {
  meta: {
    title: 'Signals',
    description:
      'What fixed rules see in each market at the daily close, with the reasons for and against and a record that keeps every loss.',
  },
  kicker: 'Markets',
  title: 'Signals',
  lead: 'What our rules see in each market at the daily close: the call, where it’s wrong, what it aims for, why, and how the same rules have done.',
  loading: 'Reading the markets…',
  error: 'Market data is unavailable right now. Try again in a minute.',
  retry: 'Try again',
  now: 'Signals now',
  watching: 'Watching',
  unavailable: 'Can’t read right now',
  none: 'No signals today. The rules only speak when their setup is there, and most days it isn’t.',
  asOf: (seconds: number) => `Daily close · ${day(seconds)}, 00:00 UTC`,
  source: {
    kraken: 'Kraken',
    twelvedata: 'Twelve Data',
  },
  side: { buy: 'Buy', sell: 'Sell' },
  setup: { pullback: 'Pullback in a trend', breakout: 'Breakout' },
  trend: { up: 'Uptrend', down: 'Downtrend', none: 'No clear trend' },
  kind: { crypto: 'Crypto', fx: 'Forex', metal: 'Gold' },
  state: {
    new: 'New today',
    open: (r: number) => `Open · ${formatR(r)} so far`,
  },
  day: (bp: number) => `${formatBp(bp, { signed: true })} today`,
  week: (bp: number) => `${formatBp(bp, { signed: true })} this week`,
  watch: (now: Extract<NowView, { state: 'wait' }>, decimals: number) =>
    now.watch.kind === 'range'
      ? `Watching the ${R.baseBars}-day range: a close above ${formatPrice(now.watch.high, decimals)} or below ${formatPrice(now.watch.low, decimals)} on heavy volume would be a breakout.`
      : `Waiting for a pullback to the ${R.fast}-day average, now ${formatPrice(now.watch.level, decimals)} (${formatBp(now.watch.distanceBp)} away), then a ${now.watch.side === 'buy' ? 'close above the day before’s high' : 'close below the day before’s low'}.`,
  recordLine: (signals: number, winBp: number, avgR: number) =>
    signals
      ? `${signals} signals · ${formatBp(winBp)} won · ${formatR(avgR)} each on average`
      : 'No signals closed yet',
  open: 'Open',
  levels: {
    entry: 'Entry',
    entryNote: 'at the next open, near',
    filled: 'Filled at',
    stop: 'Stop',
    target: 'Target',
    risk: 'Risk (1R)',
    reward: (r: number) => `${formatR(r, { signed: false })} if it hits`,
    now: 'Now',
  },
  outcome: {
    open: 'Open',
    target: 'Hit target',
    stop: 'Stopped',
    expired: `Closed after ${R.maxBars} days`,
  },
  why: {
    title: (side: Side) => `Why the rules say ${side}`,
    for: 'For',
    against: 'Against',
    noAgainst:
      'Nothing the rules check argues against it. That is not the same as safe.',
    waitTitle: 'Why there’s no signal',
  },
  record: {
    title: 'The record on this market',
    signals: 'Signals',
    won: 'Won',
    average: 'Average',
    total: 'Total',
    worst: 'Worst run',
    losses: (n: number) => (n === 1 ? '1 loss' : `${n} losses`),
    since: (seconds: number) =>
      `Every signal these rules gave since ${day(seconds)}, losses included: replayed on real daily prices, filled at the next open, with costs paid. A past record doesn’t promise the future.`,
    small: (n: number) =>
      `${n} signals is a small sample. A record means little under 30; judge it again later.`,
    history: 'Every signal',
    columns: { date: 'Date', call: 'Call', result: 'Result' },
  },
  learn: {
    title: 'Learn this setup',
    pullback: ['s1', 't2', 't3'],
    breakout: ['s3', 'c7', 'c6'],
    always: ['r1', 'r2'],
  },
  actions: {
    paperTrade: 'Paper-trade it',
    size: 'Size this trade',
    log: 'Log it in my journal',
    paper:
      'Paper-trade it first: pretend money, real prices, and the stop and target watched for you.',
  },
  chart: {
    fast: `${R.fast}-day average`,
    slow: `${R.slow}-day average`,
    past: 'Past signals',
  },
  back: 'All markets',
  notFound: 'We don’t read that market yet.',
  how: {
    title: 'How signals work',
    points: [
      `One decision a day, on the daily close. No alerts at 3 a.m., no “entry closing in 5 minutes”.`,
      `Two setups the lessons teach: a pullback in a trend, and a breakout from a tight range on heavy volume. Buys and sells.`,
      `Every signal has a stop at least one normal day’s move away, and a target at ${formatR(R.targetR, { signed: false })}. Risk ${formatBp(100)} of your account on it at most.`,
      'The reasons against sit next to the reasons for. So does the record, with every loss in it.',
      'The same for everyone, from fixed rules. Not advice about your money.',
    ],
  },
  disclaimer:
    'Educational. Signals come from fixed rules and are the same for everyone; they are not advice about your money. Paper-trade them before you trust them.',
};

/** The reason in a few plain sentences, built from the facts. */
export function explain(summary: Summary): string {
  const { now, market } = summary;
  const price = (units: number) => formatPrice(units, market.decimals);
  if (now.state === 'wait')
    return `No setup today. ${SIGNALS.trend[summary.trend]}. ${SIGNALS.watch(now, market.decimals)}`;
  const signal = now.state === 'new' ? now.signal : now.played;
  const verb = signal.side === 'buy' ? 'buy' : 'sell';
  const setup =
    signal.setup === 'pullback'
      ? `a pullback in a ${signal.side === 'buy' ? 'rising' : 'falling'} market that has started moving again`
      : `a breakout from a tight range on heavy volume`;
  const against = signal.against.length;
  return [
    `The rules say ${verb} ${market.name}: ${setup}.`,
    `They’re wrong ${signal.side === 'buy' ? 'below' : 'above'} ${price(signal.stop)} (${formatBp(signal.stopBp)} away) and aim for ${price(signal.target)}, twice the risk.`,
    against
      ? `${against === 1 ? 'One thing argues' : `${against} things argue`} against it; read them before you act.`
      : 'Nothing they check argues against it, which is not the same as safe.',
  ].join(' ');
}
