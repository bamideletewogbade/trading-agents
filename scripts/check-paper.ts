/**
 * The paper account and syncing (docs/member-app-plan.md): fills at the
 * ask and bid, sizing from risk, a cash account that can't overspend, stop
 * and target exits that are gap-aware, stop-first and written once, a
 * recorded close that wins, shorts, resets, the journal as a log, the
 * merge of two logs, and the shapes the server accepts from a device.
 *
 *     pnpm check
 */

import { deepStrictEqual, equal, ok, throws } from 'node:assert/strict';
import {
  PAPER,
  PaperError,
  accountOf,
  closeIdOf,
  closeOrder,
  exitsFrom,
  fillOrder,
  paperJournal,
  replay,
  valueMinor,
  type Order,
  type PaperEvent,
  type Quote,
  type WatchBar,
} from '../lib/engines/paper.ts';
import {
  journalFrom,
  journalStats,
  problemOf,
  type JournalEvent,
  type JournalTrade,
} from '../lib/engines/journal.ts';
import { missingFrom, unionById } from '../lib/sync/log.ts';
import { UUID, parseLog } from '../lib/sync/schemas.ts';
import { parseKrakenTicker } from '../lib/markets/kraken.ts';
import {
  parseTwelveData,
  parseTwelveDataPrice,
} from '../lib/markets/twelvedata.ts';

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

