import type { WalkConfig } from '../../lib/engines/candles.ts';

/**
 * The seeds and shapes the lessons pin, in one place, so scripts/check-lessons.ts
 * can prove each still shows what its lesson says it shows.
 */

export const TREND: { up: WalkConfig; down: WalkConfig } = {
  up: { count: 40, start: 10_000, drift: 14, wobble: 40 },
  down: { count: 40, start: 10_000, drift: -14, wobble: 40 },
};

export const RANGE: WalkConfig = {
  count: 40,
  start: 10_000,
  drift: 0,
  wobble: 40,
  revertBp: 2_500,
};

export const SEEDS = {
  book: 'price-is',
  spread: 'spread',
  orders: 'orders-1',
  trendUp: 'trend-up-1',
  trendDown: 'trend-down-3',
  chart: 'koko',
  timeframes: 'timeframes',
  breakout: 'volume',
  expectancy: 'many-trades',
  leverage: 'day-4',
  sort: [
    { seed: 'sort-up-0', kind: 'trend', up: true },
    { seed: 'sort-range-0', kind: 'range', up: false },
    { seed: 'sort-down-0', kind: 'trend', up: false },
    { seed: 'sort-flat-0', kind: 'range', up: false },
  ],
} as const;
