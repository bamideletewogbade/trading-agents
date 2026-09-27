/**
 * Twelve Data's time series, read into integer bars, for FX.
 *
 * GET https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=1day
 * &outputsize=720&apikey=… answers `{ meta, values: [{ datetime, open,
 * high, low, close, volume? }] }`, newest first, or `{ code, message }` on
 * an error. The newest bar may still be forming, so any bar whose day has
 * not ended by `now` is dropped. FX carries no volume, so it reads as 0,
 * and the breakout rule, which needs volume, never fires on it.
 *
 * Pure: `pnpm check` runs `parseTwelveData` on recorded answers.
 */

import { MarketDataError, toUnits, type TimedBar } from './kraken.ts';

export function twelveDataUrl(
  symbol: string,
  key: string,
  interval: '1day' | '1h' = '1day',
): string {
  return `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=720&timezone=UTC&apikey=${encodeURIComponent(key)}`;
}

export function twelveDataPriceUrl(symbol: string, key: string): string {
  return `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
}

/** `{ price: "1.13912" }`, as an integer price. */
export function parseTwelveDataPrice(body: unknown, decimals: number): number {
  const price = (body ?? {}) as { price?: unknown; message?: unknown };
  if (typeof price.price !== 'string' && typeof price.price !== 'number')
    throw new MarketDataError(
      `Twelve Data said: ${typeof price.message === 'string' ? price.message : 'no price'}`,
    );
  return toUnits(String(price.price), decimals);
}

const DAY_SECONDS = 86_400;

/** A field as text: Twelve Data sends strings, but a number is fine too. */
function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

export function parseTwelveData(
  body: unknown,
  decimals: number,
  nowSeconds: number,
  barSeconds = DAY_SECONDS,
): TimedBar[] {
  if (!body || typeof body !== 'object')
    throw new MarketDataError('Twelve Data sent something that is not JSON.');
  const { values, code, message } = body as {
    values?: unknown;
    code?: unknown;
    message?: unknown;
  };
  if (code !== undefined && !Array.isArray(values))
    throw new MarketDataError(
      `Twelve Data said: ${text(message) || text(code) || 'an error'}`,
    );
  if (!Array.isArray(values) || values.length < 2)
    throw new MarketDataError('Twelve Data sent no bars.');
  const bars: TimedBar[] = [];
  for (const row of values) {
    const { datetime, open, high, low, close, volume } = (row ?? {}) as Record<
      string,
      unknown
    >;
    // "2026-09-26" for a day, "2026-09-26 14:00:00" for an hour; both UTC.
    const stamp = text(datetime);
    const time =
      Date.parse(
        stamp.length > 10
          ? `${stamp.replace(' ', 'T')}Z`
          : `${stamp}T00:00:00Z`,
      ) / 1000;
    if (!Number.isSafeInteger(time))
      throw new MarketDataError('Twelve Data sent a bar without a date.');
    if (time + barSeconds > nowSeconds) continue;
    bars.push({
      time,
      open: toUnits(text(open), decimals),
      high: toUnits(text(high), decimals),
      low: toUnits(text(low), decimals),
      close: toUnits(text(close), decimals),
      volume: volume === undefined ? 0 : toUnits(text(volume), 3),
    });
  }
  bars.sort((a, b) => a.time - b.time);
  return bars;
}
