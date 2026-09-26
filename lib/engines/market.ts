/**
 * How a price is made: an order book, what a market order does to it, what
 * the spread costs, and when market, limit and stop orders fill.
 *
 * Stage 1 of the roadmap (m1–m3, m6). The lessons are "a price is just the
 * last trade", "the spread is a fee you pay twice", and "a stop is a promise
 * to trade at the next price, not at your price".
 *
 * Prices in integer cents, sizes in whole units. Pure and seeded.
 */

import { createRng } from '../core/rng.ts';

export type Level = { readonly price: number; readonly size: number };
/** Bids best (highest) first, asks best (lowest) first. */
export type Book = {
  readonly bids: readonly Level[];
  readonly asks: readonly Level[];
};

export class MarketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketError';
  }
}

/** A book around `mid`, `depth` levels a side, `tick` cents apart. */
export function makeBook(
  seed: string,
  mid = 10_000,
  depth = 8,
  tick = 5,
): Book {
  const rng = createRng(`book:${seed}`);
  const bids: Level[] = [];
  const asks: Level[] = [];
  for (let i = 0; i < depth; i += 1) {
    bids.push({ price: mid - tick * (i + 1), size: rng.int(20, 120) });
    asks.push({ price: mid + tick * (i + 1), size: rng.int(20, 120) });
  }
  return { bids, asks };
}

export function spread(book: Book): number {
  const bid = book.bids[0];
  const ask = book.asks[0];
  if (!bid || !ask) throw new MarketError('A spread needs both sides.');
  return ask.price - bid.price;
}

export type Fill = { price: number; size: number };

export type MarketOrderResult = {
  fills: Fill[];
  filled: number;
  /** What the filled units cost (buy) or raised (sell), in cents. */
  value: number;
  /** The price the last unit traded at: the new "price" of the market. */
  last: number | null;
  /** The average price paid or received per unit, rounded to the cent. */
  average: number | null;
  book: Book;
};

function consume(levels: readonly Level[], quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new MarketError('An order is at least one whole unit.');
  const fills: Fill[] = [];
  const rest: Level[] = [];
  let left = quantity;
  for (const level of levels) {
    if (left === 0) {
      rest.push(level);
      continue;
    }
    const take = Math.min(left, level.size);
    fills.push({ price: level.price, size: take });
    left -= take;
    if (take < level.size)
      rest.push({ price: level.price, size: level.size - take });
  }
  const filled = quantity - left;
  const value = fills.reduce((sum, fill) => sum + fill.price * fill.size, 0);
  const average = filled ? Math.round(value / filled) : null;
  return {
    fills,
    rest,
    filled,
    value,
    average,
    last: fills.at(-1)?.price ?? null,
  };
}

/** Buy `quantity` at whatever the asks are: walks up the book until filled. */
export function marketBuy(book: Book, quantity: number): MarketOrderResult {
  const { fills, rest, filled, value, average, last } = consume(
    book.asks,
    quantity,
  );
  return {
    fills,
    filled,
    value,
    average,
    last,
    book: { bids: book.bids, asks: rest },
  };
}

/** Sell `quantity` into the bids: walks down the book until filled. */
export function marketSell(book: Book, quantity: number): MarketOrderResult {
  const { fills, rest, filled, value, average, last } = consume(
    book.bids,
    quantity,
  );
  return {
    fills,
    filled,
    value,
    average,
    last,
    book: { bids: rest, asks: book.asks },
  };
}

/**
 * Buying at the ask and selling straight back at the bid, `times` times:
 * the spread is paid on every round trip, whatever the market does.
 */
export function roundTripCost(
  bid: number,
  ask: number,
  quantity: number,
  times: number,
): number {
  if (ask < bid) throw new MarketError('The ask is never below the bid.');
  return (ask - bid) * quantity * times;
}

/* ── Order types against a moving price ───────────────────────────────── */

export type OrderKind = 'market' | 'limit' | 'stop';

/** A buy order placed at step 0. `price` is the limit or the stop trigger. */
export type BuyOrder = { kind: OrderKind; price?: number };

export type OrderResult = {
  /** The step it filled at, or null if it never did. */
  step: number | null;
  /** The price it filled at, in cents. */
  price: number | null;
  /** For a stop: how far past the trigger it filled (slippage), in cents. */
  slippage: number;
};

/**
 * When a buy fills on a price path (one price per step):
 * - market: now, at the current price;
 * - limit (below the price): the first time the price is at or below the
 *   limit, at the limit or better;
 * - stop (above the price): the first time the price is at or above the
 *   trigger, at *that* price, which may be worse than the trigger.
 */
export function fillBuy(path: readonly number[], order: BuyOrder): OrderResult {
  const now = path[0];
  if (now === undefined)
    throw new MarketError('A path needs at least one price.');
  if (order.kind === 'market') return { step: 0, price: now, slippage: 0 };
  const trigger = order.price;
  if (trigger === undefined || !Number.isSafeInteger(trigger))
    throw new MarketError('Limit and stop orders need a price.');
  for (let step = 1; step < path.length; step += 1) {
    const price = path[step] as number;
    if (order.kind === 'limit' && price <= trigger)
      return { step, price: Math.min(price, trigger), slippage: 0 };
    if (order.kind === 'stop' && price >= trigger)
      return { step, price, slippage: price - trigger };
  }
  return { step: null, price: null, slippage: 0 };
}

/**
 * A price path with a gap in it: steady wobble, then one jump of `gap`
 * cents at `gapAt`, the kind a news release makes. Seeded.
 */
export function gappyPath(
  seed: string,
  steps = 40,
  start = 10_000,
  gapAt = 24,
  gap = 180,
): number[] {
  const rng = createRng(`gap:${seed}`);
  const path = [start];
  for (let i = 1; i < steps; i += 1) {
    const last = path[i - 1] as number;
    path.push(last + rng.int(-18, 18) + (i === gapAt ? gap : 0));
  }
  return path;
}

/* ── What trading costs, before any skill ─────────────────────────────── */

export type Costs = {
  spreads: number;
  overnight: number;
  subscription: number;
  total: number;
  /** What's left of the deposit if the trades themselves broke even. */
  left: number;
};

/**
 * A deposit after `trades` round trips that break even before costs: the
 * spread on each, an overnight fee for each night held, and a monthly
 * signals subscription. The lesson: costs are certain, profits aren't.
 */
export function costsOfTrading(input: {
  deposit: number;
  trades: number;
  spreadPerTrade: number;
  nightsHeld: number;
  overnightPerNight: number;
  subscription: number;
}): Costs {
  const spreads = input.trades * input.spreadPerTrade;
  const overnight = input.nightsHeld * input.overnightPerNight;
  const total = spreads + overnight + input.subscription;
  return {
    spreads,
    overnight,
    subscription: input.subscription,
    total,
    left: input.deposit - total,
  };
}
