'use client';

import Link from 'next/link';
import { SIGNALS as C, factText } from '@/content/signals';
import { lesson } from '@/content/curriculum';
import { formatBp } from '@/lib/core/money';
import { formatR } from '@/lib/engines/trades';
import { formatPrice, marketById } from '@/lib/markets/catalog';
import type { Detail, PlayedView } from '@/lib/markets/view';
import { useMarket } from '@/lib/client/signals';
import {
  PriceChart,
  type Level,
  type Marker,
} from '@/components/lesson/PriceChart';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { SupportCard } from '@/components/coach/SupportCard';
import { useInCare } from '@/components/coach/CareGate';
import {
  Change,
  CheckLine,
  Checklist,
  Explanation,
  Levels,
  SideTag,
  checksOf,
  day,
} from './parts';

/**
 * One market: the call and its levels, the chart with those levels drawn
 * on it, the reasons for and against, the rules' complete record on this
 * market, and the lessons that teach the setup. Every figure comes from
 * the engine through the API; this screen only lays it out.
 */

function Curve({ values }: { values: readonly number[] }) {
  if (values.length < 2) return null;
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = high - low || 1;
  const w = 100;
  const h = 40;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - low) / span) * h;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="block h-16 w-full"
      aria-hidden
    >
      <line
        x1={0}
        x2={w}
        y1={y(0)}
        y2={y(0)}
        className="stroke-edge"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        fill="none"
        className="stroke-gold"
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-ink/40 p-2">
      <p className="font-mono type-tick text-muted uppercase">{label}</p>
      <p className="mt-0.5 font-mono type-small font-semibold text-fg num">
        {value}
      </p>
    </div>
  );
}

function HistoryRow({
  played,
  decimals,
}: {
  played: PlayedView;
  decimals: number;
}) {
  const tone =
    played.outcome === 'open'
      ? 'text-gold'
      : played.r > 0
        ? 'text-gain'
        : 'text-loss';
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="w-20 shrink-0 font-mono type-tick text-muted num">
        {day(played.atTime, false)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <SideTag side={played.side} />
        <span className="truncate type-tick text-fg-2">
          {C.setup[played.setup]} · {formatPrice(played.entry, decimals)}
        </span>
      </span>
      <span
        className={`shrink-0 text-right font-mono type-tick font-semibold num ${tone}`}
      >
        {formatR(played.r)}
        <span className="block font-normal text-muted">
          {C.outcome[played.outcome]}
        </span>
      </span>
    </li>
  );
}

function Chart({ detail }: { detail: Detail }) {
  const { chart, now, history } = detail;
  const index = new Map(chart.bars.map((bar, i) => [bar.time, i]));
  const levels: Level[] = [];
  const call =
    now.state === 'new' ? now.signal : now.state === 'open' ? now.played : null;
  if (call) {
    levels.push({
      price: call.target,
      label: C.levels.target,
      tone: 'gold',
      dashed: true,
    });
    levels.push({
      price: call.stop,
      label: C.levels.stop,
      tone: 'loss',
      dashed: true,
    });
    levels.push({
      price: now.state === 'open' ? now.played.entry : call.reference,
      label: C.levels.entry,
      tone: 'muted',
    });
  }
  const markers: Marker[] = [];
  for (const p of history) {
    const i = index.get(p.atTime);
    if (i === undefined) continue;
    const bar = chart.bars[i]!;
    markers.push({
      index: i,
      price: p.side === 'buy' ? bar.low : bar.high,
      label: p.side === 'buy' ? '▲' : '▼',
      tone: p.side === 'buy' ? 'gain' : 'loss',
      side: p.side === 'buy' ? 'below' : 'above',
    });
  }
  const prices = [
    ...chart.bars.flatMap((b) => [b.low, b.high]),
    ...levels.map((l) => l.price),
  ];
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const pad = Math.round((high - low) * 0.06) || 1;
  return (
    <PriceChart
      bars={chart.bars}
      lines={[
        { values: chart.fast, tone: 'gold', width: 1.5 },
        { values: chart.slow, tone: 'blue', dashed: true, width: 1.5 },
      ]}
      levels={levels}
      markers={markers}
      domain={{ low: low - pad, high: high + pad }}
      className="h-56 sm:h-72"
    />
  );
}

