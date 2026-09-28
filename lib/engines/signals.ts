/**
 * Signals: what a fixed set of rules sees in a real market right now, where
 * it would be wrong, what it aims for, why, and how the same rules did on
 * the same market's recent past (docs/member-app-plan.md §4).
 *
 * The rules are two the curriculum teaches, long and short:
 * - a pullback in a trend (s1, t2, t3): the trend is up, price dips back to
 *   its 20-bar average while RSI cools, then closes above the last bar's
 *   high. Mirrored for a sell.
 * - a breakout from a tight base (s3, c7): a close beyond the last 20 bars'
 *   range, on heavy volume, with the trend not against it.
 *
 * The record is honest by the backtester's rules (strategy.ts): a decision
 * on a bar's close fills at the next bar's open, a stop gaps through, costs
 * are paid on the way in and out, and a bar that touches both the stop and
 * the target counts as stopped. A signal decided on a bar never changes when
 * later bars arrive; `pnpm check` proves it.
 *
 * The engine returns facts, not sentences: content/signals.ts says them.
 *
 * Prices are integers in the market's smallest unit (lib/markets), R in
 * hundredths, shares in basis points. Pure: no I/O, no clock, no randomness.
 */

import { mulDiv } from '../core/money.ts';
import type { Bar } from './candles.ts';
import { atr, ema, rsi, sma, type Series } from './indicators.ts';

const BP = 10_000;

/** The rules, fixed. Changing any of them is a new version. */
export const SIGNAL_RULES = {
  version: 1,
  fast: 20,
  slow: 50,
  long: 200,
  /** The slow average must have risen (or fallen) over this many bars. */
  slopeBars: 10,
  rsiLength: 14,
  atrLength: 14,
  /** A pullback: RSI at or below this within the last few bars (above 100 minus it for a sell). */
  pullbackRsi: 45,
  pullbackBars: 6,
  /** A base: this many bars, no taller than this many tenths of an ATR. */
  baseBars: 20,
  baseAtrTenths: 60,
  /** Heavy volume: at least this many tenths of the base's average. */
  volumeTenths: 15,
  /** A stop sits this far past the pullback's extreme, in tenths of an ATR. */
  stopBufferAtrTenths: 3,
  /** Stops are at least one ATR away, and a setup needing more than three is skipped. */
  minStopAtrTenths: 10,
  maxStopAtrTenths: 30,
  targetR: 200,
  /** A signal still open after this many bars is closed at that bar's close. */
  maxBars: 30,
  /** Warnings: RSI past these, price this far from the fast average, bars this much bigger than usual. */
  stretchedRsi: 70,
  extendedAtrTenths: 25,
  volatileTenths: 15,
  usualBars: 120,
} as const;

const R = SIGNAL_RULES;

/** Bars needed before the first decision: the long average and its slope. */
export const WARMUP = R.long + R.slopeBars;

export class SignalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignalError';
  }
}

export type Side = 'buy' | 'sell';
export type Setup = 'pullback' | 'breakout';
export type Trend = 'up' | 'down' | 'none';

/** Something the engine saw, in numbers. Reasons for a signal, or against it. */
export type Fact =
  /** Price is beyond its slow average, which is moving the same way. */
  | { kind: 'trend'; side: Side; beyondBp: number; slopeBp: number }
  /** The long average agrees (for), or disagrees (against). */
  | { kind: 'big-trend'; side: Side; agrees: boolean; beyondBp: number }
  /** Price came back to the fast average and RSI cooled to this. */
  | { kind: 'pullback'; side: Side; rsi: number }
  /** The decision bar closed beyond the last bar's high (buy) or low (sell). */
  | { kind: 'resumed'; side: Side }
  /** The base: its length, and its height as a share of price and in ATR tenths. */
  | { kind: 'base'; bars: number; heightBp: number; atrTenths: number }
  /** The breakout bar's volume, in tenths of the base's average. */
  | { kind: 'volume'; tenths: number }
  /** RSI already far in the signal's direction. */
  | { kind: 'stretched'; side: Side; rsi: number }
  /** Price far from its fast average, in tenths of an ATR: chasing. */
  | { kind: 'extended'; atrTenths: number }
  /** Bars bigger than usual, in tenths of their usual size. */
  | { kind: 'volatile'; tenths: number }
  /** The last signals on this market in a row were losses. */
  | { kind: 'losing-run'; count: number }
  /** On this market, these rules have lost on average. */
  | { kind: 'weak-record'; avgR: number; signals: number };

