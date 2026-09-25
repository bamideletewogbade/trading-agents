'use client';

import { useEffect, useRef, useState } from 'react';
import { PLAY } from '@/content/copy/play';
import {
  eventLine,
  money,
  type PaydayScenario,
} from '@/content/scenarios/payday';
import type { Beat } from '@/lib/engines/payday';
import { Button } from '@/components/ui/Button';
import { WarningIcon } from '@/components/ui/icons';

/**
 * The month, played (plan §8, 1:00). One beat about every 1.4 seconds, so a
 * month takes around fifteen: long enough to feel the money going, short
 * enough not to bore. Motion here is the lesson (spec §16): three balances
 * that visibly drain, and the day something breaks.
 *
 * Always skippable. With reduced motion there is no playback at all: the
 * whole month appears as a list, which says the same thing.
 */

const BEAT_MS = 1400;

export function MonthPlayer({
  scenario,
  beats,
  onDone,
}: {
  scenario: PaydayScenario;
  beats: readonly Beat[];
  onDone: () => void;
}) {
  const fmt = money(scenario.config.currency);
  const [shown, setShown] = useState(0);
  const finished = shown >= beats.length;
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timer = window.setInterval(
      () => setShown((count) => (count >= beats.length ? count : count + 1)),
      reduce ? 0 : BEAT_MS,
    );
    return () => window.clearInterval(timer);
  }, [beats.length]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [shown]);

  const current = beats[Math.max(0, shown - 1)];
  const after = current?.after ?? { spend: 0, savings: 0, debt: 0 };
  const day = current?.event.day ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="num type-display text-fg" aria-live="polite">
          {PLAY.month.day(day)}
        </p>
        <p className="num type-small text-muted">/ 30</p>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-raised"
        aria-hidden
      >
        <div
          className="h-full bg-gold transition-[width] duration-(--duration-slow) ease-out"
          style={{ width: `${(day / 30) * 100}%` }}
        />
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {[
          [PLAY.month.spending, fmt(after.spend), 'text-fg'],
          [PLAY.month.savings, fmt(after.savings), 'text-fg'],
          [
            PLAY.month.owed,
            fmt(after.debt),
            after.debt > 0 ? 'text-loss' : 'text-fg',
          ],
        ].map(([label, value, tone]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-panel p-2.5"
          >
            <dt className="type-label text-muted">{label}</dt>
            <dd className={`mt-1 num truncate type-body font-semibold ${tone}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <ol
        ref={listRef}
        className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto"
        aria-live="polite"
      >
        {beats.slice(0, shown).map((beat, index) => {
          const shock = beat.event.kind === 'shock';
          const borrowed =
            'covered' in beat.event && beat.event.covered.loan > 0;
          return (
            <li
              key={index}
              className={`flex gap-3 rounded-md border p-3 motion-safe:animate-[rise_var(--duration-slow)_var(--ease-out)] ${
                shock
                  ? 'border-gold bg-gold-soft'
                  : borrowed
                    ? 'border-loss/60 bg-panel'
                    : 'border-line bg-panel'
              }`}
            >
              <span className="num w-8 shrink-0 type-small font-semibold text-muted">
                {beat.event.day}
              </span>
              <p className="min-w-0 flex-1 type-small text-fg">
                {shock ? (
                  <WarningIcon
                    width={16}
                    height={16}
                    className="mr-1 inline-block align-[-3px] text-gold"
                  />
                ) : null}
                {eventLine(beat.event, scenario)}
                {borrowed ? (
                  <span className="ml-1 font-semibold text-loss">
                    ({PLAY.month.borrowed})
                  </span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>

      {finished ? (
        <Button kind="primary" block onClick={onDone}>
          {PLAY.result.heading}
        </Button>
      ) : (
        <Button kind="quiet" block onClick={() => setShown(beats.length)}>
          {PLAY.month.skip}
        </Button>
      )}
    </div>
  );
}
