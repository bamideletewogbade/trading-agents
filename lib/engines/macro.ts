/**
 * The fundamental-analysis stage (f1–f3, f6–f9): what news does to a
 * price, what a central bank's rate does to savings, loans, bonds and
 * shares, what inflation does to money, where a country's dollars come
 * from, the carry trade, and the scenarios for trading around news.
 *
 * Money in integer minor units; rates in basis points; exchange rates as
 * local currency per dollar in ten-thousandths (GH₵6.0061 = 60_061). The
 * bond, loan and share maths discount with repeated × and ÷, which IEEE 754
 * defines exactly, so every phone gets the same pesewa (see lib/core/rng.ts).
 *
 * Pure and seeded. The models are small on purpose: each shows one force
 * clearly, and the lessons say that real markets have many at once.
 */

import { mulDiv } from '../core/money.ts';
import { createRng } from '../core/rng.ts';
import type { Bar } from './candles.ts';

const BP = 10_000;

export class MacroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MacroError';
  }
}

/* ── News and surprise (f1) ───────────────────────────────────────────── */

export type NewsKind = 'rates' | 'inflation' | 'earnings';

export type NewsConfig = {
  /** What the market expected, in basis points. */
  expectedBp: number;
  /** The range a learner can set the actual number in, and its step. */
  lowBp: number;
  highBp: number;
  stepBp: number;
  /** Price move per percentage point of surprise, in basis points of price. */
  movePerPointBp: number;
  /** How far the expectation had already moved the price before the news, in bp. */
  pricedInBp: number;
};

/**
 * Three pieces of news a share price answers to. A bigger rate rise than
 * expected, or hotter inflation, hurts shares (money costs more); profits
 * growing faster than expected help. The expectation is already in the
 * price before the news: only the surprise moves it on the day.
 */
export const NEWS: Record<NewsKind, NewsConfig> = {
  rates: {
    expectedBp: 50,
    lowBp: 0,
    highBp: 150,
    stepBp: 25,
    movePerPointBp: -300,
    pricedInBp: -150,
  },
  inflation: {
    expectedBp: 2_200,
    lowBp: 2_000,
    highBp: 2_500,
    stepBp: 10,
    movePerPointBp: -200,
    pricedInBp: -100,
  },
  earnings: {
    expectedBp: 3_000,
    lowBp: -1_000,
    highBp: 6_000,
    stepBp: 500,
    movePerPointBp: 40,
    pricedInBp: 600,
  },
};

/** The price move the surprise causes, in basis points of price. */
export function surpriseMoveBp(kind: NewsKind, actualBp: number): number {
  const config = NEWS[kind];
  return mulDiv(actualBp - config.expectedBp, config.movePerPointBp, 100);
}

export type NewsDay = {
  bars: Bar[];
  /** Index of the bar the news lands on. */
  at: number;
  surpriseBp: number;
  moveBp: number;
};

/**
 * A share price drifting as the expectation builds, the news landing, and
 * a few bars after. The bars before the news are the same whatever the
 * actual number turns out to be: nobody knew it yet.
 */
export function newsDay(
  seed: string,
  kind: NewsKind,
  actualBp: number,
): NewsDay {
  const config = NEWS[kind];
  const before = createRng(`news:${seed}:${kind}`);
  const after = createRng(`news:${seed}:${kind}:after`);
  const bars: Bar[] = [];
  const start = 10_000;
  const pre = 24;
  let open = start;
  const bar = (rng: typeof before, close: number) => {
    bars.push({
      open,
      high: Math.max(open, close) + rng.int(2, 8),
      low: Math.min(open, close) - rng.int(2, 8),
      close,
      volume: rng.int(80, 140),
    });
    open = close;
  };
  for (let i = 1; i <= pre; i += 1) {
    const path = start + mulDiv(start, config.pricedInBp * i, BP * pre);
    bar(before, path + before.int(-12, 12));
  }
  const moveBp = surpriseMoveBp(kind, actualBp);
  const at = bars.length;
  const reference = open;
  const landed = reference + mulDiv(reference, moveBp, BP);
  bars.push({
    open,
    high: Math.max(open, landed) + after.int(4, 12),
    low: Math.min(open, landed) - after.int(4, 12),
    close: landed,
    volume: after.int(300, 420),
  });
  open = landed;
  // Afterwards, a little follow-through in the surprise's direction.
  const drift = Math.sign(moveBp) * 6;
  for (let i = 0; i < 10; i += 1) bar(after, open + drift + after.int(-10, 10));
  return { bars, at, surpriseBp: actualBp - config.expectedBp, moveBp };
}

