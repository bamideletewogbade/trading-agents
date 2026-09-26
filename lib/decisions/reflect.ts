/**
 * The reflection gate (plan §6.2, `assess.explain`): a learner answers a
 * lesson's "reflect" question in their own words, and gets a response that
 * fits what they wrote. Jev only picks which authored response
 * (content/coach.ts); it never writes one (CLAUDE.md rules 2 and 3).
 *
 * One Jev call asks four things together: the two safety questions, whether
 * the words answer the question, and whether they name something concrete.
 * A hedged "concrete" becomes a better question back to the learner, never
 * a guess; a second hedged answer is simply kept, with no judgement.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { UNTRUSTED, type JevAnswer } from './jev.ts';
import type { Gate } from './gate.ts';
import { readYesNo } from './read.ts';
import {
  SAFETY_QUESTIONS,
  crisisRule,
  normalise,
  readSafety,
  tipRule,
} from './safety.ts';

export const REFLECT_MAX_CHARS = 600;

export type ReflectInput = {
  lesson: string;
  /** The reflect beat's question, from the server's copy of the lesson. */
  prompt: string;
  /** What a good answer names, from the lesson (authored), if it says. */
  look?: string;
  text: string;
};

export type ReflectVerdict =
  | 'crisis'
  | 'tip'
  | 'short'
  | 'off_topic'
  | 'concrete'
  | 'vague'
  | 'unsure'
  /** Jev wasn't asked: kept, without a judgement. */
  | 'kept';

/** Too little to judge: fewer than three words or a dozen letters. */
export function tooShort(text: string): boolean {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w));
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  return words.length < 3 || letters < 12;
}

export const REFLECT_GATE: Gate<ReflectInput, ReflectVerdict> = {
  id: 'assess.reflect',
  version: 1,
  rule: (input) => {
    if (crisisRule(input.text)) return 'crisis';
    if (tipRule(input.text)) return 'tip';
    if (tooShort(input.text)) return 'short';
    return null;
  },
  state: (input) => ({ question: input.prompt, text: input.text }),
  questions: (input) => ({
    ...SAFETY_QUESTIONS,
    answers_it: {
      type: 'noul',
      instructions: `A learner was asked the reflection question in state.question and wrote state.text. Does the text respond to that question, even briefly or informally, in any language or mix of languages? ${UNTRUSTED}`,
      criteria: {
        true: 'It responds to the question',
        false: 'It is about something else, or says nothing',
      },
    },
    concrete: {
      type: 'noul',
      instructions: `Does state.text name something concrete: a specific action, rule, number, habit or situation${input.look ? ` (for this question: ${input.look})` : ''}, rather than only a general feeling or intention like "I will be careful"? ${UNTRUSTED}`,
      criteria: {
        true: 'Names something specific the learner would do or has noticed',
        false: 'Only general feelings or intentions',
      },
    },
  }),
  read: (answers: Record<string, JevAnswer>) => {
    const safety = readSafety(answers);
    if (safety.crisis) return 'crisis';
    if (safety.tip) return 'tip';
    const answersIt = readYesNo(answers.answers_it);
    if (answersIt.kind === 'sure' && !answersIt.value) return 'off_topic';
    const concrete = readYesNo(answers.concrete);
    if (concrete.kind === 'sure') return concrete.value ? 'concrete' : 'vague';
    return 'unsure';
  },
  fallback: () => 'kept',
  key: (input) =>
    `${input.lesson}|${normalise(input.prompt)}|${normalise(input.text)}`,
  timeoutMs: 5_000,
};

/** Verdicts that ask the learner to say more, once. */
export function asksAgain(verdict: ReflectVerdict): boolean {
  return verdict === 'short' || verdict === 'vague' || verdict === 'unsure';
}
