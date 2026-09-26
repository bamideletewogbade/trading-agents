'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { BREAKOUT_COUNT, STAGE6_SEEDS } from '@/content/lessons/seeds';
import { WIDGET_COPY } from '@/content/lessons/widgets';
import { formatBp, formatMoney, fromMinor } from '@/lib/core/money';
import { bollinger, sma } from '@/lib/engines/indicators';
import type { Bar } from '@/lib/engines/candles';
import {
  ACCOUNT,
  BUILDER,
  HEAVY_VOLUME_TENTHS,
  INVESTING,
  NEWS_DAY,
  PLANS,
  STRATEGIES,
  STYLE_DAYS,
  TRADING_DAYS_A_MONTH,
  asOf,
  backtest,
  breakoutResults,
  breakoutSetup,
  builderMarket,
  flatRun,
  investing,
  market,
  moveBp,
  newsSeason,
  optimise,
  rulesOf,
  seasonSummary,
  tradeBreakout,
  tradeStyles,
  type Backtest,
  type Choice,
  type Style,
  type Trade,
} from '@/lib/engines/strategy';
import { PriceChart, type Marker, type Pane } from '../PriceChart';
import {
  Button,
  Choices,
  Slider,
  Stat,
  useDone,
  type WidgetComponentProps,
} from './kit';

/**
 * Stage 6 widgets: strategies. Every trade, balance and total is worked
 * out by lib/engines/strategy.ts; these draw it and let the learner play
 * through time, switch rules and compare. Words come from
 * content/lessons/widgets.ts.
 */

const B = WIDGET_COPY.backtest;

const usd = (cents: number, signed = false) =>
  formatMoney(fromMinor(cents, 'USD'), { signed });
const ghs = (pesewas: number) => formatMoney(fromMinor(pesewas, 'GHS'));
const pct = (bp: number) => formatBp(bp, { signed: true });
/** Hundredths of R as "+1.85R". */
const rOf = (hundredths: number) => {
  const a = Math.abs(hundredths);
  const sign = hundredths < 0 ? '−' : hundredths > 0 ? '+' : '';
  return `${sign}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}R`;
};
const tone = (value: number) =>
  value > 0
    ? ('gain' as const)
    : value < 0
      ? ('loss' as const)
      : ('fg' as const);
/** A series as flat bars, for drawing as a line. */
const asBars = (values: readonly number[]) =>
  values.map((v) => ({ open: v, high: v, low: v, close: v }));

function Result({ children }: { children: ReactNode }) {
  return (
    <div
      className="space-y-1 rounded-md border border-line bg-panel p-3 type-small text-fg"
      aria-live="polite"
    >
      {children}
    </div>
  );
}

function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono type-tick text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={`inline-block w-4 ${item.className}`} />
          {item.label}
        </span>
      ))}
    </p>
  );
}

/** The account under the price, with the starting balance marked. */
function equityPane(
  equity: readonly number[],
  shown: number,
  start = ACCOUNT,
): Pane {
  const seen = equity.slice(0, shown);
  const low = Math.min(start, ...seen);
  const high = Math.max(start, ...seen);
  const pad = Math.max(1_000, Math.round((high - low) / 10));
  return {
    label: B.account,
    lines: [{ values: seen, tone: 'gold', width: 2 }],
    range: { low: low - pad, high: high + pad },
    guides: [{ value: start, label: B.start }],
  };
}

/** Buys and sells on the chart, arrows first so colour is never the only signal. */
function tradeMarkers(
  bars: readonly Bar[],
  trades: readonly Trade[],
  shown: number,
): Marker[] {
  if (trades.length > 24) return [];
  return trades.flatMap((t) => [
    ...(t.entryAt < shown
      ? [
          {
            index: t.entryAt,
            price: bars[t.entryAt]!.low,
            label: '▲',
            tone: 'gold' as const,
            side: 'below' as const,
          },
        ]
      : []),
    ...(t.exitAt < shown
      ? [
          {
            index: t.exitAt,
            price: bars[t.exitAt]!.high,
            label: '▼',
            tone:
              tone(t.pnl) === 'loss' ? ('loss' as const) : ('gain' as const),
            side: 'above' as const,
          },
        ]
      : []),
  ]);
}

