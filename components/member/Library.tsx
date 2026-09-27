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
import { nextLesson, stageOf } from '@/lib/curriculum/next';
import { searchLessons } from '@/lib/curriculum/search';
import { useCompleted } from '@/lib/client/progress';
import { LessonRow, type RowState } from '@/components/learn/LessonRow';

/**
 * Every lesson on its own, for people who already trade and want one
 * thing: search in their own words, or filter by topic. With no filter the
 * lessons sit under their courses, in order, each course folded except the
 * one you're in, so the page stays short. Every lesson row folds open to
 * say what you'll do in it. On a laptop the search and topics stay beside
 * the list.
 */
function stateOf(item: Lesson, completed: readonly string[]): RowState {
  if (completed.includes(item.id)) return 'done';
  return item.status === 'live' && item.playAt ? 'live' : 'soon';
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
      {items.map((item) => {
        const state = stateOf(item, completed);
        return (
          <LessonRow
            key={item.id}
            item={item}
            state={state}
            meta={`${TOPICS[item.topic].label} · ${LIBRARY.minutes(item.minutes)}${state === 'done' ? ` · ${LIBRARY.done}` : state === 'soon' ? ` · ${LIBRARY.soon}` : ''}`}
            words={LIBRARY.row}
          />
        );
      })}
    </ul>
  );
}

export function Library() {
  const completed = useCompleted();
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [query, setQuery] = useState('');
  // Courses opened or folded by hand; the rest follow the default, which
  // opens only the course holding the next lesson.
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const here = stageOf(nextLesson(completed, null));
  const isOpen = (key: string, s: number) =>
    folded[key] === undefined ? s === here : !folded[key];
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
      <div className="lg:sticky lg:top-8">
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
          <ol className="space-y-3">
            {STAGES.map((stage, s) => {
              const items = stage.lessons.map((id) => lesson(id));
              const finished = items.filter((item) =>
                completed.includes(item.id),
              ).length;
              const open = isOpen(stage.key, s);
              return (
                <li key={stage.key}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`course-${stage.key}`}
                    aria-label={`${LIBRARY.stage(s + 1)}: ${stage.title}, ${LIBRARY.progress(finished, items.length)}`}
                    onClick={() =>
                      setFolded((f) => ({ ...f, [stage.key]: open }))
                    }
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left ${s === here ? 'border-gold bg-gold-soft' : 'border-line bg-panel hover:border-edge'}`}
                  >
                    <span className="min-w-0">
                      <span className="block font-mono type-tick text-gold uppercase">
                        {LIBRARY.stage(s + 1)}
                      </span>
                      <span className="block type-heading text-fg">
                        {stage.title}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono type-tick text-muted num">
                        {LIBRARY.progress(finished, items.length)}
                      </span>
                      <span
                        aria-hidden
                        className={`text-fg-2 transition-transform ${open ? 'rotate-180' : ''}`}
                      >
                        ▾
                      </span>
                    </span>
                  </button>
                  {open ? (
                    <div id={`course-${stage.key}`} className="mt-2">
                      <List items={items} completed={completed} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
