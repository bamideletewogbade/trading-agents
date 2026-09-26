import type { LessonDef } from '../../lib/lessons/types.ts';
import {
  formatBp,
  formatMoney,
  fromMinor,
  mulDiv,
} from '../../lib/core/money.ts';
import {
  ACCOUNT,
  HEAVY_VOLUME_TENTHS,
  INVESTING,
  NEWS_DAY,
  PLANS,
  STRATEGIES,
  STYLE_DAYS,
  TRADING_DAYS_A_MONTH,
  allChoices,
  backtest,
  breakoutResults,
  breakoutSetup,
  investing,
  market,
  moveBp,
  newsSeason,
  optimise,
  seasonSummary,
  tradeBreakout,
  tradeStyles,
  type Choice,
  type Trade,
} from '../../lib/engines/strategy.ts';
import { BREAKOUT_COUNT, STAGE6_SEEDS } from './seeds.ts';
import { WIDGET_COPY } from './widgets.ts';

/**
 * Stage 6: strategies. Every market here is made up by
 * lib/engines/strategy.ts, and every number in the words is that engine's,
 * worked out as the lesson opens. The point is never "this strategy
 * works": it's what each one is for, how it fails, and how to test one
 * before trusting it.
 */

const usd = (cents: number, signed = false) =>
  formatMoney(fromMinor(cents, 'USD'), { signed });
const ghs = (pesewas: number) => formatMoney(fromMinor(pesewas, 'GHS'));
const pct = (bp: number, signed = false) => formatBp(bp, { signed });
/** Hundredths of R as "+1.85R". */
const rOf = (hundredths: number) => {
  const a = Math.abs(hundredths);
  const sign = hundredths < 0 ? '−' : hundredths > 0 ? '+' : '';
  return `${sign}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}R`;
};
const averageR = (trades: readonly Trade[]) =>
  trades.length
    ? Math.round(trades.reduce((sum, t) => sum + t.r, 0) / trades.length)
    : 0;
const times = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** The builder's rules, as a sentence. */
const ENTRY_WORDS: Record<Choice['entry'], string> = {
  'ma-cross': 'buy when the averages cross up',
  breakout: 'buy a new 20-bar high',
  'band-low': 'buy below the lower band',
  'rsi-dip': 'buy when RSI dips under 30',
};
const EXIT_WORDS: Record<Choice['exit'], string> = {
  signal: 'sell on its own exit signal',
  target: 'sell at 2R',
  time: 'sell after 10 bars',
};

