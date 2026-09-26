/**
 * Strategies (stage 6): markets with regimes, a rules-based backtester, and
 * the scenarios each lesson plays a strategy on.
 *
 * The backtester is honest by construction:
 * - a rule decides on a bar's close and acts at the next bar's open, so no
 *   rule can see the future;
 * - a stop is an order to sell at the next price, so a gap fills it below
 *   the stop;
 * - every entry and exit pays half the spread;
 * - it's a cash account: a position is sized to risk a share of the account
 *   (lesson r2) and never costs more than the account holds.
 *
 * Long only, which is enough to show what each strategy is for and when it
 * fails. Money in integer cents, R in hundredths, rates in basis points.
 * Pure and seeded.
 */

import { mulDiv } from '../core/money.ts';
import { createRng } from '../core/rng.ts';
import { aggregate, walkCandles, type Bar } from './candles.ts';
import { atr, bollinger, rsi, sma, type Series } from './indicators.ts';
import { maxDrawdownBp } from './trades.ts';

const BP = 10_000;

/* ── Markets with regimes ─────────────────────────────────────────────── */

export type Regime = 'up' | 'down' | 'range';
export type Segment = { kind: Regime; bars: number };

/** How each regime moves, a bar at a time, in cents. */
export type Regimes = Record<
  Regime,
  { drift: number; wobble: number; revertBp: number }
>;

const REGIME: Regimes = {
  up: { drift: 14, wobble: 40, revertBp: 0 },
  down: { drift: -16, wobble: 40, revertBp: 0 },
  range: { drift: 0, wobble: 40, revertBp: 1_500 },
};

/** The same regimes an hour at a time: smaller steps, the same shape. */
const HOURLY: Regimes = {
  up: { drift: 3, wobble: 16, revertBp: 0 },
  down: { drift: -3, wobble: 16, revertBp: 0 },
  range: { drift: 0, wobble: 16, revertBp: 400 },
};

/**
 * A made-up market built from regimes laid end to end: a range, a trend up,
 * another range, a fall... Each segment starts where the last one ended, so
 * the joins are invisible, as they are in real markets.
 */
export function market(
  seed: string,
  segments: readonly Segment[],
  start = 10_000,
  moves: Regimes = REGIME,
): { bars: Bar[]; regimes: Regime[] } {
  const bars: Bar[] = [];
  const regimes: Regime[] = [];
  let open = start;
  segments.forEach((segment, n) => {
    const config = moves[segment.kind];
    const part = walkCandles(`${seed}:${n}:${segment.kind}`, {
      count: segment.bars,
      start: open,
      drift: config.drift,
      wobble: config.wobble,
      revertBp: config.revertBp,
    });
    for (const bar of part) {
      bars.push(bar);
      regimes.push(segment.kind);
    }
    open = (part[part.length - 1] as Bar).close;
  });
  return { bars, regimes };
}

/** Plans the lessons use: mostly trends, mostly ranges, and a bit of both. */
export const PLANS = {
  trendy: [
    { kind: 'range', bars: 60 },
    { kind: 'up', bars: 120 },
    { kind: 'range', bars: 80 },
    { kind: 'down', bars: 60 },
    { kind: 'up', bars: 100 },
  ],
  choppy: [
    { kind: 'range', bars: 140 },
    { kind: 'up', bars: 30 },
    { kind: 'range', bars: 150 },
    { kind: 'down', bars: 30 },
    { kind: 'range', bars: 70 },
  ],
  rangeThenBreak: [
    { kind: 'range', bars: 180 },
    { kind: 'down', bars: 70 },
  ],
  mixed: [
    { kind: 'range', bars: 70 },
    { kind: 'up', bars: 70 },
    { kind: 'range', bars: 70 },
    { kind: 'down', bars: 50 },
    { kind: 'range', bars: 60 },
    { kind: 'up', bars: 60 },
  ],
} satisfies Record<string, Segment[]>;

/* ── The backtester ───────────────────────────────────────────────────── */

export type EntryRule = 'ma-cross' | 'breakout' | 'band-low' | 'rsi-dip';
export type ExitRule = 'signal' | 'target' | 'time';

export type Rules = {
  entry: EntryRule;
  exit: ExitRule;
  /** Stop distance in tenths of an ATR; 0 means no stop at all. */
  stopAtrTenths: number;
  /** Share of the account risked on each trade, in bp (lesson r2). */
  riskBp: number;
  /** For a 'target' exit: the target, in hundredths of R. */
  targetR?: number;
  /** For a 'time' exit: bars to hold. */
  holdBars?: number;
  /** Moving-average lengths for 'ma-cross'. */
  fast?: number;
  slow?: number;
  /**
   * After a stop-out, take no more trades: a range rule's way of saying
   * "the range may be over".
   */
  standAside?: boolean;
  /** Close any trade at the end of every this-many bars: a day trader's rule. */
  sessionBars?: number;
};

