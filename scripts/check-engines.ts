/**
 * Assertions over the engines behind the landing page and the IPO page: the
 * chart lesson, Risk Lab, the noise filter and the IPO calculator. The
 * lessons' own engines are checked in check-lessons.ts.
 *
 *     pnpm check        (runs check-core.ts, then this)
 *
 * Money checks come first in spirit: a simulation that loses a pesewa
 * teaches the learner to distrust every number on the screen.
 */

import { deepStrictEqual, equal, ok, throws } from 'node:assert/strict';
import { mulDiv } from '../lib/core/money.ts';
import {
  CHART,
  STOP_CHOICES,
  anatomy,
  chartScenario,
  playPlan,
  touches,
  type Ending,
} from '../lib/engines/chart.ts';
import {
  LEVERAGES,
  LEVERAGE_LAB,
  doubled,
  liquidationMoveBp,
  lossBand,
  marketPath,
  positionSize,
  recoveryBp,
  runLeverage,
  compound,
} from '../lib/engines/risk.ts';
import {
  afterListing,
  allotment,
  application,
  companyValue,
  offerStatus,
  peHundredths,
  trillionsHundredths,
} from '../lib/engines/ipo.ts';
import {
  NOISE_LAB,
  movingAverage,
  noisyPrices,
  turns,
} from '../lib/engines/noise.ts';
import { DANGOTE } from '../content/ipo.ts';

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

/* ── Chart reading (landing page lesson; curriculum c2, c5, r1) ─────────── */

const ENDINGS: Ending[] = ['bounce', 'break'];

check(
  'every chart has exactly three support and two resistance touches',
  () => {
    for (let n = 0; n < 1_000; n += 1) {
      for (const ending of ENDINGS) {
        const scenario = chartScenario(`c-${n}`, ending);
        deepStrictEqual(
          touches(scenario, scenario.support, 'support'),
          [9, 17, 29],
          `c-${n}`,
        );
        deepStrictEqual(
          touches(scenario, scenario.resistance, 'resistance'),
          [13, 22],
          `c-${n}`,
        );
      }
    }
  },
);

check('candles are well formed and stay inside the fixed view', () => {
  for (let n = 0; n < 1_000; n += 1) {
    for (const ending of ENDINGS) {
      const scenario = chartScenario(`c-${n}`, ending);
      for (const candle of [...scenario.seen, ...scenario.next]) {
        ok(
          Number.isSafeInteger(
            candle.open + candle.high + candle.low + candle.close,
          ),
        );
        ok(candle.high >= Math.max(candle.open, candle.close), `c-${n} high`);
        ok(candle.low <= Math.min(candle.open, candle.close), `c-${n} low`);
        ok(
          candle.low > CHART.view.low && candle.high < CHART.view.high,
          `c-${n} view`,
        );
      }
      const parts = anatomy(scenario.seen[5]!);
      equal(parts.body + parts.upperWick + parts.lowerWick, parts.range);
    }
  }
});

check('both endings share the chart the learner saw (no look-ahead)', () => {
  for (let n = 0; n < 200; n += 1) {
    deepStrictEqual(
      chartScenario(`c-${n}`, 'bounce').seen,
      chartScenario(`c-${n}`, 'break').seen,
    );
  }
});

check(
  'the lesson holds on every chart: the tight stop is shaken out, no stop is the worst break',
  () => {
    for (let n = 0; n < 1_000; n += 1) {
      const bounce = chartScenario(`c-${n}`, 'bounce');
      const broke = chartScenario(`c-${n}`, 'break');
      const b = Object.fromEntries(
        STOP_CHOICES.map((stop) => [stop, playPlan(bounce, stop)]),
      );
      const k = Object.fromEntries(
        STOP_CHOICES.map((stop) => [stop, playPlan(broke, stop)]),
      );
      equal(b.tight!.stoppedAt, 0, `c-${n}: bounce shakes out the tight stop`);
      equal(
        b.room!.stoppedAt,
        null,
        `c-${n}: bounce spares the stop with room`,
      );
      ok(b.room!.pnl > 0 && b.none!.pnl > 0, `c-${n}: the bounce pays`);
      ok(
        k.room!.stoppedAt !== null && k.tight!.stoppedAt !== null,
        `c-${n}: the break stops both`,
      );
      ok(
        k.none!.pnl < k.room!.pnl && k.room!.pnl < 0,
        `c-${n}: no stop loses most`,
      );
    }
  },
);

