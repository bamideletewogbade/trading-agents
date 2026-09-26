/**
 * Scenarios for the technical-analysis stage (t1–t10): the charts each
 * lesson is built on, and the tests that put a tool against a coin flip.
 *
 * Two kinds of thing live here:
 *
 * - **Built charts** (a channel, a top, a double top, a divergence), where
 *   the structure the lesson points at is guaranteed by construction and
 *   seeded noise makes each one look different. `pnpm check` proves the
 *   structure holds for every seed.
 * - **Honest tests**: run a pattern or a level over hundreds of simulated
 *   charts and count how often it "worked", next to how often anything
 *   would have. On charts with no edge built in, a pattern that works about
 *   as often as the baseline is a coin flip. That's the lesson: a tool is
 *   only evidence once it beats the baseline on data you trust.
 *
 * Prices in integer cents. Pure and seeded.
 */

import { createRng } from '../core/rng.ts';
import { walkCandles, type Bar } from './candles.ts';
import { atr, rsi } from './indicators.ts';

/* ── Trendlines (t1) ──────────────────────────────────────────────────── */

export type Point = { index: number; price: number };
export type Line = { slope: number; intercept: number };

export function lineThrough(a: Point, b: Point): Line {
  if (a.index === b.index)
    throw new RangeError('A line needs two different bars.');
  const slope = (b.price - a.price) / (b.index - a.index);
  return { slope, intercept: a.price - slope * a.index };
}

export function lineAt(line: Line, index: number): number {
  return line.intercept + line.slope * index;
}

/** Bars whose low (or high) sits within `tolerance` cents of the line. */
export function lineTouches(
  bars: readonly Bar[],
  line: Line,
  tolerance: number,
  side: 'low' | 'high' = 'low',
): number[] {
  const hits: number[] = [];
  bars.forEach((bar, i) => {
    if (Math.abs(bar[side] - lineAt(line, i)) <= tolerance) hits.push(i);
  });
  return hits;
}

export type LineReport = {
  /** Bars whose low came within tolerance of the line and closed above it. */
  touches: number[];
  /** Bars that closed below the line by more than the tolerance: the line failed there. */
  breaks: number[];
};

/**
 * How a drawn support line did from the first point it was drawn through
 * to the end of the chart: where price came back to it and held, and where
 * price closed straight through it. A line that price keeps closing
 * through isn't support, however neatly it was drawn.
 */
export function judgeLine(
  bars: readonly Bar[],
  line: Line,
  tolerance: number,
  from: number,
): LineReport {
  const touches: number[] = [];
  const breaks: number[] = [];
  for (let i = from; i < bars.length; i += 1) {
    const bar = bars[i] as Bar;
    const at = lineAt(line, i);
    if (bar.close < at - tolerance) breaks.push(i);
    else if (Math.abs(bar.low - at) <= tolerance) touches.push(i);
  }
  return { touches, breaks };
}

export type Channel = {
  bars: Bar[];
  /** The lows a learner can draw through. All but `odd` sit on the lower line. */
  lows: { key: string; index: number; price: number }[];
  odd: string;
  /** The first high on the upper line, for copying the trendline across. */
  upperTouch: Point;
  lower: Line;
  width: number;
  tolerance: number;
};

const CHANNEL_LOWS = [4, 12, 20, 28];
const CHANNEL_HIGHS = [8, 16, 24];
const CHANNEL_ODD = 17;

/**
 * A rising channel: lows on one line, highs on a parallel one, with one
 * low inside the channel that isn't on either (the trap: any two points
 * make a line).
 */
