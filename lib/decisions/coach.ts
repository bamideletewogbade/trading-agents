/**
 * The coach's gate: before a written reply, is this person in crisis, or
 * asking to be told what to buy? The same two safety questions every gate
 * asks (safety.ts), through `decide()`, so the coach shares the breaker,
 * cache, per-person limit and ledger with the rest.
 *
 * A crisis, by rule or a yes or hedged answer, shows the support card and
 * no reply. A sure tip request gets the lessons on judging a call and a
 * pointer to Signals, which show their reasons and record; a hedged one
 * gets the ordinary answer, because a refusal in place of help is the worse
 * mistake there. Without Jev, the rules still catch the plain phrases.
 *
 * The reply itself is written by a chat model (lib/intelligence/openrouter),
 * and `guardReply` holds it to rule 1: it may repeat numbers the learner
 * wrote or the matched lessons name, and small counts, never originate one.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { checkNumbers, numbersIn } from '../intelligence/guard.ts';
import { UNTRUSTED } from './jev.ts';
import type { Gate } from './gate.ts';
import {
  SAFETY_QUESTIONS,
  crisisRule,
  normalise,
  readSafety,
  tipRule,
} from './safety.ts';

export const COACH_MAX_CHARS = 1000;
/** Earlier questions sent back for context: the last few, each capped. */
export const COACH_HISTORY = { turns: 3, chars: 400 } as const;

export type CoachVerdict = 'crisis' | 'tip' | 'ok';

export const COACH_GATE: Gate<{ text: string }, CoachVerdict> = {
  id: 'safety.coach',
  version: 1,
  rule: ({ text }) =>
    crisisRule(text) ? 'crisis' : tipRule(text) ? 'tip' : null,
  state: ({ text }) => ({ text }),
  questions: () => ({ ...SAFETY_QUESTIONS }),
  read: (answers) => {
    const safety = readSafety(answers);
    return safety.crisis ? 'crisis' : safety.tip ? 'tip' : 'ok';
  },
  // The rules already caught the plain phrases; the rest gets an answer.
  fallback: () => 'ok',
  key: ({ text }) => normalise(text),
  timeoutMs: 4_000,
};

export type LessonContext = { id: string; title: string; practice: string };

/**
 * The system prompt. Instructions only: the learner's words go in the user
 * turn, labelled as data, never spliced in here.
 */
export function coachSystem(brand: string, lessons: LessonContext[]): string {
  const known = lessons.length
    ? lessons.map((l) => `- ${l.id}: ${l.title}. ${l.practice}`).join('\n')
    : '- (none matched; suggest none rather than invent one)';
  return [
    `You are the learning coach for ${brand}, which teaches trading and investing through short interactive lessons with pretend money.`,
    'Answer the learner’s question with clear, plain explanation and no hype, in 2 to 4 sentences, under 120 words.',
    'Rules:',
    '1. Never tell anyone what to buy or sell, when to trade, or where a price is going. Explain how things work and how to manage risk.',
    '2. Write no numbers, prices, percentages or statistics of your own. You may repeat a number the learner wrote or one in a lesson title below.',
    '3. Suggest up to 3 lesson ids, only from this list:',
    known,
    UNTRUSTED,
  ].join('\n');
}

/** The user turn: earlier questions and this one, each marked as the learner's words. */
export function coachUser(
  message: string,
  previous: readonly string[],
): string {
  const earlier = previous.length
    ? `Earlier questions from the learner:\n${previous.map((q) => `- ${q}`).join('\n')}\n\n`
    : '';
  return `${earlier}The learner asks:\n${message}`;
}

/**
 * Rule 1 for written replies: every number must come from the learner's own
 * words or the lessons offered, or be a small count. False means use the
 * authored guide instead.
 */
export function guardReply(
  reply: string,
  learnerText: string,
  lessons: LessonContext[],
): boolean {
  const allowed = new Set(
    numbersIn(
      [learnerText, ...lessons.map((l) => `${l.title} ${l.practice}`)].join(
        ' ',
      ),
    ),
  );
  return checkNumbers(reply, allowed).ok;
}