export function MarketDetail({ id }: { id: string }) {
  const result = useMarket(id);
  const care = useInCare();

  if (care)
    return (
      <div className="mx-auto max-w-[62ch] space-y-3 px-4 pt-6 pb-8">
        <SupportCard />
        <p className="type-body text-fg-2">{C.care}</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 pb-8 sm:px-8 lg:pt-6">
      <Link
        href="/signals"
        className="inline-flex min-h-11 items-center gap-1 type-small font-semibold text-fg-2 hover:text-fg"
      >
        <span aria-hidden>←</span> {C.back}
      </Link>

      {result.state === 'loading' ? (
        <div aria-busy className="mt-2 space-y-3">
          <p className="sr-only">{C.loading}</p>
          <div className="h-16 w-2/3 animate-pulse rounded-lg bg-panel" />
          <div className="h-72 animate-pulse rounded-xl border border-line bg-panel" />
        </div>
      ) : null}

      {result.state === 'error' ? (
        <div className="mt-2 rounded-xl border border-line bg-panel p-5">
          <p className="type-body text-fg">
            {result.status === '404' ? C.notFound : C.error}
          </p>
          {result.status !== '404' ? (
            <button
              type="button"
              onClick={result.retry}
              className="mt-3 inline-flex min-h-11 items-center rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
            >
              {C.retry}
            </button>
          ) : null}
        </div>
      ) : null}

      {result.state === 'ready' ? <Ready detail={result.data} /> : null}
    </div>
  );
}