export type Signal = {
  side: Side;
  setup: Setup;
  /** The bar whose close made the decision. */
  at: number;
  /** That close: the expected entry, which fills at the next bar's open. */
  reference: number;
  stop: number;
  target: number;
  /** One R: from the reference to the stop, in price units. */
  risk: number;
  /** The stop's distance in tenths of an ATR, and as a share of price. */
  stopAtrTenths: number;
  stopBp: number;
  for: Fact[];
  against: Fact[];
};

export type Outcome = 'open' | 'target' | 'stop' | 'expired';

export type Played = Signal & {
  /** Filled at the next bar's open, paying half the cost. */
  entryAt: number;
  entry: number;
  /** The exit bar and price, costs paid; for an open signal, the last close. */
  exitAt: number | null;
  exit: number;
  outcome: Outcome;
  /** In hundredths of R, measured from the real entry. Marked at the last close while open. */
  r: number;
};

export type TrackRecord = {
  /** Closed signals only: an open one hasn't a result yet. */
  signals: number;
  wins: number;
  winRateBp: number;
  avgR: number;
  totalR: number;
  best: number;
  worst: number;
  /** The longest run of losses in a row. */
  worstRun: number;
  /** R added up, signal by signal, starting at 0. */
  curve: number[];
};

/** What the rules are waiting for when there is no signal. */
export type Watch =
  | { kind: 'pullback'; side: Side; level: number; distanceBp: number }
  | { kind: 'range'; high: number; low: number };

export type Now =
  | { state: 'new'; signal: Signal }
  | { state: 'open'; played: Played }
  | { state: 'wait'; watch: Watch };

export type Reading = {
  rules: number;
  bars: number;
  price: number;
  /** Change over the last day and week of bars, in bp. */
  dayBp: number;
  weekBp: number;
  trend: Trend;
  rsi: number;
  /** The usual bar's size (ATR) as a share of price. */
  atrBp: number;
  now: Now;
  /** Every signal the rules played, oldest first (an open one last). */
  history: Played[];
  record: TrackRecord;
};

type Indicators = {
  close: number[];
  fast: Series;
  slow: Series;
  long: Series;
  rsi: Series;
  atr: Series;
};

function indicatorsOf(bars: readonly Bar[]): Indicators {
  const close = bars.map((bar) => bar.close);
  return {
    close,
    fast: ema(close, R.fast),
    slow: sma(close, R.slow),
    long: sma(close, R.long),
    rsi: rsi(close, R.rsiLength),
    atr: atr(bars, R.atrLength),
  };
}

function bpOf(part: number, whole: number): number {
  return whole ? Math.round((part * BP) / whole) : 0;
}

function trendAt(ind: Indicators, i: number): Trend {
  const fast = ind.fast[i];
  const slow = ind.slow[i];
  const before = ind.slow[i - R.slopeBars];
  const close = ind.close[i] as number;
  if (fast == null || slow == null || before == null) return 'none';
  if (fast > slow && slow > before && close > slow) return 'up';
  if (fast < slow && slow < before && close < slow) return 'down';
  return 'none';
}

/** The median of the usual bar size over the last stretch, as a share of price. */
function usualAtrBp(ind: Indicators, i: number): number {
  const sizes: number[] = [];
  for (let j = Math.max(0, i - R.usualBars + 1); j <= i; j += 1) {
    const a = ind.atr[j];
    if (a != null) sizes.push((a * BP) / (ind.close[j] as number));
  }
  if (!sizes.length) return 0;
  sizes.sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)] as number;
}

