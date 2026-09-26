import type { LessonDef } from '../../lib/lessons/types.ts';
import { formatBp, formatMoney, fromMinor } from '../../lib/core/money.ts';
import { walkCandles } from '../../lib/engines/candles.ts';
import {
  atr,
  barsUntilTurnDown,
  crossovers,
  ema,
  firstAbove,
  macd,
  rsi,
  sma,
} from '../../lib/engines/indicators.ts';
import {
  FIB_LEVELS_BP,
  MADE_UP_LEVELS_BP,
  buyTheDip,
  channel,
  divergence,
  doubleTop,
  judgeLine,
  lineThrough,
  noiseStopOuts,
  rsiAtHighs,
  strongRun,
  testLevels,
  testPatterns,
  topSeries,
} from '../../lib/engines/ta.ts';
import { GUESSED_STOP, MARKETS, STAGE4_SEEDS } from './seeds.ts';

/**
 * Stage 4: technical analysis. Numbers come from lib/engines, computed as
 * the lesson opens. Where a tool is famous for predicting things (patterns,
 * Fibonacci), the lesson tests it against a baseline on simulated charts
 * with no edge built in, and says so.
 */

const usd = (cents: number) => formatMoney(fromMinor(Math.round(cents), 'USD'));
const signedUsd = (cents: number) =>
  formatMoney(fromMinor(Math.round(cents), 'USD'), { signed: true });
/** Basis points to a whole percent, for words: 4981 → "50%". */
const pct = (bp: number) => formatBp(Math.round(bp / 100) * 100);
const levels = (bps: readonly number[]) =>
  bps.map((bp) => formatBp(bp)).join(', ');

const PATTERN_NAMES = {
  engulfing: 'Bullish engulfing',
  hammer: 'Hammer',
  doji: 'Doji',
  'any bar': 'Any candle at all',
} as const;

