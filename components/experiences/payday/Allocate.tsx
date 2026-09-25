'use client';

import { PLAY } from '@/content/copy/play';
import { money, type PaydayScenario } from '@/content/scenarios/payday';
import {
  BUCKETS,
  setBucket,
  unplaced,
  type Bucket,
  type Split,
} from '@/lib/engines/payday';
import { Button } from '@/components/ui/Button';
import { AllocationBar, BUCKET_SWATCH } from './AllocationBar';

/**
 * Splitting the month's income (plan §8, 0:20). Built for one thumb: a − and
 * + per place (one chip each), plus shortcuts that do what most people want
 * in one tap: match what rent and family asked for, and put the rest into
 * spending. Every change goes through the engine's `setBucket`, so a split
 * can never add up wrong.
 */
export function Allocate({
  scenario,
  split,
  onChange,
  onDone,
  doneLabel = PLAY.allocate.next,
}: {
  scenario: PaydayScenario;
  split: Split;
  onChange: (split: Split) => void;
  onDone: () => void;
  doneLabel?: string;
}) {
  const { config, words } = scenario;
  const fmt = money(config.currency);
  const left = unplaced(config, split);
  const set = (bucket: Bucket, amount: number) =>
    onChange(setBucket(config, split, bucket, amount));
  const target: Partial<Record<Bucket, number>> = {
    rent: config.rent.amount,
    family: config.family.ask,
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="type-title text-fg">{PLAY.allocate.heading}</h2>
        <p className="mt-1 type-small text-fg-2">{PLAY.allocate.help}</p>
      </div>

      <div>
        <AllocationBar split={split} income={config.income} />
        <p
          className="mt-2 num type-small font-semibold text-fg"
          aria-live="polite"
        >
          {left === 0 ? PLAY.allocate.done : PLAY.allocate.left(fmt(left))}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {BUCKETS.map((bucket) => {
          const { label, hint } = words.buckets[bucket];
          const goal = target[bucket];
          const shortcut =
            goal !== undefined &&
            split[bucket] !== goal &&
            split[bucket] + left >= goal
              ? { text: PLAY.allocate.match(fmt(goal)), amount: goal }
              : bucket === 'spend' && left > 0
                ? { text: PLAY.allocate.rest, amount: split.spend + left }
                : null;
          return (
            <li
              key={bucket}
              className="rounded-md border border-line bg-panel p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-9 w-1 shrink-0 rounded-full ${BUCKET_SWATCH[bucket]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="type-body font-semibold text-fg">{label}</p>
                  <p className="type-small text-muted">{hint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set(bucket, split[bucket] - config.chip)}
                  disabled={split[bucket] === 0}
                  aria-label={PLAY.allocate.less(label)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-md border border-edge bg-raised type-title text-fg disabled:opacity-40"
                >
                  −
                </button>
                <output
                  className="num w-[5.5rem] shrink-0 text-center type-body font-semibold text-fg"
                  aria-label={label}
                >
                  {fmt(split[bucket])}
                </output>
                <button
                  type="button"
                  onClick={() => set(bucket, split[bucket] + config.chip)}
                  disabled={left === 0}
                  aria-label={PLAY.allocate.more(label)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-md border border-edge bg-raised type-title text-fg disabled:opacity-40"
                >
                  +
                </button>
              </div>
              {shortcut ? (
                <button
                  type="button"
                  onClick={() => set(bucket, shortcut.amount)}
                  className="mt-2 ml-4 min-h-9 rounded-sm border border-gold/60 bg-gold-soft px-3 type-small font-semibold text-fg"
                >
                  {shortcut.text}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <Button
        kind="primary"
        block
        onClick={onDone}
        disabled={left !== 0}
        reason={PLAY.allocate.notDone(fmt(left))}
      >
        {doneLabel}
      </Button>
    </div>
  );
}
