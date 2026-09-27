'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { PaperAccount, PaperEvent } from '@/lib/engines/paper';
import { appendLocal, readLocal, syncLog, useLocalLog } from './sync';
import { sessionHeaders } from './session';

/**
 * The paper account on this device. The log lives here (lib/client/sync.ts)
 * and follows the account when there is one; the account itself (cash,
 * positions, exits) always comes from the server (app/api/paper), which is
 * the price source and the referee. Every call sends this device's log and
 * keeps whatever the server sends back, so the two never drift.
 */

export type PaperState =
  | { state: 'idle' | 'loading' }
  | { state: 'error'; message: string }
  | {
      state: 'ready';
      account: PaperAccount;
      stored: boolean;
      signedIn: boolean;
      at: number;
    };

let current: PaperState = { state: 'idle' };
const listeners = new Set<() => void>();
function set(next: PaperState): void {
  current = next;
  for (const listen of listeners) listen();
}
function subscribe(listen: () => void): () => void {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

export type PaperAnswer = {
  account: PaperAccount;
  events: PaperEvent[];
  stored: boolean;
  signedIn?: boolean;
  filled?: PaperEvent;
  trimmed?: boolean;
  notice?: string;
};

async function call(body: Record<string, unknown>): Promise<PaperAnswer> {
  const response = await fetch('/api/paper', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(await sessionHeaders()),
    },
    body: JSON.stringify({ ...body, events: readLocal<PaperEvent>('paper') }),
    signal: AbortSignal.timeout(15_000),
  });
  const answer = (await response.json().catch(() => ({}))) as PaperAnswer & {
    detail?: string;
  };
  if (!response.ok)
    throw new Error(
      answer.detail ?? 'The paper account didn’t answer. Try again.',
    );
  appendLocal('paper', answer.events ?? []);
  set({
    state: 'ready',
    account: answer.account,
    stored: answer.stored,
    signedIn: Boolean(answer.signedIn),
    at: Date.now(),
  });
  return answer;
}

/** Ask the server for the account as it stands now. */
export async function refreshPaper(): Promise<void> {
  if (current.state !== 'ready') set({ state: 'loading' });
  try {
    await syncLog('paper');
    await call({ action: 'state' });
  } catch (error) {
    if (current.state !== 'ready')
      set({ state: 'error', message: (error as Error).message });
  }
}

export type PaperOrder = {
  market: string;
  side: 'buy' | 'sell';
  stop: string;
  target: string;
  riskBp: number;
  setup: string;
  feeling: string;
  signal: boolean;
};

export function placeOrder(order: PaperOrder): Promise<PaperAnswer> {
  return call({ action: 'open', order });
}

export function closePosition(position: string): Promise<PaperAnswer> {
  return call({ action: 'close', position });
}

export function resetPaper(): Promise<PaperAnswer> {
  return call({ action: 'reset' });
}

const IDLE: PaperState = { state: 'idle' };

/**
 * The account, shared by every screen that shows it. Opening one refreshes
 * it once a minute at most, and whenever this device's log grows.
 */
export function usePaper(): PaperState & { events: number } {
  const state = useSyncExternalStore(
    subscribe,
    () => current,
    () => IDLE,
  );
  const events = useLocalLog<PaperEvent>('paper');
  useEffect(() => {
    if (current.state === 'ready' && Date.now() - current.at < 60_000) return;
    void refreshPaper();
  }, []);
  return { ...state, events: events.length };
}

export type Quote = {
  market: string;
  decimals: number;
  feeBp: number;
  bid: number;
  ask: number;
  last: number;
  at: number;
};

export async function fetchQuote(market: string): Promise<Quote> {
  const response = await fetch(
    `/api/paper?market=${encodeURIComponent(market)}`,
    {
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as Quote;
}
