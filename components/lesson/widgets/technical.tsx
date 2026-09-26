'use client';

import { useMemo, useState } from 'react';
import { GUESSED_STOP, MARKETS, STAGE4_SEEDS } from '@/content/lessons/seeds';
import { WIDGET_COPY } from '@/content/lessons/widgets';
import { formatBp, formatMoney, fromMinor, shareBp } from '@/lib/core/money';
import { aggregate, walkCandles } from '@/lib/engines/candles';
import {
  atr,
  barsUntilTurnDown,
  bollinger,
  crossovers,
  ema,
  firstAbove,
  macd,
  rsi,
  sma,
} from '@/lib/engines/indicators';
import {
  FIB_LEVELS_BP,
  MADE_UP_LEVELS_BP,
  buyTheDip,
  channel,
  divergence,
  doubleTop,
  findPatterns,
  judgeLine,
  lineThrough,
  noiseStopOuts,
  patternChart,
  retracements,
  rsiAtHighs,
  strongRun,
  testLevels,
  testPatterns,
  topSeries,
  type PatternTest,
  type Point,
  type TimeframeTest,
} from '@/lib/engines/ta';
import { PriceChart, type Marker } from '../PriceChart';
import {
  Button,
  Choices,
  Slider,
  Stat,
  useDone,
  type WidgetComponentProps,
} from './kit';

/**
 * Stage 4 widgets: technical analysis. Each one draws what an engine in
 * lib/engines/indicators.ts or lib/engines/ta.ts computed, and the words
 * come from content/lessons/widgets.ts.
 */

const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
const RSI_PANE = {
  range: { low: 0, high: 100 },
  guides: [
    { value: 70, label: '70' },
    { value: 30, label: '30' },
  ],
};

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

/* ── Trendlines (t1) ──────────────────────────────────────────────────── */

