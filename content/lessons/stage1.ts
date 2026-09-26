import type { LessonDef } from '../../lib/lessons/types.ts';
import { formatBp, formatMoney, fromMinor } from '../../lib/core/money.ts';
import {
  allotment,
  companyValue,
  peHundredths,
} from '../../lib/engines/ipo.ts';
import {
  costsOfTrading,
  gappyPath,
  makeBook,
  marketBuy,
  roundTripCost,
} from '../../lib/engines/market.ts';
import { LEVERAGE_LAB, liquidationMoveBp } from '../../lib/engines/risk.ts';
import { DANGOTE } from '../ipo.ts';
import { SEEDS } from './seeds.ts';

/**
 * Stage 1: how markets work. Every number in these words is computed here
 * from an engine, when the lesson opens.
 */

const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
const naira = (kobo: number) => formatMoney(fromMinor(kobo, 'NGN'));

export const STAGE_1: Record<string, LessonDef> = {
  m0: {
    id: 'm0',
    takeaways: [
      'Most price moves on most days are noise. Don’t react to every wiggle.',
      'A filter calms the noise but notices real turns later. Every tool trades one for the other.',
      'Urgency, promised returns and screenshots are noise. Rates, profits and policy are signal.',
    ],
    beats: () => [
      {
        kind: 'say',
        tag: 'see',
        title: 'The market talks all day',
        body: 'Prices move every minute, and most of those moves mean nothing. Traders who last learn to ignore almost everything, and act on the little that matters.',
      },
      {
        kind: 'widget',
        tag: 'touch',
        title: 'Turn the noise down',
        body: 'Slide the filter until the real direction shows through.',
        widget: 'noise-filter',
        gate: true,
      },
      {
        kind: 'choice',
        tag: 'predict',
        prompt:
          'A longer filter looks calmer. What did you give up for that calm?',
        options: [
          {
            label: 'Nothing. Longer is simply better.',
            feedback:
              'There’s always a cost: a longer filter reacts late. When the trend really turns, it takes a while to notice.',
          },
          {
            label: 'Speed: it notices real turns later.',
            correct: true,
            feedback:
              'Exactly. Calm and quick pull against each other. You pick the balance for the way you trade.',
          },
          {
            label: 'Accuracy: it shows the wrong prices.',
            feedback:
              'It shows the right prices, averaged. What it loses is speed: real turns show up late.',
          },
        ],
      },
      {
        kind: 'widget',
        tag: 'decide',
        title: 'Noise or signal?',
        body: 'Eight things you’ll see this month. Call each one.',
        widget: 'signal-or-noise',
        gate: true,
      },
      {
        kind: 'say',
        tag: 'why',
        title: 'Why this comes first',
        body: 'Every lesson after this one gives you a new tool. Without this habit, a new tool is just a new way to react to noise.',
      },
    ],
  },

  m1: {
    id: 'm1',
    takeaways: [
      'A price is the last trade, nothing more.',
      'Buyers wait on the bids, sellers on the asks. A market order takes whatever is waiting.',
      'A big order in a thin market moves the price a long way.',
    ],
    beats: () => {
      const book = makeBook(SEEDS.book);
      const small = marketBuy(book, 20);
      const big = marketBuy(book, 150);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'A price is just the last trade',
          body: `Right now, buyers are waiting to buy at up to ${usd(book.bids[0]!.price)} and sellers to sell from ${usd(book.asks[0]!.price)}. That list of waiting orders is the order book. When two sides agree, a trade happens, and that trade is “the price”.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'Someone sends a market order to buy 150 units at once. What happens to the price?',
          options: [
            {
              label: 'It stays the same',
              feedback: `The first sellers only have ${book.asks[0]!.size} units. The rest has to come from sellers asking more, so the price climbs.`,
            },
            {
              label: 'It goes up as the order eats through the sellers',
              correct: true,
              feedback:
                'Yes. Each level of sellers runs out, and the next one asks a little more.',
            },
            {
              label: 'It goes down',
              feedback:
                'Buying takes the sellers’ offers from cheapest upwards, so the price rises, not falls.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Be the buyer',
          body: 'Send a small order, then a big one, and watch where the last trade lands.',
          widget: 'order-book',
          props: { seed: SEEDS.book },
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why big orders move markets',
          body: `Buying 20 units moved the price to ${usd(small.last!)}. Buying 150 pushed it to ${usd(big.last!)}. Each level of sellers only holds so much. That’s why small stocks and small coins jump on one big order, and why “thin” markets are dangerous.`,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Why does one big order move a small NGX stock more than a large bank stock?',
          options: [
            {
              label: 'Fewer orders are waiting, so it runs through them faster',
              correct: true,
              feedback:
                'Right. Less waiting on the book means each order travels further.',
            },
            {
              label: 'Small stocks are always overpriced',
              feedback:
                'Price level has nothing to do with it. It’s how much is waiting on the book.',
            },
            {
              label: 'The exchange charges more for small stocks',
              feedback:
                'Fees don’t move the price. How much is waiting on the book does.',
            },
          ],
        },
      ];
    },
  },

  m2: {
    id: 'm2',
    takeaways: [
      'You buy at the ask and sell at the bid. The gap is the spread.',
      'The spread is a cost you pay on every round trip, win or lose.',
      'Trading often with a wide spread is a slow leak.',
    ],
    beats: () => {
      const book = makeBook(SEEDS.spread);
      const bid = book.bids[0]!.price;
      const ask = book.asks[0]!.price;
      const one = roundTripCost(bid, ask, 10, 1);
      const day = roundTripCost(bid, ask, 10, 10);
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Two prices, not one',
          body: `You can buy at ${usd(ask)} (the ask) and sell at ${usd(bid)} (the bid). The ${usd(ask - bid)} between them is the spread, and it goes to whoever is making the market.`,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt:
            'You buy 10 units and sell them straight back. The price hasn’t moved. What happened to your money?',
          options: [
            {
              label: 'Nothing, it’s the same',
              feedback: `You bought at the ask and sold at the bid: ${usd(one)} gone, with the price standing still.`,
            },
            {
              label: 'A small loss: the spread',
              correct: true,
              feedback: `Right: ${usd(one)} on 10 units, just for the round trip.`,
            },
            {
              label: 'A small gain',
              feedback:
                'You sell lower than you buy, so it can only be a loss when the price stands still.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Buy, sell, repeat',
          body: 'Do a few round trips and watch the cost pile up while the price goes nowhere.',
          widget: 'spread',
          props: { seed: SEEDS.spread },
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'The spread is certain; profits aren’t. It widens in quiet markets, at night and around news, which is exactly when many beginners trade.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'Ten round trips a day, 10 units each, at this spread. What does the spread cost you per day?',
          options: [
            {
              label: usd(day / 10),
              feedback: `That’s one round trip. Ten of them is ${usd(day)}.`,
            },
            {
              label: usd(day),
              correct: true,
              feedback: `Yes, ${usd(day)} a day before you’ve made a single good decision.`,
            },
            {
              label: usd(day * 10),
              feedback: `Too high. It’s ${usd(one)} a round trip, times ten: ${usd(day)}.`,
            },
          ],
        },
      ];
    },
  },

  m3: {
    id: 'm3',
    takeaways: [
      'A market order fills now, at whatever price is there.',
      'A limit order fills only at your price or better, and may never fill.',
      'A stop order becomes a market order when triggered, and can fill worse than your price.',
    ],
    beats: () => {
      const path = gappyPath(SEEDS.orders);
      const start = path[0]!;
      const trigger = start + 60;
      const jump = path[24]!;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Three ways to buy',
          body: 'Every order is a trade-off between getting filled and getting your price.',
          points: [
            'Market: buy now, at whatever the price is.',
            'Limit: buy only at my price or lower. I may wait forever.',
            'Stop: when the price reaches my level, buy at the next price available.',
          ],
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `The price is ${usd(start)}. You place a buy stop at ${usd(trigger)}. News lands and the price jumps straight to ${usd(jump)}. What do you pay?`,
          options: [
            {
              label: usd(trigger),
              feedback: `Nobody was selling at ${usd(trigger)}. The price jumped past it, and a stop fills at the next price: ${usd(jump)}.`,
            },
            {
              label: `About ${usd(jump)}`,
              correct: true,
              feedback: `Yes. A stop becomes a market order once triggered. The ${usd(jump - trigger)} difference is called slippage.`,
            },
            {
              label: 'Nothing. The order is cancelled.',
              feedback:
                'It doesn’t cancel. It fills, at the next available price.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Place each order in the same market',
          body: 'Pick an order, press play, and see when and where it fills. Try at least two.',
          widget: 'order-types',
          props: { seed: SEEDS.orders },
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'Your stop loss is a stop order. In a fast market it protects you, but not at the exact price you typed. Plan for slippage, especially around news.',
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `You only want to buy if the price dips to ${usd(start - 30)}. Which order?`,
          options: [
            {
              label: 'Market',
              feedback:
                'A market order buys now, at today’s price, not the dip.',
            },
            {
              label: 'Limit',
              correct: true,
              feedback:
                'Right. A limit waits for your price or better. It may never fill, and that’s the trade-off.',
            },
            {
              label: 'Stop',
              feedback:
                'A buy stop triggers when the price rises to it. For a dip you want a limit.',
            },
          ],
        },
      ];
    },
  },

  m4: {
    id: 'm4',
    takeaways: [
      'Forex, stocks, crypto and commodities move for different reasons.',
      'In Ghana and Nigeria, cocoa, gold and oil reach into the currency, and the currency into everything.',
      'Know what moves your market before you trade it.',
    ],
    beats: () => [
      {
        kind: 'say',
        tag: 'see',
        title: 'Four markets, four sets of reasons',
        body: 'The chart looks the same in every market. What moves it doesn’t.',
        points: [
          'Forex: interest rates, inflation, central banks, trade.',
          'Stocks: a company’s profits, its prospects, and interest rates.',
          'Crypto: adoption, regulation, liquidity, sentiment.',
          'Commodities: supply and demand. Harvests, wars, factories.',
        ],
      },
      {
        kind: 'widget',
        tag: 'touch',
        title: 'Which market moves first?',
        body: 'Match each headline to the market it hits first.',
        widget: 'market-sorter',
        gate: true,
      },
      {
        kind: 'choice',
        tag: 'predict',
        prompt:
          'Ghana’s cocoa harvest comes in far below forecast. What else might move, besides cocoa?',
        options: [
          {
            label: 'The cedi: fewer cocoa dollars coming in',
            correct: true,
            feedback:
              'Yes. Cocoa earns Ghana dollars; less cocoa means fewer dollars, and that can weaken the cedi.',
          },
          {
            label: 'Nothing else',
            feedback:
              'Cocoa is one of Ghana’s biggest earners of dollars. Less of it reaches the currency.',
          },
          {
            label: 'US tech stocks',
            feedback:
              'Too far away. The first knock-on is closer to home: the cedi.',
          },
        ],
      },
      {
        kind: 'say',
        tag: 'why',
        title: 'Why it matters',
        body: 'Before you trade anything, know what moves it. A forex trader watching company earnings, or a stock investor ignoring interest rates, is reading the wrong news.',
      },
    ],
  },

  f0: {
    id: 'f0',
    takeaways: [
      'An application buys whole lots at a fixed price. What you get can be cut if the offer is oversubscribed.',
      'Listing-day prices can open above or below the offer price. Nobody can promise which.',
      'Size up the whole company, not the price of one share.',
    ],
    beats: () => {
      const offer = DANGOTE.offer;
      const applied = 190;
      const cut = allotment(offer, applied, 5_000);
      const pe = peHundredths(companyValue(offer), DANGOTE.halfYearProfit * 2);
      const peText = `${Math.floor(pe / 100)}.${String(pe % 100).padStart(2, '0')}`;
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'What an IPO is',
          body: `A company selling shares to the public for the first time. In the Dangote Refinery offer each share costs ${naira(offer.price)}, and the smallest application is ${offer.minimum} shares: ${naira(offer.minimum * offer.price)}.`,
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Put a budget in',
          body: 'See what it buys, what oversubscription does to it, and what listing day could do after.',
          widget: 'ipo-lab',
          gate: true,
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `You apply for ${applied} shares. Twice as many shares are asked for as exist, and everyone gets the same share. About how many do you get?`,
          options: [
            {
              label: String(applied),
              feedback: `With twice the demand, each person gets about half: ${cut.allotted}, rounded down to whole lots. The rest of your money comes back.`,
            },
            {
              label: `About ${cut.allotted}`,
              correct: true,
              feedback: `Right: ${cut.allotted}, and ${naira(cut.refund)} is refunded.`,
            },
            {
              label: 'None',
              feedback: `Oversubscription cuts applications down; it doesn’t cancel them. You’d get about ${cut.allotted}.`,
            },
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt: `At the offer price, the company is priced at about ${peText} times a year’s profit (if the second half of 2026 matches the first). What does that mean?`,
          options: [
            {
              label: `You pay about ₦${peText} for each ₦1 of yearly profit`,
              correct: true,
              feedback:
                'Yes. That’s the price-to-earnings ratio. Whether it’s cheap depends on what similar companies cost, and what safer things pay.',
            },
            {
              label: 'The share will rise that many times',
              feedback:
                'A P/E says nothing about future prices. It’s what you pay for today’s profits.',
            },
            {
              label: 'The company earns that much per share',
              feedback:
                'It’s a ratio of price to profit, not profit per share.',
            },
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why the whole company matters',
          body: 'A cheap share price can hide an expensive company, and the other way round. Apply only through channels the prospectus names, never through an “agent” in a group chat.',
        },
      ];
    },
  },

  m5: {
    id: 'm5',
    takeaways: [
      'Leverage multiplies the position, and every loss with it.',
      'At high leverage, an ordinary wobble closes you out before your idea has a chance.',
      'The path matters, not just where the market ends.',
    ],
    beats: () => {
      const at20 = formatBp(-liquidationMoveBp(LEVERAGE_LAB, 20));
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Borrowed size',
          body: 'Leverage lets $100 control a much bigger position. Gains are multiplied, and so are losses. When losses eat your deposit, the broker closes you out.',
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Choose your leverage',
          body: 'Predict the damage, then run the market.',
          widget: 'leverage',
          gate: true,
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'At 20×, about how far can the market fall before your $100 is closed out?',
          options: [
            {
              label: formatBp(-liquidationMoveBp(LEVERAGE_LAB, 50)),
              feedback: `That’s 50×. At 20× you’re closed out at about ${at20}.`,
            },
            {
              label: at20,
              correct: true,
              feedback: `Right: ${at20}. An ordinary day in many markets.`,
            },
            {
              label: '20%',
              feedback: `Much less: 20× leverage turns a ${at20} fall into losing nearly everything.`,
            },
          ],
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'Why it matters',
          body: 'Most blown forex and crypto accounts don’t come from bad ideas. They come from good-enough ideas at leverage that leaves no room to be early.',
        },
      ];
    },
  },

  m6: {
    id: 'm6',
    takeaways: [
      'Brokers earn from spreads and overnight fees; signal sellers earn from subscriptions. Both get paid whether you win or lose.',
      'Costs are certain. Profits aren’t.',
      'Guaranteed returns, “account managers” and pay-to-join are red flags.',
    ],
    beats: () => {
      const costs = costsOfTrading({
        deposit: 10_000,
        trades: 40,
        spreadPerTrade: 60,
        nightsHeld: 20,
        overnightPerNight: 25,
        subscription: 3_000,
      });
      return [
        {
          kind: 'say',
          tag: 'see',
          title: 'Follow the money',
          body: 'When you trade, several people get paid: the broker (spreads, overnight fees), the platform, and sometimes a “signals” seller. Their money is certain. Yours isn’t.',
        },
        {
          kind: 'choice',
          tag: 'predict',
          prompt: `You deposit ${usd(10_000)}, make 40 trades in a month that break even, hold some overnight, and pay for a signals group. What’s left?`,
          options: [
            {
              label: usd(10_000),
              feedback: `Breaking even on trades still costs you: ${usd(costs.total)} in spreads, fees and the subscription.`,
            },
            {
              label: usd(costs.left),
              correct: true,
              feedback: `Yes: ${usd(costs.left)}. You didn’t lose a single trade and still lost ${usd(costs.total)}.`,
            },
            {
              label: usd(12_000),
              feedback:
                'There’s no gain when the trades break even. Only costs.',
            },
          ],
        },
        {
          kind: 'widget',
          tag: 'touch',
          title: 'Where your deposit goes',
          body: 'Change how often you trade and whether you pay for signals.',
          widget: 'costs',
          gate: true,
        },
        {
          kind: 'say',
          tag: 'why',
          title: 'The red flags',
          body: 'Anyone who gets paid regardless of your results has a reason to keep you trading. Walk away from:',
          points: [
            'Guaranteed or fixed monthly returns',
            '“Send me money and my account manager will trade for you”',
            'Pay-to-join groups with profit screenshots',
            'Pressure: “last chance”, “only 3 slots left”',
          ],
        },
        {
          kind: 'choice',
          tag: 'check',
          prompt:
            'A “mentor” offers to trade your money for a guaranteed 20% a month. What’s true?',
          options: [
            {
              label: 'Guaranteed returns in trading are a red flag',
              correct: true,
              feedback:
                'Right. No real trader can guarantee returns, and managing other people’s money needs a licence.',
            },
            {
              label: 'It’s fine if he shows screenshots',
              feedback:
                'Screenshots are easy to fake and show only wins. A guarantee is the red flag.',
            },
            {
              label: 'It’s fine for a small amount',
              feedback:
                'A scam is a scam at any size. Small amounts are how they build trust before the big ask.',
            },
          ],
        },
      ];
    },
  },
};
