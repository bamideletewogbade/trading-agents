'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DESK, PATH } from '@/content/desk';
import { LESSONS, STAGES, lesson, type Lesson } from '@/content/curriculum';
import { nextLesson, stageOf } from '@/lib/curriculum/next';
import { loadProfile, type Saved } from '@/lib/client/profile';
import { useHabit } from '@/lib/client/progress';
import { usePractice } from '@/lib/client/practice';
import { PRACTICE } from '@/content/practice';

/**
 * The courses (/learn): the next lesson as one big button beside the seven
 * courses as a syllabus. Each course is a card that opens into its lessons
 * on a rail: a tick for done, a ringed play mark for up next, a number for
 * the rest, a dash for coming soon, so colour never carries the state alone
 * (rule 7). Every row says how long the lesson takes and what you'll do in
 * it, and the whole row is the link.
 *
 * It holds no rules of its own: placement comes from lib/onboarding/flow.ts,
 * lessons from content/curriculum.ts. Streak, level and today's goal live on
 * the desk (components/desk/Dashboard.tsx).
 */

type RowState = 'done' | 'next' | 'open' | 'soon';
type CourseState = 'done' | 'here' | 'later' | 'soon';

/** Where the rail's centre line sits: the marker's top margin plus half its size. */
const RAIL = 'h-7';
const BELOW = 'top-7';

function rowState(
  item: Lesson,
  completed: readonly string[],
  nextUp: string | null,
): RowState {
  if (completed.includes(item.id)) return 'done';
  if (item.id === nextUp) return 'next';
  return item.status === 'live' && item.playAt ? 'open' : 'soon';
}

function LessonStep({
  item,
  index,
  state,
  prevDone,
  first,
  last,
}: {
  item: Lesson;
  index: number;
  state: RowState;
  prevDone: boolean;
  first: boolean;
  last: boolean;
}) {
  const marker =
    state === 'done'
      ? 'bg-gold text-ink'
      : state === 'next'
        ? 'border-2 border-gold bg-panel text-gold'
        : state === 'open'
          ? 'border border-edge bg-panel text-fg-2'
          : 'border border-dashed border-line bg-panel text-muted';
  const action =
    state === 'next' ? (
      <span className="btn-3d inline-flex min-h-10 min-w-20 items-center justify-center rounded-md bg-gold px-3 type-small font-bold text-ink">
        {PATH.action.next}
      </span>
    ) : state === 'soon' ? (
      <span className="inline-flex min-w-20 justify-center rounded-sm border border-line px-2 py-1 font-mono type-tick text-muted uppercase">
        {PATH.action.soon}
      </span>
    ) : (
      <span className="inline-flex min-h-9 min-w-20 items-center justify-center rounded-md border border-edge px-3 type-small font-semibold text-fg-2 transition-colors group-hover:border-gold group-hover:text-fg">
        {state === 'done' ? PATH.action.again : PATH.action.open}
      </span>
    );

  const body = (
    <>
      <span aria-hidden className="relative flex w-8 shrink-0 justify-center">
        {first ? null : (
          <span
            className={`absolute top-0 w-0.5 ${RAIL} ${prevDone ? 'bg-gold' : 'bg-line'}`}
          />
        )}
        {last ? null : (
          <span
            className={`absolute bottom-0 w-0.5 ${BELOW} ${state === 'done' ? 'bg-gold' : 'bg-line'}`}
          />
        )}
        <span
          className={`relative mt-3 grid size-8 place-items-center rounded-full font-mono type-tick font-bold ${marker}`}
        >
          {state === 'next' ? (
            <span className="absolute inset-[-4px] animate-ring-out rounded-full border border-gold" />
          ) : null}
          {state === 'done'
            ? '✓'
            : state === 'next'
              ? '▶'
              : state === 'soon'
                ? '–'
                : index + 1}
        </span>
      </span>
      <span className="min-w-0 flex-1 py-3">
        <span className="block type-small font-semibold text-fg">
          {item.title}
        </span>
        <span className="mt-0.5 block font-mono type-tick text-muted">
          {DESK.minutes(item.minutes)}
          {state === 'done' ? ` · ${DESK.done}` : ''}
        </span>
        <span className="mt-1 line-clamp-2 block type-tick text-fg-2">
          {item.practice}
        </span>
      </span>
      <span className="flex shrink-0 items-center self-center pl-1">
        {action}
      </span>
    </>
  );

  const row = `group flex gap-3 rounded-xl pr-3 pl-2 sm:pl-3 ${
    state === 'next' ? 'bg-gold-soft ring-1 ring-gold/40' : ''
  }`;
  const label = `${item.title}, ${DESK.minutes(item.minutes)}, ${PATH.lessonState[state]}`;

  return (
    <li
      className="animate-page-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {state === 'soon' || !item.playAt ? (
        <div className={`${row} opacity-70`} aria-label={label}>
          {body}
        </div>
      ) : (
        <Link
          href={item.playAt}
          aria-label={label}
          className={`${row} outline-offset-2 transition-colors ${state === 'next' ? '' : 'hover:bg-raised'}`}
        >
          {body}
        </Link>
      )}
    </li>
  );
}

