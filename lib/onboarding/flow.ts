/**
 * Onboarding as a conversation: the coach asks, the learner answers in their
 * own words (or taps a suggestion), and this file works out what they meant.
 *
 * Deliberately small and pure:
 *
 * - `understand(step, text)` reads a free-text answer with plain patterns.
 *   When it isn't sure it says so, and the screen either asks Jev (the
 *   one-of question in `JEV_OPTIONS`, hedge band applied, CLAUDE.md rule 3)
 *   or asks the learner a narrower follow-up. Nothing is guessed.
 * - `placement(profile)` turns the answers into where to start on the
 *   roadmap, and the first three lessons.
 *
 * Adding a question is: a step here, its patterns, its words in
 * content/onboarding.ts, and checks. The screen doesn't change.
 */

import { recoveryBp } from '../engines/risk.ts';

export const STEPS = [
  'name',
  'goal',
  'experience',
  'markets',
  'recovery',
  'scam',
  'time',
] as const;
export type Step = (typeof STEPS)[number];

export const GOALS = [
  'ipo',
  'income',
  'improve',
  'recover',
  'curious',
] as const;
export type Goal = (typeof GOALS)[number];
export const EXPERIENCES = ['none', 'dabbled', 'active'] as const;
export type Experience = (typeof EXPERIENCES)[number];
export const MARKETS = [
  'local',
  'us',
  'forex',
  'crypto',
  'commodities',
] as const;
export type Market = (typeof MARKETS)[number];
export const SCAM_READS = ['trusting', 'wary', 'sharp'] as const;
export type ScamRead = (typeof SCAM_READS)[number];
export const MINUTES = [5, 15, 30] as const;
export type Minutes = (typeof MINUTES)[number];

export type Profile = {
  name?: string;
  goal?: Goal;
  experience?: Experience;
  markets?: Market[];
  /** Their answer to "lose half, what gets you back?", in basis points; null for "don't know". */
  recoveryAnswerBp?: number | null;
  scam?: ScamRead;
  minutes?: Minutes;
};

export type Understood<T> = { kind: 'sure'; value: T } | { kind: 'unsure' };

const sure = <T>(value: T): Understood<T> => ({ kind: 'sure', value });
const UNSURE = { kind: 'unsure' } as const;

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

/* ── Each question's reader ───────────────────────────────────────────── */

