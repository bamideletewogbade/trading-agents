'use client';

import { useSyncExternalStore } from 'react';

/**
 * The learner's notes: what they wrote in each lesson's reflect question,
 * kept on this phone only. The server never stores them; it sees the words
 * once, to choose a reply (app/api/reflect). Storage access is always
 * wrapped: a private tab must not break the lesson.
 */

export type Note = { lesson: string; prompt: string; text: string; at: number };

const KEY = 'sika:notes';
const EVENT = 'sika:notes';
const MAX = 200;
/** No upsell for a week after a message that sounded like crisis (rule 9). */
const CARE = 'sika:care-until';
const WEEK = 7 * 24 * 60 * 60 * 1000;

function read(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (n): n is Note =>
            !!n &&
            typeof n.lesson === 'string' &&
            typeof n.prompt === 'string' &&
            typeof n.text === 'string' &&
            typeof n.at === 'number',
        )
      : [];
  } catch {
    return [];
  }
}

let cache: { raw: string; notes: Note[] } = { raw: '', notes: [] };
function snapshot(): Note[] {
  let raw = '';
  try {
    raw = localStorage.getItem(KEY) ?? '';
  } catch {
    // Blocked storage: no notes to show.
  }
  if (raw !== cache.raw) cache = { raw, notes: read() };
  return cache.notes;
}
const NONE: Note[] = [];

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Newest first. */
export function useNotes(): Note[] {
  return useSyncExternalStore(subscribe, snapshot, () => NONE);
}

/** Save an answer; a second answer to the same question replaces the first. */
export function saveNote(note: Omit<Note, 'at'>): void {
  const kept = read().filter(
    (n) => !(n.lesson === note.lesson && n.prompt === note.prompt),
  );
  const next = [{ ...note, at: Date.now() }, ...kept].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the reply still shows, the note just isn't kept.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function markCare(): void {
  try {
    localStorage.setItem(CARE, String(Date.now() + WEEK));
  } catch {
    // Nothing to sell yet anyway; the card itself is what matters.
  }
}

/** For any future upsell: stay quiet while this is true. */
export function inCare(): boolean {
  try {
    return Number(localStorage.getItem(CARE) ?? 0) > Date.now();
  } catch {
    return false;
  }
}
