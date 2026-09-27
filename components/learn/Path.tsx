'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DESK, PATH } from '@/content/desk';
import { STAGES, lesson, type Lesson } from '@/content/curriculum';
import { nextLesson, stageOf } from '@/lib/curriculum/next';
import { loadProfile, type Saved } from '@/lib/client/profile';
import { useHabit } from '@/lib/client/progress';
import { usePractice } from '@/lib/client/practice';
import { PRACTICE } from '@/content/practice';

/**
 * The path (/learn): the next lesson as one big button, then every stage as
 * a trail of coins to tap. Done coins are gold and ticked, the next one
 * breathes, the rest wait. It holds no rules of its own: placement comes
 * from lib/onboarding/flow.ts, lessons from content/curriculum.ts. Streak,
 * level and today's goal live on the desk (components/desk/Dashboard.tsx).
 */

/** How far each coin sits from the centre line, so the path winds. */
const WIND = [0, 46, 70, 46, 0, -46, -70, -46];

type CoinState = 'done' | 'next' | 'open' | 'soon';

function Coin({
  item,
  state,
  index,
}: {
  item: Lesson;
  state: CoinState;
  index: number;
}) {
  const offset = WIND[index % WIND.length] ?? 0;
  const tone =
    state === 'done' || state === 'next'
      ? '[--face:var(--color-gold)] [--rim:var(--color-gold-deep)] text-ink'
      : state === 'open'
        ? '[--face:var(--color-raised)] [--rim:var(--color-line)] text-fg-2'
        : '[--face:var(--color-panel)] [--rim:var(--color-line)] text-muted opacity-60';
  const face = (
    <span
      className={`coin relative grid size-[68px] place-items-center ${tone}`}
    >
      {state === 'next' ? (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-gold animate-ring-out"
        />
      ) : null}
      <span aria-hidden className="text-2xl font-bold">
        {state === 'done' ? '✓' : state === 'soon' ? '·' : '▶'}
      </span>
    </span>
  );
  const label = (
    <span className="mt-3 block max-w-[150px] text-center type-tick leading-4 text-fg-2">
      {item.title}
      {state === 'soon' ? (
        <span className="block text-muted">{DESK.soon}</span>
      ) : null}
    </span>
  );
  return (
    <li className="flex justify-center">
      <div
        className="flex flex-col items-center"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {state === 'next' ? (
          <span className="mb-2 rounded-md bg-gold px-2 py-0.5 font-mono type-tick font-bold text-ink uppercase animate-pop">
            {DESK.here}
          </span>
        ) : null}
        {item.playAt && state !== 'soon' ? (
          <Link
            href={item.playAt}
            className="flex flex-col items-center rounded-full outline-offset-4"
            aria-label={`${item.title}${state === 'done' ? `, ${DESK.done}` : ''}`}
          >
            {face}
            {label}
          </Link>
        ) : (
          <div className="flex flex-col items-center">
            {face}
            {label}
          </div>
        )}
      </div>
    </li>
  );
}

