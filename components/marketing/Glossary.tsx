'use client';

import Link from 'next/link';
import { useState } from 'react';
import { lesson } from '@/content/curriculum';
import {
  GLOSSARY_GROUPS,
  GLOSSARY_PAGE as C,
  searchGlossary,
  termSlug,
  type GlossaryGroup,
} from '@/content/glossary';

/**
 * The glossary: search as you type, or filter by group. Each word links to
 * the lessons that teach it, and has its own anchor so a lesson or a
 * message can point straight at it (/glossary#spread).
 */
export function Glossary() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<GlossaryGroup | 'all'>('all');
  const shown = searchGlossary(query)
    .filter((t) => group === 'all' || t.group === group)
    .sort((a, b) => (query.trim() ? 0 : a.term.localeCompare(b.term)));
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div className="lg:sticky lg:top-28">
        <label className="block">
          <span className="sr-only">{C.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={C.placeholder}
            className="min-h-12 w-full rounded-md border border-edge bg-raised px-4 type-body text-fg placeholder:text-muted focus:border-gold focus:outline-none"
          />
        </label>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {(
            ['all', ...Object.keys(GLOSSARY_GROUPS)] as (
              | GlossaryGroup
              | 'all'
            )[]
          ).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={group === key}
              onClick={() => setGroup(key)}
              className={`min-h-10 shrink-0 rounded-full border px-3 type-small ${group === key ? 'border-gold bg-gold-soft text-gold' : 'border-edge text-fg-2 hover:text-fg'}`}
            >
              {key === 'all' ? C.all : GLOSSARY_GROUPS[key]}
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono type-tick text-muted" aria-live="polite">
          {C.count(shown.length)}
        </p>
      </div>

      <div className="mt-5 lg:mt-0">
        {shown.length === 0 ? (
          <p className="type-small text-fg-2">{C.none}</p>
        ) : (
          <dl className="grid gap-3 md:grid-cols-2">
            {shown.map((t) => (
              <div
                key={t.term}
                id={termSlug(t.term)}
                className="scroll-mt-28 rounded-xl border border-line bg-panel p-4"
              >
                <dt>
                  <span className="type-heading text-fg">{t.term}</span>
                  <span className="ml-2 font-mono type-tick text-gold uppercase">
                    {GLOSSARY_GROUPS[t.group]}
                  </span>
                </dt>
                <dd className="mt-2 type-small text-fg-2">
                  {t.definition}
                  {t.aka?.length ? (
                    <span className="mt-2 block type-tick text-muted">
                      {C.aka}: {t.aka.join(', ')}
                    </span>
                  ) : null}
                  {t.lessons?.length ? (
                    <span className="mt-3 flex flex-wrap gap-2">
                      {t.lessons.map((id) => {
                        const item = lesson(id);
                        return item.playAt ? (
                          <Link
                            key={id}
                            href={item.playAt}
                            className="inline-flex min-h-9 items-center rounded-md border border-edge px-2.5 type-tick font-semibold text-fg hover:border-gold hover:text-gold"
                          >
                            {C.learn}: {item.title} →
                          </Link>
                        ) : null;
                      })}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