function Scrubber({
  shown,
  of,
  min,
  onChange,
}: {
  shown: number;
  of: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Slider
        label={B.time}
        shown={B.bar(shown, of)}
        min={min}
        max={of}
        value={shown}
        onChange={onChange}
      />
      {shown < of ? (
        <Button kind="secondary" onClick={() => onChange(of)}>
          {B.toEnd}
        </Button>
      ) : null}
    </div>
  );
}

/* ── Trend following (s1) ─────────────────────────────────────────────── */

const FIRST_LOOK = 60;

export function TrendRulesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.trendRules;
  const done = useDone(onDone);
  const [which, setWhich] = useState<'trendy' | 'choppy'>('trendy');
  const [shown, setShown] = useState(FIRST_LOOK);
  const [finished, setFinished] = useState(new Set<string>());
  const run = useMemo(() => {
    const { bars } = market(STAGE6_SEEDS.trend, PLANS[which]);
    const closes = bars.map((bar) => bar.close);
    return {
      bars,
      test: backtest(bars, STRATEGIES.trend),
      fast: sma(closes, 10),
      slow: sma(closes, 30),
    };
  }, [which]);
  const n = run.bars.length;
  const now = asOf(run.test, shown);
  const flat = flatRun(run.test.equity, run.test.start, shown);
  const seeTo = (value: number) => {
    setShown(value);
    if (value < n) return;
    const next = new Set(finished).add(which);
    setFinished(next);
    if (next.size === 2) done();
  };
  return (
    <div className="space-y-3">
      <p className="type-small text-fg-2">{C.rules}</p>
      <Choices
        name="trend-market"
        label={C.market}
        options={(['trendy', 'choppy'] as const).map((value) => ({
          value,
          label: C.markets[value],
        }))}
        value={which}
        onChange={(value) => {
          setWhich(value);
          setShown(FIRST_LOOK);
        }}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={run.bars.slice(0, shown)}
          slots={n}
          mode="line"
          futureFrom={shown < n ? shown : undefined}
          lines={[
            { values: run.fast.slice(0, shown), tone: 'blue', width: 1.5 },
            { values: run.slow.slice(0, shown), tone: 'blue', dashed: true },
          ]}
          markers={tradeMarkers(run.bars, run.test.trades, shown)}
          pane={equityPane(run.test.equity, shown)}
          className="h-64 sm:h-72"
        />
      </div>
      <Legend
        items={[
          { label: B.price, className: 'h-0.5 rounded-full bg-gold' },
          { label: C.legend.fast, className: 'h-0.5 rounded-full bg-series-2' },
          {
            label: C.legend.slow,
            className: 'border-t-2 border-dashed border-series-2',
          },
        ]}
      />
      <Scrubber shown={shown} of={n} min={FIRST_LOOK} onChange={seeTo} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={B.trades} value={now.closed.length} />
        <Stat label={B.wins} value={now.wins} />
        <Stat
          label={B.result}
          value={pct(now.returnBp)}
          tone={tone(now.returnBp)}
        />
        <Stat label={C.flat} value={flat.current} />
      </div>
      <p className="font-mono type-tick text-muted">
        {C.longest(flat.longest)}
      </p>
      {finished.size === 1 ? (
        <p className="type-small text-gold">{C.seeBoth}</p>
      ) : null}
    </div>
  );
}

/* ── Range trading (s2) ───────────────────────────────────────────────── */

type RangePlan = 'none' | 'stop' | 'aside';
const RANGE_RULES = {
  none: STRATEGIES.rangeNoStop,
  stop: STRATEGIES.range,
  aside: STRATEGIES.rangeStandAside,
} as const;