export function Path() {
  const [state, setState] = useState<{ loaded: boolean; saved: Saved | null }>({
    loaded: false,
    saved: null,
  });
  // Stages the learner opened or folded by hand; the rest follow the default.
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const habit = useHabit();
  const practice = usePractice();
  const completed = habit.completed;

  useEffect(() => {
    let live = true;
    void loadProfile().then((saved) => {
      if (live) setState({ loaded: true, saved });
    });
    return () => {
      live = false;
    };
  }, []);

  if (!state.loaded)
    return (
      <p className="px-4 py-16 text-center type-body text-fg-2">
        {DESK.loading}
      </p>
    );

  const saved = state.saved;
  const startStage = saved?.placement.stage ?? 0;
  const fresh = completed.length === 0;

  // The next lesson: the first of their placement lessons not yet done,
  // then the first playable lesson from their stage onwards, then any.
  // Someone who skipped the chat starts at the very first lesson.
  const nextUp = nextLesson(completed, saved?.placement ?? null);
  const next = nextUp ? lesson(nextUp) : null;

  // Only the stage you're in is open, so the path reads as "here's today"
  // rather than fifty coins at once. Any stage opens with a tap.
  const openByDefault = stageOf(nextUp, startStage);
  const isOpen = (key: string, s: number) =>
    folded[key] === undefined ? s === openByDefault : !folded[key];

  return (
    <div className="mx-auto max-w-[1100px] overflow-x-clip px-4 pt-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pt-10">
      <aside className="lg:sticky lg:top-8">
        <h1 className="type-title text-fg">{PATH.title}</h1>
        <p className="mt-1 type-small text-fg-2">{PATH.lead}</p>

        {next ? (
          <Link
            href={next.playAt ?? '/lessons'}
            className="group relative mt-4 block overflow-hidden rounded-xl border border-gold bg-gold-soft p-4"
          >
            <span className="block font-mono type-tick text-gold uppercase">
              {fresh ? DESK.first : DESK.continue}
            </span>
            <span className="mt-1 block type-heading text-fg">
              {next.title}
            </span>
            <span className="mt-1 block type-small text-fg-2">
              {DESK.minutes(next.minutes)} · {next.practice}
            </span>
            <span className="btn-3d mt-4 flex min-h-12 items-center justify-center rounded-md bg-gold type-body font-bold text-ink">
              {fresh ? DESK.start : DESK.resume}
            </span>
          </Link>
        ) : (
          <p className="mt-4 rounded-lg border border-gold bg-gold-soft p-4 type-small text-fg">
            {DESK.allDone}
          </p>
        )}

        {practice.due.length ? (
          <Link
            href="/practice/round"
            className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-panel p-3"
          >
            <span
              aria-hidden
              className="coin grid size-11 shrink-0 place-items-center font-mono type-heading font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
            >
              {practice.due.length}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block type-small font-semibold text-fg">
                {PRACTICE.card.title}
              </span>
              <span className="block type-tick text-fg-2">
                {PRACTICE.card.due(practice.due.length)}
              </span>
            </span>
            <span className="btn-3d inline-flex min-h-10 shrink-0 items-center rounded-md bg-gold px-3 type-small font-bold text-ink">
              {PRACTICE.card.cta}
            </span>
          </Link>
        ) : null}

        {!saved ? (
          <Link
            href="/onboarding"
            className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-panel p-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block type-small font-semibold text-fg">
                {DESK.skipAhead.title}
              </span>
              <span className="block type-tick text-fg-2">
                {DESK.skipAhead.body}
              </span>
            </span>
            <span className="inline-flex min-h-10 shrink-0 items-center rounded-md border border-edge bg-raised px-3 type-small font-semibold text-fg">
              {DESK.skipAhead.cta}
            </span>
          </Link>
        ) : null}

        {saved?.where === 'device' ? (
          <p className="mt-4 rounded-md border border-dashed border-edge p-3 type-small text-fg-2">
            <Link
              href="/sign-up"
              className="font-semibold text-gold underline underline-offset-4"
            >
              {DESK.account}
            </Link>{' '}
            {DESK.accountWhy}
          </p>
        ) : null}
      </aside>

      <section aria-labelledby="path-title" className="mt-8 lg:mt-0">
        <h2
          id="path-title"
          className="sr-only lg:not-sr-only lg:mb-4 lg:block lg:font-mono lg:type-label lg:text-muted"
        >
          {DESK.path}
        </h2>
        <ol className="space-y-3">
          {STAGES.map((stage, s) => {
            const items = stage.lessons.map((id) => lesson(id));
            const finished = items.filter((item) =>
              completed.includes(item.id),
            ).length;
            const open = isOpen(stage.key, s);
            const here = s === openByDefault;
            return (
              <li key={stage.key}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`stage-${stage.key}`}
                  aria-label={`${DESK.stage(s + 1)}: ${stage.title}, ${DESK.progress(finished, items.length)}`}
                  onClick={() =>
                    setFolded((f) => ({ ...f, [stage.key]: open }))
                  }
                  className={`block w-full rounded-xl border p-4 text-left ${here ? 'border-gold bg-gold-soft' : 'border-line bg-panel'}`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-mono type-tick text-gold uppercase">
                      {DESK.stage(s + 1)}
                      {s === startStage && saved ? ` · ${DESK.yourStart}` : ''}
                    </span>
                    <span className="font-mono type-tick text-muted num">
                      {DESK.progress(finished, items.length)}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-3">
                    <span className="type-heading text-fg">{stage.title}</span>
                    <span className="flex shrink-0 items-center gap-1 type-tick text-fg-2">
                      {open ? DESK.close : DESK.open}
                      <span
                        aria-hidden
                        className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}
                      >
                        ▾
                      </span>
                    </span>
                  </span>
                  <span
                    className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line"
                    aria-hidden
                  >
                    <span
                      className="block h-full rounded-full bg-gold transition-[width] duration-700"
                      style={{ width: `${(finished / items.length) * 100}%` }}
                    />
                  </span>
                </button>
                {open ? (
                  <ol id={`stage-${stage.key}`} className="mt-6 mb-8 space-y-7">
                    {items.map((item, i) => (
                      <Coin
                        key={item.id}
                        item={item}
                        index={i}
                        state={
                          completed.includes(item.id)
                            ? 'done'
                            : item.id === nextUp
                              ? 'next'
                              : item.status === 'live'
                                ? 'open'
                                : 'soon'
                        }
                      />
                    ))}
                  </ol>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
