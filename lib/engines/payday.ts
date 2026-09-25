/**
 * Payday: one month of a fictional life, from salary to month end.
 *
 * The first 3 minutes of the product (plan §8) and signature experience 1
 * (spec §78). The learner splits a month's income into five places, guesses
 * how long their savings would last, and watches the month happen: family
 * asks, rent falls due, food and transport go out every week, and on one day
 * something breaks. Then "What if?" replays the same month with one change.
 *
 * ## The money rules, which are the lesson
 *
 * Every shortfall is covered from a fixed order of sources, and the orders
 * differ on purpose:
 *
 * - **Living costs** (food, transport, data) come from spending money first,
 *   then savings, then a loan app.
 * - **Rent** comes from the rent money first; anything missing comes from
 *   savings, then spending money, then a loan app. Rent money left over
 *   joins spending money.
 * - **The shock** (the phone) comes from savings first, then spending money,
 *   then a loan app. That is what savings are for, and why the month teaches
 *   an emergency fund better than a definition could (spec §21).
 * - **Family** gets exactly what the learner put aside for them, no more and
 *   no less. Sending less than was asked is a choice the result names, not
 *   something the engine punishes.
 * - **The scheme** (a friend's "forex guy" who doubles money in 30 days)
 *   holds what was put in and returns nothing within the month.
 *
 * A loan app charges its fee up front on what it lends (`loanFeeBp`, per 30
 * days), so debt is principal plus fee.
 *
 * All amounts are integer minor units in the scenario's currency. `pnpm
 * check` proves that every run balances: income plus borrowing equals
 * everything paid out plus everything left.
 *
 * Pure: no I/O, no Math.random, nothing engine-dependent (see rng.ts).
 */

import { mulDiv } from '../core/money.ts';
import { createRng } from '../core/rng.ts';

export const BUCKETS = [
  'rent',
  'family',
  'savings',
  'scheme',
  'spend',
] as const;
export type Bucket = (typeof BUCKETS)[number];
export type Split = Readonly<Record<Bucket, number>>;

export type PaydayConfig = {
  /** Minor units per month. */
  income: number;
  /** The size of one tap on a stepper: GH₵100, ₦10,000. */
  chip: number;
  rent: { amount: number; day: number };
  family: { ask: number; day: number };
  /** The month's food, transport and data, drawn in equal parts on these days. */
  living: { total: number; days: readonly number[] };
  /** The thing that breaks: its cost and day are drawn from the seed. */
  shock: { min: number; max: number; step: number; days: readonly number[] };
  /** A loan app's fee per 30 days, charged up front, in basis points. */
  loanFeeBp: number;
  /** The scheme's promise: its multiple (×2) every `periodDays`. */
  scheme: { multiple: number; periodDays: number };
};

export type PaydayAction =
  | { type: 'allocate'; split: Split }
  | { type: 'predict'; days: number }
  | { type: 'play' };

export type Source = 'savings' | 'spend' | 'loan';
export type Covered = Readonly<Record<Source, number>>;

export type MonthEvent =
  | { day: number; kind: 'salary'; amount: number }
  | { day: number; kind: 'scheme_in'; amount: number }
  | { day: number; kind: 'family'; asked: number; sent: number }
  | {
      day: number;
      kind: 'rent';
      amount: number;
      fromRent: number;
      covered: Covered;
      leftoverToSpend: number;
    }
  | { day: number; kind: 'living'; amount: number; covered: Covered }
  | { day: number; kind: 'shock'; amount: number; covered: Covered }
  | {
      day: number;
      kind: 'scheme_due';
      locked: number;
      promised: number;
      returned: number;
    };

export type Balances = { spend: number; savings: number; debt: number };

/** One step of the month as it plays: the event, and the balances after it. */
export type Beat = { event: MonthEvent; after: Balances };