export const STAGE_6: Record<string, LessonDef> = {
  s1: {
    id: 's1',
    takeaways: [
      'Trend following buys after a rise has started and sells after it ends. It never gets the top or the bottom.',
      'It loses small and often when the market goes sideways, and wins big in the few long trends.',
      'The hard part is the long wait without a new high. The rules only work if you keep following them.',
    ],
    beats: () => {
      const trendyBars = market(STAGE6_SEEDS.trend, PLANS.trendy).bars;
      const trendy = backtest(trendyBars, STRATEGIES.trend);
      const choppy = backtest(
        market(STAGE6_SEEDS.trend, PLANS.choppy).bars,
        STRATEGIES.trend,
      );
      const t = trendy.stats;
      const c = choppy.stats;
      const won = trendy.trades.filter((x) => x.pnl > 0);
      const lost = trendy.trades.filter((x) => x.pnl <= 0);
      const best = Math.max(...trendy.trades.map((x) => x.r));
      const months = Math.round(t.longestFlat / TRADING_DAYS_A_MONTH);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Rules, not predictions',
          body: 'A trend follower doesn’t guess where price will go. They wait for it to start going somewhere, then follow. One common set of rules:',
          points: [
            'Buy when the 10-bar average crosses above the 30-bar average (lesson t2).',
            'Sell when it crosses back below.',
            'Put a stop 3 ATRs below the entry, and size the trade to risk 1% of the account (lessons t5 and r2).',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'These rules run on a made-up market with a few long trends and some sideways stretches. How many of their trades do you expect to win?',
          options: [
            {
              label: 'Fewer than half',
              correct: true,
              feedback: `Yes: ${t.wins} of ${t.trades}. A few big winners pay for the rest.`,
            },
            {
              label: 'Most of them',
              feedback: `Only ${t.wins} of ${t.trades} won. Trend following is wrong often, and small each time.`,
            },
            {
              label: 'All of them, if the rules are good',
              feedback:
                'No rules win every trade. Good ones keep the losses small.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Run the rules',
          body: 'Play through time and watch the account under the chart. ▲ is a buy, ▼ a sell. Then try the sideways market.',
          widget: 'trend-rules',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What the rules did',
          body: `Both markets start with ${usd(ACCOUNT)} and risk 1% a trade.`,
          points: [
            `With trends: ${t.trades} trades, ${t.wins} winners, ${pct(t.returnBp, true)} at the end. The best trade made ${rOf(best)}: ${Math.floor(best / 100)} times what it risked.`,
            `The account went ${t.longestFlat} bars, out of ${trendyBars.length}, without a new high.`,
            `Mostly sideways: ${c.trades} trades, ${c.wins} winners, ${pct(c.returnBp, true)}. The averages kept crossing with nowhere to go.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'The wait is the hard part',
          body: `If each bar were a trading day, ${t.longestFlat} bars is about ${months} months without the account making a new high. That’s when most people drop the rules, often just before the trend that pays for everything.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `The rules made ${pct(t.returnBp, true)} with only ${t.wins} winning trades out of ${t.trades}. How?`,
          options: [
            {
              label: 'The winners were many times bigger than the losers',
              correct: true,
              feedback: `Yes. The average winner made ${rOf(averageR(won))}; the average loser ${rOf(averageR(lost))}.`,
            },
            {
              label: 'The spread was small',
              feedback:
                'The spread came out of every trade. It didn’t make the money.',
            },
            {
              label: 'Luck: rules don’t matter',
              feedback: `The same rules lost ${pct(-c.returnBp)} on the sideways market. What mattered was the market they met.`,
            },
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Your trend rules have lost four trades in a row in a sideways market. What do they say to do?',
          options: [
            {
              label: 'Take the next signal at the same 1% risk',
              correct: true,
              feedback:
                'Yes. Small losses in ranges are the price of being in when a trend starts.',
            },
            {
              label: 'Double the size to win it back',
              feedback:
                'That turns a losing run into a drawdown that’s hard to climb out of (lesson r4).',
            },
            {
              label: 'Stop using them until they win again',
              feedback:
                'Then you’d likely miss the trend that pays for the losses.',
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt: `Could you keep following rules through ${t.longestFlat} bars with no new high? What would help you?`,
          placeholder: 'e.g. smaller size, a journal, checking less often',
        },
      ];
    },
  },

  s2: {
    id: 's2',
    takeaways: [
      'Range trading buys near the floor and sells in the middle. It wins often, and small.',
      'When the range breaks, the same rules keep buying the fall.',
      'A stop limits one loss. A rule for when to stop trading the range limits the run of them.',
    ],
    beats: () => {
      const { bars, regimes } = market(
        STAGE6_SEEDS.range,
        PLANS.rangeThenBreak,
      );
      const breakAt = regimes.indexOf('down');
      const stop = backtest(bars, STRATEGIES.range);
      const none = backtest(bars, STRATEGIES.rangeNoStop);
      const aside = backtest(bars, STRATEGIES.rangeStandAside);
      const inRange = stop.trades.filter((t) => t.exitAt < breakAt);
      const inRangeWins = inRange.filter((t) => t.pnl > 0).length;
      const worstNone = Math.min(...none.trades.map((t) => t.pnl));
      const worstStop = Math.min(...stop.trades.map((t) => t.pnl));
      const stopsAfter = stop.trades.filter(
        (t) => t.exitAt >= breakAt && t.why === 'stop',
      ).length;
      const noneWins = none.stats.wins;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Buy low, sell the middle',
          body: 'In a range, price keeps bouncing between a floor and a ceiling (lessons c5 and c6). A range trader buys near the floor and sells in the middle. With Bollinger Bands (lesson t5), the rules can be:',
          points: [
            'Buy when price closes below the lower band.',
            'Sell when it gets back to the middle band.',
            'Put a stop 1.5 ATRs below the entry.',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'While the range holds, will these rules win more often than the trend rules did?',
          options: [
            {
              label: 'More often',
              correct: true,
              feedback: `Yes. In the range they won ${inRangeWins} of ${inRange.length}.`,
            },
            {
              label: 'Less often',
              feedback: `In the range they won ${inRangeWins} of ${inRange.length}. Buying dips in a range works, while it lasts.`,
            },
            {
              label: 'About the same',
              feedback: `They won ${inRangeWins} of ${inRange.length}: far more often.`,
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Trade the range, then the break',
          body: 'Play it to the end with no stop. Then try it with a stop, and with a stop that makes you stand aside.',
          widget: 'range-rules',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Small wins, then the break',
          body: `Each version starts with ${usd(ACCOUNT)}.`,
          points: [
            `While the range held: ${inRange.length} trades, ${inRangeWins} winners.`,
            `No stop: one trade lost ${usd(-worstNone)} when the range broke. That’s ${pct(mulDiv(-worstNone, 10_000, ACCOUNT))} of the account on a single trade. It ended ${pct(none.stats.returnBp, true)}.`,
            `A stop: no loss bigger than ${usd(-worstStop)}. But the rules kept buying the fall, and hit ${times(stopsAfter, 'stop', 'stops')} after the break. It ended ${pct(stop.stats.returnBp, true)}.`,
            `A stop, then stand aside: ${pct(aside.stats.returnBp, true)}. One stop said the range might be over, and it listened.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Ranges end without warning',
          body: 'The idea that makes range trading work (buy the dip, expect a bounce) is exactly what hurts when the range breaks. Nothing on the chart tells you which dip is the last one. The stop tells you afterwards.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `Without a stop, the rules won ${noneWins} of ${none.stats.trades} trades and still lost ${pct(-none.stats.returnBp)}. Why?`,
          options: [
            {
              label: 'Many small wins, then one huge loss',
              correct: true,
              feedback: `Yes. One loss of ${usd(-worstNone)} was bigger than all the wins together.`,
            },
            {
              label: 'The spread ate the wins',
              feedback: `The spread cost a little on each trade. The ${usd(-worstNone)} loss did the damage.`,
            },
            {
              label: 'Too few trades',
              feedback:
                'More trades like these would have meant more small wins, and the same huge loss.',
            },
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'You bought near the floor of a range. Price closed below the floor and hit your stop. What now?',
          options: [
            {
              label: 'Take the stop and wait: the range may be over',
              correct: true,
              feedback: 'Yes. Stand aside until the market shows a new shape.',
            },
            {
              label: 'Move the stop lower: it will bounce',
              feedback:
                'That’s the no-stop trade, one step at a time (lesson r1).',
            },
            {
              label: 'Buy more: it’s even cheaper now',
              feedback: 'Cheaper can keep getting cheaper when a range breaks.',
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt:
            'What would tell you a range is over, before your account does?',
          placeholder: 'e.g. a close below the floor, a stop hit, heavy volume',
        },
      ];
    },
  },

  s3: {
    id: 's3',
    takeaways: [
      'A breakout is a close above the top of a range. Many fall back in.',
      'Heavy volume on the breakout is a clue that it will hold. A clue, not a guarantee.',
      'Judge a rule on many trades, not on the one in front of you.',
    ],
    beats: () => {
      const setups = Array.from({ length: BREAKOUT_COUNT }, (_, i) =>
        breakoutSetup(`${STAGE6_SEEDS.breakouts}:${i}`),
      );
      const heavy = (i: number) =>
        setups[i]!.volumeTenths >= HEAVY_VOLUME_TENTHS;
      const all = breakoutResults(setups, () => true);
      const vol = breakoutResults(setups, (_, i) => heavy(i));
      const heavyFailed = setups.filter(
        (s, i) => heavy(i) && tradeBreakout(s).r < 0,
      ).length;
      const thinHeld = setups.filter(
        (s, i) => !heavy(i) && tradeBreakout(s).r > 0,
      ).length;
      const thinFailed = setups.filter(
        (s, i) => !heavy(i) && tradeBreakout(s).r < 0,
      ).length;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'A close above the ceiling',
          body: 'A breakout is when price closes above the top of a range. Many don’t last: price pokes out, then falls back in. Traders call those fakeouts. Two clues help:',
          points: [
            'A close above the ceiling, not just a wick through it.',
            'Heavy volume: far more trading than usual on the breakout (lesson c7).',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Two breakouts close above the same ceiling. One on twice the usual volume, one on less than usual. Which is more likely to keep going?',
          options: [
            {
              label: 'The heavy-volume one',
              correct: true,
              feedback:
                'Usually. Heavy volume means many buyers agreed, not just a few.',
            },
            {
              label: 'The quiet one',
              feedback:
                'A quiet breakout often has few buyers behind it, and falls back.',
            },
            {
              label: 'Volume makes no difference',
              feedback:
                'It helps. Not every time, but over many breakouts it does.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'decide',
          title: `Take or skip ${BREAKOUT_COUNT} breakouts`,
          body: 'Each one has just closed above its ceiling. Look at the volume, decide, then see what happened.',
          widget: 'breakout-picks',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'The volume rule, on the same breakouts',
          body: 'Every trade used the same plan: buy the close, stop just back inside the range, out after 10 bars.',
          points: [
            `Taking every one: ${all.wins} of ${all.taken} worked. ${rOf(all.totalR)} in total, ${rOf(all.averageR)} a trade.`,
            `Only those on ${HEAVY_VOLUME_TENTHS / 10}× the usual volume or more: ${vol.wins} of ${vol.taken} worked. ${rOf(vol.totalR)} in total, ${rOf(vol.averageR)} a trade.`,
            `The quiet breakouts it skipped: ${thinFailed} failed, ${thinHeld} held.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'A clue, not a guarantee',
          body: `${times(heavyFailed, 'heavy-volume breakout', 'heavy-volume breakouts')} still failed here, and ${times(thinHeld, 'quiet one', 'quiet ones')} kept going. Over many more breakouts the volume rule’s trades average more, but any dozen can be lucky or unlucky. That’s why a rule is judged by its expectancy over many trades (lesson r6), not by the last one.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A breakout closes above the ceiling on half the usual volume. Your rule takes heavy-volume breakouts only. What do you do?',
          options: [
            {
              label: 'Skip it, even if it might work',
              correct: true,
              feedback:
                'Yes. Some skipped ones will work. The rule is about the many, not this one.',
            },
            {
              label: 'Take it: this one looks different',
              feedback:
                'Every exception makes the rule harder to test, and to trust.',
            },
            {
              label: 'Take it with double size',
              feedback: 'The weaker the setup, the less reason to size up.',
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt:
            'How did your picks compare with the volume rule? What did you look at when you decided?',
          placeholder: 'e.g. I took the big candles and ignored volume',
        },
      ];
    },
  },

  s4: {
    id: 's4',
    takeaways: [
      'Day, swing and position trading are the same idea at different speeds.',
      'Faster means more trades, more spreads paid and more hours at the screen. Not more profit.',
      'Pick the style your week allows, not the one that looks exciting.',
    ],
    beats: () => {
      const runs = tradeStyles(STAGE6_SEEDS.styles);
      const [day, swing, position] = runs.map((r) => ({
        ...r.test.stats,
        hours: r.hoursWatched,
      }));
      const move = moveBp(runs[0]!.bars);
      const months = Math.round(STYLE_DAYS / TRADING_DAYS_A_MONTH);
      const line = (
        name: string,
        s: { trades: number; costs: number; hours: number; returnBp: number },
      ) =>
        `${name}: ${times(s.trades, 'trade', 'trades')}, ${usd(s.costs)} in spreads, about ${s.hours} hours at the screen, ${pct(s.returnBp, true)}.`;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Three speeds',
          body: 'Traders are often grouped by how long they hold a trade:',
          points: [
            'Day traders are in and out the same day, reading hourly charts or faster.',
            'Swing traders hold for days or weeks, reading four-hour or daily charts (lesson c3).',
            'Position traders hold for weeks or months, reading daily or weekly charts.',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Same market, same rules, same money. Which style pays the most in spreads?',
          options: [
            {
              label: 'The day trader',
              correct: true,
              feedback: `Yes: ${times(day!.trades, 'trade', 'trades')} and ${usd(day!.costs)} in spreads.`,
            },
            {
              label: 'The swing trader',
              feedback: `The swing trader paid ${usd(swing!.costs)}; the day trader ${usd(day!.costs)}.`,
            },
            {
              label: 'The position trader',
              feedback: `The position trader paid ${usd(position!.costs)}; the day trader ${usd(day!.costs)}.`,
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: `Trade ${months} months three ways`,
          body: 'Switch between the styles and compare the trades, the spreads and the hours.',
          widget: 'trade-styles',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Same market, three results',
          body: `The market itself moved ${pct(move, true)}.`,
          points: [
            line('Day', day!),
            line('Swing', swing!),
            line('Position', position!),
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Why the day trader trailed here',
          body: 'This market’s moves took weeks. A day trader is out every evening, so each trend had to be caught again the next morning, paying the spread each time. Day trading needs moves that happen inside a day, and hours at the screen to catch them. In another market it could do better. The hours and the spreads don’t change.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'You work 8 to 5 and can look at prices at lunch and in the evening. Which style fits?',
          options: [
            {
              label: 'Swing or position: decisions that can wait hours',
              correct: true,
              feedback:
                'Yes. Rules checked once or twice a day suit a working week.',
            },
            {
              label: 'Day trading, on my phone at work',
              feedback: `Day trading here took about ${day!.hours} hours at the screen. Half-watching is how stops get missed.`,
            },
            {
              label: 'Any style: time doesn’t matter',
              feedback: `It does: here the styles took from about ${position!.hours} to ${day!.hours} hours at the screen.`,
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt:
            'Which style fits your week, honestly? How many hours could you give it?',
          placeholder: 'e.g. 30 minutes each evening, so swing',
        },
      ];
    },
  },

  s5: {
    id: 's5',
    takeaways: [
      'At a release, prices jump past your order and spreads are at their widest.',
      'A straddle sounds like it can’t lose. It fills at the worst prices and gets whipsawed.',
      'Waiting for the dust to settle, or sitting out, keeps losses close to the plan.',
    ],
    beats: () => {
      const season = newsSeason(STAGE6_SEEDS.news);
      const count = season.days.length;
      const straddle = seasonSummary(season.straddle);
      const wait = seasonSummary(season.wait);
      const slippage = season.straddle.reduce((sum, t) => sum + t.slippage, 0);
      const waitWins = season.wait.filter((t) => t.pnl > 0).length;
      const whips = season.days.filter((d) => d.whip).length;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Trading the release itself',
          body: 'Some traders try to make money in the minutes after a big number comes out (lesson f6). Two popular plans:',
          points: [
            `The straddle: before the release, an order to buy ${usd(NEWS_DAY.level)} above the price and one to sell ${usd(NEWS_DAY.level)} below. Whichever fills first, you’re in; the other level is your stop.`,
            'Waiting: let the release bar finish and a few more go by, then trade the way it settled, with a stop beyond the release bar.',
            'And a third: don’t trade the release at all.',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'The straddle is in whichever way the price jumps. What could go wrong?',
          options: [
            {
              label: 'It fills past its price, then a whipsaw hits the stop',
              correct: true,
              feedback:
                'Yes. The first price after the news is often past your order, and the spread is at its widest.',
            },
            {
              label: 'Nothing: it wins either way',
              feedback:
                'It gets in either way. Getting in isn’t the same as winning.',
            },
            {
              label: 'Neither order fills',
              feedback: 'On a big release, one almost always fills.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Trade a season of releases',
          body: `Look at a few releases with each plan, then play all ${count}.`,
          widget: 'news-rules',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: `${count} releases, three plans`,
          body: `Every plan set out to risk ${usd(NEWS_DAY.risk)} a release. The price whipsawed on ${whips} of the ${count}.`,
          points: [
            `Straddle: ${usd(straddle.total, true)}. It paid ${usd(slippage)} in slippage, and lost more than it planned on ${straddle.overPlan} of ${count} days. Worst day: ${usd(straddle.worst)}.`,
            `Waiting: ${usd(wait.total, true)}. It won ${waitWins} of ${count}, and its worst day was ${usd(wait.worst)}: its plan plus the spread.`,
            `Sitting out: ${usd(0)}, and ${count} evenings free.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Speed you don’t have',
          body: 'At a release, banks and fast traders get the first prices. A straddle orders you into the rush at its worst price. Waiting gives up the first move, and gets back normal spreads and a stop that fills where you put it. It still loses when the move turns.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A rate decision is in ten minutes and you have no trade open. Which plan keeps you closest to what you meant to risk?',
          options: [
            {
              label: 'Wait until it settles, or skip it',
              correct: true,
              feedback: `Yes. Waiting never lost much more than ${usd(NEWS_DAY.risk)} here.`,
            },
            {
              label: 'A straddle: you win either way',
              feedback: `It lost more than planned on ${straddle.overPlan} of ${count} days here.`,
            },
            {
              label: 'Buy now, before everyone else',
              feedback:
                'That’s holding a trade through the news, the plan from lesson f6.',
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt:
            'Which releases matter for what you’d trade? What will you do the next time one is due?',
          placeholder:
            'e.g. check the calendar each Sunday, no trades on MPC day',
        },
      ];
    },
  },

  s6: {
    id: 's6',
    takeaways: [
      'Investing is owning businesses for years and adding to them. Trading is rules for getting in and out.',
      'Selling after falls and buying after rises usually costs more than it saves.',
      'Being out of the market for just a few of its best months costs a lot.',
    ],
    beats: () => {
      const run = investing(STAGE6_SEEDS.investing);
      const end = (values: readonly number[]) => values.at(-1)!;
      const [first, second] = INVESTING.crashes;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Two different games',
          body: 'Trading is rules for getting in and out, over days or weeks. Investing is owning a share of many businesses for years, and adding to it. They need different habits. The one that hurts investors most is acting like a trader.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `Ten years, ${ghs(INVESTING.monthly)} a month into a stock index, two crashes. Who ends up with more?`,
          options: [
            {
              label: 'The one who buys every month, whatever happens',
              correct: true,
              feedback: `Yes, here: ${ghs(end(run.steady))} against ${ghs(end(run.timer))}.`,
            },
            {
              label: 'The one who sells after falls and buys after rises',
              feedback: `Here the timer ended with ${ghs(end(run.timer))}, against ${ghs(end(run.steady))} for buying every month.`,
            },
            {
              label: 'They end up about the same',
              feedback: `${ghs(end(run.steady))} against ${ghs(end(run.timer))}: not the same.`,
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Ten years, three savers',
          body: 'Drag through the ten years. Watch what each saver does in the crashes.',
          widget: 'invest-vs-trade',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Where they ended',
          body: `Each put in ${ghs(run.paidIn)} over the ten years.`,
          points: [
            `Buying every month: ${ghs(end(run.steady))}.`,
            `Selling after a ${pct(INVESTING.timerBp)} fall and buying back after a ${pct(INVESTING.timerBp)} rise: ${ghs(end(run.timer))}. It switched ${run.switches} times, paid ${pct(INVESTING.switchCostBp)} each time, and each time it sold, missed the first ${pct(INVESTING.timerBp)} of the rise back.`,
            `Buying every month, but out for just the ${INVESTING.missBest} best months: ${ghs(end(run.missed))}.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'The index is made up; the habit is real',
          body: `This index was drawn to rise about ${pct(INVESTING.driftBp)} in an average month, with crashes of ${pct(first!.lossBp)} and ${pct(second!.lossBp)} in a single month. Real markets can fall further and take years to recover, and nothing here promises a return. What it shows: selling after falls and buying after rises cost more than it saved in most runs of this model.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'You invest every month for the long term. The market falls 20% in a month. What does your plan say?',
          options: [
            {
              label: 'Keep buying every month',
              correct: true,
              feedback:
                'Yes. This month’s money buys more units than last month’s did.',
            },
            {
              label: 'Sell and wait for it to recover',
              feedback: `That’s the timer. It ended with ${ghs(end(run.timer))}.`,
            },
            {
              label: 'Stop adding until it’s back up',
              feedback: 'Then you stop buying exactly when prices are lowest.',
            },
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'Which of these is investing, not trading?',
          options: [
            {
              label: 'Adding a little to a broad index every month for years',
              correct: true,
              feedback: 'Yes. Owning many businesses, for a long time.',
            },
            {
              label: 'Buying a share because it rose 20% this week',
              feedback: 'That’s a trade on momentum, with a trader’s risks.',
            },
            {
              label: 'Selling everything when the news looks bad',
              feedback: 'That’s timing the market: the timer here.',
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt:
            'What part of your money is for trading, and what part for investing? What would you do in a crash?',
          placeholder: 'e.g. trading money is small; the rest goes in monthly',
        },
      ];
    },
  },

  s7: {
    id: 's7',
    takeaways: [
      'A strategy is written rules: entry, exit, stop and size, decided before you trade.',
      'A backtest is the best case. The rules that did best on the past usually do worse next.',
      'Forward-test on paper, on prices the rules have never seen, before you trust them with money.',
    ],
    beats: () => {
      const tried = allChoices().length;
      const o = optimise(STAGE6_SEEDS.builder);
      const W = WIDGET_COPY.strategyBuilder;
      const name = (c: Choice) =>
        `${ENTRY_WORDS[c.entry]}, ${EXIT_WORDS[c.exit]}, a ${W.stops[c.stopAtrTenths as keyof typeof W.stops]} stop`;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'A strategy is written down',
          body: 'Everything in this stage fits in four lines. Write them before you trade, and follow them exactly, so they can be tested:',
          points: [
            'Entry: when you buy.',
            'Exit: when you sell a trade that’s working.',
            'Stop: when you sell a trade that isn’t (lesson r1).',
            'Size: how much you risk on each trade (lesson r2).',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `A computer tries all ${tried} combinations of rules on the past and keeps the best. On what came next, the best of the past will most likely…`,
          options: [
            {
              label: 'Do worse than it did on the past',
              correct: true,
              feedback:
                'Usually. Part of its past result was luck, and luck doesn’t repeat.',
            },
            {
              label: 'Do just as well',
              feedback:
                'Sometimes. More often it does worse: it was chosen for doing well on those prices.',
            },
            {
              label: 'Do even better',
              feedback:
                'It happens, but it’s the exception. Expect less than the backtest.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'decide',
          title: 'Build, backtest, forward-test',
          body: 'Pick your rules. Backtest them on the past, then see what they did on what came next. Then let the computer optimise.',
          widget: 'strategy-builder',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What optimising did',
          body: `The computer tested all ${tried} combinations on the past.`,
          points: [
            `The best: ${name(o.best)}. On the past it made ${pct(o.past.stats.returnBp, true)}.`,
            `On what came next it made ${pct(o.future.stats.returnBp, true)}, and ranked ${o.futureRank} of ${o.tried}.`,
            `An average combination made ${pct(o.futureAverageBp, true)} on what came next. So part of the best one’s edge was real, and part was luck. From the backtest alone, you can’t tell which part.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Forward-test before you trust',
          body: 'A backtest is the best case: you kept the rules that did well there. A forward test runs the rules on new prices, on paper, before any money. It’s the only test the rules can’t have been fitted to. The next stage does exactly that, for 30 days.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Your rules made 40% on the past, after you tried 50 versions. What should you expect?',
          options: [
            {
              label: 'Less, maybe much less. Forward-test on paper first',
              correct: true,
              feedback:
                'Yes. The more versions you tried, the more of that 40% was luck.',
            },
            {
              label: 'About 40% a year from now on',
              feedback: `The best of ${tried} made ${pct(o.past.stats.returnBp, true)} on the past and ${pct(o.future.stats.returnBp, true)} next.`,
            },
            {
              label: 'More: I’ll keep improving it',
              feedback:
                'Improving on the same past fits it even more closely, and the future less.',
            },
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'Which of these is a rule you could backtest?',
          options: [
            {
              label:
                'Buy when the 10-bar average crosses above the 30-bar average',
              correct: true,
              feedback:
                'Yes. Anyone, or any computer, would buy on the same bar.',
            },
            {
              label: 'Buy when it looks strong',
              feedback: 'A computer can’t test a feeling, and neither can you.',
            },
            {
              label: 'Sell when I get nervous',
              feedback:
                'Nerves are real, but not a rule. Put them in the stop and the size.',
            },
          ],
        },
        {
          kind: 'reflect',
          tag: 'again',
          prompt:
            'Write your strategy: entry, exit, stop and size, one line each.',
          placeholder:
            'e.g. Buy on a close above the 20-day high; sell on a close below the 10-day low; stop 2 ATR; risk 1%',
        },
      ];
    },
  },
};
