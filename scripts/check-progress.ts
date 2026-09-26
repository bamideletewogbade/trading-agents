/**
 * The habit loop (lib/progress/habit.ts): XP, levels, streaks across time
 * zones, the daily goal, badges and merging the phone's log with the
 * server's.
 *
 *     pnpm check
 */

import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import {
  XP,
  badgesOf,
  dayOf,
  daysOf,
  earned,
  goalOf,
  levelOf,
  mergeLogs,
  streakOf,
  xpOf,
  type Completion,
} from '../lib/progress/habit.ts';
import {
  ROUND_SIZE,
  SPACING_DAYS,
  daysUntil,
  dueOf,
  lessonOfKey,
  mergePractice,
  nextDueOf,
  queueOf,
  questionKey,
  type PracticeEvent,
} from '../lib/progress/review.ts';
import { STAGES } from '../content/curriculum.ts';
import { LESSON_DEFS } from '../content/lessons/index.ts';

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

const at = (iso: string) => Date.parse(iso);
const done = (id: string, when: string, right = 0, total = 2): Completion => ({
  id,
  at: at(when),
  right,
  total,
});

check(
  'XP: a first finish counts in full, a replay a little, never more than the questions',
  () => {
    equal(xpOf([]), 0);
    equal(
      xpOf([done('m1', '2026-09-01T10:00:00Z', 2, 2)]),
      XP.lesson + 2 * XP.firstTry,
    );
    equal(
      xpOf([
        done('m1', '2026-09-01T10:00:00Z', 1, 2),
        done('m1', '2026-09-02T10:00:00Z', 2, 2),
      ]),
      XP.lesson + XP.firstTry + XP.replay,
    );
    equal(
      xpOf([done('m1', '2026-09-01T10:00:00Z', 9, 2)]),
      XP.lesson + 2 * XP.firstTry,
    );
    deepStrictEqual(earned([], done('m1', '2026-09-01T10:00:00Z', 1, 2)), {
      xp: XP.lesson + XP.firstTry,
      firstTime: true,
    });
    deepStrictEqual(
      earned(
        [done('m1', '2026-09-01T10:00:00Z')],
        done('m1', '2026-09-02T10:00:00Z', 2, 2),
      ),
      {
        xp: XP.replay,
        firstTime: false,
      },
    );
  },
);

check('levels start at 0, 100, 300, 600, 1,000 XP', () => {
  deepStrictEqual(
    [0, 99, 100, 299, 300, 600, 1_000].map((xp) => levelOf(xp).level),
    [1, 1, 2, 2, 3, 4, 5],
  );
  deepStrictEqual(levelOf(150), {
    level: 2,
    from: 100,
    to: 300,
    progressBp: 2_500,
  });
});

check('the day a lesson counts for follows the learner’s clock', () => {
  equal(dayOf(at('2026-09-01T23:30:00Z'), 0), '2026-09-01', 'Accra');
  equal(dayOf(at('2026-09-01T23:30:00Z'), -60), '2026-09-02', 'Lagos');
  deepStrictEqual(
    daysOf([{ id: 'm1', at: 0, right: 0, total: 0 }], 0),
    [],
    'no time, no day',
  );
});

check(
  'streaks: today or yesterday keeps it alive, a gap ends it, the best is kept',
  () => {
    const days = [
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-05',
      '2026-09-06',
    ];
    deepStrictEqual(streakOf(days, '2026-09-06'), {
      current: 2,
      best: 3,
      today: true,
    });
    deepStrictEqual(streakOf(days, '2026-09-07'), {
      current: 2,
      best: 3,
      today: false,
    });
    deepStrictEqual(streakOf(days, '2026-09-08'), {
      current: 0,
      best: 3,
      today: false,
    });
    deepStrictEqual(streakOf([], '2026-09-08'), {
      current: 0,
      best: 0,
      today: false,
    });
    deepStrictEqual(streakOf(['2026-09-08', '2026-09-08'], '2026-09-08'), {
      current: 1,
      best: 1,
      today: true,
    });
    // Across a month end.
    deepStrictEqual(
      streakOf(['2026-08-31', '2026-09-01'], '2026-09-01').current,
      2,
    );
  },
);

check(
  'the daily goal counts today’s finishes in the learner’s time zone',
  () => {
    const log = [
      done('m1', '2026-09-01T23:30:00Z'),
      done('m2', '2026-09-02T08:00:00Z'),
    ];
    deepStrictEqual(goalOf(log, '2026-09-02', -60, 2), {
      goal: 2,
      done: 2,
      met: true,
    });
    deepStrictEqual(goalOf(log, '2026-09-02', 0, 2), {
      goal: 2,
      done: 1,
      met: false,
    });
  },
);

check('badges: a first lesson, a finished stage, streak milestones', () => {
  deepStrictEqual(badgesOf([], STAGES, 0), []);
  const stage = STAGES[0]!;
  const badges = badgesOf([...stage.lessons], STAGES, 7);
  deepStrictEqual(badges, [
    { kind: 'first' },
    { kind: 'stage', stage: stage.key },
    { kind: 'streak', days: 3 },
    { kind: 'streak', days: 7 },
  ]);
  ok(
    !badgesOf(stage.lessons.slice(1), STAGES, 0).some(
      (b) => b.kind === 'stage',
    ),
  );
});