const NAME_LEAD =
  /^(hi|hello|hey|my name is|my name's|name is|i am|i'm|im|call me|it's|its|they call me)\b[\s,:-]*/i;

export function readName(raw: string): Understood<string> {
  let text = raw.trim().replace(/[.!]+$/, '');
  for (let i = 0; i < 3; i += 1) text = text.replace(NAME_LEAD, '').trim();
  const first = text.split(/\s+/).slice(0, 2).join(' ');
  const clean = first.replace(/[^\p{L}\p{M}' -]/gu, '').trim();
  if (clean.length < 1 || clean.length > 24) return UNSURE;
  return sure(
    clean
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  );
}

export function readGoal(raw: string): Understood<Goal> {
  const text = raw.toLowerCase();
  if (has(text, /\bipo\b|dangote|refinery|public offer|allot/))
    return sure('ipo');
  if (
    has(
      text,
      /\blost\b|\blose\b|losing|blew|burn(t|ed)|wiped|scammed|got scammed/,
    )
  )
    return sure('recover');
  if (
    has(
      text,
      /already trade|i trade|been trading|trade already|better at|improve|consistent|profitable|my strategy/,
    )
  )
    return sure('improve');
  if (
    has(
      text,
      /income|extra|side|hustle|\bearn|salary|make money|more money|financial freedom/,
    )
  )
    return sure('income');
  if (
    has(
      text,
      /curious|learn|understand|know more|just looking|interest|explore/,
    )
  )
    return sure('curious');
  return UNSURE;
}

export function readExperience(raw: string): Understood<Experience> {
  const text = raw.toLowerCase();
  if (
    has(
      text,
      /every ?day|daily|weekly|\d+\s*(years?|yrs?|months?)|full[- ]?time|regularly|active(ly)?|for years|a lot/,
    )
  )
    return sure('active');
  if (
    has(
      text,
      /once|twice|a bit|a little|few times|tried|small|dabbl|sometimes|not much|briefly/,
    )
  )
    return sure('dabbled');
  if (
    has(
      text,
      /^\s*(no|nope|nah|never)\b|never|not yet|not really|zero|haven'?t|have not|none/,
    )
  )
    return sure('none');
  return UNSURE;
}

const MARKET_PATTERNS: [Market, RegExp][] = [
  [
    'local',
    /\bngx\b|\bnse\b|\bgse\b|nigerian (stock|share)|ghana(ian)? (stock|share)|local (stock|share)|dangote|\bmtn\b/,
  ],
  [
    'us',
    /\bus stocks?\b|\bu\.s\.?\b|american|nasdaq|tesla|apple|s&p|wall street|foreign stocks?/,
  ],
  ['forex', /forex|\bfx\b|currenc|eur ?usd|gbp|\bpairs?\b|dollar/],
  ['crypto', /crypto|bitcoin|\bbtc\b|\beth\b|usdt|\bcoins?\b|binance|memecoin/],
  ['commodities', /commodit|\bgold\b|\boil\b|cocoa|xau/],
];

export function readMarkets(raw: string): Understood<Market[]> {
  const text = raw.toLowerCase();
  if (has(text, /\ball\b|everything|all of them|any/))
    return sure([...MARKETS]);
  const found = MARKET_PATTERNS.filter(([, pattern]) => has(text, pattern)).map(
    ([market]) => market,
  );
  // "Stocks" on its own means the stocks at home; "US stocks" doesn't.
  if (
    has(text, /\bstocks?\b|\bshares?\b|equit/) &&
    !found.includes('local') &&
    !found.includes('us')
  )
    found.unshift('local');
  if (found.length) return sure(found);
  // "Not sure yet" is a fine answer: start with the markets everyone meets.
  if (has(text, /not sure|don'?t know|no idea|dunno|undecided|help me/))
    return sure([]);
  return UNSURE;
}

const NUMBER_WORDS: [RegExp, number][] = [
  [/double|twice|hundred|\b2x\b|two times/, 10_000],
  [/\bhalf\b|fifty/, 5_000],
];

export function readRecovery(raw: string): Understood<number | null> {
  const text = raw.toLowerCase();
  if (has(text, /don'?t know|no idea|not sure|dunno|idk|pass/))
    return sure(null);
  const number = /(\d+(?:\.\d+)?)\s*(%|percent|per cent)?/.exec(text);
  if (number) {
    const value = Number(number[1]);
    if (value >= 0 && value <= 1_000) return sure(Math.round(value * 100));
  }
  for (const [pattern, bp] of NUMBER_WORDS)
    if (has(text, pattern)) return sure(bp);
  return UNSURE;
}

/** True when the learner's answer is within 5 points of the real one (100%). */
export function recoveryRight(answerBp: number | null | undefined): boolean {
  if (answerBp == null) return false;
  return Math.abs(answerBp - recoveryBp(5_000)) <= 500;
}

export function readScam(raw: string): Understood<ScamRead> {
  const text = raw.toLowerCase();
  if (
    has(
      text,
      /scam|fraud|ponzi|fake|red flag|too good|\blie\b|lying|419|mmm|run away|no way/,
    )
  )
    return sure('sharp');
  if (
    has(
      text,
      /sign me|how (do|can) i join|where do i (pay|join)|i'?d join|count me in|i'?m in\b/,
    )
  )
    return sure('trusting');
  if (
    has(
      text,
      /proof|evidence|check|\bsec\b|registered|verify|careful|depends|ask|not sure/,
    )
  )
    return sure('wary');
  if (
    has(text, /great|nice|sign me|interesting|join|legit|good|cool|amazing|yes/)
  )
    return sure('trusting');
  return UNSURE;
}

export function readMinutes(raw: string): Understood<Minutes> {
  const text = raw.toLowerCase();
  if (has(text, /\b(30|45|60|thirty|forty|an hour|hour|hours|plenty|lots?)\b/))
    return sure(30);
  if (has(text, /\b(15|20|fifteen|twenty|quarter)\b/)) return sure(15);
  if (has(text, /\b(5|10|five|ten|little|busy|few min|small)\b/))
    return sure(5);
  return UNSURE;
}

/** Read an answer to `step`. */
export function understand(step: Step, text: string): Understood<unknown> {
  switch (step) {
    case 'name':
      return readName(text);
    case 'goal':
      return readGoal(text);
    case 'experience':
      return readExperience(text);
    case 'markets':
      return readMarkets(text);
    case 'recovery':
      return readRecovery(text);
    case 'scam':
      return readScam(text);
    case 'time':
      return readMinutes(text);
  }
}

/** Apply a reading to the profile. */
export function answer(profile: Profile, step: Step, value: unknown): Profile {
  switch (step) {
    case 'name':
      return { ...profile, name: value as string };
    case 'goal':
      return { ...profile, goal: value as Goal };
    case 'experience':
      return { ...profile, experience: value as Experience };
    case 'markets':
      return { ...profile, markets: value as Market[] };
    case 'recovery':
      return { ...profile, recoveryAnswerBp: value as number | null };
    case 'scam':
      return { ...profile, scam: value as ScamRead };
    case 'time':
      return { ...profile, minutes: value as Minutes };
  }
}

/** The next unanswered step, or null when onboarding is done. */
export function nextStep(
  profile: Profile,
  skip: readonly Step[] = [],
): Step | null {
  const answered: Record<Step, boolean> = {
    name: profile.name !== undefined,
    goal: profile.goal !== undefined,
    experience: profile.experience !== undefined,
    markets: profile.markets !== undefined,
    recovery: profile.recoveryAnswerBp !== undefined,
    scam: profile.scam !== undefined,
    time: profile.minutes !== undefined,
  };
  return STEPS.find((step) => !answered[step] && !skip.includes(step)) ?? null;
}

/** How many questions have an answer, for the progress bar. */
export function answeredCount(profile: Profile): number {
  return STEPS.filter(
    (step) =>
      nextStep(
        profile,
        STEPS.filter((other) => other !== step),
      ) !== step,
  ).length;
}

/**
 * The one-of question Jev gets when the patterns aren't sure (steps with a
 * fixed set of answers only). Keys are the values `understand` would return.
 */
export const JEV_OPTIONS: Partial<Record<Step, Record<string, string>>> = {
  goal: {
    ipo: 'They are here because of an IPO, such as the Dangote Refinery offer',
    income: 'They want extra income from trading or investing',
    improve: 'They already trade and want to get better',
    recover:
      'They lost money trading or to a scheme and want to understand why',
    curious: 'They are curious and want to understand markets',
  },
  experience: {
    none: 'They have never traded or invested with real money',
    dabbled: 'They have tried it a few times or with small amounts',
    active: 'They trade or invest regularly',
  },
  scam: {
    trusting: 'They find the offer attractive or would consider joining',
    wary: 'They would want proof or to check before trusting it',
    sharp: 'They recognise it as a scam',
  },
};

/* ── Where to start ───────────────────────────────────────────────────── */

export type Reason =
  | 'ipo'
  | 'new'
  | 'dabbled'
  | 'risk_gap'
  | 'recover'
  | 'ready_for_ta'
  | 'scam_guard';

export type Placement = {
  /** Index into STAGES in content/curriculum.ts. */
  stage: number;
  /** Up to three lesson ids, in order. */
  lessons: string[];
  reasons: Reason[];
};

export function placement(profile: Profile): Placement {
  const reasons: Reason[] = [];
  let stage: number;
  let lessons: string[];
  const knowsRecovery = recoveryRight(profile.recoveryAnswerBp);

  if (profile.goal === 'recover') {
    stage = 2;
    lessons = ['r1', 'r4', 'm5'];
    reasons.push('recover');
  } else if (profile.goal === 'ipo') {
    stage = 0;
    lessons = ['f0', 'm0', 'm2'];
    reasons.push('ipo');
  } else if (profile.experience === 'active') {
    if (knowsRecovery) {
      stage = 3;
      lessons = ['t3', 't2', 'r2'];
      reasons.push('ready_for_ta');
    } else {
      stage = 2;
      lessons = ['r1', 'r4', 'r2'];
      reasons.push('risk_gap');
    }
  } else if (profile.experience === 'dabbled') {
    stage = 1;
    lessons = ['c2', 'c5', 'r1'];
    reasons.push('dabbled');
  } else {
    stage = 0;
    lessons = ['m0', 'm5', 'c2'];
    reasons.push('new');
  }

  // Anyone who'd consider the "doubles every month" offer sees who makes
  // money from them first, whatever else they know.
  if (profile.scam === 'trusting') {
    lessons = ['m6', ...lessons.filter((id) => id !== 'm6')].slice(0, 3);
    reasons.push('scam_guard');
  }
  return { stage, lessons, reasons };
}
