'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LESSON_DEFS } from '@/content/lessons';
import { PLAYER } from '@/content/lessons/widgets';
import {
  LESSONS,
  STAGES,
  TOPICS,
  lesson as lessonById,
} from '@/content/curriculum';
import type { Beat, LoopTag } from '@/lib/lessons/types';
import { markCompleted } from '@/lib/client/progress';
import { WIDGETS } from './widgets';

/**
 * Plays one lesson, a beat at a time: a progress bar, the beat, and a
 * Continue that waits until the beat's one thing is done (a widget used, a
 * question answered). The finish screen shows the takeaways, saves the
 * lesson as done, and offers the next one on the roadmap.
 *
 * The player knows nothing about any particular lesson. Everything it
 * shows comes from content/lessons (words and structure) and the widgets
 * (interaction), so adding a lesson never touches this file.
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
      (next) => lessonById(next).status === 'live' && LESSON_DEFS[next],
    ) ?? null
  );
}

export function LessonPlayer({ id }: { id: string }) {
  const def = LESSON_DEFS[id];
  const meta = LESSONS.find((item) => item.id === id);
  const beats = useMemo<Beat[]>(() => (def ? def.beats() : []), [def]);
  const [index, setIndex] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [picks, setPicks] = useState<Record<number, number[]>>({});
  const [finished, setFinished] = useState<
    null | 'saving' | 'server' | 'device'
  >(null);

  if (!def || !meta) return null;
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

  async function finish() {
    setFinished('saving');
    setFinished(await markCompleted(id, { right, total: questions.length }));
  }

  if (finished) {
    const next = nextLessonId(id);
    return (
      <div className="mx-auto max-w-[640px] px-4 py-10 animate-page-in">
        <div className="relative overflow-hidden rounded-2xl border border-gold bg-panel p-6 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-gold animate-burst"
                style={{
                  ['--angle' as string]: `${i * (360 / 14)}deg`,
                  animationDelay: `${(i % 3) * 40}ms`,
                }}
              />
            ))}
          </div>
          <p className="font-mono type-label text-gold">{PLAYER.done.kicker}</p>
          <h1 className="mt-2 type-display text-fg">{meta.title}</h1>
          {questions.length ? (
            <p className="mt-2 font-mono type-small text-fg-2 num">
              {PLAYER.done.score(right, questions.length)}
            </p>
          ) : null}
          <p className="mt-1 font-mono type-tick text-muted">
            {finished === 'saving'
              ? '…'
              : finished === 'server'
                ? `✓ ${PLAYER.done.saved}`
                : `✓ ${PLAYER.done.savedLocal}`}
          </p>
        </div>
        <div className="mt-6 rounded-lg border border-line bg-panel p-5">
          <p className="font-mono type-label text-muted">
            {PLAYER.done.remember}
          </p>
          <ul className="mt-3 space-y-2">
            {def.takeaways.map((line) => (
              <li key={line} className="flex gap-3 type-body text-fg">
                <span aria-hidden className="text-gold">
                  ◆
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 grid gap-2">
          {next ? (
            <Link
              href={`/lesson/${next}`}
              className="flex min-h-12 items-center justify-center rounded-md bg-gold px-5 type-body font-semibold text-ink"
            >
              {PLAYER.done.next}: {lessonById(next).title} →
            </Link>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/roadmap"
              className="flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
            >
              {PLAYER.done.roadmap}
            </Link>
            <Link
              href="/desk"
              className="flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
            >
              {PLAYER.done.desk}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
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

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[720px] flex-col">
      <div className="sticky top-16 z-30 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/roadmap"
            className="grid size-10 shrink-0 place-items-center rounded-md border border-edge text-fg-2 hover:text-fg"
            aria-label={PLAYER.exit}
          >
            ✕
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono type-tick text-muted uppercase">
              {TOPICS[meta.topic].label}
            </p>
            <p className="truncate type-small font-semibold text-fg">
              {meta.title}
            </p>
          </div>
          <span className="shrink-0 font-mono type-tick text-fg-2 num">
            {PLAYER.step(index + 1, beats.length)}
          </span>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {beats.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < index ? 'bg-gold' : i === index ? 'bg-gold/60' : 'bg-line'}`}
            />
          ))}
        </div>
      </div>

      <div key={index} className="flex-1 px-4 py-6 animate-bubble-in">
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
                {beat.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 rounded-md border border-line bg-panel p-3 type-body text-fg"
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
              <Widget
                props={beat.props}
                onDone={() =>
                  setUnlocked((set) =>
                    set.has(index) ? set : new Set(set).add(index),
                  )
                }
              />
            </div>
          </div>
        ) : null}

        {beat.kind === 'choice' ? (
          <fieldset className="mt-4">
            <legend className="type-title text-fg">{beat.prompt}</legend>
            <div className="mt-4 space-y-2">
              {beat.options.map((option, i) => {
                const chosen = Boolean(picks[index]?.includes(i));
                const latest = picks[index]?.at(-1) === i;
                return (
                  <div key={option.label}>
                    <button
                      type="button"
                      aria-pressed={chosen}
                      onClick={() =>
                        setPicks((all) => ({
                          ...all,
                          [index]: [
                            ...(all[index] ?? []).filter((p) => p !== i),
                            i,
                          ],
                        }))
                      }
                      className={`flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left type-body transition-colors ${chosen ? (option.correct ? 'border-gold bg-gold-soft text-fg' : 'border-loss bg-panel text-fg') : 'border-edge bg-raised text-fg hover:border-fg-2'}`}
                    >
                      <span
                        aria-hidden
                        className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono type-small ${chosen ? (option.correct ? 'border-gold bg-gold text-ink' : 'border-loss text-loss') : 'border-edge text-fg-2'}`}
                      >
                        {chosen
                          ? option.correct
                            ? '✓'
                            : '✕'
                          : String.fromCharCode(65 + i)}
                      </span>
                      <span className="min-w-0">{option.label}</span>
                    </button>
                    {latest ? (
                      <p
                        className={`mt-2 ml-10 type-small animate-bubble-in ${option.correct ? 'text-fg' : 'text-fg-2'}`}
                        aria-live="polite"
                      >
                        <span
                          className={`font-semibold ${option.correct ? 'text-gold' : 'text-loss'}`}
                        >
                          {option.correct ? PLAYER.right : PLAYER.notQuite}.
                        </span>{' '}
                        {option.feedback}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>
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
              onClick={() => setIndex((n) => n - 1)}
              className="min-h-12 shrink-0 rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
            >
              {PLAYER.back}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!ready}
            onClick={() => (last ? void finish() : setIndex((n) => n + 1))}
            className="min-h-12 flex-1 rounded-md bg-gold px-5 type-body font-semibold text-ink active:scale-[0.98] disabled:opacity-40"
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
