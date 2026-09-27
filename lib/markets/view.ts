/**
 * What the signals API sends: a market's reading with bar indexes turned
 * into dates, and the recent bars a chart draws. Plain JSON, so the screens
 * import only these types and never the engine.
 *
 * Pure: `pnpm check` runs these on recorded bars.
 */

import type { Bar } from '../engines/candles.ts';
import {
  signalLines,
  type Now,
  type Played,
  type Reading,
  type TrackRecord,
} from '../engines/signals.ts';
import { BAR_MINUTES, type Market } from './catalog.ts';
import type { TimedBar } from './kraken.ts';

export type MarketInfo = Pick<
  Market,
  'id' | 'symbol' | 'name' | 'class' | 'decimals' | 'costBp' | 'source'
>;

/** A played signal with its bars as dates (seconds since 1970, UTC). */
export type PlayedView = Played & {
  atTime: number;
  exitTime: number | null;
};

export type NowView =
  | (Extract<Now, { state: 'new' }> & { atTime: number })
  | { state: 'open'; played: PlayedView }
  | Extract<Now, { state: 'wait' }>;

export type Summary = {
  market: MarketInfo;
  /** The close the reading is as of (seconds, UTC). */
  asOf: number;
  price: number;
  dayBp: number;
  weekBp: number;
  trend: Reading['trend'];
  rsi: number;
  now: NowView;
  record: Omit<TrackRecord, 'curve'>;
};

export type Detail = Summary & {
  atrBp: number;
  rules: number;
  history: PlayedView[];
  curve: number[];
  /** Since when the record counts, and how many bars it covers. */
  from: number;
  chart: {
    /** The last bars, each dated by its close like everything else here. */
    bars: (Bar & { time: number })[];
    fast: (number | null)[];
    slow: (number | null)[];
  };
};

export type Unavailable = { market: MarketInfo; unavailable: true };

export const CHART_BARS = 120;

export function infoOf(market: Market): MarketInfo {
  const { id, symbol, name, class: kind, decimals, costBp, source } = market;
  return { id, symbol, name, class: kind, decimals, costBp, source };
}

/**
 * Sources stamp a bar with the time it opened; a decision is made when it
 * closes. Every date the screens show is the close: the bar stamped 25 Sep
 * 00:00 closed, and was decided on, at 26 Sep 00:00.
 */
function closeOf(bar: TimedBar): number {
  return bar.time + BAR_MINUTES * 60;
}

function timeOf(
  bars: readonly TimedBar[],
  index: number | null,
): number | null {
  const bar = index == null ? undefined : bars[index];
  return bar ? closeOf(bar) : null;
}

function playedView(bars: readonly TimedBar[], played: Played): PlayedView {
  return {
    ...played,
    atTime: timeOf(bars, played.at) as number,
    exitTime: timeOf(bars, played.exitAt),
  };
}

function nowView(bars: readonly TimedBar[], now: Now): NowView {
  if (now.state === 'new')
    return {
      state: 'new',
      signal: now.signal,
      atTime: timeOf(bars, now.signal.at) as number,
    };
  if (now.state === 'open')
    return { state: 'open', played: playedView(bars, now.played) };
  return now;
}

export function summaryOf(
  market: Market,
  bars: readonly TimedBar[],
  reading: Reading,
): Summary {
  const { curve: _curve, ...record } = reading.record;
  return {
    market: infoOf(market),
    asOf: closeOf(bars[bars.length - 1] as TimedBar),
    price: reading.price,
    dayBp: reading.dayBp,
    weekBp: reading.weekBp,
    trend: reading.trend,
    rsi: reading.rsi,
    now: nowView(bars, reading.now),
    record,
  };
}

export function detailOf(
  market: Market,
  bars: readonly TimedBar[],
  reading: Reading,
  warmup: number,
): Detail {
  const lines = signalLines(bars, CHART_BARS);
  return {
    ...summaryOf(market, bars, reading),
    atrBp: reading.atrBp,
    rules: reading.rules,
    history: reading.history.map((played) => playedView(bars, played)),
    curve: reading.record.curve,
    from: closeOf(bars[warmup] as TimedBar),
    chart: {
      bars: bars.slice(-CHART_BARS).map((bar) => ({
        time: closeOf(bar),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      })),
      fast: lines.fast,
      slow: lines.slow,
    },
  };
}

/** Signals first (a new call, then open ones), then the markets being watched. */
export function byUrgency(a: Summary, b: Summary): number {
  const rank = { new: 0, open: 1, wait: 2 } as const;
  return rank[a.now.state] - rank[b.now.state];
}
