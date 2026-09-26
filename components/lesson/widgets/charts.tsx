'use client';

import { useState } from 'react';
import { SEEDS, RANGE, TREND } from '@/content/lessons/seeds';
import { WIDGET_COPY } from '@/content/lessons/widgets';
import { formatBp } from '@/lib/core/money';
import { chartScenario } from '@/lib/engines/chart';
import {
  aggregate,
  breakout,
  efficiencyBp,
  isTrending,
  labelSwings,
  pullbackSeries,
  swings,
  trendOf,
  walkCandles,
} from '@/lib/engines/candles';
import { PriceChart } from '../PriceChart';
import { Button, Choices, useDone, type WidgetComponentProps } from './kit';

/** Stage 2 widgets: chart types, timeframes, trends, ranges, volume. */

/* ── Line, bar, candle (c1) ───────────────────────────────────────────── */

export function ChartTypesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.chartTypes;
  const bars = chartScenario(SEEDS.chart, 'bounce').seen.slice(8);
  const [mode, setMode] = useState<'line' | 'bar' | 'candle'>('line');
  const [seen, setSeen] = useState(new Set(['line']));
  return (
    <div className="space-y-3">
      <Choices
        name="chart-mode"
        label={C.modes.candle}
        options={(['line', 'bar', 'candle'] as const).map((value) => ({
          value,
          label: C.modes[value],
        }))}
        value={mode}
        onChange={(value) => {
          setMode(value);
          const next = new Set(seen).add(value);
          setSeen(next);
          if (next.size === 3) onDone();
        }}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart bars={bars} mode={mode} />
      </div>
      <p className="type-small text-fg-2" aria-live="polite">
        {C.notes[mode]}
      </p>
    </div>
  );
}

/* ── Timeframes (c3) ──────────────────────────────────────────────────── */

export function TimeframesWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.timeframes;
  const hourly = pullbackSeries(String(props?.seed ?? 'timeframes'));
  const [frame, setFrame] = useState<'1' | '4' | '24'>('1');
  const [seen, setSeen] = useState(new Set(['1']));
  const bars =
    frame === '1' ? hourly.slice(-48) : aggregate(hourly, Number(frame));
  return (
    <div className="space-y-3">
      <Choices
        name="timeframe"
        label={C.frames['1']}
        options={(['1', '4', '24'] as const).map((value) => ({
          value,
          label: C.frames[value],
        }))}
        value={frame}
        onChange={(value) => {
          setFrame(value);
          const next = new Set(seen).add(value);
          setSeen(next);
          if (next.size === 3) onDone();
        }}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart bars={bars} />
      </div>
      <p className="type-small text-fg-2" aria-live="polite">
        {frame === '24' ? C.daily : frame === '1' ? C.hourly : ''}
      </p>
    </div>
  );
}

/* ── Trends, from the swings (c4) ─────────────────────────────────────── */

export function TrendSwingsWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.swings;
  const done = useDone(onDone);
  const charts = {
    up: walkCandles(String(props?.up ?? SEEDS.trendUp), TREND.up),
    down: walkCandles(String(props?.down ?? SEEDS.trendDown), TREND.down),
  };
  const [which, setWhich] = useState<'up' | 'down'>('up');
  const [marked, setMarked] = useState<Set<'up' | 'down'>>(new Set());
  const bars = charts[which];
  const points = labelSwings(swings(bars, 3));
  const shown = marked.has(which);
  return (
    <div className="space-y-3">
      <Choices
        name="swing-chart"
        label={C.mark}
        options={(['up', 'down'] as const).map((value) => ({
          value,
          label: C.charts[value],
        }))}
        value={which}
        onChange={setWhich}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={bars}
          markers={
            shown
              ? points.map((point) => ({
                  index: point.index,
                  price: point.price,
                  label: point.label,
                  tone:
                    point.label === 'HH' || point.label === 'HL'
                      ? 'gain'
                      : point.label === 'LH' || point.label === 'LL'
                        ? 'loss'
                        : 'fg',
                  side: point.kind === 'high' ? 'above' : 'below',
                }))
              : []
          }
        />
      </div>
      {shown ? (
        <p className="type-body font-semibold text-gold" aria-live="polite">
          {C.trend[trendOf(points)]}
        </p>
      ) : (
        <Button
          onClick={() => {
            const next = new Set(marked).add(which);
            setMarked(next);
            if (next.size === 2) done();
          }}
        >
          {C.mark}
        </Button>
      )}
      <p className="font-mono type-tick text-muted">{C.legend}</p>
    </div>
  );
}