export type MonthEnd = {
  spend: number;
  savings: number;
  /** Principal borrowed plus fees, owed next month. */
  debt: number;
  borrowed: number;
  fees: number;
  schemeLocked: number;
  schemePromised: number;
  familyAsked: number;
  familySent: number;
  rentFromLoan: number;
  shockCost: number;
  shockDay: number;
  shockFromSavings: number;
  /** Rent plus living: what one month of life costs in this scenario. */
  essentials: number;
  /** Whole days the savings left would cover essentials. */
  daysOfCover: number;
  /** Spending money plus savings minus debt. The scheme is not counted: it isn't yours until it comes back. */
  net: number;
};

export type PaydayState = {
  config: PaydayConfig;
  seed: string;
  split: Split | null;
  prediction: number | null;
  beats: readonly Beat[] | null;
  end: MonthEnd | null;
};

export type PaydayOutcome =
  | { type: 'allocated'; split: Split }
  | { type: 'predicted'; days: number }
  | { type: 'played'; end: MonthEnd };

export class PaydayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaydayError';
  }
}

export function init(config: PaydayConfig, seed: string): PaydayState {
  return {
    config,
    seed,
    split: null,
    prediction: null,
    beats: null,
    end: null,
  };
}

/** Why a split can't be used, or null when it can. */
export function splitProblem(
  config: PaydayConfig,
  split: Split,
): string | null {
  let total = 0;
  for (const bucket of BUCKETS) {
    const amount = split[bucket];
    if (!Number.isSafeInteger(amount) || amount < 0)
      return `${bucket} must be a whole, non-negative amount.`;
    if (amount % config.chip !== 0)
      return `${bucket} must be in steps of ${config.chip}.`;
    total += amount;
  }
  if (total !== config.income)
    return `The split must add up to the income exactly (${total} of ${config.income}).`;
  return null;
}

export function allocated(split: Split): number {
  return BUCKETS.reduce((sum, bucket) => sum + split[bucket], 0);
}

export function step(
  state: PaydayState,
  action: PaydayAction,
): { state: PaydayState; outcomes: PaydayOutcome[] } {
  if (state.end) throw new PaydayError('This month has already been played.');
  switch (action.type) {
    case 'allocate': {
      const problem = splitProblem(state.config, action.split);
      if (problem) throw new PaydayError(problem);
      return {
        state: { ...state, split: action.split },
        outcomes: [{ type: 'allocated', split: action.split }],
      };
    }
    case 'predict': {
      if (
        !Number.isSafeInteger(action.days) ||
        action.days < 0 ||
        action.days > 3650
      )
        throw new PaydayError('A prediction is a whole number of days.');
      return {
        state: { ...state, prediction: action.days },
        outcomes: [{ type: 'predicted', days: action.days }],
      };
    }
    case 'play': {
      if (!state.split)
        throw new PaydayError('Split the money before playing the month.');
      const { beats, end } = playMonth(state.config, state.seed, state.split);
      return {
        state: { ...state, beats, end },
        outcomes: [{ type: 'played', end }],
      };
    }
  }
}

/** What the seed decides: the shock's cost and its day. Nothing else is random. */
export function drawShock(
  config: PaydayConfig,
  seed: string,
): { cost: number; day: number } {
  const rng = createRng(`payday:shock:${seed}`);
  const steps = Math.floor(
    (config.shock.max - config.shock.min) / config.shock.step,
  );
  return {
    cost: config.shock.min + rng.int(0, steps) * config.shock.step,
    day: rng.pick(config.shock.days),
  };
}

type Pots = {
  spend: number;
  savings: number;
  debt: number;
  borrowed: number;
  fees: number;
};

function cover(
  pots: Pots,
  amount: number,
  order: readonly Source[],
  feeBp: number,
): Covered {
  const covered: Record<Source, number> = { savings: 0, spend: 0, loan: 0 };
  let left = amount;
  for (const source of order) {
    if (left === 0) break;
    if (source === 'loan') {
      covered.loan = left;
      const fee = mulDiv(left, feeBp, 10_000);
      pots.borrowed += left;
      pots.fees += fee;
      pots.debt += left + fee;
      left = 0;
    } else {
      const take = Math.min(pots[source], left);
      pots[source] -= take;
      covered[source] = take;
      left -= take;
    }
  }
  return covered;
}

