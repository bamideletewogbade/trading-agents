/**
 * Chart reading: a made-up stock whose chart teaches support, and a trade
 * plan tested against what happens next.
 *
 * The lesson (landing page, and later the Charts track) is not "guess up or
 * down". It is: find where buyers keep stepping in, then decide where you are
 * wrong *before* you buy. So the chart is built, not merely random. A slide
 * into a range, three touches of support, two of resistance, and price back
 * at support when the learner has to plan. What comes next is one of two
 * endings, and the learner can replay the other:
 *
 * - **bounce**: support holds, but the first candle's wick dips under it far
 *   enough to take out a stop placed right on the line. The tight stop loses
 *   on a trade that went on to work.
 * - **break**: support gives way. The stop with room loses a small, planned
 *   amount; no stop loses much more.
 *
 * Seeded noise makes every day's chart look different; the structure above
 * holds for every seed, and `pnpm check` proves it over thousands of them.
 *
 * Prices are integer cents. Pure: no I/O, no Math.random.
 */

import { createRng } from '../core/rng.ts';

export type Candle = {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
};

export type Ending = 'bounce' | 'break';
export type StopChoice = 'room' | 'tight' | 'none';
export const STOP_CHOICES: readonly StopChoice[] = ['room', 'tight', 'none'];

export type ChartScenario = {
  /** What the learner sees before planning: the slide, then the range. */
  readonly seen: readonly Candle[];
  /** What happens after they commit. Hidden until then (no look-ahead). */
  readonly next: readonly Candle[];
  readonly support: number;
  readonly resistance: number;
  /** Where the range starts in `seen`: touches are counted from here. */
  readonly rangeStart: number;
  /** Where a level counts as touched: within this many cents of it. */
  readonly tolerance: number;
  /** The three lines offered when asking "where do buyers step in?". */
  readonly candidates: readonly { key: 'a' | 'b' | 'c'; price: number }[];
  readonly answer: 'a' | 'b' | 'c';
  /** Buy at the last close seen. */
  readonly entry: number;
  readonly stops: Readonly<Record<Exclude<StopChoice, 'none'>, number>>;
  readonly shares: number;
};

/** The shape of every scenario. Content decides the words, this decides the numbers. */
export const CHART = {
  support: 4_000,
  resistance: 4_600,
  tolerance: 15,
  /** The stop with room sits this far under support: past an ordinary wick. */
  roomBelow: 90,
  /** The stop "right on the line" sits this far under support. */
  tightBelow: 20,
  shares: 25,
  /**
   * The price window every chart is drawn in. Fixed, not fitted to the
   * candles: a scale fitted to what comes next would give away the ending
   * before the learner commits (no look-ahead, even in the axis).
   */
  view: { low: 3_450, high: 5_200 },
  slide: 8,
  range: 22,
  next: 12,
} as const;

/** Where the range touches its floor and ceiling, as indexes into `seen`. */
const SUPPORT_TOUCHES = [9, 17, 29] as const;
const RESISTANCE_TOUCHES = [13, 22] as const;

export class ChartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChartError';
  }
}

/** Straight-line waypoints for the closes, before noise. */
function waypoints(): [number, number][] {
  const { support: s, resistance: r } = CHART;
  return [
    [0, 5_050],
    [CHART.slide - 1, 4_180],
    [SUPPORT_TOUCHES[0], s + 40],
    [RESISTANCE_TOUCHES[0], r - 40],
    [SUPPORT_TOUCHES[1], s + 45],
    [RESISTANCE_TOUCHES[1], r - 35],
    [26, s + 180],
    [SUPPORT_TOUCHES[2], s + 30],
  ];
}