export function RangeRulesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.rangeRules;
  const done = useDone(onDone);
  const [plan, setPlan] = useState<RangePlan>('none');
  const [shown, setShown] = useState(FIRST_LOOK);
  const [finished, setFinished] = useState(new Set<RangePlan>());
  const { bars, breakAt, middle, lower } = useMemo(() => {
    const m = market(STAGE6_SEEDS.range, PLANS.rangeThenBreak);
    const bands = bollinger(
      m.bars.map((bar) => bar.close),
      20,
      2,
    );
    return {
      bars: m.bars,
      breakAt: m.regimes.indexOf('down'),
      middle: bands.middle,
      lower: bands.lower,
    };
  }, []);
  const test = useMemo(() => backtest(bars, RANGE_RULES[plan]), [bars, plan]);
  const n = bars.length;
  const now = asOf(test, shown);
  const finish = (which: RangePlan, at: number) => {
    if (at < n) return;
    const next = new Set(finished).add(which);
    setFinished(next);
    if (next.size >= 2) done();
  };
  return (
    <div className="space-y-3">
      <p className="type-small text-fg-2">{C.rules}</p>
      <Choices
        name="range-plan"
        label={C.plan}
        options={(['none', 'stop', 'aside'] as const).map((value) => ({
          value,
          label: C.plans[value],
        }))}
        value={plan}
        onChange={(value) => {
          setPlan(value);
          finish(value, shown);
        }}
      />
      <p className="type-tick text-muted">{C.help[plan]}</p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars.slice(0, shown)}
          slots={n}
          mode="line"
          futureFrom={shown < n ? shown : undefined}
          lines={[
            { values: middle.slice(0, shown), tone: 'blue', dashed: true },
            { values: lower.slice(0, shown), tone: 'blue', width: 1.5 },
          ]}
          markers={[
            ...tradeMarkers(bars, test.trades, shown),
            ...(shown > breakAt
              ? [
                  {
                    index: breakAt,
                    price: bars[breakAt]!.high,
                    label: C.breaks,
                    tone: 'fg' as const,
                    side: 'above' as const,
                  },
                ]
              : []),
          ]}
          pane={equityPane(test.equity, shown)}
          className="h-64 sm:h-72"
        />
      </div>
      <Legend
        items={[
          { label: B.price, className: 'h-0.5 rounded-full bg-gold' },
          {
            label: C.legend.lower,
            className: 'h-0.5 rounded-full bg-series-2',
          },
          {
            label: C.legend.middle,
            className: 'border-t-2 border-dashed border-series-2',
          },
        ]}
      />
      <Scrubber
        shown={shown}
        of={n}
        min={FIRST_LOOK}
        onChange={(value) => {
          setShown(value);
          finish(plan, value);
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={B.wins} value={`${now.wins}/${now.closed.length}`} />
        <Stat
          label={B.worst}
          value={usd(now.worst)}
          tone={now.worst < 0 ? 'loss' : 'fg'}
        />
        <Stat label={B.value} value={usd(now.value)} />
        <Stat
          label={B.result}
          value={pct(now.returnBp)}
          tone={tone(now.returnBp)}
        />
      </div>
      {finished.size === 1 ? (
        <p className="type-small text-gold">{C.seeOther}</p>
      ) : null}
    </div>
  );
}

/* ── Breakouts (s3) ───────────────────────────────────────────────────── */

