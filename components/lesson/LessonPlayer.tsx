'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { PLAYER } from '@/content/lessons/widgets';
import { PRACTICE } from '@/content/practice';
import {
  LESSONS,
  STAGES,
  TOPICS,
  lesson as lessonById,
} from '@/content/curriculum';
import type { Beat, LoopTag } from '@/lib/lessons/types';
import { XP, earned, type Goal, type Streak } from '@/lib/progress/habit';
import {
  currentLog,
  habitOf,
  markCompleted,
  useDailyGoal,
} from '@/lib/client/progress';
import { buzz } from '@/lib/client/feel';
import { currentPractice, recordMissed } from '@/lib/client/practice';
import { questionKey } from '@/lib/progress/review';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { ChoiceQuestion } from './ChoiceQuestion';
import { FlameIcon } from '@/components/ui/icons';
import { WIDGETS } from './widgets';

/**
 * Plays one lesson, a beat at a time, full screen: a progress bar, the
 * beat, and a Continue that waits until the beat's one thing is done (a
 * widget used, a question answered). Right answers pop, buzz and earn XP;
 * wrong ones shake and explain. The finish screen spins a coin with the XP
 * earned, the streak and today's goal, then the takeaways and the next
 * lesson.
 *
 * The beats arrive already built by the server (app/(member)/lesson/[id]),
 * so a phone downloads one lesson's words, not all of them, and widgets
 * load only when a beat shows one (./widgets). The header says what kind of
 * thing the lesson is (simulation, historical data, educational), from the
 * curriculum, so no lesson can forget to.
 *
 * The player knows nothing about any particular lesson: adding a lesson
 * never touches this file. Every motion collapses under reduced motion, and
 * none of it carries meaning alone: words say right, wrong and what's next.
 */

const TAG_ICON: Record<LoopTag, string> = {
  see: '◉',
  touch: '✋',
  predict: '?',
  decide: '◆',
  consequence: '▶',
  why: '✦',
  again: '↻',
  check: '✓',
};

function nextLessonId(id: string): string | null {
  const order = STAGES.flatMap((stage) => [...stage.lessons]);
  const after = order.slice(order.indexOf(id as never) + 1);
  return (
    after.find(
      (next) => lessonById(next).status === 'live' && lessonById(next).playAt,
    ) ?? null
  );
}

type Finished = {
  saved: 'saving' | 'server' | 'device';
  xp: number;
  firstTime: boolean;
  streak: Streak | null;
  goal: Goal | null;
  stage: string | null;
};

function Coin3d({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="perspective-1000 mx-auto size-28">
      <div className="coin preserve-3d grid size-28 place-items-center text-ink animate-coin-spin [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]">
        <span className="text-center leading-none">
          <span className="block font-mono text-[1.75rem] font-bold num">
            {label}
          </span>
          <span className="mt-1 block font-mono type-tick font-bold uppercase">
            {sub}
          </span>
        </span>
      </div>
    </div>
  );
}