export type Trade = {
  /** Bar indexes: the entry fills at `entryAt`'s open, the exit on `exitAt`. */
  entryAt: number;
  exitAt: number;
  entry: number;
  exit: number;
  stop: number | null;
  units: number;
  /** In cents, after the spread. */
  pnl: number;
  /** In hundredths of the risk planned at entry. */
  r: number;
  /** The spread paid on the way in and out, in cents. */
  cost: number;
  why: 'stop' | 'signal' | 'target' | 'time' | 'day-end' | 'end';
};

export type Stats = {
  trades: number;
  wins: number;
  winRateBp: number;
  netPnl: number;
  returnBp: number;
  /** Average R per trade (expectancy), in hundredths. */
  avgR: number;
  maxDrawdownBp: number;
  costs: number;
  /** Share of bars holding a position, in bp. */
  exposureBp: number;
  /** The longest run of bars without a new high in the account. */
  longestFlat: number;
};

export type Backtest = {
  trades: Trade[];
  /** Account value at each bar's close, in cents. */
  equity: number[];
  start: number;
  end: number;
  stats: Stats;
};

export const ACCOUNT = 1_000_000;
/** The round-trip spread on one unit, in cents: 4¢ on a $100 price. */
export const SPREAD = 4;

type Indicators = {
  fast: Series;
  slow: Series;
  atr: Series;
  mid: Series;
  lower: Series;
  rsi: Series;
};

function indicators(bars: readonly Bar[], rules: Rules): Indicators {
  const closes = bars.map((bar) => bar.close);
  const bands = bollinger(closes, 20, 2);
  return {
    fast: sma(closes, rules.fast ?? 10),
    slow: sma(closes, rules.slow ?? 30),
    atr: atr(bars, 14),
    mid: bands.middle,
    lower: bands.lower,
    rsi: rsi(closes, 14),
  };
}

function highest(bars: readonly Bar[], from: number, to: number): number {
  let top = -Infinity;
  for (let i = Math.max(0, from); i < to; i += 1)
    top = Math.max(top, (bars[i] as Bar).high);
  return top;
}

function lowest(bars: readonly Bar[], from: number, to: number): number {
  let bottom = Infinity;
  for (let i = Math.max(0, from); i < to; i += 1)
    bottom = Math.min(bottom, (bars[i] as Bar).low);
  return bottom;
}

/** Does the entry rule fire on bar i's close? Uses bars up to i only. */
function enters(
  rule: EntryRule,
  bars: readonly Bar[],
  ind: Indicators,
  i: number,
): boolean {
  const bar = bars[i] as Bar;
  switch (rule) {
    case 'ma-cross': {
      const [f0, s0, f1, s1] = [
        ind.fast[i - 1],
        ind.slow[i - 1],
        ind.fast[i],
        ind.slow[i],
      ];
      return (
        f0 != null &&
        s0 != null &&
        f1 != null &&
        s1 != null &&
        f0 <= s0 &&
        f1 > s1
      );
    }
    case 'breakout':
      return i >= 20 && bar.close > highest(bars, i - 20, i);
    case 'band-low': {
      const lower = ind.lower[i];
      return lower != null && bar.close < lower;
    }
    case 'rsi-dip': {
      const [before, now] = [ind.rsi[i - 1], ind.rsi[i]];
      return before != null && now != null && before >= 30 && now < 30;
    }
  }
}

/** Does the entry rule's own exit fire on bar j's close? */
function leaves(
  rule: EntryRule,
  bars: readonly Bar[],
  ind: Indicators,
  j: number,
): boolean {
  const bar = bars[j] as Bar;
  switch (rule) {
    case 'ma-cross': {
      const [f, s] = [ind.fast[j], ind.slow[j]];
      return f != null && s != null && f < s;
    }
    case 'breakout':
      return j >= 10 && bar.close < lowest(bars, j - 10, j);
    case 'band-low': {
      const mid = ind.mid[j];
      return mid != null && bar.close >= mid;
    }
    case 'rsi-dip': {
      const now = ind.rsi[j];
      return now != null && now > 50;
    }
  }
}