export function TrendlineWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.trendline;
  const done = useDone(onDone);
  const ch = useMemo(() => channel(STAGE4_SEEDS.channel), []);
  const [picked, setPicked] = useState<string[]>([]);
  const [upper, setUpper] = useState(false);
  const by = new Map(ch.lows.map((low) => [low.key, low]));
  const point = (key: string | undefined): Point | null =>
    key ? (by.get(key) ?? null) : null;
  const first = point(picked[0]);
  const second = point(picked[1]);
  const pair: [Point, Point] | null = first && second ? [first, second] : null;
  const report = pair
    ? judgeLine(ch.bars, lineThrough(pair[0], pair[1]), ch.tolerance, 0)
    : null;
  const good = report
    ? report.breaks.length === 0 && report.touches.length >= 3
    : false;
  const rays = pair
    ? [
        {
          a: pair[0],
          b: pair[1],
          tone: good ? ('gold' as const) : ('loss' as const),
        },
        ...(upper && good
          ? [
              {
                a: ch.upperTouch,
                b: {
                  index: ch.upperTouch.index + (pair[1].index - pair[0].index),
                  price: ch.upperTouch.price + (pair[1].price - pair[0].price),
                },
                tone: 'blue' as const,
                dashed: true,
              },
            ]
          : []),
      ]
    : [];
  const markers: Marker[] = ch.lows.map((low) => ({
    index: low.index,
    price: low.price,
    label: low.key,
    tone: picked.includes(low.key) ? 'gold' : 'fg',
    side: 'below',
  }));
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart bars={ch.bars} markers={markers} rays={rays} />
      </div>
      <p className="type-small text-fg-2">{C.pick}</p>
      <div className="grid grid-cols-5 gap-2">
        {ch.lows.map((low) => (
          <button
            key={low.key}
            type="button"
            aria-pressed={picked.includes(low.key)}
            disabled={picked.length === 2 && !picked.includes(low.key)}
            onClick={() => {
              const next = picked.includes(low.key)
                ? picked.filter((k) => k !== low.key)
                : [...picked, low.key];
              setPicked(next);
              setUpper(false);
              const a = point(next[0]);
              const b = point(next[1]);
              if (next.length === 2 && a && b) {
                const r = judgeLine(
                  ch.bars,
                  lineThrough(a, b),
                  ch.tolerance,
                  0,
                );
                if (r.breaks.length === 0 && r.touches.length >= 3) done();
              }
            }}
            className={`min-h-12 rounded-md border font-mono type-small font-semibold disabled:opacity-40 ${picked.includes(low.key) ? 'border-gold bg-gold-soft text-gold' : 'border-edge bg-raised text-fg'}`}
          >
            {low.key}
          </button>
        ))}
      </div>
      {report ? (
        <div
          className="rounded-md border border-line bg-panel p-3"
          aria-live="polite"
        >
          <p
            className={`type-small font-semibold ${good ? 'text-gold' : 'text-loss'}`}
          >
            {good ? '✓ ' : '✕ '}
            {C.touches(report.touches.length)} ·{' '}
            {C.breaks(report.breaks.length)}
          </p>
          <p className="mt-1 type-small text-fg-2">{good ? C.good : C.trap}</p>
          {upper && good ? (
            <p className="mt-1 type-small text-fg-2">{C.channel}</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          kind="secondary"
          onClick={() => {
            setPicked([]);
            setUpper(false);
          }}
        >
          {C.clear}
        </Button>
        <Button
          kind="secondary"
          disabled={!good}
          onClick={() => setUpper(true)}
        >
          {C.copy}
        </Button>
      </div>
    </div>
  );
}

/* ── Moving averages (t2) ─────────────────────────────────────────────── */

export function MovingAveragesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.averages;
  const done = useDone(onDone);
  const { bars, top } = useMemo(() => topSeries(STAGE4_SEEDS.top), []);
  const closes = useMemo(() => bars.map((bar) => bar.close), [bars]);
  const [kind, setKind] = useState<'sma' | 'ema'>('sma');
  const [length, setLength] = useState(20);
  const [slowOn, setSlowOn] = useState(false);
  const fast = kind === 'sma' ? sma(closes, length) : ema(closes, length);
  const slow = sma(closes, 30);
  const lag = barsUntilTurnDown(fast, top);
  const crosses = slowOn ? crossovers(fast, slow) : [];
  const sell = crosses.find(
    (cross) => cross.direction === 'down' && cross.index >= top,
  );
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          lines={[
            { values: fast, tone: 'gold', width: 2.5 },
            ...(slowOn
              ? [{ values: slow, tone: 'blue' as const, dashed: true }]
              : []),
          ]}
          markers={[
            {
              index: top,
              price: bars[top]!.high,
              label: 'TOP',
              tone: 'fg',
              side: 'above',
            },
            ...crosses.map((cross) => ({
              index: cross.index,
              price: fast[cross.index] ?? 0,
              label: cross.direction === 'up' ? '▲' : '▼',
              tone:
                cross.direction === 'up'
                  ? ('gain' as const)
                  : ('loss' as const),
              side:
                cross.direction === 'up'
                  ? ('below' as const)
                  : ('above' as const),
            })),
          ]}
        />
      </div>
      <Legend
        items={[
          { label: C.legend.fast, className: 'h-1 rounded-full bg-gold' },
          ...(slowOn
            ? [
                {
                  label: C.legend.slow,
                  className: 'border-t-2 border-dashed border-series-2',
                },
              ]
            : []),
        ]}
      />
      <Choices
        name="ma-kind"
        label={C.type}
        options={(['sma', 'ema'] as const).map((value) => ({
          value,
          label: C.kind[value],
        }))}
        value={kind}
        onChange={(v) => {
          setKind(v);
          done();
        }}
      />
      <Slider
        label={C.length}
        shown={C.bars(length)}
        min={5}
        max={50}
        value={length}
        onChange={(v) => {
          setLength(v);
          done();
        }}
      />
      <p className="type-small text-fg" aria-live="polite">
        {C.lag(C.kind[kind], length, lag)}
      </p>
      <Button kind="secondary" onClick={() => setSlowOn((on) => !on)}>
        {C.slow}
      </Button>
      {slowOn ? (
        <p className="type-small text-fg-2">
          {C.crosses(crosses.length, sell ? sell.index - top : null)}
        </p>
      ) : null}
    </div>
  );
}

/* ── RSI (t3) ─────────────────────────────────────────────────────────── */

