import type { LessonDef } from '../../lib/lessons/types.ts';
import {
  formatBp,
  formatMoney,
  fromMinor,
  mulDiv,
  type Currency,
} from '../../lib/core/money.ts';
import {
  COCOA_CO,
  STOCKS,
  changeBp,
  dividendYieldBp,
  hold,
  incomeStatement,
  peHundredths,
  survivableShrinkBp,
} from '../../lib/engines/company.ts';
import {
  CARRY,
  COMMODITY_PRICES,
  EXPORTERS,
  NEWS,
  POLICY,
  RELEASE,
  SAVER,
  basePrices,
  breakEvenLossBp,
  carryRun,
  currencyLossBp,
  dollarFlow,
  inDollars,
  localPrice,
  newsDay,
  newsPullback,
  playEntry,
  playRelease,
  policyEffects,
  realReturnBp,
  realValue,
  releaseDay,
  savedThrough,
  surpriseMoveBp,
  yearInterest,
} from '../../lib/engines/macro.ts';
import { GHANA_2022, NIGERIA_2023 } from './history.ts';
import { STAGE5_SEEDS } from './seeds.ts';

/**
 * Stage 5: fundamental analysis. Numbers come from lib/engines, computed as
 * the lesson opens; published figures come from ./history.ts, with their
 * sources. The models are small on purpose, and the lessons say so.
 */

const cash = (minor: number, currency: Currency, signed = false) =>
  formatMoney(fromMinor(minor, currency), { signed });
const ghs = (minor: number) => cash(minor, 'GHS');
const usd = (cents: number) => cash(cents, 'USD');
const big = (minor: number, currency: Currency = 'GHS') =>
  formatMoney(fromMinor(minor, currency), { compact: true });
const billions = (usdM: number, signed = false) =>
  formatMoney(fromMinor(usdM * 100_000_000, 'USD'), { compact: true, signed });
/** Basis points to a whole percent, for words: 2997 → "30%". */
const pct = (bp: number) => formatBp(Math.round(bp / 100) * 100);
/** Basis points as percentage points, without the sign: 50 → "0.5". */
const points = (bp: number) => formatBp(bp).replace('%', '');
/** Hundredths of R, to one decimal: 478 → "+4.8R". */
const r = (hundredths: number) =>
  `${hundredths >= 0 ? '+' : '−'}${size(hundredths)}`;
/** The size of a result in R, without its sign: −100 → "1.0R". */
const size = (hundredths: number) =>
  `${(Math.abs(hundredths) / 100).toFixed(1)}R`;
/** An exchange rate as the local price of one dollar. */
const perDollar = (fx: number, currency: Currency) =>
  cash(localPrice(100, fx), currency);