/** Run a strategy's rules over a market, one bar at a time. */
export function backtest(
  bars: readonly Bar[],
  rules: Rules,
  account = ACCOUNT,
  spread = SPREAD,
  // Worked out once per market when many rule sets share it (the optimiser).
  ind: Indicators = indicators(bars, rules),
): Backtest {
  const half = Math.ceil(spread / 2);
  const trades: Trade[] = [];
  const equity: number[] = [];
  let cash = account;
  let open: {
    entryAt: number;
    entry: number;
    stop: number | null;
    riskPerUnit: number;
    units: number;
    exitNext: boolean;
  } | null = null;
  let pending = false;
  let standing = false;

  const close = (j: number, price: number, why: Trade['why']) => {
    if (!open) return;
    const pnl = open.units * (price - open.entry);
    cash += pnl;
    trades.push({
      entryAt: open.entryAt,
      exitAt: j,
      entry: open.entry,
      exit: price,
      stop: open.stop,
      units: open.units,
      pnl,
      r: mulDiv(price - open.entry, 100, open.riskPerUnit),
      cost: open.units * 2 * half,
      why,
    });
    if (why === 'stop' && rules.standAside) standing = true;
    open = null;
  };

  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i] as Bar;
    // An entry decided on the last bar's close fills at this bar's open.
    if (pending && !open) {
      pending = false;
      const a = ind.atr[i - 1];
      if (a != null && a > 0) {
        const entry = bar.open + half;
        const stopDistance = Math.max(
          1,
          Math.round((a * (rules.stopAtrTenths || 20)) / 10),
        );
        const stop = rules.stopAtrTenths > 0 ? entry - stopDistance : null;
        const riskCents = Math.floor((cash * rules.riskBp) / BP);
        const units = Math.min(
          Math.floor(riskCents / stopDistance),
          Math.floor(cash / entry),
        );
        if (units > 0)
          open = {
            entryAt: i,
            entry,
            stop,
            riskPerUnit: stopDistance,
            units,
            exitNext: false,
          };
      }
    }
    if (open) {
      if (open.exitNext) close(i, bar.open - half, 'signal');
      else if (open.stop !== null && bar.low <= open.stop)
        close(i, Math.min(open.stop, bar.open) - half, 'stop');
      else if (
        rules.exit === 'target' &&
        bar.high >=
          open.entry + mulDiv(open.riskPerUnit, rules.targetR ?? 200, 100)
      ) {
        const target =
          open.entry + mulDiv(open.riskPerUnit, rules.targetR ?? 200, 100);
        close(i, Math.max(target, bar.open) - half, 'target');
      } else if (
        rules.exit === 'time' &&
        i - open.entryAt + 1 >= (rules.holdBars ?? 10)
      )
        close(i, bar.close - half, 'time');
      else if (rules.exit === 'signal' && leaves(rules.entry, bars, ind, i)) {
        if (i === bars.length - 1) close(i, bar.close - half, 'signal');
        else open.exitNext = true;
      }
    }
    if (open && rules.sessionBars && (i + 1) % rules.sessionBars === 0)
      close(i, bar.close - half, 'day-end');
    if (
      !open &&
      !pending &&
      !standing &&
      i < bars.length - 1 &&
      enters(rules.entry, bars, ind, i)
    )
      pending = true;
    if (open && i === bars.length - 1) close(i, bar.close - half, 'end');
    equity.push(cash + (open ? open.units * (bar.close - open.entry) : 0));
  }

  return {
    trades,
    equity,
    start: account,
    end: cash,
    stats: statsOf(trades, equity, account, bars.length),
  };
}

export function statsOf(
  trades: readonly Trade[],
  equity: readonly number[],
  account: number,
  bars: number,
): Stats {
  const wins = trades.filter((t) => t.pnl > 0).length;
  const netPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  let peak = account;
  let run = 0;
  let longestFlat = 0;
  for (const value of equity) {
    if (value > peak) {
      peak = value;
      run = 0;
    } else run += 1;
    longestFlat = Math.max(longestFlat, run);
  }
  const held = trades.reduce((sum, t) => sum + (t.exitAt - t.entryAt + 1), 0);
  return {
    trades: trades.length,
    wins,
    winRateBp: trades.length ? mulDiv(wins, BP, trades.length) : 0,
    netPnl,
    returnBp: mulDiv(netPnl, BP, account),
    avgR: trades.length
      ? Math.round(trades.reduce((sum, t) => sum + t.r, 0) / trades.length)
      : 0,
    maxDrawdownBp: maxDrawdownBp([account, ...equity]),
    costs: trades.reduce((sum, t) => sum + t.cost, 0),
    exposureBp: bars ? mulDiv(held, BP, bars) : 0,
    longestFlat,
  };
}

/**
 * How long the account has gone without a new high, bar by bar, up to
 * `upTo` bars: the wait now, and the longest wait so far.
 */
export function flatRun(
  equity: readonly number[],
  start: number,
  upTo = equity.length,
): { current: number; longest: number } {
  let peak = start;
  let current = 0;
  let longest = 0;
  for (const value of equity.slice(0, upTo)) {
    if (value > peak) {
      peak = value;
      current = 0;
    } else current += 1;
    longest = Math.max(longest, current);
  }
  return { current, longest };
}

