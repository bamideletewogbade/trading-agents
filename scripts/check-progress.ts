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
import { STAGES } from '../content/curriculum.ts';

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

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ progress: ${passed} checks passed.`);