/** The living total split across its days, remainder on the last so it sums exactly. */
export function livingDraws(config: PaydayConfig): number[] {
  const count = config.living.days.length;
  const base = Math.floor(config.living.total / count);
  return config.living.days.map((_, index) =>
    index === count - 1 ? config.living.total - base * (count - 1) : base,
  );
}

const ORDER: Record<MonthEvent['kind'], number> = {
  salary: 0,
  scheme_in: 1,
  family: 2,
  rent: 3,
  shock: 4,
  living: 5,
  scheme_due: 6,
};

export function playMonth(
  config: PaydayConfig,
  seed: string,
  split: Split,
): { beats: Beat[]; end: MonthEnd } {
  const shock = drawShock(config, seed);
  const draws = livingDraws(config);
  const pots: Pots = {
    spend: split.spend,
    savings: split.savings,
    debt: 0,
    borrowed: 0,
    fees: 0,
  };

  type Pending = { day: number; kind: MonthEvent['kind']; index?: number };
  const schedule: Pending[] = [
    { day: 1, kind: 'salary' },
    ...(split.scheme > 0 ? [{ day: 1, kind: 'scheme_in' as const }] : []),
    { day: config.family.day, kind: 'family' },
    { day: config.rent.day, kind: 'rent' },
    ...config.living.days.map((day, index) => ({
      day,
      kind: 'living' as const,
      index,
    })),
    { day: shock.day, kind: 'shock' },
    ...(split.scheme > 0 ? [{ day: 30, kind: 'scheme_due' as const }] : []),
  ];
  schedule.sort((a, b) => a.day - b.day || ORDER[a.kind] - ORDER[b.kind]);

  const beats: Beat[] = [];
  let rentFromLoan = 0;
  let shockFromSavings = 0;
  const promised = schemePromise(
    split.scheme,
    config,
    config.scheme.periodDays,
  );

  for (const item of schedule) {
    let event: MonthEvent;
    switch (item.kind) {
      case 'salary':
        event = { day: item.day, kind: 'salary', amount: config.income };
        break;
      case 'scheme_in':
        event = { day: item.day, kind: 'scheme_in', amount: split.scheme };
        break;
      case 'family':
        event = {
          day: item.day,
          kind: 'family',
          asked: config.family.ask,
          sent: split.family,
        };
        break;
      case 'rent': {
        const fromRent = Math.min(split.rent, config.rent.amount);
        const leftoverToSpend = split.rent - fromRent;
        pots.spend += leftoverToSpend;
        const covered = cover(
          pots,
          config.rent.amount - fromRent,
          ['savings', 'spend', 'loan'],
          config.loanFeeBp,
        );
        rentFromLoan = covered.loan;
        event = {
          day: item.day,
          kind: 'rent',
          amount: config.rent.amount,
          fromRent,
          covered,
          leftoverToSpend,
        };
        break;
      }
      case 'living': {
        const amount = draws[item.index ?? 0] ?? 0;
        event = {
          day: item.day,
          kind: 'living',
          amount,
          covered: cover(
            pots,
            amount,
            ['spend', 'savings', 'loan'],
            config.loanFeeBp,
          ),
        };
        break;
      }
      case 'shock': {
        const covered = cover(
          pots,
          shock.cost,
          ['savings', 'spend', 'loan'],
          config.loanFeeBp,
        );
        shockFromSavings = covered.savings;
        event = { day: item.day, kind: 'shock', amount: shock.cost, covered };
        break;
      }
      case 'scheme_due':
        event = {
          day: item.day,
          kind: 'scheme_due',
          locked: split.scheme,
          promised,
          returned: 0,
        };
        break;
    }
    beats.push({
      event,
      after: { spend: pots.spend, savings: pots.savings, debt: pots.debt },
    });
  }

  const essentials = config.rent.amount + config.living.total;
  const end: MonthEnd = {
    spend: pots.spend,
    savings: pots.savings,
    debt: pots.debt,
    borrowed: pots.borrowed,
    fees: pots.fees,
    schemeLocked: split.scheme,
    schemePromised: promised,
    familyAsked: config.family.ask,
    familySent: split.family,
    rentFromLoan,
    shockCost: shock.cost,
    shockDay: shock.day,
    shockFromSavings,
    essentials,
    daysOfCover: Math.floor((pots.savings * 30) / essentials),
    net: pots.spend + pots.savings - pots.debt,
  };
  return { beats, end };
}

