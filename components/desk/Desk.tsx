'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DESK } from '@/content/desk';
import { HABIT } from '@/content/member';
import { STAGES, lesson, type Lesson } from '@/content/curriculum';
import { loadProfile, type Saved } from '@/lib/client/profile';
import { useHabit } from '@/lib/client/progress';
import { usePractice } from '@/lib/client/practice';
import { PRACTICE } from '@/content/practice';
import { FlameIcon } from '@/components/ui/icons';

/**
 * The path: where a learner lands after onboarding, and every visit after.
 * Streak, level and today's goal at the top; the next lesson as one big
 * button; then every stage as a trail of coins to tap. Done coins are gold
 * and ticked, the next one breathes, the rest wait. It holds no rules of its
 * own: placement comes from lib/onboarding/flow.ts, lessons from
 * content/curriculum.ts, the numbers from lib/progress/habit.ts.
 */

function partOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

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

function Ring({ done, goal }: { done: number; goal: number }) {
  const share = Math.min(1, goal ? done / goal : 0);
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden>
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        strokeWidth="4"
        className="stroke-line"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-gold transition-[stroke-dashoffset] duration-700"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - share)}
      />
    </svg>
  );
}

export function Desk() {
  const [state, setState] = useState<{ loaded: boolean; saved: Saved | null }>({
    loaded: false,
    saved: null,
  });
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
  const firstLive = STAGES.flatMap((s) => [...s.lessons]).find(
    (id) => lesson(id).status === 'live',
  );

  if (!saved && completed.length === 0)
    return (
      <div className="mx-auto max-w-[520px] px-4 py-14 text-center">
        <span
          aria-hidden
          className="coin mx-auto grid size-[72px] place-items-center font-mono type-title font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
        >
          S
        </span>
        <h1 className="mt-6 type-display text-fg">{DESK.empty.title}</h1>
        <p className="mt-3 type-body text-fg-2">{DESK.empty.body}</p>
        <Link
          href="/onboarding"
          className="btn-3d mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-gold px-6 type-body font-semibold text-ink sm:w-auto"
        >
          {DESK.empty.cta}
        </Link>
        {firstLive ? (
          <Link
            href={lesson(firstLive).playAt ?? '/lessons'}
            className="mt-4 block min-h-11 type-small text-fg-2 underline underline-offset-4"
          >
            {DESK.empty.skip}
          </Link>
        ) : null}
      </div>
    );

  // The next lesson: the first of their placement lessons not yet done,
  // then the first playable lesson from their stage onwards, then any.
  const order = [
    ...(saved?.placement.lessons ?? []),
    ...STAGES.slice(startStage).flatMap((s) => [...s.lessons]),
    ...STAGES.flatMap((s) => [...s.lessons]),
  ];
  const nextUp =
    order.find(
      (id) => !completed.includes(id) && lesson(id).status === 'live',
    ) ?? null;
  const next = nextUp ? lesson(nextUp) : null;

  return (
    <div className="mx-auto max-w-[560px] overflow-x-clip px-4 pt-5">
      <h1 className="type-title text-fg">
        {DESK.greeting(partOfDay(), saved?.profile.name)}
      </h1>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-panel p-3">
          <p className="font-mono type-tick text-muted uppercase">
            {DESK.streak}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 type-heading num ${habit.streak.today ? 'text-gold' : 'text-fg'}`}
          >
            <FlameIcon
              width={18}
              height={18}
              className={habit.streak.today ? 'animate-flicker' : 'opacity-50'}
            />
            {HABIT.streak(habit.streak.current)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-3">
          <p className="font-mono type-tick text-muted uppercase">
            {DESK.level}
          </p>
          <p className="mt-1 type-heading text-fg num">{habit.level.level}</p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-700"
              style={{ width: `${habit.level.progressBp / 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel p-3">
          <Ring done={habit.goal.done} goal={habit.goal.goal} />
          <div className="min-w-0">
            <p className="font-mono type-tick text-muted uppercase">
              {DESK.today}
            </p>
            <p className="type-small font-semibold text-fg num">
              {habit.goal.met
                ? HABIT.goalMet
                : HABIT.goal(habit.goal.done, habit.goal.goal)}
            </p>
          </div>
        </div>
      </div>

      {next ? (
        <Link
          href={next.playAt ?? '/lessons'}
          className="group relative mt-4 block overflow-hidden rounded-xl border border-gold bg-gold-soft p-4"
        >
          <span className="block font-mono type-tick text-gold uppercase">
            {completed.length ? DESK.continue : DESK.first}
          </span>
          <span className="mt-1 block type-heading text-fg">{next.title}</span>
          <span className="mt-1 block type-small text-fg-2">
            {DESK.minutes(next.minutes)} · {next.practice}
          </span>
          <span className="btn-3d mt-4 flex min-h-12 items-center justify-center rounded-md bg-gold type-body font-bold text-ink">
            {completed.length ? DESK.resume : DESK.start}
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

      {saved?.where === 'device' ? (
        <p className="mt-4 rounded-md border border-dashed border-edge p-3 type-small text-fg-2">
          {DESK.device}{' '}
          <Link
            href="/sign-up"
            className="font-semibold text-gold underline underline-offset-4"
          >
            {DESK.account}
          </Link>
        </p>
      ) : null}

      <ol className="mt-8 space-y-10">
        {STAGES.map((stage, s) => {
          const items = stage.lessons.map((id) => lesson(id));
          const finished = items.filter((item) =>
            completed.includes(item.id),
          ).length;
          return (
            <li key={stage.key}>
              <div
                className={`rounded-xl border p-4 ${s === startStage ? 'border-gold bg-gold-soft' : 'border-line bg-panel'}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono type-tick text-gold uppercase">
                    {DESK.stage(s + 1)}
                    {s === startStage && saved ? ` · ${DESK.yourStart}` : ''}
                  </p>
                  <p className="font-mono type-tick text-muted num">
                    {DESK.progress(finished, items.length)}
                  </p>
                </div>
                <h2 className="mt-1 type-heading text-fg">{stage.title}</h2>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-gold transition-[width] duration-700"
                    style={{ width: `${(finished / items.length) * 100}%` }}
                  />
                </div>
              </div>
              <ol className="mt-6 space-y-7">
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
