'use client';

import { useState } from 'react';
import { LANDING } from '@/content/landing';
import {
  LEVELS,
  LESSONS,
  STAGES,
  TOPICS,
  lesson,
  type Lesson,
  type Topic,
} from '@/content/curriculum';

/**
 * The roadmap and the single-lesson library, drawn from one list
 * (content/curriculum.ts). Two tabs over the same lessons: the path in order,
 * or any lesson on its own, filtered by topic.
 */

const COPY = LANDING.curriculum;

const STATUS_STYLE: Record<Lesson['status'], string> = {
  live: 'border-gold bg-gold text-ink',
  next: 'border-info text-info',
  planned: 'border-edge text-fg-2',
};

function StatusChip({ status }: { status: Lesson['status'] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 font-mono type-tick uppercase ${STATUS_STYLE[status]}`}
    >
      {status === 'live' ? '▶ ' : status === 'next' ? '◐ ' : '○ '}
      {COPY.status[status]}
    </span>
  );
}

function LessonCard({ item }: { item: Lesson }) {
  const needs = item.needs?.map((id) => lesson(id).title);
  return (
    <li className="rounded-md border border-line bg-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 type-body font-semibold text-fg">
          {item.title}
        </h4>
        <StatusChip status={item.status} />
      </div>
      <p className="mt-1 type-small text-fg-2">{item.practice}</p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono type-tick text-muted">
        <span>{COPY.minutes(item.minutes)}</span>
        <span>{LEVELS[item.level]}</span>
        <span>{COPY.truth[item.truth]}</span>
      </p>
      {needs?.length ? (
        <p className="mt-1 type-tick text-muted">
          {COPY.needs}: {needs.join(' · ')}
        </p>
      ) : null}
      {item.playAt ? (
        <a
          href={item.playAt}
          className="mt-3 inline-flex min-h-12 items-center rounded-md border border-gold px-4 type-small font-semibold text-gold"
        >
          {COPY.status.live} →
        </a>
      ) : null}
    </li>
  );
}

export function Curriculum() {
  const [tab, setTab] = useState<'path' | 'single'>('path');
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [open, setOpen] = useState<string>(STAGES[0].key);

  const filtered =
    topic === 'all' ? LESSONS : LESSONS.filter((item) => item.topic === topic);

  return (
    <div>
      <div
        role="tablist"
        className="grid grid-cols-2 rounded-md border border-line bg-panel p-1"
      >
        {(['path', 'single'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-12 rounded-sm type-small font-semibold ${tab === key ? 'bg-raised text-fg' : 'text-fg-2'}`}
          >
            {COPY.tabs[key]}
          </button>
        ))}
      </div>

      {tab === 'path' ? (
        <div className="mt-6">
          <p className="mb-4 border-l-2 border-gold pl-3 type-small text-fg-2">
            {COPY.riskFirst}
          </p>
          <ol className="relative space-y-3 before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-px before:bg-line">
            {STAGES.map((stage, index) => {
              const expanded = open === stage.key;
              const items = stage.lessons.map((id) => lesson(id));
              const live = items.filter(
                (item) => item.status === 'live',
              ).length;
              return (
                <li key={stage.key} className="relative">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? '' : stage.key)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span
                      className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border font-mono type-small font-semibold ${live ? 'border-gold bg-gold text-ink' : 'border-edge bg-panel text-fg'}`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 rounded-md border border-line bg-panel p-3">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="type-body font-semibold text-fg">
                          {stage.title}
                        </span>
                        <span className="shrink-0 font-mono type-tick text-muted">
                          {COPY.lessonsCount(items.length)}
                          {expanded ? ' ▴' : ' ▾'}
                        </span>
                      </span>
                      <span className="mt-1 block type-small text-fg-2">
                        {stage.outcome}
                      </span>
                    </span>
                  </button>
                  {expanded ? (
                    <ul className="mt-3 space-y-2 pl-[52px]">
                      {items.map((item) => (
                        <LessonCard key={item.id} item={item} />
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="mt-6">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{COPY.tabs.single}</legend>
            {(['all', ...Object.keys(TOPICS)] as (Topic | 'all')[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={topic === key}
                  onClick={() => setTopic(key)}
                  className={`min-h-12 rounded-full border px-3 type-small ${topic === key ? 'border-gold bg-gold-soft text-gold' : 'border-edge text-fg-2'}`}
                >
                  {key === 'all' ? COPY.all : TOPICS[key].label}
                </button>
              ),
            )}
          </fieldset>
          {topic !== 'all' ? (
            <p className="mt-3 type-small text-fg-2">{TOPICS[topic].blurb}</p>
          ) : null}
          <ul className="mt-4 grid gap-2 lg:grid-cols-2">
            {filtered.map((item) => (
              <LessonCard key={item.id} item={item} />
            ))}
          </ul>
          <div className="mt-6 rounded-md border border-dashed border-edge p-4">
            <p className="type-body font-semibold text-fg">
              {COPY.placement.title}
            </p>
            <p className="mt-1 type-small text-fg-2">{COPY.placement.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