/** Warnings any signal on bar `i` carries, whatever its setup. */
function warnings(ind: Indicators, i: number, side: Side): Fact[] {
  const out: Fact[] = [];
  const close = ind.close[i] as number;
  const a = ind.atr[i] as number;
  const r = Math.round(ind.rsi[i] ?? 50);
  if (side === 'buy' ? r >= R.stretchedRsi : r <= 100 - R.stretchedRsi)
    out.push({ kind: 'stretched', side, rsi: r });
  const fast = ind.fast[i];
  if (fast != null) {
    const away = Math.round(((close - fast) * 10) / a);
    if ((side === 'buy' ? away : -away) >= R.extendedAtrTenths)
      out.push({ kind: 'extended', atrTenths: Math.abs(away) });
  }
  const usual = usualAtrBp(ind, i);
  const nowBp = (a * BP) / close;
  if (usual > 0) {
    const tenths = Math.round((nowBp * 10) / usual);
    if (tenths >= R.volatileTenths) out.push({ kind: 'volatile', tenths });
  }
  const long = ind.long[i];
  if (long != null) {
    const agrees = side === 'buy' ? close > long : close < long;
    if (!agrees)
      out.push({
        kind: 'big-trend',
        side,
        agrees,
        beyondBp: Math.abs(bpOf(close - long, long)),
      });
  }
  return out;
}

/** A stop `distance` from the close, clamped to the rules; null when too wide. */
function levels(
  close: number,
  side: Side,
  distance: number,
  a: number,
): { stop: number; target: number; risk: number } | null {
  const least = Math.max(1, Math.round((a * R.minStopAtrTenths) / 10));
  const most = Math.round((a * R.maxStopAtrTenths) / 10);
  const wanted = Math.max(least, Math.round(distance));
  if (wanted > most) return null;
  const reach = mulDiv(wanted, R.targetR, 100);
  return side === 'buy'
    ? { stop: close - wanted, target: close + reach, risk: wanted }
    : { stop: close + wanted, target: close - reach, risk: wanted };
}

function signalOf(
  ind: Indicators,
  i: number,
  side: Side,
  setup: Setup,
  distance: number,
  reasons: Fact[],
): Signal | null {
  const close = ind.close[i] as number;
  const a = ind.atr[i] as number;
  const placed = levels(close, side, distance, a);
  if (!placed) return null;
  const facts = [...reasons];
  const long = ind.long[i];
  if (long != null && (side === 'buy' ? close > long : close < long))
    facts.push({
      kind: 'big-trend',
      side,
      agrees: true,
      beyondBp: Math.abs(bpOf(close - long, long)),
    });
  return {
    side,
    setup,
    at: i,
    reference: close,
    stop: placed.stop,
    target: placed.target,
    risk: placed.risk,
    stopAtrTenths: Math.round((placed.risk * 10) / a),
    stopBp: bpOf(placed.risk, close),
    for: facts,
    against: warnings(ind, i, side),
  };
}

