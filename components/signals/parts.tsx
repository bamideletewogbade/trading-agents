import Link from 'next/link';
import { SIGNALS as C, explain, day } from '@/content/signals';
import { formatBp } from '@/lib/core/money';
import {
  checkScore,
  checklistOf,
  type Check,
  type Side,
} from '@/lib/engines/signals';
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

/** The checks a call is read against, for whichever signal the summary holds. */
export function checksOf(summary: Summary): Check[] | null {
  const { now, record } = summary;
  if (now.state === 'wait') return null;
  return checklistOf(now.state === 'new' ? now.signal : now.played, record);
}

/**
 * The score as a row of segments. The words beside it carry the meaning;
 * the segments differ by shape as well as colour (filled, hollow, dashed).
 */
function CheckMeter({ checks }: { checks: readonly Check[] }) {
  return (
    <span aria-hidden className="flex gap-0.5">
      {checks.map((check, i) => (
        <span
          key={check.key}
          style={{ animationDelay: `${120 + i * 70}ms` }}
          className={`h-2 w-3 animate-pop rounded-[2px] border ${
            check.state === 'pass'
              ? 'border-gold bg-gold'
              : check.state === 'fail'
                ? 'border-loss'
                : 'border-dashed border-edge'
          }`}
        />
      ))}
    </span>
  );
}

export function CheckLine({ checks }: { checks: readonly Check[] }) {
  const { passed, known } = checkScore(checks);
  return (
    <span className="inline-flex items-center gap-2 font-mono type-tick text-fg-2 num">
      <CheckMeter checks={checks} />
      {C.checks.score(passed, known)}
    </span>
  );
}

/** "What must be true": each check said as a sentence, with a mark that isn't only colour. */
export function Checklist({ checks }: { checks: readonly Check[] }) {
  const mark = { pass: '✓', fail: '✕', unknown: '–' } as const;
  const tone = {
    pass: 'text-gain',
    fail: 'text-loss',
    unknown: 'text-muted',
  } as const;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="checks" className="type-heading text-fg">
          {C.checks.title}
        </h2>
        <CheckLine checks={checks} />
      </div>
      <p className="mt-1 type-small text-fg-2">{C.checks.lead}</p>
      <ul className="mt-3 space-y-2">
        {checks.map((check, i) => (
          <li
            key={check.key}
            className="flex animate-bubble-in gap-2 type-small text-fg"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              aria-hidden
              className={`w-4 shrink-0 text-center font-bold ${tone[check.state]}`}
            >
              {mark[check.state]}
            </span>
            {C.checks.items[check.key][check.state]}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono type-tick text-muted uppercase">
        {C.checks.built}
      </p>
      <ul className="mt-1 space-y-1">
        {C.checks.builtItems.map((item) => (
          <li key={item} className="flex gap-2 type-tick text-fg-2">
            <span aria-hidden className="w-4 shrink-0 text-center text-gold">
              ◆
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A market in the feed: its call if it has one, what it's watching if not. */
export function MarketCard({ summary }: { summary: Summary }) {
  const { market, now } = summary;
  const call = now.state !== 'wait';
  const signal =
    now.state === 'new' ? now.signal : now.state === 'open' ? now.played : null;
  const checks = checksOf(summary);
  return (
    <Link
      href={`/signals/${market.id}`}
      className={`group block rounded-xl border p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-edge focus-visible:-translate-y-0.5 ${call ? 'border-gold/60 bg-gold-soft' : 'border-line bg-panel'}`}
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
          {checks ? (
            <p className="mt-2">
              <CheckLine checks={checks} />
            </p>
          ) : null}
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