function along(points: [number, number][], index: number): number {
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i] as [number, number];
    const [x0, y0] = points[i - 1] as [number, number];
    if (index <= x1)
      return y0 + Math.trunc(((y1 - y0) * (index - x0)) / (x1 - x0));
  }
  return (points[points.length - 1] as [number, number])[1];
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function chartScenario(seed: string, ending: Ending): ChartScenario {
  // One generator for what is seen, another for what comes next: the same
  // seed shows the same chart whichever ending is replayed.
  const rng = createRng(`chart:${seed}`);
  const after = createRng(`chart:${seed}:${ending}`);
  const { support: s, resistance: r, tolerance: tol } = CHART;
  const points = waypoints();
  const total = CHART.slide + CHART.range;

  const seen: Candle[] = [];
  let open = 5_120;
  for (let i = 0; i < total; i += 1) {
    const inRange = i >= CHART.slide;
    const target = along(points, i);
    let close = target + (inRange ? rng.int(-18, 18) : rng.int(-35, 35));
    if (inRange) close = clamp(close, s + 25, r - 25);
    const touchLow = (SUPPORT_TOUCHES as readonly number[]).includes(i);
    const touchHigh = (RESISTANCE_TOUCHES as readonly number[]).includes(i);
    let high = Math.max(open, close) + rng.int(6, 34);
    let low = Math.min(open, close) - rng.int(6, 34);
    if (inRange) {
      // Only the touch candles reach the levels; every other candle keeps
      // clear of them, so the count of touches is exact.
      high = touchHigh ? r - rng.int(0, tol - 5) : Math.min(high, r - tol - 1);
      low = touchLow ? s + rng.int(-(tol - 5), 0) : Math.max(low, s + tol + 1);
      high = Math.max(high, open, close);
      low = Math.min(low, open, close);
    }
    seen.push({ open, high, low, close });
    open = close;
  }

  const entry = (seen[seen.length - 1] as Candle).close;
  const stops = {
    room: s - CHART.roomBelow,
    tight: s - CHART.tightBelow,
  };

  const next: Candle[] = [];
  open = entry;
  for (let i = 0; i < CHART.next; i += 1) {
    let close: number;
    let low: number;
    let high: number;
    if (ending === 'bounce') {
      // The first candle shakes out the tight stop, then buyers take over.
      close = i === 0 ? s + 40 : s + 40 + (i * 410) / (CHART.next - 1);
      close = Math.trunc(close) + (i === 0 ? 0 : after.int(-20, 20));
      low =
        i === 0
          ? s - CHART.tightBelow - after.int(10, 40)
          : Math.max(Math.min(open, close) - after.int(6, 30), s + tol + 1);
      high = Math.max(open, close) + after.int(6, 30);
    } else {
      // Support gives way on the first candle and keeps going.
      close =
        i === 0
          ? s - 60
          : s -
            60 -
            Math.trunc((i * 390) / (CHART.next - 1)) +
            after.int(-15, 15);
      close = Math.min(close, s - 40);
      low = Math.min(open, close) - after.int(8, 34);
      high = Math.min(Math.max(open, close) + after.int(6, 30), s + 30);
      high = Math.max(high, open, close);
    }
    next.push({ open, high, low, close });
    open = close;
  }

  return {
    seen,
    next,
    support: s,
    resistance: r,
    rangeStart: CHART.slide,
    tolerance: tol,
    candidates: [
      { key: 'a', price: r },
      { key: 'b', price: s + 300 },
      { key: 'c', price: s },
    ],
    answer: 'c',
    entry,
    stops,
    shares: CHART.shares,
  };
}

/**
 * Which candles of the range touched `level`, as indexes into `seen`: their
 * low (support) or high (resistance) within tolerance. The slide into the
 * range isn't counted: price passing through a level on the way down is not
 * the market testing it.
 */
export function touches(
  scenario: ChartScenario,
  level: number,
  side: 'support' | 'resistance',
): number[] {
  const hits: number[] = [];
  for (let i = scenario.rangeStart; i < scenario.seen.length; i += 1) {
    const candle = scenario.seen[i] as Candle;
    const reach = side === 'support' ? candle.low : candle.high;
    if (Math.abs(reach - level) <= scenario.tolerance) hits.push(i);
  }
  return hits;
}

export type Anatomy = {
  direction: 'up' | 'down' | 'flat';
  body: number;
  upperWick: number;
  lowerWick: number;
  range: number;
};

/** The parts of one candle, for the "tap a candle" step. */
export function anatomy(candle: Candle): Anatomy {
  const top = Math.max(candle.open, candle.close);
  const bottom = Math.min(candle.open, candle.close);
  return {
    direction:
      candle.close > candle.open
        ? 'up'
        : candle.close < candle.open
          ? 'down'
          : 'flat',
    body: top - bottom,
    upperWick: candle.high - top,
    lowerWick: bottom - candle.low,
    range: candle.high - candle.low,
  };
}

export type TradeResult = {
  stop: StopChoice;
  /** Index into `next` where the stop was hit, or null if it never was. */
  stoppedAt: number | null;
  exit: number;
  /** In cents: (exit − entry) × shares. */
  pnl: number;
  /** What the plan risked if the stop was hit, in cents; null with no stop. */
  risked: number | null;
  /** The worst the position was ever down, in cents (≤ 0). */
  worst: number;
};

/**
 * Plays the plan against what came next. A stop is hit when a candle's low
 * reaches it and fills at the stop price. Gaps and slippage are a later
 * lesson; here, a stop is a promise the market keeps.
 */
export function playPlan(
  scenario: ChartScenario,
  stop: StopChoice,
): TradeResult {
  const level = stop === 'none' ? null : scenario.stops[stop];
  if (level !== null && level >= scenario.entry)
    throw new ChartError('A stop must sit below the entry.');
  let worst = 0;
  for (let i = 0; i < scenario.next.length; i += 1) {
    const candle = scenario.next[i] as Candle;
    if (level !== null && candle.low <= level) {
      const pnl = (level - scenario.entry) * scenario.shares;
      return {
        stop,
        stoppedAt: i,
        exit: level,
        pnl,
        risked: (scenario.entry - level) * scenario.shares,
        worst: Math.min(worst, pnl),
      };
    }
    worst = Math.min(worst, (candle.low - scenario.entry) * scenario.shares);
  }
  const exit = (scenario.next[scenario.next.length - 1] as Candle).close;
  return {
    stop,
    stoppedAt: null,
    exit,
    pnl: (exit - scenario.entry) * scenario.shares,
    risked: level === null ? null : (scenario.entry - level) * scenario.shares,
    worst,
  };
}