/** The signal the rules give on bar `i`'s close, if any. Sees nothing after `i`. */
function setupAt(
  bars: readonly Bar[],
  ind: Indicators,
  i: number,
): Signal | null {
  if (i < WARMUP) return null;
  const a = ind.atr[i];
  if (a == null || a <= 0) return null;
  const bar = bars[i] as Bar;
  const prev = bars[i - 1] as Bar;
  const trend = trendAt(ind, i);

  // A pullback in a trend, then the trend resuming.
  if (trend !== 'none') {
    const side: Side = trend === 'up' ? 'buy' : 'sell';
    const from = i - R.pullbackBars;
    let touched = false;
    let cooled = side === 'buy' ? 100 : 0;
    let extreme = side === 'buy' ? bar.low : bar.high;
    for (let j = from; j < i; j += 1) {
      const b = bars[j] as Bar;
      const fast = ind.fast[j];
      const r = ind.rsi[j];
      if (fast == null || r == null) continue;
      if (side === 'buy' ? b.low <= fast : b.high >= fast) touched = true;
      cooled = side === 'buy' ? Math.min(cooled, r) : Math.max(cooled, r);
      extreme =
        side === 'buy' ? Math.min(extreme, b.low) : Math.max(extreme, b.high);
    }
    const dipped =
      side === 'buy' ? cooled <= R.pullbackRsi : cooled >= 100 - R.pullbackRsi;
    const fast = ind.fast[i] as number;
    const resumed =
      side === 'buy'
        ? bar.close > prev.high && bar.close > fast
        : bar.close < prev.low && bar.close < fast;
    if (touched && dipped && resumed) {
      const buffer = (a * R.stopBufferAtrTenths) / 10;
      const distance =
        side === 'buy'
          ? bar.close - (extreme - buffer)
          : extreme + buffer - bar.close;
      const slow = ind.slow[i] as number;
      const before = ind.slow[i - R.slopeBars] as number;
      const found = signalOf(ind, i, side, 'pullback', distance, [
        {
          kind: 'trend',
          side,
          beyondBp: Math.abs(bpOf(bar.close - slow, slow)),
          slopeBp: Math.abs(bpOf(slow - before, before)),
        },
        { kind: 'pullback', side, rsi: Math.round(cooled) },
        { kind: 'resumed', side },
      ]);
      if (found) return found;
    }
  }

  // A breakout from a tight base on heavy volume.
  let high = -Infinity;
  let low = Infinity;
  let volume = 0;
  for (let j = i - R.baseBars; j < i; j += 1) {
    const b = bars[j] as Bar;
    high = Math.max(high, b.high);
    low = Math.min(low, b.low);
    volume += b.volume;
  }
  const height = high - low;
  const average = volume / R.baseBars;
  if (average <= 0 || height * 10 > a * R.baseAtrTenths) return null;
  const tenths = Math.round((bar.volume * 10) / average);
  if (tenths < R.volumeTenths) return null;
  const side: Side | null =
    bar.close > high && trend !== 'down'
      ? 'buy'
      : bar.close < low && trend !== 'up'
        ? 'sell'
        : null;
  if (!side) return null;
  const middle = (high + low) / 2;
  const distance = side === 'buy' ? bar.close - middle : middle - bar.close;
  const reasons: Fact[] = [
    {
      kind: 'base',
      bars: R.baseBars,
      heightBp: bpOf(height, bar.close),
      atrTenths: Math.round((height * 10) / a),
    },
    { kind: 'volume', tenths },
  ];
  if (trend !== 'none') {
    const slow = ind.slow[i] as number;
    const before = ind.slow[i - R.slopeBars] as number;
    reasons.push({
      kind: 'trend',
      side,
      beyondBp: Math.abs(bpOf(bar.close - slow, slow)),
      slopeBp: Math.abs(bpOf(slow - before, before)),
    });
  }
  // A breakout's stop clamps rather than skips: the base's middle can be
  // far, and three ATRs is where the rules stop caring.
  const most = (a * R.maxStopAtrTenths) / 10;
  return signalOf(ind, i, side, 'breakout', Math.min(distance, most), reasons);
}

function halfCost(price: number, costBp: number): number {
  return Math.round((price * costBp) / (2 * BP));
}

/** R in hundredths for a fill at `entry` and an exit at `exit`, against a stop. */
function rOf(side: Side, entry: number, exit: number, stop: number): number {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return 0;
  return mulDiv(side === 'buy' ? exit - entry : entry - exit, 100, risk);
}

/**
 * Play a signal forward from the bar after its decision. Null when the next
 * open has already gapped past the stop or the target: nobody could have
 * taken it as planned, so it never counts.
 */
function play(
  bars: readonly Bar[],
  signal: Signal,
  costBp: number,
): Played | null {
  const j = signal.at + 1;
  const fill = bars[j];
  if (!fill) return null;
  const buy = signal.side === 'buy';
  if (
    buy
      ? fill.open <= signal.stop || fill.open >= signal.target
      : fill.open >= signal.stop || fill.open <= signal.target
  )
    return null;
  const cost = halfCost(fill.open, costBp);
  const entry = buy ? fill.open + cost : fill.open - cost;
  const out = (at: number, price: number, outcome: Outcome): Played => {
    const paid = halfCost(price, costBp);
    const exit = buy ? price - paid : price + paid;
    return {
      ...signal,
      entryAt: j,
      entry,
      exitAt: outcome === 'open' ? null : at,
      exit: outcome === 'open' ? price : exit,
      outcome,
      r: rOf(
        signal.side,
        entry,
        outcome === 'open' ? price : exit,
        signal.stop,
      ),
    };
  };
  for (let k = j; k < bars.length; k += 1) {
    const b = bars[k] as Bar;
    // The stop first: a bar that touches both is counted as a loss.
    if (buy ? b.low <= signal.stop : b.high >= signal.stop)
      return out(
        k,
        buy ? Math.min(signal.stop, b.open) : Math.max(signal.stop, b.open),
        'stop',
      );
    if (buy ? b.high >= signal.target : b.low <= signal.target)
      return out(
        k,
        buy ? Math.max(signal.target, b.open) : Math.min(signal.target, b.open),
        'target',
      );
    if (k - j + 1 >= R.maxBars) return out(k, b.close, 'expired');
  }
  return out(bars.length - 1, (bars[bars.length - 1] as Bar).close, 'open');
}

