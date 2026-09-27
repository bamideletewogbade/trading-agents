import { getDb } from '@/db';
import { ApiError, json, readJson, route } from '@/lib/api';
import { capabilities } from '@/lib/capabilities';
import { newId } from '@/lib/core/ids';
import {
  FEELINGS,
  SETUPS,
  type Feeling,
  type JournalSetup,
} from '@/lib/engines/journal';
import {
  PAPER,
  PaperError,
  accountOf,
  closeOrder,
  fillOrder,
  replay,
  type PaperEvent,
  type Quote,
  type WatchBar,
} from '@/lib/engines/paper';
import { learnerOf } from '@/lib/learning/account';
import { learnerCookie } from '@/lib/learning/store';
import { marketById, type Market } from '@/lib/markets/catalog';
import { paperMarkets, quoteFor, watchBarsFor } from '@/lib/markets/feed';
import { toUnits } from '@/lib/markets/kraken';
import { missingFrom, unionById } from '@/lib/sync/log';
import { parseLog } from '@/lib/sync/schemas';
import { appendLog, readLog } from '@/lib/sync/store';

/**
 * The paper account (lib/engines/paper.ts). The server is the price source
 * and the referee: it fills orders at the real bid and ask, sizes them
 * from its own copy of the account, closes positions at the price of the
 * moment, and works out which stops and targets the bars have hit. Nothing
 * a browser sends sets a price or a size.
 *
 * Every call carries the device's log, and the answer carries back any
 * events the device lacks, so a guest without a database keeps a working
 * account on the device, and a signed-in learner's devices converge. With a
 * database, the log is also kept with the learner (lib/sync/store.ts).
 *
 * POST { action: 'state' | 'open' | 'close' | 'reset', events, … }
 */

type Body = {
  action?: unknown;
  events?: unknown;
  order?: {
    market?: unknown;
    side?: unknown;
    stop?: unknown;
    target?: unknown;
    riskBp?: unknown;
    setup?: unknown;
    feeling?: unknown;
    signal?: unknown;
  };
  position?: unknown;
};

function paperMarket(id: unknown): Market {
  const market = typeof id === 'string' ? marketById(id) : undefined;
  if (!market || !paperMarkets().some((m) => m.id === market.id))
    throw new ApiError(422, 'The paper account can’t trade that market.');
  return market;
}

/** A typed price, like "84,025.5", at the market's decimals. */
function priceOf(text: unknown, market: Market): number | null {
  if (text === null || text === undefined || text === '') return null;
  if (typeof text !== 'string' && typeof text !== 'number')
    throw new ApiError(422, 'Prices are digits and a dot, like 84025.5.');
  const cleaned = String(text).replace(/[,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned))
    throw new ApiError(422, 'Prices are digits and a dot, like 84025.5.');
  const units = toUnits(cleaned, market.decimals);
  if (units <= 0) throw new ApiError(422, 'Prices are above zero.');
  return units;
}

async function marketState(events: readonly PaperEvent[]) {
  const open = replay(events).open;
  const ids = [...new Set(open.map((p) => p.market))];
  const bars: Record<string, WatchBar[]> = {};
  const marks: Record<string, number> = {};
  await Promise.all(
    ids.map(async (id) => {
      const market = marketById(id);
      if (!market) return;
      // A market whose data is down keeps its positions as they were:
      // no exits worked out, marked at the entry.
      try {
        bars[id] = await watchBarsFor(market);
      } catch (error) {
        console.error('[paper] bars', id, error);
      }
      try {
        marks[id] = (await quoteFor(market)).last;
      } catch (error) {
        console.error('[paper] quote', id, error);
      }
    }),
  );
  return { bars, marks };
}

