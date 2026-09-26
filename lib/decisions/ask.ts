/**
 * The ask box's gate: someone types what they want to understand, and gets
 * lessons that teach it. The keyword search (lib/curriculum/search.ts)
 * answers first, instantly and free; Jev is asked only when the words don't
 * match any lesson's, as one-of question over the live lessons plus "none".
 * It can only point at lessons that exist (CLAUDE.md rule 2).
 *
 * A hedged pick shows the two likeliest lessons as "did you mean"; a tip
 * request gets the lessons about who profits from tips instead of a refusal
 * alone; a crisis gets the support card.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { LESSONS } from '../../content/curriculum.ts';
import { searchLessons } from '../curriculum/search.ts';
import { UNTRUSTED, type JevAnswer } from './jev.ts';
import type { Gate } from './gate.ts';
import { readChoice } from './read.ts';
import {
  SAFETY_QUESTIONS,
  crisisRule,
  normalise,
  readSafety,
  tipRule,
} from './safety.ts';

export const ASK_MAX_CHARS = 200;

/** A keyword or title match at least this strong is trusted without asking. */
export const KEYWORD_SCORE = 4;

/** Where a request for tips is pointed: how traders think, and who makes money from you. */
export const TIP_LESSONS = ['m0', 'm6'] as const;

export type AskVerdict =
  | { kind: 'lessons'; ids: string[] }
  /** Hedged: the two likeliest, for "did you mean". */
  | { kind: 'either'; ids: string[] }
  | { kind: 'none' }
  | { kind: 'tip'; ids: string[] }
  | { kind: 'crisis' };

function liveLessons() {
  return LESSONS.filter((lesson) => lesson.status === 'live');
}

function keywordIds(text: string, minScore = 1): string[] {
  return searchLessons(text)
    .filter((match) => match.score >= minScore)
    .map((match) => match.lesson.id);
}

/**
 * What the phone can answer by itself, instantly: crisis and tip phrases,
 * and anything the keywords match well. Null means ask the server.
 */
export function askRule(text: string): AskVerdict | null {
  if (crisisRule(text)) return { kind: 'crisis' };
  if (tipRule(text)) return { kind: 'tip', ids: [...TIP_LESSONS] };
  const strong = keywordIds(text, KEYWORD_SCORE);
  return strong.length ? { kind: 'lessons', ids: strong } : null;
}

/** Whatever the keywords found, however weakly: the answer when Jev can't be asked. */
export function askFallback(text: string): AskVerdict {
  const weak = keywordIds(text);
  return weak.length ? { kind: 'lessons', ids: weak } : { kind: 'none' };
}

export const ASK_GATE: Gate<{ text: string }, AskVerdict> = {
  id: 'route.ask',
  version: 1,
  rule: ({ text }) => askRule(text),
  state: ({ text }) => ({ text }),
  questions: () => ({
    ...SAFETY_QUESTIONS,
    lesson: {
      type: 'choice',
      instructions: `Someone typed what they want to understand about trading or investing (state.text). Which lesson teaches it best? Pick "none" if no lesson does. ${UNTRUSTED}`,
      criteria: {
        ...Object.fromEntries(
          liveLessons().map((lesson) => [
            lesson.id,
            `${lesson.title}. ${lesson.practice}`,
          ]),
        ),
        none: 'No lesson here teaches this',
      },
    },
  }),
  read: (answers: Record<string, JevAnswer>, { text }) => {
    const safety = readSafety(answers);
    if (safety.crisis) return { kind: 'crisis' };
    if (safety.tip) return { kind: 'tip', ids: [...TIP_LESSONS] };
    const ids = [...liveLessons().map((lesson) => lesson.id), 'none'];
    const pick = readChoice(answers.lesson, ids);
    if (pick.kind === 'sure')
      return pick.value === 'none'
        ? { kind: 'none' }
        : { kind: 'lessons', ids: [pick.value] };
    if (pick.kind === 'hedged') {
      const likeliest = Object.entries(answers.lesson?.probabilities ?? {})
        .filter(([id]) => id !== 'none' && ids.includes(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([id]) => id);
      if (likeliest.length) return { kind: 'either', ids: likeliest };
    }
    // Missing, or a hedge with nothing to offer: whatever the keywords found.
    return askFallback(text);
  },
  fallback: ({ text }) => askFallback(text),
  key: ({ text }) => normalise(text),
  timeoutMs: 5_000,
};
