'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LESSONS, TOPICS, type Topic } from '@/content/curriculum';
import { LIBRARY } from '@/content/member';
import { searchLessons } from '@/lib/curriculum/search';
import { useCompleted } from '@/lib/client/progress';

/**
 * Every lesson on its own, for people who already trade and want one
 * thing: search in their own words, or filter by topic. Playable lessons
 * first; done ones keep a tick.
 */
export function Library() {
  const completed = useCompleted();
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [query, setQuery] = useState('');
  const matches = query.trim()
    ? searchLessons(query, 12).map((m) => m.lesson)
    : null;
  const shown = (
    matches ?? LESSONS.filter((item) => topic === 'all' || item.topic === topic)
  ).sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live'));
  return (
    <div className="mx-auto max-w-[640px] px-4 pt-5">
      <h1 className="type-title text-fg">{LIBRARY.title}</h1>
      <p className="mt-1 type-small text-fg-2">{LIBRARY.lead}</p>
      <label className="mt-4 block">
        <span className="sr-only">{LIBRARY.search}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={LIBRARY.placeholder}
          className="min-h-12 w-full rounded-md border border-edge bg-raised px-4 type-body text-fg placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </label>
      {matches ? null : (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {(['all', ...Object.keys(TOPICS)] as (Topic | 'all')[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={topic === key}
              onClick={() => setTopic(key)}
              className={`min-h-10 shrink-0 rounded-full border px-3 type-small ${topic === key ? 'border-gold bg-gold-soft text-gold' : 'border-edge text-fg-2'}`}
            >
              {key === 'all' ? LIBRARY.all : TOPICS[key].label}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="mt-6 type-small text-fg-2">{LIBRARY.none}</p>
      ) : null}
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
        {shown.map((item) => {
          const done = completed.includes(item.id);
          const live = item.status === 'live' && item.playAt;
          const body = (
            <>
              <span
                aria-hidden
                className={`coin grid size-10 shrink-0 place-items-center text-sm font-bold ${done ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]' : live ? 'text-fg-2' : 'text-muted opacity-60'}`}
              >
                {done ? '✓' : live ? '▶' : '·'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block type-small font-semibold text-fg">
                  {item.title}
                </span>
                <span className="block font-mono type-tick text-muted">
                  {TOPICS[item.topic].label} · {LIBRARY.minutes(item.minutes)}
                  {done
                    ? ` · ${LIBRARY.done}`
                    : live
                      ? ''
                      : ` · ${LIBRARY.soon}`}
                </span>
              </span>
            </>
          );
          return (
            <li key={item.id}>
              {live ? (
                <Link
                  href={item.playAt!}
                  className="flex min-h-16 items-center gap-3 px-3 py-3 active:bg-raised"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-16 items-center gap-3 px-3 py-3">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
