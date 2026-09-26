'use client';

import { useMemo, useState } from 'react';
import { LANDING } from '@/content/landing';
import { formatMoney, fromMinor } from '@/lib/core/money';
import {
  CHART,
  STOP_CHOICES,
  anatomy,
  chartScenario,
  playPlan,
  touches,
  type Ending,
  type StopChoice,
} from '@/lib/engines/chart';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { Delta } from '@/components/ui/Delta';
import { CandleChart, type ChartLevel, type ChartMark } from './CandleChart';
import { useReveal } from './useReveal';

/**
 * The landing page's first lesson (curriculum c2, c5, r1): read a candle,
 * find support, then plan a trade and watch the plan meet the market.
 *
 * Every number comes from lib/engines/chart.ts; this component chooses what
 * to show and when. The next candles stay hidden until the learner commits,
 * and the chart's scale is fixed so it can't give them away.
 */

const COPY = LANDING.demo;
const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
const seedFor = (n: number) => (n === 0 ? 'koko' : `koko-${n}`);

type Step = 0 | 1 | 2;

export function ChartDemo() {
  const [chartNumber, setChartNumber] = useState(0);
  const [ending, setEnding] = useState<Ending>('bounce');
  const [step, setStep] = useState<Step>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [pick, setPick] = useState<'a' | 'b' | 'c' | null>(null);
  const [stop, setStop] = useState<StopChoice | null>(null);
  const [run, setRun] = useState(0);

  const scenario = useMemo(
    () => chartScenario(seedFor(chartNumber), ending),
    [chartNumber, ending],
  );
  const slots = scenario.seen.length + scenario.next.length;
  const shownNext = useReveal(scenario.next.length, run, 1800);
  const played = run !== 0;
  const done = played && shownNext === scenario.next.length;
  const result = stop ? playPlan(scenario, stop) : null;

  const focus = selected ?? scenario.seen.length - 1;
  const focused = scenario.seen[focus] ?? scenario.seen[0]!;
  const parts = anatomy(focused);

  const supportTouches = touches(scenario, scenario.support, 'support');
  const resistanceTouches = touches(
    scenario,
    scenario.resistance,
    'resistance',
  );
  const found = pick === scenario.answer;

  function newChart() {
    setChartNumber((n) => n + 1);
    setEnding('bounce');
    setStep(0);
    setSelected(null);
    setPick(null);
    setStop(null);
    setRun(0);
  }

  function replay(nextEnding: Ending) {
    setEnding(nextEnding);
    setRun((n) => n + 1);
  }

  /* What the chart draws at each step. */
  const levels: ChartLevel[] = [];
  const marks: ChartMark[] = [];
  if (step === 1) {
    for (const candidate of scenario.candidates) {
      const isPick = pick === candidate.key;
      levels.push({
        price: candidate.price,
        label: COPY.floor.line(candidate.key),
        tone: isPick && found ? 'gold' : isPick ? 'loss' : 'muted',
        dashed: !(isPick && found),
      });
    }
    if (found)
      for (const i of supportTouches)
        marks.push({
          index: i,
          price: scenario.seen[i]!.low,
          label: '▲',
          tone: 'gold',
          side: 'below',
        });
    if (pick === 'a')
      for (const i of resistanceTouches)
        marks.push({
          index: i,
          price: scenario.seen[i]!.high,
          label: '▼',
          tone: 'loss',
          side: 'above',
        });
  }
  if (step === 2) {
    levels.push({ price: scenario.support, label: '', tone: 'gold' });
    // The entry is unlabelled on the chart (the words above give it): it sits
    // within cents of the stop, and two labels there would overlap.
    levels.push({ price: scenario.entry, label: '', tone: 'fg', dashed: true });
    if (stop && stop !== 'none')
      levels.push({
        price: scenario.stops[stop],
        label: usd(scenario.stops[stop]),
        tone: 'loss',
        dashed: true,
      });
    if (done && result?.stoppedAt != null)
      marks.push({
        index: scenario.seen.length + result.stoppedAt,
        price: scenario.next[result.stoppedAt]!.low,
        label: '✕',
        tone: 'loss',
        side: 'below',
      });
  }

  const candles =
    step === 2 && played
      ? [...scenario.seen, ...scenario.next.slice(0, shownNext)]
      : scenario.seen;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono type-tick text-muted uppercase">
            {COPY.label}
          </p>
          <p className="type-small font-semibold text-fg">{COPY.stock}</p>
        </div>
        <TruthBadge truth="simulation" />
      </div>

      <ol className="grid grid-cols-3 border-b border-line">
        {COPY.steps.map((name, i) => (
          <li
            key={name}
            aria-current={step === i ? 'step' : undefined}
            className={`border-b-2 px-2 py-2 text-center type-tick ${step === i ? 'border-gold text-fg' : i < step ? 'border-transparent text-fg-2' : 'border-transparent text-muted'}`}
          >
            <span className="font-mono">{i + 1}</span> {name}
          </li>
        ))}
      </ol>

      <div className="px-2 pt-3">
        <CandleChart
          candles={candles}
          slots={slots}
          view={CHART.view}
          levels={levels}
          marks={marks}
          selected={step === 0 ? focus : null}
          futureFrom={
            step === 2 && played
              ? scenario.seen.length + shownNext
              : scenario.seen.length
          }
          futureLabel={step === 2 && played ? undefined : COPY.future}
          label={COPY.stock}
        />
      </div>

      <div className="space-y-4 p-4" aria-live="polite">
        {step === 0 ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h3 className="type-heading text-fg">{COPY.candle.title}</h3>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="grid size-12 place-items-center rounded-md border border-edge bg-raised text-fg"
                  aria-label={COPY.candle.earlier}
                  onClick={() => setSelected(Math.max(0, focus - 1))}
                >
                  ◀
                </button>
                <button
                  type="button"
                  className="grid size-12 place-items-center rounded-md border border-edge bg-raised text-fg"
                  aria-label={COPY.candle.later}
                  onClick={() =>
                    setSelected(Math.min(scenario.seen.length - 1, focus + 1))
                  }
                >
                  ▶
                </button>
              </div>
            </div>
            <p
              className={`type-body font-semibold ${parts.direction === 'up' ? 'text-gain' : parts.direction === 'down' ? 'text-loss' : 'text-fg-2'}`}
            >
              {parts.direction === 'up'
                ? '▲ '
                : parts.direction === 'down'
                  ? '▼ '
                  : ''}
              {COPY.candle[parts.direction]}
            </p>
            <dl className="grid grid-cols-4 gap-2 font-mono num">
              {(
                [
                  [COPY.candle.open, focused.open],
                  [COPY.candle.high, focused.high],
                  [COPY.candle.low, focused.low],
                  [COPY.candle.close, focused.close],
                ] as const
              ).map(([name, value]) => (
                <div key={name} className="rounded-md bg-raised px-2 py-2">
                  <dt className="type-tick text-muted">{name}</dt>
                  <dd className="type-small text-fg">{usd(value)}</dd>
                </div>
              ))}
            </dl>
            <p className="type-small text-fg-2">
              {COPY.candle.wickNote(usd(parts.lowerWick))}
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-12 w-full rounded-md bg-gold px-5 type-body font-semibold text-ink active:scale-[0.98]"
            >
              {COPY.candle.next}
            </button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h3 className="type-heading text-fg">{COPY.floor.title}</h3>
            <p className="type-small text-fg-2">{COPY.floor.prompt}</p>
            <fieldset className="grid grid-cols-3 gap-2">
              <legend className="sr-only">{COPY.floor.title}</legend>
              {scenario.candidates.map((candidate) => (
                <button
                  key={candidate.key}
                  type="button"
                  aria-pressed={pick === candidate.key}
                  onClick={() => setPick(candidate.key)}
                  className={`min-h-12 rounded-md border px-2 font-mono type-small font-semibold ${pick === candidate.key ? (found ? 'border-gold bg-gold-soft text-gold' : 'border-loss text-loss') : 'border-edge bg-raised text-fg'}`}
                >
                  {COPY.floor.line(candidate.key)}
                </button>
              ))}
            </fieldset>
            {pick ? (
              <p className={`type-small ${found ? 'text-fg' : 'text-fg-2'}`}>
                {found
                  ? COPY.floor.right(
                      supportTouches.length,
                      usd(scenario.support),
                    )
                  : pick === 'a'
                    ? COPY.floor.resistance(
                        resistanceTouches.length,
                        usd(scenario.resistance),
                      )
                    : COPY.floor.middle}
              </p>
            ) : null}
            {found ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-12 w-full rounded-md bg-gold px-5 type-body font-semibold text-ink active:scale-[0.98]"
              >
                {COPY.floor.next}
              </button>
            ) : pick ? (
              <button
                type="button"
                onClick={() => setPick(scenario.answer)}
                className="min-h-12 type-small text-fg-2 underline underline-offset-4"
              >
                {COPY.floor.reveal}
              </button>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h3 className="type-heading text-fg">{COPY.plan.title}</h3>
            <p className="type-small text-fg-2">
              {COPY.plan.setup(scenario.shares, usd(scenario.entry))}
            </p>
            {!played ? (
              <>
                <fieldset className="grid gap-2">
                  <legend className="sr-only">{COPY.plan.title}</legend>
                  {STOP_CHOICES.map((choice) => {
                    const text =
                      choice === 'none'
                        ? COPY.plan.choices.none()
                        : COPY.plan.choices[choice](
                            usd(scenario.stops[choice]),
                            usd(
                              (scenario.entry - scenario.stops[choice]) *
                                scenario.shares,
                            ),
                          );
                    return (
                      <label
                        key={choice}
                        className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${stop === choice ? 'border-gold bg-gold-soft' : 'border-edge bg-raised'}`}
                      >
                        <input
                          type="radio"
                          name="stop"
                          value={choice}
                          checked={stop === choice}
                          onChange={() => setStop(choice)}
                          className="sr-only"
                        />
                        <span className="type-small font-semibold text-fg">
                          {text.label}
                        </span>
                        <span className="shrink-0 font-mono type-tick text-fg-2 num">
                          {text.detail}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
                <button
                  type="button"
                  disabled={!stop}
                  onClick={() => setRun((n) => n + 1)}
                  className="min-h-12 w-full rounded-md bg-gold px-5 type-body font-semibold text-ink active:scale-[0.98] disabled:opacity-40"
                >
                  {stop ? COPY.plan.go : COPY.plan.pick}
                </button>
              </>
            ) : null}

            {done && result ? (
              <PlanOutcome
                ending={ending}
                result={result}
                scenario={scenario}
                onOther={() => replay(ending === 'bounce' ? 'break' : 'bounce')}
                onAgain={() => {
                  setStop(null);
                  setRun(0);
                }}
                onFresh={newChart}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function PlanOutcome({
  ending,
  result,
  scenario,
  onOther,
  onAgain,
  onFresh,
}: {
  ending: Ending;
  result: ReturnType<typeof playPlan>;
  scenario: ReturnType<typeof chartScenario>;
  onOther: () => void;
  onAgain: () => void;
  onFresh: () => void;
}) {
  const coach = LANDING.planCoach;
  const first = scenario.next[0]!;
  const line =
    ending === 'bounce'
      ? result.stop === 'room'
        ? coach.bounce.room(usd(result.pnl), usd(result.risked ?? 0))
        : result.stop === 'tight'
          ? coach.bounce.tight(usd(first.low), usd(scenario.stops.tight))
          : coach.bounce.none(
              formatMoney(fromMinor(result.pnl, 'USD'), { signed: true }),
              formatMoney(fromMinor(result.worst, 'USD'), { signed: true }),
            )
      : result.stop === 'none'
        ? coach.break.none(
            formatMoney(fromMinor(result.pnl, 'USD'), { signed: true }),
            formatMoney(fromMinor(result.worst, 'USD'), { signed: true }),
          )
        : coach.break[result.stop](usd(-result.pnl));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono type-label text-fg-2">
          {COPY.plan.ended[ending]} ·{' '}
          {result.stoppedAt != null ? COPY.plan.stopped : COPY.plan.held}
        </p>
        <Delta amount={fromMinor(result.pnl, 'USD')} />
      </div>
      <p className="border-l-2 border-gold pl-3 type-body text-fg">{line}</p>

      <div>
        <p className="mb-2 font-mono type-tick text-muted uppercase">
          {COPY.plan.compare}
        </p>
        <ul className="divide-y divide-line rounded-md border border-line">
          {STOP_CHOICES.map((choice) => {
            const other = playPlan(scenario, choice);
            const text =
              choice === 'none'
                ? COPY.plan.choices.none().label
                : COPY.plan.choices[choice](usd(scenario.stops[choice]), '')
                    .label;
            return (
              <li
                key={choice}
                className={`flex items-center justify-between gap-3 px-3 py-2 ${choice === result.stop ? 'bg-gold-soft' : ''}`}
              >
                <span className="min-w-0 type-small text-fg-2">{text}</span>
                <span className="shrink-0 whitespace-nowrap">
                  <Delta amount={fromMinor(other.pnl, 'USD')} size="small" />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onOther}
          className="min-h-12 rounded-md bg-gold px-4 type-small font-semibold text-ink active:scale-[0.98]"
        >
          {COPY.plan.other[ending]}
        </button>
        <button
          type="button"
          onClick={onAgain}
          className="min-h-12 rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
        >
          {COPY.plan.again}
        </button>
        <button
          type="button"
          onClick={onFresh}
          className="min-h-12 rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
        >
          {COPY.plan.fresh}
        </button>
      </div>
    </div>
  );
}
