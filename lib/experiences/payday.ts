/**
 * The Payday engine as a registered experience: its bounds, its truth, and
 * the numbers it hands to words (content), the coach and the screen reader.
 *
 * A run stores the whole numeric scenario in its config, not a pointer to
 * it. When a scenario's amounts are revised next month, every saved run
 * still replays to exactly what the learner saw (the same reason Kanea keeps
 * an offer snapshot on each job).
 */

import { z } from 'zod';
import { fromMinor, isCurrency, type Currency } from '../core/money.ts';
import {
  BUCKETS,
  init,
  PaydayError,
  step,
  type PaydayAction,
  type PaydayConfig,
  type PaydayOutcome,
  type PaydayState,
} from '../engines/payday.ts';
import { ActionError, type Experience, type Facts } from './types.ts';

export type PaydayRunConfig = PaydayConfig & {
  scenario: string;
  currency: Currency;
};

const minor = z.number().int().min(0).max(1_000_000_000_000);
const day = z.number().int().min(1).max(30);

const configSchema = z
  .object({
    scenario: z.string().min(1).max(40),
    currency: z.string().refine(isCurrency, 'Unknown currency.'),
    income: minor.min(1),
    chip: minor.min(1),
    rent: z.object({ amount: minor, day }),
    family: z.object({ ask: minor, day }),
    living: z.object({ total: minor, days: z.array(day).min(1).max(30) }),
    shock: z.object({
      min: minor,
      max: minor,
      step: minor.min(1),
      days: z.array(day).min(1).max(30),
    }),
    loanFeeBp: z.number().int().min(0).max(100_000),
    scheme: z.object({
      multiple: z.number().int().min(1).max(10),
      periodDays: z.number().int().min(1).max(365),
    }),
  })
  .refine(
    (config) => config.income % config.chip === 0,
    'Income must be a whole number of chips.',
  )
  .refine(
    (config) => config.shock.max >= config.shock.min,
    'Shock range is backwards.',
  );

const splitSchema = z.object(
  Object.fromEntries(BUCKETS.map((bucket) => [bucket, minor])) as Record<
    (typeof BUCKETS)[number],
    typeof minor
  >,
);

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('allocate'), split: splitSchema }),
  z.object({
    type: z.literal('predict'),
    days: z.number().int().min(0).max(3650),
  }),
  z.object({ type: z.literal('play') }),
]);

export type PaydayRunState = PaydayState & { config: PaydayRunConfig };

export const payday: Experience<
  PaydayRunConfig,
  PaydayRunState,
  PaydayAction,
  PaydayOutcome
> = {
  key: 'payday',
  version: 1,
  truth: 'simulation',
  objectives: [
    'budget_with_obligations',
    'emergency_fund',
    'loan_cost',
    'too_good_returns',
  ],
  difficulty: { min: 1, max: 2 },
  whatsapp: 'handoff',
  parseConfig: (input) => configSchema.parse(input) as PaydayRunConfig,
  parseAction: (input) => actionSchema.parse(input),
  init: (config, seed) => init(config, seed) as PaydayRunState,
  step(state, action) {
    try {
      const next = step(state, action);
      return { state: next.state as PaydayRunState, outcomes: next.outcomes };
    } catch (error) {
      if (error instanceof PaydayError) throw new ActionError(error.message);
      throw error;
    }
  },
  facts(state): Facts {
    const money = (value: number) => ({
      kind: 'money' as const,
      value: fromMinor(value, state.config.currency),
    });
    const numbers: Facts['numbers'] = { income: money(state.config.income) };
    if (state.prediction !== null)
      Object.assign(numbers, {
        prediction: { kind: 'days', value: state.prediction },
      });
    const end = state.end;
    if (!end) return { numbers, pivotal: false };
    Object.assign(numbers, {
      spend: money(end.spend),
      savings: money(end.savings),
      debt: money(end.debt),
      borrowed: money(end.borrowed),
      fees: money(end.fees),
      schemeLocked: money(end.schemeLocked),
      schemePromised: money(end.schemePromised),
      familyAsked: money(end.familyAsked),
      familySent: money(end.familySent),
      shockCost: money(end.shockCost),
      shockDay: { kind: 'count', value: end.shockDay },
      daysOfCover: { kind: 'days', value: end.daysOfCover },
      net: money(end.net),
    });
    return { numbers, pivotal: end.borrowed > 0 || end.savings === 0 };
  },
};
