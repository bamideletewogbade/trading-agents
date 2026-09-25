/**
 * The numeric provenance guard (plan §6.4): the coach may repeat numbers,
 * never originate them.
 *
 * Every number in a generated turn must be one the engine produced for this
 * run (`Facts`), one the learner wrote themselves, or a small count ("two
 * timelines", "three questions"). Anything else is rejected and the learner
 * sees an authored line instead. The rejection rate is the product's live
 * hallucination metric (spec §74).
 *
 * Numbers are compared by value, in the units a person reads: GH₵460 matches
 * a money fact of 46,000 pesewas; 15% matches 1,500 basis points; 5.03
 * billion matches the compact form of that amount. Numbers written as words
 * ("four hundred") slip past, which is why the coach's prompt asks for digits
 * and the output check (Jev `safety.out`) looks at tone, not arithmetic.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { formatMoney } from '../core/money.ts';
import type { Facts } from '../experiences/types.ts';

/** Canonical form of a number as text: no grouping commas, no trailing zeros. */
function canonical(raw: string): string {
  return String(Number(raw.replace(/,/g, '')));
}

/** Every number written in `text`, canonical: "GH₵1,250.50" → "1250.5". */
export function numbersIn(text: string): string[] {
  return [...text.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g)].map(
    (match) => canonical(match[0]),
  );
}

/** The numbers a turn about these facts may contain. */
export function allowedNumbers(facts: Facts, learnerText = ''): Set<string> {
  const allowed = new Set<string>(numbersIn(learnerText));
  for (const fact of Object.values(facts.numbers)) {
    switch (fact.kind) {
      case 'money':
        // The amount as it's formatted anywhere on screen, full and compact.
        for (const form of [
          formatMoney(fact.value),
          formatMoney(fact.value, { compact: true }),
        ])
          for (const number of numbersIn(form)) allowed.add(number);
        break;
      case 'bp':
        allowed.add(canonical(String(fact.value / 100)));
        break;
      case 'days':
      case 'count':
        allowed.add(String(fact.value));
        break;
    }
  }
  return allowed;
}

export function checkNumbers(
  text: string,
  allowed: Set<string>,
): { ok: boolean; unknown: string[] } {
  const unknown = numbersIn(text).filter((number) => {
    if (allowed.has(number)) return false;
    const value = Number(number);
    return !(Number.isInteger(value) && value >= 0 && value <= 10);
  });
  return { ok: unknown.length === 0, unknown };
}
