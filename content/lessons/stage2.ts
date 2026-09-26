import type { LessonDef } from '../../lib/lessons/types.ts';
import { formatMoney, fromMinor } from '../../lib/core/money.ts';
import { anatomy, chartScenario, touches } from '../../lib/engines/chart.ts';
import { breakout, breakoutVolumeTenths } from '../../lib/engines/candles.ts';
import { SEEDS } from './seeds.ts';

/** Stage 2: read a chart. Numbers come from lib/engines, computed as the lesson opens. */

const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));

export const STAGE_2: Record<string, LessonDef> = {
  c1: {
    id: 'c1',
    takeaways: [
      'A line chart joins the closes: clean, but it hides the journey.',
      'Bars and candles show each period’s open, high, low and close.',
      'Candles make the fight between buyers and sellers easy to see.',
    ],
    beats: () => {
      const candle = chartScenario(SEEDS.chart, 'bounce').seen[20]!;
      const up = candle.close >= candle.open;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Same week, three charts',
          body: 'Every chart draws the same trades. What changes is how much of each period’s story it shows you.',
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Switch between them',
          body: 'Look at the same prices as a line, as bars and as candles.',
          widget: 'chart-types',
          gate: true,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Which chart hides how far price travelled inside each period?',
          options: [
            {
              label: 'The line chart',
              correct: true,
              feedback:
                'Yes. It only joins the closes. A day that swung wildly and closed flat looks calm.',
            },
            {
              label: 'The candle chart',
              feedback:
                'Candles show the high and low of every period as wicks. The line hides them.',
            },
            {
              label: 'The bar chart',
              feedback:
                'Bars show the high and low as the vertical line. It’s the line chart that hides them.',
            },
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why traders use candles',
          body: 'The body shows where the period opened and closed; the wicks show how far each side pushed. At a glance you can see who won each round.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `A candle opened at ${usd(candle.open)} and closed at ${usd(candle.close)}. Who won that period?`,
          options: [
            {
              label: 'Buyers',
              correct: up,
              feedback: up
                ? 'Right: it closed higher than it opened.'
                : `It closed lower (${usd(candle.close)}) than it opened, so sellers won.`,
            },
            {
              label: 'Sellers',
              correct: !up,
              feedback: up
                ? `It closed higher (${usd(candle.close)}) than it opened, so buyers won.`
                : 'Right: it closed lower than it opened.',
            },
          ],
        },
      ];
    },
  },

  c2: {
    id: 'c2',
    takeaways: [
      'The body runs from open to close; the wicks reach the high and the low.',
      'A long wick is a push that failed.',
      'Up candles are hollow and down candles are filled here, so you never need colour to read them.',
    ],
    beats: () => {
      const candle = chartScenario(SEEDS.chart, 'bounce').seen[17]!;
      const parts = anatomy(candle);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Four prices in one shape',
          body: 'Every candle holds four prices: where the period opened, the highest it reached, the lowest, and where it closed.',
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Step through the candles',
          body: 'Move along the chart and read each candle’s four prices.',
          widget: 'candle-anatomy',
          gate: true,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'A candle has a long bottom wick and closes near its high. What happened in that period?',
          options: [
            {
              label: 'Sellers pushed price down, and buyers pushed it back up',
              correct: true,
              feedback:
                'Exactly. The wick is where sellers got to; the close is where buyers left it.',
            },
            {
              label: 'Sellers won the period',
              feedback:
                'Sellers pushed, but it closed near the high. Buyers finished stronger.',
            },
            {
              label: 'Nothing happened',
              feedback:
                'A long wick means a big push that failed. Something definitely happened.',
            },
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why wicks matter',
          body: 'Wicks show rejection: price went somewhere and was pushed back. Long wicks near a level you’re watching are often the first sign that buyers or sellers are defending it.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `Open ${usd(candle.open)}, high ${usd(candle.high)}, low ${usd(candle.low)}, close ${usd(candle.close)}. How long is the body?`,
          options: [
            {
              label: usd(parts.body),
              correct: true,
              feedback: 'Right: the distance between open and close.',
            },
            {
              label: usd(parts.range),
              feedback: `That’s the whole candle, high to low. The body is open to close: ${usd(parts.body)}.`,
            },
            {
              label: usd(parts.lowerWick),
              feedback: `That’s the bottom wick. The body is open to close: ${usd(parts.body)}.`,
            },
          ],
        },
      ];
    },
  },

  c3: {
    id: 'c3',
    takeaways: [
      'The same market tells different stories on different timeframes.',
      'A dip on the hourly chart can sit inside a rise on the daily.',
      'Pick your timeframe on purpose, and check the one above it.',
    ],
    beats: () => [
      {
        kind: 'say',
        tag: 'see',
        title: 'Zoom in, zoom out',
        body: 'A daily candle holds a whole day of trading. The hourly chart shows the same day as many smaller candles.',
      },
      {
        kind: 'choice',
        tag: 'predict',
        prompt:
          'The hourly chart has been falling all afternoon. Can the daily chart still be rising?',
        options: [
          {
            label: 'Yes, a short dip can sit inside a longer rise',
            correct: true,
            feedback:
              'Yes. Zoom out and a scary afternoon can be a small pullback in a strong uptrend.',
          },
          {
            label: 'No, they always agree',
            feedback:
              'They often disagree. Short moves happen inside longer ones all the time.',
          },
        ],
      },
      {
        kind: 'widget',
        tag: 'touch',
        title: 'Same market, three timeframes',
        body: 'Switch between hourly, four-hourly and daily candles.',
        widget: 'timeframes',
        props: { seed: SEEDS.timeframes },
        gate: true,
      },
      {
        kind: 'say',
        tag: 'why',
        title: 'Why it matters',
        body: 'Many losing trades are good trades on the wrong timeframe: buying a dip that was really the start of a daily downtrend. Traders take direction from the bigger picture and timing from the smaller one.',
      },
      {
        kind: 'choice',
        tag: 'check',
        prompt:
          'You see a buying chance on the hourly chart. What should you check first?',
        options: [
          {
            label: 'Which way the daily chart is going',
            correct: true,
            feedback: 'Right: trade with the bigger trend where you can.',
          },
          {
            label: 'The one-minute chart',
            feedback:
              'Smaller timeframes add noise. Check the bigger one first.',
          },
          {
            label: 'Nothing, the hourly is enough',
            feedback:
              'The hourly is only part of the story. The daily tells you which way the tide runs.',
          },
        ],
      },
    ],
  },

  c4: {
    id: 'c4',
    takeaways: [
      'An uptrend is higher highs and higher lows. A downtrend is lower highs and lower lows.',
      'Anything else is sideways, and that’s common.',
      'A trend ends when the pattern breaks, not when it “feels” high.',
    ],
    beats: () => [
      {
        kind: 'say',
        tag: 'see',
        title: 'What a trend actually is',
        body: 'Forget “it looks like it’s going up”. Mark the swing highs and lows, the turning points, and compare them.',
        points: [
          'Uptrend: each high above the last, each low above the last.',
          'Downtrend: each high below the last, each low below the last.',
          'Anything else: sideways.',
        ],
      },
      {
        kind: 'choice',
        tag: 'predict',
        prompt:
          'Before marking anything: which way do you think the first chart is going?',
        options: [
          {
            label: 'Up',
            correct: true,
            feedback: 'Let’s check it properly: mark the swings and see.',
          },
          {
            label: 'Down',
            feedback:
              'Let’s check it properly: mark the swings and see what they say.',
          },
          {
            label: 'Sideways',
            feedback:
              'Let’s check it properly: mark the swings and see what they say.',
          },
        ],
      },
      {
        kind: 'widget',
        tag: 'touch',
        title: 'Mark the swings',
        body: 'Reveal the swing points on each chart and read the trend from them.',
        widget: 'trend-swings',
        props: { up: SEEDS.trendUp, down: SEEDS.trendDown },
        gate: true,
      },
      {
        kind: 'say',
        tag: 'why',
        title: 'Why this definition helps',
        body: 'It turns a feeling into something you can check. And it tells you when you’re wrong: an uptrend is in doubt the moment a low comes in below the last one.',
      },
      {
        kind: 'choice',
        tag: 'check',
        prompt:
          'The highs keep getting lower, and so do the lows. What trend is this?',
        options: [
          {
            label: 'Uptrend',
            feedback:
              'Lower highs and lower lows is the definition of a downtrend.',
          },
          { label: 'Downtrend', correct: true, feedback: 'Right.' },
          {
            label: 'Sideways',
            feedback:
              'Sideways has no clear pattern. Lower highs and lower lows is a downtrend.',
          },
        ],
      },
    ],
  },

  c5: {
    id: 'c5',
    takeaways: [
      'Support is where buyers stepped in before; resistance is where sellers did.',
      'It’s evidence, not a promise. Plan for it to hold and for it to break.',
      'Broken support often becomes resistance, and the other way round.',
    ],
    beats: () => {
      const scenario = chartScenario(SEEDS.chart, 'bounce');
      const count = touches(scenario, scenario.support, 'support').length;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Floors and ceilings',
          body: 'When price keeps turning up from the same area, buyers are waiting there. That’s support. Where it keeps turning down, sellers are waiting: resistance.',
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Find the floor',
          body: 'Which line have buyers defended again and again?',
          widget: 'find-support',
          gate: true,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `Price has turned up at ${usd(scenario.support)} ${count} times. It’s back there again. What’s true?`,
          options: [
            {
              label: 'It will bounce again',
              feedback:
                'Maybe. But support is evidence, not a promise. Every support breaks eventually.',
            },
            {
              label: 'It might hold or break, so plan for both',
              correct: true,
              feedback:
                'Exactly. That’s what a stop loss is for, and it’s the next stage of the roadmap.',
            },
            {
              label: 'It must break this time',
              feedback: 'Nobody knows. Plan for both.',
            },
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Zones, not lines',
          body: 'Real support is a zone: wicks poke through it and price closes back above. Draw it as a band and expect some noise around it.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Support breaks and price falls. Later it rises back to that level. What often happens there?',
          options: [
            {
              label: 'It acts as resistance',
              correct: true,
              feedback:
                'Right. Old support often becomes new resistance: people who bought there want out at break-even.',
            },
            {
              label: 'Nothing, it’s forgotten',
              feedback:
                'Markets remember. Broken support often becomes resistance.',
            },
          ],
        },
      ];
    },
  },

  c6: {
    id: 'c6',
    takeaways: [
      'Markets either trend or range, and ranges are common.',
      'Trend tools (moving averages, breakouts) fail in ranges; range tools (buy low, sell high) fail in trends.',
      'Name the market first, then pick the tool.',
    ],
    beats: () => [
      {
        kind: 'say',
        tag: 'see',
        title: 'Going somewhere, or going nowhere?',
        body: 'A trending market travels. A ranging market moves a lot but ends up roughly where it started.',
      },
      {
        kind: 'widget',
        tag: 'touch',
        title: 'Sort four charts',
        body: 'Call each one a trend or a range, then see how efficiently it actually travelled.',
        widget: 'range-or-trend',
        gate: true,
      },
      {
        kind: 'choice',
        tag: 'predict',
        prompt: 'Which approach fits a range?',
        options: [
          {
            label: 'Buy near support, sell near resistance',
            correct: true,
            feedback:
              'Right, until the range breaks, which is why you still need a stop.',
          },
          {
            label: 'Buy breakouts and hold',
            feedback:
              'In a range, most breakouts fail and fall back. That’s a trend tool.',
          },
          {
            label: 'Follow a moving average crossover',
            feedback:
              'Crossovers flip back and forth in a range and lose a little each time.',
          },
        ],
      },
      {
        kind: 'say',
        tag: 'why',
        title: 'Why it matters',
        body: 'Most strategies work in one kind of market and bleed in the other. The skill is noticing which one you’re in before you pick the tool.',
      },
      {
        kind: 'choice',
        tag: 'check',
        prompt:
          'Price moved a lot this month but closed almost where it started. Trend or range?',
        options: [
          {
            label: 'Range',
            correct: true,
            feedback: 'Right: lots of movement, little progress.',
          },
          {
            label: 'Trend',
            feedback:
              'A trend makes progress. Ending where it started is a range.',
          },
        ],
      },
    ],
  },

  c7: {
    id: 'c7',
    takeaways: [
      'Volume is how many traded: who showed up.',
      'A breakout on heavy volume has conviction behind it; on thin volume it’s easy to reverse.',
      'Volume is evidence, not a guarantee.',
    ],
    beats: () => {
      const real = breakout(SEEDS.breakout, 'real');
      const tenths = breakoutVolumeTenths(real);
      const times = `${Math.floor(tenths / 10)}.${tenths % 10}`;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Who showed up',
          body: 'Under a chart, bars show how much was traded in each period. A move on big volume means many people agreed; a move on thin volume means few did.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Two charts break above the same ceiling. One breakout traded far more than usual; the other traded less than usual. Which is more likely to hold?',
          options: [
            {
              label: 'The one on heavy volume',
              correct: true,
              feedback: 'Usually, yes. Lots of buyers committed at the break.',
            },
            {
              label: 'The one on light volume',
              feedback:
                'Thin volume means few committed buyers; it’s easy for sellers to push it back.',
            },
            {
              label: 'Volume makes no difference',
              feedback:
                'Volume shows conviction. It isn’t a guarantee, but it’s real evidence.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Real or fake?',
          body: 'Show the volume, pick the breakout you trust, then play what happened.',
          widget: 'volume-breakout',
          props: { seed: SEEDS.breakout },
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: `The real breakout traded about ${times} times the range’s average volume. Fake breakouts, where price pops above a ceiling and falls back, trap people who buy the first candle without checking who’s behind it.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Price breaks out on thin volume and you’re tempted to buy. What’s the careful move?',
          options: [
            {
              label: 'Wait for a close above the level with volume behind it',
              correct: true,
              feedback: 'Right: let the market show you commitment first.',
            },
            {
              label: 'Buy more, it’s cheap before everyone notices',
              feedback:
                'Thin volume often means nobody is coming. Wait for proof.',
            },
          ],
        },
      ];
    },
  },
};
