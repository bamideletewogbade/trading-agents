'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LANDING } from '@/content/landing';
import { FIRST_SHARE, firstShareResult } from '@/lib/engines/first-share';
import { formatMoney, fromMinor } from '@/lib/core/money';

const C = LANDING.firstShare;
const money = (minor: number) => formatMoney(fromMinor(minor, 'GHS'));

export function FirstShareDemo() {
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const scenario = FIRST_SHARE.scenarios[selected]!;
  const result = firstShareResult(scenario.sell);
  const tone =
    result.outcome === 'gain'
      ? 'text-gain'
      : result.outcome === 'loss'
        ? 'text-loss'
        : 'text-fg';

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <p className="font-mono type-tick text-gold uppercase">{C.kicker}</p>
        <span className="rounded-full border border-line px-2 py-1 type-tick text-fg-2">
          {C.badge}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h2 className="type-heading text-fg">{C.title}</h2>
        <p className="mt-2 type-small text-fg-2">{C.intro}</p>
        <div
          className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2"
          aria-label={C.diagram}
        >
          <div className="rounded-xl border border-line bg-ink p-3 sm:p-4">
            <p className="type-small text-fg-2">{C.buy}</p>
            <p className="mt-1 font-mono text-[1.5rem] font-semibold text-fg num sm:text-[1.8rem]">
              {money(result.buy)}
            </p>
          </div>
          <span aria-hidden className="text-xl text-muted">
            →
          </span>
          <div className="rounded-xl border border-line bg-ink p-3 sm:p-4">
            <p className="type-small text-fg-2">{C.sell}</p>
            {/* Keyed by price, so a new choice pops in rather than swapping silently. */}
            <p
              key={result.sell}
              className="mt-1 animate-pop font-mono text-[1.5rem] font-semibold text-fg num sm:text-[1.8rem]"
            >
              {money(result.sell)}
            </p>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 type-small font-semibold text-fg">
            {C.choose}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {FIRST_SHARE.scenarios.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected === index}
                onClick={() => {
                  setSelected(index);
                  setRevealed(false);
                }}
                className={`min-h-12 rounded-lg border px-2 py-2 type-small font-semibold transition-colors ${selected === index ? 'border-gold bg-gold-soft text-gold' : 'border-edge bg-raised text-fg hover:border-gold'}`}
              >
                {C.scenarios[item.id]}
              </button>
            ))}
          </div>
        </fieldset>
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="btn-3d mt-5 min-h-12 w-full rounded-lg bg-gold px-4 type-body font-semibold text-ink"
          >
            {C.reveal}
          </button>
        ) : null}
        <output className="block" aria-live="polite" aria-atomic="true">
          {revealed ? (
            <div className="mt-5 border-t border-line pt-4 animate-page-in">
              <p className={`type-heading ${tone}`}>
                {C.outcome[result.outcome](money(Math.abs(result.change)))}
              </p>
              <p className="mt-2 type-small text-fg-2">
                {C.explain[result.outcome]}
              </p>
              <Link
                href="/lesson/m1"
                className="mt-3 inline-flex min-h-11 items-center type-small font-semibold text-gold"
              >
                {C.next} →
              </Link>
            </div>
          ) : null}
        </output>
        <p className="mt-4 type-tick text-muted">{C.note}</p>
      </div>
    </div>
  );
}