export const STAGE_4: Record<string, LessonDef> = {
  t1: {
    id: 't1',
    takeaways: [
      'Any two points make a line. A trendline earns the name when price comes back to it and holds.',
      'Draw through the lows in an uptrend, the highs in a downtrend.',
      'A close through the line is news. Don’t redraw the line to make it fit.',
    ],
    beats: () => {
      const ch = channel(STAGE4_SEEDS.channel);
      const by = new Map(ch.lows.map((low) => [low.key, low]));
      const report = (p: string, q: string) =>
        judgeLine(
          ch.bars,
          lineThrough(by.get(p)!, by.get(q)!),
          ch.tolerance,
          0,
        );
      const good = report('A', 'B');
      const trap = report('A', ch.odd);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Connect the lows',
          body: 'In a rising market each dip stops a little higher than the last. Join those lows and you get a line that price may keep coming back to. That’s a trendline, if it earns it.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'How many lows does it take before a line means anything?',
          options: [
            {
              label: 'Two: that’s enough to draw it',
              feedback:
                'Two points always make a line. That’s geometry, not evidence.',
            },
            {
              label: 'Three or more, with price respecting it in between',
              correct: true,
              feedback:
                'Yes. The third touch is the first time the line is tested rather than drawn.',
            },
            {
              label: 'One, if the bounce was big',
              feedback: 'One bounce is a low. It isn’t a line yet.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Draw the line',
          body: `${ch.lows.length} lows are marked. Tap two to draw a line through them. Most pairs give a line price keeps respecting; one low is a trap.`,
          widget: 'trendline',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What made the good line good',
          body: 'Same chart, two lines:',
          points: [
            `Through A and B: price came back to it ${good.touches.length} times and ${good.breaks.length === 0 ? 'never closed below it' : `closed below it ${good.breaks.length} times`}.`,
            `Through A and ${ch.odd}: price closed straight through it ${trap.breaks.length} times. Neatly drawn, and meaningless.`,
            'The lesson isn’t which lows to pick. It’s to judge a line by what price did at it, not by how it looks.',
          ],
        },
        {
          kind: 'say',
          tag: 'again',
          title: 'Two lines make a channel',
          body: `Copy the trendline’s slope to the highs and you have a channel, here ${usd(ch.width)} wide: price swinging between two parallel lines. Traders buy near the lower line and take profit near the upper one, until it breaks. Every channel breaks eventually.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Price closes clearly below your rising trendline. What does it tell you?',
          options: [
            {
              label: 'The line was wrong. Redraw it through the new low',
              feedback:
                'Redrawing lines until they fit is how people fool themselves. The break is the information.',
            },
            {
              label:
                'The buyers who defended it didn’t this time. The trend may be changing',
              correct: true,
              feedback:
                'Right. It isn’t proof of a new downtrend, but the reason you were holding has changed.',
            },
            {
              label: 'Buy more: it’s cheaper now',
              feedback:
                'Adding to a trade after the reason for it broke is how small losses become big ones (lesson r1).',
            },
          ],
        },
      ];
    },
  },

  t2: {
    id: 't2',
    takeaways: [
      'A moving average smooths out the noise so the direction shows.',
      'Longer means smoother and later. An EMA reacts sooner than an SMA of the same length.',
      'Crossovers confirm what already happened. They don’t call tops.',
    ],
    beats: () => {
      const { bars, top } = topSeries(STAGE4_SEEDS.top);
      const closes = bars.map((bar) => bar.close);
      const lag = (values: (number | null)[]) => barsUntilTurnDown(values, top);
      const cross = crossovers(sma(closes, 20), sma(closes, 30)).find(
        (c) => c.direction === 'down' && c.index >= top,
      );
      const crossBar = cross ? bars[cross.index]! : bars[bars.length - 1]!;
      const fallen = bars[top]!.high - crossBar.close;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'An average that moves',
          body: 'A 20-bar moving average is the average close of the last 20 bars, worked out again at every bar. It irons out the wobbles so the direction shows. The price of smoothing is lag.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'Price tops out. When does a 20-bar average turn down?',
          options: [
            {
              label: 'At the top',
              feedback:
                'It can’t: most of the bars it averages are still from the climb.',
            },
            {
              label: 'Some bars after the top',
              correct: true,
              feedback:
                'Yes. It has to wait for enough lower closes to outweigh the old highs.',
            },
            {
              label: 'Just before the top',
              feedback:
                'An average only knows the past. Nothing built from old prices can turn first.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Drag the length',
          body: 'Change the length and switch between SMA and EMA. Watch how late each one turns after the top. Then add a slower average.',
          widget: 'moving-averages',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'The lag, measured',
          body: 'On this chart, after the top, the average turned down:',
          points: [
            `SMA 5: ${lag(sma(closes, 5))} bars later.`,
            `SMA 20: ${lag(sma(closes, 20))} bars later.`,
            `SMA 40: ${lag(sma(closes, 40))} bars later.`,
            `EMA 20, which weights recent bars more: ${lag(ema(closes, 20))} bars later. Faster, and shaken by more noise.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Crossovers arrive late',
          body: cross
            ? `The 20-bar average crossed below the 30-bar one ${cross.index - top} bars after the top. By then price had already fallen ${usd(fallen)} from its high. A crossover confirms a turn; it doesn’t catch it.`
            : 'The 20-bar average never crossed below the 30-bar one on this chart, even though price fell. A crossover confirms a turn; it doesn’t catch it.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'What is a moving average good for?',
          options: [
            {
              label: 'Predicting the next move',
              feedback: 'It’s built from old prices. It can only describe.',
            },
            {
              label: 'Seeing the direction through the noise, a little late',
              correct: true,
              feedback:
                'Exactly. Direction, filtered, with a delay you choose by its length.',
            },
            {
              label: 'Giving exact entry prices',
              feedback:
                'Price crosses averages all the time. Where you’re wrong still decides the trade (lesson r1).',
            },
          ],
        },
      ];
    },
  },

  t3: {
    id: 't3',
    takeaways: [
      'RSI measures how fast price has moved, from 0 to 100.',
      '“Overbought” means “risen fast”, not “about to fall”. Strong trends stay above 70.',
      'Ask trend or range first (lesson c4). RSI extremes mean different things in each.',
    ],
    beats: () => {
      const bars = strongRun(STAGE4_SEEDS.run);
      const values = rsi(bars.map((bar) => bar.close));
      const cross = firstAbove(values, 70) ?? bars.length - 1;
      const above = values.filter((v) => v != null && v > 70).length;
      const sold = bars[cross]!.close;
      const last = bars[bars.length - 1]!.close;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'How fast, not how high',
          body: 'RSI, the Relative Strength Index, compares the size of recent gains with recent losses on a scale from 0 to 100. Above 70, people call a market “overbought”; below 30, “oversold”. Those two words cost people a lot of money.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'RSI passes 70. What happens next?',
          options: [
            {
              label: 'Price has to fall soon',
              feedback:
                'That’s the myth this lesson is about. Play the chart and see.',
            },
            {
              label: 'Nothing is decided. A strong trend can stay above 70',
              correct: true,
              feedback:
                'Yes. High RSI says price rose fast. Strong trends rise fast.',
            },
            {
              label: 'Price has to rise',
              feedback: 'RSI doesn’t promise either direction.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Play the run',
          body: 'Reveal the chart a few bars at a time and keep an eye on RSI in the lower pane.',
          widget: 'rsi-run',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Overbought is not a sell signal',
          body: `RSI passed 70 at bar ${cross + 1} and stayed above it for ${above} of the ${bars.length} bars. Anyone who sold at ${usd(sold)} because it was “overbought” watched price go on to ${usd(last)}.`,
          points: [
            'High RSI means price has risen fast. That is what strong trends do.',
            'In a range, extremes often do snap back, because price keeps turning at the edges.',
            'So ask trend or range first (lesson c4). RSI only tells you about speed.',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'Where is “RSI above 70, so sell” most likely to hurt you?',
          options: [
            {
              label: 'In a strong uptrend',
              correct: true,
              feedback:
                'Yes. RSI can sit above 70 for weeks while price keeps climbing.',
            },
            {
              label: 'In a sideways range',
              feedback:
                'Ranges are where it hurts least: price keeps turning at the edges.',
            },
            {
              label: 'Nowhere: it’s a rule',
              feedback:
                'It’s a reading, not a rule. The chart you just played broke it.',
            },
          ],
        },
      ];
    },
  },

  t4: {
    id: 't4',
    takeaways: [
      'MACD is the fast moving average minus the slow one. Nothing more mysterious.',
      'The signal line is an average of MACD; the histogram is the gap between them.',
      'It inherits the lag of its averages: quicker than a crossover, still after the fact.',
    ],
    beats: () => {
      const { bars, top } = topSeries(STAGE4_SEEDS.top);
      const closes = bars.map((bar) => bar.close);
      const m = macd(closes);
      const after = (list: { index: number; direction: string }[]) =>
        list.find((c) => c.direction === 'down' && c.index >= top);
      const macdCross = after(crossovers(m.macd, m.signal));
      const maCross = after(crossovers(sma(closes, 20), sma(closes, 30)));
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Built from what you know',
          body: 'MACD looks like its own mysterious indicator, with two lines and bars around a zero line. It’s made entirely of moving averages, the ones from lesson t2. Build it one piece at a time.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'MACD is made from moving averages. Will it turn before price or after?',
          options: [
            {
              label: 'After: it inherits the averages’ lag',
              correct: true,
              feedback:
                'Yes. Anything built from old prices turns after price does.',
            },
            {
              label: 'Before: that’s what it’s for',
              feedback:
                'That’s what it’s sold as. Build it and see what it’s made of.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Build MACD',
          body: 'Add each piece in turn: the two averages, the MACD line, the signal line, the histogram.',
          widget: 'macd-build',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Faster than a crossover, still late',
          body:
            macdCross && maCross
              ? `Price topped at bar ${top + 1}. The MACD line crossed below its signal ${macdCross.index - top} bars later; the 20 and 30-bar averages crossed ${maCross.index - top} bars later.`
              : `Price topped at bar ${top + 1}. Every line built from averages turned after it.`,
          points: [
            'MACD compares a fast average with a slow one, so it reacts before the slow one alone would.',
            'Reacting sooner also means reacting to more noise. Earlier warnings include more false ones.',
            'Above zero, the fast average is on top: price has been rising lately. That’s description, not forecast.',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'MACD crosses below its signal line. The best reading?',
          options: [
            {
              label: 'Momentum is slowing. Check the trend and my plan',
              correct: true,
              feedback:
                'Yes. It’s one more reading of the trend, to weigh with the rest.',
            },
            {
              label: 'Sell everything: the top is in',
              feedback:
                'Crosses happen in the middle of trends too. One cross is not a verdict.',
            },
            {
              label: 'It means nothing',
              feedback:
                'It does mean something: the recent rise has lost speed. It just doesn’t say what comes next.',
            },
          ],
        },
      ];
    },
  },

  t5: {
    id: 't5',
    takeaways: [
      'Every market has its own noise. ATR measures it: how far price usually travels in a bar.',
      'Put stops a few ATRs away, so everyday noise doesn’t take you out.',
      'A wider stop means a smaller position, so the loss stays the size you planned.',
    ],
    beats: () => {
      const atrNow = (market: 'quiet' | 'wild') => {
        const bars = walkCandles(`${STAGE4_SEEDS.stops}:${market}`, {
          count: 60,
          start: 10_000,
          drift: 0,
          wobble: MARKETS[market],
        });
        return atr(bars).at(-1) ?? 0;
      };
      const quiet = atrNow('quiet');
      const wild = atrNow('wild');
      const guess = (market: 'quiet' | 'wild') =>
        noiseStopOuts(STAGE4_SEEDS.stops, () => GUESSED_STOP, MARKETS[market])
          .rateBp;
      const byAtr = (market: 'quiet' | 'wild') =>
        noiseStopOuts(
          STAGE4_SEEDS.stops,
          (_, a) => Math.round(2 * a),
          MARKETS[market],
        ).rateBp;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Every market has its own noise',
          body: `Here are two markets. In the quiet one price travels about ${usd(quiet)} a bar; in the wild one, about ${usd(wild)}. A stop that makes sense in one is silly in the other.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `You always use a ${usd(GUESSED_STOP)} stop. You move from the quiet market to the wild one. What happens?`,
          options: [
            {
              label: 'Noise stops you out far more often',
              correct: true,
              feedback:
                'Yes. The same distance is small next to bigger everyday swings.',
            },
            {
              label: 'Nothing: a stop is a stop',
              feedback:
                'A stop only means something next to how far price usually moves.',
            },
            {
              label: 'You make more, because it moves more',
              feedback:
                'It moves more against you too, and the stop is where that hurts.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Measure, then place',
          body: 'Switch between the markets, and slide the stop distance in ATRs. Watch how often pure noise hits each stop.',
          widget: 'atr-stops',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Stand outside the noise',
          body: 'ATR, the Average True Range, is how far price usually travels in a bar. On these charts, where every stop-out is noise:',
          points: [
            `The guessed ${usd(GUESSED_STOP)} stop was hit ${pct(guess('quiet'))} of the time in the quiet market, and ${pct(guess('wild'))} in the wild one.`,
            `A stop 2 ATRs away was hit ${pct(byAtr('quiet'))} and ${pct(byAtr('wild'))} of the time. It stretches with the market.`,
            'Bollinger Bands show the same thing on the chart: they widen as the noise grows.',
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Wider stop, smaller position',
          body: 'A stop further away means buying less, so the loss if it’s hit stays the size you planned (lesson r2). ATR sets the distance. Your risk rule sets the size.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'The market gets wilder and ATR doubles. What do you change?',
          options: [
            {
              label: 'Stop twice as far away, position half the size',
              correct: true,
              feedback:
                'Yes: room for the new noise, and the same planned loss.',
            },
            {
              label: 'Keep the same stop and hope',
              feedback:
                'Then noise will stop you out far more often, as you just saw.',
            },
            {
              label: 'Stop twice as far away, same position',
              feedback:
                'That doubles what you lose when it’s hit. Shrink the position too.',
            },
          ],
        },
      ];
    },
  },

  t6: {
    id: 't6',
    takeaways: [
      'A candle describes a fight that already happened. On its own it isn’t a prediction.',
      'Test a pattern against a baseline: how often does any candle at all do as well?',
      'Until a pattern beats the baseline on data you trust, treat it as a description.',
    ],
    beats: () => {
      const rows = testPatterns(STAGE4_SEEDS.patterns);
      const base = rows.find((row) => row.kind === 'any bar')!;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Patterns with names',
          body: 'Bullish engulfing, hammer, doji. Books and WhatsApp groups promise each one tells you what comes next. Let’s test that the way a scientist would: by counting.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'On simulated charts where nothing can predict anything, how often is a bullish engulfing candle followed by higher prices?',
          options: [
            {
              label: 'About as often as any candle at all',
              correct: true,
              feedback:
                'Yes. With nothing to find, a pattern can’t do better than chance.',
            },
            {
              label: 'Much more often: it’s a bullish pattern',
              feedback:
                'It looks bullish. Whether it predicts anything is what the count will show.',
            },
            {
              label: 'Never',
              feedback:
                'It won’t do worse than chance either. Run the test and see.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Count them',
          body: 'The patterns are marked on one chart. Then run them over many simulated charts with no edge built in.',
          widget: 'pattern-test',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What the count showed',
          body: 'Share followed by a higher close 5 bars later:',
          points: rows.map(
            (row) =>
              `${PATTERN_NAMES[row.kind]}: ${pct(row.rateBp)} of ${row.found}.`,
          ),
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'The uncomfortable part',
          body: `On these charts the patterns scored close to ${pct(base.rateBp)}, the same as any candle, because there was nothing for them to find. And they looked just as convincing here as they do on real charts. Looking right and working are different things.`,
          points: [
            'A candle tells you who pushed in that bar and who gave up. That’s useful context.',
            'If a pattern has an edge in a real market, it shows up as a gap over “any candle” in a count like this, on data you trust.',
            'We’ll add counts on real market history when we have licensed data to run them on.',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Someone posts a hammer in a group chat: “Reversal confirmed!” What do you ask?',
          options: [
            {
              label: 'How often has it beaten any candle, on this market?',
              correct: true,
              feedback:
                'Yes. Without that number, “confirmed” is just a feeling.',
            },
            {
              label: 'What’s the entry price?',
              feedback:
                'That’s skipping the question of whether there’s anything there.',
            },
            {
              label: 'Nothing: hammers are reliable',
              feedback:
                'On the charts you just tested, they weren’t. Reliability has to be shown.',
            },
          ],
        },
      ];
    },
  },

  t7: {
    id: 't7',
    takeaways: [
      'Nothing is a pattern until its line breaks. Before that it’s just highs and lows.',
      'The break gives you a plan: a stop where the pattern would be wrong, a rough target.',
      'The same shape ends both ways. The target is a rule of thumb, not a promise.',
    ],
    beats: () => {
      const d = doubleTop(STAGE4_SEEDS.doubleTop, 'break');
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Shapes with stories',
          body: 'Double tops, head and shoulders, flags, triangles. Each is a story about buyers and sellers. The double top: buyers push to a high twice, and fail at the same price both times.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Price makes two highs at the same level. Is it a double top yet?',
          options: [
            {
              label: 'Not until price breaks the low between them',
              correct: true,
              feedback:
                'Yes. Until then it could just as easily be a range before a breakout.',
            },
            {
              label: 'Yes: two tops is the pattern',
              feedback:
                'Two highs is a description. The pattern completes when the low between them breaks.',
            },
            {
              label: 'Only if the second top has high volume',
              feedback:
                'Volume can add weight, but the definition is the break.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Find the neckline, then play it',
          body: 'Pick the line that would confirm the pattern. Then play what happened, and replay the other ending of the same chart.',
          widget: 'double-top',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Confirmation, and the target',
          body: `The two tops sat at ${usd(d.peak)} and the neckline at ${usd(d.neckline)}. The textbook target is the pattern’s height, ${usd(d.peak - d.neckline)}, measured down from the neckline: ${usd(d.target)}.`,
          points: [
            'Up to the second top, both endings were the same chart. What you could see beforehand didn’t say which.',
            'After the break it’s a pattern and a plan: a stop back above the neckline, a rough target below.',
            'The target is a rule of thumb. Price can stop short of it or run past.',
          ],
        },
        {
          kind: 'say',
          tag: 'again',
          title: 'Other shapes, same rule',
          body: 'Every chart pattern works the same way: a shape, a line, and a break.',
          points: [
            'Head and shoulders: three highs, the middle one highest. The neckline joins the lows between them.',
            'Triangles and flags: price squeezes between two lines. The break of either is the event; the shape before it isn’t.',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A double top’s neckline breaks and you sell. Where does the stop go?',
          options: [
            {
              label:
                'Back above the neckline, where the pattern would be wrong',
              correct: true,
              feedback:
                'Yes. If price climbs back above it, the break failed and so did the idea.',
            },
            {
              label: 'At the target',
              feedback:
                'The target is where you might take profit. The stop goes where you’re wrong.',
            },
            {
              label: 'No stop: the pattern is confirmed',
              feedback:
                'Confirmed patterns fail too. You just replayed one that could have.',
            },
          ],
        },
      ];
    },
  },

  t8: {
    id: 't8',
    takeaways: [
      'Price has to turn somewhere, so any set of lines across a pullback collects “bounces”.',
      'On random charts, Fibonacci levels did no better than made-up ones.',
      'Use a level to plan where you’re wrong, not to expect a bounce.',
    ],
    beats: () => {
      const fib = testLevels(STAGE4_SEEDS.fib, FIB_LEVELS_BP);
      const made = testLevels(STAGE4_SEEDS.fib, MADE_UP_LEVELS_BP);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Magic numbers',
          body: `Fibonacci traders measure a move and draw levels ${levels(FIB_LEVELS_BP)} of the way back, then expect price to bounce there. The numbers come from a famous sequence in maths. Does the market know about it?`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'On randomly generated charts, which levels would price bounce off more often?',
          options: [
            {
              label: 'The Fibonacci levels',
              feedback:
                'The charts are random. They can’t know which numbers are special.',
            },
            {
              label: 'Made-up levels, spaced the same way',
              feedback: 'There’s no reason for those to win either.',
            },
            {
              label: 'About the same',
              correct: true,
              feedback: 'That’s the sceptic’s bet. Run the test.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Test them side by side',
          body: `Draw the Fibonacci levels, add made-up ones (${levels(MADE_UP_LEVELS_BP)}), then test both on the same random charts.`,
          widget: 'fib-test',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why levels feel like they work',
          body: `Fibonacci levels: ${fib.reactions} bounces in ${fib.chances} chances, ${pct(fib.rateBp)}. Made-up levels: ${made.reactions} in ${made.chances}, ${pct(made.rateBp)}. On random charts, any lines collect bounces: price has to turn somewhere, and it often turns near one of three lines drawn across its path.`,
          points: [
            'Remember the bounces and forget the misses, and any level looks magic.',
            'If enough traders watch the same level, their orders can make it matter for a while. That’s a crowd habit, not maths.',
            'The test is always the same: does it beat made-up levels on data you trust?',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A Fibonacci level lines up with an old support level. Which do you give more weight?',
          options: [
            {
              label: 'The old support: price actually turned there before',
              correct: true,
              feedback:
                'Yes. A level earns weight from what price did there, as in lesson c5.',
            },
            {
              label: 'The Fibonacci level: it’s mathematical',
              feedback:
                'Being mathematical didn’t help it on the random charts.',
            },
            {
              label: 'Neither: levels are useless',
              feedback:
                'Levels are useful for planning where you’re wrong. They just aren’t predictions.',
            },
          ],
        },
      ];
    },
  },

  t9: {
    id: 't9',
    takeaways: [
      'Take the direction from the bigger chart and the timing from the smaller one.',
      'The same small-chart setup does very differently with the bigger trend and against it.',
      'A bounce in a downtrend is still a downtrend until the bigger chart says otherwise.',
    ],
    beats: () => {
      const up = buyTheDip(STAGE4_SEEDS.timeframes, 'up');
      const down = buyTheDip(STAGE4_SEEDS.timeframes, 'down');
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Two charts, two jobs',
          body: 'Lesson c3 showed that the same market looks different on different timeframes. Traders put that to work: the daily chart decides which way to trade, the hourly chart decides when.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'On the hourly chart, price has fallen three bars in a row. When is buying that dip a better bet?',
          options: [
            {
              label: 'When the daily trend is up',
              correct: true,
              feedback: 'Yes. Then the dip is a pause in a bigger rise.',
            },
            {
              label: 'When the daily trend is down',
              feedback: 'Then the dip is the bigger trend carrying on.',
            },
            {
              label: 'It doesn’t matter: a dip is a dip',
              feedback:
                'The hourly chart looks the same either way. Test it and see if the result does.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Same setup, two backdrops',
          body: 'Switch the bigger trend and compare the charts. Then test buying the hourly dip and selling 12 hours later, with the trend and against it.',
          widget: 'timeframes-trade',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'The bigger chart decided most of it',
          body: 'The same hourly setup, on simulated charts:',
          points: [
            `With the bigger trend up: ${up.trades} dips bought, ${pct(up.rateBp)} won, ${signedUsd(up.averageCents)} a trade on average.`,
            `With it down: ${down.trades} dips bought, ${pct(down.rateBp)} won, ${signedUsd(down.averageCents)} a trade on average.`,
            'Nothing about the hourly setup changed. The backdrop did.',
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Honest about the test',
          body: 'These charts had a trend built in, so the test shows the principle rather than what you’d earn. Real trends are weaker and change without warning, which is why you check the bigger chart often, not once.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'The daily chart has been falling for weeks. The hourly shows a sharp bounce. The careful reading?',
          options: [
            {
              label: 'A bounce in a downtrend: be wary of buying it',
              correct: true,
              feedback:
                'Yes. Until the daily chart turns, bounces are where sellers get better prices.',
            },
            {
              label: 'The trend has turned: buy',
              feedback:
                'One hourly bounce doesn’t turn a daily trend. Look for higher lows on the daily (lesson c4).',
            },
            {
              label: 'Timeframes don’t matter',
              feedback: 'The test you just ran says they matter a lot.',
            },
          ],
        },
      ];
    },
  },

  t10: {
    id: 't10',
    takeaways: [
      'Divergence: price makes a higher high while RSI makes a lower one. The rise is losing speed.',
      'The chart before the high can end in a turn or a slower climb. It can’t tell you which.',
      'Use divergence to tighten a stop or take some profit, not to bet on a reversal alone.',
    ],
    beats: () => {
      const d = divergence(STAGE4_SEEDS.divergence, 'reversal');
      const [r1, r2] = rsiAtHighs(d);
      const [h1, h2] = d.highs;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'When price and momentum disagree',
          body: 'Price makes a new high. RSI, which measures the speed of the gains (lesson t3), makes a lower high. That disagreement is divergence: still rising, but more slowly.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Price makes a higher high and RSI a lower high. What does that tell you?',
          options: [
            {
              label: 'The rise is slowing: a warning, not a verdict',
              correct: true,
              feedback:
                'Yes. The gains are getting smaller. What happens next is still open.',
            },
            {
              label: 'A reversal is certain: sell now',
              feedback:
                'Play both endings of the same chart before you decide that.',
            },
            {
              label: 'Nothing at all',
              feedback:
                'It tells you something real: each push up is weaker than the last.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Mark it, then play both endings',
          body: 'Mark the two highs and compare price with RSI. Then play what happened, and the other ending of the same chart.',
          widget: 'divergence',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'A warning about speed',
          body: `Price went from ${usd(d.seen[h1]!.high)} to ${usd(d.seen[h2]!.high)}, a higher high. RSI went from ${r1.toFixed(0)} to ${r2.toFixed(0)}, a lower one.`,
          points: [
            'Up to the second high, both endings were the same chart.',
            'Fading speed can end in a turn, a pause, or a slower climb. Divergence can’t say which.',
            'So it’s a reason to protect a winning trade, not a reason to bet the other way.',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'You’re in a winning trade and spot bearish divergence. A sensible response?',
          options: [
            {
              label: 'Tighten the stop or take some profit',
              correct: true,
              feedback:
                'Yes. You respect the warning without betting everything on it.',
            },
            {
              label: 'Sell and go short with double the size',
              feedback: 'That bets heavily on a turn the chart can’t promise.',
            },
            {
              label: 'Ignore it',
              feedback:
                'It’s worth something: a warning that the easy part of the move may be over.',
            },
          ],
        },
      ];
    },
  },
};
