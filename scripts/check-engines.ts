/**
 * Assertions over the simulations: the maths, the determinism, and every
 * country's scenario.
 *
 *     pnpm check        (runs check-core.ts, then this)
 *
 * The balance check is the reason this file exists. Thousands of random
 * splits and seeds are played, and every one must account for every pesewa:
 * income plus borrowing equals everything paid plus everything left. A
 * simulation that loses a pesewa teaches the learner to distrust every
 * number on the screen.
 */

import { deepStrictEqual, equal, ok, throws } from 'node:assert/strict';
import { formatMoney, fromMinor, mulDiv } from '../lib/core/money.ts';
import { createRng } from '../lib/core/rng.ts';
import {
  BUCKETS,
  drawShock,
  init,
  playMonth,
  schemePromise,
  step,
  whatIfs,
  type PaydayConfig,
  type Split,
} from '../lib/engines/payday.ts';
import { payday } from '../lib/experiences/payday.ts';
import { EXPERIENCES, experience } from '../lib/experiences/registry.ts';
import { replay } from '../lib/experiences/types.ts';
import { PAYDAY, debrief, eventLine } from '../content/scenarios/payday.ts';
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

const GH = PAYDAY.GH.config;

/** The shock drawn for seed "pilot" in Ghana, recorded 25 Sep 2026: GH₵600 on day 16. */
const PINNED_PILOT_SHOCK = { cost: 60_000, day: 16 };
const cedis = (amount: number) => amount * 100;

/** The plan's own example month (§8): Kofi gets GH₵300, savings GH₵200. */
const EXAMPLE: Split = {
  rent: cedis(900),
  family: cedis(400),
  savings: cedis(200),
  scheme: cedis(300),
  spend: cedis(1200),
};

/** Every chip dropped into a random bucket, so the split always adds up. */
function randomSplit(config: PaydayConfig, seed: string): Split {
  const rng = createRng(`split:${seed}`);
  const counts = [0, 0, 0, 0, 0];
  for (let chip = 0; chip < config.income / config.chip; chip += 1) {
    const bucket = rng.int(0, 4);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }
  return Object.fromEntries(
    BUCKETS.map((bucket, index) => [
      bucket,
      (counts[index] ?? 0) * config.chip,
    ]),
  ) as Split;
}

/* ── Every scenario ────────────────────────────────────────────────────── */

check('every country’s scenario passes the experience’s own bounds', () => {
  for (const [country, scenario] of Object.entries(PAYDAY)) {
    payday.parseConfig(scenario.config);
    const { config } = scenario;
    ok(
      config.income % config.chip === 0,
      `${country}: income is not whole chips`,
    );
    for (const amount of [config.rent.amount, config.family.ask])
      ok(
        amount % config.chip === 0,
        `${country}: ${amount} is not whole chips, so it can't be matched exactly`,
      );
    // Tight but survivable: essentials and family leave something to decide.
    const committed =
      config.rent.amount + config.family.ask + config.living.total;
    ok(committed < config.income, `${country}: nothing is left to decide`);
    ok(
      config.income - committed >= config.chip * 3,
      `${country}: fewer than three chips left to decide`,
    );
    ok(
      config.shock.days.every((day) => day > config.rent.day),
      `${country}: the shock should come after rent`,
    );
  }
});

check('the registry lists payday, and every entry declares its truth', () => {
  equal(experience('payday'), payday);
  for (const entry of Object.values(EXPERIENCES))
    ok(entry.truth, `${entry.key} has no truth`);
  throws(() => experience('crypto_casino'));
});

/* ── Balance: every pesewa accounted for ───────────────────────────────── */

check('2,000 random months each account for every minor unit', () => {
  for (let i = 0; i < 2000; i += 1) {
    const scenario = Object.values(PAYDAY)[i % 3];
    ok(scenario);
    const config = scenario.config;
    const split = randomSplit(config, String(i));
    const { end } = playMonth(config, String(i), split);
    const paidOut =
      end.familySent +
      config.rent.amount +
      config.living.total +
      end.shockCost +
      end.schemeLocked;
    equal(
      config.income + end.borrowed,
      paidOut + end.spend + end.savings,
      `month ${i} does not balance`,
    );
    equal(
      end.debt,
      end.borrowed + end.fees,
      `month ${i}: debt is not principal plus fees`,
    );
    ok(
      end.spend >= 0 && end.savings >= 0 && end.debt >= 0,
      `month ${i}: a negative pot`,
    );
    equal(end.net, end.spend + end.savings - end.debt);
  }
});