check('a plan’s money balances to the cent', () => {
  for (let n = 0; n < 500; n += 1) {
    for (const ending of ENDINGS) {
      const scenario = chartScenario(`c-${n}`, ending);
      for (const stop of STOP_CHOICES) {
        const result = playPlan(scenario, stop);
        equal(result.pnl, (result.exit - scenario.entry) * scenario.shares);
        if (result.stoppedAt !== null)
          equal(result.pnl, -(result.risked as number));
        ok(result.worst <= Math.min(0, result.pnl));
      }
    }
  }
});

/* ── Risk Lab: leverage (spec §19; curriculum m5) ──────────────────────── */

check(
  'the market path starts at 0 and ends exactly where the lesson says',
  () => {
    for (let n = 0; n < 1_000; n += 1) {
      const path = marketPath(LEVERAGE_LAB, `d-${n}`);
      equal(path.length, LEVERAGE_LAB.steps + 1);
      equal(path[0], 0);
      equal(path[path.length - 1], LEVERAGE_LAB.endMoveBp);
    }
  },
);

check(
  'liquidation lands where the maths says: 20× at −4.5%, 50× at −1.5%',
  () => {
    equal(liquidationMoveBp(LEVERAGE_LAB, 20), -450);
    equal(liquidationMoveBp(LEVERAGE_LAB, 25), -350);
    equal(liquidationMoveBp(LEVERAGE_LAB, 50), -150);
    throws(() => liquidationMoveBp(LEVERAGE_LAB, 3));
  },
);

check(
  'leverage runs balance: survivors keep capital + leverage × move, the closed-out keep nothing',
  () => {
    for (let n = 0; n < 500; n += 1) {
      for (const leverage of LEVERAGES) {
        const run = runLeverage(LEVERAGE_LAB, leverage, `d-${n}`);
        equal(run.final + -run.pnl, LEVERAGE_LAB.capital);
        if (run.liquidatedAt === null) {
          equal(
            run.final,
            LEVERAGE_LAB.capital +
              mulDiv(run.position, LEVERAGE_LAB.endMoveBp, 10_000),
          );
          ok(run.worstBp > run.liquidationBp);
        } else {
          equal(run.final, 0);
          ok((run.path[run.liquidatedAt] as number) <= run.liquidationBp);
          ok(run.equity.slice(run.liquidatedAt).every((value) => value === 0));
        }
      }
    }
  },
);

check(
  'the landing page’s day: 20× survives at −60%, 25× dies on the dip, not the ending',
  () => {
    const at20 = runLeverage(LEVERAGE_LAB, 20, 'day-4');
    const at25 = runLeverage(LEVERAGE_LAB, 25, 'day-4');
    equal(at20.liquidatedAt, null);
    equal(at20.pnl, -6_000);
    equal(lossBand(LEVERAGE_LAB, at20), 'lot');
    ok(at25.liquidatedAt !== null);
    ok(
      at25.liquidationBp < LEVERAGE_LAB.endMoveBp,
      'the ending alone would not have closed 25×',
    );
    equal(
      lossBand(LEVERAGE_LAB, runLeverage(LEVERAGE_LAB, 1, 'day-4')),
      'little',
    );
  },
);

check('recovery, doubling and position size', () => {
  equal(recoveryBp(5_000), 10_000);
  equal(recoveryBp(2_000), 2_500);
  throws(() => recoveryBp(10_000));
  equal(doubled(10_000, 12), 40_960_000);
  throws(() => doubled(1, 60));
  equal(positionSize(100_000, 100, 4_025, 3_910), 8);
  ok(positionSize(100_000, 100, 4_025, 3_910) * (4_025 - 3_910) <= 1_000);
  throws(() => positionSize(100_000, 100, 4_000, 4_000));
});

check('compounding, rounded each period', () => {
  equal(compound(20_000_000, 300, 1), 20_600_000);
  equal(compound(10_000, 10_000, 3), 80_000);
  // 1.3^12 × 20,000,000 = 465,961,702.4; rounding each month loses under a kobo a month.
  equal(compound(20_000_000, 3_000, 12), 465_961_701);
  equal(compound(5, 0, 12), 5);
});