let n = 0;
/** A fresh v4 UUID, deterministic so the checks are. */
function id(): string {
  n += 1;
  const hex = n.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

const T0 = Date.UTC(2026, 8, 20, 10, 30);
const HOUR = 3_600_000;
// Bitcoin at 84,000.0: prices at one decimal, so 840000.
const QUOTE: Quote = { bid: 839_990, ask: 840_010, last: 840_000, at: T0 };
const BTC = {
  market: 'btc',
  symbol: 'BTC/USD',
  decimals: 1,
  feeBp: 10,
} as const;

function order(over: Partial<Order> = {}): Order {
  return {
    ...BTC,
    side: 'buy',
    stop: 800_000,
    target: 920_000,
    riskBp: 100,
    setup: 'breakout',
    feeling: 'calm',
    signal: true,
    ...over,
  };
}

function bar(
  hoursAfter: number,
  prices: [number, number, number, number],
): WatchBar {
  const start = T0 + hoursAfter * HOUR;
  const [open, high, low, close] = prices;
  return { start, end: start + HOUR, open, high, low, close };
}

check('a buy fills at the ask, sized so the stop loses 1% of equity', () => {
  const account = replay([]);
  equal(account.equityMinor, PAPER.startMinor);
  const { event, trimmed } = fillOrder(account, order(), QUOTE, id(), T0);
  equal(event.price, QUOTE.ask);
  equal(trimmed, false);
  equal(event.origin, 'server');
  // $100 at risk over a $4,001 stop: 0.02499375 BTC.
  equal(event.quantity, 2_499_375);
  const lossAtStop = valueMinor(event.quantity, event.price - event.stop, 1);
  ok(lossAtStop <= 10_000, `loses ${lossAtStop} at the stop`);
  ok(lossAtStop > 9_990);
  equal(
    event.feeMinor,
    Math.round((valueMinor(event.quantity, event.price, 1) * 10) / 10_000),
  );
});

check('a sell fills at the bid, with its stop above', () => {
  const { event } = fillOrder(
    replay([]),
    order({ side: 'sell', stop: 880_000, target: 760_000 }),
    QUOTE,
    id(),
    T0,
  );
  equal(event.price, QUOTE.bid);
  throws(
    () =>
      fillOrder(
        replay([]),
        order({ side: 'sell', stop: 800_000, target: null }),
        QUOTE,
        id(),
        T0,
      ),
    (e: unknown) => e instanceof PaperError && e.code === 'stop-side',
  );
});

check('orders are refused in words: stop, target, risk, too many', () => {
  const account = replay([]);
  const code = (fn: () => unknown, want: string) =>
    throws(fn, (e: unknown) => e instanceof PaperError && e.code === want);
  code(
    () => fillOrder(account, order({ stop: 850_000 }), QUOTE, id(), T0),
    'stop-side',
  );
  code(
    () => fillOrder(account, order({ target: 830_000 }), QUOTE, id(), T0),
    'target-side',
  );
  code(
    () => fillOrder(account, order({ riskBp: 900 }), QUOTE, id(), T0),
    'risk',
  );
  code(() => fillOrder(account, order({ riskBp: 5 }), QUOTE, id(), T0), 'risk');
  const tiny = { ...order({ riskBp: 10 }) };
  const events: PaperEvent[] = [];
  for (let i = 0; i < PAPER.maxOpen; i += 1)
    events.push(fillOrder(replay(events), tiny, QUOTE, id(), T0 + i).event);
  equal(replay(events).open.length, PAPER.maxOpen);
  code(() => fillOrder(replay(events), tiny, QUOTE, id(), T0 + 99), 'too-many');
});

check('a tight stop is trimmed to the cash there is, never overspent', () => {
  const { event, trimmed } = fillOrder(
    replay([]),
    order({ stop: 839_000, riskBp: 500 }),
    QUOTE,
    id(),
    T0,
  );
  equal(trimmed, true);
  const cost = valueMinor(event.quantity, event.price, 1) + event.feeMinor;
  ok(cost <= PAPER.startMinor, `costs ${cost}`);
  ok(cost > PAPER.startMinor - 200, 'uses nearly all of it');
  equal(replay([event]).cashMinor >= 0, true);
});

check('equity is cash plus what the positions are worth at the mark', () => {
  const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
  const flat = replay([event]);
  equal(
    flat.cashMinor,
    PAPER.startMinor -
      valueMinor(event.quantity, event.price, 1) -
      event.feeMinor,
  );
  equal(flat.equityMinor, PAPER.startMinor - event.feeMinor);
  const up = replay([event], { btc: 880_000 });
  equal(
    up.open[0]!.unrealisedMinor,
    valueMinor(event.quantity, 880_000 - event.price, 1),
  );
  ok(up.equityMinor > flat.equityMinor);
  ok(up.open[0]!.r > 0);
});

check(
  'stops and targets: the first bar after the fill that touches, stop first, gaps fill worse',
  () => {
    const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
    const before = bar(-1, [840_000, 700_000, 690_000, 700_000]); // began before the fill: ignored
    const quiet = bar(1, [840_000, 850_000, 830_000, 845_000]);
    const both = bar(2, [845_000, 930_000, 790_000, 900_000]); // touches both: stopped
    const [stop] = exitsFrom(
      [event],
      { btc: [before, quiet, both] },
      T0 + 10 * HOUR,
    );
    equal(stop!.why, 'stop');
    equal(stop!.price, 800_000);
    equal(stop!.at, both.end);
    equal(stop!.id, closeIdOf(event.id));
    const gap = bar(2, [780_000, 790_000, 770_000, 775_000]);
    equal(
      exitsFrom([event], { btc: [quiet, gap] }, T0 + 10 * HOUR)[0]!.price,
      780_000,
    );
    const target = bar(3, [930_000, 935_000, 925_000, 930_000]);
    const [hit] = exitsFrom([event], { btc: [quiet, target] }, T0 + 10 * HOUR);
    equal(hit!.why, 'target');
    equal(
      hit!.price,
      930_000,
      'a gap through the target fills at the open, better',
    );
    // A bar that hasn't closed by now isn't used.
    equal(exitsFrom([event], { btc: [quiet, both] }, both.end - 1).length, 0);
  },
);

check('an exit is written once, and a recorded close always wins', () => {
  const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
  const bars = { btc: [bar(2, [845_000, 850_000, 790_000, 795_000])] };
  const first = accountOf([event], bars, {}, T0 + 10 * HOUR);
  equal(first.exits.length, 1);
  equal(first.account.closed.length, 1);
  const again = accountOf([event, ...first.exits], bars, {}, T0 + 20 * HOUR);
  equal(again.exits.length, 0, 'a stored exit is not found twice');
  deepStrictEqual(again.account.closed, first.account.closed);
  // Closed by hand before the bars were seen: the hand close stands.
  const manual = closeOrder(
    replay([event]),
    event.id,
    { ...QUOTE, bid: 850_000 },
    T0 + HOUR / 2,
  );
  const later = accountOf([event, manual], bars, {}, T0 + 10 * HOUR);
  equal(later.exits.length, 0);
  equal(later.account.closed[0]!.close.why, 'manual');
  equal(later.account.closed[0]!.close.price, 850_000);
});

check(
  'a stopped trade loses about 1R plus fees; a short gains when price falls',
  () => {
    const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
    const bars = { btc: [bar(1, [840_000, 841_000, 799_000, 800_000])] };
    const { account } = accountOf([event], bars, {}, T0 + 5 * HOUR);
    const trade = account.closed[0]!;
    equal(trade.r, -100);
    // Exactly the move to the stop, plus the fee each way.
    equal(
      trade.pnlMinor,
      -valueMinor(event.quantity, event.price - event.stop, 1) -
        event.feeMinor -
        trade.close.feeMinor,
    );
    ok(trade.pnlMinor > -10_000 - 500, `lost ${trade.pnlMinor}`);
    equal(account.equityMinor, account.cashMinor);
    const short = fillOrder(
      replay([]),
      order({ side: 'sell', stop: 880_000, target: 760_000 }),
      QUOTE,
      id(),
      T0,
    ).event;
    const down = { btc: [bar(1, [839_000, 840_000, 755_000, 760_000])] };
    const result = accountOf([short], down, {}, T0 + 5 * HOUR).account;
    equal(result.closed[0]!.close.why, 'target');
    ok(result.closed[0]!.pnlMinor > 0);
    ok(result.closed[0]!.r > 190);
  },
);

check(
  'a hand close fills at the bid (a long) or the ask (a short), once',
  () => {
    const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
    const close = closeOrder(replay([event]), event.id, QUOTE, T0 + HOUR);
    equal(close.price, QUOTE.bid);
    equal(close.id, closeIdOf(event.id));
    ok(UUID.test(close.id));
    ok(close.id !== event.id);
    throws(
      () => closeOrder(replay([event, close]), event.id, QUOTE, T0 + 2 * HOUR),
      (e: unknown) => e instanceof PaperError && e.code === 'not-open',
    );
  },
);

check('a reset starts again; a replay skips what doesn’t fit', () => {
  const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
  const reset: PaperEvent = {
    kind: 'reset',
    id: id(),
    at: T0 + HOUR,
    startMinor: PAPER.startMinor,
  };
  const after = replay([event, reset]);
  equal(after.open.length, 0);
  equal(after.equityMinor, PAPER.startMinor);
  equal(after.since, reset.at);
  equal(
    exitsFrom(
      [event, reset],
      { btc: [bar(2, [840_000, 850_000, 700_000, 710_000])] },
      T0 + 9 * HOUR,
    ).length,
    0,
  );
  const huge = { ...event, id: id(), quantity: event.quantity * 1000 };
  equal(replay([huge]).skipped, 1);
  equal(replay([huge]).cashMinor, PAPER.startMinor);
});

check('closed paper trades read as journal trades', () => {
  const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
  const bars = { btc: [bar(1, [840_000, 841_000, 799_000, 800_000])] };
  const { account } = accountOf([event], bars, {}, T0 + 5 * HOUR);
  const [trade] = paperJournal(account);
  equal(problemOf(trade!), null);
  equal(trade!.source, 'signal');
  equal(journalStats([trade!]).avgR, -100);
});

/* ── Logs and syncing ─────────────────────────────────────────────────── */

function jtrade(over: Partial<JournalTrade> = {}): JournalTrade {
  return {
    id: id(),
    market: 'EUR/USD',
    side: 'buy',
    decimals: 4,
    entry: 10_850,
    stop: 10_820,
    target: 10_910,
    exit: null,
    setup: 'pullback',
    feeling: 'calm',
    source: 'own',
    openedAt: T0,
    closedAt: null,
    note: '',
    ...over,
  };
}

check('the journal log: the latest save wins, a removal removes', () => {
  const t = jtrade();
  const saved: JournalEvent = { kind: 'saved', id: id(), at: T0, trade: t };
  const closed: JournalEvent = {
    kind: 'saved',
    id: id(),
    at: T0 + HOUR,
    trade: { ...t, exit: 10_910, closedAt: T0 + HOUR },
  };
  equal(journalFrom([closed, saved])[0]!.exit, 10_910);
  const removed: JournalEvent = {
    kind: 'removed',
    id: id(),
    at: T0 + 2 * HOUR,
    trade: t.id,
  };
  equal(journalFrom([saved, closed, removed]).length, 0);
  const back: JournalEvent = {
    kind: 'saved',
    id: id(),
    at: T0 + 3 * HOUR,
    trade: t,
  };
  equal(journalFrom([saved, removed, back]).length, 1);
});

check(
  'two logs merge by keeping every event once, whichever side had it',
  () => {
    const a = [1, 2, 3].map((i) => ({ id: `a${i}`, at: i }));
    const b = [
      { id: 'a2', at: 2 },
      { id: 'b1', at: 0 },
    ];
    const ab = unionById(a, b).map((e) => e.id);
    const ba = unionById(b, a).map((e) => e.id);
    deepStrictEqual(ab, ['b1', 'a1', 'a2', 'a3']);
    deepStrictEqual(ab, ba);
    deepStrictEqual(
      missingFrom(a, b).map((e) => e.id),
      ['b1'],
    );
    const first = unionById(
      [{ id: 'x', at: 1, v: 'server' }],
      [{ id: 'x', at: 1, v: 'device' }],
    );
    equal(first[0]!.v, 'server');
  },
);

check(
  'the server keeps only well-formed events, and marks device fills as the device’s',
  () => {
    const good: JournalEvent = {
      kind: 'saved',
      id: id(),
      at: T0,
      trade: jtrade(),
    };
    const wrongStop = {
      kind: 'saved',
      id: id(),
      at: T0,
      trade: jtrade({ stop: 10_900 }),
    };
    const future = {
      kind: 'saved',
      id: id(),
      at: Date.now() + 10 * 86_400_000,
      trade: jtrade(),
    };
    const parsed = parseLog('journal', [good, wrongStop, future, 'junk']);
    equal(parsed.events.length, 1);
    equal(parsed.refused, 3);
    const { event } = fillOrder(replay([]), order(), QUOTE, id(), T0);
    const paper = parseLog('paper', [event]);
    equal(paper.events.length, 1);
    equal((paper.events[0] as { origin: string }).origin, 'device');
    equal(parseLog('paper', [{ ...event, stop: 900_000 }]).events.length, 0);
    equal(
      parseLog(
        'journal',
        Array.from({ length: 600 }, () => good),
      ).refused,
      100,
    );
  },
);

/* ── Quotes ───────────────────────────────────────────────────────────── */

check(
  'quotes: Kraken’s bid and ask, Twelve Data’s price and hourly bars',
  () => {
    // Recorded from api.kraken.com, 27 Sep 2026 (trimmed).
    const kraken = {
      error: [],
      result: {
        XXBTZUSD: {
          a: ['84513.80000', '4', '4.000'],
          b: ['84513.70000', '4', '4.000'],
          c: ['84513.80000', '0.0001'],
        },
      },
    };
    deepStrictEqual(parseKrakenTicker(kraken, 1), {
      bid: 845_137,
      ask: 845_138,
      last: 845_138,
    });
    throws(() =>
      parseKrakenTicker(
        { error: [], result: { X: { a: ['1'], b: ['2'], c: ['1'] } } },
        0,
      ),
    );
    equal(parseTwelveDataPrice({ price: '1.13912' }, 5), 113_912);
    throws(() => parseTwelveDataPrice({ code: 401, message: 'no key' }, 5));
    const now = Date.parse('2026-09-26T15:30:00Z') / 1000;
    const hours = parseTwelveData(
      {
        values: [
          {
            datetime: '2026-09-26 15:00:00',
            open: '1.1391',
            high: '1.1392',
            low: '1.1390',
            close: '1.1391',
          },
          {
            datetime: '2026-09-26 14:00:00',
            open: '1.1390',
            high: '1.1393',
            low: '1.1389',
            close: '1.1391',
          },
          {
            datetime: '2026-09-26 13:00:00',
            open: '1.1388',
            high: '1.1391',
            low: '1.1387',
            close: '1.1390',
          },
        ],
      },
      5,
      now,
      3600,
    );
    equal(hours.length, 2, 'the forming hour is dropped');
    equal(hours[1]!.time, Date.parse('2026-09-26T14:00:00Z') / 1000);
  },
);

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ paper account and sync: ${passed} checks passed.`);