export const POST = route(
  async (request) => {
    const body = (await readJson(request, 512 * 1024)) as Body;
    const device = parseLog('paper', body.events).events as PaperEvent[];
    const db = capabilities().database ? await getDb() : null;
    const who = db ? await learnerOf(db, request) : null;
    const stored =
      db && who ? await readLog<PaperEvent>(db, who.id, 'paper') : [];
    // The server's copy first: its fills keep their `origin: 'server'`.
    const all = unionById(stored, device);
    const now = Date.now();
    const { bars, marks } = await marketState(all);
    const { account, exits } = accountOf(all, bars, marks, now);
    const added: PaperEvent[] = [...exits];
    let extra: Record<string, unknown> = {};

    try {
      if (body.action === 'open') {
        const order = body.order ?? {};
        const market = paperMarket(order.market);
        const side = order.side === 'sell' ? 'sell' : 'buy';
        const stop = priceOf(order.stop, market);
        if (stop === null)
          throw new ApiError(422, 'Every paper trade needs a stop.');
        let quote: Quote;
        try {
          quote = await quoteFor(market);
        } catch {
          throw new ApiError(
            503,
            'No live price for that market right now. Try again in a minute.',
          );
        }
        const { event, trimmed } = fillOrder(
          account,
          {
            market: market.id,
            symbol: market.symbol,
            decimals: market.decimals,
            side,
            stop,
            target: priceOf(order.target, market),
            riskBp:
              typeof order.riskBp === 'number'
                ? Math.round(order.riskBp)
                : PAPER.riskBp.usual,
            feeBp: market.feeBp,
            setup: (SETUPS as readonly unknown[]).includes(order.setup)
              ? (order.setup as JournalSetup)
              : 'other',
            feeling: (FEELINGS as readonly unknown[]).includes(order.feeling)
              ? (order.feeling as Feeling)
              : 'calm',
            signal: order.signal === true,
          },
          quote,
          newId(),
          now,
        );
        added.push(event);
        extra = { filled: event, trimmed };
      } else if (body.action === 'close') {
        const position = account.open.find((p) => p.id === body.position);
        if (!position) {
          // Already closed, perhaps by its stop in a bar just seen: say so,
          // and still keep the exits worked out on the way.
          extra = { notice: 'That position had already closed.' };
        }
        if (position) {
          const market = paperMarket(position.market);
          let quote: Quote;
          try {
            quote = await quoteFor(market);
          } catch {
            throw new ApiError(
              503,
              'No live price for that market right now. Try again in a minute.',
            );
          }
          added.push(closeOrder(account, position.id, quote, now));
        }
      } else if (body.action === 'reset') {
        added.push({
          kind: 'reset',
          id: newId(),
          at: now,
          startMinor: PAPER.startMinor,
        });
      } else if (body.action !== 'state') {
        throw new ApiError(400, 'Unknown action.');
      }
    } catch (error) {
      if (error instanceof PaperError)
        throw new ApiError(
          error.code === 'not-open' ? 409 : 422,
          error.message,
        );
      throw error;
    }

    if (db && who) await appendLog(db, who.id, 'paper', added);
    const everything = unionById(all, added);
    // A first visit gets its learner cookie here, as everywhere, so the
    // next call finds the same log.
    const cookie = who?.device.fresh
      ? {
          'Set-Cookie': learnerCookie(
            who.device.id,
            new URL(request.url).protocol === 'https:',
          ),
        }
      : undefined;
    return json(
      {
        account: replay(everything, marks),
        events: missingFrom(device, everything),
        stored: Boolean(db),
        signedIn: Boolean(who?.signedIn),
        ...extra,
      },
      200,
      cookie,
    );
  },
  { maxBytes: 512 * 1024 },
);

/** A quote for the order ticket: what a fill would cost now. The order itself refills. */
export const GET = route(async (request) => {
  const market = paperMarket(new URL(request.url).searchParams.get('market'));
  try {
    const quote = await quoteFor(market);
    return json(
      {
        market: market.id,
        decimals: market.decimals,
        feeBp: market.feeBp,
        ...quote,
      },
      200,
      { 'Cache-Control': 'private, max-age=10' },
    );
  } catch {
    throw new ApiError(503, 'No live price for that market right now.');
  }
});