export function channel(seed: string): Channel {
  const rng = createRng(`channel:${seed}`);
  const base = 10_000;
  const slope = 12;
  const width = 260;
  const tol = 8;
  const bars: Bar[] = [];
  const lower = (i: number) => base + slope * i;
  let open = lower(0) + 120;
  for (let i = 0; i < 34; i += 1) {
    const phase = i % 8;
    // Down to the lower line at phase 4, up to the upper line at phase 0.
    const target =
      phase <= 4
        ? lower(i) + width - (width * phase) / 4
        : lower(i) + (width * (phase - 4)) / 4;
    let close = Math.round(target) + rng.int(-12, 12);
    close = Math.min(lower(i) + width - 45, Math.max(lower(i) + 45, close));
    let high = Math.max(open, close) + rng.int(4, 16);
    let low = Math.min(open, close) - rng.int(4, 16);
    high = CHANNEL_HIGHS.includes(i)
      ? Math.round(lower(i) + width) - rng.int(0, tol - 2)
      : Math.min(high, Math.round(lower(i) + width) - 35);
    if (CHANNEL_LOWS.includes(i)) low = Math.round(lower(i)) + rng.int(0, 2);
    else if (i === CHANNEL_ODD) low = Math.round(lower(i)) + 110;
    else low = Math.max(low, Math.round(lower(i)) + 35);
    high = Math.max(high, open, close);
    low = Math.min(low, open, close);
    bars.push({ open, high, low, close, volume: rng.int(80, 140) });
    open = close;
  }
  const keys = ['A', 'B', 'X', 'C', 'D'];
  const indexes = [4, 12, CHANNEL_ODD, 20, 28];
  return {
    bars,
    lows: indexes.map((index, k) => ({
      key: keys[k] as string,
      index,
      price: (bars[index] as Bar).low,
    })),
    odd: 'X',
    upperTouch: {
      index: CHANNEL_HIGHS[0] as number,
      price: (bars[CHANNEL_HIGHS[0] as number] as Bar).high,
    },
    lower: { slope, intercept: base },
    width,
    tolerance: tol + 4,
  };
}

/* ── A top: rise, then turn (t2, t4) ──────────────────────────────────── */

/** A steady rise for `rise` bars, then a steady fall. The top is at index `rise`. */
export function topSeries(
  seed: string,
  rise = 45,
  fall = 35,
): { bars: Bar[]; top: number } {
  const up = walkCandles(`${seed}:up`, {
    count: rise,
    start: 10_000,
    drift: 18,
    wobble: 30,
  });
  const last = (up[up.length - 1] as Bar).close;
  const down = walkCandles(`${seed}:down`, {
    count: fall,
    start: last,
    drift: -20,
    wobble: 30,
  });
  return { bars: [...up, ...down], top: rise };
}

/* ── A strong run (t3) ────────────────────────────────────────────────── */

/** A quiet start, then a strong, steady rise that keeps going. */
export function strongRun(seed: string): Bar[] {
  const quiet = walkCandles(`${seed}:quiet`, {
    count: 20,
    start: 10_000,
    drift: 0,
    wobble: 25,
    revertBp: 2_000,
  });
  const last = (quiet[quiet.length - 1] as Bar).close;
  const run = walkCandles(`${seed}:run`, {
    count: 40,
    start: last,
    drift: 22,
    wobble: 20,
  });
  return [...quiet, ...run];
}

/* ── Stops and noise (t5) ─────────────────────────────────────────────── */

export type StopTest = { entries: number; stopped: number; rateBp: number };

/**
 * On charts with no trend (pure noise, `wobble` cents a bar at most), buy
 * at many points with a stop `stopDistance(entry, atr)` below the entry,
 * and count how often the next `horizon` bars hit it. Every stop-out here
 * is noise, by construction.
 */
export function noiseStopOuts(
  seed: string,
  stopDistance: (entry: number, atrValue: number) => number,
  wobble = 40,
  horizon = 10,
  charts = 40,
): StopTest {
  let entries = 0;
  let stopped = 0;
  for (let c = 0; c < charts; c += 1) {
    const bars = walkCandles(`${seed}:${c}`, {
      count: 80,
      start: 10_000,
      drift: 0,
      wobble,
    });
    const ranges = atr(bars, 14);
    for (let i = 20; i + horizon < bars.length; i += 6) {
      const a = ranges[i];
      if (a == null) continue;
      const entry = (bars[i] as Bar).close;
      const stop = entry - stopDistance(entry, a);
      entries += 1;
      for (let j = i + 1; j <= i + horizon; j += 1)
        if ((bars[j] as Bar).low <= stop) {
          stopped += 1;
          break;
        }
    }
  }
  return {
    entries,
    stopped,
    rateBp: entries ? Math.round((stopped * 10_000) / entries) : 0,
  };
}

