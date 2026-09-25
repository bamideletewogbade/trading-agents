/**
 * Payday, per country: the numbers and every word.
 *
 * **Amounts are illustrative** (25 Sep 2026) and need a local reader's
 * sign-off per country before the pilot (plan §14, Phase 4 exit). They are
 * set so the month is tight but survivable: rent, family and living take most
 * of the income, and what's left is the learner's real decision.
 *
 * Localisation is more than currency (spec §23). In Lagos rent is usually
 * paid a year at a time, so the Nigerian month puts money into a rent fund
 * rather than paying a monthly landlord. In Nairobi rent usually falls due on
 * the 5th. Ghana's month speaks of MoMo; Nigeria's of transfers.
 *
 * Words never do arithmetic: every amount in a sentence is an engine number,
 * formatted by lib/core/money.
 */

// Relative `.ts` imports, like lib/core, so `pnpm check` can validate every
// country's scenario under plain Node.
import type { CountryCode } from '../../lib/core/country.ts';
import {
  formatBp,
  formatMoney,
  fromMinor,
  type Currency,
} from '../../lib/core/money.ts';
import type {
  Bucket,
  Covered,
  MonthEnd,
  MonthEvent,
  WhatIfKey,
} from '../../lib/engines/payday.ts';
import type { PaydayRunConfig } from '../../lib/experiences/payday.ts';

export type PaydayWords = {
  friend: string;
  landed: string;
  buckets: Record<Bucket, { label: string; hint: string }>;
  rentPressure: (amount: string, day: number) => string;
  familyPressure: (amount: string) => string;
  schemePressure: string;
  rentEvent: string;
};

export type PaydayScenario = { config: PaydayRunConfig; words: PaydayWords };

function scheme(friend: string) {
  return `${friend} says his forex guy doubles money in 30 days.`;
}

export const PAYDAY: Record<CountryCode, PaydayScenario> = {
  GH: {
    config: {
      scenario: 'payday-gh-v1',
      currency: 'GHS',
      income: 300_000,
      chip: 10_000,
      rent: { amount: 90_000, day: 10 },
      family: { ask: 40_000, day: 3 },
      living: { total: 120_000, days: [7, 14, 21, 28] },
      shock: {
        min: 50_000,
        max: 70_000,
        step: 5_000,
        days: [15, 16, 17, 18, 19],
      },
      loanFeeBp: 1_500,
      scheme: { multiple: 2, periodDays: 30 },
    },
    words: {
      friend: 'Kofi',
      landed: 'just landed in your MoMo.',
      buckets: {
        rent: { label: 'Rent', hint: 'Due on the 10th' },
        family: { label: 'Home', hint: 'Your mum asked' },
        savings: { label: 'Savings', hint: 'For whatever comes' },
        scheme: { label: 'Kofi’s guy', hint: 'Doubles in 30 days, he says' },
        spend: { label: 'Spending', hint: 'Food, trotro, data' },
      },
      rentPressure: (amount, day) => `Rent of ${amount} is due on day ${day}.`,
      familyPressure: (amount) => `Your mum asks for ${amount}.`,
      schemePressure: scheme('Kofi'),
      rentEvent: 'Rent',
    },
  },
  NG: {
    config: {
      scenario: 'payday-ng-v1',
      currency: 'NGN',
      income: 25_000_000,
      chip: 1_000_000,
      rent: { amount: 8_000_000, day: 10 },
      family: { ask: 3_000_000, day: 3 },
      living: { total: 10_000_000, days: [7, 14, 21, 28] },
      shock: {
        min: 4_500_000,
        max: 7_000_000,
        step: 500_000,
        days: [15, 16, 17, 18, 19],
      },
      loanFeeBp: 1_500,
      scheme: { multiple: 2, periodDays: 30 },
    },
    words: {
      friend: 'Chidi',
      landed: 'just landed in your account.',
      buckets: {
        rent: { label: 'Rent fund', hint: 'Next year’s rent, month by month' },
        family: { label: 'Home', hint: 'Your mum asked' },
        savings: { label: 'Savings', hint: 'For whatever comes' },
        scheme: { label: 'Chidi’s guy', hint: 'Doubles in 30 days, he says' },
        spend: { label: 'Spending', hint: 'Food, transport, data' },
      },
      rentPressure: (amount, day) =>
        `${amount} goes to your rent fund on day ${day}: the landlord wants a year up front.`,
      familyPressure: (amount) => `Your mum asks for ${amount}.`,
      schemePressure: scheme('Chidi'),
      rentEvent: 'Rent fund',
    },
  },
  KE: {
    config: {
      scenario: 'payday-ke-v1',
      currency: 'KES',
      income: 4_500_000,
      chip: 100_000,
      rent: { amount: 1_200_000, day: 5 },
      family: { ask: 500_000, day: 3 },
      living: { total: 2_000_000, days: [7, 14, 21, 28] },
      shock: {
        min: 600_000,
        max: 900_000,
        step: 50_000,
        days: [15, 16, 17, 18, 19],
      },
      loanFeeBp: 1_500,
      scheme: { multiple: 2, periodDays: 30 },
    },
    words: {
      friend: 'Otieno',
      landed: 'just landed in your M-Pesa.',
      buckets: {
        rent: { label: 'Rent', hint: 'Due on the 5th' },
        family: { label: 'Home', hint: 'Your mum asked' },
        savings: { label: 'Savings', hint: 'For whatever comes' },
        scheme: { label: 'Otieno’s guy', hint: 'Doubles in 30 days, he says' },
        spend: { label: 'Spending', hint: 'Food, matatu, data' },
      },
      rentPressure: (amount, day) => `Rent of ${amount} is due on day ${day}.`,
      familyPressure: (amount) => `Your mum asks for ${amount}.`,
      schemePressure: scheme('Otieno'),
      rentEvent: 'Rent',
    },
  },
};