check(
  'merging the phone’s log with the server’s keeps one record per finish',
  () => {
    const phone = [
      done('m1', '2026-09-01T10:00:00Z'),
      { id: 'm2', at: 0, right: 0, total: 0 },
    ];
    const server = [
      done('m1', '2026-09-01T10:00:02Z'),
      done('m2', '2026-09-01T11:00:00Z'),
      done('m1', '2026-09-03T10:00:00Z'),
    ];
    const merged = mergeLogs(phone, server);
    equal(
      merged.length,
      3,
      'the untimed m2 is the same finish as the server’s',
    );
    equal(merged.filter((c) => c.id === 'm1').length, 2);
    deepStrictEqual(
      mergeLogs(merged, server),
      merged,
      'merging again changes nothing',
    );
  },
);

/* ── Practise your mistakes ───────────────────────────────────────────── */

const DAY = 86_400_000;
const t0 = at('2026-09-01T10:00:00Z');
const ev = (
  kind: PracticeEvent['kind'],
  key: string,
  when: number,
): PracticeEvent => ({
  kind,
  key,
  lesson: lessonOfKey(key),
  at: when,
});

check(
  'question keys are stable, lesson-scoped and unique within every lesson',
  () => {
    equal(
      questionKey('f3', 'What is 2 + 2?'),
      questionKey('f3', 'What is 2 + 2?'),
    );
    ok(
      questionKey('f3', 'What is 2 + 2?') !==
        questionKey('f3', 'What is 2 + 3?'),
    );
    equal(lessonOfKey(questionKey('t10', 'x')), 't10');
    for (const [id, def] of Object.entries(LESSON_DEFS)) {
      const keys = def
        .beats()
        .filter((beat) => beat.kind === 'choice')
        .map((beat) =>
          beat.kind === 'choice' ? questionKey(id, beat.prompt) : '',
        );
      equal(
        new Set(keys).size,
        keys.length,
        `${id}: two questions share a key`,
      );
    }
  },
);

check(
  'a mistake is due at once, then after 1, 3 and 7 days, then learned',
  () => {
    const key = 'm1:00000001';
    let log = [ev('missed', key, t0)];
    deepStrictEqual(
      dueOf(queueOf(log).items, t0).map((i) => i.key),
      [key],
    );
    let now = t0;
    for (const days of SPACING_DAYS.slice(1)) {
      log = [...log, ev('right', key, now)];
      const { items } = queueOf(log);
      equal(items[0]?.due, now + days * DAY, `back after ${days} days`);
      equal(dueOf(items, now + days * DAY - 1).length, 0, 'not early');
      now += days * DAY;
    }
    log = [...log, ev('right', key, now)];
    deepStrictEqual(queueOf(log), { items: [], learned: [key] });
  },
);

check(
  'a wrong answer starts it again; missing a learned one brings it back',
  () => {
    const key = 'c4:0000000a';
    const log = [
      ev('missed', key, t0),
      ev('right', key, t0),
      ev('wrong', key, t0 + DAY),
    ];
    deepStrictEqual(queueOf(log).items, [
      { key, lesson: 'c4', box: 0, due: t0 + DAY },
    ]);
    const retired = [
      ev('missed', key, t0),
      ...[1, 2, 3, 4].map((n) => ev('right', key, t0 + n * 10 * DAY)),
    ];
    deepStrictEqual(queueOf(retired).learned, [key]);
    const again = queueOf([...retired, ev('missed', key, t0 + 60 * DAY)]);
    deepStrictEqual(again.learned, []);
    equal(again.items[0]?.box, 0);
    deepStrictEqual(
      queueOf([ev('right', key, t0)]),
      { items: [], learned: [] },
      'reviewing nothing does nothing',
    );
  },
);

check(
  'a round takes the oldest due first, at most a few, from one lesson if asked',
  () => {
    const log = Array.from({ length: 8 }, (_, i) =>
      ev(
        'missed',
        `${i % 2 ? 'r1' : 't3'}:${String(i).padStart(8, '0')}`,
        t0 + i * 1000,
      ),
    );
    const { items } = queueOf(log);
    const round = dueOf(items, t0 + DAY);
    equal(round.length, ROUND_SIZE);
    equal(round[0]?.key, 't3:00000000');
    ok(dueOf(items, t0 + DAY, 10, 'r1').every((i) => i.lesson === 'r1'));
    equal(
      nextDueOf(
        queueOf([...log, ev('right', 't3:00000000', t0 + DAY)]).items,
        t0 + DAY + 1,
      ),
      t0 + 2 * DAY,
    );
    equal(daysUntil(t0 + DAY, t0), 1);
    equal(daysUntil(t0, t0 + 5), 0);
  },
);

check('merging practice logs keeps one record per answer', () => {
  const phone = [ev('missed', 'm1:00000001', t0)];
  const server = [
    ev('missed', 'm1:00000001', t0 + 2_000),
    ev('right', 'm1:00000001', t0 + DAY),
  ];
  const merged = mergePractice(phone, server);
  equal(merged.length, 2);
  deepStrictEqual(mergePractice(merged, server), merged);
});

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ progress: ${passed} checks passed.`);
