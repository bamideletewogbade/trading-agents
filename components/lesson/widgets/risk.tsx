'use client';

import { useState } from 'react';
import { WIDGET_COPY } from '@/content/lessons/widgets';
import { formatBp, formatMoney, fromMinor } from '@/lib/core/money';
import { positionSize, recoveryBp } from '@/lib/engines/risk';
import {
  breakEvenWinBp,
  equityCurve,
  expectancyR,
  maxDrawdownBp,
  outcomes,
  tradesToRecover,
} from '@/lib/engines/trades';
import {
  Button,
  Choices,
  Slider,
  Stat,
  useDone,
  type WidgetComponentProps,
} from './kit';

/** Stage 3 widgets: position size, R-multiples, drawdown, expectancy. */

const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
/** Hundredths of R → "+0.4R". Formatting only; the value comes from an engine. */
const r = (hundredths: number) => {
  const sign = hundredths > 0 ? '+' : hundredths < 0 ? '−' : '';
  const abs = Math.abs(hundredths);
  const frac = String(abs % 100)
    .padStart(2, '0')
    .replace(/0+$/, '');
  return `${sign}${Math.floor(abs / 100)}${frac ? `.${frac}` : ''}R`;
};

/* ── Position size (r2) ───────────────────────────────────────────────── */

export function PositionSizeWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.positionSize;
  const done = useDone(onDone);
  const account = Number(props?.account ?? 100_000);
  const riskBp = Number(props?.riskBp ?? 100);
  const entry = Number(props?.entry ?? 4_025);
  const [distance, setDistance] = useState(115);
  const shares = positionSize(account, riskBp, entry, entry - distance);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={C.account} value={usd(account)} />
        <Stat label={C.risk} value={formatBp(riskBp)} />
        <Stat label={C.entry} value={usd(entry)} />
      </div>
      <Slider
        label={C.distance}
        shown={`${usd(distance)} · ${C.stop} ${usd(entry - distance)}`}
        min={20}
        max={400}
        step={5}
        value={distance}
        onChange={(value) => {
          setDistance(value);
          done();
        }}
      />
      <div className="grid grid-cols-3 gap-2" aria-live="polite">
        <Stat label={C.shares} value={C.units(shares)} tone="gold" />
        <Stat label={C.value} value={usd(shares * entry)} />
        <Stat label={C.loss} value={usd(shares * distance)} tone="loss" />
      </div>
    </div>
  );
}

/* ── R-multiples (r3) ─────────────────────────────────────────────────── */

export function RMultiplesWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.rMultiples;
  const done = useDone(onDone);
  const [winBp, setWinBp] = useState(4_000);
  const [winR, setWinR] = useState(250);
  const lossR = 100;
  const e = expectancyR({ winBp, winR, lossR });
  return (
    <div className="space-y-4">
      <Slider
        label={C.winRate}
        shown={formatBp(winBp)}
        min={1_000}
        max={8_000}
        step={500}
        value={winBp}
        onChange={(v) => {
          setWinBp(v);
          done();
        }}
      />
      <Slider
        label={C.winSize}
        shown={r(winR)}
        min={50}
        max={400}
        step={50}
        value={winR}
        onChange={(v) => {
          setWinR(v);
          done();
        }}
      />
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <Stat
          label={C.perTrade}
          value={`${e > 0 ? '▲' : e < 0 ? '▼' : ''} ${r(e)}`}
          tone={e > 0 ? 'gain' : e < 0 ? 'loss' : 'fg'}
        />
        <Stat
          label={C.ten}
          value={r(e * 10)}
          tone={e > 0 ? 'gain' : e < 0 ? 'loss' : 'fg'}
        />
      </div>
      <p className="type-small text-fg-2">
        {C.lossSize}: {r(-lossR)}.{' '}
        {C.breakEven(formatBp(breakEvenWinBp(winR, lossR)))}
      </p>
    </div>
  );
}

/* ── Drawdown (r4) ────────────────────────────────────────────────────── */

