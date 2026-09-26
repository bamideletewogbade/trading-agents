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

/** Stage 4 (technical analysis): the charts and tests each lesson pins. */
export const STAGE4_SEEDS = {
  channel: 'trend-line',
  top: 'ma',
  run: 'rsi',
  stops: 'atr',
  patterns: 'patterns',
  /** A chart with each pattern on it, spaced so the labels don't collide. */
  patternChart: 'patterns:show-3',
  doubleTop: 'neckline',
  fib: 'fib',
  timeframes: 'mtf',
  divergence: 'divergence',
} as const;

/** The two markets the ATR lesson compares, as the most a bar can wobble, in cents. */
export const MARKETS = { quiet: 20, wild: 80 } as const;
/** The stop a guess gives, in cents: the same in every market. */
export const GUESSED_STOP = 60;

/** Stage 5 (fundamental analysis): the scenarios each lesson pins. */
export const STAGE5_SEEDS = {
  news: 'news',
  release: 'rate-day',
  carry: 'carry',
  pullback: 'bank',
} as const;

/** Stage 6 (strategies): the markets and seasons each lesson pins. */
export const STAGE6_SEEDS = {
  trend: 'trend-rules',
  range: 'range-rules',
  breakouts: 'breakouts-27',
  styles: 'styles-1',
  news: 'news-season-4',
  investing: 'invest-1',
  builder: 'builder-7',
} as const;

/** How many breakouts the learner judges in the breakouts lesson. */
export const BREAKOUT_COUNT = 12;
