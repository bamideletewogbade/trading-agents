'use client';

import { useEffect, useMemo } from 'react';
import { newId } from '@/lib/core/ids';
import {
  journalFrom,
  type JournalEvent,
  type JournalTrade,
} from '@/lib/engines/journal';
import { appendLocal, syncLog, useLocalLog } from './sync';

/**
 * The journal, as a log that follows the learner (lib/client/sync.ts):
 * saving a trade, or removing one, adds an event; the trades are what the
 * events add up to (lib/engines/journal.ts). On this device first, then on
 * the account when there is one.
 *
 * The first version kept a plain list of trades under `sika:journal`; it's
 * turned into events once, the first time this runs, and then removed.
 */

const OLD = 'sika:journal';

function moveOldList(): void {
  try {
    const raw = localStorage.getItem(OLD);
    if (!raw) return;
    const trades = JSON.parse(raw) as unknown;
    if (Array.isArray(trades)) {
      const events: JournalEvent[] = trades
        .filter(
          (t): t is JournalTrade =>
            !!t && typeof (t as JournalTrade).id === 'string',
        )
        .map((trade) => ({
          kind: 'saved',
          id: newId(),
          at: trade.closedAt ?? trade.openedAt,
          trade,
        }));
      appendLocal('journal', events);
    }
    localStorage.removeItem(OLD);
  } catch {
    // Nothing to move, or storage blocked.
  }
}

/** The trades, newest first; opening it also brings the account's copy in. */
export function useJournal(): JournalTrade[] {
  useEffect(() => {
    moveOldList();
    void syncLog('journal');
  }, []);
  const events = useLocalLog<JournalEvent>('journal');
  return useMemo(() => journalFrom(events), [events]);
}

export function saveTrade(trade: JournalTrade): void {
  appendLocal<JournalEvent>('journal', [
    { kind: 'saved', id: newId(), at: Date.now(), trade },
  ]);
  void syncLog('journal', true);
}

export function removeTrade(id: string): void {
  appendLocal<JournalEvent>('journal', [
    { kind: 'removed', id: newId(), at: Date.now(), trade: id },
  ]);
  void syncLog('journal', true);
}

export { newId as newTradeId };