export function recordOf(played: readonly Played[]): TrackRecord {
  const closed = played.filter((p) => p.outcome !== 'open');
  const rs = closed.map((p) => p.r);
  const wins = rs.filter((r) => r > 0).length;
  const total = rs.reduce((sum, r) => sum + r, 0);
  let run = 0;
  let worstRun = 0;
  const curve = [0];
  for (const r of rs) {
    run = r > 0 ? 0 : run + 1;
    worstRun = Math.max(worstRun, run);
    curve.push((curve[curve.length - 1] as number) + r);
  }
  return {
    signals: rs.length,
    wins,
    winRateBp: rs.length ? mulDiv(wins, BP, rs.length) : 0,
    avgR: rs.length ? Math.round(total / rs.length) : 0,
    totalR: total,
    best: rs.length ? Math.max(...rs) : 0,
    worst: rs.length ? Math.min(...rs) : 0,
    worstRun,
    curve,
  };
}

/* ── What must be true ────────────────────────────────────────────────── */

/**
 * The checks a signal is read against before anyone should paper-trade it.
 * Every fired signal already has a trend or a base, a stop one to three ATRs
 * away and a 2R target after costs: those are how it fired, so checking them
 * again would only ever pass. These are the ones that vary from call to call.
 */
export type CheckKey =
  | 'big-trend'
  | 'not-stretched'
  | 'not-chasing'
  | 'calm'
  | 'record'
  | 'sample';

/** `unknown` when there isn't enough record to say either way: never counted as a pass. */
export type Check = { key: CheckKey; state: 'pass' | 'fail' | 'unknown' };

export const CHECK_RULES = {
  /** Closed signals before the record's average is worth reading at all. */
  recordFrom: 5,
  /** Closed signals before a record means much (content says why). */
  sampleFrom: 30,
} as const;

export function checklistOf(
  signal: Pick<Signal, 'against'>,
  record: Pick<TrackRecord, 'signals' | 'avgR'>,
): Check[] {
  const flagged = (kind: Fact['kind']) =>
    signal.against.some((fact) => fact.kind === kind);
  const clear = (kind: Fact['kind']) =>
    flagged(kind) ? ('fail' as const) : ('pass' as const);
  return [
    { key: 'big-trend', state: clear('big-trend') },
    { key: 'not-stretched', state: clear('stretched') },
    { key: 'not-chasing', state: clear('extended') },
    { key: 'calm', state: clear('volatile') },
    {
      key: 'record',
      state:
        record.signals < CHECK_RULES.recordFrom
          ? 'unknown'
          : record.avgR > 0
            ? 'pass'
            : 'fail',
    },
    {
      key: 'sample',
      state: record.signals >= CHECK_RULES.sampleFrom ? 'pass' : 'unknown',
    },
  ];
}

/** How many checks pass, out of those that could be judged. */
export function checkScore(checks: readonly Check[]): {
  passed: number;
  known: number;
} {
  const known = checks.filter((c) => c.state !== 'unknown');
  return {
    passed: known.filter((c) => c.state === 'pass').length,
    known: known.length,
  };
}