/* ── The central bank's rate (f2) ─────────────────────────────────────── */

export const POLICY = {
  startBp: 2_000,
  lowBp: 1_000,
  highBp: 3_500,
  stepBp: 50,
  /** A savings deposit pays a few points under the policy rate. */
  deposit: { amount: 1_000_000, belowBp: 300 },
  /** A one-year loan, repaid monthly, a few points over it. */
  loan: { amount: 1_000_000, overBp: 1_000, months: 12 },
  /** A five-year bond bought when rates were at the start, paying 22% a year. */
  bond: { face: 100_000, couponBp: 2_200, years: 5, overBp: 200 },
  /** A share paying GH₵1.00 a year, growing 10% a year; investors want rates + 6 points. */
  share: { dividend: 100, growthBp: 1_000, premiumBp: 600 },
} as const;

/** Interest over a year, simple. */
export function yearInterest(amount: number, rateBp: number): number {
  return mulDiv(amount, rateBp, BP);
}

/**
 * A bond's price when the market wants `yieldBp` a year: every coupon and
 * the face value at the end, each discounted back. Annual coupons.
 */
export function bondPrice(
  face: number,
  couponBp: number,
  years: number,
  yieldBp: number,
): number {
  if (!Number.isSafeInteger(years) || years < 1)
    throw new MacroError('A bond lasts at least a year.');
  const coupon = mulDiv(face, couponBp, BP);
  const step = 1 + yieldBp / BP;
  let discount = 1;
  let value = 0;
  for (let t = 1; t <= years; t += 1) {
    discount /= step;
    value += coupon * discount;
  }
  value += face * discount;
  return Math.round(value);
}

/**
 * What a share paying `dividend` a year, growing `growthBp` a year, is worth
 * to an investor who wants `requiredBp` a year: dividend ÷ (required −
 * growth). The simplest valuation there is, and enough to show why shares
 * fall when rates rise.
 */
export function shareValue(
  dividend: number,
  requiredBp: number,
  growthBp: number,
): number {
  if (requiredBp <= growthBp)
    throw new MacroError(
      'The return wanted must beat the growth for a value to exist.',
    );
  return mulDiv(dividend, BP, requiredBp - growthBp);
}

/** The monthly repayment on a loan at `rateBp` a year over `months` months. */
export function loanPayment(
  amount: number,
  rateBp: number,
  months: number,
): number {
  if (!Number.isSafeInteger(months) || months < 1)
    throw new MacroError('A loan lasts at least a month.');
  const r = rateBp / BP / 12;
  if (r === 0) return Math.round(amount / months);
  let growth = 1;
  for (let m = 0; m < months; m += 1) growth *= 1 + r;
  return Math.round((amount * r * growth) / (growth - 1));
}

export type PolicyEffects = {
  rateBp: number;
  deposit: { rateBp: number; interest: number };
  loan: { rateBp: number; monthly: number; total: number };
  bond: { yieldBp: number; price: number };
  share: { requiredBp: number; value: number };
};

