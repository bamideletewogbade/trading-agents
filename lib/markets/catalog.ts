/**
 * The markets signals read (docs/member-app-plan.md §4.4): what each is
 * called, where its bars come from, how many decimals its price carries
 * (prices are integers in that smallest unit) and what a round trip costs a
 * trader there, which every signal's record pays.
 *
 * Signals decide once a day, on the daily close (00:00 UTC). That suits
 * people with jobs, keeps costs small against the moves, and gives each
 * market a record of well over a year from one request.
 *
 * - Kraken's public API serves crypto and gold (PAXG, a token backed by a
 *   fine ounce of London gold) free and without a key. Its own FX markets
 *   are too thin to trust (wicks of 10% on EUR/USD), so FX comes from
 * - Twelve Data, when `TWELVEDATA_API_KEY` is set. FX has no central
 *   volume, so FX signals are pullbacks only; a breakout needs volume.
 *
 * Pure data and formatting: `pnpm check` imports it under plain Node.
 */

export type MarketClass = 'crypto' | 'fx' | 'metal';
export type Source = 'kraken' | 'twelvedata';

export type Market = {
  /** The id in URLs: /signals/btc. */
  id: string;
  source: Source;
  /** The source's name for it: XBTUSD at Kraken, EUR/USD at Twelve Data. */
  ticker: string;
  symbol: string;
  name: string;
  class: MarketClass;
  /** Digits after the point in a price: BTC 73413.5 is 734135 at 1. */
  decimals: number;
  /** Spread and fees for a round trip, in bp. */
  costBp: number;
  /** Bars in a trading week: crypto never closes, FX rests at weekends. */
  weekBars: number;
};

export const MARKETS: readonly Market[] = [
  {
    id: 'btc',
    source: 'kraken',
    ticker: 'XBTUSD',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    class: 'crypto',
    decimals: 1,
    costBp: 20,
    weekBars: 7,
  },
  {
    id: 'eth',
    source: 'kraken',
    ticker: 'ETHUSD',
    symbol: 'ETH/USD',
    name: 'Ether',
    class: 'crypto',
    decimals: 2,
    costBp: 20,
    weekBars: 7,
  },
  {
    id: 'sol',
    source: 'kraken',
    ticker: 'SOLUSD',
    symbol: 'SOL/USD',
    name: 'Solana',
    class: 'crypto',
    decimals: 2,
    costBp: 20,
    weekBars: 7,
  },
  {
    id: 'xrp',
    source: 'kraken',
    ticker: 'XRPUSD',
    symbol: 'XRP/USD',
    name: 'XRP',
    class: 'crypto',
    decimals: 5,
    costBp: 20,
    weekBars: 7,
  },
  {
    id: 'gold',
    source: 'kraken',
    ticker: 'PAXGUSD',
    symbol: 'XAU/USD',
    name: 'Gold',
    class: 'metal',
    decimals: 2,
    costBp: 10,
    weekBars: 7,
  },
  {
    id: 'eurusd',
    source: 'twelvedata',
    ticker: 'EUR/USD',
    symbol: 'EUR/USD',
    name: 'Euro',
    class: 'fx',
    decimals: 5,
    costBp: 2,
    weekBars: 5,
  },
  {
    id: 'gbpusd',
    source: 'twelvedata',
    ticker: 'GBP/USD',
    symbol: 'GBP/USD',
    name: 'Pound',
    class: 'fx',
    decimals: 5,
    costBp: 3,
    weekBars: 5,
  },
  {
    id: 'usdjpy',
    source: 'twelvedata',
    ticker: 'USD/JPY',
    symbol: 'USD/JPY',
    name: 'Yen',
    class: 'fx',
    decimals: 3,
    costBp: 2,
    weekBars: 5,
  },
];

export function marketById(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}

/** Daily bars: one decision a day, on the close. */
export const BAR_MINUTES = 1440;

function group(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 734135 at 1 decimal → "73,413.5"; 113864 at 5 → "1.13864". */
export function formatPrice(units: number, decimals: number): string {
  if (!Number.isSafeInteger(units))
    throw new RangeError(`Not a price: ${units}`);
  const sign = units < 0 ? '−' : '';
  const digits = String(Math.abs(units)).padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = decimals ? `.${digits.slice(-decimals)}` : '';
  return `${sign}${group(whole)}${fraction}`;
}
