/**
 * Everything the coach can say back when a learner types something. Jev
 * (lib/decisions) only picks one of these; it never writes words of its
 * own (CLAUDE.md rules 2 and 3). Plain, short and kind.
 *
 * The support lines were checked on 26 Sep 2026: Ghana's Mental Health
 * Authority toll-free line (graphic.com.gh, businessghana.com), 112 as the
 * emergency number in Ghana and Nigeria, and findahelpline.com, which keeps
 * free, confidential lines for every country up to date. Recheck them
 * before any launch.
 */

import type { ReflectVerdict } from '../lib/decisions/reflect.ts';

export const REFLECT = {
  save: 'Save my answer',
  saveAgain: 'Save again',
  saving: 'Saving…',
  reply: {
    concrete: 'That’s specific enough to act on. Saved to your notes.',
    vague:
      'That’s a start. Make it one thing you’d actually do: a rule, a number or a habit.',
    unsure: 'Say a little more: what exactly would you do?',
    short: 'Say a bit more, in your own words. A sentence is plenty.',
    off_topic:
      'Saved. That reads like a different question, though. Have another go at this one?',
    tip: 'Lessons won’t tell you what to buy. They teach you to judge a call yourself, whoever makes it; Signals shows what our rules see, with the reasons and the record. Saved to your notes.',
    kept: 'Saved to your notes.',
    crisis: '',
  } satisfies Record<ReflectVerdict, string>,
  /** After the one follow-up, whatever it says: kept, no judgement. */
  second: 'Saved to your notes. You can read them any time on Me.',
} as const;

export const SUPPORT = {
  title: 'You don’t have to carry this alone',
  body: 'Losing money can hit hard, and some of what you wrote sounds heavy. The lessons can wait. Talking to someone today can help.',
  lines: [
    {
      label: 'Ghana: Mental Health Authority, free call',
      value: '0800 678 678',
      href: 'tel:0800678678',
    },
    {
      label: 'Any country: free, confidential lines near you',
      value: 'findahelpline.com',
      href: 'https://findahelpline.com',
    },
    {
      label: 'In danger right now: emergency (Ghana and Nigeria)',
      value: '112',
      href: 'tel:112',
    },
  ],
  after:
    'Someone you trust counts too: a friend, family, a pastor or imam, a doctor.',
} as const;

/** The coach screen (/coach) and every reply it can give without a model. */
export const COACH_CHAT = {
  meta: { title: 'Ask the coach' },
  back: '← Your desk',
  title: (brand: string) => `Ask the ${brand} coach`,
  lead: 'Bring a question about a chart, a trading idea or a mistake. Get a plain explanation, then practise it in a lesson.',
  offline:
    'The coach is answering from our lesson guide right now. You still get the lessons that fit your question.',
  prompts: [
    'Why do I keep getting stopped out?',
    'How does leverage change my risk?',
    'How can I practise reading charts?',
  ],
  you: 'You',
  source: { ai: 'AI coach', guide: 'Lesson guide' },
  practise: (title: string) => `Practise: ${title}`,
  signals: 'See today’s signals, with their reasons and record',
  thinking: 'Reading your question…',
  error:
    'The coach couldn’t answer just now. Your question is still here: try again, or open the lessons.',
  label: 'Your question',
  placeholder: 'What would you like to understand?',
  ask: 'Ask the coach',
  asking: 'Thinking…',
  privacy:
    'This conversation lasts for this visit. Don’t share account numbers, passwords or anything private.',
  scope:
    'The coach covers our lessons. It can’t see live prices or your broker account, check a trade, place orders or tell you what to buy.',
  how: {
    title: 'A question worth practising',
    steps: [
      'Say what confused you.',
      'Read the explanation and ask a follow-up.',
      'Test the idea in the lesson it suggests.',
    ],
  },
  all: 'Explore all lessons →',
  guide: (brand: string, query: string, title: string) =>
    `${brand} teaches this by doing. For “${query}”, start with “${title}”: you can test the idea with pretend money.`,
  guideNone: (brand: string) =>
    `${brand} teaches how markets work, reading charts, managing risk and building a strategy, all through lessons you play. Pick a course, or try another question.`,
  tip: 'The coach won’t tell you what to buy: nobody can promise where a price goes. These lessons teach you to judge a call yourself, whoever makes it. Signals show what our fixed rules see, with the reasons against and the full record.',
  busy: 'You’ve asked a lot in a short time. Here’s the lesson guide while the coach catches up.',
} as const;

export const ASK_REPLY = {
  thinking: 'Looking…',
  either: 'Did you mean one of these?',
  tip: 'Lessons won’t tell you what to buy. These teach you to judge a call yourself, whoever makes it:',
  signals:
    'Want calls with their reasons and their record? See today’s signals',
} as const;
