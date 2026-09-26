/**
 * Candles for the chart-reading stage (c1, c3, c4, c6, c7): generate them,
 * group them into longer timeframes, find the swing highs and lows, tell a
 * trend from a range, and build breakouts that are real or fake.
 *
 * Prices in integer cents, volume in whole units. Pure and seeded: the same
 * seed draws the same chart on every phone.
 */

import { createRng } from '../core/rng.ts';

export type Bar = {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
};

export type WalkConfig = {
  count: number;
  start: number;
  /** Average move per bar, in cents (the trend). */
  drift: number;
  /** Largest random move per bar, in cents (the noise). */
  wobble: number;
  /**
   * Pull back towards the start each bar, as a share in basis points of
   * the distance from it: 0 for a trend, a few hundred for a range.
   */
  revertBp?: number;
};

/** A seeded walk of candles. Volume is ordinary, with the odd busy bar. */
export function walkCandles(seed: string, config: WalkConfig): Bar[] {
  const rng = createRng(`walk:${seed}`);
  const bars: Bar[] = [];
  let open = config.start;
  for (let i = 0; i < config.count; i += 1) {
    const pull = config.revertBp
      ? -Math.trunc(((open - config.start) * config.revertBp) / 10_000)
      : 0;
    const close =
      open + config.drift + pull + rng.int(-config.wobble, config.wobble);
    const high =
      Math.max(open, close) + rng.int(2, Math.max(3, config.wobble >> 1));
    const low =
      Math.min(open, close) - rng.int(2, Math.max(3, config.wobble >> 1));
    bars.push({ open, high, low, close, volume: rng.int(80, 140) });
    open = close;
  }
  return bars;
}

/** `size` bars become one: first open, highest high, lowest low, last close, summed volume. */
export function aggregate(bars: readonly Bar[], size: number): Bar[] {
  if (!Number.isSafeInteger(size) || size < 1)
    throw new RangeError('A timeframe groups at least one bar.');
  const out: Bar[] = [];
  for (let i = 0; i + size <= bars.length; i += size) {
    const group = bars.slice(i, i + size);
    out.push({
      open: (group[0] as Bar).open,
      high: Math.max(...group.map((bar) => bar.high)),
      low: Math.min(...group.map((bar) => bar.low)),
      close: (group[group.length - 1] as Bar).close,
      volume: group.reduce((sum, bar) => sum + bar.volume, 0),
    });
  }
  return out;
}

export type Swing = { index: number; kind: 'high' | 'low'; price: number };

/**
 * Swing points: a high above the `reach` bars either side of it, a low below
 * them. Strict, so a flat top doesn't count twice.
 */
export function swings(bars: readonly Bar[], reach = 3): Swing[] {
  const out: Swing[] = [];
  for (let i = reach; i < bars.length - reach; i += 1) {
    const bar = bars[i] as Bar;
    let high = true;
    let low = true;
    for (let j = i - reach; j <= i + reach; j += 1) {
      if (j === i) continue;
      const other = bars[j] as Bar;
      if (other.high >= bar.high) high = false;
      if (other.low <= bar.low) low = false;
    }
    if (high) out.push({ index: i, kind: 'high', price: bar.high });
    if (low) out.push({ index: i, kind: 'low', price: bar.low });
  }
  return out;
}

export type Trend = 'up' | 'down' | 'sideways';

/** From the last two swing highs and lows: higher highs and higher lows is up. */
export function trendOf(points: readonly Swing[]): Trend {
  const highs = points.filter((point) => point.kind === 'high').slice(-2);
  const lows = points.filter((point) => point.kind === 'low').slice(-2);
  if (highs.length < 2 || lows.length < 2) return 'sideways';
  const [h1, h2] = highs as [Swing, Swing];
  const [l1, l2] = lows as [Swing, Swing];
  if (h2.price > h1.price && l2.price > l1.price) return 'up';
  if (h2.price < h1.price && l2.price < l1.price) return 'down';
  return 'sideways';
}

/**
 * How efficiently price travelled: the net move as a share of all the
 * moving it did, in basis points. Near 10,000 is a straight line (a
 * trend); near 0 is a lot of going nowhere (a range). Kaufman's
 * efficiency ratio.
 */
export function efficiencyBp(bars: readonly Bar[]): number {
  if (bars.length < 2) return 0;
  let path = 0;
  for (let i = 1; i < bars.length; i += 1)
    path += Math.abs((bars[i] as Bar).close - (bars[i - 1] as Bar).close);
  if (path === 0) return 0;
  const net = Math.abs(
    (bars[bars.length - 1] as Bar).close - (bars[0] as Bar).close,
  );
  return Math.floor((net * 10_000) / path);
}

