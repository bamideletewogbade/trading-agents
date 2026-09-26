/**
 * Stages 1–5 of the roadmap: the engines behind their lessons, and the
 * lessons themselves (every one complete, every quiz with a right answer,
 * every widget registered, every number computable).
 *
 *     pnpm check
 *
 * Seeds the lessons pin are checked here by name, so a change to an engine
 * that would quietly change what a lesson shows fails the gate instead.
 */

import { deepStrictEqual, equal, ok, throws } from 'node:assert/strict';
import {
  costsOfTrading,
  fillBuy,
  gappyPath,
  makeBook,
  marketBuy,
  marketSell,
  roundTripCost,
  spread,
} from '../lib/engines/market.ts';
import {
  aggregate,
  breakout,
  labelSwings,
  pullbackSeries,
  efficiencyBp,
  isTrending,
  swings,
  trendOf,
  walkCandles,
} from '../lib/engines/candles.ts';
import {
  breakEvenWinBp,
  equityCurve,
  expectancyR,
  maxDrawdownBp,
  outcomes,
  totalR,
  tradesToRecover,
} from '../lib/engines/trades.ts';
import {
  GUESSED_STOP,
  MARKETS,
  RANGE,
  SEEDS,
  STAGE4_SEEDS,
  STAGE5_SEEDS,
  TREND,
} from '../content/lessons/seeds.ts';
import { GHANA_2022, NIGERIA_2023 } from '../content/lessons/history.ts';
import {
  CARRY,
  EXPORTERS,
  NEWS,
  POLICY,
  basePrices,
  bondPrice,
  breakEvenLossBp,
  carryRun,
  currencyLossBp,
  dollarFlow,
  inDollars,
  loanPayment,
  localPrice,
  newsDay,
  newsPullback,
  playEntry,
  playRelease,
  policyEffects,
  realReturnBp,
  realValue,
  releaseDay,
  rollBills,
  shareValue,
  surpriseMoveBp,
} from '../lib/engines/macro.ts';
import {
  COCOA_CO,
  STOCKS,
  dividendYieldBp,
  hold,
  incomeStatement,
  peHundredths,
  survivableShrinkBp,
} from '../lib/engines/company.ts';
import * as reference from 'trading-signals';
import {
  atr,
  barsUntilTurnDown,
  bollinger,
  crossovers,
  ema,
  firstAbove,
  macd,
  rsi,
  sma,
} from '../lib/engines/indicators.ts';
import {
  FIB_LEVELS_BP,
  MADE_UP_LEVELS_BP,
  buyTheDip,
  channel,
  divergence,
  doubleTop,
  findPatterns,
  judgeLine,
  lineThrough,
  noiseStopOuts,
  patternChart,
  retracements,
  rsiAtHighs,
  strongRun,
  testLevels,
  testPatterns,
  topSeries,
} from '../lib/engines/ta.ts';
import { LESSON_DEFS, WIDGET_NAMES } from '../content/lessons/index.ts';
import { LESSONS, STAGES } from '../content/curriculum.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    failures.push(
      `✗ ${name}\n    ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
    );
  }
}

/* ── The market: order book, spread, orders, costs ───────────────────── */

check('a market buy walks up the book and the money balances', () => {
  for (let n = 0; n < 300; n += 1) {
    const book = makeBook(`b-${n}`);
    ok(spread(book) > 0);
    const depth = book.asks.reduce((sum, level) => sum + level.size, 0);
    for (const quantity of [1, 50, 200, depth + 10]) {
      const result = marketBuy(book, quantity);
      equal(result.filled, Math.min(quantity, depth));
      equal(
        result.value,
        result.fills.reduce((sum, fill) => sum + fill.price * fill.size, 0),
      );
      const left = result.book.asks.reduce((sum, level) => sum + level.size, 0);
      equal(left + result.filled, depth, 'no unit created or lost');
      for (let i = 1; i < result.fills.length; i += 1)
        ok(
          (result.fills[i]?.price ?? 0) > (result.fills[i - 1]?.price ?? 0),
          'fills climb the book',
        );
    }
  }
  throws(() => marketBuy(makeBook('x'), 0));
});

check('a market sell walks down the bids', () => {
  const book = makeBook(SEEDS.book);
  const result = marketSell(book, 60);
  ok((result.last ?? Infinity) <= (book.bids[0]?.price ?? 0));
  equal(result.book.asks, book.asks);
});

check('round trips pay the spread every time', () => {
  equal(roundTripCost(9_995, 10_005, 10, 1), 100);
  equal(roundTripCost(9_995, 10_005, 10, 10), 1_000);
  throws(() => roundTripCost(10_010, 10_000, 1, 1));
});

check(
  'the orders lesson path: the limit fills on the dip, the stop slips on the gap',
  () => {
    const path = gappyPath(SEEDS.orders);
    const start = path[0] as number;
    deepStrictEqual(fillBuy(path, { kind: 'market' }), {
      step: 0,
      price: start,
      slippage: 0,
    });
    const limit = fillBuy(path, { kind: 'limit', price: start - 30 });
    ok(
      limit.step !== null &&
        limit.step < 24 &&
        (limit.price ?? Infinity) <= start - 30,
    );
    const stop = fillBuy(path, { kind: 'stop', price: start + 60 });
    equal(stop.step, 24);
    ok(stop.slippage >= 100, `slippage ${stop.slippage}`);
    equal((stop.price ?? 0) - (start + 60), stop.slippage);
    equal(fillBuy(path, { kind: 'limit', price: start - 5_000 }).step, null);
  },
);

check('costs add up and come out of the deposit', () => {
  const costs = costsOfTrading({
    deposit: 10_000,
    trades: 40,
    spreadPerTrade: 60,
    nightsHeld: 20,
    overnightPerNight: 25,
    subscription: 3_000,
  });
  equal(costs.total, 40 * 60 + 20 * 25 + 3_000);
  equal(costs.left + costs.total, 10_000);
});

/* ── Candles ──────────────────────────────────────────────────────────── */

check('candles are well formed and seeded', () => {
  deepStrictEqual(walkCandles('a', TREND.up), walkCandles('a', TREND.up));
  for (let n = 0; n < 200; n += 1)
    for (const bar of walkCandles(`w-${n}`, RANGE)) {
      ok(
        bar.high >= Math.max(bar.open, bar.close) &&
          bar.low <= Math.min(bar.open, bar.close),
      );
      ok(Number.isSafeInteger(bar.volume) && bar.volume > 0);
    }
});

check('a longer timeframe keeps the extremes and the volume', () => {
  const bars = walkCandles('tf', TREND.up);
  for (const size of [2, 4, 8]) {
    const big = aggregate(bars, size);
    equal(big.length, Math.floor(bars.length / size));
    equal(big[0]?.open, bars[0]?.open);
    equal(
      Math.max(...big.map((bar) => bar.high)),
      Math.max(...bars.slice(0, big.length * size).map((bar) => bar.high)),
    );
    equal(
      big.reduce((s, b) => s + b.volume, 0),
      bars.slice(0, big.length * size).reduce((s, b) => s + b.volume, 0),
    );
  }
  throws(() => aggregate(bars, 0));
});

check('the trend lesson’s pinned charts read the way the lesson says', () => {
  equal(trendOf(swings(walkCandles(SEEDS.trendUp, TREND.up), 3)), 'up');
  equal(trendOf(swings(walkCandles(SEEDS.trendDown, TREND.down), 3)), 'down');
});

check('efficiency tells trends from ranges on almost every seed', () => {
  let right = 0;
  for (let n = 0; n < 300; n += 1) {
    if (isTrending(walkCandles(`t-${n}`, TREND.up))) right += 1;
    if (!isTrending(walkCandles(`r-${n}`, RANGE))) right += 1;
  }
  ok(right >= 590, `${right} of 600`);
  for (const seed of SEEDS.sort) {
    const bars = walkCandles(
      seed.seed,
      seed.kind === 'trend' ? (seed.up ? TREND.up : TREND.down) : RANGE,
    );
    equal(isTrending(bars), seed.kind === 'trend', seed.seed);
  }
  ok(efficiencyBp([]) === 0);
});

check('real breakouts come on volume and hold; fake ones don’t', () => {
  for (let n = 0; n < 200; n += 1) {
    const real = breakout(`k-${n}`, 'real');
    const fake = breakout(`k-${n}`, 'fake');
    const average = (b: typeof real) =>
      b.bars.slice(0, b.at).reduce((s, x) => s + x.volume, 0) / b.at;
    ok((real.bars[real.at]?.volume ?? 0) > 2.5 * average(real));
    ok((fake.bars[fake.at]?.volume ?? 0) < average(fake));
    ok((real.bars.at(-1)?.close ?? 0) > real.ceiling);
    ok((fake.bars.at(-1)?.close ?? Infinity) < fake.ceiling);
    for (const b of [real, fake])
      for (const bar of b.bars.slice(0, b.at))
        ok(bar.high < b.ceiling, 'the range holds until the break');
  }
});

check('the timeframes chart: falling at the end hourly, rising daily', () => {
  const hourly = pullbackSeries(SEEDS.timeframes);
  equal(hourly.length, 96);
  const lastHours = hourly.slice(-12);
  ok(
    (lastHours.at(-1)?.close ?? 0) < (lastHours[0]?.open ?? 0),
    'the last 12 hours fall',
  );
  const daily = aggregate(hourly, 24);
  equal(daily.length, 4);
  ok(
    (daily.at(-1)?.close ?? 0) > (daily[0]?.open ?? Infinity),
    'the days rise',
  );
});

check('swing labels compare each swing with the last of its kind', () => {
  const labels = labelSwings([
    { index: 1, kind: 'high', price: 10 },
    { index: 2, kind: 'low', price: 5 },
    { index: 3, kind: 'high', price: 12 },
    { index: 4, kind: 'low', price: 4 },
  ]).map((s) => s.label);
  deepStrictEqual(labels, ['H', 'L', 'HH', 'LL']);
});

/* ── Many trades ──────────────────────────────────────────────────────── */

check('expectancy and break-even win rates', () => {
  equal(expectancyR({ winBp: 4_000, winR: 250, lossR: 100 }), 40);
  equal(expectancyR({ winBp: 6_000, winR: 50, lossR: 100 }), -10);
  equal(breakEvenWinBp(250, 100), 2_857);
  equal(breakEvenWinBp(100, 100), 5_000);
  throws(() => expectancyR({ winBp: 12_000, winR: 1, lossR: 1 }));
});

check('outcomes are seeded and total up', () => {
  const strategy = { winBp: 4_000, winR: 250, lossR: 100 };
  const results = outcomes('o', 200, strategy);
  deepStrictEqual(results, outcomes('o', 200, strategy));
  const wins = results.filter((r) => r > 0).length;
  equal(totalR(results), wins * 250 - (200 - wins) * 100);
});

check('an equity curve never goes below zero and its drawdown is right', () => {
  for (let n = 0; n < 200; n += 1) {
    const curve = equityCurve(
      100_000,
      200,
      outcomes(`e-${n}`, 100, { winBp: 3_500, winR: 200, lossR: 100 }),
    );
    equal(curve.length, 101);
    ok(curve.every((value) => value >= 0));
    const dd = maxDrawdownBp(curve);
    ok(dd >= 0 && dd <= 10_000);
  }
  equal(maxDrawdownBp([100, 150, 75, 200]), 5_000);
});

check('climbing back: lose 50% and gain 10% a trade takes 8 trades', () => {
  equal(tradesToRecover(5_000, 1_000), 8);
  equal(tradesToRecover(2_000, 1_000), 3);
  equal(tradesToRecover(0, 1_000), 0);
  equal(tradesToRecover(10_000, 1_000), null);
});

/* ── Stage 4: indicators, against the reference library ───────────────── */

type Updater = { update(value: unknown): unknown; getResult(): unknown };
function referenceSeries(
  make: () => Updater,
  inputs: readonly unknown[],
): unknown[] {
  const indicator = make();
  return inputs.map((input) => {
    indicator.update(input);
    try {
      return indicator.getResult();
    } catch {
      return null;
    }
  });
}
function agrees(
  name: string,
  mine: readonly (number | null)[],
  theirs: readonly unknown[],
): void {
  let compared = 0;
  mine.forEach((value, i) => {
    const other = theirs[i];
    if (
      value == null ||
      other == null ||
      typeof other !== 'number' ||
      Number.isNaN(other)
    )
      return;
    compared += 1;
    ok(
      Math.abs(value - other) <= 1e-9 * Math.max(1, Math.abs(other)),
      `${name}[${i}]: ${value} vs ${other}`,
    );
  });
  ok(compared > 50, `${name}: only ${compared} values compared`);
}

check('SMA, EMA, RSI, MACD, Bollinger and ATR match trading-signals', () => {
  for (const seed of ['ref-a', 'ref-b', 'ref-c']) {
    const bars = walkCandles(seed, {
      count: 140,
      start: 10_000,
      drift: 3,
      wobble: 60,
    });
    const closes = bars.map((bar) => bar.close);
    const R = reference as unknown as Record<
      string,
      new (...args: unknown[]) => Updater
    >;
    agrees(
      'sma',
      sma(closes, 20),
      referenceSeries(() => new R.SMA!(20), closes),
    );
    agrees(
      'ema',
      ema(closes, 20),
      referenceSeries(() => new R.EMA!(20), closes),
    );
    agrees(
      'rsi',
      rsi(closes, 14),
      referenceSeries(() => new R.RSI!(14), closes),
    );
    const theirs = referenceSeries(
      () => new R.MACD!(new R.EMA!(12), new R.EMA!(26), new R.EMA!(9)),
      closes,
    ) as ({ macd: number; signal: number; histogram: number } | null)[];
    const mine = macd(closes);
    agrees(
      'macd',
      mine.macd,
      theirs.map((r) => r?.macd ?? null),
    );
    agrees(
      'macd signal',
      mine.signal,
      theirs.map((r) => r?.signal ?? null),
    );
    agrees(
      'macd histogram',
      mine.histogram,
      theirs.map((r) => r?.histogram ?? null),
    );
    const bands = referenceSeries(
      () => new R.BollingerBands!(20, 2),
      closes,
    ) as ({ upper: number; lower: number } | null)[];
    const b = bollinger(closes);
    agrees(
      'bollinger upper',
      b.upper,
      bands.map((r) => r?.upper ?? null),
    );
    agrees(
      'bollinger lower',
      b.lower,
      bands.map((r) => r?.lower ?? null),
    );
    agrees(
      'atr',
      atr(bars, 14),
      referenceSeries(() => new R.ATR!(14), bars),
    );
  }
});

check(
  'indicators wait until they have enough data, and refuse nonsense lengths',
  () => {
    const closes = walkCandles('warm', TREND.up).map((bar) => bar.close);
    equal(sma(closes, 10)[8], null);
    ok(sma(closes, 10)[9] != null);
    equal(rsi(closes, 14)[13], null);
    ok(rsi(closes, 14)[14] != null);
    throws(() => sma(closes, 0));
    throws(() => macd(closes, 26, 12));
    deepStrictEqual(crossovers([1, 1, 3, 3, 1], [2, 2, 2, 2, 2]), [
      { index: 2, direction: 'up' },
      { index: 4, direction: 'down' },
    ]);
  },
);

/* ── Stage 4: the built charts hold for every seed ───────────────────── */

check(
  'trendlines: every line through two channel lows holds; any line through the trap breaks',
  () => {
    const good = [
      ['A', 'B'],
      ['A', 'C'],
      ['A', 'D'],
      ['B', 'C'],
      ['B', 'D'],
      ['C', 'D'],
    ];
    const trap = [
      ['A', 'X'],
      ['B', 'X'],
      ['X', 'C'],
      ['X', 'D'],
    ];
    for (let n = 0; n < 500; n += 1) {
      const ch = channel(n === 0 ? STAGE4_SEEDS.channel : `ch-${n}`);
      const by = Object.fromEntries(ch.lows.map((low) => [low.key, low]));
      const report = (p: string, q: string) =>
        judgeLine(ch.bars, lineThrough(by[p]!, by[q]!), ch.tolerance, 0);
      for (const [p, q] of good) {
        const r = report(p!, q!);
        equal(r.breaks.length, 0, `ch-${n} ${p}${q} breaks`);
        equal(r.touches.length, 4, `ch-${n} ${p}${q} touches`);
      }
      for (const [p, q] of trap)
        ok(report(p!, q!).breaks.length > 0, `ch-${n} ${p}${q} should break`);
    }
  },
);

check(
  'the moving-average lesson: longer averages turn later, and EMA beats SMA',
  () => {
    const { bars, top } = topSeries(STAGE4_SEEDS.top);
    const closes = bars.map((bar) => bar.close);
    const lag = (length: number) =>
      barsUntilTurnDown(sma(closes, length), top) ?? 999;
    ok(
      lag(5) < lag(20) && lag(20) < lag(40),
      `${lag(5)} ${lag(20)} ${lag(40)}`,
    );
    for (const length of [10, 20, 40])
      ok(
        (barsUntilTurnDown(ema(closes, length), top) ?? 999) <= lag(length),
        `ema ${length}`,
      );
  },
);

check(
  'the MACD lesson: MACD crosses down after the top, sooner than the 20/30 average cross',
  () => {
    const { bars, top } = topSeries(STAGE4_SEEDS.top);
    const closes = bars.map((bar) => bar.close);
    const m = macd(closes);
    const after = (list: { index: number; direction: string }[]) =>
      list.find((c) => c.direction === 'down' && c.index >= top)?.index ?? null;
    const fast = after(crossovers(m.macd, m.signal));
    const slow = after(crossovers(sma(closes, 20), sma(closes, 30)));
    ok(fast !== null && slow !== null, 'both cross down after the top');
    ok(fast! < slow!, `MACD ${fast} vs averages ${slow}`);
  },
);

check(
  'the RSI lesson: it passes 70 early, stays high, and price keeps rising',
  () => {
    const bars = strongRun(STAGE4_SEEDS.run);
    const values = rsi(bars.map((bar) => bar.close));
    const cross = firstAbove(values, 70);
    ok(cross !== null && cross < 35, `crossed at ${cross}`);
    ok(
      (bars.at(-1)?.close ?? 0) > (bars[cross!]?.close ?? Infinity) + 500,
      'price went on well past the cross',
    );
    ok(
      values.filter((v) => v != null && v > 70).length >= 15,
      'stayed above 70 a long time',
    );
  },
);

check(
  'the ATR lesson: a guessed stop fits one market; an ATR stop fits both',
  () => {
    const guess = (wobble: number) =>
      noiseStopOuts(STAGE4_SEEDS.stops, () => GUESSED_STOP, wobble).rateBp;
    const byAtr = (wobble: number) =>
      noiseStopOuts(STAGE4_SEEDS.stops, (_, a) => Math.round(2 * a), wobble)
        .rateBp;
    ok(
      guess(MARKETS.wild) - guess(MARKETS.quiet) > 4_000,
      'the guess is hit far more in the wild market',
    );
    ok(
      Math.abs(byAtr(MARKETS.wild) - byAtr(MARKETS.quiet)) < 1_000,
      'the ATR stop behaves alike in both',
    );
    ok(
      noiseStopOuts('x', (_, a) => Math.round(0.5 * a)).rateBp >
        noiseStopOuts('x', (_, a) => Math.round(3 * a)).rateBp,
    );
  },
);

check(
  'the pattern lesson: on charts with no edge, patterns land near the baseline',
  () => {
    const rows = testPatterns(STAGE4_SEEDS.patterns);
    const base = rows.find((row) => row.kind === 'any bar')!;
    for (const row of rows) {
      ok(row.found > 50, `${row.kind} found only ${row.found}`);
      ok(
        Math.abs(row.rateBp - base.rateBp) < 800,
        `${row.kind} ${row.rateBp} vs ${base.rateBp}`,
      );
    }
    const bars = walkCandles('p', RANGE);
    for (const pattern of findPatterns(bars))
      ok(pattern.index >= 0 && pattern.index < bars.length);
    const shown = findPatterns(patternChart(STAGE4_SEEDS.patternChart));
    equal(
      new Set(shown.map((pattern) => pattern.kind)).size,
      3,
      'the lesson’s chart shows an engulfing, a hammer and a doji',
    );
  },
);

check(
  'double tops: the neckline breaks in one ending and holds in the other, on every seed',
  () => {
    for (let n = 0; n < 300; n += 1) {
      const seed = n === 0 ? STAGE4_SEEDS.doubleTop : `dt-${n}`;
      const down = doubleTop(seed, 'break');
      const up = doubleTop(seed, 'fail');
      deepStrictEqual(down.seen, up.seen, 'no look-ahead');
      ok((down.next.at(-1)?.close ?? Infinity) < down.neckline);
      ok((up.next.at(-1)?.close ?? 0) > up.peak);
      for (const i of down.peaks)
        ok(Math.abs((down.seen[i]?.high ?? 0) - down.peak) <= 6);
      const others = down.seen.filter((_, i) => !down.peaks.includes(i));
      ok(
        others.every((bar) => bar.high < down.peak - 6),
        'only the two tops reach the peak',
      );
      equal(down.target, down.neckline - (down.peak - down.neckline));
    }
  },
);

check(
  'Fibonacci levels and made-up levels react about equally often on random charts',
  () => {
    const fib = testLevels(STAGE4_SEEDS.fib, FIB_LEVELS_BP);
    const made = testLevels(STAGE4_SEEDS.fib, MADE_UP_LEVELS_BP);
    ok(fib.chances > 500 && made.chances > 500);
    ok(
      Math.abs(fib.rateBp - made.rateBp) < 600,
      `${fib.rateBp} vs ${made.rateBp}`,
    );
    deepStrictEqual(retracements(11_000, 10_000, [5_000]), [10_500]);
  },
);

check(
  'buying the dip: with the bigger trend it wins far more than against it',
  () => {
    const up = buyTheDip(STAGE4_SEEDS.timeframes, 'up');
    const down = buyTheDip(STAGE4_SEEDS.timeframes, 'down');
    ok(up.trades > 100 && down.trades > 100);
    ok(up.rateBp - down.rateBp > 3_000, `${up.rateBp} vs ${down.rateBp}`);
  },
);

check(
  'divergence: a higher high in price, a lower high in RSI, and the same chart for both endings',
  () => {
    for (let n = 0; n < 300; n += 1) {
      const seed = n === 0 ? STAGE4_SEEDS.divergence : `dv-${n}`;
      const a = divergence(seed, 'reversal');
      const b = divergence(seed, 'continuation');
      deepStrictEqual(a.seen, b.seen, 'no look-ahead');
      ok(
        (a.seen[a.highs[1]]?.high ?? 0) >
          (a.seen[a.highs[0]]?.high ?? Infinity),
        'price: higher high',
      );
      const [first, second] = rsiAtHighs(a);
      ok(second < first, `RSI: lower high (${first} → ${second})`);
      ok((a.next.at(-1)?.close ?? Infinity) < (a.seen.at(-1)?.close ?? 0));
      ok((b.next.at(-1)?.close ?? 0) > (b.seen.at(-1)?.close ?? Infinity));
    }
  },
);

/* ── Stage 5: fundamentals ────────────────────────────────────────────── */

check(
  'news: only the surprise moves the price, and the build-up never peeks',
  () => {
    for (const kind of ['rates', 'inflation', 'earnings'] as const) {
      const config = NEWS[kind];
      const none = newsDay(STAGE5_SEEDS.news, kind, config.expectedBp);
      equal(none.moveBp, 0, `${kind}: no surprise, no move`);
      equal(none.bars[none.at]!.close, none.bars[none.at - 1]!.close);
      for (const actual of [config.lowBp, config.highBp]) {
        const day = newsDay(STAGE5_SEEDS.news, kind, actual);
        deepStrictEqual(
          day.bars.slice(0, day.at),
          none.bars.slice(0, none.at),
          `${kind}: no look-ahead`,
        );
        equal(
          Math.sign(day.moveBp),
          Math.sign((actual - config.expectedBp) * config.movePerPointBp),
        );
      }
    }
    ok(
      surpriseMoveBp('earnings', 2_000) < 0,
      'profits up 20% when 30% was expected: the price falls',
    );
  },
);

check(
  'rates: bonds, shares and loans answer the policy rate the right way',
  () => {
    equal(
      bondPrice(100_000, 2_200, 5, 2_200),
      100_000,
      'a bond at its own coupon yield is worth its face',
    );
    ok(
      Math.abs(bondPrice(100_000, 1_000, 5, 1_200) - 92_790) <= 1,
      'the textbook 5-year 10% bond at 12%',
    );
    equal(loanPayment(1_200_000, 0, 12), 100_000);
    equal(shareValue(100, 2_600, 1_000), 625);
    throws(() => shareValue(100, 1_000, 1_000));
    let last = policyEffects(POLICY.lowBp);
    for (
      let rate = POLICY.lowBp + POLICY.stepBp;
      rate <= POLICY.highBp;
      rate += POLICY.stepBp
    ) {
      const now = policyEffects(rate);
      ok(now.deposit.interest > last.deposit.interest, `deposit at ${rate}`);
      ok(now.loan.monthly > last.loan.monthly, `loan at ${rate}`);
      ok(now.bond.price < last.bond.price, `bond at ${rate}`);
      ok(now.share.value <= last.share.value, `share at ${rate}`);
      ok(now.loan.total > POLICY.loan.amount);
      last = now;
    }
  },
);

check(
  'the published figures are the ones the sources give, and add up the way they reported',
  () => {
    for (const year of [GHANA_2022, NIGERIA_2023]) {
      equal(year.months.length, 13);
      equal(year.inflationBp.length, 13);
    }
    equal(GHANA_2022.inflationBp.at(-1), 5_410);
    equal(GHANA_2022.policyBp?.length, 13);
    equal(GHANA_2022.billBp?.length, 13);
    // NBS: December 2023 was 7.58 points above December 2022.
    equal(NIGERIA_2023.inflationBp.at(-1)! - NIGERIA_2023.inflationBp[0]!, 758);
    // Bank of Ghana: the cedi lost 30.0% against the dollar in 2022.
    equal(
      Math.round(currencyLossBp(GHANA_2022.fx.start, GHANA_2022.fx.end) / 10),
      300,
    );
    // FMDQ via Nairametrics: the naira lost 49% in 2023.
    equal(
      Math.round(
        currencyLossBp(NIGERIA_2023.fx.start, NIGERIA_2023.fx.end) / 100,
      ),
      49,
    );
    equal(realValue(100_000, 5_410), 64_893);
    equal(realReturnBp(0, 0), 0);
    ok(realReturnBp(2_000, 5_410) < 0);
    equal(localPrice(10_000, GHANA_2022.fx.start), 60_061);
    equal(inDollars(60_061, GHANA_2022.fx.start), 10_000);
  },
);

check(
  '2022 in Ghana: rolling T-bills grew the money and still lost to prices',
  () => {
    const bills = GHANA_2022.billBp!;
    const rolled = rollBills(100_000, [
      bills[0]!,
      bills[3]!,
      bills[6]!,
      bills[9]!,
    ]);
    ok(rolled > 100_000 + 20_000, `rolled to ${rolled}`);
    ok(
      realValue(rolled, GHANA_2022.inflationBp.at(-1)!) < 100_000,
      'but it bought less',
    );
    const dollars = inDollars(
      rollBills(localPrice(100_000, GHANA_2022.fx.start), [
        bills[0]!,
        bills[3]!,
        bills[6]!,
        bills[9]!,
      ]),
      GHANA_2022.fx.end,
    );
    ok(dollars < 100_000, `a dollar investor ended with ${dollars}`);
  },
);

check(
  'commodities: a cheaper barrel hurts the oil seller far more than the mixed one',
  () => {
    const base = basePrices();
    for (const exporter of Object.values(EXPORTERS))
      ok(dollarFlow(exporter, base).gapUsdM > 0, 'both balance at base prices');
    const cheap = { ...base, oil: 40 };
    const oil = dollarFlow(EXPORTERS.oil, cheap);
    const mixed = dollarFlow(EXPORTERS.mixed, cheap);
    ok(oil.gapBp < 0 && mixed.gapBp < 0);
    ok(oil.gapBp < mixed.gapBp * 3, `${oil.gapBp} vs ${mixed.gapBp}`);
    const cocoa = dollarFlow(EXPORTERS.mixed, { ...base, cocoa: 8_000 });
    ok(cocoa.gapUsdM > dollarFlow(EXPORTERS.mixed, base).gapUsdM);
    equal(
      dollarFlow(EXPORTERS.oil, { ...base, cocoa: 8_000 }).gapUsdM,
      dollarFlow(EXPORTERS.oil, base).gapUsdM,
    );
  },
);

check(
  'carry: it earns the gap, the money balances, and one devaluation takes it all',
  () => {
    equal(breakEvenLossBp(2_500, 500), 1_600);
    for (const seed of [STAGE5_SEEDS.carry, 'c-1', 'c-2', 'c-3']) {
      const calm = carryRun(seed, false);
      const hit = carryRun(seed);
      for (const m of hit)
        equal(
          m.profit,
          inDollars(m.local, m.fx) - m.owed,
          'profit is what closing would leave',
        );
      ok(calm.at(-1)!.profit > 0, `${seed}: without a devaluation it pays`);
      const before = hit[CARRY.devalueMonth - 1]!;
      ok(before.profit > 0, `${seed}: it was paying until then`);
      ok(
        hit[CARRY.devalueMonth]!.profit < 0,
        `${seed}: one month wipes it out`,
      );
      deepStrictEqual(
        hit.slice(0, CARRY.devalueMonth),
        calm.slice(0, CARRY.devalueMonth),
      );
    }
  },
);

check(
  'release day: holding through slips past the stop; waiting loses what it planned, at most',
  () => {
    for (let n = 0; n < 200; n += 1) {
      const seed = n === 0 ? STAGE5_SEEDS.release : `rd-${n}`;
      const up = releaseDay(seed, 'up');
      for (const ending of ['up', 'down', 'reverse'] as const) {
        const day = releaseDay(seed, ending);
        deepStrictEqual(
          day.bars.slice(0, day.at),
          up.bars.slice(0, up.at),
          'no look-ahead',
        );
        ok(
          day.spreads[day.at]! > day.spreads[day.at - 1]!,
          'the spread widens at the release',
        );
        for (const bar of day.bars)
          ok(
            bar.low <= Math.min(bar.open, bar.close) &&
              bar.high >= Math.max(bar.open, bar.close),
          );
        const holdIt = playRelease(day, 'hold');
        ok(
          holdIt.fill !== null && holdIt.pnl < holdIt.planned,
          `${seed} ${ending}: the gap fills below the stop`,
        );
        const wait = playRelease(day, 'wait');
        ok(
          wait.pnl >= wait.planned - wait.units * 3,
          `${seed} ${ending}: waiting loses no more than planned`,
        );
        if (ending === 'reverse')
          ok(wait.pnl < 0, `${seed}: waiting can still lose`);
        else ok(wait.pnl > 0, `${seed} ${ending}`);
      }
    }
  },
);

check(
  'news then pullback: the chart gives a better price for the same risk, not a certainty',
  () => {
    for (let n = 0; n < 300; n += 1) {
      const seed = n === 0 ? STAGE5_SEEDS.pullback : `nb-${n}`;
      const good = newsPullback(seed, 'holds');
      const bad = newsPullback(seed, 'fails');
      deepStrictEqual(good.seen, bad.seen, 'no look-ahead');
      const common = good.pullbackAt - good.seen.length + 1;
      deepStrictEqual(good.next.slice(0, common), bad.next.slice(0, common));
      ok(
        good.seen.slice(0, -1).every((bar) => bar.high <= good.support),
        'the range stays under the old top',
      );
      ok(
        good.next.slice(0, common).every((bar) => bar.low >= good.support),
        'the pullback holds the old top',
      );
      const r = (s: typeof good, plan: 'chase' | 'pullback' | 'fade') =>
        playEntry(s, plan).r;
      ok(
        r(good, 'pullback') > r(good, 'chase') && r(good, 'chase') > 0,
        `${seed}: holds`,
      );
      equal(r(good, 'fade'), -100);
      equal(r(bad, 'chase'), -100);
      equal(r(bad, 'pullback'), -100);
    }
  },
);

check(
  'the income statement adds up, and small changes at the top move the bottom a lot',
  () => {
    const base = incomeStatement(COCOA_CO);
    equal(base.revenue - base.costOfSales, base.grossProfit);
    equal(base.grossProfit - base.operatingCosts, base.operatingProfit);
    equal(base.operatingProfit - base.interest, base.profitBeforeTax);
    equal(base.profitBeforeTax - base.tax, base.netProfit);
    ok(base.netProfit > 0);
    const fewer = incomeStatement({ ...COCOA_CO, tonnes: 9_000 });
    ok(
      fewer.netProfit < base.netProfit * 0.8,
      'sell 10% less, lose far more than 10% of profit',
    );
    const both = incomeStatement({
      ...COCOA_CO,
      tonnes: 11_000,
      beansPerTonne: 3_960_000,
    });
    ok(
      both.revenue > base.revenue && both.netProfit < base.netProfit / 2,
      'revenue up, profit down',
    );
    const loss = incomeStatement({ ...COCOA_CO, tonnes: 5_000 });
    ok(loss.profitBeforeTax < 0 && loss.tax === 0, 'no tax on a loss');
  },
);

check(
  'valuation: the cheap share was cheap for a reason, and only because its earnings shrank',
  () => {
    equal(peHundredths(STOCKS.cheap), 400);
    equal(peHundredths(STOCKS.dear), 1_500);
    ok(dividendYieldBp(STOCKS.cheap) > dividendYieldBp(STOCKS.dear) * 5);
    for (const stock of Object.values(STOCKS)) {
      const h = hold(stock, 100_000);
      equal(
        h.endValue,
        h.cash + h.shares * h.endPrice + h.dividends,
        'the money balances',
      );
    }
    ok(hold(STOCKS.cheap, 100_000).returnBp < 0);
    ok(hold(STOCKS.dear, 100_000).returnBp > 0);
    ok(
      hold({ ...STOCKS.cheap, growthBp: 0 }, 100_000).returnBp >
        hold(STOCKS.dear, 100_000).returnBp / 3,
      'cheap and steady does well',
    );
    const floor = survivableShrinkBp(STOCKS.cheap, 100_000);
    ok(
      floor < 0 && floor > STOCKS.cheap.growthBp,
      `survives shrinking ${floor}`,
    );
    ok(hold({ ...STOCKS.cheap, growthBp: floor }, 100_000).returnBp >= 0);
    ok(hold({ ...STOCKS.cheap, growthBp: floor - 100 }, 100_000).returnBp < 0);
  },
);

/* ── The lessons themselves ───────────────────────────────────────────── */

const stageIds = STAGES.slice(0, 5).flatMap((stage) => [...stage.lessons]);

check(
  'every lesson in stages 1–5 has a definition, and nothing else does',
  () => {
    deepStrictEqual(Object.keys(LESSON_DEFS).sort(), [...stageIds].sort());
  },
);

check(
  'every lesson is live, plays at its own page, and builds its beats',
  () => {
    for (const id of stageIds) {
      const entry = LESSONS.find((lesson) => lesson.id === id);
      equal(entry?.status, 'live', id);
      equal(entry?.playAt, `/lesson/${id}`, id);
      const def = LESSON_DEFS[id];
      ok(def, id);
      const beats = def.beats();
      ok(
        beats.length >= 4 && beats.length <= 14,
        `${id}: ${beats.length} beats`,
      );
      ok(
        def.takeaways.length >= 2 && def.takeaways.length <= 4,
        `${id} takeaways`,
      );
    }
  },
);

check(
  'every lesson follows the loop: something to touch, a prediction, and a why',
  () => {
    for (const id of stageIds) {
      const beats = LESSON_DEFS[id]?.beats() ?? [];
      ok(
        beats.some((beat) => beat.kind === 'widget'),
        `${id} has nothing to touch`,
      );
      ok(
        beats.some((beat) => beat.kind === 'choice'),
        `${id} asks for no prediction`,
      );
      ok(
        beats.some((beat) => beat.tag === 'why'),
        `${id} never explains why`,
      );
    }
  },
);

check(
  'every question has exactly one right answer and feedback for each option',
  () => {
    for (const id of stageIds)
      for (const beat of LESSON_DEFS[id]?.beats() ?? []) {
        if (beat.kind !== 'choice') continue;
        equal(
          beat.options.filter((option) => option.correct).length,
          1,
          `${id}: ${beat.prompt}`,
        );
        ok(
          beat.options.length >= 2 && beat.options.length <= 4,
          `${id}: ${beat.prompt}`,
        );
        for (const option of beat.options)
          ok(option.feedback.length > 0, `${id}: ${option.label}`);
        equal(
          new Set(beat.options.map((option) => option.label)).size,
          beat.options.length,
          `${id}: duplicate option`,
        );
      }
  },
);

check('every widget a lesson names is a registered widget', () => {
  for (const id of stageIds)
    for (const beat of LESSON_DEFS[id]?.beats() ?? [])
      if (beat.kind === 'widget')
        ok(
          (WIDGET_NAMES as readonly string[]).includes(beat.widget),
          `${id}: ${beat.widget}`,
        );
});

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ stages 1–5: ${passed} checks passed.`);
