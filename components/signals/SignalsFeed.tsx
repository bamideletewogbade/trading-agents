'use client';

import { SIGNALS as C } from '@/content/signals';
import { useSignals } from '@/lib/client/signals';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { MarketCard, day } from './parts';

/**
 * Every market the rules read, calls first: a new signal, then open ones,
 * then the markets being watched with what the rules wait for. Each card
 * carries its record line, so no call is ever shown without its history.
 */
export function SignalsFeed() {
  const result = useSignals();
  const data = result.state === 'ready' ? result.data : null;
  const asOf = data?.markets[0]?.asOf;
  const calls = data?.markets.filter((m) => m.now.state !== 'wait') ?? [];
  const watching = data?.markets.filter((m) => m.now.state === 'wait') ?? [];

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

      {result.state === 'loading' ? (
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

      {result.state === 'error' ? (
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

      {data ? (
        <>
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
              <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {calls.map((summary) => (
                  <li key={summary.market.id}>
                    <MarketCard summary={summary} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-edge p-4 type-small text-fg-2">
                {C.none}
              </p>
            )}
          </section>

          {watching.length ? (
            <section aria-labelledby="watching" className="mt-8">
              <h2 id="watching" className="font-mono type-label text-fg-2">
                {C.watching}{' '}
                <span className="text-muted num">· {watching.length}</span>
              </h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {watching.map((summary) => (
                  <li key={summary.market.id}>
                    <MarketCard summary={summary} />
                  </li>
                ))}
              </ul>
            </section>
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
