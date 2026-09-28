'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { DESK } from '@/content/desk';
import { HABIT } from '@/content/member';
import { PRACTICE } from '@/content/practice';
import { SIGNALS } from '@/content/signals';
import { TOOLS } from '@/content/tools';
import { GLOSSARY, termSlug } from '@/content/glossary';
import { STAGES, lesson } from '@/content/curriculum';
import { formatBp } from '@/lib/core/money';
import { journalStats } from '@/lib/engines/journal';
import { formatR } from '@/lib/engines/trades';
import { formatPrice } from '@/lib/markets/catalog';
import { nextLesson, stageOf } from '@/lib/curriculum/next';
import { loadProfile, type Saved } from '@/lib/client/profile';
import { useHabit } from '@/lib/client/progress';
import { usePractice } from '@/lib/client/practice';
import { useJournal } from '@/lib/client/journal';
import { useSignals } from '@/lib/client/signals';
import { useWatchlist } from '@/lib/client/watchlist';
import { usePaper } from '@/lib/client/paper';
import { CareGate } from '@/components/coach/CareGate';
import { formatMoney } from '@/lib/core/money';
import { Change, SideTag } from '@/components/signals/parts';
import { FlameIcon } from '@/components/ui/icons';
import { Tilt } from '@/components/motion/Tilt';
import { SplitWords } from '@/components/motion/SplitWords';

/**
 * The desk: the signed-in home (docs/member-app-plan.md §3). It answers
 * what to do now (the next lesson, mistakes due), how you're doing (streak,
 * level, today's goal, your journal) and what the markets are doing (the
 * signals). Every card reads from a module; the desk holds no rules.
 *
 * On a phone it's one column in that order; on a laptop, learning on the
 * left and markets and trading on the right. The columns are `contents` on
 * a phone so the cards can interleave by `order`.
 */

function partOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

