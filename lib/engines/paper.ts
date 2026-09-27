/**
 * The paper account (docs/member-app-plan.md §5): pretend money on real
 * prices, kept as an append-only log of events and replayed through this
 * engine whenever it's shown. Nothing about the account is stored except
 * what happened; the balance, the open positions and the record are always
 * worked out again from the log.
 *
 * The server is the price source and the referee:
 * - an order names a market, a side, a stop, maybe a target, and how much
 *   of the account to risk. The server fills it at the real ask (buying) or
 *   bid (selling) and sizes it from its own copy of the account, so no
 *   number from a browser sets a price or a size;
 * - stops and targets are checked against bars that opened after the fill
 *   and closed before now: a bar that touches both counts as stopped (the
 *   same rule as the signals' record), and a gap fills at the bar's open,
 *   worse than the stop. Each exit is written to the log once, when first
 *   seen, so it never changes afterwards;
 * - a position closed by hand closes at the bid or ask of that moment, and
 *   a recorded close always wins over one worked out later.
 *
 * It's a cash account with no leverage: a position reserves its full value,
 * long or short, and pays a fee each way. Money in minor units (cents),
 * quantities in hundred-millionths of a unit, prices as integers at the
 * market's decimals, R in hundredths, rates in bp. Pure: time, prices and
 * bars are passed in.
 */

import { BP_PER_WHOLE, pow10 } from '../core/money.ts';
import {
  FEELINGS,
  SETUPS,
  type Feeling,
  type JournalSetup,
  type JournalTrade,
} from './journal.ts';
import { QUANTITY_PLACES, sizePosition } from './tools.ts';

export const PAPER = {
  /** Every account starts with $10,000. */
  startMinor: 1_000_000,
  currency: 'USD',
  maxOpen: 10,
  riskBp: { least: 10, most: 500, usual: 100 },
} as const;

export class PaperError extends Error {
  readonly code: PaperProblem;
  constructor(code: PaperProblem, message: string) {
    super(message);
    this.name = 'PaperError';
    this.code = code;
  }
}

export type PaperProblem =
  | 'stop-side'
  | 'target-side'
  | 'risk'
  | 'too-many'
  | 'too-small'
  | 'not-open';

export type PaperSide = 'buy' | 'sell';

export type OpenEvent = {
  kind: 'open';
  id: string;
  at: number;
  market: string;
  symbol: string;
  decimals: number;
  side: PaperSide;
  /** Hundred-millionths of a unit. */
  quantity: number;
  /** The fill: the ask for a buy, the bid for a sell. */
  price: number;
  feeBp: number;
  feeMinor: number;
  stop: number;
  target: number | null;
  riskBp: number;
  setup: JournalSetup;
  /** How the trader felt placing it: the journal looks for patterns in this. */
  feeling: Feeling;
  /** Taken from a signal, rather than the trader's own idea. */
  signal: boolean;
  /** 'server' when the server filled it; 'device' when it arrived from a device log. */
  origin: 'server' | 'device';
};

export type CloseEvent = {
  kind: 'close';
  id: string;
  at: number;
  position: string;
  price: number;
  feeMinor: number;
  why: 'manual' | 'stop' | 'target';
  origin: 'server' | 'device';
};

export type ResetEvent = {
  kind: 'reset';
  id: string;
  at: number;
  startMinor: number;
};

export type PaperEvent = OpenEvent | CloseEvent | ResetEvent;

