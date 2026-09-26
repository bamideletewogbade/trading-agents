/**
 * Stages 1–3 of the roadmap: the engines behind their lessons, and the
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
import { SEEDS, TREND, RANGE } from '../content/lessons/seeds.ts';
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

/* ── The lessons themselves ───────────────────────────────────────────── */

const stageIds = STAGES.slice(0, 3).flatMap((stage) => [...stage.lessons]);

check(
  'every lesson in stages 1–3 has a definition, and nothing else does',
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
console.log(`✓ stages 1–3: ${passed} checks passed.`);
