'use client';

import { useSyncExternalStore } from 'react';
import { newId } from '@/lib/core/ids';
import {
  FEELINGS,
  MAX_DECIMALS,
  SETUPS,
  SOURCES,
  problemOf,
  type JournalTrade,
} from '@/lib/engines/journal';

/**
 * The journal, kept on this device (docs/member-app-plan.md §5) until
 * accounts sync it. Every read checks each trade's shape, so a hand-edited
 * or half-written entry is dropped rather than breaking the screen, and
 * storage access is always wrapped: a private tab still works, it just
 * forgets.
 */

const KEY = 'sika:journal';
const EVENT = 'sika:journal';
const MAX = 1000;

function isTrade(t: unknown): t is JournalTrade {
  if (!t || typeof t !== 'object') return false;
  const x = t as Record<string, unknown>;
  const price = (v: unknown) => Number.isSafeInteger(v) && (v as number) > 0;
  const priceOrNull = (v: unknown) => v === null || price(v);
  return (
    typeof x.id === 'string' &&
    typeof x.market === 'string' &&
    (x.side === 'buy' || x.side === 'sell') &&
    Number.isSafeInteger(x.decimals) &&
    (x.decimals as number) >= 0 &&
    (x.decimals as number) <= MAX_DECIMALS &&
    price(x.entry) &&
    price(x.stop) &&
    priceOrNull(x.target) &&
    priceOrNull(x.exit) &&
    (SETUPS as readonly unknown[]).includes(x.setup) &&
    (FEELINGS as readonly unknown[]).includes(x.feeling) &&
    (SOURCES as readonly unknown[]).includes(x.source) &&
    typeof x.openedAt === 'number' &&
    (x.closedAt === null || typeof x.closedAt === 'number') &&
    typeof x.note === 'string' &&
    problemOf(t as JournalTrade) === null
  );
}

function read(): JournalTrade[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter(isTrade) : [];
  } catch {
    return [];
  }
}

let cache: { raw: string; trades: JournalTrade[] } = { raw: '', trades: [] };
function snapshot(): JournalTrade[] {
  let raw = '';
  try {
    raw = localStorage.getItem(KEY) ?? '';
  } catch {
    // Blocked storage: an empty journal.
  }
  if (raw !== cache.raw) cache = { raw, trades: read() };
  return cache.trades;
}
const NONE: JournalTrade[] = [];

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Newest first. */
export function useJournal(): JournalTrade[] {
  return useSyncExternalStore(subscribe, snapshot, () => NONE);
}

function write(trades: JournalTrade[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(trades.slice(0, MAX)));
  } catch {
    // Storage blocked or full: nothing more we can do on this device.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function saveTrade(trade: JournalTrade): void {
  write([trade, ...read().filter((t) => t.id !== trade.id)]);
}

export function removeTrade(id: string): void {
  write(read().filter((t) => t.id !== id));
}

export { newId as newTradeId };