function Ready({ detail }: { detail: Detail }) {
  const { market, now, record } = detail;
  const call =
    now.state === 'new' ? now.signal : now.state === 'open' ? now.played : null;
  const price = (units: number) => formatPrice(units, market.decimals);
  const checks = checksOf(detail);
  const learnIds = [
    ...(call ? C.learn[call.setup] : C.learn.pullback),
    ...C.learn.always,
  ];
  const query = call
    ? new URLSearchParams({
        market: market.symbol,
        side: call.side,
        entry: price(now.state === 'open' ? now.played.entry : call.reference),
        stop: price(call.stop),
        target: price(call.target),
        setup: call.setup,
        source: 'signal',
      }).toString()
    : '';
  const paperQuery = call
    ? new URLSearchParams({
        market: market.id,
        side: call.side,
        stop: price(call.stop),
        target: price(call.target),
        setup: call.setup,
        signal: '1',
      }).toString()
    : '';
  const newestFirst = [...detail.history].reverse();

  return (
    <>
      <header className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono type-label text-gold">
            {C.kind[market.class]} · {market.symbol}
          </p>
          <h1 className="mt-1 type-display text-fg">{market.name}</h1>
        </div>
        <div className="text-right">
          <p className="font-mono type-title text-fg num">
            {price(detail.price)}
          </p>
          <p className="flex flex-wrap justify-end gap-x-3">
            <Change bp={detail.dayBp} label={C.day} />
            <Change bp={detail.weekBp} label={C.week} />
          </p>
        </div>
      </header>
      <div className="mt-3 flex flex-wrap gap-2">
        <TruthBadge
          truth="market"
          source={{ name: C.source[market.source], date: day(detail.asOf) }}
        />
        <TruthBadge truth="educational" />
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start lg:gap-6">
        {/* On a phone the call comes first, then the chart and record, then the lessons. */}
        <div className="order-2 min-w-0 space-y-4 lg:order-none">
          <section className="overflow-hidden rounded-xl border border-line bg-panel p-3 sm:p-4">
            <Chart detail={detail} />
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono type-tick text-fg-2">
              <span>
                <span aria-hidden className="text-gold">
                  ━
                </span>{' '}
                {C.chart.fast}
              </span>
              <span>
                <span aria-hidden className="text-info">
                  ╍
                </span>{' '}
                {C.chart.slow}
              </span>
              <span>
                <span aria-hidden>▲ ▼</span> {C.chart.past}
              </span>
            </p>
          </section>

          <section
            aria-labelledby="why"
            className="rounded-xl border border-line bg-panel p-4"
          >
            <h2 id="why" className="type-heading text-fg">
              {call ? C.why.title(call.side) : C.why.waitTitle}
            </h2>
            <div className="mt-2">
              <Explanation summary={detail} />
            </div>
            {call ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-mono type-label text-gain">
                    {C.why.for}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {call.for.map((fact) => (
                      <li
                        key={fact.kind}
                        className="flex gap-2 type-small text-fg"
                      >
                        <span aria-hidden className="text-gain">
                          ✓
                        </span>
                        {factText(fact)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-mono type-label text-loss">
                    {C.why.against}
                  </h3>
                  {call.against.length ? (
                    <ul className="mt-2 space-y-2">
                      {call.against.map((fact) => (
                        <li
                          key={fact.kind}
                          className="flex gap-2 type-small text-fg"
                        >
                          <span aria-hidden className="text-loss">
                            !
                          </span>
                          {factText(fact)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 type-small text-fg-2">
                      {C.why.noAgainst}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          {checks ? (
            <section
              aria-labelledby="checks"
              className="rounded-xl border border-line bg-panel p-4"
            >
              <Checklist checks={checks} />
            </section>
          ) : null}

          <section
            aria-labelledby="record"
            className="rounded-xl border border-line bg-panel p-4"
          >
            <h2 id="record" className="type-heading text-fg">
              {C.record.title}
            </h2>
            <p className="mt-1 type-small text-fg-2">
              {C.record.since(detail.from)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label={C.record.signals} value={String(record.signals)} />
              <Stat label={C.record.won} value={formatBp(record.winRateBp)} />
              <Stat label={C.record.average} value={formatR(record.avgR)} />
              <Stat label={C.record.total} value={formatR(record.totalR)} />
            </div>
            <div className="mt-3">
              <Curve values={detail.curve} />
            </div>
            <p className="mt-1 font-mono type-tick text-muted">
              {C.record.worst}: {C.record.losses(record.worstRun)}
            </p>
            {record.signals < 30 ? (
              <p className="mt-2 rounded-md border border-dashed border-edge p-2 type-tick text-fg-2">
                {C.record.small(record.signals)}
              </p>
            ) : null}
            <h3 className="mt-4 font-mono type-label text-fg-2">
              {C.record.history}
            </h3>
            <ul className="mt-1 divide-y divide-line">
              {newestFirst.map((p) => (
                <HistoryRow
                  key={p.atTime}
                  played={p}
                  decimals={market.decimals}
                />
              ))}
            </ul>
          </section>
        </div>

        <aside className="contents lg:sticky lg:top-6 lg:block lg:space-y-4">
          <section
            className={`order-1 rounded-xl border p-4 lg:order-none ${call ? 'border-gold bg-gold-soft' : 'border-line bg-panel'}`}
          >
            {call ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <SideTag side={call.side} size="large" />
                  <span className="type-heading text-fg">
                    {C.setup[call.setup]}
                  </span>
                </div>
                <p className="mt-1 font-mono type-tick text-gold">
                  {now.state === 'new'
                    ? `${C.state.new} · ${day(now.atTime)}`
                    : now.state === 'open'
                      ? `${C.state.open(now.played.r)} · ${day(now.played.atTime)}`
                      : null}
                </p>
                <div className="mt-3">
                  <Levels summary={detail} />
                </div>
                {checks ? (
                  <a href="#checks" className="mt-2 inline-flex min-h-8">
                    <CheckLine checks={checks} />
                  </a>
                ) : null}
                <div className="mt-4 grid gap-2">
                  {marketById(market.id)?.paper ? (
                    <Link
                      href={`/paper?${paperQuery}`}
                      className="btn-3d flex min-h-12 items-center justify-center rounded-md bg-gold px-4 type-body font-bold text-ink"
                    >
                      {C.actions.paperTrade}
                    </Link>
                  ) : null}
                  <Link
                    href={`/journal?${query}`}
                    className="flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-4 type-body font-semibold text-fg"
                  >
                    {C.actions.log}
                  </Link>
                  <Link
                    href={`/tools?${query}`}
                    className="flex min-h-11 items-center justify-center rounded-md px-4 type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
                  >
                    {C.actions.size}
                  </Link>
                </div>
                <p className="mt-3 type-tick text-fg-2">{C.actions.paper}</p>
              </>
            ) : (
              <>
                <p className="font-mono type-label text-fg-2">
                  {C.trend[detail.trend]}
                </p>
                <p className="mt-1 type-body text-fg">
                  {now.state === 'wait' ? C.watch(now, market.decimals) : null}
                </p>
              </>
            )}
          </section>

          <section
            aria-labelledby="learn"
            className="order-3 lg:order-none rounded-xl border border-line bg-panel p-4"
          >
            <h2 id="learn" className="type-heading text-fg">
              {C.learn.title}
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {learnIds.map((lessonId) => {
                const item = lesson(lessonId);
                return (
                  <li key={lessonId}>
                    <Link
                      href={item.playAt ?? '/lessons'}
                      className="flex min-h-12 items-center justify-between gap-3 type-small font-semibold text-fg hover:text-gold"
                    >
                      {item.title}
                      <span aria-hidden className="text-fg-2">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="order-4 type-tick text-muted lg:order-none">
            {C.disclaimer}
          </p>
        </aside>
      </div>
    </>
  );
}
