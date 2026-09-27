/**
 * The trading journal's arithmetic (lesson p2): each trade measured in R,
 * and what a list of trades says about the person taking them. Win rate and
 * average R side by side (neither means much alone), the curve in R, the
 * deepest fall, the longest losing run, whether stops were kept, and which
 * setups and feelings pay or cost.
 *
 * Prices are typed by people ("1.08543", "84,025.5"), so they are parsed
 * exactly into integers at the trade's own number of decimals. R in
 * hundredths, shares in basis points. Pure: no clock, no storage.
 */

import { mulDiv, pow10 } from '../core/money.ts';

const BP = 10_000;

export type JournalSide = 'buy' | 'sell';
export const SETUPS = [
  'pullback',
  'breakout',
  'range',
  'news',
  'other',
] as const;
export const FEELINGS = ['calm', 'sure', 'fomo', 'revenge', 'bored'] as const;
export const SOURCES = ['own', 'signal', 'mentor'] as const;
export type JournalSetup = (typeof SETUPS)[number];
export type Feeling = (typeof FEELINGS)[number];
export type TradeSource = (typeof SOURCES)[number];

export type JournalTrade = {
  id: string;
  market: string;
  side: JournalSide;
  /** Every price below is an integer at this many decimals. */
  decimals: number;
  entry: number;
  stop: number;
  target: number | null;
  exit: number | null;
  setup: JournalSetup;
  feeling: Feeling;
  source: TradeSource;
  openedAt: number;
  closedAt: number | null;
  note: string;
};

export const MAX_DECIMALS = 8;

/** "84,025.5" → 840255 at 1 decimal. Null for anything that isn't a positive price. */
export function parsePrice(
  text: string,
): { units: number; decimals: number } | null {
  const cleaned = text.trim().replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) return null;
  const fraction = match[2] ?? '';
  if (fraction.length > MAX_DECIMALS) return null;
  const units = Number(`${match[1]}${fraction}`);
  if (!Number.isSafeInteger(units) || units <= 0) return null;
  return { units, decimals: fraction.length };
}

/**
 * Several typed prices at one number of decimals (the most any of them
 * has), so they can be compared. Empty strings stay null; a bad one fails all.
 */
export function atSamePlaces(
  texts: readonly string[],
): { decimals: number; units: (number | null)[] } | null {
  const parsed = texts.map((text) => (text.trim() ? parsePrice(text) : null));
  if (parsed.some((p, i) => p === null && (texts[i] ?? '').trim())) return null;
  const decimals = Math.max(0, ...parsed.map((p) => p?.decimals ?? 0));
  const units = parsed.map((p) =>
    p ? p.units * pow10(decimals - p.decimals) : null,
  );
  if (units.some((u) => u !== null && !Number.isSafeInteger(u))) return null;
  return { decimals, units };
}

export type TradeProblem =
  | 'stop-side'
  | 'target-side'
  | 'same-price'
  | 'decimals';

/** What's wrong with a trade as written, or null. A buy's stop sits below its entry. */
export function problemOf(
  trade: Pick<JournalTrade, 'side' | 'entry' | 'stop' | 'target' | 'decimals'>,
): TradeProblem | null {
  if (
    !Number.isSafeInteger(trade.decimals) ||
    trade.decimals < 0 ||
    trade.decimals > MAX_DECIMALS
  )
    return 'decimals';
  if (trade.entry === trade.stop) return 'same-price';
  const buy = trade.side === 'buy';
  if (buy ? trade.stop > trade.entry : trade.stop < trade.entry)
    return 'stop-side';
  if (
    trade.target !== null &&
    (buy ? trade.target <= trade.entry : trade.target >= trade.entry)
  )
    return 'target-side';
  return null;
}

function direction(side: JournalSide, from: number, to: number): number {
  return side === 'buy' ? to - from : from - to;
}

/** What the plan aimed for, in hundredths of R. */
export function plannedR(trade: JournalTrade): number | null {
  if (trade.target === null) return null;
  return mulDiv(
    direction(trade.side, trade.entry, trade.target),
    100,
    Math.abs(trade.entry - trade.stop),
  );
}

/** What a closed trade made, in hundredths of R. */
export function tradeR(trade: JournalTrade): number | null {
  if (trade.exit === null) return null;
  return mulDiv(
    direction(trade.side, trade.entry, trade.exit),
    100,
    Math.abs(trade.entry - trade.stop),
  );
}

/** A loss past this is a stop that wasn't kept (or a gap): 1.1R. */
export const KEPT_STOP_R = -110;

export type Group = {
  key: string;
  trades: number;
  winRateBp: number;
  avgR: number;
};

export type JournalStats = {
  trades: number;
  open: number;
  closed: number;
  wins: number;
  winRateBp: number;
  /** Average R per closed trade: the expectancy the journal has measured. */
  avgR: number;
  totalR: number;
  best: number;
  worst: number;
  worstRun: number;
  /** R added up, trade by trade in the order they closed, from 0. */
  curve: number[];
  /** The deepest fall from a high point of the curve, in hundredths of R. */
  drawdownR: number;
  /** Losing trades that lost no more than 1.1R, of all losing trades. */
  stopsKept: number;
  losses: number;
  bySetup: Group[];
  byFeeling: Group[];
  /** The group that costs most, once it has three trades: where to look first. */
  leak: (Group & { by: 'setup' | 'feeling' }) | null;
};

