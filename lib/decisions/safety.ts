/**
 * Safety on anything a learner types (plan §6.2, `safety.in`): are they in
 * crisis, and are they asking to be told what to buy?
 *
 * Two layers, because the first must never depend on a network:
 *
 * - **Rules** catch the plain phrases, in English and Pidgin, with no call
 *   and no wait. They are narrow on purpose: "this strategy is killing me"
 *   is not a crisis, and a false alarm on every sigh would teach people to
 *   ignore the card.
 * - **Jev** reads the rest, as two yes/no questions asked alongside each
 *   gate's own (one call). A hedged crisis answer takes the safer path and
 *   shows the support card: it's gentle enough to be harmless when wrong.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { UNTRUSTED, type JevAnswer, type Question } from './jev.ts';
import { readYesNo } from './read.ts';

const CRISIS = [
  /\b(kill|killing|end|ending|take|taking)\s+(my\s*self|myself|my\s+(own\s+)?life)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want|wanna|wan|going|gonna)\s+(to\s+)?die\b/i,
  /\bmake\s+i\s+die\b/i,
  // "I no wan live again", "I don't want to live anymore", but not "…live in Accra".
  /\b(don'?t|do\s+not|no|not)\s+(wan|want|wanna)\s+(to\s+)?live\s+(again|anymore|any\s*more)\b/i,
  /\b(don'?t|do\s+not|no)\s+(wan|want|wanna)\s+(to\s+)?live\s*[.!]*$/i,
  /\bbetter\s+off\s+dead\b/i,
  // "I tire for life" (Pidgin), "tired of living", but not "tired of this lifestyle".
  /\btired?\s+(for|of)\s+(this\s+|my\s+)?(life|living)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|go\s+on)\b/i,
  /\b(hurt|harm|cut)(ing)?\s+my\s*self\b/i,
  /\bself[-\s]?harm/i,
];

const TIP_SEEKING = [
  /\b(give|send|share|drop)\s+(me\s+)?(some\s+|a\s+|your\s+|the\s+)?(signals?|tips?|calls?)\b/i,
  /\bwhat\s+(stock|share|coin|crypto|pair|token)s?\s+(should|to|can)\s+i\s+buy\b/i,
  /\bwhich\s+(stock|share|coin|crypto|pair|token)s?\s+(will|go|is\s+going\s+to|gonna)\s+(go\s+up|rise|blow|pump|moon)\b/i,
  /\b(best|top)\s+(stock|share|coin|crypto|token)s?\s+(to\s+)?(buy|invest)/i,
  /\b(go|will)\s+(blow|pump|moon)\b/i,
];

/** A plain phrase of crisis: no need to ask anyone. */
export function crisisRule(text: string): boolean {
  const plain = straight(text);
  return CRISIS.some((pattern) => pattern.test(plain));
}

/** A plain request for a trade call or tip. */
export function tipRule(text: string): boolean {
  const plain = straight(text);
  return TIP_SEEKING.some((pattern) => pattern.test(plain));
}

/** Phones type curly apostrophes; the patterns are written with straight ones. */
function straight(text: string): string {
  return text.replace(/[\u2018\u2019\u02bc]/g, "'");
}

/** The two safety questions, asked alongside a gate's own. `state.text` holds the learner's words. */
export const SAFETY_QUESTIONS: Record<'in_crisis' | 'wants_tip', Question> = {
  in_crisis: {
    type: 'noul',
    instructions: `Does the learner's text (state.text) say or strongly suggest they are in crisis: thinking about ending their life or harming themselves, or unable to cope after a loss? Ordinary worry, frustration or regret about money is not a crisis. ${UNTRUSTED}`,
    criteria: {
      true: 'Signs of crisis, self-harm or not being able to cope',
      false:
        'No sign of crisis; everyday worry, frustration or regret about money',
    },
  },
  wants_tip: {
    type: 'noul',
    instructions: `Is the learner asking to be told what to buy or sell, when to trade, or which asset will go up (a trade call, signal or tip)? Asking how something works, or what a lesson means, is not asking for a tip. ${UNTRUSTED}`,
    criteria: {
      true: 'Asks for a trade call, signal or tip',
      false: 'Asks to understand something, or says something else',
    },
  },
};

export type SafetyRead = { crisis: boolean; tip: boolean };

/**
 * A hedged crisis answer counts as a crisis: the safer path (the support
 * card) is the right mistake to make. A tip request counts only when Jev is
 * sure, because a hedged one would replace a helpful answer with a refusal.
 */
export function readSafety(answers: Record<string, JevAnswer>): SafetyRead {
  const crisis = readYesNo(answers.in_crisis);
  const tip = readYesNo(answers.wants_tip);
  return {
    crisis:
      crisis.kind !== 'missing' && (crisis.kind === 'hedged' || crisis.value),
    tip: tip.kind === 'sure' && tip.value,
  };
}

/** Collapse spacing and case, so the cache sees "Hello  there" and "hello there" as one. */
export function normalise(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** What a learner typed, made safe to send: trimmed, control characters gone, capped. */
export function clean(text: string, max: number): string {
  // Tabs and line breaks stay; other control characters go. By code unit,
  // so emoji and accented letters pass through whole.
  let kept = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code !== 127)
    )
      kept += text[i];
  }
  return kept.trim().slice(0, max);
}
