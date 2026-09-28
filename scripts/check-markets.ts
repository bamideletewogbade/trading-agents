/**
 * Signals, market data, the journal and the tools
 * (docs/member-app-plan.md): the rules can't see the future, levels sit on
 * the right side, records add up, buys and sells mirror each other, the
 * data adapters read real answers exactly, and the journal and calculators
 * do the arithmetic the risk lessons teach.
 *
 *     pnpm check
 */

import { deepStrictEqual, equal, ok, throws } from 'node:assert/strict';
import type { Bar } from '../lib/engines/candles.ts';
import { market, type Segment } from '../lib/engines/strategy.ts';
import {
  SIGNAL_RULES,
  SignalError,
  WARMUP,
  checkScore,
  checklistOf,
  readMarket,
  recordOf,
  type Played,
  type Reading,
} from '../lib/engines/signals.ts';
import {
  atSamePlaces,
  journalStats,
  parsePrice,
  plannedR,
  problemOf,
  tradeR,
  withExit,
  type JournalTrade,
} from '../lib/engines/journal.ts';
import {
  climbBack,
  edge,
  forexLots,
  formatQuantity,
  promise,
  riskReward,
  sizePosition,
} from '../lib/engines/tools.ts';
import { MARKETS, formatPrice, marketById } from '../lib/markets/catalog.ts';
import {
  cleanChoice,
  marketsFor,
  unreadInterests,
} from '../lib/markets/interests.ts';
import { parseKraken, toUnits } from '../lib/markets/kraken.ts';
import { parseTwelveData } from '../lib/markets/twelvedata.ts';
import { byUrgency, detailOf, summaryOf } from '../lib/markets/view.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push(`✗ ${name}\n  ${(error as Error).message}`);
  }
}

/* ── Test markets ─────────────────────────────────────────────────────── */

const PLAN: Segment[] = [
  { kind: 'range', bars: 120 },
  { kind: 'up', bars: 150 },
  { kind: 'range', bars: 80 },
  { kind: 'down', bars: 150 },
  { kind: 'range', bars: 100 },
  { kind: 'up', bars: 120 },
  { kind: 'down', bars: 80 },
];

/** A made-up market where big bars are busy bars, as in real ones. */
function testBars(seed: string): Bar[] {
  return market(seed, PLAN, 20_000).bars.map((bar) => ({
    ...bar,
    volume: 100 + Math.abs(bar.close - bar.open) * 3,
  }));
}

const OPTIONS = { costBp: 10, barsPerDay: 1, barsPerWeek: 7 };
const SEEDS = ['a', 'b', 'c', 'd', 'e', 'f'];
const READS = SEEDS.map((seed) => {
  const bars = testBars(seed);
  return { seed, bars, reading: readMarket(bars, OPTIONS) };
});

/** What identifies a signal: when, which way, and its levels. */
function key(p: Pick<Played, 'at' | 'side' | 'setup' | 'stop' | 'target'>) {
  return `${p.at}:${p.side}:${p.setup}:${p.stop}:${p.target}`;
}

check('the test markets give both setups, both ways', () => {
  const kinds = new Set(
    READS.flatMap(({ reading }) =>
      reading.history.map((p) => `${p.setup}:${p.side}`),
    ),
  );
  for (const kind of [
    'pullback:buy',
    'pullback:sell',
    'breakout:buy',
    'breakout:sell',
  ])
    ok(kinds.has(kind), `no ${kind} signal in any test market`);
  ok(
    READS.every(({ reading }) => reading.history.length >= 5),
    'a test market with almost no signals proves little',
  );
});