/** What the scheme says `amount` becomes after `days`: its multiple, once per whole period. */
export function schemePromise(
  amount: number,
  config: PaydayConfig,
  days: number,
): number {
  let value = amount;
  for (
    let period = 0;
    period < Math.floor(days / config.scheme.periodDays);
    period += 1
  ) {
    value *= config.scheme.multiple;
    if (!Number.isSafeInteger(value))
      throw new PaydayError('The promise outgrew what can be counted exactly.');
  }
  return value;
}

/* ── What if? ─────────────────────────────────────────────────────────── */

export type WhatIfKey =
  | 'scheme_to_savings'
  | 'spend_to_savings'
  | 'family_to_ask'
  | 'rent_to_exact';

export type WhatIf = { key: WhatIfKey; moved: number; split: Split };

/**
 * The one-change alternatives worth offering for a split, each already
 * applied. Only the ones that change something appear: there's no "move the
 * scheme money" for someone who kept away from the scheme.
 */
export function whatIfs(config: PaydayConfig, split: Split): WhatIf[] {
  const options: WhatIf[] = [];
  const move = (key: WhatIfKey, from: Bucket, amount: number) => {
    if (amount <= 0) return;
    options.push({
      key,
      moved: amount,
      split: {
        ...split,
        [from]: split[from] - amount,
        savings: split.savings + amount,
      },
    });
  };
  move('scheme_to_savings', 'scheme', split.scheme);
  move('family_to_ask', 'family', split.family - config.family.ask);
  move('rent_to_exact', 'rent', split.rent - config.rent.amount);
  move('spend_to_savings', 'spend', Math.min(split.spend, config.chip * 3));
  return options;
}

/* ── Numbers the screens need, calculated here rather than in a component ── */

/** What a day of rent and living costs, to help the learner estimate. */
export function dailyEssentials(config: PaydayConfig): number {
  return Math.floor((config.rent.amount + config.living.total) / 30);
}

/**
 * The reveal after the month: what the scheme's promise would turn the
 * learner's stake into over two years. Someone who kept away from the scheme
 * sees it for three chips' worth instead.
 */
export function schemeReveal(
  config: PaydayConfig,
  split: Split,
): { stake: number; twoYears: number } {
  const stake = split.scheme > 0 ? split.scheme : config.chip * 3;
  return { stake, twoYears: schemePromise(stake, config, 730) };
}

/* ── Building a split, one tap at a time ──────────────────────────────── */

export const EMPTY_SPLIT: Split = {
  rent: 0,
  family: 0,
  savings: 0,
  scheme: 0,
  spend: 0,
};

/** What is still to be placed. */
export function unplaced(config: PaydayConfig, split: Split): number {
  return config.income - allocated(split);
}

/**
 * Set one place to `amount`, kept in whole chips, never below zero and never
 * more than that place plus what is still unplaced. The screen's steppers and
 * shortcuts all go through here, so a split can't be built wrong.
 */
export function setBucket(
  config: PaydayConfig,
  split: Split,
  bucket: Bucket,
  amount: number,
): Split {
  const ceiling = split[bucket] + unplaced(config, split);
  const chips = Math.floor(
    Math.max(0, Math.min(amount, ceiling)) / config.chip,
  );
  return { ...split, [bucket]: chips * config.chip };
}
