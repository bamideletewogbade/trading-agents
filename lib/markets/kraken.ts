/**
 * Kraken's public OHLC, read into integer bars.
 *
 * GET https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=240 answers
 * `{ error: [], result: { XXBTZUSD: [[time, open, high, low, close, vwap,
 * volume, count], ...], last } }`, oldest first, up to 720 bars. The last
 * row is the bar still forming, so it is dropped: rules only ever see
 * closed bars.
 *
 * Prices arrive as decimal strings and become integers without passing
 * through a float, so 1.13864 at 5 decimals is exactly 113864. Volume
 * becomes thousandths of a unit.
 *
 * Pure: `pnpm check` runs `parseKraken` on recorded answers.
 */

import { pow10 } from '../core/money.ts';
import type { Bar } from '../engines/candles.ts';

export type TimedBar = Bar & { readonly time: number };

export class MarketDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketDataError';
  }
}

/** "73413.5" at 1 decimal → 734135; rounds half up past `decimals`. */
export function toUnits(text: string, decimals: number): number {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(text).trim());
  if (!match) throw new MarketDataError(`Not a price: ${text}`);
  const fraction = match[2] ?? '';
  const kept = fraction.slice(0, decimals).padEnd(decimals, '0');
  let units = Number(match[1]) * pow10(decimals) + Number(kept || '0');
  if (fraction.length > decimals && Number(fraction[decimals]) >= 5) units += 1;
  if (!Number.isSafeInteger(units))
    throw new MarketDataError(`Price too large: ${text}`);
  return units;
}

export function krakenUrl(pair: string, intervalMinutes: number): string {
  return `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(pair)}&interval=${intervalMinutes}`;
}

export function parseKraken(body: unknown, decimals: number): TimedBar[] {
  if (!body || typeof body !== 'object')
    throw new MarketDataError('Kraken sent something that is not JSON.');
  const { error, result } = body as { error?: unknown; result?: unknown };
  if (Array.isArray(error) && error.length)
    throw new MarketDataError(`Kraken said: ${String(error[0])}`);
  if (!result || typeof result !== 'object')
    throw new MarketDataError('Kraken sent no result.');
  const key = Object.keys(result).find((k) => k !== 'last');
  const rows = key ? (result as Record<string, unknown>)[key] : null;
  if (!Array.isArray(rows) || rows.length < 2)
    throw new MarketDataError('Kraken sent no bars.');
  const bars: TimedBar[] = [];
  for (const row of rows.slice(0, -1)) {
    if (!Array.isArray(row) || row.length < 7)
      throw new MarketDataError('Kraken sent a bar in a shape we do not know.');
    const [time, open, high, low, close, , volume] = row as unknown[];
    const bar = {
      time: Number(time),
      open: toUnits(String(open), decimals),
      high: toUnits(String(high), decimals),
      low: toUnits(String(low), decimals),
      close: toUnits(String(close), decimals),
      volume: toUnits(String(volume), 3),
    };
    if (!Number.isSafeInteger(bar.time))
      throw new MarketDataError('Kraken sent a bar without a time.');
    bars.push(bar);
  }
  return bars;
}