function CourseCoin({ n, state }: { n: number; state: CourseState }) {
  const tone =
    state === 'done' || state === 'here'
      ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]'
      : state === 'later'
        ? 'text-fg-2'
        : 'text-muted opacity-60';
  return (
    <span
      aria-hidden
      className={`coin grid size-11 shrink-0 place-items-center font-mono type-heading font-bold sm:size-12 ${tone}`}
    >
      {state === 'done' ? '✓' : n}
    </span>
  );
}

function PathSkeleton() {
  const block = 'animate-pulse rounded-xl bg-panel';
  return (
    <div
      aria-busy
      className="mx-auto max-w-[1120px] px-4 pt-5 pb-10 sm:px-8 lg:pt-10"
    >
      <p className="sr-only">{DESK.loading}</p>
      <div className="h-7 w-48 animate-pulse rounded-md bg-panel" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-panel" />
      <div className="mt-6 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
        <div className={`${block} h-48 border border-line`} />
        <div className="flex flex-col gap-3">
          <div className={`${block} h-96 border border-line`} />
          <div className={`${block} h-20`} />
          <div className={`${block} h-20`} />
          <div className={`${block} h-20`} />
        </div>
      </div>
    </div>
  );
}

export function Path() {
  const [state, setState] = useState<{ loaded: boolean; saved: Saved | null }>({
    loaded: false,
    saved: null,
  });
  // Courses the learner opened or folded by hand; the rest follow the default.
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

  if (!state.loaded) return <PathSkeleton />;

  const saved = state.saved;
  const startStage = saved?.placement.stage ?? 0;
  const fresh = completed.length === 0;

  // The next lesson: the first of their placement lessons not yet done,
  // then the first playable lesson from their stage onwards, then any.
  // Someone who skipped the chat starts at the very first lesson.
  const nextUp = nextLesson(completed, saved?.placement ?? null);
  const next = nextUp ? lesson(nextUp) : null;

  // Only the course you're in is open, so the page reads as "here's today"
  // rather than fifty lessons at once. Any course opens with a tap.
  const here = stageOf(nextUp, startStage);
  const isOpen = (key: string, s: number) =>
    folded[key] === undefined ? s === here : !folded[key];

  const nextStage = STAGES[here]!;
  const nextIndex = nextUp
    ? (nextStage.lessons as readonly string[]).indexOf(nextUp)
    : -1;

  const live = LESSONS.filter((item) => item.status === 'live');
  const liveDone = live.filter((item) => completed.includes(item.id)).length;

  return (
    <div className="mx-auto max-w-[1120px] overflow-x-clip px-4 pt-5 pb-12 sm:px-8 lg:pt-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="type-title text-fg">{PATH.title}</h1>
          <p className="mt-1 type-small text-fg-2">{PATH.lead}</p>
        </div>
        <div className="sm:w-56 sm:shrink-0">
          <p className="font-mono type-tick text-muted num sm:text-right">
            {PATH.overall(liveDone, live.length)}
          </p>
          <span
            aria-hidden
            className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line"
          >
            <span
              className="block h-full rounded-full bg-gold transition-[width] duration-700"
              style={{
                width: `${(liveDone / Math.max(live.length, 1)) * 100}%`,
              }}
            />
          </span>
        </div>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-8">
          {next ? (
            <Link
              href={next.playAt ?? '/lessons'}
              className="group relative block overflow-hidden rounded-2xl border border-gold bg-gold-soft p-5"
            >
              <span className="flex items-center justify-between gap-2 font-mono type-tick uppercase">
                <span className="text-gold">
                  {fresh ? DESK.first : DESK.continue}
                </span>
                <span className="text-muted num">
                  {DESK.minutes(next.minutes)}
                </span>
              </span>
              <span className="mt-2 block type-heading text-fg">
                {next.title}
              </span>
              <span className="mt-1 block type-small text-fg-2">
                {next.practice}
              </span>
              {nextIndex >= 0 ? (
                <span className="mt-3 block font-mono type-tick text-muted">
                  {PATH.whereAmI(
                    here + 1,
                    nextIndex + 1,
                    nextStage.lessons.length,
                  )}
                </span>
              ) : null}
              <span className="btn-3d mt-4 flex min-h-12 items-center justify-center rounded-md bg-gold type-body font-bold text-ink">
                {fresh ? DESK.start : DESK.resume}
              </span>
            </Link>
          ) : (
            <p className="rounded-2xl border border-gold bg-gold-soft p-5 type-small text-fg">
              {DESK.allDone}
            </p>
          )}

          {practice.due.length ? (
            <Link
              href="/practice/round"
              className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3 transition-colors hover:border-edge"
            >
              <span
                aria-hidden
                className="coin grid size-10 shrink-0 place-items-center font-mono type-heading font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
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
              <span className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-edge px-3 type-small font-semibold text-fg">
                {PRACTICE.card.cta}
              </span>
            </Link>
          ) : null}

          {!saved ? (
            <Link
              href="/onboarding"
              className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3 transition-colors hover:border-edge"
            >
              <span className="min-w-0 flex-1">
                <span className="block type-small font-semibold text-fg">
                  {DESK.skipAhead.title}
                </span>
                <span className="block type-tick text-fg-2">
                  {DESK.skipAhead.body}
                </span>
              </span>
              <span className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-edge px-3 type-small font-semibold text-fg">
                {DESK.skipAhead.cta}
              </span>
            </Link>
          ) : null}

          {saved?.where === 'device' ? (
            <p className="rounded-xl border border-dashed border-edge p-3 type-small text-fg-2">
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

        <section aria-label={PATH.title} className="mt-8 lg:mt-0">
          <ol className="flex flex-col gap-3">
            {STAGES.map((stage, s) => {
              const items = stage.lessons.map((id) => lesson(id));
              const playable = items.filter((item) => item.status === 'live');
              const finished = items.filter((item) =>
                completed.includes(item.id),
              ).length;
              const minutes = playable.length
                ? playable.reduce((sum, item) => sum + item.minutes, 0)
                : null;
              const courseState: CourseState =
                playable.length === 0
                  ? 'soon'
                  : playable.every((item) => completed.includes(item.id))
                    ? 'done'
                    : s === here
                      ? 'here'
                      : 'later';
              const open = isOpen(stage.key, s);
              const tag =
                courseState === 'here'
                  ? PATH.here
                  : courseState === 'done'
                    ? PATH.finished
                    : s === startStage && saved
                      ? DESK.yourStart
                      : null;
              return (
                <li
                  key={stage.key}
                  className={`overflow-hidden rounded-2xl border bg-panel transition-colors ${
                    s === here ? 'border-gold/60' : 'border-line'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`course-${stage.key}`}
                    onClick={() =>
                      setFolded((f) => ({ ...f, [stage.key]: open }))
                    }
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-raised sm:gap-4"
                  >
                    <CourseCoin n={s + 1} state={courseState} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono type-tick uppercase">
                        <span className="text-gold">{DESK.stage(s + 1)}</span>
                        {tag ? (
                          <span
                            className={`rounded-sm px-1.5 py-px ${
                              courseState === 'here'
                                ? 'bg-gold text-ink'
                                : 'border border-line text-fg-2'
                            }`}
                          >
                            {tag}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block type-heading text-fg">
                        {stage.title}
                      </span>
                      <span className="mt-0.5 block font-mono type-tick text-muted num">
                        {PATH.size(items.length, minutes)}
                      </span>
                      {playable.length ? (
                        <span className="mt-2 flex items-center gap-3">
                          <span
                            aria-hidden
                            className="block h-1 flex-1 overflow-hidden rounded-full bg-line"
                          >
                            <span
                              className="block h-full rounded-full bg-gold transition-[width] duration-700"
                              style={{
                                width: `${(finished / items.length) * 100}%`,
                              }}
                            />
                          </span>
                          <span className="shrink-0 font-mono type-tick text-fg-2 num">
                            {PATH.done(finished, items.length)}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    <span
                      aria-hidden
                      className={`grid size-8 shrink-0 place-items-center rounded-full border border-line text-fg-2 transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </button>
                  {open ? (
                    <div
                      id={`course-${stage.key}`}
                      className="border-t border-line px-2 pt-3 pb-3 sm:px-3"
                    >
                      <p className="px-2 pb-2 type-small text-fg-2 sm:px-3">
                        {stage.outcome}
                      </p>
                      <ol>
                        {items.map((item, i) => (
                          <LessonStep
                            key={item.id}
                            item={item}
                            index={i}
                            state={rowState(item, completed, nextUp)}
                            prevDone={
                              i > 0 && completed.includes(items[i - 1]!.id)
                            }
                            first={i === 0}
                            last={i === items.length - 1}
                          />
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
