'use client';

import { useMemo, useState } from 'react';
import { LANDING } from '@/content/landing';
import { formatBp, formatMoney, fromMinor, shareBp } from '@/lib/core/money';
import {
  LEVERAGES,
  LEVERAGE_LAB,
  liquidationMoveBp,
  lossBand,
  runLeverage,
  type LossBand,
} from '@/lib/engines/risk';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { Delta } from '@/components/ui/Delta';
import { useReveal } from './useReveal';

/**
 * Risk Lab on the landing page (spec §19, curriculum m5): choose leverage,
 * predict, watch the market's path, see why the path mattered more than the
 * ending. Every number comes from lib/engines/risk.ts.
 */

const COPY = LANDING.risk;
const BANDS: LossBand[] = ['little', 'lot', 'all'];
const usd = (cents: number, signed = false) =>
  formatMoney(fromMinor(cents, 'USD'), { signed });
/** Day 0 is the one every visitor sees first: 20× survives it, 25× doesn't. */
const seedFor = (day: number) => (day === 0 ? 'day-4' : `day-4-${day}`);

/* The path chart's window in basis points, fixed so it doesn't jump between days. */
const TOP = 300;
const BOTTOM = -700;
const W = 480;
const H = 160;
const yOf = (bp: number) =>
  ((TOP - Math.max(BOTTOM, Math.min(TOP, bp))) / (TOP - BOTTOM)) * H;

export function LeverageDemo() {
  const [leverage, setLeverage] = useState<number>(20);
  const [guess, setGuess] = useState<LossBand | null>(null);
  const [day, setDay] = useState(0);
  const [run, setRun] = useState(0);

  const result = useMemo(
    () => runLeverage(LEVERAGE_LAB, leverage, seedFor(day)),
    [leverage, day],
  );
  const steps = result.path.length;
  const shown = useReveal(steps, run, 2600);
  const done = run !== 0 && shown === steps;
  const band = lossBand(LEVERAGE_LAB, result);
  const liqBp = liquidationMoveBp(LEVERAGE_LAB, leverage);
  const current =
    shown > 0 ? (result.equity[shown - 1] as number) : LEVERAGE_LAB.capital;
  const closedStep =
    result.liquidatedAt !== null && shown > result.liquidatedAt
      ? result.liquidatedAt
      : null;

  const points = result.path
    .slice(0, Math.max(shown, 1))
    .map((bp, i) => `${(i / (steps - 1)) * W},${yOf(bp)}`)
    .join(' ');

  function reset() {
    setGuess(null);
    setRun(0);
  }

  const coachLine =
    result.liquidatedAt === null
      ? COPY.coach.survived(
          formatBp(LEVERAGE_LAB.endMoveBp),
          usd(result.pnl, true),
        )
      : liqBp < LEVERAGE_LAB.endMoveBp
        ? COPY.coach.dipKilled(
            formatBp(LEVERAGE_LAB.endMoveBp),
            formatBp(-result.worstBp),
            formatBp(liqBp),
          )
        : COPY.coach.fastKilled(formatBp(liqBp));

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="type-heading text-fg">{COPY.setup}</p>
        <TruthBadge truth="simulation" />
      </div>

      <div className="space-y-4 p-4">
        <fieldset className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          <legend className="sr-only">{COPY.setup}</legend>
          {LEVERAGES.map((value) => (
            <label
              key={value}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border font-mono type-body font-semibold num has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${leverage === value ? 'border-gold bg-gold-soft text-gold' : 'border-edge bg-raised text-fg'}`}
            >
              <input
                type="radio"
                name="leverage"
                value={value}
                checked={leverage === value}
                onChange={() => {
                  setLeverage(value);
                  reset();
                }}
                className="sr-only"
              />
              {value}×
            </label>
          ))}
        </fieldset>

        <dl className="grid grid-cols-2 gap-2 font-mono num">
          <div className="rounded-md bg-raised px-3 py-2">
            <dt className="type-tick text-muted">{COPY.position}</dt>
            <dd className="type-heading text-fg">{usd(result.position)}</dd>
          </div>
          <div className="rounded-md bg-raised px-3 py-2">
            <dt className="type-tick text-muted">{COPY.closedAt}</dt>
            <dd className="type-heading text-loss">▼ {formatBp(-liqBp)}</dd>
          </div>
        </dl>

        <div className="relative rounded-md border border-line bg-ink">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="block h-40 w-full"
            aria-hidden
          >
            <line
              x1={0}
              x2={W}
              y1={yOf(0)}
              y2={yOf(0)}
              className="stroke-edge"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={0}
              x2={W}
              y1={yOf(liqBp)}
              y2={yOf(liqBp)}
              className="stroke-loss"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {run !== 0 ? (
              <polyline
                points={points}
                fill="none"
                className={closedStep !== null ? 'stroke-loss' : 'stroke-gold'}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>
          <span
            className="pointer-events-none absolute right-1 -translate-y-1/2 rounded-sm bg-loss px-1.5 font-mono text-[0.6875rem] leading-4 font-semibold text-ink num"
            style={{ top: `${(yOf(liqBp) / H) * 100}%` }}
          >
            {COPY.liquidated} {formatBp(liqBp)}
          </span>
          <div className="absolute top-2 left-2 rounded-sm bg-panel/80 px-2 py-1 font-mono num">
            <span className="type-tick text-muted">{COPY.equity} </span>
            <span
              className={`type-small font-semibold ${closedStep !== null ? 'text-loss' : 'text-fg'}`}
            >
              {usd(current)}
            </span>
          </div>
        </div>

        {run === 0 ? (
          <>
            <p className="type-body text-fg">
              {COPY.predict(formatBp(-LEVERAGE_LAB.endMoveBp))}
            </p>
            <fieldset className="grid grid-cols-3 gap-2">
              <legend className="sr-only">
                {COPY.predict(formatBp(-LEVERAGE_LAB.endMoveBp))}
              </legend>
              {BANDS.map((option) => (
                <label
                  key={option}
                  className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-2 text-center type-small font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${guess === option ? 'border-gold bg-gold-soft text-gold' : 'border-edge bg-raised text-fg'}`}
                >
                  <input
                    type="radio"
                    name="guess"
                    value={option}
                    checked={guess === option}
                    onChange={() => setGuess(option)}
                    className="sr-only"
                  />
                  {COPY.bands[option]}
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              disabled={!guess}
              onClick={() => setRun((n) => n + 1)}
              className="min-h-12 w-full rounded-md bg-gold px-5 type-body font-semibold text-ink active:scale-[0.98] disabled:opacity-40"
            >
              {guess ? COPY.run : COPY.pick}
            </button>
          </>
        ) : null}

        {done ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="type-small font-semibold text-fg-2">
                {guess === band ? COPY.guessed.right : COPY.guessed.wrong}{' '}
                <span className="text-fg">{COPY.bands[band]}.</span>
              </p>
              <Delta
                amount={fromMinor(result.pnl, 'USD')}
                shareBp={shareBp(
                  fromMinor(result.pnl, 'USD'),
                  fromMinor(LEVERAGE_LAB.capital, 'USD'),
                )}
              />
            </div>
            <p className="border-l-2 border-gold pl-3 type-body text-fg">
              {coachLine}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={reset}
                className="min-h-12 rounded-md bg-gold px-4 type-small font-semibold text-ink active:scale-[0.98]"
              >
                {COPY.retry}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDay((d) => d + 1);
                  setRun((n) => n + 1);
                }}
                className="min-h-12 rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
              >
                {COPY.another}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