check(
  'the checklist follows the warnings and the record, never guesses',
  () => {
    for (const { reading } of READS)
      for (const played of reading.history) {
        const checks = checklistOf(played, reading.record);
        const state = (key: string) => checks.find((c) => c.key === key)?.state;
        const flagged = (kind: string) =>
          played.against.some((f) => f.kind === kind);
        equal(state('not-stretched') === 'fail', flagged('stretched'));
        equal(state('not-chasing') === 'fail', flagged('extended'));
        equal(state('calm') === 'fail', flagged('volatile'));
        equal(state('big-trend') === 'fail', flagged('big-trend'));
        const { passed, known } = checkScore(checks);
        ok(passed <= known && known <= checks.length);
      }
    const quiet = { against: [] };
    const state = (record: { signals: number; avgR: number }, key: string) =>
      checklistOf(quiet, record).find((c) => c.key === key)?.state;
    equal(
      state({ signals: 3, avgR: 90 }, 'record'),
      'unknown',
      'too few to judge',
    );
    equal(state({ signals: 12, avgR: 20 }, 'record'), 'pass');
    equal(state({ signals: 12, avgR: -20 }, 'record'), 'fail');
    equal(state({ signals: 0, avgR: 0 }, 'record'), 'unknown');
    equal(
      state({ signals: 29, avgR: 20 }, 'sample'),
      'unknown',
      'never a fail, never a pass',
    );
    equal(state({ signals: 30, avgR: 20 }, 'sample'), 'pass');
    deepStrictEqual(checkScore(checklistOf(quiet, { signals: 0, avgR: 0 })), {
      passed: 4,
      known: 4,
    });
  },
);

check('interests map to markets we read, and nothing else', () => {
  deepStrictEqual(marketsFor([]), []);
  deepStrictEqual(marketsFor(['local', 'us']), [], 'no feed, no stand-in');
  deepStrictEqual(unreadInterests(['crypto', 'local', 'us']), ['local', 'us']);
  deepStrictEqual(
    marketsFor(['commodities', 'crypto']),
    MARKETS.filter((m) => m.class === 'crypto' || m.class === 'metal').map(
      (m) => m.id,
    ),
    'catalog order, whatever order they were said in',
  );
  ok(marketsFor(['forex']).every((id) => marketById(id)?.class === 'fx'));
  deepStrictEqual(cleanChoice(['gold', 'btc', 'nope', 7, 'btc']), [
    'btc',
    'gold',
  ]);
});

check('reading is deterministic', () => {
  const { bars, reading } = READS[0]!;
  deepStrictEqual(readMarket(bars, OPTIONS), reading);
});

check('no signal changes when later bars arrive (no look-ahead)', () => {
  for (const { seed, bars, reading } of READS) {
    for (let cut = WARMUP + 40; cut < bars.length; cut += 37) {
      const early = readMarket(bars.slice(0, cut), OPTIONS);
      const closed = early.history.filter((p) => p.outcome !== 'open');
      deepStrictEqual(
        closed,
        reading.history.slice(0, closed.length),
        `${seed}: the record up to bar ${cut} differs from the full run's`,
      );
      const open = early.history.find((p) => p.outcome === 'open');
      if (open) {
        const later = reading.history[closed.length];
        ok(later, `${seed}: an open signal at ${cut} vanished later`);
        equal(key(later!), key(open), `${seed}: an open signal changed`);
        equal(later!.entry, open.entry);
      }
      if (early.now.state === 'new') {
        const later = reading.history.find((p) => p.at === cut - 1);
        // A fresh call can only disappear if the next open gaps past a level.
        if (later) equal(key(later), key(early.now.signal));
      }
    }
  }
});

check('stops and targets sit on the right side, 1 to 3 ATRs, target 2R', () => {
  for (const { reading } of READS)
    for (const p of reading.history) {
      if (p.side === 'buy') ok(p.stop < p.reference && p.reference < p.target);
      else ok(p.stop > p.reference && p.reference > p.target);
      ok(
        p.stopAtrTenths >= SIGNAL_RULES.minStopAtrTenths - 1 &&
          p.stopAtrTenths <= SIGNAL_RULES.maxStopAtrTenths + 1,
        `stop ${p.stopAtrTenths} tenths of an ATR`,
      );
      equal(Math.abs(p.target - p.reference), 2 * p.risk);
      equal(Math.abs(p.stop - p.reference), p.risk);
    }
});