export const STAGE_5: Record<string, LessonDef> = {
  f1: {
    id: 'f1',
    takeaways: [
      'Prices move on the difference between what happened and what was expected.',
      'Good news can push a price down if it was less good than people hoped.',
      'Before any big news, ask what everyone expects. That part is already in the price.',
    ],
    beats: () => {
      const goodButLess = 2_000;
      const earnings = NEWS.earnings;
      const rates = newsDay(STAGE5_SEEDS.news, 'rates', NEWS.rates.expectedBp);
      const pricedIn = mulDiv(
        rates.bars[rates.at - 1]!.close - rates.bars[0]!.open,
        10_000,
        rates.bars[0]!.open,
      );
      const hot = NEWS.inflation.highBp;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Prices move on surprises',
          body: 'Every week brings news: a rate decision, an inflation figure, a company’s profits. The price doesn’t wait for it. It moves as people form expectations, and on the day it moves on the gap between what happened and what was expected.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `A company reports profits up ${formatBp(goodButLess)}. Its share price falls. How can that be?`,
          options: [
            {
              label: 'Investors had expected more',
              correct: true,
              feedback:
                'Yes. If everyone expected more, the price had already risen for it, and the news disappointed.',
            },
            {
              label: 'The news must have been misreported',
              feedback:
                'No need for a mistake. Good news that’s less good than hoped is a disappointment.',
            },
            {
              label: 'Prices are random',
              feedback:
                'Day to day there’s noise, but a fall on good news usually has a reason: the bar was set higher.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Set the news, watch the price',
          body: 'Pick a piece of news and slide what actually happened. Try at least two kinds.',
          widget: 'news-surprise',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Only the surprise moves it',
          body: 'On these charts:',
          points: [
            `Profits were expected up ${formatBp(earnings.expectedBp)}. They came in up ${formatBp(goodButLess)}: the price fell ${formatBp(-surpriseMoveBp('earnings', goodButLess))} on the day.`,
            `Rates rose exactly as expected: the price barely moved on the day. It had already fallen ${formatBp(-pricedIn)} in the days before, as people expected it.`,
            `Inflation came in at ${formatBp(hot)} against ${formatBp(NEWS.inflation.expectedBp)} expected: the price fell ${formatBp(-surpriseMoveBp('inflation', hot))}. Hotter inflation means higher rates ahead.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Buy the rumour, sell the fact',
          body: 'Traders have a saying for this. By the time good news is in the headlines, the people who expected it have usually bought already. Chasing a headline after it lands often means buying from them.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `Everyone expects the central bank to raise rates by ${points(NEWS.rates.expectedBp)} points. It raises them by exactly ${points(NEWS.rates.expectedBp)} points. What’s most likely on the day?`,
          options: [
            {
              label: 'Not much: it was already in the price',
              correct: true,
              feedback: 'Right. No surprise, little move.',
            },
            {
              label: 'Shares crash: rates went up',
              feedback:
                'They went up by what everyone expected, and prices had already adjusted.',
            },
            {
              label: 'Shares jump',
              feedback: 'Only if the news was better than expected. It wasn’t.',
            },
          ],
        },
      ];
    },
  },

  f2: {
    id: 'f2',
    takeaways: [
      'The policy rate is the price of money. Savings, loans, T-bills and bonds all lean on it.',
      'When rates rise, bonds and shares you already own are worth less: new money can earn more elsewhere.',
      'Rates are one force among many. Ghana’s rose steeply in 2022 and the cedi still fell.',
    ],
    beats: () => {
      const from = policyEffects(POLICY.startBp);
      const hikeTo = POLICY.startBp + 700;
      const to = policyEffects(hikeTo);
      const policy = GHANA_2022.policyBp!;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'The price of money',
          body: 'A central bank, like the Bank of Ghana or the Central Bank of Nigeria, sets a policy rate: roughly what banks pay to borrow from it. Every other rate in the country leans on it, from your savings account to government bonds.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'The central bank raises rates sharply. What happens to the price of a bond you already own?',
          options: [
            {
              label: 'It falls',
              correct: true,
              feedback:
                'Yes. New bonds now pay more, so yours, still paying the old rate, is worth less to a buyer.',
            },
            {
              label: 'It rises',
              feedback:
                'The opposite: why pay full price for yours when new ones pay more?',
            },
            {
              label: 'Nothing: it still pays the same',
              feedback:
                'It pays the same, but buyers can now get more elsewhere, so they’ll only take yours cheaper.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Be the central bank',
          body: 'Slide the policy rate and watch savings, a loan, a bond and a share answer.',
          widget: 'rate-setter',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why everything moved',
          body: `Raising the rate from ${formatBp(POLICY.startBp)} to ${formatBp(hikeTo)}:`,
          points: [
            `Savings: ${ghs(POLICY.deposit.amount)} earns ${ghs(to.deposit.interest)} a year instead of ${ghs(from.deposit.interest)}.`,
            `The loan: ${ghs(to.loan.monthly)} a month instead of ${ghs(from.loan.monthly)}. Dearer borrowing means less spending, which is how higher rates cool inflation.`,
            `The bond: worth ${ghs(to.bond.price)}, down from ${ghs(from.bond.price)}. Its ${formatBp(POLICY.bond.couponBp)} looks worse when new bonds pay ${formatBp(to.bond.yieldBp)}.`,
            `The share: ${ghs(to.share.value)} instead of ${ghs(from.share.value)}. Investors now want ${formatBp(to.share.requiredBp)} a year to hold it.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'What happened in Ghana in 2022',
          body: `By the Bank of Ghana’s own figures, it raised the policy rate from ${formatBp(policy[0]!)} in December 2021 to ${formatBp(policy.at(-1)!)} by December 2022, fighting inflation that reached ${formatBp(GHANA_2022.inflationBp.at(-1)!)}. The cedi still lost ${pct(currencyLossBp(GHANA_2022.fx.start, GHANA_2022.fx.end))} of its value against the dollar that year. Higher rates pull money in; worries about government debt pushed it out. Rates are a strong force, not the only one.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'The central bank cuts rates. Which of these usually rises?',
          options: [
            {
              label: 'The price of bonds you already hold',
              correct: true,
              feedback:
                'Yes. Their old, higher payments are worth more when new bonds pay less.',
            },
            {
              label: 'The interest on your savings',
              feedback: 'That falls with the rate.',
            },
            {
              label: 'Your monthly loan payment',
              feedback: 'Borrowing gets cheaper when rates fall.',
            },
          ],
        },
      ];
    },
  },

  f3: {
    id: 'f3',
    takeaways: [
      'Inflation is prices rising. Money that earns less than inflation buys less, even as the number grows.',
      'The return that counts is the real one: what you earned, after what prices did.',
      'A falling currency brings inflation in: everything priced in dollars costs more.',
    ],
    beats: () => {
      const g = GHANA_2022;
      const n = NIGERIA_2023;
      const saved = SAVER.saved.GHS;
      const example = 10_000;
      const exampleRate = 1_000;
      const gInflation = g.inflationBp.at(-1)!;
      const nInflation = n.inflationBp.at(-1)!;
      const bills = savedThrough(saved, 'bills', g.billBp);
      const billsReturn = mulDiv(bills - saved, 10_000, saved);
      const quiz = { nominal: 1_500, inflation: 2_500 };
      const quizReal = realReturnBp(quiz.nominal, quiz.inflation);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'The number grew. What it buys shrank.',
          body: `Inflation is how fast prices rise. At ${formatBp(exampleRate)}, what cost ${ghs(example)} a year ago costs ${ghs(example + yearInterest(example, exampleRate))} now. If your money grew by less than that, you can buy less with it, however big the number looks.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `Ghana, 2022. You kept ${ghs(saved)} in 91-day T-bills all year, as their rate climbed past ${formatBp(3_000)}. By December, could it buy more than when you started, or less?`,
          options: [
            {
              label: 'Less',
              correct: true,
              feedback: 'Yes. Play the year to see by how much.',
            },
            {
              label: 'More: the rates were very high',
              feedback:
                'High by December, but prices ran faster, and the rates started low. Play the year.',
            },
            {
              label: 'About the same',
              feedback: 'Further apart than that. Play the year.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Play the year, month by month',
          body: 'Ghana’s 2022 or Nigeria’s 2023, on the published figures. Choose where the money sat, then step through the months.',
          widget: 'inflation-replay',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What the year did to savings',
          body: `Ghana’s prices rose ${formatBp(gInflation)} over 2022 (Bank of Ghana); Nigeria’s ${formatBp(nInflation)} over 2023 (NBS).`,
          points: [
            `Cash at home: ${ghs(saved)} stayed ${ghs(saved)}, and by December bought what ${ghs(realValue(saved, gInflation))} had.`,
            `T-bills rolled all year: ${ghs(bills)}, which bought what ${ghs(realValue(bills, gInflation))} had. A real return of ${pct(realReturnBp(billsReturn, gInflation))}. The rates started at ${formatBp(g.billBp![0]!)} and only passed ${formatBp(3_000)} in the last quarter.`,
            `Nigeria: ${cash(SAVER.saved.NGN, 'NGN')} in cash bought what ${cash(realValue(SAVER.saved.NGN, nInflation), 'NGN')} had a year before.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Your currency, and imported prices',
          body: `The cedi went from ${perDollar(g.fx.start, 'GHS')} to ${perDollar(g.fx.end, 'GHS')} per dollar over 2022, after ${perDollar(g.fx.weakestMonthEnd!.rate, 'GHS')} at the end of ${g.fx.weakestMonthEnd!.month}: ${pct(currencyLossBp(g.fx.start, g.fx.end))} of its value gone. The naira went from ${perDollar(n.fx.start, 'NGN')} to ${perDollar(n.fx.end, 'NGN')} over 2023: ${pct(currencyLossBp(n.fx.start, n.fx.end))}. Anything priced in dollars, like fuel, medicine, phones and imported food, costs that much more in local money, and that feeds inflation.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `Your savings earn ${formatBp(quiz.nominal)} a year and inflation is ${formatBp(quiz.inflation)}. What’s your real return?`,
          options: [
            {
              label: `About ${pct(quizReal)}`,
              correct: true,
              feedback: `Yes: (1 + ${formatBp(quiz.nominal)}) ÷ (1 + ${formatBp(quiz.inflation)}) − 1. You’re losing buying power.`,
            },
            {
              label: formatBp(quiz.nominal, { signed: true }),
              feedback: 'That’s the number on the statement, not what it buys.',
            },
            {
              label: formatBp(quiz.nominal - quiz.inflation, { signed: true }),
              feedback: `Close. Simple subtraction is a quick guess; the exact answer divides, which gives about ${pct(quizReal)}.`,
            },
          ],
        },
      ];
    },
  },

  f4: {
    id: 'f4',
    takeaways: [
      'Read top to bottom: revenue, minus each layer of cost, down to net profit.',
      'Thin margins make profit fragile: a small change at the top can wipe out the bottom.',
      'Revenue up doesn’t mean profit up. Always read to the last line.',
    ],
    beats: () => {
      const tenth = 1_000;
      const by = (value: number, bp: number) =>
        value + mulDiv(value, bp, 10_000);
      const base = incomeStatement(COCOA_CO);
      const fewer = incomeStatement({
        ...COCOA_CO,
        tonnes: by(COCOA_CO.tonnes, -tenth),
      });
      const dearer = incomeStatement({
        ...COCOA_CO,
        beansPerTonne: by(COCOA_CO.beansPerTonne, tenth),
      });
      const next = incomeStatement({
        ...COCOA_CO,
        tonnes: by(COCOA_CO.tonnes, tenth),
        beansPerTonne: by(COCOA_CO.beansPerTonne, tenth),
      });
      const perHundred = (part: number) =>
        ghs(mulDiv(10_000, part, base.revenue));
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'A company in nine lines',
          body: `Meet a made-up Kumasi cocoa processor. It buys beans, grinds them into cocoa butter and powder, and sells those. Last year it sold ${COCOA_CO.tonnes.toLocaleString('en-GB')} tonnes for ${big(base.revenue)}. The income statement shows where that money went.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `Of ${big(base.revenue)} in sales, how much do you think was left as profit for the owners?`,
          options: [
            {
              label: `About ${big(base.netProfit)}`,
              correct: true,
              feedback:
                'Yes. Play with the statement to see where the rest went.',
            },
            {
              label: `About ${big(base.grossProfit)}`,
              feedback:
                'That’s gross profit: before salaries, rent, interest and tax.',
            },
            {
              label: `About ${big(base.costOfSales)}`,
              feedback: 'That’s what the beans and processing cost.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Take it apart',
          body: 'Change how much it sells and what beans cost. Watch every line down to net profit.',
          widget: 'income-statement',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Where the money went',
          body: `Of every ${ghs(10_000)} of sales:`,
          points: [
            `${perHundred(base.costOfSales)} went on beans and processing.`,
            `${perHundred(base.operatingCosts + base.interest + base.tax)} went on salaries, rent, interest and tax.`,
            `${perHundred(base.netProfit)} was left: a net margin of ${formatBp(base.netMarginBp)}.`,
            `Sell ${formatBp(tenth)} less and net profit falls ${pct(-changeBp(base.netProfit, fewer.netProfit))}: salaries, rent and interest don’t shrink when sales do. Beans ${formatBp(tenth)} dearer, and it falls ${pct(-changeBp(base.netProfit, dearer.netProfit))}.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Revenue up, profit down',
          body: `The next year it sells ${formatBp(tenth)} more, but beans cost ${formatBp(tenth)} more too. Revenue rises ${pct(changeBp(base.revenue, next.revenue))} to ${big(next.revenue)}. Net profit falls ${pct(-changeBp(base.netProfit, next.netProfit))} to ${big(next.netProfit)}. A headline that says “revenue up” has read one line.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A company announces revenue up 25%. What do you check before getting excited?',
          options: [
            {
              label: 'What happened to costs and net profit',
              correct: true,
              feedback: 'Yes. Read to the bottom line.',
            },
            {
              label: 'Nothing: revenue is what matters',
              feedback: 'You just watched revenue rise while profit fell.',
            },
            {
              label: 'The share price chart',
              feedback:
                'The chart shows what traders did. The statement shows what the business did.',
            },
          ],
        },
      ];
    },
  },

  f5: {
    id: 'f5',
    takeaways: [
      'P/E is price ÷ yearly earnings: how many years of today’s profit you’re paying for.',
      'A low P/E or a big dividend yield is only cheap if the earnings hold up.',
      'Always ask why it’s cheap. The market usually has a reason; sometimes it’s wrong.',
    ],
    beats: () => {
      const amount = 100_000;
      const years = 5;
      const a = hold(STOCKS.cheap, amount, years);
      const b = hold(STOCKS.dear, amount, years);
      const pe = (stock: typeof STOCKS.cheap) =>
        (peHundredths(stock) / 100).toFixed(0);
      const floor = survivableShrinkBp(STOCKS.cheap, amount, years);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Two ways to say “cheap”',
          body: `P/E is the share price divided by a year’s earnings per share. Company A trades at ${pe(STOCKS.cheap)} times earnings and its dividend yields ${formatBp(dividendYieldBp(STOCKS.cheap))}. Company B trades at ${pe(STOCKS.dear)} times earnings and yields ${formatBp(dividendYieldBp(STOCKS.dear))}. Both earn ${ghs(STOCKS.cheap.eps)} a share this year.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'Which is the better buy?',
          options: [
            {
              label: 'A: it’s far cheaper',
              feedback: 'Cheaper on today’s earnings. Play five years first.',
            },
            {
              label: 'B: it’s growing',
              feedback:
                'Maybe, but growth can disappoint too. The real question is why each is priced as it is.',
            },
            {
              label: 'Can’t tell until I know why A is cheap',
              correct: true,
              feedback: 'Yes. A price that low usually has a reason.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Play five years',
          body: 'Buy each, hold for five years, and keep each P/E the same, so only the businesses change. Then slide how fast A’s earnings shrink.',
          widget: 'value-trap',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Cheap for a reason',
          body: `A’s big contract was ending. Its earnings shrank ${pct(-STOCKS.cheap.growthBp)} a year: ${a.epsPath.map((eps) => ghs(eps)).join(', ')}.`,
          points: [
            `${ghs(amount)} in A ended at ${ghs(a.endValue)} (${pct(a.returnBp)}), dividends included. Its big dividend shrank with its earnings.`,
            `${ghs(amount)} in B ended at ${ghs(b.endValue)} (${formatBp(Math.round(b.returnBp / 100) * 100, { signed: true })}).`,
            `A only needed its earnings to shrink slower than ${pct(-floor)} a year to make money. Cheap and steady would have done well.`,
          ],
        },
        {
          kind: 'say',
          tag: 'again',
          title: 'The questions to ask',
          body: 'Before calling a share cheap:',
          points: [
            'Why is it cheap? Is something ending: a contract, a licence, a boom?',
            'Can the dividend be paid out of earnings, or is it coming from savings or debt?',
            `What does the price assume? A P/E of ${pe(STOCKS.cheap)} assumes shrinking. If it doesn’t shrink, that’s the opportunity.`,
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A share has a 20% dividend yield. What’s the first question?',
          options: [
            {
              label: 'Can it keep paying that?',
              correct: true,
              feedback:
                'Yes. A yield that high often means the market expects a cut.',
            },
            {
              label: 'How fast can I buy it?',
              feedback: 'That’s how value traps catch people.',
            },
            {
              label: 'Is 20% a lot?',
              feedback:
                'It is. That’s exactly why to ask whether it will last.',
            },
          ],
        },
      ];
    },
  },

  f6: {
    id: 'f6',
    takeaways: [
      'Big releases are scheduled. The economic calendar tells you when a market can jump.',
      'At a release, spreads widen and prices gap: a stop can fill well past where you put it.',
      'You can’t know the number. You can avoid holding a tight stop through it.',
    ],
    beats: () => {
      const days = (['up', 'down', 'reverse'] as const).map((ending) =>
        releaseDay(STAGE5_SEEDS.release, ending),
      );
      const holds = days.map((day) => playRelease(day, 'hold'));
      const waits = days.map((day) => playRelease(day, 'wait'));
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'News with a timetable',
          body: 'Rate decisions, inflation figures and company results come out on dates set in advance. An economic calendar lists them. You don’t need to guess the number to use it. You need to know when.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `Your stop is ${usd(RELEASE.holdStop)} below the price. A rate decision lands and the next price is ${usd(RELEASE.gap)} lower. Where does your stop fill?`,
          options: [
            {
              label: `Around ${usd(RELEASE.gap)} down, or worse`,
              correct: true,
              feedback:
                'Yes. A stop becomes an order to sell at the next price, and the next price was past it.',
            },
            {
              label: 'Exactly at my stop',
              feedback: 'Only if someone trades there. In a gap, no one does.',
            },
            {
              label: 'It doesn’t fill',
              feedback: 'It fills. Just not where you hoped.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Trade the day twice',
          body: 'Hold a trade through the decision, then wait for it to settle instead. Try another day too.',
          widget: 'release-day',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'What each plan did, on three days',
          body: `Both plans set out to lose no more than ${usd(RELEASE.risk)}.`,
          points: [
            `Holding through lost ${holds.map((h) => usd(-h.pnl)).join(', ')} on the three days, even on the day price went up. The gap jumped the stop every time.`,
            `Waiting made ${usd(waits[0]!.pnl)} and ${usd(waits[1]!.pnl)}, and lost ${usd(-waits[2]!.pnl)} on the day it reversed: about what it planned.`,
            `The spread went from ${usd(RELEASE.normalSpread)} to ${usd(RELEASE.newsSpread)} at the release. Even getting out costs more then.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'The plan didn’t predict anything',
          body: 'Waiting didn’t know the direction either. What it bought was a stop it could actually get, a spread that wasn’t at its widest, and a market that had shown its hand. When the day reversed, it still lost, the amount it had planned.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A big inflation figure comes out in ten minutes, and you’re in a trade with a tight stop. A sensible move?',
          options: [
            {
              label: 'Close it, or cut the size, before the release',
              correct: true,
              feedback: 'Yes. Decide before the jump, not during it.',
            },
            {
              label: 'Tighten the stop further',
              feedback:
                'A gap jumps a tight stop just the same, and the noise before it hits it more often.',
            },
            {
              label: 'Double the size: it’s an opportunity',
              feedback: 'That doubles a loss you can’t control.',
            },
          ],
        },
      ];
    },
  },

  f7: {
    id: 'f7',
    takeaways: [
      'A currency is priced by dollars coming in against dollars going out.',
      'A country that earns its dollars from one commodity feels that price in its currency.',
      'A weaker currency brings inflation in: fuel, food and phones priced in dollars cost more.',
    ],
    beats: () => {
      const base = basePrices();
      const half = { ...base, oil: COMMODITY_PRICES.oil.base / 2 };
      const oil = dollarFlow(EXPORTERS.oil, base);
      const oilHalf = dollarFlow(EXPORTERS.oil, half);
      const mixedHalf = dollarFlow(EXPORTERS.mixed, half);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Where the dollars come from',
          body: 'Ghana and Nigeria earn most of their dollars by selling commodities abroad. For Nigeria that is mostly crude oil; for Ghana, gold, cocoa and oil. Those dollars pay for imports and debts. When fewer come in, each one gets dearer: the currency falls.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'The price of oil halves. Whose currency feels it most?',
          options: [
            {
              label: 'The country that sells mostly oil',
              correct: true,
              feedback: 'Yes. Most of its dollars just halved.',
            },
            {
              label: 'The country that sells gold, cocoa and oil',
              feedback:
                'It loses some dollars, but gold and cocoa still bring them in.',
            },
            {
              label: 'Neither: currencies don’t follow oil',
              feedback: 'For an oil exporter, they very often do.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Move the prices',
          body: 'Two made-up economies. Slide oil, gold and cocoa, and watch the dollars each earns against what it needs.',
          widget: 'dollar-earnings',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'One commodity, one weak spot',
          body: `In this model, with oil at ${usd(base.oil * 100)} a barrel and then ${usd(half.oil * 100)}:`,
          points: [
            `The oil seller earns ${billions(oil.earnedUsdM)} against ${billions(oil.needsUsdM)} needed: ${billions(oil.gapUsdM, true)}.`,
            `At half the oil price: ${billions(oilHalf.earnedUsdM)}. It’s ${billions(-oilHalf.gapUsdM)} short, ${pct(-oilHalf.gapBp)} of what it needs.`,
            `The mixed seller at half the oil price is ${billions(-mixedHalf.gapUsdM)} short, ${pct(-mixedHalf.gapBp)} of what it needs. Gold and cocoa carried it.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Then prices at home',
          body: 'A country short of dollars sees its currency fall, and then everything priced in dollars costs more in local money: fuel, wheat, medicine, phones. That’s imported inflation, the link back to lesson f3. The sizes here are illustrative; real currencies also move on interest rates, debt and confidence, all at once.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: 'Cocoa prices jump. Who earns more dollars from it?',
          options: [
            {
              label: 'A cocoa exporter like Ghana',
              correct: true,
              feedback:
                'Yes: more dollars for every tonne sold abroad. Farmers only see it if the price they’re paid rises too.',
            },
            {
              label: 'An oil exporter',
              feedback: 'It doesn’t sell cocoa, so it earns nothing extra.',
            },
            {
              label: 'No one',
              feedback: 'Whoever sells cocoa abroad gets more dollars for it.',
            },
          ],
        },
      ];
    },
  },

  f8: {
    id: 'f8',
    takeaways: [
      'Money flows towards higher rates. Borrowing cheap to lend dear is the carry trade.',
      'It earns small and steady, and can lose years of gains in a day when the currency falls.',
      'A high rate is often the price of exactly that risk.',
    ],
    beats: () => {
      const hit = carryRun(STAGE5_SEEDS.carry);
      const calm = carryRun(STAGE5_SEEDS.carry, false);
      const before = hit[CARRY.devalueMonth - 1]!;
      const after = hit[CARRY.devalueMonth]!;
      const bills = GHANA_2022.billBp!;
      const start = 100_000;
      const cedis = localPrice(start, GHANA_2022.fx.start);
      const grown = savedThrough(cedis, 'bills', bills);
      const back = inDollars(grown, GHANA_2022.fx.end);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Borrow cheap, lend dear',
          body: `Dollars can be borrowed at ${formatBp(CARRY.borrowBp)} a year. Another currency’s T-bills pay ${formatBp(CARRY.investBp)}. Borrow dollars, change them, earn the higher rate, and change back at the end to repay. The gap is called the carry.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: 'Where is the risk?',
          options: [
            {
              label: 'The currency could fall by more than the rate gap',
              correct: true,
              feedback:
                'Yes. You have to change back at the end, at whatever the rate is then.',
            },
            {
              label: 'There isn’t one: the rates are fixed',
              feedback:
                'The rates are fixed. The exchange rate you change back at isn’t.',
            },
            {
              label: 'The dollar interest rate could rise',
              feedback: 'It could, but that’s small next to the currency.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Run the trade',
          body: 'Watch the profit you’d have if you closed each month.',
          widget: 'carry-trade',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Pennies, then the steamroller',
          body: `The currency can lose up to ${pct(breakEvenLossBp(CARRY.investBp, CARRY.borrowBp))} of its value a year before the trade stops paying.`,
          points: [
            `${CARRY.devalueMonth - 1} months of carry built up ${usd(before.profit)}.`,
            `One devaluation of ${pct(CARRY.devalueBp)} took it to ${cash(after.profit, 'USD', true)} in a month.`,
            `Without it, the trade would have ended at ${cash(calm.at(-1)!.profit, 'USD', true)}.`,
          ],
        },
        {
          kind: 'say',
          tag: 'consequence',
          title: 'Ghana, 2022, from a dollar investor’s side',
          body: `By the Bank of Ghana’s published rates: ${usd(start)} changed into cedis in December 2021 and rolled through 91-day T-bills grew to ${ghs(grown)}. Changed back at the end of 2022, it was ${usd(back)}: ${pct(mulDiv(back - start, 10_000, start))} in dollars, even though the bill rate reached ${formatBp(bills.at(-1)!)}.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `A currency’s T-bills pay ${formatBp(3_000)}; dollars pay ${formatBp(CARRY.borrowBp)}. What is the high rate most likely telling you?`,
          options: [
            {
              label:
                'Lenders want paying for a real risk that the currency falls',
              correct: true,
              feedback: 'Yes. The gap is a price, not a gift.',
            },
            {
              label: 'It’s free money',
              feedback: 'Only until the currency falls further than the gap.',
            },
            {
              label: 'The central bank is being generous',
              feedback:
                'Central banks usually set high rates to defend a currency or fight inflation.',
            },
          ],
        },
      ];
    },
  },

  f9: {
    id: 'f9',
    takeaways: [
      'Fundamentals can suggest a direction. They don’t say when, or where you’re wrong.',
      'The chart gives you both: a level to buy near, and a level that says the idea failed.',
      'Same risk, better price: that’s what timing buys. It doesn’t make you right.',
    ],
    beats: () => {
      const good = newsPullback(STAGE5_SEEDS.pullback, 'holds');
      const bad = newsPullback(STAGE5_SEEDS.pullback, 'fails');
      const g = (plan: 'chase' | 'pullback' | 'fade') =>
        playEntry(good, plan).r;
      const b = (plan: 'chase' | 'pullback' | 'fade') => playEntry(bad, plan).r;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Why, and when',
          body: 'Fundamental analysis asks why a price should move: rates, earnings, the economy. Technical analysis asks where and when: which level matters, and where the idea is proven wrong. Many traders use one for direction and the other for timing.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Good news for a bank’s shares lands, and the price jumps. When do you buy?',
          options: [
            {
              label: 'Now, before it goes higher',
              feedback:
                'That’s chasing: buying at the top of the jump, far from any level that says you’re wrong.',
            },
            {
              label:
                'After a pullback to a level that matters, with a stop below it',
              correct: true,
              feedback: 'Yes. Direction from the news, timing from the chart.',
            },
            {
              label: 'Never: it’s already up',
              feedback:
                'Being up isn’t a reason on its own. Where is it against the levels that matter?',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Pick your entry, then play it',
          body: 'Choose a plan, play what happened, then replay the other ending of the same chart.',
          widget: 'news-pullback',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Same risk, different reward',
          body: 'Every plan risked the same amount, 1R.',
          points: [
            `When the move held, buying the headline made ${r(g('chase'))}. Buying the pullback made ${r(g('pullback'))}: the stop was closer, so the same risk bought more of the move.`,
            `When the news faded, both buyers lost ${size(b('pullback'))}: exactly what they planned.`,
            `Selling against the news lost ${size(g('fade'))} when it held and made ${size(b('fade'))} when it faded. Betting against the fundamentals pays only when they turn out wrong.`,
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Honest about the test',
          body: 'This is one built chart with two endings, not a promise. What it shows is general: waiting for a level gives a closer stop, so the same money at risk buys more upside. The cost is that sometimes price never comes back to the level, and you miss the move.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'The fundamentals say up, but price is far above any level that matters. The disciplined move?',
          options: [
            {
              label: 'Wait for a level, or skip the trade',
              correct: true,
              feedback:
                'Yes. Missing a trade costs nothing; a bad entry costs R.',
            },
            {
              label: 'Buy anyway: the fundamentals are strong',
              feedback:
                'Strong fundamentals don’t tell you where you’re wrong. Without a level, your stop is a guess.',
            },
            {
              label: 'Sell: it’s gone up too far',
              feedback: 'That bets against the reason you had for the trade.',
            },
          ],
        },
      ];
    },
  },
};
