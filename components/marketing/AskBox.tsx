'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LANDING } from '@/content/landing';
import { TOPICS } from '@/content/curriculum';
import { searchLessons, type Match } from '@/lib/curriculum/search';

/**
 * The open-ended box: type what you want to understand, in your own words,
 * and the lessons that teach it appear as cards underneath. The answer is
 * composed from the registered curriculum (lib/curriculum/search.ts), never
 * invented, so it can't point at a lesson that doesn't exist.
 *
 * The placeholder cycles through real questions people ask, so an empty box
 * still shows what it's for.
 */

const COPY = LANDING.ask;

export function AskBox({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [hint, setHint] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) return;
    const timer = window.setInterval(
      () => setHint((n) => (n + 1) % COPY.placeholders.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, []);

  const matches: Match[] = asked ? searchLessons(asked) : [];

  return (
    <div className={compact ? '' : 'mt-8'}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setAsked(query.trim() || COPY.placeholders[hint] || '');
        }}
        className="group relative rounded-lg border border-edge bg-panel p-1.5 transition-colors focus-within:border-gold"
      >
        <label htmlFor="ask" className="sr-only">
          {COPY.label}
        </label>
        <div className="flex items-center gap-2">
          <span aria-hidden className="pl-2 font-mono text-gold">
            ›
          </span>
          <input
            id="ask"
            name="ask"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={COPY.placeholders[hint]}
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-12 min-w-0 flex-1 bg-transparent type-body text-fg outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-md bg-gold px-4 type-small font-semibold text-ink"
          >
            {COPY.go}
          </button>
        </div>
      </form>
      <p className="mt-2 type-small text-muted">{COPY.hint}</p>

      {asked !== null ? (
        <div className="mt-4" aria-live="polite">
          {matches.length === 0 ? (
            <p className="rounded-md border border-dashed border-edge p-4 type-small text-fg-2">
              {COPY.none}
            </p>
          ) : (
            <>
              <p className="mb-2 font-mono type-tick text-muted uppercase">
                {COPY.results(matches.length)} · “{asked}”
              </p>
              <ul className="grid gap-2">
                {matches.map(({ lesson }, i) => (
                  <li
                    key={lesson.id}
                    className="animate-bubble-in rounded-md border border-line bg-panel p-4"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <p className="font-mono type-tick text-gold uppercase">
                      {TOPICS[lesson.topic].label}
                    </p>
                    <p className="mt-1 type-body font-semibold text-fg">
                      {lesson.title}
                    </p>
                    <p className="mt-1 type-small text-fg-2">
                      {lesson.practice}
                    </p>
                    <Link
                      href={lesson.playAt ?? '/roadmap'}
                      className={`mt-3 inline-flex min-h-11 items-center rounded-md px-4 type-small font-semibold ${lesson.playAt ? 'bg-gold text-ink' : 'border border-edge text-fg'}`}
                    >
                      {lesson.playAt ? COPY.play : COPY.open} →
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