/**
 * A backtest as it stood after its first `upTo` bars: the trades closed by
 * then, the account marked at that bar's close, and the return so far.
 */
export function asOf(
  test: Backtest,
  upTo: number,
): {
  closed: Trade[];
  wins: number;
  value: number;
  returnBp: number;
  worst: number;
} {
  const closed = test.trades.filter((t) => t.exitAt < upTo);
  const value = test.equity[upTo - 1] ?? test.start;
  return {
    closed,
    wins: closed.filter((t) => t.pnl > 0).length,
    value,
    returnBp: mulDiv(value - test.start, BP, test.start),
    worst: Math.min(0, ...closed.map((t) => t.pnl)),
  };
}

/** How far a market moved from its first open to its last close, in bp. */
export function moveBp(bars: readonly Bar[]): number {
  const first = (bars[0] as Bar).open;
  return mulDiv((bars[bars.length - 1] as Bar).close - first, BP, first);
}

/** The strategies the lessons name, as rules. */
export const STRATEGIES = {
  trend: {
    entry: 'ma-cross',
    exit: 'signal',
    stopAtrTenths: 30,
    riskBp: 100,
    fast: 10,
    slow: 30,
  },
  range: { entry: 'band-low', exit: 'signal', stopAtrTenths: 15, riskBp: 100 },
  rangeNoStop: {
    entry: 'band-low',
    exit: 'signal',
    stopAtrTenths: 0,
    riskBp: 100,
  },
  rangeStandAside: {
    entry: 'band-low',
    exit: 'signal',
    stopAtrTenths: 15,
    riskBp: 100,
    standAside: true,
  },
} satisfies Record<string, Rules>;

/* ── Breakouts, real and fake (s3) ────────────────────────────────────── */

export type BreakoutSetup = {
  bars: Bar[];
  ceiling: number;
  /** Index of the breakout bar: the setup is seen up to and including it. */
  at: number;
  real: boolean;
  /** The breakout bar's volume against the range's average, in tenths. */
  volumeTenths: number;
};

/**
 * A range, a close above its ceiling, then ten bars. Real breakouts tend to
 * come on heavier volume and keep going; fake ones tend to be thin and fall
 * back. Tend: the volumes overlap and some real ones stall, because in real
 * markets volume is a clue, not a guarantee.
 */
export function breakoutSetup(seed: string): BreakoutSetup {
  const rng = createRng(`setup:${seed}`);
  const real = rng.chanceBp(5_000);
  const floor = 9_800;
  const ceiling = 10_200;
  const bars: Bar[] = [];
  let open = 10_000;
  let volume = 0;
  for (let i = 0; i < 24; i += 1) {
    const target = i % 8 < 4 ? ceiling - 40 : floor + 40;
    let close = open + Math.trunc((target - open) / 3) + rng.int(-25, 25);
    close = Math.min(ceiling - 15, Math.max(floor + 15, close));
    const v = rng.int(80, 130);
    volume += v;
    bars.push({
      open,
      high: Math.min(ceiling - 1, Math.max(open, close) + rng.int(3, 20)),
      low: Math.max(floor + 1, Math.min(open, close) - rng.int(3, 20)),
      close,
      volume: v,
    });
    open = close;
  }
  const average = Math.round(volume / 24);
  const volumeTenths = real ? rng.int(18, 42) : rng.int(8, 26);
  const breakClose = ceiling + rng.int(30, 70);
  bars.push({
    open,
    high: breakClose + rng.int(5, 15),
    low: Math.min(open, breakClose) - rng.int(3, 10),
    close: breakClose,
    volume: Math.round((average * volumeTenths) / 10),
  });
  const at = bars.length - 1;
  open = breakClose;
  // Most real ones carry on; a few stall. Most fakes fall back; a few hold.
  const carries = real ? rng.chanceBp(7_500) : rng.chanceBp(2_000);
  for (let i = 0; i < 10; i += 1) {
    const close = carries
      ? open + rng.int(0, 45)
      : Math.max(floor + 40, open - rng.int(10, 55));
    bars.push({
      open,
      high: Math.max(open, close) + rng.int(3, 15),
      low: Math.min(open, close) - rng.int(3, 15),
      close,
      volume: rng.int(80, 200),
    });
    open = close;
  }
  return { bars, ceiling, at, real, volumeTenths };
}

