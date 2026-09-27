/**
 * The onboarding gate: when the chat's plain patterns can't read an answer
 * (lib/onboarding/flow.ts), Jev picks one of the step's fixed options. A
 * hedged pick is "unsure", and the coach asks a narrower question instead
 * of guessing. Through `decide()`, so it shares the breaker, cache, limit
 * and ledger with every other gate.
 *
 * Like every gate that reads what a learner types, it asks the safety
 * questions too: a crisis (by rule, or a yes or hedged answer from Jev)
 * comes back as "crisis", and the chat shows the support card.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { UNTRUSTED } from './jev.ts';
import type { Gate } from './gate.ts';
import { readChoice } from './read.ts';
import {
  SAFETY_QUESTIONS,
  crisisRule,
  normalise,
  readSafety,
} from './safety.ts';
import { JEV_OPTIONS, type Step } from '../onboarding/flow.ts';

export const MEANING_MAX_CHARS = 280;

export type MeaningInput = { step: Step; text: string };
export type MeaningVerdict =
  | { kind: 'sure'; value: string }
  | { kind: 'unsure' }
  | { kind: 'crisis' }
  | { kind: 'unavailable' };

export const MEANING_GATE: Gate<MeaningInput, MeaningVerdict> = {
  id: 'read.onboarding',
  // 2: the time question joined (27 Sep 2026).
  // 3: the safety questions joined (27 Sep 2026).
  version: 3,
  rule: ({ text }) => (crisisRule(text) ? { kind: 'crisis' } : null),
  state: ({ step, text }) => ({ question: step, answer: text }),
  questions: ({ step }) => ({
    ...SAFETY_QUESTIONS,
    meaning: {
      type: 'choice',
      instructions: `A new learner answered an onboarding question in their own words (state.answer). Which option best describes what they meant? ${UNTRUSTED}`,
      criteria: JEV_OPTIONS[step] ?? {},
    },
  }),
  read: (answers, { step }) => {
    if (readSafety(answers).crisis) return { kind: 'crisis' };
    const read = readChoice(
      answers.meaning,
      Object.keys(JEV_OPTIONS[step] ?? {}),
    );
    return read.kind === 'sure'
      ? { kind: 'sure', value: read.value }
      : { kind: 'unsure' };
  },
  fallback: () => ({ kind: 'unavailable' }),
  key: ({ step, text }) => `${step}|${normalise(text)}`,
  timeoutMs: 5_000,
};