check('fills come after the decision and exits after the fill', () => {
  for (const { reading } of READS)
    for (const p of reading.history) {
      equal(p.entryAt, p.at + 1);
      if (p.exitAt !== null) ok(p.exitAt >= p.entryAt);
      if (p.outcome === 'target') ok(p.r > 0, `a target hit made ${p.r}`);
      if (p.outcome === 'stop') ok(p.r < 0, `a stop made ${p.r}`);
      if (p.outcome === 'expired')
        equal(p.exitAt! - p.entryAt + 1, SIGNAL_RULES.maxBars);
    }
});

check('one signal at a time, and only an open one at the very end', () => {
  for (const { reading } of READS) {
    reading.history.forEach((p, i) => {
      const next = reading.history[i + 1];
      if (next) ok(next.at >= (p.exitAt as number), 'signals overlap');
      if (p.outcome === 'open') equal(i, reading.history.length - 1);
    });
  }
});

check('the record adds up, losses included', () => {
  for (const { reading } of READS) {
    const closed = reading.history.filter((p) => p.outcome !== 'open');
    const { record } = reading;
    equal(record.signals, closed.length);
    equal(record.wins, closed.filter((p) => p.r > 0).length);
    equal(
      record.totalR,
      closed.reduce((sum, p) => sum + p.r, 0),
    );
    equal(record.curve.at(-1), record.totalR);
    equal(record.curve.length, closed.length + 1);
    if (closed.length) equal(record.worst, Math.min(...closed.map((p) => p.r)));
  }
  const empty = recordOf([]);
  equal(empty.signals, 0);
  equal(empty.avgR, 0);
});

check(
  'a market turned upside down gives the same signals the other way',
  () => {
    for (const { seed, bars, reading } of READS.slice(0, 3)) {
      const top = Math.max(...bars.map((b) => b.high)) + 10_000;
      const flipped = bars.map((b) => ({
        open: top - b.open,
        high: top - b.low,
        low: top - b.high,
        close: top - b.close,
        volume: b.volume,
      }));
      const mirror = readMarket(flipped, OPTIONS);
      deepStrictEqual(
        mirror.history.map(
          (p) => `${p.at}:${p.setup}:${p.side === 'buy' ? 'sell' : 'buy'}`,
        ),
        reading.history.map((p) => `${p.at}:${p.setup}:${p.side}`),
        `${seed}: buys and sells don't mirror`,
      );
    }
  },
);

check('reasons against are true of the bar they describe', () => {
  for (const { reading } of READS)
    for (const p of reading.history) {
      for (const fact of p.against) {
        if (fact.kind === 'stretched')
          ok(p.side === 'buy' ? fact.rsi >= 70 : fact.rsi <= 30);
        if (fact.kind === 'extended')
          ok(fact.atrTenths >= SIGNAL_RULES.extendedAtrTenths);
        if (fact.kind === 'volatile')
          ok(fact.tenths >= SIGNAL_RULES.volatileTenths);
        if (fact.kind === 'big-trend') equal(fact.agrees, false);
      }
      for (const fact of p.for)
        if (fact.kind === 'big-trend') equal(fact.agrees, true);
      if (p.setup === 'breakout')
        ok(
          p.for.some(
            (f) => f.kind === 'volume' && f.tenths >= SIGNAL_RULES.volumeTenths,
          ),
        );
      if (p.setup === 'pullback') ok(p.for.some((f) => f.kind === 'pullback'));
    }
});

check('a market without volume never breaks out', () => {
  const bars = testBars('a').map((b) => ({ ...b, volume: 0 }));
  const reading = readMarket(bars, OPTIONS);
  ok(reading.history.every((p) => p.setup === 'pullback'));
});

check('too few or broken bars are refused', () => {
  const bars = testBars('a');
  throws(() => readMarket(bars.slice(0, WARMUP), OPTIONS), SignalError);
  const broken = bars.map((b, i) =>
    i === 300 ? { ...b, high: b.low - 1 } : b,
  );
  throws(() => readMarket(broken, OPTIONS), SignalError);
  const fractional = bars.map((b, i) =>
    i === 5 ? { ...b, close: b.close + 0.5 } : b,
  );
  throws(() => readMarket(fractional, OPTIONS), SignalError);
});