/** The same word for everyone on a given day. */
function wordOfTheDay() {
  const days = Math.floor(Date.now() / 86_400_000);
  return GLOSSARY[days % GLOSSARY.length]!;
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

/** The desk's cards arrive one after another, a beat apart (`delay`, in ms). */
function Card({
  title,
  action,
  live = false,
  delay = 0,
  className = '',
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  /** A pulse by the title: this card is reading live data. */
  live?: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`animate-page-in rounded-xl border border-line bg-panel p-4 transition-colors duration-200 hover:border-baseline ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono type-label text-fg-2">
          {live ? (
            <span className="relative flex size-1.5 shrink-0" aria-hidden>
              <span className="absolute inset-0 animate-ring-out rounded-full bg-gain" />
              <span className="relative size-1.5 rounded-full bg-gain" />
            </span>
          ) : null}
          {title}
        </h2>
        {action ? (
          <Link
            href={action.href}
            className="group inline-flex min-h-9 items-center gap-1 type-tick font-semibold text-gold hover:underline"
          >
            {action.label}{' '}
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** While the desk opens: its own shape in grey, so nothing jumps when it lands. */
function DeskSkeleton() {
  const block = 'animate-pulse rounded-xl bg-panel';
  return (
    <div
      aria-busy
      className="mx-auto max-w-[1200px] px-4 pt-5 pb-8 sm:px-8 lg:pt-8"
    >
      <p className="sr-only">{DESK.loading}</p>
      <div className="h-7 w-64 animate-pulse rounded-md bg-panel" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-panel" />
      <div className="mt-5 flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-4">
          <div className={`${block} h-56 border border-line`} />
          <div className={`${block} h-16`} />
          <div className={`${block} h-36`} />
        </div>
        <div className="flex flex-col gap-4">
          <div className={`${block} h-72`} />
          <div className={`${block} h-28`} />
        </div>
      </div>
    </div>
  );
}

/**
 * The lessons of the current course as a row of marks: done, up next,
 * still to come, coming soon. Each state has its own shape (a tick, a
 * ringed play mark, a number, a dash), so colour never carries it alone.
 * It sits inside the "Up next" link, whose words ("Lesson 2 of 8") already
 * say where you are, so a screen reader skips the marks rather than
 * reading eight of them as the link's name.
 */
function LessonTrack({
  ids,
  completed,
  current,
}: {
  ids: readonly string[];
  completed: readonly string[];
  current: string | null;
}) {
  return (
    <ol aria-hidden className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => {
        const item = lesson(id);
        const state = completed.includes(id)
          ? 'done'
          : id === current
            ? 'now'
            : item.status === 'live'
              ? 'later'
              : 'soon';
        return (
          <li
            key={id}
            className="animate-page-in"
            style={{ animationDelay: `${260 + i * 45}ms` }}
          >
            <span
              title={`${item.title}: ${DESK.lessonMark[state]}`}
              className={`grid size-6 place-items-center rounded-full font-mono text-[0.625rem] font-bold ${
                state === 'done'
                  ? 'bg-gold text-ink'
                  : state === 'now'
                    ? 'relative border-2 border-gold text-gold'
                    : state === 'later'
                      ? 'border border-edge text-muted'
                      : 'border border-dashed border-line text-muted'
              }`}
            >
              {state === 'done' ? (
                '✓'
              ) : state === 'now' ? (
                <>
                  <span className="absolute inset-[-3px] animate-ring-out rounded-full border border-gold" />
                  ▶
                </>
              ) : state === 'soon' ? (
                '–'
              ) : (
                i + 1
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * All seven courses as coins on one line: finished ones gold, yours ringed,
 * the rest waiting. The words under it say which course you're on.
 */
function CourseStrip({
  completed,
  current,
}: {
  completed: readonly string[];
  current: number;
}) {
  return (
    <ol className="relative flex items-center justify-between">
      <span
        aria-hidden
        className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-line"
      />
      <span
        aria-hidden
        className="absolute left-3 top-1/2 h-px -translate-y-1/2 bg-gold transition-[width] duration-700"
        style={{
          width: `calc((100% - 1.5rem) * ${current / (STAGES.length - 1)})`,
        }}
      />
      {STAGES.map((stage, i) => {
        const live = stage.lessons.filter((id) => lesson(id).status === 'live');
        const done =
          live.length > 0 && live.every((id) => completed.includes(id));
        const state = i === current ? 'now' : done ? 'done' : 'later';
        return (
          <li key={stage.key} className="relative">
            <span className="sr-only">
              {`${stage.title}: ${DESK.courseMark[state]}`}
            </span>
            <span
              aria-hidden
              className={`coin grid place-items-center font-mono type-tick font-bold ${
                state === 'now'
                  ? 'size-9 text-ink ring-2 ring-gold ring-offset-2 ring-offset-panel [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]'
                  : state === 'done'
                    ? 'size-7 text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]'
                    : 'size-7 text-muted'
              }`}
              style={{
                animation: `coin-spin 1000ms var(--ease-out) ${200 + i * 70}ms both`,
              }}
            >
              {state === 'done' ? '✓' : i + 1}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SignalsCard({ className }: { className: string }) {
  const result = useSignals();
  const watch = useWatchlist();
  // The markets they follow first, then the rest; the order within each stays calls-first.
  const followed = new Set(watch.ids ?? []);
  const markets =
    result.state === 'ready'
      ? [
          ...result.data.markets.filter((m) => followed.has(m.market.id)),
          ...result.data.markets.filter((m) => !followed.has(m.market.id)),
        ]
      : [];
  return (
    <Card
      title={DESK.signals.title}
      action={{ href: '/signals', label: DESK.signals.all }}
      live={result.state === 'ready'}
      delay={180}
      className={className}
    >
      {result.state === 'loading' ? (
        <div aria-busy className="space-y-2">
          <p className="sr-only">{DESK.signals.loading}</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-raised" />
          ))}
        </div>
      ) : result.state === 'error' ? (
        <p className="type-small text-fg-2">{DESK.signals.error}</p>
      ) : (
        <>
          {result.data.markets.every((m) => m.now.state === 'wait') ? (
            <p className="mb-2 type-small text-fg-2">{DESK.signals.none}</p>
          ) : null}
          <ul className="divide-y divide-line">
            {markets.slice(0, 5).map((m) => {
              const call =
                m.now.state === 'new'
                  ? m.now.signal
                  : m.now.state === 'open'
                    ? m.now.played
                    : null;
              return (
                <li key={m.market.id}>
                  <Link
                    href={`/signals/${m.market.id}`}
                    className="flex min-h-14 items-center gap-3 py-2 hover:bg-raised/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block type-small font-semibold text-fg">
                        {m.market.name}
                      </span>
                      <span className="block truncate type-tick text-fg-2">
                        {call
                          ? SIGNALS.setup[call.setup]
                          : SIGNALS.trend[m.trend]}
                        {m.now.state === 'open'
                          ? ` · ${SIGNALS.state.open(m.now.played.r)}`
                          : ''}
                        {m.now.state === 'new' ? ` · ${SIGNALS.state.new}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono type-tick font-semibold text-fg num">
                        {formatPrice(m.price, m.market.decimals)}
                      </span>
                      <Change
                        bp={m.dayBp}
                        label={(bp) => formatBp(bp, { signed: true })}
                      />
                    </span>
                    {call ? (
                      <SideTag side={call.side} />
                    ) : (
                      <span className="w-[3.25rem]" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

function PaperCard({ className }: { className: string }) {
  const paper = usePaper();
  const account = paper.state === 'ready' ? paper.account : null;
  const used = account && (account.open.length || account.closed.length);
  return (
    <Card
      title={DESK.paper.title}
      action={used ? { href: '/paper', label: DESK.paper.open } : undefined}
      delay={240}
      className={className}
    >
      {used && account ? (
        <dl className="grid grid-cols-3 gap-2">
          {(
            [
              [
                DESK.paper.value,
                formatMoney({ minor: account.equityMinor, currency: 'USD' }),
              ],
              [
                DESK.paper.returned,
                formatBp(account.returnBp, { signed: true }),
              ],
              [DESK.paper.positions, String(account.open.length)],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-md border border-line bg-ink/40 p-2"
            >
              <dt className="font-mono type-tick text-muted uppercase">
                {label}
              </dt>
              <dd className="mt-0.5 truncate font-mono type-small font-semibold text-fg num">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="type-small text-fg-2">{DESK.paper.empty}</p>
          <Link
            href="/paper"
            className="inline-flex min-h-10 shrink-0 items-center rounded-md border border-edge bg-raised px-3 type-small font-semibold text-fg"
          >
            {DESK.paper.cta}
          </Link>
        </div>
      )}
    </Card>
  );
}

function JournalCard({ className }: { className: string }) {
  const trades = useJournal();
  const stats = journalStats(trades);
  return (
    <Card
      title={DESK.journal.title}
      action={{ href: '/journal', label: DESK.journal.open }}
      delay={300}
      className={className}
    >
      {trades.length ? (
        <>
          <dl className="grid grid-cols-3 gap-2">
            {[
              [DESK.journal.closed, String(stats.closed)],
              [
                DESK.journal.won,
                stats.closed ? formatBp(stats.winRateBp) : '—',
              ],
              [DESK.journal.average, stats.closed ? formatR(stats.avgR) : '—'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-line bg-ink/40 p-2"
              >
                <dt className="font-mono type-tick text-muted uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 font-mono type-small font-semibold text-fg num">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {stats.open ? (
            <p className="mt-2 type-tick text-fg-2">
              {DESK.journal.openTrades(stats.open)}
            </p>
          ) : null}
        </>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="type-small text-fg-2">{DESK.journal.empty}</p>
          <Link
            href="/journal?log=1"
            className="inline-flex min-h-10 shrink-0 items-center rounded-md border border-edge bg-raised px-3 type-small font-semibold text-fg"
          >
            {DESK.journal.cta}
          </Link>
        </div>
      )}
    </Card>
  );
}

export function Dashboard() {
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

  if (!state.loaded) return <DeskSkeleton />;

  const saved = state.saved;
  const fresh = completed.length === 0;
  const nextUp = nextLesson(completed, saved?.placement ?? null);
  const next = nextUp ? lesson(nextUp) : null;
  const stageIndex = stageOf(nextUp, saved?.placement.stage ?? 0);
  const stage = STAGES[stageIndex]!;
  const stageIds: readonly string[] = stage.lessons;
  const stageDone = stage.lessons.filter((id) => completed.includes(id)).length;
  const word = wordOfTheDay();

  return (
    <div className="mx-auto max-w-[1200px] overflow-x-clip px-4 pt-5 pb-8 sm:px-8 lg:pt-8">
      <h1 className="type-title text-fg [perspective:700px] sm:text-[1.625rem] sm:leading-8">
        <SplitWords
          text={
            fresh && !saved?.profile.name
              ? DESK.welcome
              : DESK.greeting(partOfDay(), saved?.profile.name)
          }
        />
      </h1>
      <p
        className="mt-1 animate-page-in type-small text-fg-2"
        style={{ animationDelay: '200ms' }}
      >
        {DESK.lead}
      </p>

      <div className="mt-5 flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:items-start">
        <div className="contents xl:flex xl:flex-col xl:gap-4">
          {!fresh ? (
            <div
              className="order-1 grid animate-page-in grid-cols-3 gap-2 xl:order-none"
              style={{ animationDelay: '60ms' }}
            >
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
                    className={
                      habit.streak.today ? 'animate-flicker' : 'opacity-50'
                    }
                  />
                  {HABIT.streak(habit.streak.current)}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-panel p-3">
                <p className="font-mono type-tick text-muted uppercase">
                  {DESK.level}
                </p>
                <p className="mt-1 type-heading text-fg num">
                  {habit.level.level}
                </p>
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
          ) : null}

          {next ? (
            <div
              className="relative order-2 animate-page-in xl:order-none"
              style={{ animationDelay: '120ms' }}
            >
              {/* A gold light under the one thing to do next. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-3 -z-10 animate-glow rounded-3xl bg-[radial-gradient(ellipse_at_30%_30%,color-mix(in_srgb,var(--color-gold)_18%,transparent),transparent_70%)] blur-xl"
              />
              <Tilt
                max={3}
                className="overflow-hidden rounded-2xl border border-gold bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-gold)_16%,var(--color-panel)),var(--color-panel)_65%)]"
              >
                <Link
                  href={next.playAt ?? '/lessons'}
                  className="group relative block rounded-2xl p-4 sm:p-6"
                >
                  {/* Chart paper in the corner, fading into the card. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_100%_0%,black,transparent_60%)]"
                  />
                  <span className="relative flex items-start gap-4">
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono type-tick text-gold uppercase">
                        {fresh ? DESK.first : DESK.continue}
                        <span className="text-fg-2">
                          {' · '}
                          {DESK.stageOf(stageIndex + 1, STAGES.length)}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[1.5rem] leading-[1.875rem] font-[650] tracking-[-0.015em] text-fg sm:text-[1.875rem] sm:leading-[2.25rem]">
                        {next.title}
                      </span>
                      <span className="mt-1.5 block max-w-[56ch] type-small text-fg-2">
                        {DESK.minutes(next.minutes)} · {next.practice}
                      </span>
                    </span>
                    {/* The course's coin, spinning in face up. */}
                    <span
                      aria-hidden
                      className="hidden shrink-0 [perspective:400px] sm:block"
                    >
                      <span className="coin animate-coin-spin grid size-16 place-items-center font-mono type-title font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]">
                        {stageIndex + 1}
                      </span>
                    </span>
                  </span>
                  {stageIds.includes(next.id) ? (
                    <span className="relative mt-4 block">
                      <span className="mb-2 block font-mono type-tick text-muted uppercase num">
                        {DESK.lessonOf(
                          stageIds.indexOf(next.id) + 1,
                          stageIds.length,
                        )}
                      </span>
                      <LessonTrack
                        ids={stageIds}
                        completed={completed}
                        current={next.id}
                      />
                    </span>
                  ) : null}
                  <span className="btn-3d relative mt-5 flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-md bg-gold type-body font-bold text-ink sm:inline-flex sm:px-8">
                    {/* A glint crossing the button when you point at the card. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,white_45%,transparent),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[520%]"
                    />
                    {fresh ? DESK.start : DESK.resume}
                    <span
                      aria-hidden
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </Tilt>
            </div>
          ) : (
            <p className="order-2 rounded-lg border border-gold bg-gold-soft p-4 type-small text-fg xl:order-none">
              {DESK.allDone}
            </p>
          )}

          {practice.due.length ? (
            <Link
              href="/practice/round"
              className="order-3 flex items-center gap-3 rounded-xl border border-line bg-panel p-3 xl:order-none"
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
              className="order-3 flex items-center gap-3 rounded-xl border border-line bg-panel p-3 xl:order-none"
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

          <Card
            title={DESK.path}
            action={{ href: '/learn', label: DESK.openPath }}
            className="order-5 xl:order-none"
            delay={260}
          >
            <div className="mb-4 px-1 pt-1">
              <CourseStrip completed={completed} current={stageIndex} />
            </div>
            <p className="font-mono type-tick text-gold uppercase">
              {DESK.stageOf(stageIndex + 1, STAGES.length)}
            </p>
            <p className="mt-0.5 type-heading text-fg">{stage.title}</p>
            <p className="mt-1 type-small text-fg-2">{stage.outcome}</p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
                aria-hidden
              >
                <div
                  className="h-full origin-left animate-[grow-x_900ms_var(--ease-out)_400ms_both] rounded-full bg-gold"
                  style={{
                    width: `${(stageDone / stage.lessons.length) * 100}%`,
                  }}
                />
              </div>
              <span className="font-mono type-tick text-muted num">
                {DESK.progress(stageDone, stage.lessons.length)}
              </span>
            </div>
          </Card>

          <Card
            title={DESK.word.title}
            action={{
              href: `/learn/glossary#${termSlug(word.term)}`,
              label: DESK.word.more,
            }}
            className="order-8 xl:order-none"
            delay={340}
          >
            <p className="type-heading text-fg">{word.term}</p>
            <p className="mt-1 type-small text-fg-2">{word.definition}</p>
          </Card>

          {saved?.where === 'device' ? (
            <p className="order-10 rounded-md border border-dashed border-edge p-3 type-small text-fg-2 xl:order-none">
              <Link
                href="/sign-up"
                className="font-semibold text-gold underline underline-offset-4"
              >
                {DESK.account}
              </Link>{' '}
              {DESK.accountWhy}
            </p>
          ) : null}
        </div>

        <div className="contents xl:flex xl:flex-col xl:gap-4">
          <CareGate>
            <SignalsCard className="order-4 xl:order-none" />
          </CareGate>
          <PaperCard className="order-5 xl:order-none" />
          <JournalCard className="order-6 xl:order-none" />
          <Card
            title={DESK.tools.title}
            action={{ href: '/tools', label: DESK.tools.all }}
            className="order-7 xl:order-none"
            delay={360}
          >
            <ul className="grid grid-cols-2 gap-2">
              {DESK.tools.quick.map((id) => (
                <li key={id}>
                  <Link
                    href={`/tools?tool=${id}`}
                    className="flex min-h-12 items-center rounded-lg border border-line bg-ink/40 px-3 type-small font-semibold text-fg hover:border-edge"
                  >
                    {TOOLS.list[id].name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <section className="order-9 rounded-xl border border-dashed border-edge p-4 xl:order-none">
            <h2 className="font-mono type-label text-fg-2">
              {DESK.later.title}
            </h2>
            <p className="mt-1 type-small text-fg-2">{DESK.later.body}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