export function RsiRunWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.rsiRun;
  const bars = useMemo(() => strongRun(STAGE4_SEEDS.run), []);
  const values = useMemo(() => rsi(bars.map((bar) => bar.close)), [bars]);
  const cross = firstAbove(values, 70);
  const [shown, setShown] = useState(24);
  const step = 6;
  const all = shown >= bars.length;
  const visible = bars.slice(0, shown);
  const now = values[shown - 1];
  const sold = cross !== null ? bars[cross]!.close : null;
  const last = bars[bars.length - 1]!.close;
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={visible}
          slots={bars.length}
          futureFrom={all ? undefined : shown}
          markers={
            cross !== null && cross < shown
              ? [
                  {
                    index: cross,
                    price: bars[cross]!.low,
                    label: '70',
                    tone: 'gold',
                    side: 'below',
                  },
                ]
              : []
          }
          pane={{
            ...RSI_PANE,
            lines: [{ values: values.slice(0, shown), tone: 'gold' }],
            label: 'RSI',
          }}
          className="h-64 sm:h-72"
        />
      </div>
      <p className="font-mono type-tick text-muted">{C.legend}</p>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label={C.value}
          value={now == null ? '—' : now.toFixed(0)}
          tone={now != null && now > 70 ? 'gold' : 'fg'}
        />
        <Button
          disabled={all}
          onClick={() => {
            const next = Math.min(bars.length, shown + step);
            setShown(next);
            if (next >= bars.length) onDone();
          }}
        >
          {C.more(step)}
        </Button>
      </div>
      {all && sold !== null ? (
        <p
          className="rounded-md border border-line bg-panel p-3 type-small text-fg"
          aria-live="polite"
        >
          {C.outcome(
            usd(sold),
            usd(last),
            formatBp(
              shareBp(fromMinor(last - sold, 'USD'), fromMinor(sold, 'USD')),
              { signed: true },
            ),
          )}
        </p>
      ) : null}
    </div>
  );
}

/* ── MACD, built up (t4) ──────────────────────────────────────────────── */

export function MacdBuildWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.macdBuild;
  const done = useDone(onDone);
  const { bars } = useMemo(() => topSeries(STAGE4_SEEDS.top), []);
  const closes = useMemo(() => bars.map((bar) => bar.close), [bars]);
  const [step, setStep] = useState(0);
  const m = macd(closes);
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          lines={[
            { values: ema(closes, 12), tone: 'gold' },
            { values: ema(closes, 26), tone: 'blue', dashed: true },
          ]}
          pane={
            step >= 1
              ? {
                  label: C.pane,
                  guides: [{ value: 0, label: '0' }],
                  histogram: step >= 3 ? m.histogram : undefined,
                  lines: [
                    { values: m.macd, tone: 'gold' },
                    ...(step >= 2
                      ? [
                          {
                            values: m.signal,
                            tone: 'blue' as const,
                            dashed: true,
                          },
                        ]
                      : []),
                  ],
                }
              : undefined
          }
          className={step >= 1 ? 'h-64 sm:h-72' : 'h-48 sm:h-60'}
        />
      </div>
      <p className="type-small text-fg" aria-live="polite">
        {C.steps[step]}
      </p>
      {step < C.steps.length - 1 ? (
        <Button
          onClick={() => {
            const next = step + 1;
            setStep(next);
            if (next === C.steps.length - 1) done();
          }}
        >
          {C.next}
        </Button>
      ) : (
        <Button kind="secondary" onClick={() => setStep(0)}>
          {C.again}
        </Button>
      )}
    </div>
  );
}

/* ── ATR stops (t5) ───────────────────────────────────────────────────── */

export function AtrStopsWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.atrStops;
  const [market, setMarket] = useState<'quiet' | 'wild'>('quiet');
  const [seen, setSeen] = useState(new Set(['quiet']));
  const [tenths, setTenths] = useState(20);
  const done = useDone(onDone);
  const wobble = MARKETS[market];
  const bars = useMemo(
    () =>
      walkCandles(`${STAGE4_SEEDS.stops}:${market}`, {
        count: 60,
        start: 10_000,
        drift: 0,
        wobble,
      }),
    [market, wobble],
  );
  const closes = bars.map((bar) => bar.close);
  const bands = bollinger(closes);
  const ranges = atr(bars);
  const atrNow = ranges[ranges.length - 1] ?? 0;
  const guess = noiseStopOuts(STAGE4_SEEDS.stops, () => GUESSED_STOP, wobble);
  const yours = noiseStopOuts(
    STAGE4_SEEDS.stops,
    (_, a) => Math.round((a * tenths) / 10),
    wobble,
  );
  return (
    <div className="space-y-3">
      <Choices
        name="market"
        label={C.which}
        options={(['quiet', 'wild'] as const).map((value) => ({
          value,
          label: C.market[value],
        }))}
        value={market}
        onChange={(value) => {
          setMarket(value);
          const next = new Set(seen).add(value);
          setSeen(next);
          if (next.size === 2) done();
        }}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          domain={{ low: 9_000, high: 11_000 }}
          lines={[
            { values: bands.upper, tone: 'muted' },
            { values: bands.middle, tone: 'muted', dashed: true },
            { values: bands.lower, tone: 'muted' },
          ]}
        />
      </div>
      <p className="font-mono type-tick text-muted">{C.bands}</p>
      <Stat label={C.atrNow} value={usd(Math.round(atrNow))} />
      <Slider
        label={C.multiple}
        shown={C.times((tenths / 10).toFixed(1))}
        min={5}
        max={30}
        step={5}
        value={tenths}
        onChange={setTenths}
      />
      <div
        className="space-y-1 rounded-md border border-line bg-panel p-3 type-small"
        aria-live="polite"
      >
        <p className="text-loss">
          ▼ {C.guess(usd(GUESSED_STOP), formatBp(guess.rateBp))}
        </p>
        <p className="text-gold">◆ {C.yours(formatBp(yours.rateBp))}</p>
      </div>
    </div>
  );
}