/* ── Candlestick patterns (t6) ────────────────────────────────────────── */

export type PatternKind = 'engulfing' | 'hammer' | 'doji';

/** Bullish engulfing, hammer (pin bar with a long lower wick), and doji. */
export function findPatterns(
  bars: readonly Bar[],
): { index: number; kind: PatternKind }[] {
  const out: { index: number; kind: PatternKind }[] = [];
  bars.forEach((bar, i) => {
    const body = Math.abs(bar.close - bar.open);
    const range = bar.high - bar.low;
    if (range <= 0) return;
    const top = Math.max(bar.open, bar.close);
    const bottom = Math.min(bar.open, bar.close);
    const previous = bars[i - 1];
    if (
      previous &&
      previous.close < previous.open &&
      bar.close > bar.open &&
      bar.open <= previous.close &&
      bar.close >= previous.open
    )
      out.push({ index: i, kind: 'engulfing' });
    else if (body * 10 <= range) out.push({ index: i, kind: 'doji' });
    else if (bottom - bar.low >= 2 * body && bar.high - top <= body)
      out.push({ index: i, kind: 'hammer' });
  });
  return out;
}

/** A 40-bar chart with no edge, for marking patterns on. */
export function patternChart(seed: string): Bar[] {
  return walkCandles(seed, { count: 40, start: 10_000, drift: 0, wobble: 40 });
}

export type PatternTest = {
  kind: PatternKind | 'any bar';
  found: number;
  /** How many were followed by a higher close `horizon` bars later. */
  rose: number;
  rateBp: number;
};

/**
 * Every pattern on `charts` noise-only charts, against the baseline of
 * every bar: how often was the close `horizon` bars later higher?
 */
export function testPatterns(
  seed: string,
  charts = 200,
  horizon = 5,
): PatternTest[] {
  const tally = new Map<PatternTest['kind'], { found: number; rose: number }>([
    ['engulfing', { found: 0, rose: 0 }],
    ['hammer', { found: 0, rose: 0 }],
    ['doji', { found: 0, rose: 0 }],
    ['any bar', { found: 0, rose: 0 }],
  ]);
  for (let c = 0; c < charts; c += 1) {
    const bars = walkCandles(`${seed}:${c}`, {
      count: 60,
      start: 10_000,
      drift: 0,
      wobble: 40,
    });
    const patterns = findPatterns(bars);
    const add = (kind: PatternTest['kind'], i: number) => {
      const later = bars[i + horizon];
      if (!later) return;
      const row = tally.get(kind) as { found: number; rose: number };
      row.found += 1;
      if (later.close > (bars[i] as Bar).close) row.rose += 1;
    };
    for (const pattern of patterns) add(pattern.kind, pattern.index);
    for (let i = 0; i < bars.length; i += 1) add('any bar', i);
  }
  return [...tally.entries()].map(([kind, { found, rose }]) => ({
    kind,
    found,
    rose,
    rateBp: found ? Math.round((rose * 10_000) / found) : 0,
  }));
}

/* ── Double top (t7) ──────────────────────────────────────────────────── */

export type DoubleTop = {
  seen: Bar[];
  next: Bar[];
  peak: number;
  neckline: number;
  peaks: [number, number];
  /** The neckline minus the pattern's height: the textbook target. */
  target: number;
  candidates: { key: 'a' | 'b' | 'c'; price: number }[];
  answer: 'a' | 'b' | 'c';
};

/**
 * A rise to a peak, a pullback to the neckline, a second peak at the same
 * height, and a return to the neckline. Then either the neckline breaks
 * (the pattern completes) or it holds and price breaks out above the peaks.
 */
