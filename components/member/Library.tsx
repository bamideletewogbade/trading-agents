'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  STAGES,
  TOPICS,
  lesson,
  type Lesson,
  type Topic,
} from '@/content/curriculum';
import { LIBRARY } from '@/content/member';
import { searchLessons } from '@/lib/curriculum/search';
import { useCompleted } from '@/lib/client/progress';

/**
 * Every lesson on its own, for people who already trade and want one
 * thing: search in their own words, or filter by topic. With no filter the
 * lessons sit under their stages, in roadmap order, so the library reads
 * as the same path the Learn tab walks. On a laptop the search and topics
 * stay beside the list.
 */
function Row({ item, done }: { item: Lesson; done: boolean }) {
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
          {done ? ` · ${LIBRARY.done}` : live ? '' : ` · ${LIBRARY.soon}`}
        </span>
      </span>
    </>
  );
  return (
    <li>
      {live ? (
        <Link
          href={item.playAt!}
          className="flex min-h-16 items-center gap-3 px-3 py-3 hover:bg-raised active:bg-raised"
        >
          {body}
        </Link>
      ) : (
        <div className="flex min-h-16 items-center gap-3 px-3 py-3">{body}</div>
      )}
    </li>
  );
}

function List({
  items,
  completed,
}: {
  items: readonly Lesson[];
  completed: readonly string[];
}) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
      {items.map((item) => (
        <Row key={item.id} item={item} done={completed.includes(item.id)} />
      ))}
    </ul>
  );
}

export function Library() {
  const completed = useCompleted();
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [query, setQuery] = useState('');
  const matches = query.trim()
    ? searchLessons(query, 12).map((m) => m.lesson)
    : null;
  const inOrder = STAGES.flatMap((stage) =>
    stage.lessons.map((id) => lesson(id)),
  );
  const filtered =
    matches ??
    (topic === 'all' ? null : inOrder.filter((item) => item.topic === topic));
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pt-10">
      <div className="lg:sticky lg:top-24">
        <h1 className="type-title text-fg">{LIBRARY.title}</h1>
        <p className="mt-1 type-small text-fg-2">{LIBRARY.lead}</p>
        <Link
          href="/glossary"
          className="mt-2 inline-flex min-h-11 items-center type-small font-semibold text-gold underline underline-offset-4"
        >
          {LIBRARY.glossary} →
        </Link>
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
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {(['all', ...Object.keys(TOPICS)] as (Topic | 'all')[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={topic === key}
                  onClick={() => setTopic(key)}
                  className={`min-h-10 shrink-0 rounded-full border px-3 type-small ${topic === key ? 'border-gold bg-gold-soft text-gold' : 'border-edge text-fg-2 hover:text-fg'}`}
                >
                  {key === 'all' ? LIBRARY.all : TOPICS[key].label}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <div className="mt-5 lg:mt-0">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="type-small text-fg-2">{LIBRARY.none}</p>
          ) : (
            <List items={filtered} completed={completed} />
          )
        ) : (
          <ol className="space-y-6">
            {STAGES.map((stage, s) => {
              const items = stage.lessons.map((id) => lesson(id));
              const finished = items.filter((item) =>
                completed.includes(item.id),
              ).length;
              return (
                <li key={stage.key}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h2 className="type-heading text-fg">
                      <span className="mr-2 font-mono type-tick text-gold uppercase">
                        {LIBRARY.stage(s + 1)}
                      </span>
                      {stage.title}
                    </h2>
                    <span className="shrink-0 font-mono type-tick text-muted num">
                      {LIBRARY.progress(finished, items.length)}
                    </span>
                  </div>
                  <List items={items} completed={completed} />
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