function groups(
  closed: readonly { trade: JournalTrade; r: number }[],
  keyOf: (trade: JournalTrade) => string,
): Group[] {
  const map = new Map<string, number[]>();
  for (const { trade, r } of closed) {
    const key = keyOf(trade);
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  return [...map.entries()]
    .map(([key, rs]) => ({
      key,
      trades: rs.length,
      winRateBp: mulDiv(rs.filter((r) => r > 0).length, BP, rs.length),
      avgR: Math.round(rs.reduce((sum, r) => sum + r, 0) / rs.length),
    }))
    .sort((a, b) => b.trades - a.trades || a.key.localeCompare(b.key));
}

export const LEAK_MIN_TRADES = 3;

export function journalStats(trades: readonly JournalTrade[]): JournalStats {
  const closed = trades
    .filter((t) => t.exit !== null)
    .sort((a, b) => (a.closedAt ?? a.openedAt) - (b.closedAt ?? b.openedAt))
    .map((trade) => ({ trade, r: tradeR(trade) as number }));
  const rs = closed.map((c) => c.r);
  const wins = rs.filter((r) => r > 0).length;
  const total = rs.reduce((sum, r) => sum + r, 0);
  const curve = [0];
  let run = 0;
  let worstRun = 0;
  let peak = 0;
  let drawdownR = 0;
  for (const r of rs) {
    const next = (curve[curve.length - 1] as number) + r;
    curve.push(next);
    peak = Math.max(peak, next);
    drawdownR = Math.max(drawdownR, peak - next);
    run = r > 0 ? 0 : run + 1;
    worstRun = Math.max(worstRun, run);
  }
  const losing = rs.filter((r) => r < 0);
  const bySetup = groups(closed, (t) => t.setup);
  const byFeeling = groups(closed, (t) => t.feeling);
  const candidates = [
    ...bySetup.map((g) => ({ ...g, by: 'setup' as const })),
    ...byFeeling.map((g) => ({ ...g, by: 'feeling' as const })),
  ].filter((g) => g.trades >= LEAK_MIN_TRADES && g.avgR < 0);
  candidates.sort((a, b) => a.avgR - b.avgR || b.trades - a.trades);
  return {
    trades: trades.length,
    open: trades.length - closed.length,
    closed: closed.length,
    wins,
    winRateBp: rs.length ? mulDiv(wins, BP, rs.length) : 0,
    avgR: rs.length ? Math.round(total / rs.length) : 0,
    totalR: total,
    best: rs.length ? Math.max(...rs) : 0,
    worst: rs.length ? Math.min(...rs) : 0,
    worstRun,
    curve,
    drawdownR,
    stopsKept: losing.filter((r) => r >= KEPT_STOP_R).length,
    losses: losing.length,
    bySetup,
    byFeeling,
    leak: candidates[0] ?? null,
  };
}

/**
 * A trade closed at a typed price. A price with more decimals than the
 * trade's lifts every price to them, so 1.1 closed at 1.1045 still compares
 * exactly. Null for a price that doesn't parse.
 */
export function withExit(
  trade: JournalTrade,
  text: string,
  at: number,
): JournalTrade | null {
  const parsed = parsePrice(text);
  if (!parsed) return null;
  const decimals = Math.max(trade.decimals, parsed.decimals);
  const lift = (units: number, from: number) => units * pow10(decimals - from);
  const next: JournalTrade = {
    ...trade,
    decimals,
    entry: lift(trade.entry, trade.decimals),
    stop: lift(trade.stop, trade.decimals),
    target: trade.target === null ? null : lift(trade.target, trade.decimals),
    exit: lift(parsed.units, parsed.decimals),
    closedAt: at,
  };
  return [next.entry, next.stop, next.target ?? 1, next.exit ?? 1].every(
    Number.isSafeInteger,
  )
    ? next
    : null;
}

/**
 * The journal as an append-only log, so two devices merge by keeping every
 * event (lib/sync/log.ts): saving a trade (again, after an edit or a close)
 * and removing one. The latest event for a trade wins.
 */
export type JournalEvent =
  | { kind: 'saved'; id: string; at: number; trade: JournalTrade }
  | { kind: 'removed'; id: string; at: number; trade: string };

/** The trades a log adds up to, newest first. */
export function journalFrom(events: readonly JournalEvent[]): JournalTrade[] {
  const latest = new Map<string, JournalEvent>();
  for (const e of [...events].sort(
    (a, b) => a.at - b.at || a.id.localeCompare(b.id),
  )) {
    latest.set(e.kind === 'saved' ? e.trade.id : e.trade, e);
  }
  return [...latest.values()]
    .flatMap((e) => (e.kind === 'saved' ? [e.trade] : []))
    .sort(
      (a, b) =>
        (b.closedAt ?? b.openedAt) - (a.closedAt ?? a.openedAt) ||
        a.id.localeCompare(b.id),
    );
}