export function DrawdownWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.drawdown;
  const done = useDone(onDone);
  const [lossBp, setLossBp] = useState(3_000);
  const need = recoveryBp(lossBp);
  const trades = tradesToRecover(lossBp, 1_000);
  const bar = (bp: number) => `${Math.min(100, bp / 100)}%`;
  return (
    <div className="space-y-4">
      <Slider
        label={C.loss}
        shown={formatBp(lossBp)}
        min={1_000}
        max={9_000}
        step={1_000}
        value={lossBp}
        onChange={(v) => {
          setLossBp(v);
          done();
        }}
      />
      <div className="space-y-2" aria-hidden>
        <div className="h-3 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-loss"
            style={{ width: bar(lossBp) }}
          />
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-gold"
            style={{ width: bar(need) }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <Stat label={C.loss} value={`▼ ${formatBp(lossBp)}`} tone="loss" />
        <Stat label={C.need} value={`▲ ${formatBp(need)}`} tone="gold" />
      </div>
      <Stat
        label={C.trades}
        value={trades === null ? C.never : String(trades)}
      />
    </div>
  );
}

/* ── Expectancy over 200 trades (r6) ──────────────────────────────────── */

export function ExpectancyWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.expectancy;
  const done = useDone(onDone);
  const seed = String(props?.seed ?? 'many-trades');
  const [winBp, setWinBp] = useState(4_000);
  const [winR, setWinR] = useState(250);
  const [riskBp, setRiskBp] = useState(200);
  const [run, setRun] = useState(0);
  const start = 100_000;
  const strategy = { winBp, winR, lossR: 100 };
  const curve = run
    ? equityCurve(start, riskBp, outcomes(`${seed}:${run}`, 200, strategy))
    : null;
  const low = curve ? Math.min(...curve) : 0;
  const high = curve ? Math.max(...curve) : 1;
  const points = curve
    ?.map(
      (value, i) =>
        `${(i / 200) * 400},${140 - ((value - low) / Math.max(1, high - low)) * 130 - 5}`,
    )
    .join(' ');
  const e = expectancyR(strategy);
  return (
    <div className="space-y-4">
      <Slider
        label={C.winRate}
        shown={formatBp(winBp)}
        min={2_000}
        max={7_000}
        step={500}
        value={winBp}
        onChange={setWinBp}
      />
      <Slider
        label={C.winSize}
        shown={r(winR)}
        min={50}
        max={400}
        step={50}
        value={winR}
        onChange={setWinR}
      />
      <p className="-mb-2 type-label text-fg-2">{C.risk}</p>
      <Choices
        name="risk-per-trade"
        label={C.risk}
        options={[100, 200, 500, 1_000].map((value) => ({
          value,
          label: formatBp(value),
        }))}
        value={riskBp}
        onChange={setRiskBp}
      />
      <Button
        onClick={() => {
          setRun((n) => n + 1);
          done();
        }}
      >
        {run ? C.rerun : C.run}
      </Button>
      {curve ? (
        <>
          <div className="rounded-md border border-line bg-ink">
            <svg
              viewBox="0 0 400 140"
              preserveAspectRatio="none"
              className="block h-36 w-full"
              aria-hidden
            >
              <polyline
                points={points}
                fill="none"
                className="stroke-gold"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-2" aria-live="polite">
            <Stat
              label={C.end}
              value={usd(curve[curve.length - 1] ?? 0)}
              tone={(curve.at(-1) ?? 0) >= start ? 'gain' : 'loss'}
            />
            <Stat
              label={C.drawdown}
              value={`▼ ${formatBp(maxDrawdownBp(curve))}`}
              tone="loss"
            />
            <Stat
              label={C.perTrade}
              value={r(e)}
              tone={e >= 0 ? 'gain' : 'loss'}
            />
          </div>
          <p className="font-mono type-tick text-muted">
            {C.start}: {usd(start)}
          </p>
        </>
      ) : null}
    </div>
  );
}
