import type { Offer } from '../lib/engines/ipo.ts';

/**
 * The Dangote Petroleum Refinery offer, as published. Facts only, each with
 * where it came from and when we checked. The lesson's maths lives in
 * lib/engines/ipo.ts and works for any offer: when the next big IPO comes,
 * this file changes and nothing else does.
 *
 * Checked 26 Sep 2026 against the NGX announcement and Bamboo's summary of
 * the prospectus. Dates after the close are indicative, and say so.
 */

export const DANGOTE: {
  offer: Offer;
  name: string;
  exchange: string;
  checked: string;
  /** Profit after tax for the first half of 2026, in whole naira (NGX). */
  halfYearProfit: number;
  /** Revenue for the first half of 2026, in whole naira (NGX). */
  halfYearRevenue: number;
  /** The implied value NGX published, in hundredths of a trillion naira. */
  publishedValueHundredths: number;
  allotmentBasis: string;
  crediting: string;
  sources: { name: string; url: string }[];
} = {
  name: 'Dangote Petroleum Refinery',
  exchange: 'NGX',
  checked: '26 Sep 2026',
  offer: {
    price: 52_500,
    minimum: 10,
    lot: 10,
    offered: 4_100_000_000,
    stakeBp: 330,
    opens: '2026-09-14',
    closes: '2026-10-13',
  },
  halfYearProfit: 2_550_000_000_000,
  halfYearRevenue: 19_470_000_000_000,
  publishedValueHundredths: 6_522,
  allotmentBasis: 'around 11 November 2026 (indicative)',
  crediting: 'around early December 2026 (indicative)',
  sources: [
    {
      name: 'NGX: Dangote sounds NGX gong as refinery IPO opens',
      url: 'https://ngxgroup.com/dangote-sounds-ngx-gong-as-refinery-ipo-opens/',
    },
    {
      name: 'Bamboo: Dangote Refinery IPO, everything you need to know',
      url: 'https://learn.investbamboo.com/dangote-refinery-ipo-everything-you-need-to-know/',
    },
    {
      name: 'The Guardian: Dangote Refinery opens ₦2.15tn IPO to retail investors',
      url: 'https://guardian.ng/featured/dangote-refinery-opens-%E2%82%A62-15tn-ipo-to-retail-investors-at-%E2%82%A65250-minimum/',
    },
  ],
};