/** The breakout rule's trade: buy the breakout close, stop back inside the range, out after 10 bars. */
export function tradeBreakout(setup: BreakoutSetup): {
  r: number;
  stopped: boolean;
} {
  const entry = (setup.bars[setup.at] as Bar).close;
  const stop = setup.ceiling - 40;
  const risk = entry - stop;
  for (let i = setup.at + 1; i < setup.bars.length; i += 1) {
    const bar = setup.bars[i] as Bar;
    if (bar.low <= stop)
      return {
        r: mulDiv(Math.min(stop, bar.open) - entry, 100, risk),
        stopped: true,
      };
  }
  const last = setup.bars[setup.bars.length - 1] as Bar;
  return { r: mulDiv(last.close - entry, 100, risk), stopped: false };
}

/** Volume at least this many tenths of the range's average counts as heavy. */
export const HEAVY_VOLUME_TENTHS = 20;

export type BreakoutPlan = 'all' | 'volume';

/** Total R from trading a set of setups with a plan, or with the learner's picks. */
export function breakoutResults(
  setups: readonly BreakoutSetup[],
  take: (setup: BreakoutSetup, i: number) => boolean,
): { taken: number; wins: number; totalR: number; averageR: number } {
  let taken = 0;
  let wins = 0;
  let totalR = 0;
  setups.forEach((setup, i) => {
    if (!take(setup, i)) return;
    const { r } = tradeBreakout(setup);
    taken += 1;
    totalR += r;
    if (r > 0) wins += 1;
  });
  return {
    taken,
    wins,
    totalR,
    averageR: taken ? Math.round(totalR / taken) : 0,
  };
}

/* ── Swing, day and position (s4) ─────────────────────────────────────── */

export type Style = 'day' | 'swing' | 'position';

/**
 * Each style reads its own chart of the same market, built from hourly
 * candles: hourly for the day trader, four-hourly for the swing trader,
 * daily for the position trader. And each spends a different time a day
 * at the screen.
 */
export const STYLES: Record<
  Style,
  { barHours: number; minutesPerDay: number }
> = {
  day: { barHours: 1, minutesPerDay: 240 },
  swing: { barHours: 4, minutesPerDay: 30 },
  position: { barHours: 8, minutesPerDay: 10 },
};

/** Trading hours in a day in this market: eight hourly candles make a daily one. */
export const HOURS_PER_DAY = 8;

/**
 * The trend rule every style uses, with the whole account in when it buys,
 * so the only difference between them is the chart. A day trader is out by
 * each day's close: that's what makes it day trading.
 */
export function styleRules(style: Style): Rules {
  return {
    ...STRATEGIES.trend,
    riskBp: BP,
    ...(style === 'day' ? { sessionBars: HOURS_PER_DAY } : {}),
  };
}

export type StyleResult = {
  style: Style;
  bars: Bar[];
  test: Backtest;
  hoursWatched: number;
};

/** Trading days in a month, to picture a run of daily bars. */
export const TRADING_DAYS_A_MONTH = 21;

/** How many trading days the styles lesson plays. */
export const STYLE_DAYS = 160;

/** The same market and the same rule, traded as a day, swing and position trader. */
export function tradeStyles(seed: string, days = STYLE_DAYS): StyleResult[] {
  const hourly = market(
    seed,
    [
      { kind: 'range', bars: days * 2 },
      { kind: 'up', bars: days * 3 },
      { kind: 'range', bars: days * 2 },
      { kind: 'up', bars: days },
    ],
    10_000,
    HOURLY,
  ).bars;
  return (Object.keys(STYLES) as Style[]).map((style) => {
    const bars = aggregate(hourly, STYLES[style].barHours);
    return {
      style,
      bars,
      test: backtest(bars, styleRules(style)),
      hoursWatched: Math.round((days * STYLES[style].minutesPerDay) / 60),
    };
  });
}

/* ── News trading (s5) ────────────────────────────────────────────────── */

export const NEWS_DAY = {
  start: 10_000,
  calmBars: 12,
  afterBars: 16,
  normalSpread: 4,
  newsSpread: 30,
  /** The straddle's two orders sit this far either side of the last price. */
  level: 20,
  /** Every plan means to risk the same $100 on a release, in cents. */
  risk: 10_000,
  /** The patient trader enters this many bars after the release. */
  waitBars: 3,
} as const;

export type NewsRelease = {
  bars: Bar[];
  /** The bar the numbers land on. */
  at: number;
  /** The spread on each bar, in cents: widest at the release. */
  spreads: number[];
  /** Which way the first price after the release jumped. */
  jump: 'up' | 'down';
  /** Did the release bar swing back through the other side and settle there? */
  whip: boolean;
  /** After it settled, did it keep going or turn? */
  ending: 'go' | 'reverse';
};

/**
 * Five-minute bars around a release. The first price jumps up or down; half
 * the time the bar then whips back through the other side and settles
 * there; then the move keeps going or turns. Each a coin toss, so no plan
 * can know in advance.
 */
