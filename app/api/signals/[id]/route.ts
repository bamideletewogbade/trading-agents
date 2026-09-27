import { ApiError, json, route } from '@/lib/api';
import { WARMUP } from '@/lib/engines/signals';
import { marketById } from '@/lib/markets/catalog';
import { activeMarkets, readOne } from '@/lib/markets/feed';
import { detailOf } from '@/lib/markets/view';

/**
 * One market in full: the reading, every signal the rules played with its
 * dates and result, the record's curve, and the last bars for the chart.
 */
export const GET = route(async (request) => {
  const id = new URL(request.url).pathname.split('/').pop() ?? '';
  const market = marketById(id);
  if (!market || !activeMarkets().some((m) => m.id === market.id))
    throw new ApiError(404, 'We don’t read that market.');
  try {
    const read = await readOne(market);
    return json(detailOf(market, read.bars, read.reading, WARMUP), 200, {
      'Cache-Control': 'public, max-age=120',
    });
  } catch (error) {
    console.error('[markets]', market.id, error);
    throw new ApiError(503, 'Market data is unavailable right now.');
  }
});
