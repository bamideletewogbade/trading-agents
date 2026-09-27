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

export const ASK_REPLY = {
  thinking: 'Looking…',
  either: 'Did you mean one of these?',
  tip: 'Lessons won’t tell you what to buy. These teach you to judge a call yourself, whoever makes it:',
  signals:
    'Want calls with their reasons and their record? See today’s signals',
} as const;
