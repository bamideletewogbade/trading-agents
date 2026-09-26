'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ROADMAP_PAGE as C } from '@/content/pages';
import { STAGES, lesson, type Lesson } from '@/content/curriculum';
import { syncCompleted, useCompleted } from '@/lib/client/progress';

/**
 * The roadmap on one screen: seven stages to pick from, and the picked
 * stage's lessons beside them. On a laptop the stages are a column on the
 * left; on a phone, a row of seven numbered coins across the top. Only one
 * stage's lessons show at a time, so the page never becomes a long scroll.
 *
 * The stages are tabs (arrow keys move between them), drawn from the one
 * curriculum list (content/curriculum.ts).
 */

type State = 'done' | 'live' | 'soon';

function stateOf(item: Lesson, completed: readonly string[]): State {
  if (completed.includes(item.id)) return 'done';
  return item.status === 'live' && item.playAt ? 'live' : 'soon';
}

function Row({ item, state }: { item: Lesson; state: State }) {
  const icon = (
    <span
      aria-hidden
      className={`coin grid size-9 shrink-0 place-items-center text-sm font-bold ${state === 'done' ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]' : state === 'live' ? 'text-fg-2' : 'text-muted opacity-60'}`}
    >
      {state === 'done' ? '✓' : state === 'live' ? '▶' : '·'}
    </span>
  );
  const words = (
    <span className="min-w-0 flex-1">
      <span className="block type-small font-semibold text-fg">
        {item.title}
      </span>
      <span className="block font-mono type-tick text-muted">
        {C.minutes(item.minutes)} · {C.truth[item.truth]}
        {state === 'soon' ? ` · ${C.soon}` : ''}
      </span>
    </span>
  );
  return (
    <li>
      {state === 'soon' ? (
        <div className="flex min-h-14 items-center gap-3 px-3 py-2">
          {icon}
          {words}
        </div>
      ) : (
        <Link
          href={item.playAt!}
          className="flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-raised"
        >
          {icon}
          {words}
          <span aria-hidden className="text-fg-2">
            →
          </span>
        </Link>
      )}
    </li>
  );
}

export function RoadmapExplorer() {
  const completed = useCompleted();
  useEffect(() => {
    void syncCompleted();
  }, []);

  // Open on the stage the learner is in: the first with a playable lesson
  // they haven't finished. A newcomer lands on stage 1.
  const current = Math.max(
    0,
    STAGES.findIndex((stage) =>
      stage.lessons.some(
        (id) => !completed.includes(id) && lesson(id).status === 'live',
      ),
    ),
  );
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked ?? current;
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const stage = STAGES[shown]!;
  const items = stage.lessons.map((id) => lesson(id));
  const finished = items.filter((item) => completed.includes(item.id)).length;
  const next = items.find((item) => stateOf(item, completed) === 'live');
  const first = items.find((item) => item.playAt);

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const to = (shown + step + STAGES.length) % STAGES.length;
    setPicked(to);
    tabs.current[to]?.focus();
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div
        role="tablist"
        tabIndex={-1}
        aria-label={C.stagesLabel}
        onKeyDown={onKey}
        className="relative flex justify-between gap-1.5 before:absolute before:inset-x-5 before:top-5 before:h-px before:bg-line lg:flex-col lg:justify-start lg:gap-2 lg:before:hidden"
      >
        {STAGES.map((s, i) => {
          const lessons = s.lessons.map((id) => lesson(id));
          const done = lessons.filter((l) => completed.includes(l.id)).length;
          const live = lessons.some((l) => l.status === 'live');
          const selected = i === shown;
          return (
            <button
              key={s.key}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              role="tab"
              type="button"
              id={`stage-tab-${s.key}`}
              aria-selected={selected}
              aria-controls="stage-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setPicked(i)}
              className={`relative z-10 flex shrink-0 items-center gap-3 rounded-full text-left lg:w-full lg:rounded-xl lg:border lg:p-3 ${selected ? 'lg:border-gold lg:bg-gold-soft' : 'lg:border-line lg:bg-panel lg:hover:border-edge'}`}
            >
              <span
                aria-hidden
                className={`coin grid size-10 shrink-0 place-items-center font-mono type-small font-bold ${selected || (live && done === lessons.length) ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]' : live ? 'text-fg [--face:var(--color-raised)] [--rim:var(--color-line)]' : 'text-muted [--face:var(--color-panel)] [--rim:var(--color-line)]'} ${selected ? 'ring-2 ring-gold ring-offset-2 ring-offset-ink lg:ring-0' : ''}`}
              >
                {live && done === lessons.length ? '✓' : i + 1}
              </span>
              <span className="sr-only lg:not-sr-only lg:block lg:min-w-0 lg:flex-1">
                <span className="block type-small font-semibold text-fg">
                  {s.title}
                </span>
                <span className="block font-mono type-tick text-muted">
                  {done
                    ? C.done(done, lessons.length)
                    : C.lessons(lessons.length)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <section
        id="stage-panel"
        role="tabpanel"
        aria-labelledby={`stage-tab-${stage.key}`}
        className="mt-5 overflow-hidden rounded-xl border border-line bg-panel lg:mt-0"
      >
        <div className="border-b border-line p-4">
          <p className="flex items-baseline justify-between gap-3 font-mono type-tick uppercase">
            <span className="text-gold">{C.stage(shown + 1)}</span>
            <span className="text-muted num">
              {C.done(finished, items.length)}
            </span>
          </p>
          <h2 className="mt-1 type-title text-fg">{stage.title}</h2>
          <p className="mt-1 type-small text-fg-2">{stage.outcome}</p>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-500"
              style={{ width: `${(finished / items.length) * 100}%` }}
            />
          </div>
        </div>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <Row key={item.id} item={item} state={stateOf(item, completed)} />
          ))}
        </ul>
        <div className="border-t border-line p-4">
          {next ? (
            <Link
              href={next.playAt!}
              className="btn-3d flex min-h-12 items-center justify-center rounded-lg bg-gold px-5 type-body font-bold text-ink"
            >
              {finished ? C.next(next.title) : C.start(next.title)}
            </Link>
          ) : first ? (
            <Link
              href={first.playAt!}
              className="flex min-h-12 items-center justify-center rounded-lg border border-edge px-5 type-body font-semibold text-fg"
            >
              {C.again}
            </Link>
          ) : (
            <p className="text-center type-small text-fg-2">{C.coming}</p>
          )}
        </div>
      </section>
    </div>
  );
}