/* ── Candlestick patterns, tested (t6) ────────────────────────────────── */

export function PatternTestWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.patternTest;
  const bars = useMemo(() => patternChart(STAGE4_SEEDS.patternChart), []);
  const found = findPatterns(bars);
  const [rows, setRows] = useState<PatternTest[] | null>(null);
  const letter = { engulfing: 'E', hammer: 'H', doji: 'D' } as const;
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          markers={found.map((p) => ({
            index: p.index,
            price: bars[p.index]!.low,
            label: letter[p.kind],
            tone: 'gold',
            side: 'below',
          }))}
        />
      </div>
      <p className="font-mono type-tick text-muted">{C.marked}</p>
      <Button
        onClick={() => {
          setRows(testPatterns(STAGE4_SEEDS.patterns));
          onDone();
        }}
      >
        {C.run}
      </Button>
      {rows ? (
        <div
          className="overflow-hidden rounded-md border border-line"
          aria-live="polite"
        >
          <table className="w-full type-small">
            <thead className="bg-raised font-mono type-tick text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-normal" scope="col">
                  {C.kind}
                </th>
                <th className="px-3 py-2 text-right font-normal" scope="col">
                  {C.found}
                </th>
                <th className="px-3 py-2 text-right font-normal" scope="col">
                  {C.rose}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr
                  key={row.kind}
                  className={row.kind === 'any bar' ? 'bg-gold-soft' : ''}
                >
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-normal text-fg"
                  >
                    {C.names[row.kind]}
                  </th>
                  <td className="px-3 py-2 text-right font-mono text-fg-2 num">
                    {row.found}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-fg num">
                    {formatBp(row.rateBp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-3 type-small text-fg-2">
            {C.honest}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ── Double top (t7) ──────────────────────────────────────────────────── */

export function DoubleTopWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.doubleTop;
  const [ending, setEnding] = useState<'break' | 'fail'>('break');
  const [pick, setPick] = useState<'a' | 'b' | 'c' | null>(null);
  const [played, setPlayed] = useState(false);
  const scenario = useMemo(
    () => doubleTop(STAGE4_SEEDS.doubleTop, ending),
    [ending],
  );
  const found = pick === scenario.answer;
  const bars = played ? [...scenario.seen, ...scenario.next] : scenario.seen;
  const slots = scenario.seen.length + scenario.next.length;
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          slots={slots}
          domain={{ low: 9_700, high: 11_100 }}
          futureFrom={played ? undefined : scenario.seen.length}
          markers={scenario.peaks.map((i) => ({
            index: i,
            price: scenario.seen[i]!.high,
            label: 'TOP',
            tone: 'fg',
            side: 'above',
          }))}
          levels={[
            ...(found
              ? [
                  {
                    price: scenario.neckline,
                    tone: 'gold' as const,
                    label: usd(scenario.neckline),
                  },
                ]
              : scenario.candidates.map((c) => ({
                  price: c.price,
                  tone: 'muted' as const,
                  dashed: true,
                  label: C.line(c.key),
                }))),
            ...(played && ending === 'break'
              ? [
                  {
                    price: scenario.target,
                    tone: 'loss' as const,
                    dashed: true,
                    label: usd(scenario.target),
                  },
                ]
              : []),
          ]}
        />
      </div>
      {!found ? (
        <>
          <p className="type-small text-fg-2">{C.find}</p>
          <div className="grid grid-cols-3 gap-2">
            {scenario.candidates.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={pick === c.key}
                onClick={() => setPick(c.key)}
                className={`min-h-12 rounded-md border font-mono type-small font-semibold ${pick === c.key ? 'border-loss text-loss' : 'border-edge bg-raised text-fg'}`}
              >
                {C.line(c.key)}
              </button>
            ))}
          </div>
          {pick ? <p className="type-small text-fg-2">{C.wrong}</p> : null}
        </>
      ) : (
        <>
          <p className="type-small text-fg">{C.right}</p>
          {played ? (
            <p
              className="rounded-md border border-line bg-panel p-3 type-small text-fg"
              aria-live="polite"
            >
              {ending === 'break' ? C.broke(usd(scenario.target)) : C.held}
            </p>
          ) : null}
          <Button
            onClick={() => {
              if (played) setEnding((e) => (e === 'break' ? 'fail' : 'break'));
              setPlayed(true);
              onDone();
            }}
          >
            {played ? C.other[ending] : C.play}
          </Button>
        </>
      )}
    </div>
  );
}

