'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PRACTICE } from '@/content/practice';
import { XP, type Streak } from '@/lib/progress/habit';
import {
  ROUND_SIZE,
  type Item,
  type PracticeQuestion,
} from '@/lib/progress/review';
import { currentLog, habitOf } from '@/lib/client/progress';
import {
  currentPractice,
  practiceState,
  recordReview,
} from '@/lib/client/practice';
import { buzz } from '@/lib/client/feel';
import { sessionHeaders } from '@/lib/client/session';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { FlameIcon } from '@/components/ui/icons';

/**
 * A practice round: up to five questions the learner got wrong before,
 * oldest first, shown exactly as they were in the lesson. The first answer
 * to each is what counts (lib/progress/review.ts moves it along or starts
 * it again); after that they can keep picking to see why. Then a coin with
 * the XP, what was learned for good, and the streak.
 *
 * The round is fixed when it starts: answering changes the queue, but not
 * the questions on screen. Questions come from /api/questions, built on the
 * server from the lessons, so the phone never downloads every lesson.
 */

type Phase = 'loading' | 'empty' | 'play' | 'done';

/** The questions due now (up to a round's worth), fetched from the server. */
async function fetchRound(
  lesson?: string,
): Promise<{ items: Item[]; questions: PracticeQuestion[] }> {
  const due = practiceState(currentPractice(), lesson).due.slice(0, ROUND_SIZE);
  if (due.length === 0) return { items: [], questions: [] };
  try {
    const response = await fetch(
      `/api/questions?keys=${due.map((item) => item.key).join(',')}`,
      {
        headers: await sessionHeaders(),
        signal: AbortSignal.timeout(8_000),
      },
    );
    const body = (await response.json()) as { questions?: PracticeQuestion[] };
    return { items: due, questions: body.questions ?? [] };
  } catch {
    return { items: due, questions: [] };
  }
}

