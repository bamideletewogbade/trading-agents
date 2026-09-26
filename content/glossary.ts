/**
 * The glossary: the words of trading and money, in plain English, each
 * pointing at the lesson that teaches it where there is one. Words only;
 * numbers stay in the lessons, where engines work them out (CLAUDE.md rule
 * 1). Local terms describe how things are set up in Ghana and Nigeria as
 * of September 2026; recheck them before relying on them for anything
 * else.
 *
 * scripts/check-lessons.ts proves every term is unique, every definition is
 * short, and every lesson it points to exists.
 */

export const GLOSSARY_GROUPS = {
  basics: 'Market basics',
  charts: 'Charts',
  risk: 'Risk',
  analysis: 'Analysis',
  strategy: 'Strategy',
  money: 'Money and investing',
  local: 'Ghana and Nigeria',
} as const;

export type GlossaryGroup = keyof typeof GLOSSARY_GROUPS;

export type Term = {
  term: string;
  /** Other names for the same thing, searched too. */
  aka?: readonly string[];
  group: GlossaryGroup;
  definition: string;
  /** Lessons that teach it, by id. */
  lessons?: readonly string[];
};

export const GLOSSARY: readonly Term[] = [
  {
    term: 'All-Share Index',
    aka: ['ASI', 'NGX ASI'],
    group: 'local',
    definition:
      'A number that tracks the prices of all shares listed on the Nigerian Exchange. When people say the Nigerian market was up today, they usually mean this.',
  },
  {
    term: 'Ask',
    aka: ['offer', 'ask price'],
    group: 'basics',
    definition:
      'The lowest price anyone is currently willing to sell at. If you buy right away, you pay the ask.',
    lessons: ['m1', 'm2'],
  },
  {
    term: 'ATR',
    aka: ['Average True Range'],
    group: 'analysis',
    definition:
      'How much a price usually moves in one bar, averaged over recent bars. Traders use it to set stops that fit how jumpy a market is.',
    lessons: ['t5'],
  },
  {
    term: 'Backtest',
    group: 'strategy',
    definition:
      'Running a strategy’s rules over past prices to see what they would have done. It’s a best case, because you chose the rules knowing the past.',
    lessons: ['s7'],
  },
  {
    term: 'Bank of Ghana',
    aka: ['BoG'],
    group: 'local',
    definition:
      'Ghana’s central bank. It sets the policy rate, manages the cedi and supervises banks.',
    lessons: ['f2', 'f3'],
  },
  {
    term: 'Bear market',
    group: 'basics',
    definition:
      'A long, deep fall in prices, when most people expect more falls to come.',
  },
  {
    term: 'Bid',
    aka: ['bid price'],
    group: 'basics',
    definition:
      'The highest price anyone is currently willing to buy at. If you sell right away, you get the bid.',
    lessons: ['m1', 'm2'],
  },
  {
    term: 'Bollinger Bands',
    group: 'analysis',
    definition:
      'Lines drawn above and below a moving average, spaced by how much price has been swinging. Wide bands mean a jumpy market; narrow bands, a quiet one.',
    lessons: ['t5', 's2'],
  },
  {
    term: 'Bond',
    group: 'money',
    definition:
      'A loan you make to a government or company. They pay you interest along the way and return your money at the end, unless they can’t.',
    lessons: ['f2'],
  },
  {
    term: 'Breakout',
    group: 'charts',
    definition:
      'When price closes above the top of a range, or below the bottom. Many fail and fall back in; heavy volume is a clue that one will hold.',
    lessons: ['c7', 's3'],
  },
  {
    term: 'Broker',
    aka: ['stockbroker', 'dealing member'],
    group: 'basics',
    definition:
      'A licensed company that places your orders on a market. Check it’s registered with the SEC before you send it money.',
    lessons: ['m6'],
  },
  {
    term: 'Bull market',
    group: 'basics',
    definition:
      'A long rise in prices, when most people expect more rises to come.',
  },
  {
    term: 'Candlestick',
    aka: ['candle'],
    group: 'charts',
    definition:
      'One bar on a chart showing four prices for a period: where it opened, the highest, the lowest and where it closed.',
    lessons: ['c1', 'c2'],
  },
  {
    term: 'Carry trade',
    group: 'analysis',
    definition:
      'Borrowing in a currency with low interest rates to earn a higher rate in another. It pays steadily until the higher-rate currency falls.',
    lessons: ['f8'],
  },
  {
    term: 'Central Bank of Nigeria',
    aka: ['CBN'],
    group: 'local',
    definition:
      'Nigeria’s central bank. It sets the Monetary Policy Rate, manages the naira and supervises banks.',
    lessons: ['f2', 'f3'],
  },
  {
    term: 'Commission',
    aka: ['brokerage fee'],
    group: 'basics',
    definition:
      'A fee a broker charges on each trade. Small on one trade, large on hundreds.',
    lessons: ['m6'],
  },
  {
    term: 'Commodity',
    group: 'basics',
    definition:
      'A raw material traded in bulk, such as oil, gold or cocoa. Their prices move the cedi and the naira because they bring dollars in.',
    lessons: ['m4', 'f7'],
  },
  {
    term: 'Compound interest',
    aka: ['compounding'],
    group: 'money',
    definition:
      'Earning returns on your earlier returns, not just on what you put in. Small, steady growth adds up over years; so do small, steady losses.',
    lessons: ['s6'],
  },
  {
    term: 'CSCS account',
    aka: ['CSCS', 'CHN'],
    group: 'local',
    definition:
      'In Nigeria, the account at the Central Securities Clearing System that holds your shares electronically, in your name. A stockbroker opens it for you.',
  },
  {
    term: 'Day trading',
    group: 'strategy',
    definition:
      'Opening and closing trades within the same day. It pays the spread often and needs hours at the screen.',
    lessons: ['s4'],
  },
  {
    term: 'Devaluation',
    group: 'money',
    definition:
      'When a currency loses value against others, sometimes suddenly. Anything priced in dollars, from fuel to phones, then costs more.',
    lessons: ['f7', 'f8'],
  },
  {
    term: 'Diversification',
    group: 'money',
    definition:
      'Spreading your money across different investments, so one bad one can’t sink you.',
    lessons: ['s6'],
  },
  {
    term: 'Dividend',
    group: 'money',
    definition:
      'Part of a company’s profit paid out to its shareholders, usually in cash.',
    lessons: ['f5'],
  },
  {
    term: 'Drawdown',
    group: 'risk',
    definition:
      'How far your account has fallen from its highest point. The deeper the fall, the bigger the gain you need just to get back.',
    lessons: ['r4'],
  },
  {
    term: 'Earnings',
    aka: ['profit', 'net income'],
    group: 'analysis',
    definition:
      'What a company made over a period, after its costs. Share prices often jump when earnings surprise.',
    lessons: ['f1', 'f4'],
  },
  {
    term: 'Economic calendar',
    group: 'analysis',
    definition:
      'A list of scheduled releases, such as inflation figures and interest-rate decisions, and when they come out. Markets can jump at those times.',
    lessons: ['f6'],
  },
  {
    term: 'Exchange rate',
    aka: ['FX rate'],
    group: 'money',
    definition:
      'The price of one currency in another: how many cedis or naira one dollar costs.',
    lessons: ['f3', 'f7'],
  },
  {
    term: 'Expectancy',
    group: 'risk',
    definition:
      'What a strategy makes on average per trade, counting wins and losses together. Only a positive expectancy is worth trading.',
    lessons: ['r6'],
  },
  {
    term: 'Fibonacci retracement',
    aka: ['Fibonacci', 'fib'],
    group: 'analysis',
    definition:
      'Lines at set percentages of a move where some traders expect price to pause. In our tests on simulated charts, they did no better than made-up levels.',
    lessons: ['t8'],
  },
  {
    term: 'Forex',
    aka: ['FX', 'foreign exchange'],
    group: 'basics',
    definition:
      'The market for currencies: swapping one for another, such as dollars for cedis or naira.',
    lessons: ['m4'],
  },
  {
    term: 'Fundamental analysis',
    group: 'analysis',
    definition:
      'Judging a market by what drives its value: earnings, interest rates, inflation, supply and demand.',
    lessons: ['f1'],
  },
  {
    term: 'Gap',
    group: 'charts',
    definition:
      'A jump between one bar’s close and the next bar’s open, with no trades in between. A stop can fill well past its price in a gap.',
    lessons: ['f6'],
  },
  {
    term: 'Ghana Stock Exchange',
    aka: ['GSE'],
    group: 'local',
    definition:
      'Ghana’s stock exchange, in Accra, where shares of listed companies are bought and sold through licensed brokers.',
  },
  {
    term: 'GSE Composite Index',
    aka: ['GSE-CI'],
    group: 'local',
    definition:
      'A number that tracks the prices of shares listed on the Ghana Stock Exchange: Ghana’s “the market was up today” number.',
  },
  {
    term: 'Inflation',
    group: 'money',
    definition:
      'Prices in general rising over time, so the same money buys less.',
    lessons: ['f3'],
  },
  {
    term: 'Interest rate',
    group: 'money',
    definition:
      'The price of borrowing money, as a share of the loan each year. What a lender earns and a borrower pays.',
    lessons: ['f2'],
  },
  {
    term: 'IPO',
    aka: ['initial public offering', 'public offer'],
    group: 'money',
    definition:
      'When a company first sells its shares to the public, before they trade on an exchange.',
    lessons: ['f0'],
  },
  {
    term: 'Leverage',
    group: 'risk',
    definition:
      'Trading with borrowed money, so a small price move makes a big change to your own money, both ways.',
    lessons: ['m5', 'r5'],
  },
  {
    term: 'Limit order',
    group: 'basics',
    definition:
      'An order to buy or sell only at your price or better. It protects your price, but may never fill.',
    lessons: ['m3'],
  },
  {
    term: 'Liquidity',
    group: 'basics',
    definition:
      'How easily something can be bought or sold without moving its price. In a thin market, one big order moves it a lot.',
    lessons: ['m1'],
  },
  {
    term: 'Long',
    aka: ['going long'],
    group: 'basics',
    definition: 'Owning something because you expect its price to rise.',
  },
  {
    term: 'MACD',
    group: 'analysis',
    definition:
      'An indicator built from two moving averages, showing when momentum is speeding up or slowing down.',
    lessons: ['t4'],
  },
  {
    term: 'Margin',
    group: 'risk',
    definition:
      'The money a broker holds from you to open a leveraged trade. If losses eat it, the broker closes the trade for you.',
    lessons: ['m5'],
  },
  {
    term: 'Margin call',
    group: 'risk',
    definition:
      'A broker’s demand for more money when losses shrink your margin. If you can’t pay, your trade is closed at a loss.',
    lessons: ['m5'],
  },
  {
    term: 'Market order',
    group: 'basics',
    definition:
      'An order to buy or sell right now, at whatever price is available.',
    lessons: ['m3'],
  },
  {
    term: 'Monetary Policy Rate',
    aka: ['MPR', 'policy rate'],
    group: 'local',
    definition:
      'The benchmark interest rate a central bank sets. Loan and savings rates tend to follow it. Nigeria’s is set by the CBN; Ghana’s by the Bank of Ghana.',
    lessons: ['f2'],
  },
  {
    term: 'Moving average',
    aka: ['MA', 'SMA', 'EMA'],
    group: 'analysis',
    definition:
      'The average price over recent bars, worked out again each bar. It smooths out noise and shows direction, a little late.',
    lessons: ['t2'],
  },
  {
    term: 'Mutual fund',
    aka: ['unit trust', 'collective investment scheme'],
    group: 'money',
    definition:
      'A pot of many people’s money, invested for them by a licensed fund manager. Check the manager is registered with the SEC.',
  },
  {
    term: 'Nigerian Exchange',
    aka: ['NGX', 'Nigerian Stock Exchange', 'NSE'],
    group: 'local',
    definition:
      'Nigeria’s main stock exchange, in Lagos, where shares of listed companies are bought and sold through licensed stockbrokers. It used to be called the Nigerian Stock Exchange.',
    lessons: ['m4'],
  },
  {
    term: 'Noise',
    group: 'basics',
    definition:
      'Price moves and news that mean nothing for where a market is heading, which is most of them.',
    lessons: ['m0'],
  },
  {
    term: 'Order book',
    group: 'basics',
    definition:
      'The list of everyone’s waiting buy and sell orders, at each price.',
    lessons: ['m1'],
  },
  {
    term: 'Overbought and oversold',
    group: 'analysis',
    definition:
      'Words for when RSI or a similar indicator is very high or very low. They describe the move so far, not the next one.',
    lessons: ['t3'],
  },
  {
    term: 'Paper trading',
    aka: ['forward test'],
    group: 'strategy',
    definition:
      'Following a strategy with pretend money, recording every trade, before risking real money on it.',
    lessons: ['s7'],
  },
  {
    term: 'P/E ratio',
    aka: ['price-to-earnings', 'PE'],
    group: 'analysis',
    definition:
      'A share’s price divided by the company’s earnings per share: how many years of today’s profit you’re paying for.',
    lessons: ['f5'],
  },
  {
    term: 'Pip',
    group: 'basics',
    definition:
      'The smallest usual price step in a currency pair. Forex profits and spreads are often quoted in pips.',
  },
  {
    term: 'Portfolio',
    group: 'money',
    definition: 'Everything you own as investments, taken together.',
    lessons: ['s6'],
  },
  {
    term: 'Position size',
    group: 'risk',
    definition:
      'How much you buy in a trade. Set it so that hitting your stop costs a small, fixed share of your account.',
    lessons: ['r2'],
  },
  {
    term: 'Range',
    aka: ['sideways market'],
    group: 'charts',
    definition:
      'When price moves sideways between a floor and a ceiling instead of trending.',
    lessons: ['c6', 's2'],
  },
  {
    term: 'Real return',
    group: 'money',
    definition:
      'What you earned after inflation. A savings rate below inflation loses buying power even as the balance grows.',
    lessons: ['f3'],
  },
  {
    term: 'Resistance',
    group: 'charts',
    definition:
      'A price level where rises have stalled before, because sellers showed up there.',
    lessons: ['c5'],
  },
  {
    term: 'Risk-reward',
    aka: ['reward-to-risk'],
    group: 'risk',
    definition:
      'What a trade could make compared with what it could lose if the stop is hit.',
    lessons: ['r3'],
  },
  {
    term: 'R-multiple',
    aka: ['R'],
    group: 'risk',
    definition:
      'A trade’s result measured in units of what you risked. Make twice what you risked and that’s 2R; lose what you risked and it’s −1R.',
    lessons: ['r3'],
  },
  {
    term: 'RSI',
    aka: ['Relative Strength Index'],
    group: 'analysis',
    definition:
      'An indicator from 0 to 100 comparing recent rises with recent falls. It measures momentum, not the direction to come.',
    lessons: ['t3'],
  },
  {
    term: 'Scam red flags',
    group: 'money',
    definition:
      'Guaranteed returns, pressure to pay fast, an “account manager” who trades your money, and anyone asking for your PIN or OTP.',
    lessons: ['m6'],
  },
  {
    term: 'SEC',
    aka: ['Securities and Exchange Commission'],
    group: 'local',
    definition:
      'The regulator of investments: Nigeria and Ghana each have their own. Check a broker, fund or offer is registered with it before you send money.',
    lessons: ['f0'],
  },
  {
    term: 'Share',
    aka: ['stock', 'equity'],
    group: 'basics',
    definition: 'A small piece of ownership in a company.',
    lessons: ['m4'],
  },
  {
    term: 'Short',
    aka: ['short selling', 'going short'],
    group: 'basics',
    definition:
      'Selling something you don’t own, expecting to buy it back cheaper. You gain if the price falls and lose if it rises.',
  },
  {
    term: 'Signal',
    group: 'basics',
    definition:
      'Information that actually tells you something about where a price is heading, as opposed to noise. Also used for an alert to buy or sell.',
    lessons: ['m0'],
  },
  {
    term: 'Slippage',
    group: 'risk',
    definition:
      'The difference between the price you asked for and the price you got. Worst in fast markets and gaps.',
    lessons: ['f6', 's5'],
  },
  {
    term: 'Spread',
    group: 'basics',
    definition:
      'The gap between the bid and the ask. You pay it every time you trade.',
    lessons: ['m2'],
  },
  {
    term: 'Stop loss',
    aka: ['stop'],
    group: 'risk',
    definition:
      'An order that closes your trade at a set price to cap your loss: the point where you admit you were wrong.',
    lessons: ['r1'],
  },
  {
    term: 'Support',
    group: 'charts',
    definition:
      'A price level where falls have stalled before, because buyers showed up there.',
    lessons: ['c5'],
  },
  {
    term: 'Swing trading',
    group: 'strategy',
    definition:
      'Holding trades for days to weeks, reading four-hour or daily charts.',
    lessons: ['s4'],
  },
  {
    term: 'Timeframe',
    group: 'charts',
    definition:
      'How much time each bar on a chart covers: a minute, an hour, a day. The same market can trend on one and range on another.',
    lessons: ['c3', 't9'],
  },
  {
    term: 'Treasury bill',
    aka: ['T-bill'],
    group: 'money',
    definition:
      'A short-term loan to the government, sold below its face value and repaid in full when it ends. Ghana and Nigeria sell them for a few months to a year.',
    lessons: ['f3'],
  },
  {
    term: 'Trend',
    aka: ['uptrend', 'downtrend'],
    group: 'charts',
    definition:
      'Price moving one way over time. An uptrend makes higher highs and higher lows.',
    lessons: ['c4'],
  },
  {
    term: 'Trend following',
    group: 'strategy',
    definition:
      'Buying after a rise has started and selling after it ends. Wrong often and small, right rarely and big.',
    lessons: ['s1'],
  },
  {
    term: 'Trendline',
    group: 'charts',
    definition:
      'A line joining a trend’s lows, or its highs, that price may keep returning to.',
    lessons: ['t1'],
  },
  {
    term: 'Volatility',
    group: 'risk',
    definition:
      'How much and how fast a price moves. High volatility means bigger swings both ways.',
    lessons: ['t5'],
  },
  {
    term: 'Volume',
    group: 'charts',
    definition:
      'How much was traded in a period. Moves on heavy volume have more buyers or sellers behind them.',
    lessons: ['c7'],
  },
  {
    term: 'Yield',
    group: 'money',
    definition:
      'What an investment pays you each year as a share of its price, such as a dividend or a bond’s interest.',
    lessons: ['f5'],
  },
];