export function LessonPlayer({
  id,
  beats,
  takeaways,
}: {
  id: string;
  beats: Beat[];
  takeaways: string[];
}) {
  const meta = LESSONS.find((item) => item.id === id);
  const goalTarget = useDailyGoal();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<'next' | 'back'>('next');
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [picks, setPicks] = useState<Record<number, number[]>>({});
  const [pop, setPop] = useState<{
    beat: number;
    option: number;
    at: number;
  } | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);

  if (!meta || beats.length === 0) return null;
  const beat = beats[index]!;
  const choice = beat.kind === 'choice';
  const ready =
    beat.kind === 'say' ||
    beat.kind === 'reflect' ||
    (beat.kind === 'widget' && (!beat.gate || unlocked.has(index))) ||
    (choice && (picks[index]?.length ?? 0) > 0);

  const questions = beats
    .map((b, i) => [b, i] as const)
    .filter(([b]) => b.kind === 'choice');
  const right = questions.filter(([b, i]) => {
    const first = picks[i]?.[0];
    return (
      b.kind === 'choice' && first !== undefined && b.options[first]?.correct
    );
  }).length;
  const sessionXp = right * XP.firstTry;

  function go(to: number) {
    setDir(to > index ? 'next' : 'back');
    setIndex(to);
  }

  async function finish() {
    const score = { right, total: questions.length };
    const before = currentLog();
    // What this finish earns depends on the lesson and the score, not the time.
    const gain = earned(before, { id, at: 0, ...score });
    buzz('done');
    // markCompleted writes the phone's log before it touches the network, so
    // the streak and goal can be shown at once, then "saved" when it lands.
    const saving = markCompleted(id, score);
    const after = habitOf(currentLog(), goalTarget, currentPractice());
    const stage = STAGES.find((s) =>
      (s.lessons as readonly string[]).includes(id),
    );
    const stageDone =
      stage &&
      !before.some((c) => c.id === id) &&
      stage.lessons.every((l) => after.completed.includes(l))
        ? stage.title
        : null;
    setFinished({
      saved: 'saving',
      ...gain,
      streak: after.streak,
      goal: after.goal,
      stage: stageDone,
    });
    const saved = await saving;
    setFinished((current) => (current ? { ...current, saved } : current));
  }

  if (finished) {
    const next = nextLessonId(id);
    return (
      <div className="mx-auto max-w-[560px] overflow-x-clip px-4 py-8 animate-page-in">
        <div className="relative overflow-hidden rounded-2xl border border-gold bg-panel px-5 pt-8 pb-6 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                className={`absolute top-1/3 left-1/2 size-1.5 rounded-full animate-burst ${i % 3 === 0 ? 'bg-gain' : 'bg-gold'}`}
                style={{
                  ['--angle' as string]: `${i * (360 / 18)}deg`,
                  animationDelay: `${300 + (i % 3) * 60}ms`,
                }}
              />
            ))}
          </div>
          <Coin3d
            label={`+${finished.xp}`}
            sub={finished.firstTime ? PLAYER.done.xpUnit : PLAYER.done.replay}
          />
          <span className="sr-only">{PLAYER.done.xp(finished.xp)}</span>
          <p className="mt-5 font-mono type-label text-gold">
            {PLAYER.done.kicker}
          </p>
          <h1 className="mt-1 type-title text-fg">{meta.title}</h1>
          {questions.length ? (
            <p className="mt-1 font-mono type-small text-fg-2 num">
              {PLAYER.done.score(right, questions.length)}
            </p>
          ) : null}
          <div
            className="mt-5 grid grid-cols-2 gap-2 text-left"
            aria-live="polite"
          >
            <div className="rounded-lg border border-line bg-raised p-3">
              <p className="flex items-center gap-1.5 type-small font-semibold text-gold">
                <FlameIcon
                  width={18}
                  height={18}
                  className="shrink-0 animate-flicker"
                />
                {finished.streak
                  ? finished.streak.current <= 1
                    ? PLAYER.done.streakStarted
                    : PLAYER.done.streakDay(finished.streak.current)
                  : '…'}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-raised p-3">
              <p className="type-small font-semibold text-fg">
                {finished.goal
                  ? finished.goal.met
                    ? `✓ ${PLAYER.done.goalMet}`
                    : PLAYER.done.goal(finished.goal.done, finished.goal.goal)
                  : '…'}
              </p>
            </div>
          </div>
          {finished.stage ? (
            <div className="mt-3 rounded-lg border border-gold bg-gold-soft p-3 animate-pop">
              <p className="type-small font-semibold text-fg">
                {PLAYER.done.stage(finished.stage)}
              </p>
              <p className="type-tick text-fg-2">{PLAYER.done.badge}</p>
            </div>
          ) : null}
          <p className="mt-3 font-mono type-tick text-muted">
            {finished.saved === 'saving'
              ? '…'
              : finished.saved === 'server'
                ? `✓ ${PLAYER.done.saved}`
                : `✓ ${PLAYER.done.savedLocal}`}
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-panel p-5">
          <p className="font-mono type-label text-muted">
            {PLAYER.done.remember}
          </p>
          <ul className="mt-3 space-y-2">
            {takeaways.map((line) => (
              <li key={line} className="flex gap-3 type-body text-fg">
                <span aria-hidden className="text-gold">
                  ◆
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5 grid gap-3">
          {next ? (
            <Link
              href={`/lesson/${next}`}
              className="btn-3d flex min-h-14 items-center justify-center rounded-lg bg-gold px-5 text-center type-body font-bold text-ink"
            >
              {PLAYER.done.next}: {lessonById(next).title} →
            </Link>
          ) : null}
          {questions.length > right ? (
            <Link
              href={`/practice/round?lesson=${id}`}
              className="btn-3d flex min-h-12 items-center justify-center rounded-lg border border-gold bg-raised px-4 type-small font-semibold text-gold [--depth:var(--color-gold-deep)]"
            >
              {PRACTICE.missed(questions.length - right)}
            </Link>
          ) : null}
          <Link
            href="/desk"
            className="btn-3d flex min-h-12 items-center justify-center rounded-lg border border-edge bg-raised px-4 type-small font-semibold text-fg [--depth:var(--color-line)]"
          >
            {PLAYER.done.path}
          </Link>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setDir('next');
              setUnlocked(new Set());
              setPicks({});
              setFinished(null);
            }}
            className="min-h-12 type-small text-fg-2 underline underline-offset-4"
          >
            {PLAYER.done.again}
          </button>
        </div>
      </div>
    );
  }

  const Widget = beat.kind === 'widget' ? WIDGETS[beat.widget] : null;
  const last = index === beats.length - 1;
  const progress = ((index + (ready ? 1 : 0.5)) / beats.length) * 100;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col overflow-x-clip">
      <div className="sticky top-0 z-30 border-b border-line bg-ink/92 px-4 pt-3 pb-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/desk"
            className="grid size-10 shrink-0 place-items-center rounded-md text-fg-2 hover:text-fg"
            aria-label={PLAYER.exit}
          >
            ✕
          </Link>
          <span className="sr-only">
            {PLAYER.step(index + 1, beats.length)}
          </span>
          <div
            aria-hidden
            className="h-3 flex-1 overflow-hidden rounded-full bg-line"
          >
            <div
              className="relative h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <span
                aria-hidden
                className="absolute inset-x-2 top-0.5 h-1 rounded-full bg-fg/30"
              />
            </div>
          </div>
          <span
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-line px-2.5 font-mono type-tick font-semibold text-fg num"
            aria-label={PLAYER.xpLabel(sessionXp)}
          >
            <span aria-hidden className="text-gold">
              ◆
            </span>
            {sessionXp}
          </span>
        </div>
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate type-small font-semibold text-fg">
            <span className="font-mono type-tick font-normal text-muted uppercase">
              {TOPICS[meta.topic].label} ·{' '}
            </span>
            {meta.title}
          </p>
          <span className="shrink-0">
            <TruthBadge truth={meta.truth} />
          </span>
        </div>
      </div>

      <div
        key={index}
        className={`flex-1 px-4 py-6 ${dir === 'next' ? 'animate-slide-next' : 'animate-slide-back'}`}
      >
        <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 font-mono type-tick text-gold uppercase">
          <span aria-hidden>{TAG_ICON[beat.tag]}</span>
          {PLAYER.tags[beat.tag]}
        </p>

        {beat.kind === 'say' ? (
          <div className="mt-4">
            <h2 className="type-display text-fg">{beat.title}</h2>
            <p className="mt-3 type-body text-fg-2 sm:text-[1.0625rem] sm:leading-7">
              {beat.body}
            </p>
            {beat.points ? (
              <ul className="mt-4 space-y-2">
                {beat.points.map((point, i) => (
                  <li
                    key={point}
                    className="flex gap-3 rounded-lg border border-line bg-panel p-3 type-body text-fg animate-bubble-in"
                    style={{ animationDelay: `${120 + i * 90}ms` }}
                  >
                    <span aria-hidden className="text-gold">
                      ◆
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {beat.kind === 'widget' && Widget ? (
          <div className="mt-4">
            <h2 className="type-title text-fg">{beat.title}</h2>
            {beat.body ? (
              <p className="mt-2 type-body text-fg-2">{beat.body}</p>
            ) : null}
            <div className="mt-4" data-widget={beat.widget}>
              <Suspense
                fallback={
                  <div className="grid h-56 place-items-center rounded-lg border border-line bg-panel">
                    <span className="font-mono type-tick text-muted">
                      {PLAYER.loading}
                    </span>
                  </div>
                }
              >
                <Widget
                  props={beat.props}
                  onDone={() =>
                    setUnlocked((set) =>
                      set.has(index) ? set : new Set(set).add(index),
                    )
                  }
                />
              </Suspense>
            </div>
          </div>
        ) : null}

        {beat.kind === 'choice' ? (
          <ChoiceQuestion
            prompt={beat.prompt}
            options={beat.options}
            picks={picks[index] ?? []}
            pop={pop?.beat === index ? pop : null}
            xp={XP.firstTry}
            onPick={(i) => {
              const first = (picks[index]?.length ?? 0) === 0;
              const option = beat.options[i];
              setPicks((all) => ({
                ...all,
                [index]: [...(all[index] ?? []).filter((p) => p !== i), i],
              }));
              if (option?.correct) {
                buzz('right');
                if (first) setPop({ beat: index, option: i, at: Date.now() });
              } else {
                buzz('wrong');
                // A wrong first answer joins the practice queue.
                if (first) recordMissed(id, questionKey(id, beat.prompt));
              }
            }}
          />
        ) : null}

        {beat.kind === 'reflect' ? (
          <label className="mt-4 block">
            <span className="type-title text-fg">{beat.prompt}</span>
            <textarea
              rows={4}
              placeholder={beat.placeholder}
              className="mt-3 w-full rounded-md border border-edge bg-panel p-3 type-body text-fg outline-none focus:border-gold"
            />
          </label>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-ink/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex gap-2">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="btn-3d min-h-12 shrink-0 rounded-lg border border-edge bg-raised px-4 type-small font-semibold text-fg [--depth:var(--color-line)]"
            >
              {PLAYER.back}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!ready}
            onClick={() => (last ? void finish() : go(index + 1))}
            className="btn-3d min-h-12 flex-1 rounded-lg bg-gold px-5 type-body font-bold text-ink disabled:bg-raised disabled:text-muted"
          >
            {ready
              ? last
                ? PLAYER.finish
                : PLAYER.continue
              : choice
                ? PLAYER.answer
                : PLAYER.locked}
          </button>
        </div>
      </div>
    </div>
  );
}