export function PracticeRound({ lesson }: { lesson?: string }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<Item[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<number, number[]>>({});
  const [pop, setPop] = useState<{
    index: number;
    option: number;
    at: number;
  } | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);

  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    void fetchRound(lesson).then((next) => {
      if (!live) return;
      setItems(next.items);
      setQuestions(next.questions);
      setIndex(0);
      setPicks({});
      setPop(null);
      setPhase(next.questions.length ? 'play' : 'empty');
    });
    return () => {
      live = false;
    };
  }, [lesson, round]);

  const start = () => {
    setPhase('loading');
    setRound((n) => n + 1);
  };

  const firstRight = (i: number) => {
    const first = picks[i]?.[0];
    return (
      first !== undefined && Boolean(questions[i]?.options[first]?.correct)
    );
  };
  const answered = questions.map((_, i) => (picks[i]?.length ?? 0) > 0);
  const right = questions.filter((_, i) => firstRight(i)).length;
  const learned = questions.filter((q, i) => {
    const item = items.find((it) => it.key === q.key);
    return firstRight(i) && item && item.box >= 3;
  }).length;

  if (phase === 'loading')
    return (
      <p className="px-4 py-24 text-center font-mono type-small text-muted">
        {PRACTICE.round.loading}
      </p>
    );

  if (phase === 'empty')
    return (
      <div className="mx-auto max-w-[520px] px-4 py-20 text-center">
        <h1 className="type-title text-fg">{PRACTICE.round.empty.title}</h1>
        <p className="mt-3 type-body text-fg-2">{PRACTICE.round.empty.body}</p>
        <Link
          href="/practice"
          className="btn-3d mt-6 inline-flex min-h-12 items-center rounded-lg bg-gold px-6 type-body font-bold text-ink"
        >
          {PRACTICE.round.empty.cta}
        </Link>
      </div>
    );

  if (phase === 'done') {
    const more = practiceState(currentPractice(), lesson).due.length > 0;
    return (
      <div className="mx-auto max-w-[560px] overflow-x-clip px-4 py-8 animate-page-in">
        <div className="relative overflow-hidden rounded-2xl border border-gold bg-panel px-5 pt-8 pb-6 text-center">
          <div className="perspective-1000 mx-auto size-28">
            <div className="coin preserve-3d grid size-28 place-items-center text-ink animate-coin-spin [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]">
              <span className="text-center leading-none">
                <span className="block font-mono text-[1.75rem] font-bold num">
                  +{right * XP.review}
                </span>
                <span className="mt-1 block font-mono type-tick font-bold uppercase">
                  XP
                </span>
              </span>
            </div>
          </div>
          <p className="mt-5 font-mono type-label text-gold">
            {PRACTICE.round.done.kicker}
          </p>
          <p className="mt-1 type-title text-fg num">
            {PRACTICE.round.done.score(right, questions.length)}
          </p>
          <div className="mt-4 grid gap-2 text-left" aria-live="polite">
            {learned ? (
              <p className="rounded-lg border border-gold bg-gold-soft p-3 type-small font-semibold text-fg animate-pop">
                ✓ {PRACTICE.round.done.learned(learned)}
              </p>
            ) : null}
            <p className="flex items-center gap-1.5 rounded-lg border border-line bg-raised p-3 type-small font-semibold text-gold">
              <FlameIcon
                width={18}
                height={18}
                className="shrink-0 animate-flicker"
              />
              {streak && streak.current > 1
                ? PRACTICE.round.done.streak(streak.current)
                : PRACTICE.round.done.kept}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {more ? (
            <button
              type="button"
              onClick={start}
              className="btn-3d flex min-h-14 items-center justify-center rounded-lg bg-gold px-5 type-body font-bold text-ink"
            >
              {PRACTICE.round.done.more}
            </button>
          ) : null}
          <Link
            href="/practice"
            className={`btn-3d flex min-h-12 items-center justify-center rounded-lg px-4 type-small font-semibold ${more ? 'border border-edge bg-raised text-fg [--depth:var(--color-line)]' : 'bg-gold text-ink'}`}
          >
            {PRACTICE.round.done.back}
          </Link>
          <Link
            href="/desk"
            className="flex min-h-12 items-center justify-center type-small text-fg-2 underline underline-offset-4"
          >
            {PRACTICE.round.done.path}
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[index]!;
  const last = index === questions.length - 1;
  const ready = answered[index];
  const progress = ((index + (ready ? 1 : 0.5)) / questions.length) * 100;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col overflow-x-clip">
      <div className="sticky top-0 z-30 border-b border-line bg-ink/92 px-4 pt-3 pb-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/practice"
            className="grid size-10 shrink-0 place-items-center rounded-md text-fg-2 hover:text-fg"
            aria-label={PRACTICE.round.exit}
          >
            ✕
          </Link>
          <span className="sr-only">
            {PRACTICE.round.step(index + 1, questions.length)}
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
            aria-label={PRACTICE.round.xpLabel(right * XP.review)}
          >
            <span aria-hidden className="text-gold">
              ◆
            </span>
            {right * XP.review}
          </span>
        </div>
        <p className="mt-2 truncate font-mono type-tick text-muted uppercase">
          {PRACTICE.round.step(index + 1, questions.length)} ·{' '}
          {PRACTICE.round.from(question.lessonTitle)}
        </p>
      </div>

      <div key={index} className="flex-1 px-4 py-6 animate-slide-next">
        <ChoiceQuestion
          prompt={question.prompt}
          options={question.options}
          picks={picks[index] ?? []}
          pop={pop?.index === index ? pop : null}
          xp={XP.review}
          onPick={(i) => {
            const first = (picks[index]?.length ?? 0) === 0;
            const correct = Boolean(question.options[i]?.correct);
            setPicks((all) => ({
              ...all,
              [index]: [...(all[index] ?? []).filter((p) => p !== i), i],
            }));
            buzz(correct ? 'right' : 'wrong');
            if (!first) return;
            // Only the first answer moves the question along the schedule.
            recordReview(question.lesson, question.key, correct);
            if (correct) setPop({ index, option: i, at: Date.now() });
          }}
        />
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-ink/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            if (!last) {
              setIndex((n) => n + 1);
              return;
            }
            buzz('done');
            setStreak(habitOf(currentLog(), 1, currentPractice()).streak);
            setPhase('done');
          }}
          className="btn-3d min-h-12 w-full rounded-lg bg-gold px-5 type-body font-bold text-ink disabled:bg-raised disabled:text-muted"
        >
          {ready
            ? last
              ? PRACTICE.round.finish
              : PRACTICE.round.next
            : PRACTICE.round.answer}
        </button>
      </div>
    </div>
  );
}