/** Everything the policy rate reaches, at one setting. */
export function policyEffects(rateBp: number): PolicyEffects {
  if (rateBp < POLICY.lowBp || rateBp > POLICY.highBp)
    throw new MacroError('Outside the rates this lesson models.');
  const depositBp = Math.max(0, rateBp - POLICY.deposit.belowBp);
  const loanBp = rateBp + POLICY.loan.overBp;
  const monthly = loanPayment(POLICY.loan.amount, loanBp, POLICY.loan.months);
  const yieldBp = rateBp + POLICY.bond.overBp;
  const requiredBp = rateBp + POLICY.share.premiumBp;
  return {
    rateBp,
    deposit: {
      rateBp: depositBp,
      interest: yearInterest(POLICY.deposit.amount, depositBp),
    },
    loan: { rateBp: loanBp, monthly, total: monthly * POLICY.loan.months },
    bond: {
      yieldBp,
      price: bondPrice(
        POLICY.bond.face,
        POLICY.bond.couponBp,
        POLICY.bond.years,
        yieldBp,
      ),
    },
    share: {
      requiredBp,
      value: shareValue(
        POLICY.share.dividend,
        requiredBp,
        POLICY.share.growthBp,
      ),
    },
  };
}

/* ── Inflation and your currency (f3) ─────────────────────────────────── */

/** What `amount` buys after prices rise by `inflationBp`, in today's money. */
export function realValue(amount: number, inflationBp: number): number {
  return mulDiv(amount, BP, BP + inflationBp);
}

/** The return after inflation: (1 + nominal) ÷ (1 + inflation) − 1, in bp. */
export function realReturnBp(nominalBp: number, inflationBp: number): number {
  return mulDiv(BP + nominalBp, BP, BP + inflationBp) - BP;
}

/**
 * Money rolled through 91-day Treasury bills: each bill earns its annual
 * rate × 91 ÷ 364 (how Ghana quotes bill rates), then the whole lot goes
 * into the next bill at that day's rate.
 */
export function rollBills(amount: number, ratesBp: readonly number[]): number {
  let value = amount;
  for (const rateBp of ratesBp) value += mulDiv(value, rateBp * 91, 364 * BP);
  return value;
}

/** A dollar price in local money: cents × (local per dollar). */
export function localPrice(usdCents: number, fxTenThousandths: number): number {
  return mulDiv(usdCents, fxTenThousandths, BP);
}

/** Local money in dollars (cents). */
export function inDollars(
  localMinor: number,
  fxTenThousandths: number,
): number {
  return mulDiv(localMinor, BP, fxTenThousandths);
}

/**
 * How much of its value against the dollar a currency lost when the rate
 * went from `before` to `after` local units per dollar, in bp. GH₵6.0061 →
 * GH₵8.5760 is the cedi losing 30% (what the Bank of Ghana reported for 2022).
 */
export function currencyLossBp(before: number, after: number): number {
  return BP - mulDiv(before, BP, after);
}

export type SavingsPlace = 'cash' | 'savings' | 'bills';

/**
 * The saver in the inflation lesson: how much they put away, the savings
 * rate we use as an example (not a published figure), and the dollar price
 * of the phone they want.
 */
export const SAVER = {
  saved: { GHS: 100_000, NGN: 10_000_000 },
  savingsBp: 1_000,
  phoneUsd: 10_000,
} as const;

/**
 * What a year's savings became: cash stays as it was, a savings account
 * earns the example rate, and T-bills roll every three months at the rates
 * published at the start of each quarter (`billsBp` runs December to
 * December).
 */
export function savedThrough(
  amount: number,
  place: SavingsPlace,
  billsBp?: readonly number[],
): number {
  if (place === 'cash') return amount;
  if (place === 'savings')
    return amount + yearInterest(amount, SAVER.savingsBp);
  if (!billsBp || billsBp.length < 10)
    throw new MacroError('No published bill rates for this year.');
  return rollBills(
    amount,
    [0, 3, 6, 9].map((i) => billsBp[i] as number),
  );
}

