/**
 * Reading a Jev answer honestly.
 *
 * The rule across every gate: **a probability between 0.35 and 0.65 is not an
 * answer.** The same band as Kanea Studio, the Bishop platform and the Jev
 * playground, so "hedged" means one thing everywhere.
 *
 * What a gate does with a hedged answer is the gate's business (plan §6.2):
 * an assessment asks the learner a better question, a safety gate takes the
 * authored path, a content check goes to a person. What no gate may do is
 * round it into a yes or a no.
 *
 * Pure, so `pnpm check` can prove a hedged answer is never treated as sure.
 */

import type { JevAnswer } from './jev.ts';

export const HEDGE_LOW = 0.35;
export const HEDGE_HIGH = 0.65;

export type Read<T> =
  | { kind: 'sure'; value: T; confidence: number }
  | { kind: 'hedged'; value: T; confidence: number }
  | { kind: 'missing' };

/** A yes/no answer. `confidence` is the probability of the value returned. */
export function readYesNo(answer: JevAnswer | undefined): Read<boolean> {
  if (typeof answer?.noul !== 'number' || Number.isNaN(answer.noul))
    return { kind: 'missing' };
  const p = answer.noul;
  const value = p >= 0.5;
  const confidence = value ? p : 1 - p;
  return p > HEDGE_LOW && p < HEDGE_HIGH
    ? { kind: 'hedged', value, confidence }
    : { kind: 'sure', value, confidence };
}

/** A one-of answer. Hedged when the top option isn't clearly ahead. */
export function readChoice<T extends string>(
  answer: JevAnswer | undefined,
  options: readonly T[],
): Read<T> {
  const choice = answer?.choice;
  if (!choice || !(options as readonly string[]).includes(choice))
    return { kind: 'missing' };
  const confidence = answer.confidence ?? answer.probabilities?.[choice] ?? 0;
  return confidence < HEDGE_HIGH
    ? { kind: 'hedged', value: choice as T, confidence }
    : { kind: 'sure', value: choice as T, confidence };
}