/* ── Fibonacci, tested (t8) ───────────────────────────────────────────── */

export function FibTestWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.fibTest;
  const [madeUp, setMadeUp] = useState(false);
  const [result, setResult] = useState<null | {
    fib: ReturnType<typeof testLevels>;
    made: ReturnType<typeof testLevels>;
  }>(null);
  const bars = useMemo(() => {
    const rise = walkCandles(`${STAGE4_SEEDS.fib}:show:rise`, {
      count: 20,
      start: 10_000,
      drift: 25,
      wobble: 30,
    });
    const start = rise[rise.length - 1]!.close;
    return [
      ...rise,
      ...walkCandles(`${STAGE4_SEEDS.fib}:show:after`, {
        count: 20,
        start,
        drift: -10,
        wobble: 40,
      }),
    ];
  }, []);
  const rise = bars.slice(0, 20);
  const top = Math.max(...rise.map((bar) => bar.high));
  const low = Math.min(...rise.map((bar) => bar.low));
  const fib = retracements(top, low, FIB_LEVELS_BP);
  const made = retracements(top, low, MADE_UP_LEVELS_BP);
  const list = (levels: readonly number[]) =>
    levels.map((bp) => formatBp(bp)).join(', ');
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          levels={[
            ...fib.map((price, i) => ({
              price,
              tone: 'gold' as const,
              label: formatBp(FIB_LEVELS_BP[i]!),
            })),
            ...(madeUp
              ? made.map((price) => ({
                  price,
                  tone: 'muted' as const,
                  dashed: true,
                }))
              : []),
          ]}
        />
      </div>
      <Legend
        items={[
          { label: C.fib(list(FIB_LEVELS_BP)), className: 'h-0.5 bg-gold' },
          ...(madeUp
            ? [
                {
                  label: C.madeUp(list(MADE_UP_LEVELS_BP)),
                  className: 'border-t-2 border-dashed border-edge',
                },
              ]
            : []),
        ]}
      />
      <Button kind="secondary" onClick={() => setMadeUp((on) => !on)}>
        {madeUp ? C.hide : C.show}
      </Button>
      <Button
        onClick={() => {
          setResult({
            fib: testLevels(STAGE4_SEEDS.fib, FIB_LEVELS_BP),
            made: testLevels(STAGE4_SEEDS.fib, MADE_UP_LEVELS_BP),
          });
          setMadeUp(true);
          onDone();
        }}
      >
        {C.run}
      </Button>
      {result ? (
        <div className="grid gap-2" aria-live="polite">
          <Stat
            label={C.fib(list(FIB_LEVELS_BP))}
            value={C.rate(
              result.fib.reactions,
              result.fib.chances,
              formatBp(result.fib.rateBp),
            )}
            tone="gold"
          />
          <Stat
            label={C.madeUp(list(MADE_UP_LEVELS_BP))}
            value={C.rate(
              result.made.reactions,
              result.made.chances,
              formatBp(result.made.rateBp),
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ── Several timeframes (t9) ──────────────────────────────────────────── */

export function TimeframesTradeWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.timeframesTrade;
  const [trend, setTrend] = useState<'up' | 'down'>('up');
  const [result, setResult] = useState<null | Record<
    'up' | 'down',
    TimeframeTest
  >>(null);
  const hourly = useMemo(
    () =>
      walkCandles(`${STAGE4_SEEDS.timeframes}:${trend}:show`, {
        count: 96,
        start: 10_000,
        drift: trend === 'up' ? 4 : -4,
        wobble: 30,
      }),
    [trend],
  );
  return (
    <div className="space-y-3">
      <Choices
        name="bigger-trend"
        label={C.which}
        options={(['up', 'down'] as const).map((value) => ({
          value,
          label: C.trend[value],
        }))}
        value={trend}
        onChange={setTrend}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <div className="rounded-md border border-line bg-ink p-2">
          <p className="px-1 font-mono type-tick text-muted">{C.daily}</p>
          <PriceChart bars={aggregate(hourly, 24)} className="h-32" />
        </div>
        <div className="rounded-md border border-line bg-ink p-2">
          <p className="px-1 font-mono type-tick text-muted">{C.hourly}</p>
          <PriceChart bars={hourly.slice(-36)} className="h-32" />
        </div>
      </div>
      <Button
        onClick={() => {
          setResult({
            up: buyTheDip(STAGE4_SEEDS.timeframes, 'up'),
            down: buyTheDip(STAGE4_SEEDS.timeframes, 'down'),
          });
          onDone();
        }}
      >
        {C.run}
      </Button>
      {result ? (
        <div className="grid gap-2" aria-live="polite">
          {(['up', 'down'] as const).map((key) => (
            <div
              key={key}
              className="rounded-md border border-line bg-panel p-3"
            >
              <p className="type-small font-semibold text-fg">{C.rows[key]}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Stat
                  label={C.wins}
                  value={formatBp(result[key].rateBp)}
                  tone={key === 'up' ? 'gain' : 'loss'}
                />
                <Stat
                  label={C.average}
                  value={formatMoney(
                    fromMinor(result[key].averageCents, 'USD'),
                    { signed: true },
                  )}
                  tone={result[key].averageCents >= 0 ? 'gain' : 'loss'}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Divergence (t10) ─────────────────────────────────────────────────── */

export function DivergenceWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.divergence;
  const [ending, setEnding] = useState<'reversal' | 'continuation'>('reversal');
  const [marked, setMarked] = useState(false);
  const [played, setPlayed] = useState(false);
  const d = useMemo(
    () => divergence(STAGE4_SEEDS.divergence, ending),
    [ending],
  );
  const bars = played ? [...d.seen, ...d.next] : d.seen;
  const values = rsi(bars.map((bar) => bar.close));
  const [r1, r2] = rsiAtHighs(d);
  const [h1, h2] = d.highs;
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          slots={d.seen.length + d.next.length}
          futureFrom={played ? undefined : d.seen.length}
          markers={
            marked
              ? [
                  {
                    index: h1,
                    price: d.seen[h1]!.high,
                    label: '1',
                    tone: 'gold',
                    side: 'above',
                  },
                  {
                    index: h2,
                    price: d.seen[h2]!.high,
                    label: '2',
                    tone: 'gold',
                    side: 'above',
                  },
                ]
              : []
          }
          rays={
            marked
              ? [
                  {
                    a: { index: h1, price: d.seen[h1]!.high },
                    b: { index: h2, price: d.seen[h2]!.high },
                    tone: 'gain',
                    dashed: true,
                  },
                ]
              : []
          }
          pane={{
            ...RSI_PANE,
            label: C.pane,
            lines: [{ values, tone: 'gold' }],
          }}
          className="h-64 sm:h-72"
        />
      </div>
      {!marked ? (
        <Button onClick={() => setMarked(true)}>{C.mark}</Button>
      ) : (
        <>
          <div
            className="space-y-1 rounded-md border border-line bg-panel p-3 font-mono type-small num"
            aria-live="polite"
          >
            <p className="text-gain">
              ▲ {C.price(usd(d.seen[h1]!.high), usd(d.seen[h2]!.high))}
            </p>
            <p className="text-loss">▼ {C.rsi(r1.toFixed(0), r2.toFixed(0))}</p>
          </div>
          {played ? (
            <p className="type-small text-fg" aria-live="polite">
              {ending === 'reversal' ? C.reversal : C.continuation}
            </p>
          ) : null}
          <Button
            onClick={() => {
              if (played)
                setEnding((e) =>
                  e === 'reversal' ? 'continuation' : 'reversal',
                );
              setPlayed(true);
              onDone();
            }}
          >
            {played ? C.other[ending] : C.play}
          </Button>
        </>
      )}
    </div>
  );
}