/* ── Where a country's dollars come from (f7) ─────────────────────────── */

export type Commodity = 'oil' | 'gold' | 'cocoa';

/** Prices in whole dollars: a barrel, an ounce, a tonne. */
export const COMMODITY_PRICES: Record<
  Commodity,
  { base: number; low: number; high: number; step: number }
> = {
  oil: { base: 80, low: 30, high: 130, step: 5 },
  gold: { base: 2_000, low: 1_200, high: 3_000, step: 100 },
  cocoa: { base: 3_000, low: 1_500, high: 10_000, step: 250 },
};

export type Exporter = {
  /** What it sells each year: millions of barrels, ounces or tonnes. */
  sells: Partial<Record<Commodity, number>>;
  /** Dollars it earns from everything else, in millions. */
  otherUsdM: number;
  /** Dollars it needs for imports and debt each year, in millions. */
  needsUsdM: number;
};

/**
 * Two made-up economies, one selling mostly oil, one selling gold, cocoa
 * and oil. At base prices each earns a little more than it needs.
 * Illustrative sizes, not either country's statistics.
 */
export const EXPORTERS: Record<'oil' | 'mixed', Exporter> = {
  oil: { sells: { oil: 600 }, otherUsdM: 6_000, needsUsdM: 50_000 },
  mixed: {
    sells: { gold: 4, cocoa: 0.8, oil: 50 },
    otherUsdM: 3_000,
    needsUsdM: 17_000,
  },
};

export type DollarFlow = {
  earnedUsdM: number;
  needsUsdM: number;
  gapUsdM: number;
  gapBp: number;
};

/** Dollars earned at these prices, against dollars needed, in millions. */
export function dollarFlow(
  exporter: Exporter,
  prices: Record<Commodity, number>,
): DollarFlow {
  let earned = exporter.otherUsdM;
  for (const [good, volume] of Object.entries(exporter.sells) as [
    Commodity,
    number,
  ][])
    earned += Math.round(volume * prices[good]);
  const gap = earned - exporter.needsUsdM;
  return {
    earnedUsdM: earned,
    needsUsdM: exporter.needsUsdM,
    gapUsdM: gap,
    gapBp: mulDiv(gap, BP, exporter.needsUsdM),
  };
}

export function basePrices(): Record<Commodity, number> {
  return {
    oil: COMMODITY_PRICES.oil.base,
    gold: COMMODITY_PRICES.gold.base,
    cocoa: COMMODITY_PRICES.cocoa.base,
  };
}

/* ── The carry trade (f8) ─────────────────────────────────────────────── */

export const CARRY = {
  /** Dollars borrowed, in cents. */
  borrowed: 1_000_000,
  borrowBp: 500,
  investBp: 2_500,
  /** Local units per dollar at the start, in ten-thousandths. */
  fx: 100_000,
  months: 24,
  /** The currency's usual slide, a month, as bp of value lost. */
  slideBp: 50,
  wobbleBp: 120,
  /** The month the currency is devalued, and by how much of its value. */
  devalueMonth: 19,
  devalueBp: 3_000,
} as const;

export type CarryMonth = {
  month: number;
  fx: number;
  /** Local money held, in minor units. */
  local: number;
  /** Dollars owed, in cents. */
  owed: number;
  /** What you'd have if you closed today, in cents: local in dollars − owed. */
  profit: number;
};

/**
 * Borrow dollars at a low rate, change them into a high-rate currency, lend
 * that out, and pay the dollars back at the end. It earns the gap between
 * the rates, until the currency falls further than the gap.
 */