check('with no signal the rules say what they are watching', () => {
  let saw = 0;
  for (const { bars } of READS)
    for (let cut = WARMUP + 10; cut < bars.length; cut += 23) {
      const r: Reading = readMarket(bars.slice(0, cut), OPTIONS);
      if (r.now.state !== 'wait') continue;
      saw += 1;
      const watch = r.now.watch;
      if (watch.kind === 'range') ok(watch.high > watch.low);
      else {
        ok(r.trend !== 'none');
        equal(watch.side, r.trend === 'up' ? 'buy' : 'sell');
      }
    }
  ok(saw > 10);
});

/* ── Market data ──────────────────────────────────────────────────────── */

check('prices become integers without a float in between', () => {
  equal(toUnits('73413.5', 1), 734135);
  equal(toUnits('1.13864', 5), 113864);
  equal(toUnits('0.5', 5), 50000);
  equal(toUnits('1.234565', 5), 123457);
  equal(toUnits('4259', 2), 425900);
  equal(toUnits('0.1', 3), 100);
  throws(() => toUnits('-1', 2));
  throws(() => toUnits('1e5', 2));
  equal(formatPrice(734135, 1), '73,413.5');
  equal(formatPrice(113864, 5), '1.13864');
  equal(formatPrice(5, 2), '0.05');
  equal(formatPrice(425900, 2), '4,259.00');
});

// Recorded from api.kraken.com, 26 Sep 2026 (trimmed to three bars).
const KRAKEN = {
  error: [],
  result: {
    XXBTZUSD: [
      [
        1790208000,
        '84156.3',
        '84325.0',
        '83777.1',
        '84025.4',
        '84001.2',
        '1352.12345678',
        51234,
      ],
      [
        1790294400,
        '84025.4',
        '85101.0',
        '83994.9',
        '84979.1',
        '84500.0',
        '997.5',
        40211,
      ],
      [
        1790380800,
        '84979.1',
        '85000.0',
        '84000.0',
        '84100.0',
        '84400.0',
        '12.25',
        1200,
      ],
    ],
    last: 1790294400,
  },
};

check('Kraken: exact prices, oldest first, the forming bar dropped', () => {
  const bars = parseKraken(KRAKEN, 1);
  equal(bars.length, 2);
  deepStrictEqual(bars[0], {
    time: 1790208000,
    open: 841563,
    high: 843250,
    low: 837771,
    close: 840254,
    volume: 1352123,
  });
  throws(() => parseKraken({ error: ['EQuery:Unknown asset pair'] }, 1));
  throws(() => parseKraken({ error: [], result: {} }, 1));
  throws(() => parseKraken('nope', 1));
});

// Recorded from api.twelvedata.com (demo key), 26 Sep 2026, trimmed.
const TWELVE = {
  meta: { symbol: 'EUR/USD', interval: '1day' },
  values: [
    {
      datetime: '2026-09-26',
      open: '1.13900',
      high: '1.14000',
      low: '1.13800',
      close: '1.13912',
    },
    {
      datetime: '2026-09-25',
      open: '1.13864',
      high: '1.13950',
      low: '1.13700',
      close: '1.13900',
    },
    {
      datetime: '2026-09-24',
      open: '1.13500',
      high: '1.13870',
      low: '1.13400',
      close: '1.13864',
    },
  ],
  status: 'ok',
};

check(
  "Twelve Data: oldest first, today's unfinished bar dropped, no volume",
  () => {
    const now = Date.parse('2026-09-26T15:00:00Z') / 1000;
    const bars = parseTwelveData(TWELVE, 5, now);
    equal(bars.length, 2);
    equal(bars[0]!.close, 113864);
    equal(bars[1]!.open, 113864);
    equal(bars[1]!.volume, 0);
    ok(bars[0]!.time < bars[1]!.time);
    throws(() => parseTwelveData({ code: 401, message: 'demo key' }, 5, now));
  },
);