/** A bar for watching stops, with its start and end in ms. */
export type WatchBar = {
  start: number;
  end: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type Quote = { bid: number; ask: number; last: number; at: number };

export type Position = OpenEvent & {
  notionalMinor: number;
  mark: number;
  unrealisedMinor: number;
  /** R so far, in hundredths, at the mark. */
  r: number;
};

export type ClosedTrade = {
  open: OpenEvent;
  close: CloseEvent;
  /** After both fees. */
  pnlMinor: number;
  r: number;
};

export type PaperAccount = {
  startMinor: number;
  since: number | null;
  cashMinor: number;
  equityMinor: number;
  returnBp: number;
  open: Position[];
  closed: ClosedTrade[];
  wins: number;
  winRateBp: number;
  avgR: number;
  /** Events the replay couldn't apply (an open that didn't fit the cash, a close of nothing). */
  skipped: number;
};

const Q = BigInt(pow10(QUANTITY_PLACES));

/** What `quantity` units are worth at `price`, in cents, rounded to the nearest. */
export function valueMinor(
  quantity: number,
  price: number,
  decimals: number,
): number {
  const top = BigInt(quantity) * BigInt(price) * 100n;
  const bottom = Q * BigInt(pow10(decimals));
  return Number((top * 2n + bottom) / (bottom * 2n));
}

export function feeOf(notionalMinor: number, feeBp: number): number {
  return Math.round((notionalMinor * feeBp) / BP_PER_WHOLE);
}

/** Profit or loss before fees, in cents: long gains when price rises, short when it falls. */
export function grossPnl(open: OpenEvent, exit: number): number {
  const move = open.side === 'buy' ? exit - open.price : open.price - exit;
  const size = valueMinor(open.quantity, Math.abs(move), open.decimals);
  return move < 0 ? -size : size;
}

/** R in hundredths: the move against the distance to the stop. */
export function rOf(open: OpenEvent, exit: number): number {
  const risk = Math.abs(open.price - open.stop);
  if (!risk) return 0;
  const move = open.side === 'buy' ? exit - open.price : open.price - exit;
  return Math.round((move * 100) / risk);
}

/**
 * A position closes once, so its close has an id worked out from the
 * position's: the same on every device and every replay. UUID version 8
 * (custom) marks it, and a random v4 id can never collide with it.
 */
export function closeIdOf(positionId: string): string {
  return `${positionId.slice(0, 14)}8${positionId.slice(15)}`;
}

function order(a: PaperEvent, b: PaperEvent): number {
  return a.at - b.at || a.id.localeCompare(b.id);
}

/**
 * Stop and target exits the bars show, for positions with no recorded
 * close: the first bar that opened at or after the fill, ended by `now`,
 * and touched a level. Stop first when a bar touches both; a gap past the
 * level fills at the bar's open.
 */
export function exitsFrom(
  events: readonly PaperEvent[],
  bars: Readonly<Record<string, readonly WatchBar[]>>,
  now: number,
): CloseEvent[] {
  const closed = new Set(
    events.flatMap((e) => (e.kind === 'close' ? [e.position] : [])),
  );
  // Positions before the last reset belong to an account that's gone.
  const since = Math.max(
    -Infinity,
    ...events.flatMap((e) => (e.kind === 'reset' ? [e.at] : [])),
  );
  const out: CloseEvent[] = [];
  for (const e of events) {
    if (e.kind !== 'open' || closed.has(e.id) || e.at < since) continue;
    const buy = e.side === 'buy';
    for (const bar of bars[e.market] ?? []) {
      if (bar.start < e.at || bar.end > now) continue;
      let price: number | null = null;
      let why: 'stop' | 'target' | null = null;
      if (buy ? bar.low <= e.stop : bar.high >= e.stop) {
        price = buy ? Math.min(e.stop, bar.open) : Math.max(e.stop, bar.open);
        why = 'stop';
      } else if (
        e.target !== null &&
        (buy ? bar.high >= e.target : bar.low <= e.target)
      ) {
        price = buy
          ? Math.max(e.target, bar.open)
          : Math.min(e.target, bar.open);
        why = 'target';
      }
      if (price !== null && why) {
        out.push({
          kind: 'close',
          id: closeIdOf(e.id),
          at: bar.end,
          position: e.id,
          price,
          feeMinor: feeOf(valueMinor(e.quantity, price, e.decimals), e.feeBp),
          why,
          origin: 'server',
        });
        break;
      }
    }
  }
  return out;
}

/**
 * The account as it stands: replay every event since the last reset, in
 * time order, and mark what's open at `marks` (the latest price per
 * market; the entry when there's none).
 */
export function replay(
  events: readonly PaperEvent[],
  marks: Readonly<Record<string, number>> = {},
): PaperAccount {
  const sorted = [...events].sort(order);
  let from = 0;
  sorted.forEach((e, i) => {
    if (e.kind === 'reset') from = i;
  });
  const reset = sorted[from]?.kind === 'reset' ? sorted[from] : null;
  const startMinor =
    reset?.kind === 'reset' ? reset.startMinor : PAPER.startMinor;
  const live = reset ? sorted.slice(from + 1) : sorted;
  let cash = startMinor;
  let skipped = 0;
  const open = new Map<string, OpenEvent>();
  const seen = new Set<string>();
  const closed: ClosedTrade[] = [];

  for (const e of live) {
    if (e.kind === 'reset') continue;
    if (e.kind === 'open') {
      const cost = valueMinor(e.quantity, e.price, e.decimals) + e.feeMinor;
      if (seen.has(e.id) || open.size >= PAPER.maxOpen || cost > cash) {
        skipped += 1;
        continue;
      }
      seen.add(e.id);
      cash -= cost;
      open.set(e.id, e);
      continue;
    }
    const position = open.get(e.position);
    if (!position) {
      skipped += 1;
      continue;
    }
    const notional = valueMinor(
      position.quantity,
      position.price,
      position.decimals,
    );
    const gross = grossPnl(position, e.price);
    cash += notional + gross - e.feeMinor;
    open.delete(e.position);
    closed.push({
      open: position,
      close: e,
      pnlMinor: gross - position.feeMinor - e.feeMinor,
      r: rOf(position, e.price),
    });
  }

  const positions: Position[] = [...open.values()].map((p) => {
    const mark = marks[p.market] ?? p.price;
    return {
      ...p,
      notionalMinor: valueMinor(p.quantity, p.price, p.decimals),
      mark,
      unrealisedMinor: grossPnl(p, mark),
      r: rOf(p, mark),
    };
  });
  const equity =
    cash +
    positions.reduce((sum, p) => sum + p.notionalMinor + p.unrealisedMinor, 0);
  const wins = closed.filter((t) => t.pnlMinor > 0).length;
  return {
    startMinor,
    since: reset ? reset.at : (sorted[0]?.at ?? null),
    cashMinor: cash,
    equityMinor: equity,
    returnBp: Math.round(((equity - startMinor) * BP_PER_WHOLE) / startMinor),
    open: positions,
    closed,
    wins,
    winRateBp: closed.length
      ? Math.round((wins * BP_PER_WHOLE) / closed.length)
      : 0,
    avgR: closed.length
      ? Math.round(closed.reduce((sum, t) => sum + t.r, 0) / closed.length)
      : 0,
    skipped,
  };
}

/** Exits from the bars, then the account with them applied. The exits are new events to keep. */
export function accountOf(
  events: readonly PaperEvent[],
  bars: Readonly<Record<string, readonly WatchBar[]>>,
  marks: Readonly<Record<string, number>>,
  now: number,
): { account: PaperAccount; exits: CloseEvent[] } {
  const exits = exitsFrom(events, bars, now);
  return { account: replay([...events, ...exits], marks), exits };
}

export type Order = {
  market: string;
  symbol: string;
  decimals: number;
  side: PaperSide;
  stop: number;
  target: number | null;
  riskBp: number;
  feeBp: number;
  setup: JournalSetup;
  feeling: Feeling;
  signal: boolean;
};

/**
 * Fill an order against a quote: at the ask for a buy, the bid for a sell,
 * sized so the stop loses `riskBp` of the account's equity, and trimmed to
 * the cash there is (the answer says when). The stop and target must sit
 * on the right sides of the fill.
 */
export function fillOrder(
  account: PaperAccount,
  input: Order,
  quote: Quote,
  id: string,
  now: number,
): { event: OpenEvent; trimmed: boolean } {
  const buy = input.side === 'buy';
  const price = buy ? quote.ask : quote.bid;
  if (!Number.isSafeInteger(price) || price <= 0)
    throw new PaperError('too-small', 'There is no price to fill at.');
  if (buy ? input.stop >= price : input.stop <= price)
    throw new PaperError(
      'stop-side',
      buy
        ? 'A buy’s stop sits below the price.'
        : 'A sell’s stop sits above the price.',
    );
  if (
    input.target !== null &&
    (buy ? input.target <= price : input.target >= price)
  )
    throw new PaperError(
      'target-side',
      'The target sits on the other side of the price from the stop.',
    );
  if (
    !Number.isSafeInteger(input.riskBp) ||
    input.riskBp < PAPER.riskBp.least ||
    input.riskBp > PAPER.riskBp.most
  )
    throw new PaperError('risk', 'Risk between 0.1% and 5% of the account.');
  if (account.open.length >= PAPER.maxOpen)
    throw new PaperError(
      'too-many',
      'Close a position before opening another.',
    );

  let quantity = sizePosition({
    accountMinor: Math.max(1, account.equityMinor),
    riskBp: input.riskBp,
    entry: price,
    stop: input.stop,
    decimals: input.decimals,
  }).quantity;
  // The most the cash covers, fee included.
  const most = Number(
    (BigInt(Math.max(0, account.cashMinor)) *
      BigInt(BP_PER_WHOLE) *
      Q *
      BigInt(pow10(input.decimals))) /
      (BigInt(price) * 100n * BigInt(BP_PER_WHOLE + input.feeBp)),
  );
  const trimmed = quantity > most;
  if (trimmed) quantity = most;
  if (quantity <= 0)
    throw new PaperError('too-small', 'Not enough cash for any of this.');
  const notional = valueMinor(quantity, price, input.decimals);
  return {
    event: {
      kind: 'open',
      id,
      at: now,
      market: input.market,
      symbol: input.symbol,
      decimals: input.decimals,
      side: input.side,
      quantity,
      price,
      feeBp: input.feeBp,
      feeMinor: feeOf(notional, input.feeBp),
      stop: input.stop,
      target: input.target,
      riskBp: input.riskBp,
      setup: (SETUPS as readonly string[]).includes(input.setup)
        ? input.setup
        : 'other',
      feeling: (FEELINGS as readonly string[]).includes(input.feeling)
        ? input.feeling
        : 'calm',
      signal: input.signal,
      origin: 'server',
    },
    trimmed,
  };
}

/** Close an open position by hand, at the bid (a long) or the ask (a short). */
export function closeOrder(
  account: PaperAccount,
  positionId: string,
  quote: Quote,
  now: number,
): CloseEvent {
  const position = account.open.find((p) => p.id === positionId);
  if (!position)
    throw new PaperError('not-open', 'That position is already closed.');
  const price = position.side === 'buy' ? quote.bid : quote.ask;
  return {
    kind: 'close',
    id: closeIdOf(positionId),
    at: now,
    position: positionId,
    price,
    feeMinor: feeOf(
      valueMinor(position.quantity, price, position.decimals),
      position.feeBp,
    ),
    why: 'manual',
    origin: 'server',
  };
}

/** Closed paper trades as journal entries, so the journal measures them with the rest. */
export function paperJournal(account: PaperAccount): JournalTrade[] {
  const toTrade = (
    open: OpenEvent,
    exit: number | null,
    closedAt: number | null,
  ): JournalTrade => ({
    id: open.id,
    market: open.symbol,
    side: open.side,
    decimals: open.decimals,
    entry: open.price,
    stop: open.stop,
    target: open.target,
    exit,
    setup: open.setup,
    feeling: open.feeling,
    source: open.signal ? 'signal' : 'own',
    openedAt: open.at,
    closedAt,
    note: '',
  });
  return [
    ...account.closed.map((t) => toTrade(t.open, t.close.price, t.close.at)),
    ...account.open.map((p) => toTrade(p, null, null)),
  ];
}
