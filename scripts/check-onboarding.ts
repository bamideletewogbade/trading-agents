/**
 * The conversation's reading of plain answers, where it places people, and
 * the open-ended lesson search. No network: Jev is only asked when these
 * patterns aren't sure, and that path is the screen's, not this file's.
 *
 *     pnpm check
 *
 * Every phrase below is something a real person might type. When the
 * onboarding misreads someone in the pilot, their words go here first.
 */

import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { ONBOARDING } from '../content/onboarding.ts';
import {
  JEV_OPTIONS,
  MARKETS,
  MINUTES,
  STEPS,
  answer,
  answeredCount,
  nextStep,
  placement,
  readExperience,
  readGoal,
  readMarkets,
  readMinutes,
  readName,
  readRecovery,
  readScam,
  recoveryRight,
  understand,
  type Profile,
  type Step,
} from '../lib/onboarding/flow.ts';
import { searchLessons } from '../lib/curriculum/search.ts';
import { LESSONS, STAGES, lesson } from '../content/curriculum.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    failures.push(
      `✗ ${name}\n    ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
    );
  }
}

const value = <T>(read: { kind: string; value?: T }) =>
  read.kind === 'sure' ? read.value : 'unsure';

check('names, however they are given', () => {
  equal(value(readName('Ama')), 'Ama');
  equal(value(readName("hi, I'm tunde")), 'Tunde');
  equal(value(readName('My name is Chiamaka Obi.')), 'Chiamaka Obi');
  equal(value(readName('call me kofi')), 'Kofi');
  equal(value(readName('   ')), 'unsure');
});

check('why they came', () => {
  equal(value(readGoal('The Dangote IPO got me curious')), 'ipo');
  equal(
    value(readGoal('everyone is talking about the refinery shares')),
    'ipo',
  );
  equal(value(readGoal('I lost 200k on forex last year')), 'recover');
  equal(
    value(readGoal('I already trade and want to be more consistent')),
    'improve',
  );
  equal(value(readGoal('I need extra income, salary no dey reach')), 'income');
  equal(value(readGoal('just curious honestly')), 'curious');
  equal(value(readGoal('I want to grow my savings')), 'income');
  equal(value(readGoal('invest for retirement')), 'income');
  equal(value(readGoal('hmm')), 'unsure');
});

check('what they have done before', () => {
  equal(value(readExperience('No, never')), 'none');
  equal(value(readExperience('nope')), 'none');
  equal(value(readExperience('I tried crypto once')), 'dabbled');
  equal(value(readExperience('a little bit of stocks on bamboo')), 'dabbled');
  equal(value(readExperience('I trade forex daily')), 'active');
  equal(value(readExperience('for 3 years now')), 'active');
  // A plain yes means they have, at least a little.
  equal(value(readExperience('yes')), 'dabbled');
  equal(value(readExperience('yeah I have')), 'dabbled');
  equal(value(readExperience('I trade crypto')), 'active');
  equal(value(readExperience('hmm')), 'unsure');
});

check('which markets', () => {
  deepStrictEqual(value(readMarkets('NGX stocks and crypto')), [
    'local',
    'crypto',
  ]);
  deepStrictEqual(value(readMarkets('forex, mostly gold')), [
    'forex',
    'commodities',
  ]);
  deepStrictEqual(value(readMarkets('US stocks like Tesla')), ['us']);
  deepStrictEqual(value(readMarkets('not sure yet')), []);
  deepStrictEqual(value(readMarkets('T-bills and bonds')), ['local']);
  equal((value(readMarkets('all of them')) as unknown[]).length, 5);
  equal(value(readMarkets('whatever pays')), 'unsure');
});

check('the recovery question, answered many ways', () => {
  equal(value(readRecovery('100%')), 10_000);
  equal(value(readRecovery('I think 50')), 5_000);
  equal(value(readRecovery('double it')), 10_000);
  equal(value(readRecovery("I don't know")), null);
  equal(value(readRecovery('hmm')), 'unsure');
  ok(recoveryRight(10_000));
  ok(recoveryRight(9_600));
  ok(!recoveryRight(5_000));
  ok(!recoveryRight(null));
});

check('the doubling offer', () => {
  equal(value(readScam('That is a scam')), 'sharp');
  equal(value(readScam('sounds like MMM all over again')), 'sharp');
  equal(
    value(readScam("I'd ask for proof and check if he's SEC registered")),
    'wary',
  );
  equal(value(readScam('how do I join?')), 'trusting');
  equal(value(readScam('sounds great')), 'trusting');
});

/**
 * Every question, answered the way people type on a device: curly
 * apostrophes, no capitals, greetings, "no, but…", Pidgin, platform names.
 * Read through `understand`, the path the chat uses. 'unsure' means Sika
 * asks again with examples; everything else must be read exactly so. A
 * wrong reading is worse than asking again, so the misreads that were
 * found ("You Can" as a name, "never tried" as a try, "2x" as 2%, "any
 * idea" as every market) are here for good.
 */
const TYPED: [Step, string, unknown][] = [
  ['name', 'Ama', 'Ama'],
  ['name', 'kofi', 'Kofi'],
  ['name', 'My name is Kwame Mensah', 'Kwame Mensah'],
  ['name', 'hi sika, I’m Ama', 'Ama'],
  ['name', 'hello Sika. my name is Tunde', 'Tunde'],
  ['name', 'you can call me Bishop', 'Bishop'],
  ['name', 'I am called Efua', 'Efua'],
  ['name', 'Ama here', 'Ama'],
  ['name', 'my name is Ama and I’m 25', 'Ama'],
  ['name', 'Names Chidi', 'Chidi'],
  ['name', "the name's Ngozi", 'Ngozi'],
  ['name', 'kofi 😊', 'Kofi'],
  ['name', 'Adaeze.', 'Adaeze'],
  ['name', 'ok', 'unsure'],
  ['name', 'why do you need my name?', 'unsure'],
  ['name', 'hi', 'unsure'],
  ['name', 'lol', 'unsure'],
  ['name', '12345', 'unsure'],
  ['name', 'I’d rather not say', ''],
  ['name', 'skip', ''],
  ['name', 'Mr. Tewogbade', 'Mr Tewogbade'],
  ['name', "I'm good, thanks. Kofi", 'Kofi'],
  ['name', 'this is Yaw', 'Yaw'],
  ['name', 'yes', 'unsure'],
  ['goal', 'extra income', 'income'],
  ['goal', 'I lost money', 'recover'],
  ['goal', 'just curious', 'curious'],
  ['goal', 'I lost my job and need extra money', 'income'],
  ['goal', 'I want to learn how to trade', 'income'],
  ['goal', 'I want to become a full time trader', 'income'],
  ['goal', 'my losses keep piling up', 'recover'],
  ['goal', 'I got burnt in CBEX', 'recover'],
  ['goal', 'saw it on tiktok', 'curious'],
  ['goal', 'a friend told me about it', 'curious'],
  ['goal', 'I don’t know', 'curious'],
  ['goal', 'financial literacy', 'curious'],
  ['goal', 'to grow my savings', 'income'],
  ['goal', 'I’m a trader, want to be consistent', 'improve'],
  ['goal', 'Dangote', 'ipo'],
  ['goal', 'the refinery IPO', 'ipo'],
  ['goal', 'I keep losing trades', 'recover'],
  ['goal', 'money', 'income'],
  ['goal', 'to make money', 'income'],
  ['goal', 'I want to start investing', 'income'],
  ['goal', 'side hustle', 'income'],
  ['goal', 'get rich', 'income'],
  ['goal', 'for my children’s future', 'income'],
  ['goal', 'lol', 'unsure'],
  ['experience', 'never', 'none'],
  ['experience', 'a few times', 'dabbled'],
  ['experience', 'every week', 'active'],
  ['experience', 'never tried', 'none'],
  ['experience', 'I have never traded', 'none'],
  ['experience', 'no', 'none'],
  ['experience', 'nope', 'none'],
  ['experience', 'not yet', 'none'],
  ['experience', "I haven't tried", 'none'],
  ['experience', 'never, been saving for 2 years though', 'none'],
  ['experience', 'only on demo', 'none'],
  ['experience', 'just demo account', 'none'],
  ['experience', 'not much', 'dabbled'],
  ['experience', 'not often', 'dabbled'],
  ['experience', 'yes', 'dabbled'],
  ['experience', 'yes, every day', 'active'],
  ['experience', 'I bought MTN shares once', 'dabbled'],
  ['experience', 'I have some shares on the GSE', 'dabbled'],
  ['experience', 'I use Binance', 'dabbled'],
  ['experience', 'I trade on Deriv', 'active'],
  ['experience', 'I’ve been trading for 3 years', 'active'],
  ['experience', 'a couple of times', 'dabbled'],
  ['experience', 'occasionally', 'dabbled'],
  ['experience', 'once or twice', 'dabbled'],
  ['experience', 'small small', 'dabbled'],
  ['experience', 'I tried crypto and lost', 'dabbled'],
  ['experience', 'never once', 'none'],
  ['experience', 'nah', 'none'],
  ['experience', 'I invest in T-bills', 'active'],
  ['experience', 'bought bitcoin in 2021', 'dabbled'],
  ['experience', 'yh', 'dabbled'],
  ['markets', 'crypto', ['crypto']],
  ['markets', 'gold', ['commodities']],
  ['markets', 'Nigerian stocks', ['local']],
  ['markets', 'stocks and crypto', ['local', 'crypto']],
  ['markets', 'forex and gold', ['forex', 'commodities']],
  ['markets', 'all of them', 'all'],
  ['markets', 'everything', 'all'],
  ['markets', 'I don’t have any idea', []],
  ['markets', 'not sure', []],
  ['markets', 'none', []],
  ['markets', 'no idea', []],
  ['markets', 'idk', []],
  ['markets', 'NAS100 and US30', ['us']],
  ['markets', 'XAUUSD', ['commodities']],
  ['markets', 'bitcoin', ['crypto']],
  ['markets', 'solana', ['crypto']],
  ['markets', 'altcoins', ['crypto']],
  ['markets', 'Ghana stock exchange', ['local']],
  ['markets', 'treasury bills', ['local']],
  ['markets', 'shares', ['local']],
  ['markets', 'apple and tesla', ['us']],
  ['markets', 'oil', ['commodities']],
  ['markets', 'cocoa', ['commodities']],
  ['markets', 'currencies', ['forex']],
  ['markets', 'naira', ['forex']],
  ['markets', 'cedi', ['forex']],
  ['markets', 'real estate', 'unsure'],
  ['markets', 'any is fine', 'all'],
  ['recovery', '60%', 6000],
  ['recovery', '50', 5000],
  ['recovery', '100%', 10000],
  ['recovery', 'double', 10000],
  ['recovery', '2x', 10000],
  ['recovery', 'you need 2x', 10000],
  ['recovery', 'idk', null],
  ['recovery', 'no idea', null],
  ['recovery', 'a hundred percent', 10000],
  ['recovery', 'twice as much', 10000],
  ['recovery', 'half', 5000],
  ['recovery', 'fifty percent', 5000],
  ['recovery', 'hmm', 'unsure'],
  ['recovery', 'I think 50% ', 5000],
  ['recovery', 'you have to double it', 10000],
  ['recovery', 'skip', null],
  ['recovery', 'no clue', null],
  ['recovery', '1.5x', 5000],
  ['recovery', 'seventy', 7000],
  ['recovery', 'same 50%', 5000],
  ['scam', 'that’s a scam', 'sharp'],
  ['scam', 'I’d want proof', 'wary'],
  ['scam', 'I’d join', 'trusting'],
  ['scam', 'no', 'sharp'],
  ['scam', 'nope', 'sharp'],
  ['scam', 'never', 'sharp'],
  ['scam', 'sounds fishy', 'sharp'],
  ['scam', 'suspicious', 'sharp'],
  ['scam', 'impossible', 'sharp'],
  ['scam', 'ponzi', 'sharp'],
  ['scam', 'MMM again', 'sharp'],
  ['scam', 'I’d stay away', 'sharp'],
  ['scam', 'not interested', 'sharp'],
  ['scam', 'too good to be true', 'sharp'],
  ['scam', 'yahoo yahoo', 'sharp'],
  ['scam', 'sus', 'sharp'],
  ['scam', 'lol no', 'sharp'],
  ['scam', 'how much do I need to start?', 'trusting'],
  ['scam', 'add me', 'trusting'],
  ['scam', 'tell me more', 'trusting'],
  ['scam', 'wow', 'trusting'],
  ['scam', 'why not', 'trusting'],
  ['scam', 'send me his number', 'trusting'],
  ['scam', 'I’d research him first', 'wary'],
  ['scam', 'is he licensed?', 'wary'],
  ['scam', 'how does he do it?', 'wary'],
  ['scam', 'risky', 'wary'],
  ['scam', 'hmm maybe', 'wary'],
  ['scam', 'I’d try with a small amount', 'trusting'],
  ['scam', 'lol', 'unsure'],
  ['scam', 'I’d ask for his SEC registration', 'wary'],
  ['scam', 'is it legit?', 'wary'],
  ['name', 'Esi', 'Esi'],
  ['name', 'hey, I am Abena', 'Abena'],
  ['name', 'Imani', 'Imani'],
  ['name', 'Its Kojo', 'Kojo'],
  ['name', 'Good morning Sika, I am Femi', 'Femi'],
  ['name', 'Sika', 'Sika'],
  ['name', 'dr ama', 'Dr Ama'],
  ['name', 'call me BJ', 'BJ'],
  ['name', 'Oluwaseun', 'Oluwaseun'],
  ['name', 'hello', 'unsure'],
  ['name', 'what?', 'unsure'],
  ['name', 'no', 'unsure'],
  ['name', 'dont want to say', ''],
  ['name', 'Mary-Jane', 'Mary-Jane'],
  ['name', 'ama from kumasi', 'Ama'],
  ['name', 'Kofi Boateng here', 'Kofi Boateng'],
  ['name', 'I’m a student', 'unsure'],
  ['name', 'Chiamaka 🙂🙂', 'Chiamaka'],
  ['goal', 'I want financial freedom', 'income'],
  ['goal', 'dont know yet', 'curious'],
  ['goal', 'my friend lost money in crypto', 'recover'],
  ['goal', 'I lost 2k on binance', 'recover'],
  ['goal', 'to trade gold', 'income'],
  ['goal', 'I need a second source of income', 'income'],
  ['goal', 'been trading 2 yrs, still not profitable', 'improve'],
  ['goal', 'want to understand the stock market', 'curious'],
  ['goal', 'my pastor mentioned it', 'curious'],
  ['goal', 'ipo', 'ipo'],
  ['goal', 'Just want to know how it works', 'curious'],
  ['experience', 'nop', 'none'],
  ['experience', 'no never', 'none'],
  ['experience', 'Yes I have', 'dabbled'],
  ['experience', 'I have a Bamboo account', 'dabbled'],
  ['experience', 'i do forex trading daily', 'active'],
  ['experience', 'only paper trading', 'none'],
  ['experience', 'no, but I bought some crypto once', 'dabbled'],
  ['experience', 'not really, just watched videos', 'none'],
  ['experience', 'I dont trade', 'none'],
  ['experience', 'haven’t', 'none'],
  ['experience', 'ive been investing since 2019', 'active'],
  ['experience', '5 years', 'active'],
  ['markets', 'btc eth', ['crypto']],
  ['markets', 'gold and oil', ['commodities']],
  ['markets', 'stocks', ['local']],
  ['markets', 'american stocks', ['us']],
  ['markets', 'any', 'all'],
  ['markets', 'dunno', []],
  ['markets', 'usdt', ['crypto']],
  ['markets', 'forex, crypto and stocks', ['local', 'forex', 'crypto']],
  ['markets', 'V75', ['forex']],
  ['markets', 'bonds', ['local']],
  ['recovery', '50%', 5000],
  ['recovery', '100', 10000],
  ['recovery', 'I dont know', null],
  ['recovery', 'twenty five', 2500],
  ['recovery', 'you lose 50 so you need 100', 10000],
  ['recovery', 'double it', 10000],
  ['recovery', '75 percent', 7500],
  ['recovery', 'pass', null],
  ['recovery', 'maybe 2 times', 10000],
  ['scam', 'no way', 'sharp'],
  ['scam', 'Run!', 'sharp'],
  ['scam', 'thats a ponzi scheme', 'sharp'],
  ['scam', 'hmm', 'unsure'],
  ['scam', 'nah bro', 'sharp'],
  ['scam', 'I would check if he is registered', 'wary'],
  ['scam', 'Sounds good', 'trusting'],
  ['scam', 'where do I pay', 'trusting'],
  ['scam', 'I will ask for proof', 'wary'],
  ['scam', 'I will join, no doubt', 'trusting'],
  ['scam', 'Doubling every month is not realistic', 'sharp'],
  ['scam', 'Is it real?', 'wary'],
];

check('every question, the way people type it', () => {
  const wrong = TYPED.filter(([step, text, want]) => {
    const got = value(understand(step, text));
    return (
      JSON.stringify(got) !==
      JSON.stringify(want === 'all' ? [...MARKETS] : want)
    );
  }).map(
    ([step, text, want]) =>
      `${step} "${text}": read ${JSON.stringify(value(understand(step, text)))}, want ${JSON.stringify(want)}`,
  );
  ok(!wrong.length, `${wrong.length} misread: ${wrong.join('; ')}`);
});

check('no name is fine: the chat carries on without one', () => {
  equal(value(understand('name', 'I’d rather not say')), '');
  equal(ONBOARDING.ask.goal(''), 'What brought you here?');
  equal(ONBOARDING.summary.lead(''), 'Here’s what I heard:');
  ok(ONBOARDING.ask.goal('Ama').includes('Ama'));
});

check('time per day, the way people type it', () => {
  // Every one of these was, or could be, typed into the chat.
  const cases: [string, number | 'unsure'][] = [
    ['about 2hrs', 60],
    ['2 hours', 60],
    ['2h', 60],
    ['1hr', 60],
    ['an hour', 60],
    ['one hour', 60],
    ['1.5 hours', 60],
    ['an hour and a half', 60],
    ['1h30', 60],
    ['1-2 hours', 60],
    ['90 minutes', 60],
    ['hours', 60],
    ['plenty', 60],
    ['half an hour', 30],
    ['30mins', 30],
    ['45m', 30],
    ['quarter of an hour', 15],
    ['20 mins', 15],
    ['like 20 min', 15],
    ['maybe 20', 15],
    ['5 minutes', 5],
    ['10 minutes', 5],
    ["I'm busy, maybe ten", 5],
    ['not much time', 5],
    ['small small', 5],
    ['weekends only', 5],
    ['it depends', 'unsure'],
    ['2', 'unsure'],
  ];
  for (const [text, want] of cases)
    equal(value(readMinutes(text)), want, `“${text}”`);
});

check(
  'a typed answer is always invited: every clarify line gives examples, none says only “tap”',
  () => {
    for (const step of STEPS) {
      const line = ONBOARDING.clarify[step];
      ok(
        !/^[^“]*\btap\b/i.test(line) || /“/.test(line),
        `${step}: “${line}” asks for a tap only`,
      );
      if (step !== 'name')
        ok(/“/.test(line), `${step}: “${line}” gives no example to type`);
    }
  },
);

check('every example Sika tells people to type is one she understands', () => {
  for (const step of STEPS)
    for (const [, example] of ONBOARDING.clarify[step].matchAll(/“([^”]+)”/g))
      equal(understand(step, example!).kind, 'sure', `${step}: “${example}”`);
});

check('Jev’s time options are the minutes the chips offer', () => {
  deepStrictEqual(
    Object.keys(JEV_OPTIONS.time ?? {})
      .map(Number)
      .sort((a, b) => a - b),
    [...MINUTES],
  );
  // Jev answers with the key as text; the profile keeps a number.
  equal(answer({}, 'time', '60').minutes, 60);
  equal(answer({}, 'time', 15).minutes, 15);
  equal(answer({}, 'time', '7').minutes, undefined);
});

check('steps come in order and can be skipped', () => {
  let profile: Profile = {};
  equal(nextStep(profile), 'name');
  equal(nextStep(profile, ['name']), 'goal');
  for (const step of STEPS)
    profile = answer(
      profile,
      step,
      step === 'markets'
        ? []
        : step === 'recovery'
          ? null
          : step === 'time'
            ? 5
            : 'x',
    );
  equal(nextStep(profile), null);
  equal(answeredCount(profile), STEPS.length);
  equal(answeredCount({ name: 'Ama', goal: 'ipo' }), 2);
});

check('every Jev option set names only values the reader can return', () => {
  deepStrictEqual(Object.keys(JEV_OPTIONS.goal ?? {}).sort(), [
    'curious',
    'improve',
    'income',
    'ipo',
    'recover',
  ]);
  deepStrictEqual(Object.keys(JEV_OPTIONS.experience ?? {}).sort(), [
    'active',
    'dabbled',
    'none',
  ]);
});

check('placement: where each kind of learner starts', () => {
  equal(placement({ goal: 'ipo', experience: 'none' }).lessons[0], 'f0');
  equal(placement({ goal: 'income', experience: 'none' }).stage, 0);
  equal(placement({ goal: 'income', experience: 'dabbled' }).stage, 1);
  equal(
    placement({
      goal: 'improve',
      experience: 'active',
      recoveryAnswerBp: 5_000,
    }).stage,
    2,
  );
  equal(
    placement({
      goal: 'improve',
      experience: 'active',
      recoveryAnswerBp: 10_000,
    }).stage,
    3,
  );
  equal(
    placement({
      goal: 'recover',
      experience: 'active',
      recoveryAnswerBp: 10_000,
    }).stage,
    2,
  );
  equal(
    placement({ goal: 'income', experience: 'none', scam: 'trusting' })
      .lessons[0],
    'm6',
  );
});

check('every placement names real lessons and a real stage', () => {
  const goals = ['ipo', 'income', 'improve', 'recover', 'curious'] as const;
  const experiences = ['none', 'dabbled', 'active'] as const;
  for (const goal of goals)
    for (const experience of experiences)
      for (const recoveryAnswerBp of [null, 5_000, 10_000])
        for (const scam of ['trusting', 'wary', 'sharp'] as const) {
          const place = placement({ goal, experience, recoveryAnswerBp, scam });
          ok(place.stage >= 0 && place.stage < STAGES.length);
          ok(place.lessons.length >= 1 && place.lessons.length <= 3);
          for (const id of place.lessons) lesson(id);
        }
});

check('the curriculum is one consistent list', () => {
  const ids = LESSONS.map((item) => item.id);
  equal(new Set(ids).size, ids.length, 'duplicate lesson id');
  const staged = STAGES.flatMap((stage) => [...stage.lessons]);
  deepStrictEqual(
    [...staged].sort(),
    [...ids].sort(),
    'every lesson in exactly one stage',
  );
  for (const item of LESSONS) for (const need of item.needs ?? []) lesson(need);
  for (const item of LESSONS.filter((entry) => entry.status === 'live'))
    ok(item.playAt, `${item.id} is live but has nowhere to play`);
});

check('the open-ended box finds what people mean', () => {
  equal(searchLessons('how does the dangote ipo work')[0]?.lesson.id, 'f0');
  equal(searchLessons('what is RSI')[0]?.lesson.id, 't3');
  equal(searchLessons('why do I keep getting stopped out')[0]?.lesson.id, 'r1');
  equal(searchLessons('how to read a chart')[0]?.lesson.topic, 'charts');
  equal(searchLessons('leverage')[0]?.lesson.id, 'm5');
  equal(searchLessons('the the and')[0], undefined);
  ok(
    searchLessons('fundamental analysis').every(
      (match) => match.lesson.topic === 'fundamental',
    ),
  );
});

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ onboarding and search: ${passed} checks passed.`);