/* ── IPO maths (curriculum f0, with the Dangote offer as the example) ─── */

const OFFER = DANGOTE.offer;

check(
  'an application buys whole lots, at least the minimum, and the change balances',
  () => {
    deepStrictEqual(application(OFFER, 525_000), {
      shares: 10,
      cost: 525_000,
      change: 0,
    });
    deepStrictEqual(application(OFFER, 524_999), {
      shares: 0,
      cost: 0,
      change: 524_999,
    });
    deepStrictEqual(application(OFFER, 1_000_000), {
      shares: 10,
      cost: 525_000,
      change: 475_000,
    });
    for (let budget = 0; budget < 50_000_000; budget += 123_457) {
      const result = application(OFFER, budget);
      equal(result.cost + result.change, budget);
      equal(result.shares % OFFER.lot, 0);
      ok(result.shares === 0 || result.shares >= OFFER.minimum);
      ok(result.change >= 0);
    }
  },
);

check(
  'an allotment never gives more than applied for, and refunds the rest to the kobo',
  () => {
    for (const applied of [10, 20, 100, 990, 12_340]) {
      for (let allotBp = 0; allotBp <= 10_000; allotBp += 250) {
        const result = allotment(OFFER, applied, allotBp);
        ok(result.allotted <= applied);
        equal(result.allotted % OFFER.lot, 0);
        equal(
          result.allotted * OFFER.price + result.refund,
          applied * OFFER.price,
        );
      }
    }
    throws(() => allotment(OFFER, 10, 10_001));
  },
);

check('a listing move changes the value by exactly the move', () => {
  deepStrictEqual(afterListing(OFFER, 100, 0), { value: 5_250_000, change: 0 });
  deepStrictEqual(afterListing(OFFER, 100, 1_000), {
    value: 5_775_000,
    change: 525_000,
  });
  deepStrictEqual(afterListing(OFFER, 100, -2_000), {
    value: 4_200_000,
    change: -1_050_000,
  });
});

check(
  'the company at the offer price lands on what NGX published, within rounding',
  () => {
    const value = companyValue(OFFER);
    const hundredths = trillionsHundredths(value);
    ok(
      Math.abs(hundredths - DANGOTE.publishedValueHundredths) <= 5,
      `${hundredths}`,
    );
    const pe = peHundredths(value, DANGOTE.halfYearProfit * 2);
    ok(pe > 1_200 && pe < 1_350, `P/E ${pe}`);
    throws(() => peHundredths(value, 0));
  },
);

check('the offer knows whether it is upcoming, open or closed', () => {
  equal(offerStatus(OFFER, '2026-09-13'), 'upcoming');
  equal(offerStatus(OFFER, '2026-09-14'), 'open');
  equal(offerStatus(OFFER, '2026-10-13'), 'open');
  equal(offerStatus(OFFER, '2026-10-14'), 'closed');
});

/* ── Noise and signal (curriculum m0) ──────────────────────────────────── */

check('noisy prices are seeded and the average is the plain average', () => {
  deepStrictEqual(noisyPrices(NOISE_LAB, 'a'), noisyPrices(NOISE_LAB, 'a'));
  const prices = noisyPrices(NOISE_LAB, 'a');
  equal(prices.length, NOISE_LAB.steps);
  const average = movingAverage(prices, 10);
  equal(average[8], null);
  const window = prices.slice(11, 21);
  equal(average[20], Math.floor(window.reduce((a, b) => a + b, 0) / 10));
  throws(() => movingAverage(prices, 0));
});

check(
  'a longer average changes its mind less than the price does, on every seed',
  () => {
    for (let n = 0; n < 300; n += 1) {
      const prices = noisyPrices(NOISE_LAB, `n-${n}`);
      ok(turns(movingAverage(prices, 20)) < turns(prices), `n-${n}`);
    }
    equal(turns([1, 2, 3, 2, 1, 2]), 2);
    equal(turns([null, 1, 1, 1]), 0);
  },
);

/* ── Report ────────────────────────────────────────────────────────────── */

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ engines: ${passed} checks passed.`);
