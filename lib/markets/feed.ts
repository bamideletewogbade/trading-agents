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
import { BAR_MINUTES, MARKETS, type Market } from './catalog';
import {
  MarketDataError,
  krakenUrl,
  parseKraken,
  type TimedBar,
} from './kraken';
import { parseTwelveData, twelveDataUrl } from './twelvedata';

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