export function newsRelease(seed: string): NewsRelease {
  const rng = createRng(`news:${seed}`);
  const bars: Bar[] = [];
  const spreads: number[] = [];
  let open: number = NEWS_DAY.start;
  for (let i = 0; i < NEWS_DAY.calmBars; i += 1) {
    const close = NEWS_DAY.start + rng.int(-10, 10);
    bars.push({
      open,
      high: Math.max(open, close) + rng.int(1, 5),
      low: Math.min(open, close) - rng.int(1, 5),
      close,
      volume: rng.int(60, 100),
    });
    spreads.push(NEWS_DAY.normalSpread);
    open = close;
  }
  const at = bars.length;
  const up = rng.chanceBp(5_000);
  const whip = rng.chanceBp(5_000);
  const ending = rng.chanceBp(5_000) ? 'go' : 'reverse';
  const d = up ? 1 : -1;
  const first = open + d * rng.int(30, 60);
  const swing = open - d * rng.int(35, 60);
  const s = whip ? -d : d;
  const settle = open + s * rng.int(30, 50);
  const ends = whip ? [first, swing, settle] : [first, settle];
  bars.push({
    open: first,
    high: Math.max(...ends) + rng.int(2, 6),
    low: Math.min(...ends) - rng.int(2, 6),
    close: settle,
    volume: rng.int(500, 700),
  });
  spreads.push(NEWS_DAY.newsSpread);
  open = settle;
  for (let i = 0; i < NEWS_DAY.afterBars; i += 1) {
    const step =
      ending === 'reverse' && i >= NEWS_DAY.waitBars ? -14 * s : 8 * s;
    const close = open + step + rng.int(-6, 6);
    bars.push({
      open,
      high: Math.max(open, close) + rng.int(2, 7),
      low: Math.min(open, close) - rng.int(2, 7),
      close,
      volume: rng.int(120, 220),
    });
    spreads.push(i === 0 ? 12 : NEWS_DAY.normalSpread);
    open = close;
  }
  return { bars, at, spreads, jump: up ? 'up' : 'down', whip, ending };
}

export type NewsPlan = 'straddle' | 'wait' | 'sit-out';

export type NewsTrade = {
  side: 'long' | 'short';
  entry: number;
  stop: number;
  exit: number;
  units: number;
  /** In cents, after the spread. */
  pnl: number;
  /** How much worse than their order prices the fills were, in cents. */
  slippage: number;
  stopped: boolean;
};

/** Hold a trade to the day's end or its stop; a stop fills at the next price, minus half that bar's spread. */
function ride(
  day: NewsRelease,
  from: number,
  trade: Omit<NewsTrade, 'exit' | 'pnl' | 'stopped'>,
): NewsTrade {
  const sign = trade.side === 'long' ? 1 : -1;
  for (let i = from; i < day.bars.length; i += 1) {
    const bar = day.bars[i] as Bar;
    const half = Math.ceil((day.spreads[i] as number) / 2);
    const hit = sign > 0 ? bar.low <= trade.stop : bar.high >= trade.stop;
    if (hit) {
      const exit =
        sign > 0
          ? Math.min(trade.stop, bar.open) - half
          : Math.max(trade.stop, bar.open) + half;
      return {
        ...trade,
        exit,
        stopped: true,
        pnl: sign * (exit - trade.entry) * trade.units,
        slippage: trade.slippage + sign * (trade.stop - exit) * trade.units,
      };
    }
  }
  const last = day.bars[day.bars.length - 1] as Bar;
  const half = Math.ceil(NEWS_DAY.normalSpread / 2);
  const exit = last.close - sign * half;
  return {
    ...trade,
    exit,
    stopped: false,
    pnl: sign * (exit - trade.entry) * trade.units,
  };
}

/**
 * The straddle: before the release, an order to buy a little above the
 * price and one to sell a little below, whichever fills first cancelling
 * the other, and the other level as the stop. It sounds like it can't lose.
 * But the first price after the release is past the level, so the order
 * fills there, at the widest spread; and a whip runs straight through the
 * stop.
 */
export function playStraddle(day: NewsRelease): NewsTrade {
  const pre = (day.bars[day.at - 1] as Bar).close;
  const news = day.bars[day.at] as Bar;
  const half = Math.ceil((day.spreads[day.at] as number) / 2);
  const units = Math.floor(NEWS_DAY.risk / (2 * NEWS_DAY.level));
  const long = news.open > pre;
  const level = long ? pre + NEWS_DAY.level : pre - NEWS_DAY.level;
  const entry = long ? news.open + half : news.open - half;
  return ride(day, day.at, {
    side: long ? 'long' : 'short',
    entry,
    stop: long ? pre - NEWS_DAY.level : pre + NEWS_DAY.level,
    units,
    slippage: Math.abs(entry - level) * units,
  });
}

