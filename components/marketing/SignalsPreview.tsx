'use client';

import Link from 'next/link';
import { SIGNALS } from '@/content/signals';
import { useSignals } from '@/lib/client/signals';
import { MarketCard, day } from '@/components/signals/parts';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { SupportCard } from '@/components/coach/SupportCard';
import { useInCare } from '@/components/coach/CareGate';

/**
 * Today's markets on the public pages: the same reading members see
 * (app/api/signals), calls first, three at most, each with its record line.
 * When the data is down it says so, rather than showing an old or made-up
 * signal.
 */
export function SignalsPreview({ all }: { all: string }) {
  const result = useSignals();
  const care = useInCare();
  const data = result.state === 'ready' ? result.data : null;
  const asOf = data?.markets[0]?.asOf;
  // After the support card showed here, no calls: the card, and room.
  if (care) return <SupportCard />;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <TruthBadge
          truth="market"
          source={
            asOf ? { name: SIGNALS.source.kraken, date: day(asOf) } : undefined
          }
        />
        <TruthBadge truth="educational" />
      </div>
      {result.state === 'loading' ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3" aria-busy>
          <p className="sr-only">{SIGNALS.loading}</p>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-line bg-panel"
            />
          ))}
        </div>
      ) : null}
      {result.state === 'error' ? (
        <p className="mt-4 rounded-xl border border-line bg-panel p-4 type-small text-fg-2">
          {SIGNALS.error}
        </p>
      ) : null}
      {data ? (
        // Two until a laptop (side by side from md), three from lg: narrower
        // cards cut the prices short.
        <ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-lg:[&>li:nth-child(n+3)]:hidden">
          {data.markets.slice(0, 3).map((summary, i) => (
            <li
              key={summary.market.id}
              className="animate-bubble-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <MarketCard summary={summary} />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 max-w-[70ch] type-tick text-muted">
        {SIGNALS.disclaimer}
      </p>
      <Link
        href="/signals"
        className="mt-4 inline-flex min-h-11 items-center gap-1 type-small font-semibold text-gold underline underline-offset-4"
      >
        {all} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