export function carryRun(seed: string, devalue = true): CarryMonth[] {
  const rng = createRng(`carry:${seed}`);
  let fx: number = CARRY.fx;
  let local = mulDiv(CARRY.borrowed, fx, BP);
  let owed: number = CARRY.borrowed;
  const months: CarryMonth[] = [
    { month: 0, fx, local, owed, profit: inDollars(local, fx) - owed },
  ];
  for (let m = 1; m <= CARRY.months; m += 1) {
    local += mulDiv(local, CARRY.investBp, 12 * BP);
    owed += mulDiv(owed, CARRY.borrowBp, 12 * BP);
    const lossBp =
      devalue && m === CARRY.devalueMonth
        ? CARRY.devalueBp
        : CARRY.slideBp + rng.int(-CARRY.wobbleBp, CARRY.wobbleBp);
    // Losing x of its value means a dollar costs 1 ÷ (1 − x) as much.
    fx = mulDiv(fx, BP, BP - lossBp);
    months.push({
      month: m,
      fx,
      local,
      owed,
      profit: inDollars(local, fx) - owed,
    });
  }
  return months;
}

/**
 * How much of its value the high-rate currency can lose in a year before
 * the carry trade loses money: 1 − (1 + borrow) ÷ (1 + invest), in bp.
 */
export function breakEvenLossBp(investBp: number, borrowBp: number): number {
  return BP - mulDiv(BP + borrowBp, BP, BP + investBp);
}

/* ── A rate-decision day (f6) ─────────────────────────────────────────── */

export type ReleaseEnding = 'up' | 'down' | 'reverse';
export type ReleasePlan = 'hold' | 'wait';

export type ReleaseDay = {
  bars: Bar[];
  /** The bar the decision lands on. */
  at: number;
  /** The spread, in cents, on each bar: wide at the release. */
  spreads: number[];
  ending: ReleaseEnding;
};

export const RELEASE = {
  start: 10_000,
  calmBars: 18,
  normalSpread: 4,
  newsSpread: 30,
  /** The trader who holds through buys before the news, with a stop this far below. */
  holdStop: 25,
  /** Both plans risk the same money: $100, in cents. */
  risk: 10_000,
  /** The patient trader enters this many bars after the news. */
  waitBars: 3,
  /** How far below the last price the first price after the release is, in cents. */
  gap: 50,
} as const;

/**
 * Five-minute bars around a rate decision: calm, then a release bar that
 * gaps down first and whips both ways, then a move up, a move down, or a
 * move up that reverses. The bars before the release are the same in every
 * ending.
 */
export function releaseDay(seed: string, ending: ReleaseEnding): ReleaseDay {
  const calm = createRng(`release:${seed}`);
  const after = createRng(`release:${seed}:${ending}`);
  const bars: Bar[] = [];
  const spreads: number[] = [];
  let open: number = RELEASE.start;
  for (let i = 0; i < RELEASE.calmBars; i += 1) {
    const close = RELEASE.start + calm.int(-10, 10);
    bars.push({
      open,
      high: Math.max(open, close) + calm.int(1, 5),
      low: Math.min(open, close) - calm.int(1, 5),
      close,
      volume: calm.int(60, 100),
    });
    spreads.push(RELEASE.normalSpread);
    open = close;
  }
  const at = bars.length;
  // The release: the first price is well below the last, then it whips back up.
  const gapOpen = open - RELEASE.gap;
  const settle = ending === 'down' ? open - 70 : open + 40;
  bars.push({
    open: gapOpen,
    high: open + 60,
    low: Math.min(gapOpen - 15, settle - 5),
    close: settle,
    volume: after.int(500, 700),
  });
  spreads.push(RELEASE.newsSpread);
  open = settle;
  for (let i = 0; i < 16; i += 1) {
    const step =
      ending === 'down'
        ? -12
        : ending === 'up'
          ? 12
          : i < RELEASE.waitBars
            ? 12
            : -14;
    const close = open + step + after.int(-6, 6);
    bars.push({
      open,
      high: Math.max(open, close) + after.int(2, 7),
      low: Math.min(open, close) - after.int(2, 7),
      close,
      volume: after.int(120, 220),
    });
    spreads.push(i === 0 ? 12 : RELEASE.normalSpread);
    open = close;
  }
  return { bars, at, spreads, ending };
}

