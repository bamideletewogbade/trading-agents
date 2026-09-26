'use client';

import Link from 'next/link';
import { lesson as lessonById } from '@/content/curriculum';
import { PRACTICE } from '@/content/practice';
import { XP } from '@/lib/progress/habit';
import { SPACING_DAYS } from '@/lib/progress/review';
import { usePractice } from '@/lib/client/practice';

/**
 * The Practice tab: how many mistakes are ready to try again, one button to
 * start, and the queue by lesson. Everything comes from the practice log
 * (lib/client/practice.ts); nothing here is stored on its own.
 */

const spacing = (() => {
  const days = SPACING_DAYS.slice(1).map(String);
  return `${days.slice(0, -1).join(', ')} and ${days.at(-1)}`;
})();

export function PracticeHome() {
  const state = usePractice();
  const due = state.due.length;
  const byLesson = new Map<string, number>();
  for (const item of state.items)
    byLesson.set(item.lesson, (byLesson.get(item.lesson) ?? 0) + 1);
  const dueByLesson = new Map<string, number>();
  for (const item of state.due)
    dueByLesson.set(item.lesson, (dueByLesson.get(item.lesson) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-[560px] space-y-3 px-4 pt-5">
      <h1 className="type-title text-fg">{PRACTICE.title}</h1>
      <p className="type-small text-fg-2">{PRACTICE.lead}</p>

      {state.items.length === 0 && state.learned.length === 0 ? (
        <section className="rounded-xl border border-line bg-panel p-5 text-center">
          <span
            aria-hidden
            className="coin mx-auto grid size-16 place-items-center text-2xl font-bold text-fg-2"
          >
            ↻
          </span>
          <h2 className="mt-4 type-heading text-fg">{PRACTICE.none.title}</h2>
          <p className="mt-2 type-small text-fg-2">{PRACTICE.none.body}</p>
          <Link
            href="/desk"
            className="btn-3d mt-5 flex min-h-12 items-center justify-center rounded-lg bg-gold px-5 type-body font-bold text-ink"
          >
            {PRACTICE.none.cta}
          </Link>
        </section>
      ) : (
        <section
          className={`rounded-xl border p-5 ${due ? 'border-gold bg-gold-soft' : 'border-line bg-panel'}`}
        >
          {due ? (
            <>
              <p className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="coin grid size-14 shrink-0 place-items-center font-mono type-title font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
                >
                  {due}
                </span>
                <span className="type-heading text-fg">
                  {PRACTICE.ready(due)}
                </span>
              </p>
              <Link
                href="/practice/round"
                className="btn-3d mt-5 flex min-h-14 items-center justify-center rounded-lg bg-gold px-5 type-body font-bold text-ink"
              >
                {PRACTICE.start}
              </Link>
            </>
          ) : (
            <>
              <h2 className="type-heading text-fg">✓ {PRACTICE.rest.title}</h2>
              {state.nextInDays !== null ? (
                <p className="mt-1 type-small text-fg-2">
                  {PRACTICE.rest.next(state.nextInDays)}
                </p>
              ) : null}
            </>
          )}
        </section>
      )}

      {state.items.length || state.learned.length ? (
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-line bg-panel p-3">
            <dt className="font-mono type-tick text-muted uppercase">
              {PRACTICE.stats.waiting}
            </dt>
            <dd className="mt-1 type-heading text-fg num">
              {state.items.length}
            </dd>
          </div>
          <div className="rounded-lg border border-line bg-panel p-3">
            <dt className="font-mono type-tick text-muted uppercase">
              {PRACTICE.stats.learned}
            </dt>
            <dd className="mt-1 type-heading text-gold num">
              {state.learned.length}
            </dd>
          </div>
          <div className="rounded-lg border border-line bg-panel p-3">
            <dt className="font-mono type-tick text-muted uppercase">
              {PRACTICE.stats.xp}
            </dt>
            <dd className="mt-1 type-heading text-fg num">
              {state.rights * XP.review}
            </dd>
          </div>
        </dl>
      ) : null}

      {byLesson.size ? (
        <section>
          <h2 className="mt-4 font-mono type-label text-muted">
            {PRACTICE.byLesson}
          </h2>
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
            {[...byLesson.entries()].map(([id, count]) => {
              const ready = dueByLesson.get(id) ?? 0;
              return (
                <li
                  key={id}
                  className="flex min-h-16 items-center gap-3 px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block type-small font-semibold text-fg">
                      {lessonById(id).title}
                    </span>
                    <span className="block font-mono type-tick text-muted">
                      {PRACTICE.count(count)}
                    </span>
                  </span>
                  {ready ? (
                    <Link
                      href={`/practice/round?lesson=${id}`}
                      className="btn-3d inline-flex min-h-10 shrink-0 items-center rounded-md border border-gold bg-raised px-3 type-small font-semibold text-gold [--depth:var(--color-gold-deep)]"
                    >
                      {PRACTICE.practise}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="type-tick text-muted">{PRACTICE.how(spacing)}</p>
    </div>
  );
}
