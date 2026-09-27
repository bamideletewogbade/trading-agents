/**
 * Words for the journal (lesson p2): logging trades, the stats, and what
 * they say. Numbers arrive worked out by lib/engines/journal.ts.
 */

import type {
  Feeling,
  JournalSetup,
  TradeProblem,
  TradeSource,
} from '@/lib/engines/journal';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A trade's date on this device's calendar: "26 Sep". */
export function tradeDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const JOURNAL = {
  meta: { title: 'Journal' },
  kicker: 'Trade',
  title: 'Journal',
  lead: 'Every trade, measured in R: what you risked, what you made, and why you took it. Paper trades count.',
  device: 'Kept on this device.',
  add: 'Log a trade',
  empty:
    'No trades yet. Log one from a signal or your own idea. After ten, the journal starts to tell you things.',
  stats: {
    closed: 'Closed',
    open: 'Open',
    won: 'Won',
    average: 'Average',
    total: 'Total',
    drawdown: 'Deepest fall',
    stops: 'Stops kept',
    stopsValue: (kept: number, of: number) => (of ? `${kept} of ${of}` : '—'),
    curve: 'Your curve, in R',
  },
  leak: {
    title: 'Where to look first',
    setup: (key: string, trades: number, avgR: string) =>
      `Your ${key} trades average ${avgR} over ${trades} trades.`,
    feeling: (key: string, trades: number, avgR: string) =>
      `Trades you took feeling ${key} average ${avgR} over ${trades} trades.`,
    lesson: 'p3',
  },
  groups: {
    setup: 'By setup',
    feeling: 'By feeling',
    trades: (n: number) => (n === 1 ? '1 trade' : `${n} trades`),
  },
  lists: { open: 'Open trades', closed: 'Closed trades' },
  form: {
    title: 'Log a trade',
    market: 'Market',
    marketHint: 'e.g. EUR/USD, BTC/USD, MTN Ghana',
    side: 'Direction',
    buy: 'Buy',
    sell: 'Sell',
    entry: 'Entry',
    stop: 'Stop',
    stopHelp:
      'Where were you wrong? Every trade has one, even if you didn’t place it.',
    target: 'Target (optional)',
    exit: 'Exit (leave empty while it’s open)',
    setup: 'Setup',
    feeling: 'How did you feel taking it?',
    source: 'Whose idea',
    note: 'Note (optional)',
    save: 'Save trade',
    cancel: 'Cancel',
    fromSignal:
      'Filled in from the signal. Check the prices against your broker’s.',
  },
  close: {
    action: 'Close it',
    label: 'Exit price',
    save: 'Close trade',
  },
  remove: 'Delete',
  confirmRemove: 'Delete this trade for good?',
  planned: (r: string) => `aims for ${r}`,
  problems: {
    'stop-side': 'A buy’s stop sits below the entry; a sell’s sits above.',
    'target-side':
      'The target sits on the other side of the entry from the stop.',
    'same-price': 'The stop can’t be the entry: that trade risks nothing.',
    decimals: 'Prices can have at most 8 decimals.',
    missing: 'Add the market, the entry and the stop.',
    price: 'That price doesn’t look right. Use digits and a dot, like 1.0854.',
  } satisfies Record<TradeProblem | 'missing' | 'price', string>,
  setups: {
    pullback: 'Pullback',
    breakout: 'Breakout',
    range: 'Range',
    news: 'News',
    other: 'Other',
  } satisfies Record<JournalSetup, string>,
  feelings: {
    calm: 'Calm',
    sure: 'Sure',
    fomo: 'FOMO',
    revenge: 'Revenge',
    bored: 'Bored',
  } satisfies Record<Feeling, string>,
  sources: {
    own: 'Mine',
    signal: 'A signal',
    mentor: 'A mentor',
  } satisfies Record<TradeSource, string>,
  honest:
    'R counts discipline, not money. A small loss you planned is a good trade.',
};