/* ── Determinism ───────────────────────────────────────────────────────── */

check('the same seed plays the same month, on any machine', () => {
  deepStrictEqual(
    playMonth(GH, 'efua', EXAMPLE),
    playMonth(GH, 'efua', EXAMPLE),
  );
});

check(
  'the shock stays inside its range, on its steps, on one of its days',
  () => {
    for (let i = 0; i < 500; i += 1) {
      const { cost, day } = drawShock(GH, `s${i}`);
      ok(
        cost >= GH.shock.min &&
          cost <= GH.shock.max &&
          (cost - GH.shock.min) % GH.shock.step === 0,
        `cost ${cost}`,
      );
      ok(GH.shock.days.includes(day), `day ${day}`);
    }
  },
);

check(
  'the shock for seed "pilot" is pinned (a change here breaks every saved run)',
  () => {
    deepStrictEqual(drawShock(GH, 'pilot'), PINNED_PILOT_SHOCK);
  },
);

/* ── The worked example, by hand ───────────────────────────────────────── */

check('the plan’s example month, worked out by hand', () => {
  const { end, beats } = playMonth(GH, 'pilot', EXAMPLE);
  const c = end.shockCost;
  // After the day-14 draw: spending GH₵600, savings GH₵200. The shock and the
  // last two weeks need c + GH₵600 against GH₵800, so a loan app lends c − 200.
  equal(end.borrowed, c - cedis(200));
  equal(end.fees, mulDiv(end.borrowed, 1500, 10_000));
  equal(end.savings, 0);
  equal(end.spend, 0);
  equal(end.daysOfCover, 0);
  equal(end.schemeLocked, cedis(300));
  equal(end.schemePromised, cedis(600));
  equal(beats[0]?.event.kind, 'salary');
  equal(beats.at(-1)?.event.kind, 'scheme_due');
});

check('saving what went to the scheme leaves less debt', () => {
  const before = playMonth(GH, 'pilot', EXAMPLE).end;
  const option = whatIfs(GH, EXAMPLE).find(
    (whatIf) => whatIf.key === 'scheme_to_savings',
  );
  ok(option);
  equal(option.moved, cedis(300));
  const after = playMonth(GH, 'pilot', option.split).end;
  ok(after.debt < before.debt, `${after.debt} should be under ${before.debt}`);
  equal(after.borrowed, Math.max(0, before.shockCost - cedis(500)));
  equal(
    after.shockCost,
    before.shockCost,
    'a what-if must replay the same month',
  );
});

check('savings take the shock first', () => {
  // GH₵500 saved against a GH₵600 repair: savings pay 500, the last GH₵100 is borrowed.
  const careful = playMonth(GH, 'pilot', {
    rent: cedis(900),
    family: cedis(400),
    savings: cedis(500),
    scheme: 0,
    spend: cedis(1200),
  }).end;
  equal(careful.shockFromSavings, cedis(500));
  equal(careful.borrowed, cedis(100));
  // GH₵700 saved covers any repair in the GH₵500–700 range from savings alone.
  for (let i = 0; i < 100; i += 1) {
    const end = playMonth(GH, `c${i}`, {
      rent: cedis(900),
      family: cedis(400),
      savings: cedis(700),
      scheme: 0,
      spend: cedis(1000),
    }).end;
    equal(end.shockFromSavings, end.shockCost);
  }
});

check('what-ifs only offer changes that change something', () => {
  const keys = whatIfs(GH, {
    rent: cedis(900),
    family: cedis(400),
    savings: cedis(500),
    scheme: 0,
    spend: cedis(1200),
  }).map((w) => w.key);
  ok(!keys.includes('scheme_to_savings'));
  ok(!keys.includes('family_to_ask'));
  ok(!keys.includes('rent_to_exact'));
  ok(keys.includes('spend_to_savings'));
  for (const whatIf of whatIfs(GH, EXAMPLE))
    equal(
      Object.values(whatIf.split).reduce((a, b) => a + b, 0),
      GH.income,
    );
});

