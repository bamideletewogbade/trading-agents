/**
 * Bars for the markets, fetched on the server and kept for a while.
 *
 * A daily bar changes once a day, so each market's bars are kept for 15
 * minutes in this isolate, and Cloudflare keeps the upstream answer at the
 * edge for as long (`cf.cacheTtl`), so a busy hour costs each source a
 * handful of requests. When a source fails, the last bars we had are served
 * rather than nothing, and with nothing at all the market says it is
 * unavailable: signals are never drawn from made-up prices.
 *
 * Server only: it reads the environment and the network.
 */

import { readMarket, type Reading } from '@/lib/engines/signals';
import type { Quote, WatchBar } from '@/lib/engines/paper';
import { BAR_MINUTES, MARKETS, WATCH_MINUTES, type Market } from './catalog';
import {
  MarketDataError,
  krakenTickerUrl,
  krakenUrl,
  parseKraken,
  parseKrakenTicker,
  type TimedBar,
} from './kraken';
import {
  parseTwelveData,
  parseTwelveDataPrice,
  twelveDataPriceUrl,
  twelveDataUrl,
} from './twelvedata';

const KEEP_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; bars: TimedBar[] }>();

function twelveDataKey(): string | null {
  return process.env.TWELVEDATA_API_KEY?.trim() || null;
}

/** The markets this deployment can read: FX only with a Twelve Data key. */
export function activeMarkets(): Market[] {
  const fx = twelveDataKey() !== null;
  return MARKETS.filter((m) => m.source === 'kraken' || fx);
}

async function fetchBars(market: Market): Promise<TimedBar[]> {
  const key = twelveDataKey();
  const url =
    market.source === 'kraken'
      ? krakenUrl(market.ticker, BAR_MINUTES)
      : twelveDataUrl(market.ticker, key ?? '');
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'SikaLab/1.0' },
    signal: AbortSignal.timeout(8_000),
    cf: { cacheTtl: KEEP_MS / 1000, cacheEverything: true },
  } as RequestInit);
  if (!response.ok)
    throw new MarketDataError(`${market.source} answered ${response.status}`);
  const body: unknown = await response.json();
  return market.source === 'kraken'
    ? parseKraken(body, market.decimals)
    : parseTwelveData(body, market.decimals, Math.floor(Date.now() / 1000));
}

export async function barsFor(market: Market): Promise<TimedBar[]> {
  const kept = cache.get(market.id);
  if (kept && Date.now() - kept.at < KEEP_MS) return kept.bars;
  try {
    const bars = await fetchBars(market);
    cache.set(market.id, { at: Date.now(), bars });
    return bars;
  } catch (error) {
    if (kept) return kept.bars;
    throw error;
  }
}

export type MarketRead = {
  market: Market;
  bars: TimedBar[];
  reading: Reading;
};

export async function readOne(market: Market): Promise<MarketRead> {
  const bars = await barsFor(market);
  return {
    market,
    bars,
    reading: readMarket(bars, {
      costBp: market.costBp,
      barsPerDay: 1,
      barsPerWeek: market.weekBars,
    }),
  };
}

/** Every active market, each read on its own so one failure can't hide the rest. */
export async function readAll(): Promise<
  (({ ok: true } & MarketRead) | { ok: false; market: Market })[]
> {
  return Promise.all(
    activeMarkets().map(async (market) => {
      try {
        return { ok: true as const, ...(await readOne(market)) };
      } catch (error) {
        console.error('[markets]', market.id, error);
        return { ok: false as const, market };
      }
    }),
  );
}

/* ── For the paper account: quotes, and bars to watch stops with ─────── */

const QUOTE_MS = 15 * 1000;
const WATCH_MS = 2 * 60 * 1000;
const quotes = new Map<string, { at: number; quote: Quote }>();
const watched = new Map<string, { at: number; bars: TimedBar[] }>();

async function getJson(url: string, keepSeconds: number): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'SikaLab/1.0' },
    signal: AbortSignal.timeout(8_000),
    cf: { cacheTtl: keepSeconds, cacheEverything: true },
  } as RequestInit);
  if (!response.ok) throw new MarketDataError(`answered ${response.status}`);
  return (await response.json()) as unknown;
}

/**
 * The price to trade at now: Kraken's real bid and ask for crypto and gold.
 * Twelve Data's free price has no spread, so FX gets the market's usual
 * spread either side of it.
 */
export async function quoteFor(market: Market): Promise<Quote> {
  const kept = quotes.get(market.id);
  if (kept && Date.now() - kept.at < QUOTE_MS) return kept.quote;
  let quote: Quote;
  if (market.source === 'kraken') {
    const q = parseKrakenTicker(
      await getJson(krakenTickerUrl(market.ticker), 10),
      market.decimals,
    );
    quote = { ...q, at: Date.now() };
  } else {
    const mid = parseTwelveDataPrice(
      await getJson(
        twelveDataPriceUrl(market.ticker, twelveDataKey() ?? ''),
        10,
      ),
      market.decimals,
    );
    const half = Math.max(1, Math.round((mid * market.costBp) / 20_000));
    quote = { bid: mid - half, ask: mid + half, last: mid, at: Date.now() };
  }
  quotes.set(market.id, { at: Date.now(), quote });
  return quote;
}

async function hourlyBars(market: Market): Promise<TimedBar[]> {
  const kept = watched.get(market.id);
  if (kept && Date.now() - kept.at < WATCH_MS) return kept.bars;
  try {
    const bars =
      market.source === 'kraken'
        ? parseKraken(
            await getJson(krakenUrl(market.ticker, WATCH_MINUTES), 60),
            market.decimals,
          )
        : parseTwelveData(
            await getJson(
              twelveDataUrl(market.ticker, twelveDataKey() ?? '', '1h'),
              60,
            ),
            market.decimals,
            Math.floor(Date.now() / 1000),
            WATCH_MINUTES * 60,
          );
    watched.set(market.id, { at: Date.now(), bars });
    return bars;
  } catch (error) {
    if (kept) return kept.bars;
    throw error;
  }
}

/**
 * Closed bars to check a position's stop and target against, in ms: the
 * last month hour by hour, and before that, day by day, so a position left
 * alone for longer is still watched.
 */
export async function watchBarsFor(market: Market): Promise<WatchBar[]> {
  const [hours, days] = await Promise.all([
    hourlyBars(market),
    barsFor(market).catch(() => [] as TimedBar[]),
  ]);
  const hourMs = WATCH_MINUTES * 60 * 1000;
  const dayMs = BAR_MINUTES * 60 * 1000;
  const firstHour = hours[0] ? hours[0].time * 1000 : Infinity;
  const toWatch = (bar: TimedBar, length: number): WatchBar => ({
    start: bar.time * 1000,
    end: bar.time * 1000 + length,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  });
  return [
    ...days
      .map((bar) => toWatch(bar, dayMs))
      .filter((bar) => bar.end <= firstHour),
    ...hours.map((bar) => toWatch(bar, hourMs)),
  ];
}

export function paperMarkets(): Market[] {
  return activeMarkets().filter((m) => m.paper);
}
