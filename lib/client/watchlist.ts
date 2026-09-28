'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  cleanChoice,
  marketsFor,
  unreadInterests,
} from '@/lib/markets/interests';
import type { Market as Interest } from '@/lib/onboarding/flow';
import { localProfile } from './profile';

/**
 * The markets someone follows on the signals screen. Until they choose, it
 * starts from what they told the coach in onboarding ("crypto" follows
 * Bitcoin, Ether, Solana and XRP); an empty list means every market.
 *
 * Kept on this device for now, and read as an external store so another
 * tab's change shows here too. Every read and write of storage is wrapped:
 * a private tab must not break the feed.
 */

const KEY = 'sika:watch';

type Snapshot = {
  ids: string[];
  /** True when the list came from onboarding rather than a choice made here. */
  suggested: boolean;
  /** Interests from onboarding that no feed covers yet (local and US stocks). */
  unread: Interest[];
};

const listeners = new Set<() => void>();
// Choices made while storage is blocked last for this visit.
let unsaved: string[] | null = null;
let last: { json: string; value: Snapshot } | null = null;

function readSaved(): string[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return unsaved;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? cleanChoice(parsed) : unsaved;
  } catch {
    return unsaved;
  }
}

/** The same object until something changes: React compares snapshots by reference. */
function snapshot(): Snapshot {
  const interests = localProfile()?.markets ?? [];
  const saved = readSaved();
  const fromOnboarding = marketsFor(interests);
  const value: Snapshot = saved
    ? { ids: saved, suggested: false, unread: unreadInterests(interests) }
    : {
        ids: fromOnboarding,
        suggested: fromOnboarding.length > 0,
        unread: unreadInterests(interests),
      };
  const json = JSON.stringify(value);
  if (last?.json !== json) last = { json, value };
  return last.value;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export type Watchlist = {
  /** Null until the device has been read, so the first paint doesn't flash every market. */
  ids: string[] | null;
  suggested: boolean;
  unread: Interest[];
  set: (ids: readonly string[]) => void;
};

export function useWatchlist(): Watchlist {
  const current = useSyncExternalStore(subscribe, snapshot, () => null);

  const set = useCallback((next: readonly string[]) => {
    const clean = cleanChoice(next);
    unsaved = clean;
    try {
      localStorage.setItem(KEY, JSON.stringify(clean));
    } catch {
      // Storage blocked: `unsaved` keeps it for this visit.
    }
    for (const listener of listeners) listener();
  }, []);

  return {
    ids: current?.ids ?? null,
    suggested: current?.suggested ?? false,
    unread: current?.unread ?? [],
    set,
  };
}
