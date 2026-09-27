/**
 * Words for the paper account (lib/engines/paper.ts): real prices,
 * pretend money. Numbers arrive worked out by the engine and the server.
 */

import type { CloseEvent } from '@/lib/engines/paper';

export const PAPER_PAGE = {
  meta: { title: 'Paper account' },
  kicker: 'Trade',
  title: 'Paper account',
  lead: 'Real prices, pretend money: $10,000 to start. Every trade has a stop, and your journal measures each one.',
  loading: 'Opening your paper account…',
  error: 'The paper account didn’t answer. Try again in a minute.',
  retry: 'Try again',
  stats: {
    equity: 'Account value',
    returned: 'Return',
    cash: 'Cash',
    open: 'Open',
    openOf: (n: number, most: number) => `${n} of ${most}`,
    record: (closed: number, winBp: string, avgR: string) =>
      closed
        ? `${closed === 1 ? '1 trade closed' : `${closed} trades closed`} · ${winBp} won · ${avgR} on average`
        : 'No trades closed yet.',
  },
  ticket: {
    title: 'New paper trade',
    fromSignal:
      'Filled in from the signal. Check the stop, choose your risk, and place it.',
    market: 'Market',
    side: 'Direction',
    buy: 'Buy',
    sell: 'Sell',
    quote: (bid: string, ask: string) => `Bid ${bid} · Ask ${ask}`,
    noQuote: 'No live price right now.',
    stop: 'Stop',
    stopHelp: (side: 'buy' | 'sell') =>
      side === 'buy'
        ? 'Below the price: where you’re wrong.'
        : 'Above the price: where you’re wrong.',
    target: 'Target (optional)',
    risk: 'Risk on this trade',
    riskOption: (pct: string) => pct,
    setup: 'Setup',
    feeling: 'How do you feel placing it?',
    preview: (quantity: string, value: string, risk: string) =>
      `About ${quantity} units, worth ${value}, with ${risk} at risk.`,
    previewNote: 'Filled at the live price the moment you place it.',
    place: 'Place paper trade',
    placing: 'Placing…',
    filled: (
      side: 'buy' | 'sell',
      quantity: string,
      symbol: string,
      price: string,
    ) =>
      `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${symbol} at ${price}.`,
    trimmed:
      'Trimmed to the cash you have: that stop is tight, so the full size wouldn’t fit.',
    wrongSide:
      'The stop must sit on the other side of the price from the target.',
  },
  positions: {
    title: 'Open positions',
    none: 'Nothing open. Place a trade, or take one from a signal.',
    entry: 'Entry',
    now: 'Now',
    stop: 'Stop',
    target: 'Target',
    close: 'Close',
    closing: 'Closing…',
  },
  closed: {
    title: 'Closed trades',
    why: {
      manual: 'Closed by you',
      stop: 'Stopped',
      target: 'Hit target',
    } satisfies Record<CloseEvent['why'], string>,
  },
  reset: {
    action: 'Start again with $10,000',
    confirm:
      'Close the book on this account and start again? Your old trades stay in the journal.',
  },
  how: {
    title: 'How the paper account works',
    points: [
      'Orders fill at the real ask when you buy and the real bid when you sell, plus a small fee each way, as at an exchange.',
      'You choose how much to risk; the size is worked out so hitting the stop loses that much, and trimmed if the cash won’t cover it.',
      'Stops and targets are checked against hourly prices after your fill. If one hour touches both, it counts as stopped, and a price that jumps past your stop fills at the worse price.',
      'No leverage: a position holds its full value in cash, long or short.',
      'Closed trades go into your journal, which looks for the habits that cost you.',
    ],
  },
  journalTag: 'Paper',
};