check('the scheme’s promise over two years: GH₵300 → GH₵5.03 billion', () => {
  const twoYears = schemePromise(cedis(300), GH, 730);
  equal(formatMoney(fromMinor(twoYears, 'GHS')), 'GH₵5,033,164,800');
  equal(
    formatMoney(fromMinor(twoYears, 'GHS'), { compact: true }),
    'GH₵5.03 billion',
  );
});

/* ── The state machine refuses what doesn't fit ────────────────────────── */

check('bad splits and out-of-order actions are refused', () => {
  const state = init(GH, 'x');
  throws(() => step(state, { type: 'play' }), /Split the money/);
  throws(
    () =>
      step(state, {
        type: 'allocate',
        split: { ...EXAMPLE, spend: cedis(1100) },
      }),
    /add up/,
  );
  throws(
    () =>
      step(state, {
        type: 'allocate',
        split: { ...EXAMPLE, spend: cedis(1150), savings: cedis(250) },
      }),
    /steps of/,
  );
  throws(() =>
    step(state, { type: 'allocate', split: { ...EXAMPLE, spend: -1 } }),
  );
  const played = step(step(state, { type: 'allocate', split: EXAMPLE }).state, {
    type: 'play',
  }).state;
  throws(
    () => step(played, { type: 'allocate', split: EXAMPLE }),
    /already been played/,
  );
  const registered = payday.step(
    payday.step(payday.init(GH, 'x'), { type: 'allocate', split: EXAMPLE })
      .state,
    { type: 'play' },
  ).state;
  // Through the registry the same refusal arrives as an ActionError.
  throws(
    () => payday.step(registered, { type: 'play' }),
    (error: Error) =>
      error.name === 'ActionError' && /already been played/.test(error.message),
  );
});

check('replaying a run gives the state that stepping gave', () => {
  const actions = [
    { type: 'allocate', split: EXAMPLE },
    { type: 'predict', days: 30 },
    { type: 'play' },
  ] as const;
  let state = payday.init(GH, 'replay');
  for (const action of actions) state = payday.step(state, action).state;
  const replayed = replay(payday, {
    experience: 'payday',
    version: 1,
    config: GH,
    seed: 'replay',
    actions,
  });
  deepStrictEqual(replayed.state, state);
  throws(
    () =>
      replay(payday, {
        experience: 'payday',
        version: 2,
        config: GH,
        seed: 'replay',
        actions,
      }),
    /version/,
  );
});

check(
  'bounds: an impossible scenario or action is refused before it runs',
  () => {
    throws(() => payday.parseConfig({ ...GH, income: GH.income + 1 }));
    throws(() => payday.parseConfig({ ...GH, currency: 'BTC' }));
    throws(() => payday.parseAction({ type: 'predict', days: -3 }));
    throws(() => payday.parseAction({ type: 'bet', amount: 5 }));
    deepStrictEqual(payday.parseAction({ type: 'play' }), { type: 'play' });
  },
);

/* ── Words describe engine numbers, and every event has a line ─────────── */

check(
  'every event and every debrief has words, with amounts from the engine',
  () => {
    for (const [country, scenario] of Object.entries(PAYDAY)) {
      for (let i = 0; i < 200; i += 1) {
        const split = randomSplit(scenario.config, `${country}${i}`);
        const { beats, end } = playMonth(
          scenario.config,
          `${country}${i}`,
          split,
        );
        for (const { event } of beats)
          ok(
            eventLine(event, scenario).length > 10,
            `${country} ${event.kind}`,
          );
        const line = debrief(end, scenario);
        ok(
          line.say.length > 20 && line.ask.endsWith('?'),
          `${country} debrief`,
        );
      }
    }
  },
);

check('facts carry the numbers the coach may speak', () => {
  let state = payday.init(GH, 'pilot');
  state = payday.step(state, { type: 'allocate', split: EXAMPLE }).state;
  state = payday.step(state, { type: 'predict', days: 90 }).state;
  state = payday.step(state, { type: 'play' }).state;
  const facts = payday.facts(state);
  deepStrictEqual(facts.numbers.prediction, { kind: 'days', value: 90 });
  deepStrictEqual(facts.numbers.daysOfCover, { kind: 'days', value: 0 });
  equal(facts.pivotal, true);
});

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
