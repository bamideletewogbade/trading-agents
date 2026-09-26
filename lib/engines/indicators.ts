/**
 * Technical indicators: moving averages, RSI, MACD, Bollinger Bands, ATR.
 *
 * The textbook definitions, matched against the trading-signals library in
 * `pnpm check` (the answer key the research chose): EMA starts from the
 * first value; RSI and ATR use Wilder's smoothing, seeded with a simple
 * average; Bollinger Bands use the population standard deviation.
 *
 * Indicator values aren't money, so they are plain numbers, not integer
 * minor units. They use only + − × ÷ and Math.sqrt, which IEEE 754 defines
 * exactly, so every phone computes the same value to the last bit (see
 * lib/core/rng.ts for why that matters). A null means "not enough data yet":
 * an indicator is never drawn before it can be trusted.
 *
 * Pure. Inputs are prices in cents; price-like outputs are in cents too.
 */

export type Series = (number | null)[];

type HLC = {
  readonly high: number;
  readonly low: number;
  readonly close: number;
};

function checkLength(length: number): void {
  if (!Number.isSafeInteger(length) || length < 1)
    throw new RangeError('An indicator needs a whole length of at least 1.');
}

/** Simple moving average: the plain average of the last `length` values. */
export function sma(values: readonly number[], length: number): Series {
  checkLength(length);
  let sum = 0;
  return values.map((value, i) => {
    sum += value;
    if (i >= length) sum -= values[i - length] as number;
    return i >= length - 1 ? sum / length : null;
  });
}

/**
 * Exponential moving average, weight 2 ÷ (length + 1), starting from the
 * first value. Null until `length` values have been seen, the same warm-up
 * the reference library uses before calling it stable.
 */
export function ema(values: readonly number[], length: number): Series {
  checkLength(length);
  const k = 2 / (length + 1);
  let current: number | null = null;
  return values.map((value, i) => {
    current = current === null ? value : value * k + current * (1 - k);
    return i >= length - 1 ? current : null;
  });
}

/** The EMA of a series that starts later (a MACD line): nulls pass through. */
function emaOfSeries(values: Series, length: number): Series {
  const k = 2 / (length + 1);
  let current: number | null = null;
  let seen = 0;
  return values.map((value) => {
    if (value === null) return null;
    current = current === null ? value : value * k + current * (1 - k);
    seen += 1;
    return seen >= length ? current : null;
  });
}

/**
 * Relative Strength Index, 0 to 100: average gains against average losses
 * over `length` changes, smoothed Wilder's way. High means price has risen
 * fast, not that it must fall.
 */
export function rsi(values: readonly number[], length = 14): Series {
  checkLength(length);
  const out: Series = [null];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i += 1) {
    const change = (values[i] as number) - (values[i - 1] as number);
    const up = change > 0 ? change : 0;
    const down = change < 0 ? -change : 0;
    if (i <= length) {
      gain += up;
      loss += down;
      if (i < length) {
        out.push(null);
        continue;
      }
      gain /= length;
      loss /= length;
    } else {
      gain = (gain * (length - 1) + up) / length;
      loss = (loss * (length - 1) + down) / length;
    }
    out.push(loss === 0 ? 100 : gain === 0 ? 0 : 100 - 100 / (1 + gain / loss));
  }
  return out;
}

export type Macd = { macd: Series; signal: Series; histogram: Series };

/**
 * MACD: the fast EMA minus the slow EMA (the MACD line), an EMA of that
 * (the signal line), and the gap between them (the histogram).
 */
export function macd(
  values: readonly number[],
  fast = 12,
  slow = 26,
  signalLength = 9,
): Macd {
  if (fast >= slow) throw new RangeError('The fast average must be shorter.');
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line: Series = values.map((_, i) =>
    f[i] !== null && s[i] !== null ? (f[i] as number) - (s[i] as number) : null,
  );
  const signal = emaOfSeries(line, signalLength);
  const histogram: Series = line.map((value, i) =>
    value !== null && signal[i] !== null ? value - (signal[i] as number) : null,
  );
  return { macd: line, signal, histogram };
}

export type Bands = { middle: Series; upper: Series; lower: Series };

/** Bollinger Bands: an SMA with bands `width` standard deviations either side. */
export function bollinger(
  values: readonly number[],
  length = 20,
  width = 2,
): Bands {
  checkLength(length);
  const middle = sma(values, length);
  const upper: Series = [];
  const lower: Series = [];
  values.forEach((_, i) => {
    const mean = middle[i];
    if (mean === null || mean === undefined) {
      upper.push(null);
      lower.push(null);
      return;
    }
    let squares = 0;
    for (let j = i - length + 1; j <= i; j += 1) {
      const d = (values[j] as number) - mean;
      squares += d * d;
    }
    const deviation = Math.sqrt(squares / length);
    upper.push(mean + width * deviation);
    lower.push(mean - width * deviation);
  });
  return { middle, upper, lower };
}

/** True range: the bar's range, stretched to include a gap from the last close. */
export function trueRange(bars: readonly HLC[]): number[] {
  return bars.map((bar, i) => {
    const previous = bars[i - 1];
    if (!previous) return bar.high - bar.low;
    return Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - previous.close),
      Math.abs(bar.low - previous.close),
    );
  });
}

/** Average True Range, Wilder-smoothed: how far price usually travels in a bar. */
export function atr(bars: readonly HLC[], length = 14): Series {
  checkLength(length);
  const ranges = trueRange(bars);
  let current = 0;
  return ranges.map((range, i) => {
    if (i < length) {
      current += range;
      if (i < length - 1) return null;
      current /= length;
      return current;
    }
    current = (current * (length - 1) + range) / length;
    return current;
  });
}

/** Indexes where `fast` crosses `slow`, and which way. */
export function crossovers(
  fast: Series,
  slow: Series,
): { index: number; direction: 'up' | 'down' }[] {
  const out: { index: number; direction: 'up' | 'down' }[] = [];
  for (let i = 1; i < fast.length; i += 1) {
    const a0 = fast[i - 1];
    const b0 = slow[i - 1];
    const a1 = fast[i];
    const b1 = slow[i];
    if (a0 == null || b0 == null || a1 == null || b1 == null) continue;
    if (a0 <= b0 && a1 > b1) out.push({ index: i, direction: 'up' });
    if (a0 >= b0 && a1 < b1) out.push({ index: i, direction: 'down' });
  }
  return out;
}

/**
 * How many bars after `from` a series first turns down (a value below the
 * one before it), or null if it never does. For measuring lag at a top.
 */
export function barsUntilTurnDown(series: Series, from: number): number | null {
  for (let i = Math.max(from, 1); i < series.length; i += 1) {
    const now = series[i];
    const before = series[i - 1];
    if (now != null && before != null && now < before) return i - from;
  }
  return null;
}

/** The first index at or after `from` where the series is above `level`. */
export function firstAbove(
  series: Series,
  level: number,
  from = 0,
): number | null {
  for (let i = from; i < series.length; i += 1) {
    const value = series[i];
    if (value != null && value > level) return i;
  }
  return null;
}