export function doubleTop(seed: string, ending: 'break' | 'fail'): DoubleTop {
  const rng = createRng(`double-top:${seed}`);
  const after = createRng(`double-top:${seed}:${ending}`);
  const peak = 10_600;
  const neckline = 10_300;
  const peaks: [number, number] = [12, 24];
  const waypoints: [number, number][] = [
    [0, 9_900],
    [peaks[0] - 1, peak - 50],
    [18, neckline + 25],
    [peaks[1] - 1, peak - 50],
    [30, neckline + 30],
  ];
  const along = (i: number) => {
    for (let w = 1; w < waypoints.length; w += 1) {
      const [x1, y1] = waypoints[w] as [number, number];
      const [x0, y0] = waypoints[w - 1] as [number, number];
      if (i <= x1) return y0 + Math.trunc(((y1 - y0) * (i - x0)) / (x1 - x0));
    }
    return neckline + 30;
  };
  const seen: Bar[] = [];
  let open = 9_880;
  for (let i = 0; i <= 30; i += 1) {
    const close = Math.min(peak - 20, along(i) + rng.int(-15, 15));
    let high = Math.max(open, close) + rng.int(4, 18);
    let low = Math.min(open, close) - rng.int(4, 18);
    if (peaks.includes(i)) high = peak - rng.int(0, 6);
    else high = Math.min(high, peak - 25);
    if (i === 18 || i === 30) low = neckline - rng.int(0, 6);
    else if (i > peaks[0]) low = Math.max(low, neckline + 12);
    high = Math.max(high, open, close);
    low = Math.min(low, open, close);
    seen.push({ open, high, low, close, volume: rng.int(80, 140) });
    open = close;
  }
  const height = peak - neckline;
  const next: Bar[] = [];
  for (let i = 0; i < 12; i += 1) {
    const close =
      ending === 'break'
        ? neckline -
          30 -
          Math.trunc(((height + 20) * i) / 11) +
          after.int(-10, 10)
        : neckline +
          60 +
          Math.trunc(((height + 120) * i) / 11) +
          after.int(-10, 10);
    next.push({
      open,
      high: Math.max(open, close) + after.int(4, 16),
      low: Math.min(open, close) - after.int(4, 16),
      close,
      volume: after.int(90, 160),
    });
    open = close;
  }
  return {
    seen,
    next,
    peak,
    neckline,
    peaks,
    target: neckline - height,
    candidates: [
      { key: 'a', price: peak },
      { key: 'b', price: neckline },
      { key: 'c', price: 9_950 },
    ],
    answer: 'b',
  };
}

/* ── Fibonacci, tested (t8) ───────────────────────────────────────────── */

export const FIB_LEVELS_BP = [3_820, 5_000, 6_180] as const;
/** Made-up levels, spread the same way, for a fair comparison. */
export const MADE_UP_LEVELS_BP = [3_400, 4_600, 5_800] as const;

/** Retracement prices for a move from `low` up to `high`. */
export function retracements(
  high: number,
  low: number,
  levelsBp: readonly number[],
): number[] {
  return levelsBp.map((bp) => Math.round(high - ((high - low) * bp) / 10_000));
}

/**
 * On `charts` noise charts that start with a rise, how often does price
 * "react" at each level on the pullback: a low within `tolerance` of it,
 * then a close back above it within 3 bars? Fibonacci levels and made-up
 * levels get exactly the same test.
 */
export function testLevels(
  seed: string,
  levelsBp: readonly number[],
  charts = 300,
): { reactions: number; chances: number; rateBp: number } {
  let reactions = 0;
  let chances = 0;
  for (let c = 0; c < charts; c += 1) {
    const rise = walkCandles(`${seed}:${c}:rise`, {
      count: 20,
      start: 10_000,
      drift: 25,
      wobble: 30,
    });
    const top = Math.max(...rise.map((bar) => bar.high));
    const start = (rise[rise.length - 1] as Bar).close;
    const drift = walkCandles(`${seed}:${c}:after`, {
      count: 30,
      start,
      drift: -10,
      wobble: 40,
    });
    const low = Math.min(...rise.map((bar) => bar.low));
    const tolerance = Math.max(8, Math.round((top - low) / 60));
    for (const level of retracements(top, low, levelsBp)) {
      chances += 1;
      for (let i = 0; i < drift.length - 3; i += 1) {
        const bar = drift[i] as Bar;
        if (Math.abs(bar.low - level) <= tolerance) {
          if (
            drift
              .slice(i + 1, i + 4)
              .some((later) => later.close > level + tolerance)
          )
            reactions += 1;
          break;
        }
      }
    }
  }
  return {
    reactions,
    chances,
    rateBp: chances ? Math.round((reactions * 10_000) / chances) : 0,
  };
}