export function money(currency: Currency) {
  return (minor: number, options?: { signed?: boolean; compact?: boolean }) =>
    formatMoney(fromMinor(minor, currency), options);
}

type Fmt = ReturnType<typeof money>;

function sources(covered: Covered, fmt: Fmt, feeBp: number): string {
  const parts: string[] = [];
  if (covered.savings) parts.push(`${fmt(covered.savings)} from savings`);
  if (covered.spend) parts.push(`${fmt(covered.spend)} from spending money`);
  if (covered.loan)
    parts.push(
      `${fmt(covered.loan)} from a loan app, which charges ${formatBp(feeBp)}`,
    );
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** One line per event, for the month as it plays and for "Read this as text". */
export function eventLine(event: MonthEvent, scenario: PaydayScenario): string {
  const fmt = money(scenario.config.currency);
  const { words, config } = scenario;
  switch (event.kind) {
    case 'salary':
      return `Payday. ${fmt(event.amount)} ${words.landed}`;
    case 'scheme_in':
      return `You send ${fmt(event.amount)} to ${words.friend}’s forex guy.`;
    case 'family':
      if (event.sent === 0)
        return `Your mum asked for ${fmt(event.asked)}. You send nothing this month.`;
      if (event.sent === event.asked)
        return `Your mum asked for ${fmt(event.asked)}. You send it.`;
      return `Your mum asked for ${fmt(event.asked)}. You send ${fmt(event.sent)}.`;
    case 'rent': {
      const short = event.amount - event.fromRent;
      if (short === 0) return `${words.rentEvent}: ${fmt(event.amount)}, paid.`;
      return `${words.rentEvent}: ${fmt(event.amount)}. You were ${fmt(short)} short: ${sources(event.covered, fmt, config.loanFeeBp)}.`;
    }
    case 'living': {
      if (event.covered.spend === event.amount)
        return `Food, transport and data this week: ${fmt(event.amount)}.`;
      return `Food, transport and data this week: ${fmt(event.amount)}. Spending money ran out: ${sources(event.covered, fmt, config.loanFeeBp)}.`;
    }
    case 'shock':
      return `Day ${event.day}: your phone screen cracks. The repair is ${fmt(event.amount)}, paid with ${sources(event.covered, fmt, config.loanFeeBp)}.`;
    case 'scheme_due':
      return `${words.friend}’s forex guy promised ${fmt(event.promised)} by today. He says next week.`;
  }
}

/**
 * The coach's line after the month, authored (Phase 1 has no model). The
 * rule picks the single most important thing that happened, says it in at
 * most two sentences, and asks one question (design brief §12).
 */
export function debrief(
  end: MonthEnd,
  scenario: PaydayScenario,
): { say: string; ask: string } {
  const fmt = money(scenario.config.currency);
  const ask = 'Want to see what one change would do?';
  if (end.borrowed > 0 && end.rentFromLoan > 0)
    return {
      say: `You borrowed ${fmt(end.borrowed)} to get through the month, some of it for rent, and the loan app charged ${fmt(end.fees)} for it. You start next month owing ${fmt(end.debt)}.`,
      ask,
    };
  if (end.borrowed > 0)
    return {
      say: `The ${fmt(end.shockCost)} repair left you short, so a loan app lent you ${fmt(end.borrowed)} and charged ${fmt(end.fees)}. That fee is what having no cushion cost you this month.`,
      ask,
    };
  if (end.savings === 0)
    return {
      say: `You got through without borrowing, but the repair took everything you’d saved. Next month starts with no cushion at all.`,
      ask,
    };
  if (end.shockFromSavings === end.shockCost)
    return {
      say: `Your savings paid the ${fmt(end.shockCost)} repair, so you didn’t borrow anything. ${fmt(end.savings)} is still there.`,
      ask,
    };
  return {
    say: `The repair came out of your spending money, and you still got through without borrowing.`,
    ask,
  };
}

export function predictionLine(prediction: number, actual: number): string {
  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
  if (prediction === actual)
    return `You guessed ${days(prediction)}. Exactly right.`;
  return `You guessed ${days(prediction)}. It’s ${days(actual)}.`;
}

export function whatIfLabel(
  key: WhatIfKey,
  moved: number,
  scenario: PaydayScenario,
): string {
  const fmt = money(scenario.config.currency);
  switch (key) {
    case 'scheme_to_savings':
      return `Put the ${fmt(moved)} for ${scenario.words.friend}’s guy into savings`;
    case 'spend_to_savings':
      return `Save ${fmt(moved)} more, spend ${fmt(moved)} less`;
    case 'family_to_ask':
      return `Send your mum what she asked, save the extra ${fmt(moved)}`;
    case 'rent_to_exact':
      return `Put aside exactly the rent, save the extra ${fmt(moved)}`;
  }
}

export function revealLines(
  stake: number,
  twoYears: number,
  scenario: PaydayScenario,
): string[] {
  const fmt = money(scenario.config.currency);
  return [
    `${scenario.words.friend}’s guy said money doubles every 30 days. At that rate, ${fmt(stake)} would be ${fmt(twoYears, { compact: true })} in two years.`,
    'Nothing real grows like that, which is why a promise like this is a red flag.',
  ];
}