/** A term's anchor on the glossary page. */
export function termSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Terms whose name, other names or definition contain the query, names first. */
export function searchGlossary(query: string): Term[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...GLOSSARY];
  const named = (t: Term) =>
    t.term.toLowerCase().includes(q) ||
    (t.aka ?? []).some((a) => a.toLowerCase().includes(q));
  return [
    ...GLOSSARY.filter(named),
    ...GLOSSARY.filter(
      (t) => !named(t) && t.definition.toLowerCase().includes(q),
    ),
  ];
}

export const GLOSSARY_PAGE = {
  meta: {
    title: 'Glossary: trading and money words in plain English',
    description:
      'Every word you’ll meet in trading and investing, from bid and ask to the NGX and T-bills, explained in plain English, with the lesson that teaches it.',
  },
  hero: {
    kicker: 'Glossary',
    titleLead: 'Trading and money words,',
    titleGold: 'in plain English.',
    lead: 'Heard a word you didn’t know? Find it here in a sentence or two, then play the lesson that teaches it.',
  },
  search: 'Search the glossary',
  placeholder: 'e.g. spread, NGX, T-bill, RSI',
  all: 'All',
  count: (n: number) => (n === 1 ? '1 word' : `${n} words`),
  none: 'No word matches that yet. Try a shorter one.',
  aka: 'Also called',
  learn: 'Learn it',
  teaser: {
    kicker: 'Glossary',
    title: 'Every word, in plain English.',
    lead: 'From bid and ask to the NGX, T-bills and RSI. A sentence or two each, and the lesson that teaches it.',
    cta: (n: number) => `See all ${n} words`,
    featured: [
      'Spread',
      'Stop loss',
      'Nigerian Exchange',
      'Treasury bill',
      'Inflation',
      'RSI',
    ],
  },
} as const;