/**
 * Waiting: let the release bar finish and a few more go by, then trade the
 * way it settled, with the stop beyond the release bar and the normal
 * spread back.
 */
export function playWait(day: NewsRelease): NewsTrade {
  const pre = (day.bars[day.at - 1] as Bar).close;
  const news = day.bars[day.at] as Bar;
  const enterAt = day.at + NEWS_DAY.waitBars;
  const close = (day.bars[enterAt] as Bar).close;
  const half = Math.ceil((day.spreads[enterAt] as number) / 2);
  const long = close >= pre;
  const entry = long ? close + half : close - half;
  const stop = long ? news.low - 5 : news.high + 5;
  return ride(day, enterAt + 1, {
    side: long ? 'long' : 'short',
    entry,
    stop,
    units: Math.floor(NEWS_DAY.risk / Math.abs(entry - stop)),
    slippage: 0,
  });
}

export type NewsSeason = {
  days: NewsRelease[];
  straddle: NewsTrade[];
  wait: NewsTrade[];
};

/** A season of releases, each traded the three ways. Sitting out makes and loses nothing. */
export function newsSeason(seed: string, count = 30): NewsSeason {
  const days = Array.from({ length: count }, (_, k) =>
    newsRelease(`${seed}:${k}`),
  );
  return {
    days,
    straddle: days.map(playStraddle),
    wait: days.map(playWait),
  };
}

/** A plan's season: its total, its worst day, and the days it lost more than it meant to. */
export function seasonSummary(trades: readonly NewsTrade[]): {
  total: number;
  worst: number;
  overPlan: number;
} {
  return {
    total: trades.reduce((sum, t) => sum + t.pnl, 0),
    worst: Math.min(0, ...trades.map((t) => t.pnl)),
    overPlan: trades.filter((t) => -t.pnl > NEWS_DAY.risk).length,
  };
}

/* ── Investing is not trading (s6) ────────────────────────────────────── */

export const INVESTING = {
  months: 120,
  /** A made-up index, in hundredths of a point. */
  start: 100_000,
  /** The index's average month, and how far a month can stray from it, in bp. */
  driftBp: 70,
  wobbleBp: 450,
  /** Two bad months, and how much each takes off. */
  crashes: [
    { month: 38, lossBp: 2_200 },
    { month: 86, lossBp: 1_500 },
  ],
  /** Put in each month, in pesewas: GH₵200. */
  monthly: 20_000,
  /** A trader who times it: out after a fall this big from the top, back in after a rise this big from the bottom. */
  timerBp: 1_000,
  /** What switching in or out costs, as bp of the amount moved. */
  switchCostBp: 100,
  /** How many of the best months the unlucky investor happened to sit out. */
  missBest: 10,
} as const;

export type InvestingRun = {
  /** Index level each month. */
  index: number[];
  /** Portfolio value each month, in pesewas, for each approach. */
  steady: number[];
  timer: number[];
  missed: number[];
  /** Paid in by the end of each month, in pesewas: the same for all three. */
  paid: number[];
  paidIn: number;
  switches: number;
};

/**
 * Ten years of a made-up stock index, and three savers putting in the same
 * amount each month: one buys every month whatever happens; one sells after
 * a fall and buys back after a rise; one buys every month but happens to be
 * out of the market in its ten best months. Units are counted in
 * thousandths so small monthly buys don't round away.
 */