/** Every word on /ipo. Numbers arrive formatted from the page. */
export const IPO_PAGE = {
  meta: {
    title: 'How an IPO works: the Dangote Refinery offer, explained',
    description:
      'What an IPO application buys, what oversubscription and listing day do to it, and how to size up a company, using the Dangote Refinery offer as the example. Educational only.',
  },
  hero: {
    kicker: 'IPO 101 · Educational only',
    titleLead: 'How an IPO works,',
    titleGold: 'with the Dangote offer as the example.',
    lead: 'An IPO is when a company sells shares to the public for the first time. Here’s what that means for your money, step by step, using the offer everyone is talking about. We won’t tell you whether to buy. We’ll show you how to think about it.',
    status: {
      open: (closes: string) => `Offer open · closes ${closes}`,
      closed: 'Offer closed · allotment and listing next',
      upcoming: 'Offer not open yet',
    },
  },
  facts: {
    kicker: 'The offer, in facts',
    title: 'What was actually published',
    items: {
      price: 'Price per share',
      minimum: 'Smallest application',
      lot: 'Above that',
      offered: 'Shares on offer',
      raising: 'Raising, if fully taken',
      stake: 'Share of the company',
      window: 'Offer window',
      allotment: 'Basis of allotment',
      crediting: 'Shares in your account',
      exchange: 'Listing',
    },
    lotLine: (lot: number) => `Multiples of ${lot} shares`,
    minimumLine: (shares: number, cost: string) => `${shares} shares · ${cost}`,
    checked: (date: string) =>
      `Checked ${date}. Details can change: the prospectus is the source that counts.`,
    sources: 'Sources',
  },
  budget: {
    kicker: 'Step 1',
    title: 'What your money buys',
    lead: 'Shares come in whole lots. Type a budget and see what it buys, and what’s left over.',
    label: 'Your budget (₦)',
    quick: [5_250, 20_000, 100_000, 500_000],
    shares: 'Shares',
    cost: 'You pay',
    change: 'Left over',
    tooSmall: (minimum: string) => `The smallest application is ${minimum}.`,
  },
  oversubscribed: {
    kicker: 'Step 2',
    title: 'When everyone wants in',
    lead: 'If people ask for more shares than exist, the offer is “oversubscribed” and each person gets part of what they asked for. The rest of the money comes back to them.',
    label: 'Times oversubscribed',
    times: (x: number) =>
      x === 1 ? 'Not oversubscribed' : `${x}× oversubscribed`,
    allotted: 'You get',
    refund: 'Refunded',
    note: 'Simplified: everyone gets the same share. Real allotment rules are set with the SEC and often favour small applications.',
  },
  listing: {
    kicker: 'Step 3',
    title: 'Listing day',
    lead: 'Once the shares list, their price is whatever buyers and sellers agree on. It can open above the offer price, or below it. Both happen.',
    label: 'Price move after listing',
    value: 'Your shares worth',
    note: 'Nobody can promise a listing-day price. Anyone who does is guessing, or selling something.',
  },
  size: {
    kicker: 'Step 4',
    title: 'Size up the company',
    lead: 'The price of one share means little on its own. What matters is what you’re paying for the whole business, and what it earns.',
    value: 'The whole company at the offer price',
    valueHow: (offered: string, stake: string) =>
      `${offered} shares are about ${stake} of the company. So the whole company has about 100 ÷ 3.3 times as many shares, at the offer price each.`,
    valueCheck: (published: string) =>
      `NGX published ${published}. Ours is a hair different because “3.3%” is itself rounded.`,
    profit: 'Profit after tax, first half of 2026',
    yearly: 'If the second half matches the first',
    yearlyNote:
      'A big “if”: oil prices and the naira can change the second half completely.',
    pe: 'Price to earnings (P/E)',
    peLine: (pe: string) =>
      `You’d be paying about ₦${pe} for every ₦1 the company earns in a year. Is that cheap? Compare it with similar companies, and with what safer things like treasury bills pay. That comparison is the skill.`,
  },
  noise: {
    kicker: 'Noise vs signal around this IPO',
    noiseTitle: 'Noise',
    signalTitle: 'Signal',
    noiseItems: [
      '“It will double on listing day”: nobody knows that',
      'Screenshots of big allotments',
      'Links and “agents” in WhatsApp groups asking you to pay them',
      '“Last chance!!” pressure',
    ],
    signalItems: [
      'The prospectus, especially the risk factors',
      'Profit, debt and cash flow over several periods',
      'What you pay for the whole company versus what it earns',
      'How much of your own money you can afford to lock away',
    ],
  },
  ask: {
    kicker: 'Before any IPO, ask yourself',
    items: [
      'What does this company actually earn, and is it growing?',
      'What am I paying for the whole company, not just one share?',
      'What are the risks the prospectus itself lists?',
      'If the price falls 30% after listing, am I fine holding?',
      'Is this money I won’t need for a long time?',
      'Am I applying only through channels named in the prospectus?',
    ],
  },
  safety:
    'Apply only through SEC-registered brokers, banks and platforms named in the prospectus. Never send money to an individual “agent”. Nobody can guarantee you an allotment or a listing-day price.',
  deeper: {
    title: 'Want to judge a company yourself?',
    body: 'The Fundamental Analysis stage teaches income statements, valuation and what moves prices, with lessons you play.',
    cta: 'See the roadmap',
  },
} as const;