export type ReleaseResult = {
  side: 'long' | 'short';
  entry: number;
  stop: number;
  /** Where the stop actually filled, if it was hit. */
  fill: number | null;
  exit: number;
  units: number;
  /** In cents: what the plan said it could lose, and what happened. */
  planned: number;
  pnl: number;
};

/**
 * Two ways through the day, each sized to lose the same planned amount.
 * Holding through: buy before the release with a tight stop; a stop is an
 * order to sell at the next price, so a gap fills it below the stop, minus
 * half the (wide) spread. Waiting: enter after the release in the direction
 * price settled, with the stop beyond the release bar.
 */
export function playRelease(day: ReleaseDay, plan: ReleasePlan): ReleaseResult {
  const pre = day.bars[day.at - 1] as Bar;
  const last = day.bars[day.bars.length - 1] as Bar;
  if (plan === 'hold') {
    const entry = pre.close;
    const stop = entry - RELEASE.holdStop;
    const units = Math.floor(RELEASE.risk / RELEASE.holdStop);
    for (let i = day.at; i < day.bars.length; i += 1) {
      const bar = day.bars[i] as Bar;
      if (bar.low <= stop) {
        const half = Math.ceil((day.spreads[i] as number) / 2);
        const fill = Math.min(stop, bar.open) - half;
        return {
          side: 'long',
          entry,
          stop,
          fill,
          exit: fill,
          units,
          planned: -RELEASE.risk,
          pnl: (fill - entry) * units,
        };
      }
    }
    return {
      side: 'long',
      entry,
      stop,
      fill: null,
      exit: last.close,
      units,
      planned: -RELEASE.risk,
      pnl: (last.close - entry) * units,
    };
  }
  const news = day.bars[day.at] as Bar;
  const enterAt = day.at + RELEASE.waitBars;
  const entry = (day.bars[enterAt] as Bar).close;
  const side = entry >= pre.close ? 'long' : 'short';
  const stop = side === 'long' ? news.low - 5 : news.high + 5;
  const units = Math.floor(RELEASE.risk / Math.abs(entry - stop));
  for (let i = enterAt + 1; i < day.bars.length; i += 1) {
    const bar = day.bars[i] as Bar;
    const hit = side === 'long' ? bar.low <= stop : bar.high >= stop;
    if (hit) {
      const half = Math.ceil((day.spreads[i] as number) / 2);
      const fill =
        side === 'long'
          ? Math.min(stop, bar.open) - half
          : Math.max(stop, bar.open) + half;
      const pnl = (side === 'long' ? fill - entry : entry - fill) * units;
      return {
        side,
        entry,
        stop,
        fill,
        exit: fill,
        units,
        planned: -units * Math.abs(entry - stop),
        pnl,
      };
    }
  }
  const pnl =
    (side === 'long' ? last.close - entry : entry - last.close) * units;
  return {
    side,
    entry,
    stop,
    fill: null,
    exit: last.close,
    units,
    planned: -units * Math.abs(entry - stop),
    pnl,
  };
}

/* ── Fundamentals for direction, the chart for timing (f9) ───────────── */

export type PullbackEnding = 'holds' | 'fails';
export type EntryPlan = 'chase' | 'pullback' | 'fade';

export type NewsPullback = {
  /** Up to and including the news bar: what you see when the headline lands. */
  seen: Bar[];
  /** After the news: the pullback, then the ending. */
  next: Bar[];
  /** The top of the range before the news: support once price breaks above it. */
  support: number;
  /** Index (in seen + next) of the bar where the pullback touches support. */
  pullbackAt: number;
};

/**
 * A range, good news that breaks price out above it, a pullback to the old
 * range top, and then either the move carries on or the breakout fails.
 * Built so the structure holds on every seed; the bars up to the pullback
 * are the same in both endings.
 */
