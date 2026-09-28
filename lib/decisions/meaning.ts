/**
 * The onboarding gate: when the chat's plain patterns can't read an answer
 * (lib/onboarding/flow.ts), Jev picks one of the step's fixed options. A
 * hedged pick is "unsure", and the coach asks a narrower question instead
 * of guessing. Through `decide()`, so it shares the breaker, cache, limit
 * and ledger with every other gate.
 *
 * The markets question has more than one right answer, so it isn't a
 * one-of: each market is its own yes/no, and any hedged one makes the whole
 * reading "unsure". A many-way choice splits its probability across options
 * that can all be true, and reads as a hedge when it isn't one.
 *
 * Like every gate that reads what a learner types, it asks the safety
 * questions too: a crisis (by rule, or a yes or hedged answer from Jev)
 * comes back as "crisis", and the chat shows the support card.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { UNTRUSTED, type JevAnswer, type Question } from './jev.ts';
import type { Gate } from './gate.ts';
import { readChoice, readYesNo } from './read.ts';
import {
  SAFETY_QUESTIONS,
  crisisRule,
  normalise,
  readSafety,
} from './safety.ts';
import { JEV_OPTIONS, MARKETS, type Step } from '../onboarding/flow.ts';

export const MEANING_MAX_CHARS = 280;

export type MeaningInput = { step: Step; text: string };
export type MeaningVerdict =
  | { kind: 'sure'; value: string | string[] }
  | { kind: 'unsure' }
  | { kind: 'crisis' }
  | { kind: 'unavailable' };

function marketQuestions(): Record<string, Question> {
  const options = JEV_OPTIONS.markets ?? {};
  return Object.fromEntries(
    MARKETS.map((market) => [
      `market_${market}`,
      {
        type: 'noul',
        instructions: `A new learner was asked which markets they are curious about and wrote state.text. Do they name or clearly mean this one: ${options[market]}? Mentioning it only to rule it out is a no. ${UNTRUSTED}`,
        criteria: {
          true: 'They want to learn about this market',
          false: 'They do not mention it, or rule it out',
        },
      },
    ]),
  );
}

function readMarkets(answers: Record<string, JevAnswer>): MeaningVerdict {
  const chosen: string[] = [];
  for (const market of MARKETS) {
    const read = readYesNo(answers[`market_${market}`]);
    if (read.kind !== 'sure') return { kind: 'unsure' };
    if (read.value) chosen.push(market);
  }
  // Nothing named: the patterns already catch "not sure", so this is a miss.
  return chosen.length ? { kind: 'sure', value: chosen } : { kind: 'unsure' };
}

export const MEANING_GATE: Gate<MeaningInput, MeaningVerdict> = {
  id: 'read.onboarding',
  // 2: the time question joined (27 Sep 2026).
  // 3: the safety questions joined (27 Sep 2026).
  // 4: the learner's words moved to state.text, where the safety questions
  //    look; markets joined as yes/no questions (27 Sep 2026).
  version: 4,
  rule: ({ text }) => (crisisRule(text) ? { kind: 'crisis' } : null),
  state: ({ step, text }) => ({ question: step, text }),
  questions: ({ step }) => ({
    ...SAFETY_QUESTIONS,
    ...(step === 'markets'
      ? marketQuestions()
      : {
          meaning: {
            type: 'choice',
            instructions: `A new learner answered an onboarding question in their own words (state.text). Which option best describes what they meant? ${UNTRUSTED}`,
            criteria: JEV_OPTIONS[step] ?? {},
          },
        }),
  }),
  read: (answers, { step }) => {
    if (readSafety(answers).crisis) return { kind: 'crisis' };
    if (step === 'markets') return readMarkets(answers);
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
