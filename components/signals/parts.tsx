import Link from 'next/link';
import { SIGNALS as C, explain, day } from '@/content/signals';
import { formatBp } from '@/lib/core/money';
import type { Side } from '@/lib/engines/signals';
import { formatR } from '@/lib/engines/trades';
import { formatPrice } from '@/lib/markets/catalog';
import type { Summary } from '@/lib/markets/view';
import { TriangleDown, TriangleUp } from '@/components/ui/icons';

/**
 * The pieces every signals screen shares. Direction is always said in a
 * word and a shape (▲ Buy, ▼ Sell) before any colour, and a buy is never
 * drawn in a way that looks like a promise.
 */

export function SideTag({
  side,
  size = 'small',
}: {
  side: Side;
  size?: 'small' | 'large';
}) {
  const buy = side === 'buy';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-bold uppercase ${buy ? 'border-gain text-gain' : 'border-loss text-loss'} ${size === 'large' ? 'px-2.5 py-1 type-body' : 'px-1.5 py-0.5 type-tick'}`}
    >
      {buy ? (
        <TriangleUp width={12} height={12} />
      ) : (
        <TriangleDown width={12} height={12} />
      )}
      {C.side[side]}
    </span>
  );
}

/** A change over a period, with its sign and a shape. */
export function Change({
  bp,
  label,
}: {
  bp: number;
  label: (bp: number) => string;
}) {
  const tone = bp > 0 ? 'text-gain' : bp < 0 ? 'text-loss' : 'text-fg-2';
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono type-tick num ${tone}`}
    >
      {bp > 0 ? (
        <TriangleUp width={10} height={10} />
      ) : bp < 0 ? (
        <TriangleDown width={10} height={10} />
      ) : null}
      {label(bp)}
    </span>
  );
}

/** A signal's levels as a small table: entry, stop, target, and 1R. */
export function Levels({ summary }: { summary: Summary }) {
  const { now, market } = summary;
  if (now.state === 'wait') return null;
  const s = now.state === 'new' ? now.signal : now.played;
  const price = (units: number) => formatPrice(units, market.decimals);
  const rows: [string, string, string?][] = [
    now.state === 'new'
      ? [C.levels.entry, price(s.reference), C.levels.entryNote]
      : [C.levels.filled, price(now.played.entry)],
    [C.levels.stop, price(s.stop), formatBp(s.stopBp)],
    [C.levels.target, price(s.target), C.levels.reward(200)],
  ];
  return (
    <dl className="grid grid-cols-3 gap-2">
      {rows.map(([label, value, note]) => (
        <div
          key={label}
          className="min-w-0 rounded-md border border-line bg-ink/40 p-2"
        >
          <dt className="font-mono type-tick text-muted uppercase">{label}</dt>
          <dd className="mt-0.5 truncate font-mono type-small font-semibold text-fg num">
            {value}
          </dd>
          {note ? (
            <dd className="truncate type-tick text-fg-2">{note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

/** A market in the feed: its call if it has one, what it's watching if not. */
export function MarketCard({ summary }: { summary: Summary }) {
  const { market, now } = summary;
  const call = now.state !== 'wait';
  const signal =
    now.state === 'new' ? now.signal : now.state === 'open' ? now.played : null;
  return (
    <Link
      href={`/signals/${market.id}`}
      className={`group block rounded-xl border p-4 transition-colors hover:border-edge ${call ? 'border-gold/60 bg-gold-soft' : 'border-line bg-panel'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono type-tick text-muted uppercase">
            {C.kind[market.class]} · {market.symbol}
          </p>
          <p className="mt-0.5 type-heading text-fg">{market.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono type-small font-semibold text-fg num">
            {formatPrice(summary.price, market.decimals)}
          </p>
          <Change bp={summary.dayBp} label={C.day} />
        </div>
      </div>
      {signal ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SideTag side={signal.side} />
            <span className="type-small font-semibold text-fg">
              {C.setup[signal.setup]}
            </span>
            <span className="font-mono type-tick text-gold">
              {now.state === 'new'
                ? C.state.new
                : C.state.open(now.state === 'open' ? now.played.r : 0)}
            </span>
          </div>
          <div className="mt-3">
            <Levels summary={summary} />
          </div>
        </>
      ) : (
        <p className="mt-2 type-small text-fg-2">
          <span className="font-semibold text-fg">
            {C.trend[summary.trend]}.
          </span>{' '}
          {now.state === 'wait' ? C.watch(now, market.decimals) : null}
        </p>
      )}
      <p className="mt-3 border-t border-line pt-2 font-mono type-tick text-muted">
        {C.recordLine(
          summary.record.signals,
          summary.record.winRateBp,
          summary.record.avgR,
        )}
      </p>
    </Link>
  );
}

export function Explanation({ summary }: { summary: Summary }) {
  return <p className="type-body text-fg-2">{explain(summary)}</p>;
}

export { day, formatR };