/** Where the efficiency line sits between a range and a trend, for these lessons. */
export const TREND_EFFICIENCY_BP = 3_000;

export function isTrending(bars: readonly Bar[]): boolean {
  return efficiencyBp(bars) >= TREND_EFFICIENCY_BP;
}

export type Breakout = {
  bars: Bar[];
  /** The top of the range that price breaks. */
  ceiling: number;
  /** Index of the breakout bar. */
  at: number;
  kind: 'real' | 'fake';
};

/**
 * A range, then a close above its ceiling. A real breakout comes on heavy
 * volume and keeps going; a fake one comes on thin volume and falls back
 * inside. The bars up to and including the breakout look alike apart from
 * volume, which is the lesson.
 */
export function breakout(seed: string, kind: 'real' | 'fake'): Breakout {
  const rng = createRng(`breakout:${seed}`);
  const floor = 9_800;
  const ceiling = 10_200;
  const rangeBars = 24;
  const bars: Bar[] = [];
  let open = 10_000;
  for (let i = 0; i < rangeBars; i += 1) {
    const target = i % 8 < 4 ? ceiling - 40 : floor + 40;
    let close = open + Math.trunc((target - open) / 3) + rng.int(-25, 25);
    close = Math.min(ceiling - 15, Math.max(floor + 15, close));
    const high = Math.min(ceiling - 1, Math.max(open, close) + rng.int(3, 20));
    const low = Math.max(floor + 1, Math.min(open, close) - rng.int(3, 20));
    bars.push({ open, high, low, close, volume: rng.int(80, 130) });
    open = close;
  }
  const at = bars.length;
  const breakClose = ceiling + 60;
  bars.push({
    open,
    high: breakClose + 15,
    low: Math.min(open, breakClose) - 10,
    close: breakClose,
    volume: kind === 'real' ? rng.int(330, 420) : rng.int(70, 100),
  });
  open = breakClose;
  for (let i = 0; i < 10; i += 1) {
    const close =
      kind === 'real'
        ? open + rng.int(15, 45)
        : Math.max(floor + 60, open - rng.int(25, 60));
    bars.push({
      open,
      high: Math.max(open, close) + rng.int(3, 15),
      low: Math.min(open, close) - rng.int(3, 15),
      close,
      volume: kind === 'real' ? rng.int(160, 260) : rng.int(70, 120),
    });
    open = close;
  }
  return { bars, ceiling, at, kind };
}

/** The breakout bar's volume as a multiple of the range's average, in tenths (41 = 4.1×). */
export function breakoutVolumeTenths(b: Breakout): number {
  const range = b.bars.slice(0, b.at);
  const total = range.reduce((sum, bar) => sum + bar.volume, 0);
  return Math.round(((b.bars[b.at]?.volume ?? 0) * 10 * range.length) / total);
}

/**
 * An uptrend with a pullback at the end: `rise` bars climbing, then `dip`
 * bars falling. On a short timeframe the end looks like a downtrend; on a
 * long one it's a small dip in a rise. The timeframes lesson (c3).
 */
export function pullbackSeries(seed: string, rise = 84, dip = 12): Bar[] {
  const up = walkCandles(`${seed}:up`, {
    count: rise,
    start: 10_000,
    drift: 9,
    wobble: 30,
  });
  const last = (up[up.length - 1] as Bar).close;
  const down = walkCandles(`${seed}:down`, {
    count: dip,
    start: last,
    drift: -22,
    wobble: 18,
  });
  return [...up, ...down];
}

export type LabelledSwing = Swing & {
  label: 'HH' | 'LH' | 'HL' | 'LL' | 'H' | 'L';
};

/** Each swing against the one before it of the same kind: higher high, lower low… */
export function labelSwings(points: readonly Swing[]): LabelledSwing[] {
  let lastHigh: number | null = null;
  let lastLow: number | null = null;
  return points.map((point) => {
    if (point.kind === 'high') {
      const label =
        lastHigh === null ? 'H' : point.price > lastHigh ? 'HH' : 'LH';
      lastHigh = point.price;
      return { ...point, label };
    }
    const label = lastLow === null ? 'L' : point.price > lastLow ? 'HL' : 'LL';
    lastLow = point.price;
    return { ...point, label };
  });
}
