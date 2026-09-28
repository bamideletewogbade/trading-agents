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
export const MINUTES = [5, 15, 30, 60] as const;
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

/** Words that answer "what should I call you?" without being a name. */
const NOT_A_NAME = new Set([
  'ok',
  'okay',
  'k',
  'yes',
  'yeah',
  'yh',
  'yep',
  'no',
  'nope',
  'nah',
  'sure',
  'hmm',
  'hm',
  'lol',
  'test',
  'testing',
  'hello',
  'hi',
  'hey',
  'fine',
  'good',
  'well',
  'great',
  'thanks',
  'thank',
  'nothing',
  'idk',
  'what',
  'why',
  'who',
  'how',
  'me',
  'name',
  'coach',
  'there',
  'here',
  'user',
  'guest',
  'none',
  'just',
  'not',
  'new',
  'interested',
  'ready',
  'trader',
  'student',
]);

/** "I'd rather not say": fine, the coach carries on without a name. */
const NO_NAME =
  /\b(rather not|prefer not|don'?t want to (say|tell|share|give)|not telling|won'?t say|skip|pass|no name|anonymous|none of your)\b/;

// A greeting, then a lead-in, longest first so "i am called" wins over
// "i am". The \b stops "Imani" losing its "Im".
const NAME_LEAD =
  /^(?:(?:hi|hello|hey|yo|good (?:morning|afternoon|evening))(?:\s+sika)?\b[\s!-]*)?(?:(?:(?:you can|just|please) )?call me|(?:people|they|everyone) calls? me|my (?:first )?name is|my name'?s|the name'?s|the name is|name'?s|names|name is|i am called|i'?m called|this is|it'?s me|its me|it'?s|its|i am|i'?m)?\b\s*/i;

/** Words that end a name: "Ama and I'm 25", "Ama here". */
const NAME_END =
  /^(and|but|from|here|too|by|i|i'?m|im|am|is|in|at|of|the|a|an|nice|thanks|thank|please)$/i;

const TITLE =
  /^(mr|mrs|ms|miss|dr|prof|chief|alhaji|alhaja|pastor|engr|barr|madam|aunty|auntie|uncle|sir)$/i;

export function readName(raw: string): Understood<string> {
  const text = raw.trim();
  if (has(text.toLowerCase(), NO_NAME)) return sure('');
  // A question back ("why do you need it?") isn't a name.
  if (text.includes('?')) return UNSURE;
  // "Hi Sika, I'm Ama. Nice to meet you": the first piece holding a name.
  const pieces = text
    .replace(/\b(mr|mrs|ms|dr|prof|engr|barr)\./gi, '$1')
    .split(/[,.;!:\n]+/);
  for (const piece of pieces) {
    const name = nameIn(piece);
    if (name) return sure(name);
  }
  return UNSURE;
}

function nameIn(piece: string): string | null {
  let rest = piece.trim();
  for (let i = 0; i < 3; i += 1) rest = rest.replace(NAME_LEAD, '').trim();
  const kept: string[] = [];
  for (const word of rest.split(/\s+/)) {
    const clean = word.replace(/[^\p{L}\p{M}'-]/gu, '');
    if (!clean) continue;
    if (NAME_END.test(clean)) break;
    kept.push(clean);
    if (kept.length === 2) break;
  }
  const [first, second] = kept;
  if (!first || NOT_A_NAME.has(first.toLowerCase())) return null;
  // Two words for a title ("Dr Ama") or a name written as one ("Kwame
  // Mensah"); otherwise the first name, which is what was asked.
  const both =
    second !== undefined &&
    !NOT_A_NAME.has(second.toLowerCase()) &&
    (TITLE.test(first) || (/^\p{Lu}/u.test(first) && /^\p{Lu}/u.test(second)));
  const name = (both ? [first, second] : [first])
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return name.length <= 24 ? name : null;
}

export function readGoal(raw: string): Understood<Goal> {
  const text = raw.toLowerCase();
  if (has(text, /\bipo\b|dangote|refinery|public offer|allot/))
    return sure('ipo');
  // Losing a job is a reason to want income, not a trading loss.
  if (has(text, /lost (my |a )?(job|work)|laid off|unemployed|jobless/))
    return sure('income');
  if (
    has(
      text,
      /\blost\b|\blose\b|losing|\bloss(es)?\b|blew|burn(t|ed)|wiped|scammed|cbex/,
    )
  )
    return sure('recover');
  if (
    has(
      text,
      /already trade|i trade|been trading|trade already|better at|improve|consistent|profitable|my strategy|i'?m a trader|as a trader/,
    )
  )
    return sure('improve');
  if (
    has(
      text,
      /income|extra|\bside\b|hustle|\bearn|salary|money|\brich\b|wealth|financial(ly)? (freedom|free|independen)|invest|sav(e|ing)|grow my|retire|passive|future|child|kids|family|become a (full[- ]?time )?trader|start (trading|investing)|(learn|know) (how )?to (trade|invest)|want to (trade|invest)|quit my job/,
    )
  )
    return sure('income');
  if (
    has(
      text,
      /curious|learn|understand|know more|just looking|interest|explore|tiktok|instagram|youtube|twitter|facebook|whatsapp|saw (it|an? ad|a post|this)|friend|someone|heard|told me|literacy|knowledge|educat|how (it|this|they|markets?|the market) works?|mention|recommend|don'?t know|not sure|\bidk\b|no reason|just because|bored|for fun/,
    )
  )
    return sure('curious');
  // Naming a market is wanting to trade it.
  if (has(text, /trad|forex|crypto|stock|shares|bitcoin|market|\bgold\b/))
    return sure('income');
  return UNSURE;
}

export function readExperience(raw: string): Understood<Experience> {
  const text = raw.toLowerCase();
  // Demo money isn't real money, which is what was asked.
  if (has(text, /\b(only|just)\b.*\b(demo|paper)\b|^\s*demo/))
    return sure('none');
  // A little, said with a "not" or a "no, but": checked before "never" and "no".
  if (
    has(
      text,
      /\bnot (much|often|regularly|seriously|a lot|really much|that much)\b|never (seriously|much)|only (once|twice|a (few|couple|little|bit))|^\s*(no|nope|nah),? but\b/,
    )
  )
    return sure('dabbled');
  if (
    has(
      text,
      /\bnever\b|not yet|not really|haven'?t|have not|\b(don'?t|do not) (trade|invest)|\bzero\b|\bnone\b|no experience|^\s*(no|nope|nah|nop|not)\b/,
    )
  )
    return sure('none');
  if (
    has(
      text,
      /every ?(day|week|month)|daily|weekly|monthly|\d+\s*(years?|yrs?|months?)|full[- ]?time|regularly|active(ly)?|for years|since (19|20)\d\d|a lot|\bi (trade|invest)\b|i'?m a trader|\bi do\b.*\b(trade|invest)/,
    )
  )
    return sure('active');
  if (
    has(
      text,
      /once|twice|a bit|a little|few times|couple|tried|small|dabbl|sometimes|occasional|here and there|on and off|briefly|bought|sold|\bown(ed)?\b|have some|some (shares|coins|crypto|stocks)|binance|bybit|exness|deriv|\bmt[45]\b|metatrader|bamboo|trove|risevest|chaka|databank|\bin (19|20)\d\d\b|back in|\blost\b/,
    )
  )
    return sure('dabbled');
  // A plain yes: they have, without saying how much. That's at least a try.
  if (
    has(
      text,
      /^\s*(yes|yeah|yep|yup|ya|yh|yea|ye|sure|of course|ofc|i have|i did|i'?ve|done that)\b/,
    )
  )
    return sure('dabbled');
  return UNSURE;
}

const MARKET_PATTERNS: [Market, RegExp][] = [
  [
    'local',
    /\bngx\b|\bnse\b|\bgse\b|nigeria(n)? (stock|share|exchange|market)|ghana(ian)? (stock|share|exchange|market)|local (stock|share)|dangote|\bmtn\b|t-?bills?|treasur|\bbonds?\b|mutual fund|money market|\bgcb\b|gtco|gtbank|zenith|access bank|seplat/,
  ],
  [
    'us',
    /\bus stocks?\b|\bu\.s\.?\b|american|nasdaq|\bnas ?100\b|\bus ?(30|100|500)\b|\bspx\b|\bsp ?500\b|s&p|\bdow\b|wall street|foreign stocks?|tesla|apple|amazon|nvidia|\betfs?\b|(?<!synthetic )\bindices\b|\bindex(es)?\b/,
  ],
  [
    'forex',
    // Deriv's synthetic indices trade like currency pairs, so they sit here.
    /forex|\bfx\b|currenc|eur ?usd|gbp|\bpairs?\b|dollar|naira|cedi|\busd\b|\bngn\b|\bghs\b|\bpounds?\b|\beuros?\b|\byen\b|synthetic|boom (and|&) crash|volatility \d+|\bv ?75\b|deriv/,
  ],
  [
    'crypto',
    /crypto|bitcoin|\bbtc\b|\beth\b|ethereum|usdt|\bcoins?\b|binance|memecoin|solana|\bsol\b|\bxrp\b|ripple|doge|shiba|altcoins?|\balts\b|\bnfts?\b|\bbnb\b|\btokens?\b|web3|defi/,
  ],
  ['commodities', /commodit|\bgold\b|\boil\b|crude|cocoa|xau|silver|\bgas\b/],
];

export function readMarkets(raw: string): Understood<Market[]> {
  const text = raw.toLowerCase();
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
  // "Not sure yet" is a fine answer: start with the markets everyone meets.
  // Checked first, so "I don't have any idea" isn't read as "any".
  if (
    !found.length &&
    has(
      text,
      /not sure|don'?t know|no idea|any idea|no clue|dunno|\bidk\b|undecided|help me|\bnone\b|nothing|no preference|not yet/,
    )
  )
    return sure([]);
  if (
    has(
      text,
      /^\s*any\s*$|\ball\b|everything|every market|\bany (of them|market|is fine|one)\b|\banything\b/,
    )
  )
    return sure([...MARKETS]);
  if (found.length) return sure(found);
  return UNSURE;
}

const NUMBER_WORDS: [RegExp, number][] = [
  [/double|twice|\b2x\b/, 10_000],
  [/\bhalf\b/, 5_000],
];

export function readRecovery(raw: string): Understood<number | null> {
  const text = withDigits(
    raw.toLowerCase().replace(/\b(a|one) hundred\b/g, '100'),
  );
  if (
    has(
      text,
      /don'?t know|no idea|not sure|dunno|\bidk\b|no clue|\bpass\b|\bskip\b|can'?t say|no sabi|not certain/,
    )
  )
    return sure(null);
  // "2x", "2 times": a multiple of what's left, so 2x is a 100% gain.
  const times = /(\d+(?:\.\d+)?)\s*(x|times)\b/.exec(text);
  if (times) {
    const multiple = Number(times[1]);
    if (multiple >= 1 && multiple <= 11)
      return sure(Math.round((multiple - 1) * 10_000));
  }
  const numbers = [...text.matchAll(/(\d+(?:\.\d+)?)/g)]
    .map((match) => Number(match[1]))
    .filter((value) => value >= 0 && value <= 1_000);
  if (numbers.length) {
    // The question's own 50% said back ("lose 50, need 100") isn't the answer.
    const value =
      numbers.length > 1
        ? (numbers.find((n) => n !== 50) ?? numbers[0]!)
        : numbers[0]!;
    return sure(Math.round(value * 100));
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
  // A question about it is checking it: "is it legit?", "is he registered?"
  if (
    has(
      text,
      /\b(is|are) (it|he|this|that|they|him)\b.*\b(legit|real|licen[cs]ed|registered|regulated|safe|true)\b/,
    )
  )
    return sure('wary');
  if (
    has(
      text,
      /scam|fraud|ponzi|pyramid|fake|red flag|too good|\blie\b|lying|419|\bmmm\b|cbex|yahoo|run away|no way|fishy|suspicious|\bsus\b|impossible|unrealistic|not (possible|realistic|real)|can'?t be (true|real)|stay away|avoid|not interested|no thanks|i doubt|^\s*run\b|i'?d run|doubtful|\bnever\b|^\s*(lol\s*|haha\s*)?(no|nope|nah|mba)\b/,
    )
  )
    return sure('sharp');
  if (
    has(
      text,
      /sign me|how (do|can) i join|where do i (pay|join|sign)|i'?d join|i will join|count me in|i'?m in\b|add me|want in|send (me )?(his |the |your )?(number|contact|details|link|account)|how much (do i need|to start|can i start|is the minimum)|what'?s the minimum|let'?s go/,
    )
  )
    return sure('trusting');
  if (
    has(
      text,
      /proof|evidence|check|\bsec\b|registered|licen[cs]|regulat|verify|careful|depends|\bask\b|not sure|research|investigate|look into|find out|how (does|do|is|can|would) (he|it|that|they|this)|who is (he|this)|background|reviews?|risk|maybe|let me think|think about/,
    )
  )
    return sure('wary');
  if (
    has(
      text,
      /great|nice|interesting|interested|join|legit|good|cool|amazing|awesome|wow|why not|tell me more|\btry\b|yes/,
    )
  )
    return sure('trusting');
  return UNSURE;
}

const NUMBER_WORD: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const TENS = 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety';
const UNITS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

/** Number words as digits: "maybe ten" reads as "maybe 10". */
function withDigits(text: string): string {
  // "seventy five", "forty-five": one number, not two.
  let out = ` ${text} `.replace(
    new RegExp(`\\b(${TENS})[\\s-](${Object.keys(UNITS).join('|')})\\b`, 'g'),
    (_, tens: string, unit: string) => ` ${NUMBER_WORD[tens]! + UNITS[unit]!} `,
  );
  for (const [word, value] of Object.entries(NUMBER_WORD))
    out = out.replace(new RegExp(`\\b${word}\\b`, 'g'), ` ${value} `);
  return out;
}

/**
 * How many minutes a phrase names, the way people type it: "2hrs", "1.5 h",
 * "90 mins", "1h30", "half an hour", "an hour and a half", "1-2 hours"
 * (the lower end: people are generous with future time). Null when it names
 * no amount.
 */
export function minutesIn(raw: string): number | null {
  let text = ` ${raw.toLowerCase().replace(/[’`]/g, "'")} `;
  text = text
    .replace(
      /\b(an?|one) hours? and (a )?half\b|\bhour and (a )?half\b/g,
      ' 90 min ',
    )
    .replace(/\bhalf (an? )?hour\b/g, ' 30 min ')
    .replace(/\b(a )?quarter (of an? )?hour\b/g, ' 15 min ')
    .replace(/\b(an?) (hr|hour)\b/g, ' 1 hour ');
  text = withDigits(text);
  const clock =
    /(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?\s*(?:and\s*)?(\d+)\s*m(?:in(?:ute)?s?)?\b/.exec(
      text,
    ) ?? /(\d+)\s*h(?:ours?|rs?)?\s*(\d{2})\b/.exec(text);
  if (clock) return Math.round(Number(clock[1]) * 60 + Number(clock[2]));
  const amount =
    /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to|or)\s*\d+(?:\.\d+)?)?\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/.exec(
      text,
    );
  if (amount) {
    const value = Number(amount[1]);
    return Math.round(amount[2]!.startsWith('h') ? value * 60 : value);
  }
  return null;
}

/** An amount of time to the nearest option: a little, a lesson, half an hour, an hour or more. */
export function minutesBucket(minutes: number): Minutes {
  if (minutes <= 10) return 5;
  if (minutes <= 22) return 15;
  if (minutes <= 45) return 30;
  return 60;
}

export function readMinutes(raw: string): Understood<Minutes> {
  const text = raw.toLowerCase();
  const stated = minutesIn(raw);
  if (stated !== null) return sure(minutesBucket(stated));
  if (
    has(
      text,
      /\b(hours|all day|whole day|full[- ]?time|plenty|lots? of time|a lot)\b/,
    )
  )
    return sure(60);
  if (
    has(
      text,
      /\b(little|busy|few min|small|not much|no time|barely|quick|weekends?)\b|small small/,
    )
  )
    return sure(5);
  // A bare number: "maybe 20" means minutes. Under 5 it could be hours; ask.
  const bare = /\b(\d{1,3})\b/.exec(withDigits(text));
  if (bare) {
    const value = Number(bare[1]);
    if (value >= 5 && value <= 240) return sure(minutesBucket(value));
  }
  return UNSURE;
}

/** Read an answer to `step`. */
export function understand(step: Step, raw: string): Understood<unknown> {
  // Devices type curly apostrophes; the patterns are written with straight ones.
  const text = raw.replace(/[\u2018\u2019\u02bc`´]/g, "'").replace(/\s+/g, ' ');
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
    case 'time': {
      // Jev answers with the option's key as text; the chips with a number.
      const minutes = Number(value);
      return (MINUTES as readonly number[]).includes(minutes)
        ? { ...profile, minutes: minutes as Minutes }
        : profile;
    }
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
  time: {
    '5': 'A few minutes a day, ten at most, or only now and then',
    '15': 'About fifteen to twenty minutes a day',
    '30': 'About half an hour a day',
    '60': 'An hour or more a day',
  },
  // Several can be true at once, so the gate asks each as its own yes/no
  // (lib/decisions/meaning.ts), never as one many-way choice.
  markets: {
    local:
      'Stocks, bonds or funds in Ghana or Nigeria (GSE, NGX, T-bills, local companies)',
    us: 'US or other foreign stocks, ETFs or indices',
    forex: 'Currencies or forex, including synthetic indices',
    crypto: 'Crypto: Bitcoin, Ether, coins or tokens',
    commodities: 'Commodities: gold, oil, cocoa, silver',
  } satisfies Record<Market, string>,
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
    lessons = ['f0', 'm1', 'm2'];
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
    lessons = ['m1', 'm2', 'm3'];
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