export function investing(seed: string): InvestingRun {
  const rng = createRng(`invest:${seed}`);
  const c = INVESTING;
  const index: number[] = [c.start];
  const moves: number[] = [];
  for (let m = 1; m <= c.months; m += 1) {
    const crash = c.crashes.find((x) => x.month === m);
    const moveBp = crash
      ? -crash.lossBp
      : c.driftBp + rng.int(-c.wobbleBp, c.wobbleBp);
    moves.push(moveBp);
    const last = index[index.length - 1] as number;
    index.push(last + mulDiv(last, moveBp, BP));
  }
  const best = new Set(
    moves
      .map((move, m) => ({ move, m: m + 1 }))
      .sort((a, b) => b.move - a.move)
      .slice(0, c.missBest)
      .map((x) => x.m),
  );
  const value = (millis: number, level: number) =>
    mulDiv(millis, level, 1_000 * 100);
  const buy = (amount: number, level: number) =>
    mulDiv(amount, 1_000 * 100, level);

  // The steady saver and the unlucky one hold units; the unlucky one sells
  // before each best month and buys straight back after it.
  let steadyUnits = 0;
  let missedUnits = 0;
  let missedCash = 0;
  // The timer holds units or cash.
  let timerUnits = 0;
  let timerCash = 0;
  let timerIn = true;
  let peak: number = c.start;
  let trough: number = c.start;
  let switches = 0;
  const steady: number[] = [0];
  const timer: number[] = [0];
  const missed: number[] = [0];
  const paid: number[] = [0];
  for (let m = 1; m <= c.months; m += 1) {
    const before = index[m - 1] as number;
    const level = index[m] as number;
    // This month's contribution goes in at the start of the month.
    steadyUnits += buy(c.monthly, before);
    if (best.has(m)) {
      missedCash += c.monthly + value(missedUnits, before);
      missedUnits = 0;
    } else {
      missedUnits += buy(c.monthly + missedCash, before);
      missedCash = 0;
    }
    if (timerIn) timerUnits += buy(c.monthly, before);
    else timerCash += c.monthly;
    // The timer looks at the month's close and switches for next month.
    peak = Math.max(peak, level);
    trough = Math.min(trough, level);
    if (timerIn && level <= peak - mulDiv(peak, c.timerBp, BP)) {
      const proceeds = value(timerUnits, level);
      timerCash += proceeds - mulDiv(proceeds, c.switchCostBp, BP);
      timerUnits = 0;
      timerIn = false;
      trough = level;
      switches += 1;
    } else if (!timerIn && level >= trough + mulDiv(trough, c.timerBp, BP)) {
      const cost = mulDiv(timerCash, c.switchCostBp, BP);
      timerUnits += buy(timerCash - cost, level);
      timerCash = 0;
      timerIn = true;
      peak = level;
      switches += 1;
    }
    paid.push(c.monthly * m);
    steady.push(value(steadyUnits, level));
    missed.push(value(missedUnits, level) + missedCash);
    timer.push(value(timerUnits, level) + timerCash);
  }
  return {
    index,
    steady,
    timer,
    missed,
    paid,
    paidIn: c.monthly * c.months,
    switches,
  };
}

/* ── Build your own strategy (s7) ─────────────────────────────────────── */

export const BUILDER = {
  entries: ['ma-cross', 'breakout', 'band-low', 'rsi-dip'] as const,
  exits: ['signal', 'target', 'time'] as const,
  stops: [10, 20, 30] as const,
  riskBp: 100,
} as const;

export type Choice = {
  entry: EntryRule;
  exit: ExitRule;
  stopAtrTenths: number;
};

export function rulesOf(choice: Choice): Rules {
  return {
    ...choice,
    riskBp: BUILDER.riskBp,
    targetR: 200,
    holdBars: 10,
    fast: 10,
    slow: 30,
  };
}

/** Every combination the builder offers. */
export function allChoices(): Choice[] {
  return BUILDER.entries.flatMap((entry) =>
    BUILDER.exits.flatMap((exit) =>
      BUILDER.stops.map((stopAtrTenths) => ({ entry, exit, stopAtrTenths })),
    ),
  );
}

/**
 * The builder's market: one made-up chart of mixed trends and ranges, cut
 * in two. The first half is "the past" you backtest on; the second is
 * "what came next", which you only see by forward-testing.
 */
export function builderMarket(seed: string): { past: Bar[]; future: Bar[] } {
  const { bars } = market(`builder:${seed}`, [...PLANS.mixed, ...PLANS.mixed]);
  const half = Math.floor(bars.length / 2);
  return { past: bars.slice(0, half), future: bars.slice(half) };
}

/**
 * Try every combination on the past and keep the best: what "optimising" a
 * strategy does. Then see how that best one did on what came next, and
 * where it ranked there among all of them.
 */
export function optimise(seed: string): {
  best: Choice;
  past: Backtest;
  future: Backtest;
  /** 1 is the best of all combinations on what came next. */
  futureRank: number;
  /** What an average combination made on what came next, in bp. */
  futureAverageBp: number;
  tried: number;
} {
  const { past, future } = builderMarket(seed);
  const base = rulesOf(allChoices()[0] as Choice);
  const [onPast, onFuture] = [indicators(past, base), indicators(future, base)];
  const tested = allChoices().map((choice) => ({
    choice,
    past: backtest(past, rulesOf(choice), ACCOUNT, SPREAD, onPast),
    future: backtest(future, rulesOf(choice), ACCOUNT, SPREAD, onFuture),
  }));
  let best = tested[0] as (typeof tested)[number];
  for (const t of tested)
    if (t.past.stats.returnBp > best.past.stats.returnBp) best = t;
  const futureRank =
    tested.filter((t) => t.future.stats.returnBp > best.future.stats.returnBp)
      .length + 1;
  return {
    best: best.choice,
    past: best.past,
    future: best.future,
    futureRank,
    futureAverageBp: Math.round(
      tested.reduce((sum, t) => sum + t.future.stats.returnBp, 0) /
        tested.length,
    ),
    tried: tested.length,
  };
}