/* ── Trend or range (c6) ──────────────────────────────────────────────── */

export function RangeOrTrendWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.sort;
  const done = useDone(onDone);
  const [answers, setAnswers] = useState<Record<string, 'trend' | 'range'>>({});
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {SEEDS.sort.map((entry) => {
        const bars = walkCandles(
          entry.seed,
          entry.kind === 'trend' ? (entry.up ? TREND.up : TREND.down) : RANGE,
        );
        const truth = isTrending(bars) ? 'trend' : 'range';
        const picked = answers[entry.seed];
        return (
          <li
            key={entry.seed}
            className="rounded-md border border-line bg-panel p-2"
          >
            <PriceChart bars={bars} className="h-28" />
            {picked ? (
              <p className="mt-2 px-1 type-small" aria-live="polite">
                <span
                  className={
                    picked === truth
                      ? 'font-semibold text-gold'
                      : 'font-semibold text-loss'
                  }
                >
                  {picked === truth
                    ? `✓ ${C.right}`
                    : `✕ ${C.wrong(truth === 'trend' ? C.trend : C.range)}`}
                </span>{' '}
                <span className="text-fg-2">
                  {C.efficiency(formatBp(efficiencyBp(bars)))}
                </span>
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['trend', 'range'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      const next = { ...answers, [entry.seed]: kind };
                      setAnswers(next);
                      if (Object.keys(next).length === SEEDS.sort.length)
                        done();
                    }}
                    className="min-h-11 rounded-md border border-edge bg-raised type-small font-semibold text-fg"
                  >
                    {kind === 'trend' ? C.trend : C.range}
                  </button>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ── Volume and breakouts (c7) ────────────────────────────────────────── */

export function VolumeBreakoutWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.breakout;
  const seed = String(props?.seed ?? 'volume');
  // A is the fake and B the real one, so "the first one" is never the answer by habit.
  const pair = { a: breakout(seed, 'fake'), b: breakout(seed, 'real') };
  const [volume, setVolume] = useState(false);
  const [pick, setPick] = useState<'a' | 'b' | null>(null);
  const [played, setPlayed] = useState(false);
  const domain = { low: 9_700, high: 10_750 };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {(['a', 'b'] as const).map((key) => {
          const b = pair[key];
          const shown = played ? b.bars : b.bars.slice(0, b.at + 1);
          return (
            <div
              key={key}
              className={`rounded-md border bg-panel p-2 ${pick === key ? 'border-gold' : 'border-line'}`}
            >
              <p className="px-1 font-mono type-tick text-fg-2">
                {key === 'a' ? C.a : C.b}
              </p>
              <PriceChart
                bars={shown}
                slots={b.bars.length}
                domain={domain}
                volume={volume}
                futureFrom={played ? undefined : b.at + 1}
                levels={[{ price: b.ceiling, tone: 'muted', dashed: true }]}
                className="h-40"
              />
              {played ? (
                <p
                  className={`mt-1 px-1 type-small font-semibold ${b.kind === 'real' ? 'text-gain' : 'text-loss'}`}
                >
                  {b.kind === 'real' ? C.held : C.failed}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <Button kind="secondary" onClick={() => setVolume((v) => !v)}>
        {volume ? C.hideVolume : C.showVolume}
      </Button>
      <Choices
        name="breakout-pick"
        label={C.pick}
        options={[
          { value: 'a', label: C.a },
          { value: 'b', label: C.b },
        ]}
        value={pick}
        onChange={(value) => setPick(value as 'a' | 'b')}
      />
      <Button
        disabled={!pick}
        onClick={() => {
          setPlayed(true);
          onDone();
        }}
      >
        {C.play}
      </Button>
      {played && pick ? (
        <p className="type-small text-fg" aria-live="polite">
          {pair[pick].kind === 'real' ? C.right : C.wrong}
        </p>
      ) : null}
    </div>
  );
}
