'use client';

import { useSyncExternalStore } from 'react';

/**
 * A short buzz when a learner answers, on phones that can (most Android
 * browsers; iPhones ignore it). Off with one switch on the Me screen, kept
 * on the phone. It never carries meaning on its own: the words on screen
 * say right or wrong.
 */

const KEY = 'sika:buzz';
const EVENT = 'sika:feel';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setBuzz(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Blocked storage: the default stands.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useBuzzSetting(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}

const PATTERNS = {
  right: 14,
  wrong: [30, 60, 30],
  done: [20, 40, 20, 40, 60],
} as const;

export function buzz(kind: keyof typeof PATTERNS): void {
  if (!read()) return;
  try {
    navigator.vibrate?.(PATTERNS[kind] as number | number[]);
  } catch {
    // No vibration here: nothing to do.
  }
}