check('every market is well formed and has a unique id', () => {
  equal(new Set(MARKETS.map((m) => m.id)).size, MARKETS.length);
  for (const m of MARKETS) {
    ok(/^[a-z]+$/.test(m.id));
    ok(m.decimals >= 0 && m.decimals <= 8);
    ok(m.costBp > 0 && m.costBp < 100);
    ok(m.weekBars === 5 || m.weekBars === 7);
    equal(marketById(m.id), m);
  }
});

check('the API view dates every signal and keeps the chart short', () => {
  const { bars } = READS[0]!;
  const timed = bars.map((b, i) => ({
    ...b,
    time: 1_700_000_000 + i * 86_400,
  }));
  const reading = readMarket(timed, OPTIONS);
  const btc = marketById('btc')!;
  const detail = detailOf(btc, timed, reading, WARMUP);
  equal(detail.chart.bars.length, 120);
  equal(detail.chart.fast.length, 120);
  // Dates are closes: a daily bar stamped at its open closes a day later.
  equal(detail.asOf, timed.at(-1)!.time + 86_400);
  equal(detail.from, timed[WARMUP]!.time + 86_400);
  for (const p of detail.history) {
    equal(p.atTime, timed[p.at]!.time + 86_400);
    if (p.exitAt !== null) equal(p.exitTime, timed[p.exitAt]!.time + 86_400);
  }
  const summaries = READS.map(({ bars: b, reading: r }) =>
    summaryOf(
      btc,
      b.map((x, i) => ({ ...x, time: i })),
      r,
    ),
  ).sort(byUrgency);
  const order = { new: 0, open: 1, wait: 2 } as const;
  for (let i = 1; i < summaries.length; i += 1)
    ok(order[summaries[i - 1]!.now.state] <= order[summaries[i]!.now.state]);
});

/* ── The journal ──────────────────────────────────────────────────────── */

check('typed prices parse exactly and line up', () => {
  deepStrictEqual(parsePrice('84,025.5'), { units: 840255, decimals: 1 });
  deepStrictEqual(parsePrice('1.08543'), { units: 108543, decimals: 5 });
  deepStrictEqual(parsePrice('3'), { units: 3, decimals: 0 });
  equal(parsePrice('0'), null);
  equal(parsePrice('-1'), null);
  equal(parsePrice('1.123456789'), null);
  equal(parsePrice('abc'), null);
  deepStrictEqual(atSamePlaces(['1.1', '1.085', '']), {
    decimals: 3,
    units: [1100, 1085, null],
  });
  equal(atSamePlaces(['1.1', 'x']), null);
});

let n = 0;
function trade(over: Partial<JournalTrade>): JournalTrade {
  n += 1;
  return {
    id: `t${n}`,
    market: 'EUR/USD',
    side: 'buy',
    decimals: 0,
    entry: 1000,
    stop: 900,
    target: 1200,
    exit: null,
    setup: 'pullback',
    feeling: 'calm',
    source: 'own',
    openedAt: n * 1000,
    closedAt: null,
    note: '',
    ...over,
  };
}

check('a trade in R, both ways', () => {
  equal(tradeR(trade({ exit: 1200 })), 200);
  equal(tradeR(trade({ exit: 900 })), -100);
  equal(tradeR(trade({ exit: null })), null);
  equal(plannedR(trade({})), 200);
  const short = trade({
    side: 'sell',
    entry: 1000,
    stop: 1050,
    target: 900,
    exit: 925,
  });
  equal(tradeR(short), 150);
  equal(problemOf(short), null);
  equal(problemOf(trade({ stop: 1100 })), 'stop-side');
  equal(problemOf(trade({ target: 950 })), 'target-side');
  equal(problemOf(trade({ stop: 1000 })), 'same-price');
});

