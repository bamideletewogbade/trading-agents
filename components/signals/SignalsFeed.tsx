'use client';

import { useId, useState } from 'react';
import { SIGNALS as C } from '@/content/signals';
import { ONBOARDING } from '@/content/onboarding';
import { useSignals } from '@/lib/client/signals';
import { useWatchlist } from '@/lib/client/watchlist';
import type { MarketClass } from '@/lib/markets/catalog';
import type { MarketInfo, Summary } from '@/lib/markets/view';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { SupportCard } from '@/components/coach/SupportCard';
import { useInCare } from '@/components/coach/CareGate';
import { MarketCard, day } from './parts';

/**
 * Every market the rules read, calls first: a new signal, then open ones,
 * then the markets being watched with what the rules wait for. Each card
 * carries its record line, so no call is ever shown without its history.
 *
 * Someone can follow some markets (checkboxes: follow as many as you like).
 * Their markets come first; the rest fold away below, with a count of any
 * signals among them, so nothing is hidden without saying so.
 */

const CLASSES: MarketClass[] = ['crypto', 'metal', 'fx'];

export function SignalsFeed() {
  const result = useSignals();
  const watch = useWatchlist();
  const [picking, setPicking] = useState(false);
  // Care comes first: after the support card showed here, no calls for a while.
  const care = useInCare();
  const data = result.state === 'ready' ? result.data : null;
  const asOf = data?.markets[0]?.asOf;

  const chosen = new Set(watch.ids ?? []);
  const all = data?.markets ?? [];
  const mine = chosen.size ? all.filter((m) => chosen.has(m.market.id)) : all;
  const others = chosen.size ? all.filter((m) => !chosen.has(m.market.id)) : [];
  const calls = mine.filter((m) => m.now.state !== 'wait');
  const watching = mine.filter((m) => m.now.state === 'wait');
  const otherCalls = others.filter((m) => m.now.state !== 'wait').length;
  const choices: MarketInfo[] = data
    ? [
        ...data.markets.map((m) => m.market),
        ...data.unavailable.map((u) => u.market),
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-5 pb-8 sm:px-8 lg:pt-8">
      <p className="font-mono type-label text-gold">{C.kicker}</p>
      <h1 className="mt-1 type-display text-fg">{C.title}</h1>
      <p className="mt-2 max-w-[62ch] type-body text-fg-2">{C.lead}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <TruthBadge
          truth="market"
          source={asOf ? { name: C.source.kraken, date: day(asOf) } : undefined}
        />
        <TruthBadge truth="educational" />
      </div>

      {care ? (
        <div className="mt-6 max-w-[62ch] space-y-3">
          <SupportCard />
          <p className="type-body text-fg-2">{C.care}</p>
        </div>
      ) : null}

      {care ? null : result.state === 'loading' ||
        (data && watch.ids === null) ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2" aria-busy>
          <p className="sr-only">{C.loading}</p>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-line bg-panel"
            />
          ))}
        </div>
      ) : null}

      {!care && result.state === 'error' ? (
        <div className="mt-6 rounded-xl border border-line bg-panel p-5">
          <p className="type-body text-fg">{C.error}</p>
          <button
            type="button"
            onClick={result.retry}
            className="mt-3 inline-flex min-h-11 items-center rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
          >
            {C.retry}
          </button>
        </div>
      ) : null}

      {!care && data && watch.ids !== null ? (
        <>
          <FollowBar
            choices={choices}
            chosen={chosen}
            open={picking}
            onOpen={setPicking}
            suggested={watch.suggested}
            unread={watch.unread.map((i) => ONBOARDING.marketLabels[i])}
            onChange={watch.set}
          />
          {asOf ? (
            <p className="mt-4 font-mono type-tick text-muted">
              {C.asOf(asOf)}
            </p>
          ) : null}
          <section aria-labelledby="calls" className="mt-4">
            <h2 id="calls" className="font-mono type-label text-fg-2">
              {C.now} <span className="text-muted num">· {calls.length}</span>
            </h2>
            {calls.length ? (
              <Cards list={calls} />
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-edge p-4 type-small text-fg-2">
                {chosen.size ? C.follow.nothingYet : C.none}
              </p>
            )}
          </section>

          {watching.length ? (
            <section aria-labelledby="watching" className="mt-8">
              <h2 id="watching" className="font-mono type-label text-fg-2">
                {C.watching}{' '}
                <span className="text-muted num">· {watching.length}</span>
              </h2>
              <Cards list={watching} />
            </section>
          ) : null}

          {others.length ? (
            <details className="group mt-8 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 font-mono type-label text-fg-2 hover:text-fg">
                <span className="num">
                  {C.follow.others(others.length, otherCalls)}
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <Cards list={others} />
            </details>
          ) : null}

          {data.unavailable.length ? (
            <p className="mt-6 type-small text-fg-2">
              {C.unavailable}:{' '}
              {data.unavailable.map((u) => u.market.name).join(', ')}
            </p>
          ) : null}
        </>
      ) : null}

      <details className="mt-8 rounded-xl border border-line bg-panel p-4 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 type-heading text-fg">
          {C.how.title}
          <span aria-hidden className="text-fg-2">
            ▾
          </span>
        </summary>
        <ul className="mt-2 space-y-2">
          {C.how.points.map((point) => (
            <li key={point} className="flex gap-2 type-small text-fg-2">
              <span aria-hidden className="text-gold">
                ◆
              </span>
              {point}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-4 type-tick text-muted">{C.disclaimer}</p>
    </div>
  );
}

/** Cards deal in one after another; a filter change deals the new set again. */
function Cards({ list }: { list: Summary[] }) {
  return (
    <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {list.map((summary, i) => (
        <li
          key={summary.market.id}
          className="animate-bubble-in"
          style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
        >
          <MarketCard summary={summary} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Which markets to follow. Checkboxes, because following Bitcoin doesn't
 * mean unfollowing gold: any number can be on, and none means all.
 */
function FollowBar({
  choices,
  chosen,
  open,
  onOpen,
  suggested,
  unread,
  onChange,
}: {
  choices: MarketInfo[];
  chosen: Set<string>;
  open: boolean;
  onOpen: (open: boolean) => void;
  suggested: boolean;
  unread: string[];
  onChange: (ids: string[]) => void;
}) {
  const panel = useId();
  const F = C.follow;
  const toggle = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  const names = choices.filter((m) => chosen.has(m.id)).map((m) => m.symbol);

  return (
    <div className="mt-5 rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="font-mono type-label text-fg-2">
            {F.title} ·{' '}
            <span className="text-fg num">
              {F.count(chosen.size, choices.length)}
            </span>
          </p>
          {names.length && names.length < choices.length ? (
            <p className="mt-0.5 truncate font-mono type-tick text-muted">
              {names.join(' · ')}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => onOpen(!open)}
          className="inline-flex min-h-11 items-center rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg transition-colors hover:border-gold"
        >
          {open ? F.done : F.edit}
        </button>
      </div>
      {suggested && !open ? (
        <p className="border-t border-line px-3 py-2 type-tick text-fg-2 sm:px-4">
          {F.suggested}
        </p>
      ) : null}
      {open ? (
        <div
          id={panel}
          className="animate-bubble-in border-t border-line p-3 sm:p-4"
        >
          <fieldset>
            <legend className="type-small font-semibold text-fg">
              {F.legend}
            </legend>
            <p className="mt-0.5 type-tick text-fg-2">{F.hint}</p>
            <div className="mt-3 space-y-3">
              {CLASSES.map((kind) => {
                const group = choices.filter((m) => m.class === kind);
                if (!group.length) return null;
                return (
                  <div key={kind}>
                    <p className="font-mono type-tick text-muted uppercase">
                      {C.kind[kind]}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {group.map((m) => {
                        const on = chosen.has(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 type-small transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${on ? 'border-gold bg-gold-soft font-semibold text-fg' : 'border-line text-fg-2 hover:text-fg'}`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(m.id)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden
                              className={`grid size-4 place-items-center rounded-[4px] border text-[0.65rem] leading-none font-bold transition-colors ${on ? 'border-gold bg-gold text-ink' : 'border-edge'}`}
                            >
                              {on ? '✓' : ''}
                            </span>
                            {m.name}
                            <span className="font-mono type-tick text-muted">
                              {m.symbol}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
          {unread.length ? (
            <p className="mt-3 type-tick text-fg-2">{F.noFeed(unread)}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange(choices.map((m) => m.id))}
              className="inline-flex min-h-11 items-center rounded-md px-3 type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
            >
              {F.all}
            </button>
            <button
              type="button"
              onClick={() => onOpen(false)}
              className="btn-3d ml-auto inline-flex min-h-11 items-center rounded-md bg-gold px-5 type-small font-bold text-ink"
            >
              {F.done}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