/* ── Several timeframes (t9) ──────────────────────────────────────────── */

export type TimeframeTest = {
  trades: number;
  wins: number;
  rateBp: number;
  averageCents: number;
};

/**
 * Buy the hourly dip (three falling closes in a row) and sell 12 hours
 * later, on many charts whose bigger trend (the drift) is up, or down.
 */
export function buyTheDip(
  seed: string,
  trend: 'up' | 'down',
  charts = 150,
): TimeframeTest {
  let trades = 0;
  let wins = 0;
  let total = 0;
  for (let c = 0; c < charts; c += 1) {
    const hourly = walkCandles(`${seed}:${trend}:${c}`, {
      count: 96,
      start: 10_000,
      drift: trend === 'up' ? 4 : -4,
      wobble: 30,
    });
    for (let i = 3; i + 12 < hourly.length; i += 1) {
      const a = hourly[i - 2] as Bar;
      const b = hourly[i - 1] as Bar;
      const d = hourly[i] as Bar;
      if (
        !(
          a.close > b.close &&
          b.close > d.close &&
          (hourly[i - 3] as Bar).close > a.close
        )
      )
        continue;
      const result = (hourly[i + 12] as Bar).close - d.close;
      trades += 1;
      total += result;
      if (result > 0) wins += 1;
      i += 12;
    }
  }
  return {
    trades,
    wins,
    rateBp: trades ? Math.round((wins * 10_000) / trades) : 0,
    averageCents: trades ? Math.round(total / trades) : 0,
  };
}

/* ── Divergence (t10) ─────────────────────────────────────────────────── */

export type Divergence = {
  seen: Bar[];
  next: Bar[];
  /** The two highs: the second is higher in price. */
  highs: [number, number];
};

/**
 * A fast rally to a first high, a pullback, then a slow grind to a
 * slightly higher second high. Price makes a higher high; RSI, which
 * measures the speed of the gains, makes a lower one. Then either the move
 * rolls over, or it carries on regardless.
 */
export function divergence(
  seed: string,
  ending: 'reversal' | 'continuation',
): Divergence {
  const rng = createRng(`divergence:${seed}`);
  const after = createRng(`divergence:${seed}:${ending}`);
  const seen: Bar[] = [];
  let open = 10_000;
  const push = (close: number) => {
    seen.push({
      open,
      high: Math.max(open, close) + rng.int(3, 10),
      low: Math.min(open, close) - rng.int(3, 10),
      close,
      volume: rng.int(80, 140),
    });
    open = close;
  };
  for (let i = 0; i < 16; i += 1) push(open + rng.int(-10, 10));
  for (let i = 0; i < 10; i += 1) push(open + 45 + rng.int(-8, 8));
  const first = seen.length - 1;
  for (let i = 0; i < 6; i += 1) push(open - 38 + rng.int(-6, 6));
  for (let i = 0; i < 14; i += 1)
    push(open + (i % 3 === 2 ? -12 : 26) + rng.int(-4, 4));
  // Make sure the second high clears the first.
  const firstHigh = (seen[first] as Bar).high;
  const lastBar = seen[seen.length - 1] as Bar;
  if (lastBar.high <= firstHigh) {
    seen[seen.length - 1] = {
      ...lastBar,
      high: firstHigh + 15,
      close: Math.max(lastBar.close, firstHigh + 5),
    };
    open = (seen[seen.length - 1] as Bar).close;
  }
  const second = seen.length - 1;
  const next: Bar[] = [];
  for (let i = 0; i < 12; i += 1) {
    const close =
      open + (ending === 'reversal' ? -40 : 30) + after.int(-10, 10);
    next.push({
      open,
      high: Math.max(open, close) + after.int(3, 10),
      low: Math.min(open, close) - after.int(3, 10),
      close,
      volume: after.int(80, 140),
    });
    open = close;
  }
  return { seen, next, highs: [first, second] };
}

/** RSI at the two highs, for the divergence lesson. */
export function rsiAtHighs(d: Divergence, length = 14): [number, number] {
  const values = rsi(
    d.seen.map((bar) => bar.close),
    length,
  );
  return [values[d.highs[0]] ?? 0, values[d.highs[1]] ?? 0];
}