export function newsPullback(
  seed: string,
  ending: PullbackEnding,
): NewsPullback {
  const rng = createRng(`pullback:${seed}`);
  const after = createRng(`pullback:${seed}:${ending}`);
  const floor = 980;
  const support = 1_000;
  const seen: Bar[] = [];
  let open = 990;
  for (let i = 0; i < 20; i += 1) {
    const target = i % 6 < 3 ? support - 4 : floor + 4;
    let close = open + Math.trunc((target - open) / 2) + rng.int(-3, 3);
    close = Math.min(support - 3, Math.max(floor + 2, close));
    seen.push({
      open,
      high: Math.min(support, Math.max(open, close) + rng.int(1, 3)),
      low: Math.max(floor, Math.min(open, close) - rng.int(1, 3)),
      close,
      volume: rng.int(80, 130),
    });
    open = close;
  }
  // The headline: price jumps out of the range.
  const jump = support + 30 + rng.int(0, 4);
  seen.push({
    open,
    high: jump + rng.int(2, 5),
    low: open - 1,
    close: jump,
    volume: rng.int(350, 450),
  });
  open = jump;
  const next: Bar[] = [];
  // The pullback: five bars back down to the old range top.
  for (let i = 1; i <= 5; i += 1) {
    const close =
      i === 5
        ? support + 3
        : jump - Math.trunc((i * (jump - support - 3)) / 5) + rng.int(-2, 2);
    const low =
      i === 5 ? support + rng.int(0, 1) : Math.min(open, close) - rng.int(1, 3);
    next.push({
      open,
      high: Math.max(open, close) + rng.int(1, 3),
      low: Math.min(low, open, close),
      close,
      volume: rng.int(90, 140),
    });
    open = close;
  }
  const pullbackAt = seen.length + next.length - 1;
  for (let i = 0; i < 14; i += 1) {
    const close =
      ending === 'holds'
        ? open + 5 + after.int(-2, 3)
        : open - (i < 3 ? 3 : 5) + after.int(-2, 2);
    next.push({
      open,
      high: Math.max(open, close) + after.int(1, 3),
      low: Math.min(open, close) - after.int(1, 3),
      close,
      volume: after.int(90, 160),
    });
    open = close;
  }
  return { seen, next, support, pullbackAt };
}

export type EntryResult = {
  plan: EntryPlan;
  side: 'long' | 'short';
  entry: number;
  stop: number;
  exit: number;
  /** The result in hundredths of R: 150 is +1.5R. */
  r: number;
};

/**
 * Three ways to act on good news, each risking 1R. Chase: buy the headline
 * bar, stop under the old range top. Pullback: wait for price to come back
 * to that level, buy there with the same stop. Fade: sell the headline
 * because "it's gone up too much", stop above the headline bar.
 */
export function playEntry(
  scenario: NewsPullback,
  plan: EntryPlan,
): EntryResult {
  const bars = [...scenario.seen, ...scenario.next];
  const news = scenario.seen[scenario.seen.length - 1] as Bar;
  const stopBelow = scenario.support - 15;
  const from =
    plan === 'pullback' ? scenario.pullbackAt : scenario.seen.length - 1;
  const entry = (bars[from] as Bar).close;
  const side = plan === 'fade' ? 'short' : 'long';
  const stop = plan === 'fade' ? news.high + 15 : stopBelow;
  const risk = Math.abs(entry - stop);
  let exit = (bars[bars.length - 1] as Bar).close;
  for (let i = from + 1; i < bars.length; i += 1) {
    const bar = bars[i] as Bar;
    if (side === 'long' ? bar.low <= stop : bar.high >= stop) {
      exit = stop;
      break;
    }
  }
  const gain = side === 'long' ? exit - entry : entry - exit;
  return { plan, side, entry, stop, exit, r: mulDiv(gain, 100, risk) };
}