check('journal stats: win rate beside average R, the curve, the leak', () => {
  const trades = [
    trade({ exit: 1200, closedAt: 1 }),
    trade({ exit: 900, closedAt: 2, feeling: 'fomo', setup: 'breakout' }),
    trade({ exit: 880, closedAt: 3, feeling: 'fomo', setup: 'breakout' }),
    trade({ exit: 1100, closedAt: 4 }),
    trade({ exit: 850, closedAt: 5, feeling: 'fomo', setup: 'breakout' }),
    trade({}),
  ];
  const s = journalStats(trades);
  equal(s.trades, 6);
  equal(s.open, 1);
  equal(s.closed, 5);
  equal(s.wins, 2);
  equal(s.winRateBp, 4000);
  equal(s.totalR, 200 - 100 - 120 + 100 - 150);
  deepStrictEqual(s.curve, [0, 200, 100, -20, 80, -70]);
  equal(s.drawdownR, 270);
  equal(s.worstRun, 2);
  equal(s.losses, 3);
  equal(s.stopsKept, 1, 'losses past 1.1R are stops not kept');
  ok(s.leak);
  equal(s.leak!.trades, 3);
  equal(s.leak!.avgR, -123);
  equal(journalStats([]).avgR, 0);
});

check('closing a trade at a finer price lifts every price exactly', () => {
  const open = trade({ decimals: 1, entry: 11, stop: 10, target: 13 });
  const closed = withExit(open, '1.1045', 99)!;
  equal(closed.decimals, 4);
  equal(closed.entry, 11_000);
  equal(closed.stop, 10_000);
  equal(closed.exit, 11_045);
  equal(closed.closedAt, 99);
  equal(tradeR(closed), 5);
  equal(withExit(open, 'soon', 1), null);
});

/* ── The tools ────────────────────────────────────────────────────────── */

check('position size risks what it says, never more', () => {
  // $10,000, 1%, BTC at 84,000.0 with a stop at 80,000.0: $100 / $4,000 = 0.025 BTC.
  const s = sizePosition({
    accountMinor: 1_000_000,
    riskBp: 100,
    entry: 840_000,
    stop: 800_000,
    decimals: 1,
  });
  equal(s.riskMinor, 10_000);
  equal(formatQuantity(s.quantity), '0.025');
  equal(s.valueMinor, 210_000);
  equal(s.exposureTenths, 2);
  // Rounded down: the loss at the stop never exceeds the risk.
  const odd = sizePosition({
    accountMinor: 123_457,
    riskBp: 150,
    entry: 113_864,
    stop: 113_111,
    decimals: 5,
  });
  const lossMinor = (odd.quantity * (113_864 - 113_111) * 100) / (1e8 * 1e5);
  ok(lossMinor <= odd.riskMinor);
  throws(() =>
    sizePosition({
      accountMinor: 0,
      riskBp: 100,
      entry: 2,
      stop: 1,
      decimals: 0,
    }),
  );
});

check('forex lots at $10 a pip', () => {
  // $5,000 at 1% = $50; 25 pips × $10 = $250 a lot → 0.2 lots.
  const lots = forexLots({
    accountMinor: 500_000,
    riskBp: 100,
    stopPipTenths: 250,
  });
  equal(lots.riskMinor, 5_000);
  equal(lots.lotsHundredths, 20);
  equal(lots.pipValueMinor, 200);
});

check('risk and reward, the climb back, promises and edge', () => {
  deepStrictEqual(riskReward({ entry: 100, stop: 90, target: 130 }), {
    side: 'buy',
    rewardR: 300,
    breakEvenBp: 2500,
  });
  equal(riskReward({ entry: 100, stop: 110, target: 80 }).side, 'sell');
  throws(() => riskReward({ entry: 100, stop: 90, target: 95 }));
  equal(climbBack({ lossBp: 5000, gainPerTradeBp: 200 }).neededBp, 10_000);
  equal(climbBack({ lossBp: 5000, gainPerTradeBp: 200 }).trades, 36);
  equal(
    promise({ amountMinor: 100_000, monthlyBp: 1000, months: 12 })
      .multipleHundredths,
    314,
  );
  equal(edge({ winBp: 4000, winR: 200, lossR: 100 }).perTrade, 20);
  equal(edge({ winBp: 4000, winR: 200, lossR: 100 }).breakEvenBp, 3333);
});

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ markets, signals, journal and tools: ${passed} checks passed.`);