function watchAt(bars: readonly Bar[], ind: Indicators, i: number): Watch {
  const trend = trendAt(ind, i);
  const close = ind.close[i] as number;
  if (trend !== 'none') {
    const level = Math.round(ind.fast[i] as number);
    return {
      kind: 'pullback',
      side: trend === 'up' ? 'buy' : 'sell',
      level,
      distanceBp: Math.abs(bpOf(close - level, close)),
    };
  }
  let high = -Infinity;
  let low = Infinity;
  for (let j = Math.max(0, i - R.baseBars + 1); j <= i; j += 1) {
    high = Math.max(high, (bars[j] as Bar).high);
    low = Math.min(low, (bars[j] as Bar).low);
  }
  return { kind: 'range', high, low };
}

/**
 * Read a market: walk the rules over every closed bar, play each signal
 * forward, and say what they see on the last bar. `costBp` is the round
 * trip (spread and fees) a trader pays; `barsPerDay` and `barsPerWeek` size
 * the day's and week's change (1 and 7 for daily crypto, 1 and 5 for FX).
 */
export function readMarket(
  bars: readonly Bar[],
  options: { costBp: number; barsPerDay: number; barsPerWeek: number },
): Reading {
  if (bars.length < WARMUP + 2)
    throw new SignalError(
      `Signals need at least ${WARMUP + 2} closed bars; this market has ${bars.length}.`,
    );
  for (const bar of bars)
    if (
      ![bar.open, bar.high, bar.low, bar.close, bar.volume].every(
        Number.isSafeInteger,
      ) ||
      bar.low > Math.min(bar.open, bar.close) ||
      bar.high < Math.max(bar.open, bar.close) ||
      bar.low <= 0
    )
      throw new SignalError('Every bar needs whole, positive, ordered prices.');
  const ind = indicatorsOf(bars);
  const last = bars.length - 1;
  const history: Played[] = [];
  let fresh: Signal | null = null;

  for (let i = WARMUP; i <= last;) {
    const signal = setupAt(bars, ind, i);
    if (!signal) {
      i += 1;
      continue;
    }
    if (i === last) {
      fresh = signal;
      break;
    }
    const played = play(bars, signal, options.costBp);
    if (!played) {
      i += 1;
      continue;
    }
    history.push(played);
    if (played.outcome === 'open') break;
    // The next decision can be made on the exit bar's own close.
    i = played.exitAt as number;
    if (i <= signal.at) i = signal.at + 1;
  }

  const record = recordOf(history);
  const close = ind.close[last] as number;
  const back = (n: number) => ind.close[Math.max(0, last - n)] as number;
  const open = history.find((p) => p.outcome === 'open') ?? null;

  let now: Now;
  if (fresh) {
    // What the record says belongs with the call it's about.
    let losses = 0;
    for (
      let k = history.length - 1;
      k >= 0 && (history[k] as Played).r <= 0;
      k -= 1
    )
      losses += 1;
    const extra: Fact[] = [];
    if (losses >= 2) extra.push({ kind: 'losing-run', count: losses });
    if (record.signals >= 5 && record.avgR < 0)
      extra.push({
        kind: 'weak-record',
        avgR: record.avgR,
        signals: record.signals,
      });
    now = {
      state: 'new',
      signal: { ...fresh, against: [...fresh.against, ...extra] },
    };
  } else if (open) now = { state: 'open', played: open };
  else now = { state: 'wait', watch: watchAt(bars, ind, last) };

  return {
    rules: R.version,
    bars: bars.length,
    price: close,
    dayBp: bpOf(close - back(options.barsPerDay), back(options.barsPerDay)),
    weekBp: bpOf(close - back(options.barsPerWeek), back(options.barsPerWeek)),
    trend: trendAt(ind, last),
    rsi: Math.round(ind.rsi[last] ?? 50),
    atrBp: bpOf(Math.round(ind.atr[last] ?? 0), close),
    now,
    history,
    record,
  };
}

/** The lines a chart of the last `count` bars draws: the two averages. */
export function signalLines(
  bars: readonly Bar[],
  count: number,
): { fast: (number | null)[]; slow: (number | null)[] } {
  const ind = indicatorsOf(bars);
  const from = Math.max(0, bars.length - count);
  const round = (series: Series) =>
    series.slice(from).map((v) => (v == null ? null : Math.round(v)));
  return { fast: round(ind.fast), slow: round(ind.slow) };
}
