import type { LessonDef } from '../../lib/lessons/types.ts';
import {
  formatBp,
  formatMoney,
  fromMinor,
  ofBp,
} from '../../lib/core/money.ts';
import { chartScenario, playPlan } from '../../lib/engines/chart.ts';
import {
  LEVERAGE_LAB,
  positionSize,
  recoveryBp,
  runLeverage,
} from '../../lib/engines/risk.ts';
import {
  breakEvenWinBp,
  expectancyR,
  totalR,
} from '../../lib/engines/trades.ts';
import { SEEDS } from './seeds.ts';

/** Stage 3: risk first. Numbers come from lib/engines, computed as the lesson opens. */

const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
/** Hundredths of R → "+2.5R", "−1R". */
const r = (hundredths: number) => {
  const sign = hundredths > 0 ? '+' : hundredths < 0 ? '−' : '';
  const abs = Math.abs(hundredths);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100)
    .padStart(2, '0')
    .replace(/0+$/, '');
  return `${sign}${whole}${frac ? `.${frac}` : ''}R`;
};

export const STAGE_3: Record<string, LessonDef> = {
  r1: {
    id: 'r1',
    takeaways: [
      'Decide where you’re wrong before you buy. That’s your stop.',
      'Put it past the noise, not on the line.',
      'A planned small loss is a good trade that didn’t work. No stop is how accounts end.',
    ],
    beats: () => {
      const bounce = chartScenario(SEEDS.chart, 'bounce');
      const broke = chartScenario(SEEDS.chart, 'break');
      const tight = playPlan(bounce, 'tight');
      const none = playPlan(broke, 'none');
      const room = playPlan(broke, 'room');
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Where are you wrong?',
          body: 'Every trade is an idea: “buyers will defend this level.” The stop is the price where that idea is proven wrong, and you get out.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'You’re buying at support. Where does the stop belong?',
          options: [
            {
              label: 'Exactly on the support line',
              feedback:
                'Wicks poke through support all the time. A stop on the line gets shaken out by ordinary noise.',
            },
            {
              label: 'Past the support, beyond the usual wicks',
              correct: true,
              feedback:
                'Yes: where the idea is really wrong, not just wobbling.',
            },
            {
              label: 'No stop. I’ll watch it.',
              feedback:
                'Watching is not a plan. When it breaks fast, you’ll freeze, like almost everyone.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Plan the trade, then play it',
          body: 'Pick a stop and watch what happens. Then replay the other ending.',
          widget: 'plan-stop',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What the replays showed',
          body: 'The same chart, three plans:',
          points: [
            `Stop on the line, support held: stopped out for ${usd(-tight.pnl)} on a trade that worked.`,
            `Stop with room, support broke: out for ${usd(-room.pnl)}, exactly what you planned.`,
            `No stop, support broke: down ${usd(-none.pnl)}, and still falling.`,
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Your stop was hit and the price then went your way. Was it a bad trade?',
          options: [
            {
              label: 'Not if the stop was where the idea was wrong',
              correct: true,
              feedback:
                'Right. Judge the plan, not one result. Over many trades, good plans add up.',
            },
            {
              label: 'Yes, stops are a waste',
              feedback:
                'The one time it saves you from a collapse pays for many small stop-outs.',
            },
          ],
        },
      ];
    },
  },

  r2: {
    id: 'r2',
    takeaways: [
      'Decide what you’ll lose if you’re wrong (e.g. 1% of the account), then let the stop set the size.',
      'Wider stop, smaller position. Tighter stop, bigger position.',
      'The loss stays the same size whatever the trade.',
    ],
    beats: () => {
      const account = 100_000;
      const riskBp = 100;
      const scenario = chartScenario(SEEDS.chart, 'bounce');
      const entry = scenario.entry;
      const stop = scenario.stops.room;
      const shares = positionSize(account, riskBp, entry, stop);
      const wrongA = positionSize(account, riskBp * 2, entry, stop);
      const wrongB = positionSize(
        account,
        riskBp,
        entry,
        stop - (entry - stop),
      );
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Size from the stop, not from a feeling',
          body: `Professionals decide the loss first: say ${formatBp(riskBp)} of the account per trade. Then the distance to the stop decides how many units to buy.`,
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Drag the stop',
          body: 'Move the stop further and closer, and watch the position size itself.',
          widget: 'position-size',
          props: { account, riskBp, entry },
          gate: true,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'You move your stop further away. Keeping the same risk, your position should…',
          options: [
            {
              label: 'Get smaller',
              correct: true,
              feedback:
                'Yes. More distance per unit means fewer units for the same loss.',
            },
            {
              label: 'Get bigger',
              feedback:
                'Bigger size with a wider stop means a bigger loss. That breaks the rule.',
            },
            {
              label: 'Stay the same',
              feedback:
                'Same size, wider stop: a bigger loss than you planned.',
            },
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'With a fixed risk per trade, no single loss can hurt you badly, and a losing streak is survivable. Most blown accounts broke this rule, not the chart.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `Account ${usd(account)}, risking ${formatBp(riskBp)}, buying at ${usd(entry)} with a stop at ${usd(stop)}. How many shares?`,
          options: [
            {
              label: String(shares),
              correct: true,
              feedback: `Right: ${formatMoney(ofBp(fromMinor(account, 'USD'), riskBp))} of risk ÷ ${usd(entry - stop)} per share, rounded down.`,
            },
            {
              label: String(wrongA),
              feedback: `That risks ${formatBp(riskBp * 2)}. At ${formatBp(riskBp)} it’s ${shares}.`,
            },
            {
              label: String(wrongB),
              feedback: `That fits a stop twice as far away. For this stop it’s ${shares}.`,
            },
          ],
        },
      ];
    },
  },

  r3: {
    id: 'r3',
    takeaways: [
      'Measure trades in R, what you risked, not in naira or cedis.',
      'You can win less than half your trades and still come out ahead, if winners are bigger than losers.',
      'Break-even win rate = loss ÷ (win + loss).',
    ],
    beats: () => {
      const ten = [250, -100, -100, 250, -100, 250, -100, -100, 250, -100];
      const total = totalR(ten);
      const even = breakEvenWinBp(100, 100);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'One R is what you risked',
          body: `Risk ${usd(1_000)} on a trade and hit your stop: that’s ${r(-100)}. Make ${usd(2_500)}: that’s ${r(250)}. R lets you compare trades whatever their size.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `You win 4 trades out of 10. Winners make ${r(250)}; losers lose ${r(-100)}. After the ten trades, are you up or down?`,
          options: [
            {
              label: `Up: ${r(total)}`,
              correct: true,
              feedback: `Yes: 4 × ${r(250)} and 6 × ${r(-100)} makes ${r(total)}, winning only 40% of the time.`,
            },
            {
              label: 'Down, you lost more trades than you won',
              feedback: `Losing most trades isn’t the same as losing money. You’re up ${r(total)}.`,
            },
            {
              label: 'Exactly even',
              feedback: `The winners are bigger: ${r(total)} overall.`,
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Change the win rate and win size',
          body: 'See what each trade is worth on average, and what ten trades add up to.',
          widget: 'r-multiples',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'Beginners chase a high win rate and take tiny profits while letting losses run. That wins often and still loses money. What matters is win rate and size together.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `If wins are ${r(100)} and losses ${r(-100)}, what win rate do you need to break even?`,
          options: [
            {
              label: formatBp(even),
              correct: true,
              feedback: 'Right: equal sizes need you to win half.',
            },
            {
              label: formatBp(even / 2),
              feedback: `With equal sizes, winning ${formatBp(even / 2)} loses money. You need ${formatBp(even)}.`,
            },
            {
              label: formatBp(even + even / 2),
              feedback: `More than enough; you break even at ${formatBp(even)}.`,
            },
          ],
        },
      ];
    },
  },

  r4: {
    id: 'r4',
    takeaways: [
      'Losses and gains aren’t symmetric: lose 50% and you need 100% to get back.',
      'Deep drawdowns take a very long time to climb out of.',
      'Keep losses small, because the climb back grows faster than the fall.',
    ],
    beats: () => [
      {
        kind: 'say',
        tag: 'see',
        title: 'The climb is steeper than the fall',
        body: 'A drawdown is how far your account has fallen from its high. Getting back takes a bigger percentage than you lost, because you’re growing a smaller amount.',
      },
      {
        kind: 'choice',
        tag: 'predict',
        prompt: `You lose ${formatBp(5_000)} of your account. What gain gets you back to where you started?`,
        options: [
          {
            label: formatBp(5_000),
            feedback: `${formatBp(5_000)} of what’s left only gets you three-quarters of the way back. You need ${formatBp(recoveryBp(5_000))}.`,
          },
          {
            label: formatBp(recoveryBp(5_000)),
            correct: true,
            feedback: 'Right: half has to double.',
          },
          {
            label: formatBp(7_500),
            feedback: `Close, but not enough: it’s ${formatBp(recoveryBp(5_000))}.`,
          },
        ],
      },
      {
        kind: 'widget',
        tag: 'touch',
        title: 'Lose some, then climb back',
        body: 'Slide the loss and see what the climb takes.',
        widget: 'drawdown',
        gate: true,
      },
      {
        kind: 'say',
        tag: 'why',
        title: 'Why small losses matter so much',
        body: `Lose ${formatBp(1_000)} and you need ${formatBp(recoveryBp(1_000))} back: easy. Lose ${formatBp(8_000)} and you need ${formatBp(recoveryBp(8_000))}: almost impossible. That’s why stops and position sizing come before any strategy.`,
      },
      {
        kind: 'choice',
        tag: 'check',
        prompt: `You’re down ${formatBp(2_000)}. What gain gets you back?`,
        options: [
          {
            label: formatBp(2_000),
            feedback: `A bit more is needed: ${formatBp(recoveryBp(2_000))}.`,
          },
          {
            label: formatBp(recoveryBp(2_000)),
            correct: true,
            feedback: 'Right.',
          },
          {
            label: formatBp(4_000),
            feedback: `Less than that: ${formatBp(recoveryBp(2_000))}.`,
          },
        ],
      },
    ],
  },

  r5: {
    id: 'r5',
    takeaways: [
      'High leverage leaves no room for an ordinary wobble.',
      'Where the market ends matters less than the path it takes to get there.',
      'Pick leverage so your stop, not the broker, decides when you’re out.',
    ],
    beats: () => {
      const low = runLeverage(LEVERAGE_LAB, 5, SEEDS.leverage);
      const high = runLeverage(LEVERAGE_LAB, 25, SEEDS.leverage);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Back to leverage, with better eyes',
          body: 'You know about stops and sizing now. Let’s see how leverage interacts with them.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `The same trade at 5× and at 25×. The market ends ${formatBp(-LEVERAGE_LAB.endMoveBp)} lower, but dips further on the way. Which survives?`,
          options: [
            {
              label: 'Only 5×',
              correct: low.liquidatedAt === null && high.liquidatedAt !== null,
              feedback: `Right: at 25× you’re closed out at ${formatBp(high.liquidationBp)}, and the dip went to ${formatBp(high.worstBp)}.`,
            },
            {
              label: 'Both',
              correct: false,
              feedback: `25× is closed out at ${formatBp(high.liquidationBp)}, and the dip went further than that.`,
            },
            {
              label: 'Neither',
              correct: false,
              feedback: `5× has room for a ${formatBp(-low.liquidationBp)} fall. It survives, down ${usd(-low.pnl)}.`,
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Run it both ways',
          body: 'Try 5× and 25× on the same day.',
          widget: 'leverage',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'If a normal wobble can close you out, your stop never gets its chance. Choose leverage after you’ve chosen the stop, so the stop decides when you leave.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'Which comes first when you plan a leveraged trade?',
          options: [
            {
              label: 'The stop, then the size, then the leverage',
              correct: true,
              feedback:
                'Right: leverage is the last and least important choice.',
            },
            {
              label: 'The leverage, then the stop',
              feedback:
                'Backwards: leverage should fit the stop, not squeeze it.',
            },
          ],
        },
      ];
    },
  },

  r6: {
    id: 'r6',
    takeaways: [
      'Expectancy = win rate × average win − loss rate × average loss.',
      'A positive expectancy still has losing streaks. Sizing is what lets you survive them.',
      'Test a strategy over many trades before you trust it.',
    ],
    beats: () => {
      const strategy = { winBp: 4_000, winR: 250, lossR: 100 };
      const e = expectancyR(strategy);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'What one trade is worth, on average',
          body: 'One trade tells you nothing. Two hundred start to tell you whether you have an edge. Expectancy is what a trade is worth on average, in R.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'A strategy wins 60% of its trades. Is it profitable?',
          options: [
            {
              label: 'Yes, it wins more than it loses',
              feedback:
                'Not necessarily. If its losses are much bigger than its wins, it still loses money.',
            },
            {
              label: 'It depends on the size of the wins and losses',
              correct: true,
              feedback: 'Exactly. Win rate alone says nothing.',
            },
            {
              label: 'No',
              feedback:
                'It might be. You need the size of wins and losses to know.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Run 200 trades',
          body: 'Set a strategy, run it, and watch the account, losing streaks and all.',
          widget: 'expectancy',
          props: { seed: SEEDS.expectancy },
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'Even a good strategy has ugly stretches. If you risk too much per trade, a normal losing streak ends you before the edge shows up.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `Win ${formatBp(strategy.winBp)} of trades at ${r(strategy.winR)}, lose the rest at ${r(-strategy.lossR)}. What’s the expectancy per trade?`,
          options: [
            {
              label: r(e),
              correct: true,
              feedback: `Right: ${formatBp(strategy.winBp)} × ${r(strategy.winR)} − ${formatBp(10_000 - strategy.winBp)} × ${r(strategy.lossR)}.`,
            },
            {
              label: r(strategy.winR),
              feedback: 'That’s a win. On average you also carry the losses.',
            },
            { label: r(-e), feedback: `Positive, not negative: ${r(e)}.` },
          ],
        },
      ];
    },
  },
};
