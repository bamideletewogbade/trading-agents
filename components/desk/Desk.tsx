'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DESK } from '@/content/desk';
import { ONBOARDING } from '@/content/onboarding';
import { STAGES, TOPICS, lesson } from '@/content/curriculum';
import { loadProfile, type Saved } from '@/lib/client/profile';
import { Reveal } from '@/components/motion/Reveal';

/**
 * The desk: where a learner lands after onboarding, and every visit after.
 * Reads the profile (server first, then the phone's copy) and shows where
 * they start, their first three lessons, and the roadmap with their stage
 * marked. It holds no rules of its own: placement comes from
 * lib/onboarding/flow.ts, lessons from content/curriculum.ts.
 */

function partOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

export function Desk() {
  const [state, setState] = useState<{ loaded: boolean; saved: Saved | null }>({
    loaded: false,
    saved: null,
  });

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
  if (!saved)
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
        <span
          aria-hidden
          className="mx-auto grid size-14 place-items-center rounded-full bg-gold font-mono type-title font-bold text-ink"
        >
          S
        </span>
        <h1 className="mt-5 type-display text-fg">{DESK.empty.title}</h1>
        <p className="mt-3 type-body text-fg-2">{DESK.empty.body}</p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
        >
          {DESK.empty.cta}
        </Link>
      </div>
    );

  const { profile, placement } = saved;
  const stage = STAGES[placement.stage];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8">
      <Reveal>
        <p className="font-mono type-label text-gold">{DESK.meta.title}</p>
        <h1 className="mt-2 text-[2.25rem] leading-[2.5rem] font-[700] tracking-[-0.03em] text-fg sm:text-[3rem] sm:leading-[3.25rem]">
          {DESK.greeting(partOfDay(), profile.name)}
        </h1>
        <p className="mt-3 type-body text-fg-2">
          {DESK.start(placement.stage + 1, stage?.title ?? '')}
        </p>
        {placement.reasons.map((reason) => (
          <p key={reason} className="mt-1 type-small text-muted">
            {ONBOARDING.summary.reasons[reason]}
          </p>
        ))}
      </Reveal>

      {saved.where === 'device' ? (
        <p className="mt-6 rounded-md border border-dashed border-edge p-4 type-small text-fg-2">
          {DESK.device}{' '}
          <Link
            href="/sign-up"
            className="font-semibold text-gold underline underline-offset-4"
          >
            {DESK.account}
          </Link>
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-mono type-label text-muted">{DESK.next}</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {placement.lessons.map((id, i) => {
            const item = lesson(id);
            return (
              <Reveal
                as="li"
                key={id}
                delay={i * 80}
                className={`flex flex-col rounded-lg border bg-panel p-5 ${i === 0 ? 'border-gold' : 'border-line'}`}
              >
                <p className="font-mono type-tick text-gold uppercase">
                  {i + 1} · {TOPICS[item.topic].label}
                </p>
                <p className="mt-2 type-heading text-fg">{item.title}</p>
                <p className="mt-2 flex-1 type-small text-fg-2">
                  {item.practice}
                </p>
                {item.playAt ? (
                  <Link
                    href={item.playAt}
                    className={`mt-4 inline-flex min-h-12 items-center justify-center rounded-md px-5 type-body font-semibold ${i === 0 ? 'bg-gold text-ink' : 'border border-edge bg-raised text-fg'}`}
                  >
                    {DESK.play} →
                  </Link>
                ) : (
                  <p className="mt-4 font-mono type-tick text-muted uppercase">
                    ◐ {DESK.soon}
                  </p>
                )}
              </Reveal>
            );
          })}
        </ol>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-mono type-label text-muted">{DESK.path}</h2>
          <ol className="mt-3 space-y-2">
            {STAGES.map((item, i) => (
              <li
                key={item.key}
                className={`flex items-center gap-3 rounded-md border p-3 ${i === placement.stage ? 'border-gold bg-gold-soft' : 'border-line bg-panel'} ${i < placement.stage ? 'opacity-60' : ''}`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full border font-mono type-small ${i === placement.stage ? 'border-gold bg-gold text-ink' : 'border-edge text-fg-2'}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 type-small font-semibold text-fg">
                  {item.title}
                </span>
                {i === placement.stage ? (
                  <span className="shrink-0 font-mono type-tick text-gold uppercase">
                    {DESK.here}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex min-h-11 items-center type-small text-fg-2 underline underline-offset-4 hover:text-fg"
          >
            {DESK.redo}
          </Link>
        </div>
        <div>
          <h2 className="font-mono type-label text-muted">
            {DESK.quick.title}
          </h2>
          <ul className="mt-3 space-y-2">
            {DESK.quick.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex min-h-14 items-center justify-between gap-3 rounded-md border border-line bg-panel px-4 py-3 transition-colors hover:border-gold"
                >
                  <span>
                    <span className="block type-small font-semibold text-fg">
                      {item.label}
                    </span>
                    <span className="block type-tick text-muted">
                      {item.note}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-gold transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
