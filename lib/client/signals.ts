'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Detail, Summary, Unavailable } from '@/lib/markets/view';

/**
 * Signals from the server (app/api/signals), kept for two minutes on the
 * page so the desk and the signals screen share one request. A daily bar
 * changes once a day; there is nothing to gain from asking more often.
 */

const KEEP_MS = 2 * 60 * 1000;
const kept = new Map<string, { at: number; promise: Promise<unknown> }>();

function load<T>(url: string, fresh = false): Promise<T> {
  const hit = kept.get(url);
  if (!fresh && hit && Date.now() - hit.at < KEEP_MS)
    return hit.promise as Promise<T>;
  const promise = fetch(url, { headers: { accept: 'application/json' } }).then(
    async (response) => {
      if (!response.ok) throw new Error(String(response.status));
      return (await response.json()) as T;
    },
  );
  kept.set(url, { at: Date.now(), promise });
  // A failure is not worth keeping: the next visit asks again.
  promise.catch(() => kept.delete(url));
  return promise;
}

export type Loaded<T> =
  | { state: 'loading' }
  | { state: 'error'; status: string }
  | { state: 'ready'; data: T };

function useLoad<T>(url: string): Loaded<T> & { retry: () => void } {
  const [result, setResult] = useState<Loaded<T>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    load<T>(url, attempt > 0).then(
      (data) => live && setResult({ state: 'ready', data }),
      (error: Error) =>
        live && setResult({ state: 'error', status: error.message }),
    );
    return () => {
      live = false;
    };
  }, [url, attempt]);
  const retry = useCallback(() => {
    setResult({ state: 'loading' });
    setAttempt((n) => n + 1);
  }, []);
  return { ...result, retry };
}

export function useSignals() {
  return useLoad<{ markets: Summary[]; unavailable: Unavailable[] }>(
    '/api/signals',
  );
}

export function useMarket(id: string) {
  return useLoad<Detail>(`/api/signals/${encodeURIComponent(id)}`);
}
