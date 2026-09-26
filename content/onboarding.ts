import type {
  Experience,
  Goal,
  Market,
  Minutes,
  Profile,
  Reason,
  ScamRead,
  Step,
} from '../lib/onboarding/flow.ts';

/**
 * Everything the coach says during onboarding, and the suggestions under
 * each question. Suggestions carry a value, so tapping one never needs
 * reading; typing goes through lib/onboarding/flow.ts.
 *
 * The coach is called Sika. Warm, quick, a little playful, never pushy.
 * Five to seven short questions, then a starting point. Numbers the coach
 * says arrive formatted from an engine.
 */

export const COACH = {
  name: 'Sika',
  role: 'Your coach',
  initial: 'S',
};

type Chip<T> = { label: string; value: T };

export const ONBOARDING = {
  meta: { title: 'Let’s find your starting point' },
  progress: (done: number, total: number) => `${done} of ${total}`,
  placeholder: 'Type your answer…',
  send: 'Send',
  typing: 'Sika is typing',
  restart: 'Start over',
  hello: [
    'Hi! I’m Sika, your coach here. 👋',
    'Before any lessons, a few quick questions, so I don’t bore you with stuff you already know. Answer however you like. Typing is fine, tapping is fine.',
  ],

  ask: {
    name: 'First, what should I call you?',
    goal: (name: string) => `Nice to meet you, ${name}. What brought you here?`,
    experience:
      'Have you ever bought stocks, forex or crypto, with real money?',
    markets: 'Which markets are you most curious about?',
    recovery: (loss: string) =>
      `Quick one, no pressure, and there’s no wrong answer here: if you lose ${loss} of your account, how much do you need to make to get back to where you started?`,
    scam: 'Last scenario. A friend says his “account manager” doubles money every month, and he can add you. First thought?',
    time: 'And on a normal day, how much time can you give this?',
  } satisfies Record<Step, unknown>,

  chips: {
    name: [] as Chip<string>[],
    goal: [
      { label: 'The Dangote IPO got me curious', value: 'ipo' },
      { label: 'Extra income from trading', value: 'income' },
      { label: 'I trade and want to get better', value: 'improve' },
      { label: 'I lost money and want to know why', value: 'recover' },
      { label: 'Just curious', value: 'curious' },
    ] as Chip<Goal>[],
    experience: [
      { label: 'Never', value: 'none' },
      { label: 'A few times', value: 'dabbled' },
      { label: 'Yes, regularly', value: 'active' },
    ] as Chip<Experience>[],
    markets: [
      { label: 'NGX / GSE stocks', value: ['local'] },
      { label: 'US stocks', value: ['us'] },
      { label: 'Forex', value: ['forex'] },
      { label: 'Crypto', value: ['crypto'] },
      { label: 'Gold, oil, cocoa', value: ['commodities'] },
      { label: 'Not sure yet', value: [] },
    ] as Chip<Market[]>[],
    recovery: [
      { label: '50%', value: 5_000 },
      { label: '100%', value: 10_000 },
      { label: 'Not sure', value: null },
    ] as Chip<number | null>[],
    scam: [
      { label: 'Sounds great, how do I join?', value: 'trusting' },
      { label: 'I’d want proof first', value: 'wary' },
      { label: 'That’s a scam', value: 'sharp' },
    ] as Chip<ScamRead>[],
    time: [
      { label: '5 minutes', value: 5 },
      { label: '15 minutes', value: 15 },
      { label: '30 minutes or more', value: 30 },
    ] as Chip<Minutes>[],
  },

  /** When the reading isn't sure: a narrower question, with the same chips. */
  clarify: {
    name: 'Sorry, I didn’t catch that. Just your first name is perfect.',
    goal: 'Got it. Which of these is closest?',
    experience: 'Once or twice, or regularly?',
    markets: 'Which of these, roughly? Pick one to start; we cover them all.',
    recovery: 'Just a rough percentage is fine, or tap one.',
    scam: 'Closest to which of these?',
    time: 'Roughly how many minutes? Tap one.',
  } satisfies Record<Step, string>,

  /** What Sika says after hearing each answer. */
  ack: {
    goal: {
      ipo: 'Good timing. Understanding an IPO before you apply puts you ahead of most people talking about it.',
      income:
        'Love that. We’ll build the skill first; income built on skill lasts longer than income built on luck.',
      improve:
        'Nice. Then we’ll skip the basics and look for the gaps that cost you money.',
      recover:
        'Thank you for saying that. Losing money is how most traders start, and it’s exactly what we can fix: risk first.',
      curious: 'Curious is the best way to start. No pressure, just practice.',
    } satisfies Record<Goal, string>,
    experience: {
      none: 'Perfect. You’ve got no bad habits to unlearn.',
      dabbled: 'Nice, so you’ve felt it a little. That helps.',
      active:
        'Then you know the feeling of a trade going wrong. We’ll work with that.',
    } satisfies Record<Experience, string>,
    markets: (count: number) =>
      count === 0
        ? 'No problem. The first lessons work for every market anyway.'
        : 'Noted. I’ll use those in your examples wherever I can.',
    recovery: {
      right: (gain: string) =>
        `Exactly: ${gain}. Most people guess 50%. That one fact is why protecting your money comes before growing it.`,
      wrong: (loss: string, gain: string) =>
        `It’s actually ${gain}. Lose ${loss} and what’s left has to double to get back. It surprises almost everyone, and it’s why we teach risk early.`,
    },
    scam: {
      trusting:
        'I get it, it sounds amazing. We’ll look at exactly how those offers work early on, so you can spot them from far.',
      wary: 'Good instinct. Asking for proof is the right first move.',
      sharp:
        'Sharp. Nothing real doubles every month. You’d be surprised how many people fall for it.',
    } satisfies Record<ScamRead, string>,
    time: {
      5: 'Five minutes a day is enough. Small and steady beats big and rare.',
      15: 'Fifteen minutes is a great rhythm: one lesson a day.',
      30: 'Plenty of room. We’ll keep it deep, not long.',
    } satisfies Record<Minutes, string>,
  },

  summary: {
    lead: (name: string) => `Here’s what I heard, ${name}:`,
    goal: {
      ipo: 'You’re here because of the Dangote IPO',
      income: 'You want extra income, the honest way',
      improve: 'You already trade and want to get better',
      recover: 'You’ve lost money before and want to understand why',
      curious: 'You’re curious about markets',
    } satisfies Record<Goal, string>,
    experience: {
      none: 'You haven’t traded with real money yet',
      dabbled: 'You’ve tried it a few times',
      active: 'You trade regularly',
    } satisfies Record<Experience, string>,
    markets: (labels: string[]) =>
      labels.length
        ? `Most curious about: ${labels.join(', ')}`
        : 'Open to any market',
    minutes: (minutes: number) => `About ${minutes} minutes a day`,
    start: (stage: number, title: string) =>
      `I’d start you at stage ${stage}: ${title}.`,
    reasons: {
      ipo: 'IPO 101 first, since that’s what brought you here.',
      new: 'We start with how prices move, then charts, one step at a time.',
      dabbled: 'You know the basics, so we go straight to reading charts.',
      risk_gap:
        'You trade already, but the recovery question tells me risk is where the money leaks. We fix that first.',
      recover:
        'Risk first: stops, sizing and leverage are usually where losses come from.',
      ready_for_ta:
        'You know your risk maths, so we can go straight to technical analysis.',
      scam_guard:
        'And first, a short one on who makes money from you. It’ll change how those offers look.',
    } satisfies Record<Reason, string>,
    first: 'Your first three lessons',
    go: 'Take me to my desk',
    change: 'Change an answer',
    saved: 'Saved',
    savedLocal: 'Saved on this phone. Create an account to keep it everywhere.',
  },

  marketLabels: {
    local: 'NGX / GSE stocks',
    us: 'US stocks',
    forex: 'forex',
    crypto: 'crypto',
    commodities: 'commodities',
  } satisfies Record<Market, string>,
};

/** The learner's own answer as it appears in their bubble when they tap a chip. */
export function chipLabel(step: Step, value: unknown): string | null {
  const chips = ONBOARDING.chips[step] as Chip<unknown>[];
  const found = chips.find(
    (chip) => JSON.stringify(chip.value) === JSON.stringify(value),
  );
  return found?.label ?? null;
}

export type { Profile };
