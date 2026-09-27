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
