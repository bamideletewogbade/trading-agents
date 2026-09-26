/**
 * Noise and signal: a price that drifts one way under a lot of day-to-day
 * wobble, and a moving average that filters the wobble out.
 *
 * The lesson is the trader's first habit of mind: most of what a price does
 * on any one day is noise. Slide the average longer and the line stops
 * changing its mind. The cost is that it also notices real turns later.
 *
 * Prices in integer cents; averages rounded down to the cent. Pure, seeded.
 */

import { createRng } from '../core/rng.ts';

export type NoiseConfig = {
  readonly steps: number;
  readonly start: number;
  /** The underlying drift per step, in cents: the signal. */
  readonly drift: number;
  /** The largest wobble in one step, in cents: the noise. */
  readonly wobble: number;
};

export const NOISE_LAB: NoiseConfig = {
  steps: 90,
  start: 10_000,
  drift: 8,
  wobble: 120,
};

/** A price: the drift, plus a wobble that doesn't accumulate. */
export function noisyPrices(config: NoiseConfig, seed: string): number[] {
  const rng = createRng(`noise:${seed}`);
  const prices: number[] = [];
  // Half the wobble each step is carried from the last one, so the noise
  // looks like a market's (lumpy) rather than static (flicker).
  let carry = 0;
  for (let i = 0; i < config.steps; i += 1) {
    const shock = rng.int(-config.wobble, config.wobble);
    carry = Math.trunc(carry / 2) + shock;
    prices.push(config.start + config.drift * i + carry);
  }
  return prices;
}

/** Simple moving average; null until there are `length` prices to average. */
export function movingAverage(
  prices: readonly number[],
  length: number,
): (number | null)[] {
  if (!Number.isSafeInteger(length) || length < 1)
    throw new RangeError('An average needs a whole length of at least 1.');
  const out: (number | null)[] = [];
  let sum = 0;
  prices.forEach((price, i) => {
    sum += price;
    if (i >= length) sum -= prices[i - length] as number;
    out.push(i >= length - 1 ? Math.floor(sum / length) : null);
  });
  return out;
}

/**
 * How often a line changed its mind: the number of times it turned from
 * rising to falling or back. Flat steps don't count as a turn.
 */
export function turns(values: readonly (number | null)[]): number {
  let count = 0;
  let direction = 0;
  let last: number | null = null;
  for (const value of values) {
    if (value === null) continue;
    if (last !== null && value !== last) {
      const next = value > last ? 1 : -1;
      if (direction !== 0 && next !== direction) count += 1;
      direction = next;
    }
    last = value;
  }
  return count;
}
