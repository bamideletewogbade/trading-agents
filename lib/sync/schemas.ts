/**
 * The shapes a device may send for the journal and the paper account, and
 * the only ones the server will store (app/api/sync). Everything is checked:
 * ids are UUIDs, times are plausible, prices are whole and positive, and a
 * trade's stop and target sit on the right sides. A paper fill that arrives
 * from a device is marked as the device's, never the server's: only fills
 * the server made itself (app/api/paper) carry `origin: 'server'`.
 */

import { z } from 'zod';
import {
  FEELINGS,
  MAX_DECIMALS,
  SETUPS,
  SOURCES,
  problemOf,
  type JournalEvent,
} from '../engines/journal.ts';
import { PAPER, type PaperEvent } from '../engines/paper.ts';

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuid = z.string().regex(UUID);
/** From the start of 2025 until a day from now: anything else is a broken clock. */
const time = z
  .number()
  .int()
  .min(Date.UTC(2025, 0, 1))
  .refine((at) => at <= Date.now() + 86_400_000, 'from the future');
const price = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const trade = z
  .object({
    id: uuid,
    market: z.string().trim().min(1).max(40),
    side: z.enum(['buy', 'sell']),
    decimals: z.number().int().min(0).max(MAX_DECIMALS),
    entry: price,
    stop: price,
    target: price.nullable(),
    exit: price.nullable(),
    setup: z.enum(SETUPS),
    feeling: z.enum(FEELINGS),
    source: z.enum(SOURCES),
    openedAt: time,
    closedAt: time.nullable(),
    note: z.string().max(500),
  })
  .strict()
  .refine((t) => problemOf(t) === null, 'stop or target on the wrong side');

export const journalEvent = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saved'), id: uuid, at: time, trade }).strict(),
  z
    .object({ kind: z.literal('removed'), id: uuid, at: time, trade: uuid })
    .strict(),
]);

const paperOpen = z
  .object({
    kind: z.literal('open'),
    id: uuid,
    at: time,
    market: z.string().regex(/^[a-z]{2,12}$/),
    symbol: z.string().min(3).max(12),
    decimals: z.number().int().min(0).max(MAX_DECIMALS),
    side: z.enum(['buy', 'sell']),
    quantity: z.number().int().positive(),
    price,
    feeBp: z.number().int().min(0).max(100),
    feeMinor: z.number().int().min(0),
    stop: price,
    target: price.nullable(),
    riskBp: z.number().int().min(PAPER.riskBp.least).max(PAPER.riskBp.most),
    setup: z.enum(SETUPS),
    feeling: z.enum(FEELINGS),
    signal: z.boolean(),
    origin: z.enum(['server', 'device']),
  })
  .strict()
  .refine(
    (e) => (e.side === 'buy' ? e.stop < e.price : e.stop > e.price),
    'stop on the wrong side',
  );

const paperClose = z
  .object({
    kind: z.literal('close'),
    id: uuid,
    at: time,
    position: uuid,
    price,
    feeMinor: z.number().int().min(0),
    why: z.enum(['manual', 'stop', 'target']),
    origin: z.enum(['server', 'device']),
  })
  .strict();

const paperReset = z
  .object({
    kind: z.literal('reset'),
    id: uuid,
    at: time,
    startMinor: z.literal(PAPER.startMinor),
  })
  .strict();

export const paperEvent = z.union([paperOpen, paperClose, paperReset]);

export type LogName = 'journal' | 'paper';

/** Parse what a device sent: the valid events, and a count of the rest. */
export function parseLog(
  name: LogName,
  input: unknown,
): { events: (JournalEvent | PaperEvent)[]; refused: number } {
  const list = Array.isArray(input) ? input.slice(0, 500) : [];
  const events: (JournalEvent | PaperEvent)[] = [];
  let refused = Array.isArray(input) ? Math.max(0, input.length - 500) : 0;
  for (const item of list) {
    const parsed =
      name === 'journal'
        ? journalEvent.safeParse(item)
        : paperEvent.safeParse(item);
    if (!parsed.success) {
      refused += 1;
      continue;
    }
    const event = parsed.data as JournalEvent | PaperEvent;
    // A fill from a device is the device's word, not the server's.
    events.push('origin' in event ? { ...event, origin: 'device' } : event);
  }
  return { events, refused };
}