export function BreakoutPicksWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.breakoutPicks;
  const done = useDone(onDone);
  const setups = useMemo(
    () =>
      Array.from({ length: BREAKOUT_COUNT }, (_, i) =>
        breakoutSetup(`${STAGE6_SEEDS.breakouts}:${i}`),
      ),
    [],
  );
  const [k, setK] = useState(0);
  const [picks, setPicks] = useState<boolean[]>([]);
  const setup = setups[k]!;
  const decided = picks.length > k;
  const outcome = tradeBreakout(setup);
  const allDone = picks.length === setups.length;
  const heavy = (i: number) => setups[i]!.volumeTenths >= HEAVY_VOLUME_TENTHS;
  const decide = (take: boolean) => {
    const next = [...picks, take];
    setPicks(next);
    if (next.length === setups.length) done();
  };
  const tenths = setup.volumeTenths;
  const summary = allDone
    ? [
        { key: 'you', r: breakoutResults(setups, (_, i) => picks[i] === true) },
        { key: 'all', r: breakoutResults(setups, () => true) },
        { key: 'volume', r: breakoutResults(setups, (_, i) => heavy(i)) },
      ]
    : [];
  return (
    <div className="space-y-3">
      <p className="type-small text-fg-2">{C.rule}</p>
      <p className="font-mono type-tick text-muted">
        {C.count(k + 1, setups.length)}
      </p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          key={k}
          bars={decided ? setup.bars : setup.bars.slice(0, setup.at + 1)}
          slots={setup.bars.length}
          volume
          futureFrom={decided ? undefined : setup.at + 1}
          levels={[
            {
              price: setup.ceiling,
              tone: 'gold',
              dashed: true,
              label: C.ceiling,
            },
          ]}
        />
      </div>
      <Stat
        label={C.volume}
        value={C.times(`${Math.floor(tenths / 10)}.${tenths % 10}`)}
        tone={tenths >= HEAVY_VOLUME_TENTHS ? 'gold' : 'fg'}
      />
      {!decided ? (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => decide(true)}>{C.take}</Button>
          <Button kind="secondary" onClick={() => decide(false)}>
            {C.skip}
          </Button>
        </div>
      ) : (
        <>
          <Result>
            <p className={outcome.r > 0 ? 'text-gain' : 'text-loss'}>
              {outcome.r > 0 ? '▲ ' : '▼ '}
              {picks[k] ? C.took(rOf(outcome.r)) : C.skipped(rOf(outcome.r))}
            </p>
            <p>{outcome.stopped ? C.stopped : C.held}</p>
          </Result>
          {k < setups.length - 1 ? (
            <Button onClick={() => setK(k + 1)}>{C.next}</Button>
          ) : null}
        </>
      )}
      {allDone ? (
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full type-small">
            <caption className="bg-raised px-3 py-2 text-left font-semibold text-fg">
              {C.summary}
            </caption>
            <thead>
              <tr className="font-mono type-tick text-muted">
                <th scope="col" className="px-3 py-1 text-left font-normal">
                  <span className="sr-only">{C.summary}</span>
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {C.taken}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {C.total}
                </th>
                <th scope="col" className="px-3 py-1 text-right font-normal">
                  {C.each}
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.map(({ key, r }) => (
                <tr key={key} className="border-t border-line">
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-normal text-fg"
                  >
                    {C.rows[key as keyof typeof C.rows]}
                  </th>
                  <td className="px-2 py-2 text-right font-mono num">
                    {r.taken}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-mono num ${r.totalR < 0 ? 'text-loss' : 'text-fg'}`}
                  >
                    {rOf(r.totalR)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono num">
                    {r.taken ? rOf(r.averageR) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/* ── Swing, day and position (s4) ─────────────────────────────────────── */

const STYLE_ORDER: readonly Style[] = ['day', 'swing', 'position'];

export function TradeStylesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.tradeStyles;
  const done = useDone(onDone);
  const runs = useMemo(() => tradeStyles(STAGE6_SEEDS.styles), []);
  const [style, setStyle] = useState<Style>('day');
  const [seen, setSeen] = useState(new Set<Style>(['day']));
  const run = runs.find((r) => r.style === style)!;
  const stats = run.test.stats;
  const move = moveBp(runs[0]!.bars);
  return (
    <div className="space-y-3">
      <p className="type-small text-fg-2">{C.rules}</p>
      <Choices
        name="trade-style"
        label={C.style}
        options={STYLE_ORDER.map((value) => ({
          value,
          label: C.styles[value],
        }))}
        value={style}
        onChange={(value) => {
          setStyle(value);
          const next = new Set(seen).add(value);
          setSeen(next);
          if (next.size === STYLE_ORDER.length) done();
        }}
      />
      <p className="type-tick text-muted">{C.about[style]}</p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          key={style}
          bars={run.bars}
          mode="line"
          markers={tradeMarkers(run.bars, run.test.trades, run.bars.length)}
          pane={equityPane(run.test.equity, run.bars.length)}
          className="h-64 sm:h-72"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={B.trades} value={stats.trades} />
        <Stat label={C.spread} value={usd(stats.costs)} />
        <Stat label={C.hours} value={C.hoursValue(run.hoursWatched)} />
        <Stat
          label={B.result}
          value={pct(stats.returnBp)}
          tone={tone(stats.returnBp)}
        />
      </div>
      <p className="font-mono type-tick text-muted">
        {C.market(pct(move), Math.round(STYLE_DAYS / TRADING_DAYS_A_MONTH))}
      </p>
      {seen.size === STYLE_ORDER.length ? (
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full type-small">
            <caption className="bg-raised px-3 py-2 text-left font-semibold text-fg">
              {C.table}
            </caption>
            <thead>
              <tr className="font-mono type-tick text-muted">
                <th scope="col" className="px-3 py-1 text-left font-normal">
                  {C.style}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {B.trades}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {C.spread}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {C.hours}
                </th>
                <th scope="col" className="px-3 py-1 text-right font-normal">
                  {B.result}
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.style} className="border-t border-line">
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-normal text-fg"
                  >
                    {C.styles[r.style]}
                  </th>
                  <td className="px-2 py-2 text-right font-mono num">
                    {r.test.stats.trades}
                  </td>
                  <td className="px-2 py-2 text-right font-mono num">
                    {usd(r.test.stats.costs)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono num">
                    {C.hoursValue(r.hoursWatched)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono num ${r.test.stats.returnBp < 0 ? 'text-loss' : 'text-fg'}`}
                  >
                    {pct(r.test.stats.returnBp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="type-small text-gold">{C.seeAll}</p>
      )}
    </div>
  );
}

/* ── News trading (s5) ────────────────────────────────────────────────── */

type NewsPlan = 'straddle' | 'wait';

export function NewsRulesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.newsRules;
  const done = useDone(onDone);
  const season = useMemo(() => newsSeason(STAGE6_SEEDS.news), []);
  const [plan, setPlan] = useState<NewsPlan>('straddle');
  const [k, setK] = useState(0);
  const [tried, setTried] = useState(new Set<NewsPlan>(['straddle']));
  const [whole, setWhole] = useState(false);
  const day = season.days[k]!;
  const trade = season[plan][k]!;
  const pre = day.bars[day.at - 1]!.close;
  const count = season.days.length;
  const check = (nextTried: Set<NewsPlan>, nextWhole: boolean) => {
    if (nextTried.size === 2 && nextWhole) done();
  };
  const rows = [
    { key: 'straddle', s: seasonSummary(season.straddle) },
    { key: 'wait', s: seasonSummary(season.wait) },
    { key: 'out', s: { total: 0, worst: 0, overPlan: 0 } },
  ] as const;
  return (
    <div className="space-y-3">
      <Choices
        name="news-plan"
        label={C.plan}
        options={(['straddle', 'wait'] as const).map((value) => ({
          value,
          label: C.plans[value],
        }))}
        value={plan}
        onChange={(value) => {
          setPlan(value);
          const next = new Set(tried).add(value);
          setTried(next);
          check(next, whole);
        }}
      />
      <p className="type-tick text-muted">{C.help[plan]}</p>
      <p className="font-mono type-tick text-muted">
        {C.release(k + 1, count)}
      </p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          key={k}
          bars={day.bars}
          markers={[
            {
              index: day.at,
              price: day.bars[day.at]!.high,
              label: C.news,
              tone: 'gold',
              side: 'above',
            },
          ]}
          levels={[
            ...(plan === 'straddle'
              ? [
                  {
                    price: pre + NEWS_DAY.level,
                    tone: 'muted' as const,
                    dashed: true,
                    label: C.level,
                  },
                  {
                    price: pre - NEWS_DAY.level,
                    tone: 'muted' as const,
                    dashed: true,
                  },
                ]
              : []),
            { price: trade.entry, tone: 'gold' as const, label: C.entry },
            {
              price: trade.stop,
              tone: 'loss' as const,
              dashed: true,
              label: C.stop,
            },
          ]}
        />
      </div>
      <Result>
        <p>{C.filled(C.side[trade.side], usd(trade.entry))}</p>
        <p>{C.planned(usd(NEWS_DAY.risk))}</p>
        {trade.slippage > 0 ? (
          <p className="text-loss">{C.slipped(usd(trade.slippage))}</p>
        ) : null}
        {trade.stopped ? <p>{C.stopped(usd(trade.exit))}</p> : null}
        <p
          className={`font-semibold ${trade.pnl < 0 ? 'text-loss' : 'text-gain'}`}
        >
          {trade.pnl < 0 ? '▼ ' : '▲ '}
          {C.result(usd(trade.pnl, true))}
        </p>
      </Result>
      <div className="grid grid-cols-2 gap-2">
        <Button kind="secondary" onClick={() => setK((k + 1) % count)}>
          {C.next}
        </Button>
        <Button
          onClick={() => {
            setWhole(true);
            check(tried, true);
          }}
        >
          {C.season}
        </Button>
      </div>
      {whole ? (
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full type-small">
            <caption className="bg-raised px-3 py-2 text-left font-semibold text-fg">
              {C.table(count)}
            </caption>
            <thead>
              <tr className="font-mono type-tick text-muted">
                <th scope="col" className="px-3 py-1 text-left font-normal">
                  {C.plan}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {C.total}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-normal">
                  {C.worst}
                </th>
                <th scope="col" className="px-3 py-1 text-right font-normal">
                  {C.over}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, s }) => (
                <tr key={key} className="border-t border-line">
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-normal text-fg"
                  >
                    {C.rows[key]}
                  </th>
                  <td
                    className={`px-2 py-2 text-right font-mono num ${s.total < 0 ? 'text-loss' : 'text-fg'}`}
                  >
                    {usd(s.total, true)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono num">
                    {usd(s.worst)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono num">
                    {C.days(s.overPlan)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/* ── Investing is not trading (s6) ────────────────────────────────────── */

export function InvestVsTradeWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.investVsTrade;
  const done = useDone(onDone);
  const run = useMemo(() => investing(STAGE6_SEEDS.investing), []);
  const months = INVESTING.months;
  const [m, setM] = useState(12);
  const upTo = (values: readonly number[]) => values.slice(0, m + 1);
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={asBars(upTo(run.index))}
          slots={months + 1}
          mode="line"
          futureFrom={m < months ? m + 1 : undefined}
          markers={INVESTING.crashes
            .filter((crash) => crash.month <= m)
            .map((crash) => ({
              index: crash.month,
              price: run.index[crash.month]!,
              label: C.crash,
              tone: 'loss' as const,
              side: 'below' as const,
            }))}
          pane={{
            label: C.pane,
            lines: [
              { values: upTo(run.steady), tone: 'gold', width: 2 },
              { values: upTo(run.timer), tone: 'blue', dashed: true },
              { values: upTo(run.missed), tone: 'muted' },
              { values: upTo(run.paid), tone: 'muted', dashed: true },
            ],
          }}
          className="h-64 sm:h-72"
        />
      </div>
      <Legend
        items={[
          { label: C.savers.steady, className: 'h-0.5 rounded-full bg-gold' },
          {
            label: C.savers.timer,
            className: 'border-t-2 border-dashed border-series-2',
          },
          { label: C.savers.missed, className: 'h-0.5 rounded-full bg-edge' },
          { label: C.paid, className: 'border-t-2 border-dashed border-edge' },
        ]}
      />
      <Slider
        label={C.time}
        shown={C.month(m)}
        min={1}
        max={months}
        value={m}
        onChange={(value) => {
          setM(value);
          if (value === months) done();
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={C.paid} value={ghs(run.paid[m]!)} />
        <Stat label={C.savers.steady} value={ghs(run.steady[m]!)} tone="gold" />
        <Stat label={C.savers.timer} value={ghs(run.timer[m]!)} />
        <Stat label={C.savers.missed} value={ghs(run.missed[m]!)} />
      </div>
      <p className="font-mono type-tick text-muted">
        {C.switches(run.switches)}
      </p>
      <p className="font-mono type-tick text-muted">{B.made}</p>
    </div>
  );
}

/* ── Build your own strategy (s7) ─────────────────────────────────────── */

function TestPanel({
  title,
  bars,
  test,
}: {
  title: string;
  bars: readonly Bar[];
  test: Backtest;
}) {
  const s = test.stats;
  return (
    <div className="space-y-2">
      <p className="type-label text-fg-2">{title}</p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          mode="line"
          markers={tradeMarkers(bars, test.trades, bars.length)}
          pane={equityPane(test.equity, bars.length)}
          className="h-56 sm:h-64"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={B.trades} value={s.trades} />
        <Stat label={B.winRate} value={formatBp(s.winRateBp)} />
        <Stat
          label={B.result}
          value={pct(s.returnBp)}
          tone={tone(s.returnBp)}
        />
      </div>
    </div>
  );
}

export function StrategyBuilderWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.strategyBuilder;
  const done = useDone(onDone);
  const { past, future } = useMemo(
    () => builderMarket(STAGE6_SEEDS.builder),
    [],
  );
  const [choice, setChoice] = useState<Choice>({
    entry: 'ma-cross',
    exit: 'signal',
    stopAtrTenths: 20,
  });
  const [step, setStep] = useState(0);
  const [changed, setChanged] = useState(false);
  const pastTest = useMemo(
    () => backtest(past, rulesOf(choice)),
    [past, choice],
  );
  const futureTest = useMemo(
    () => backtest(future, rulesOf(choice)),
    [future, choice],
  );
  const opt = useMemo(
    () => (step >= 3 ? optimise(STAGE6_SEEDS.builder) : null),
    [step],
  );
  const pick = (next: Choice) => {
    setChoice(next);
    if (step > 0 && step < 3) {
      setStep(0);
      setChanged(true);
    }
  };
  const name = (c: Choice) =>
    `${C.entries[c.entry]} · ${C.exits[c.exit]} · ${C.stops[c.stopAtrTenths as keyof typeof C.stops]}`;
  return (
    <div className="space-y-3">
      <Choices
        name="builder-entry"
        label={C.entry}
        options={BUILDER.entries.map((value) => ({
          value,
          label: C.entries[value],
        }))}
        value={choice.entry}
        onChange={(entry) => pick({ ...choice, entry })}
      />
      <Choices
        name="builder-exit"
        label={C.exit}
        options={BUILDER.exits.map((value) => ({
          value,
          label: C.exits[value],
        }))}
        value={choice.exit}
        onChange={(exit) => pick({ ...choice, exit })}
      />
      <Choices
        name="builder-stop"
        label={C.stop}
        options={BUILDER.stops.map((value) => ({
          value,
          label: C.stops[value],
        }))}
        value={choice.stopAtrTenths}
        onChange={(stopAtrTenths) => pick({ ...choice, stopAtrTenths })}
      />
      <p className="type-tick text-muted">
        {C.exitHelp[choice.entry]} {C.risk}
      </p>
      {changed && step === 0 ? (
        <p className="type-small text-gold">{C.changed}</p>
      ) : null}
      {step === 0 ? (
        <Button onClick={() => setStep(1)}>{C.backtest}</Button>
      ) : null}
      {step >= 1 ? (
        <TestPanel
          title={`${C.past}: ${C.yours}`}
          bars={past}
          test={pastTest}
        />
      ) : null}
      {step === 1 ? (
        <Button onClick={() => setStep(2)}>{C.forward}</Button>
      ) : null}
      {step >= 2 ? (
        <TestPanel
          title={`${C.next}: ${C.yours}`}
          bars={future}
          test={futureTest}
        />
      ) : null}
      {step === 2 ? (
        <Button
          onClick={() => {
            setStep(3);
            done();
          }}
        >
          {C.optimise}
        </Button>
      ) : null}
      {opt ? (
        <Result>
          <p className="font-semibold">{C.optimised(name(opt.best))}</p>
          <p>{C.tried(opt.tried)}</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Stat
              label={C.past}
              value={pct(opt.past.stats.returnBp)}
              tone={tone(opt.past.stats.returnBp)}
            />
            <Stat
              label={C.next}
              value={pct(opt.future.stats.returnBp)}
              tone={tone(opt.future.stats.returnBp)}
            />
          </div>
          <p>{C.rank(opt.futureRank, opt.tried)}</p>
          <p>{C.average(pct(opt.futureAverageBp))}</p>
        </Result>
      ) : null}
    </div>
  );
}
