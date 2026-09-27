import { json, route } from '@/lib/api';
import { readAll } from '@/lib/markets/feed';
import {
  byUrgency,
  infoOf,
  summaryOf,
  type Summary,
  type Unavailable,
} from '@/lib/markets/view';

/**
 * Every market's reading at the last daily close: the signal if there is
 * one, what the rules are watching if not, and each market's record. The
 * same for everyone, so it may be cached for a few minutes on the way.
 */
export const GET = route(async () => {
  const reads = await readAll();
  const markets: Summary[] = [];
  const unavailable: Unavailable[] = [];
  for (const read of reads) {
    if (read.ok) markets.push(summaryOf(read.market, read.bars, read.reading));
    else unavailable.push({ market: infoOf(read.market), unavailable: true });
  }
  markets.sort(byUrgency);
  return json({ markets, unavailable }, 200, {
    'Cache-Control': 'public, max-age=120',
  });
});
