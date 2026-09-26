'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PLAY } from '@/content/copy/play';
import {
  debrief,
  eventLine,
  money,
  PAYDAY,
  predictionLine,
  revealLines,
  whatIfLabel,
} from '@/content/scenarios/payday';
import { COUNTRIES, COUNTRY_ORDER, type CountryCode } from '@/lib/core/country';
import { newSeed } from '@/lib/core/rng';
import {
  dailyEssentials,
  EMPTY_SPLIT,
  playMonth,
  schemeReveal,
  whatIfs,
  type PaydayAction,
  type Split,
  type WhatIfKey,
} from '@/lib/engines/payday';
import { payday } from '@/lib/experiences/payday';
import { replay } from '@/lib/experiences/types';
import { saveRun, track } from '@/lib/client/track';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Stat } from '@/components/ui/Stat';
import { ChevronRightIcon } from '@/components/ui/icons';
import { Allocate } from './Allocate';
import { Compare } from './Compare';
import { MonthPlayer } from './MonthPlayer';

/**
 * The first 3 minutes (plan §8): no sign-up, no video, no course list.
 *
 *   intro → split → guess → the month → month end → what if → the maths → another?
 *
 * Every number on these screens comes from the engine replaying this run's
 * actions (lib/engines/payday.ts); this component decides only what to show
 * next. The first month uses the fixed seed "pilot", so everyone in the
 * Phase 1 pilot lives the same month and their choices can be compared.
 * "Another one" draws a fresh seed: same life, a different month.
 */

type Step =
  | 'intro'
  | 'allocate'
  | 'predict'
  | 'month'
  | 'result'
  | 'whatif'
  | 'custom'
  | 'compare'
  | 'reveal';

type Alt = { key: WhatIfKey | 'custom'; split: Split; runId: string };

const FIRST_SEED = 'pilot';

export function PaydayFlow({
  initialCountry,
}: {
  initialCountry: CountryCode;
}) {
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const [seed, setSeed] = useState(FIRST_SEED);
  const [runId, setRunId] = useState(() => crypto.randomUUID());
  const [round, setRound] = useState(1);
  const [step, setStep] = useState<Step>('intro');
  const [split, setSplit] = useState<Split>(EMPTY_SPLIT);
  const [prediction, setPrediction] = useState(30);
  const [actions, setActions] = useState<PaydayAction[]>([]);
  const [alt, setAlt] = useState<Alt | null>(null);
  const [customSplit, setCustomSplit] = useState<Split>(EMPTY_SPLIT);

  const scenario = PAYDAY[country];
  const { config, words } = scenario;
  const fmt = money(config.currency);

  // The run, replayed from its actions: the only source of the numbers below.
  const played = useMemo(() => {
    if (!actions.some((action) => action.type === 'play')) return null;
    return replay(payday, {
      experience: 'payday',
      version: payday.version,
      config,
      seed,
      actions,
    }).state;
  }, [actions, config, seed]);
  const altEnd = useMemo(
    () => (alt ? playMonth(config, seed, alt.split).end : null),
    [alt, config, seed],
  );

  function start() {
    track('run_started', { country, seed, round }, runId);
    setStep('allocate');
  }

  function play() {
    const next: PaydayAction[] = [
      { type: 'allocate', split },
      { type: 'predict', days: prediction },
      { type: 'play' },
    ];
    setActions(next);
    saveRun({
      id: runId,
      experience: 'payday',
      version: payday.version,
      config,
      seed,
      actions: next,
    });
    track('played', { country, seed, split, prediction }, runId);
    setStep('month');
  }

  function tryWhatIf(key: Alt['key'], altSplit: Split) {
    const id = crypto.randomUUID();
    setAlt({ key, split: altSplit, runId: id });
    saveRun({
      id,
      parentId: runId,
      experience: 'payday',
      version: payday.version,
      config,
      seed,
      actions: [{ type: 'allocate', split: altSplit }, { type: 'play' }],
    });
    track('whatif_played', { key }, runId);
    setStep('compare');
  }

  function another() {
    track('another_requested', { round }, runId);
    setSeed(newSeed());
    setRunId(crypto.randomUUID());
    setRound((count) => count + 1);
    setSplit(EMPTY_SPLIT);
    setActions([]);
    setAlt(null);
    setStep('intro');
  }

  const end = played?.end ?? null;
  const beats = played?.beats ?? [];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pb-8">
      <header className="sticky top-0 z-10 -mx-4 flex min-h-14 items-center justify-between gap-3 border-b border-line bg-ink px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="type-heading text-fg">{PLAY.title}</h1>
          <TruthBadge truth="simulation" />
        </div>
        <Link
          href="/home"
          className="min-h-11 content-center px-2 type-small text-fg-2 hover:text-fg"
        >
          {PLAY.close}
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-6 pt-5">
        {step === 'intro' ? (
          <>
            {round === 1 ? (
              <fieldset>
                <legend className="type-label text-fg-2">
                  {PLAY.intro.country}
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {COUNTRY_ORDER.map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={code === country}
                      onClick={() => setCountry(code)}
                      className={`min-h-12 rounded-md border px-2 type-small font-semibold ${
                        code === country
                          ? 'border-gold bg-gold-soft text-fg'
                          : 'border-edge bg-raised text-fg-2'
                      }`}
                    >
                      <span aria-hidden>{COUNTRIES[code].flag}</span>{' '}
                      {COUNTRIES[code].name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 type-small text-muted">
                  {PLAY.intro.countryHelp}
                </p>
              </fieldset>
            ) : (
              <p className="type-small text-fg-2">{PLAY.intro.another}</p>
            )}

            <div>
              <p className="type-display text-fg">{PLAY.intro.heading}</p>
              <p className="mt-2 type-title text-fg">
                <span className="num text-gold">{fmt(config.income)}</span>{' '}
                {words.landed}
              </p>
            </div>

            <div>
              <p className="type-small text-fg-2">{PLAY.intro.pressures}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {[
                  words.rentPressure(fmt(config.rent.amount), config.rent.day),
                  words.familyPressure(fmt(config.family.ask)),
                  words.schemePressure,
                ].map((line) => (
                  <li
                    key={line}
                    className="rounded-md border border-line bg-panel p-3 type-body text-fg"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <Button kind="primary" block onClick={start}>
                {PLAY.intro.start}
              </Button>
            </div>
          </>
        ) : null}

        {step === 'allocate' ? (
          <Allocate
            scenario={scenario}
            split={split}
            onChange={setSplit}
            onDone={() => {
              track('allocated', { split }, runId);
              setStep('predict');
            }}
          />
        ) : null}

        {step === 'predict' ? (
          <>
            <div>
              <h2 className="type-title text-fg">{PLAY.predict.heading}</h2>
              <p className="mt-2 type-body text-fg">{PLAY.predict.question}</p>
              <p className="mt-2 type-small text-muted">
                {PLAY.predict.hint(fmt(dailyEssentials(config)))}
              </p>
            </div>
            <Slider
              label={PLAY.predict.label}
              value={prediction}
              min={0}
              max={120}
              step={1}
              format={PLAY.predict.days}
              onChange={setPrediction}
            />
            <div className="mt-auto">
              <Button kind="primary" block onClick={play}>
                {PLAY.predict.play}
              </Button>
            </div>
          </>
        ) : null}

        {step === 'month' ? (
          <MonthPlayer
            scenario={scenario}
            beats={beats}
            onDone={() => {
              track('month_seen', {}, runId);
              setStep('result');
            }}
          />
        ) : null}

        {step === 'result' && end ? (
          <>
            <Stat
              label={PLAY.result.cover}
              value={PLAY.predict.days(end.daysOfCover)}
              hero
              delta={
                <p className="type-body text-fg-2">
                  {predictionLine(prediction, end.daysOfCover)}
                </p>
              }
            />
            <dl className="grid grid-cols-3 gap-2">
              {[
                [PLAY.result.savings, fmt(end.savings), 'text-fg', null],
                [
                  PLAY.result.owed,
                  fmt(end.debt),
                  end.debt > 0 ? 'text-loss' : 'text-fg',
                  null,
                ],
                [
                  PLAY.result.scheme(words.friend),
                  fmt(end.schemeLocked),
                  'text-fg',
                  end.schemeLocked > 0 ? PLAY.result.schemeNote : null,
                ],
              ].map(([label, value, tone, note]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-md border border-line bg-panel p-2.5"
                >
                  <dt className="type-label text-muted">{label}</dt>
                  <dd
                    className={`mt-1 num truncate type-body font-semibold ${tone}`}
                  >
                    {value}
                  </dd>
                  {note ? (
                    <dd className="type-tick text-muted">{note}</dd>
                  ) : null}
                </div>
              ))}
            </dl>

            <section className="rounded-md border border-line bg-panel p-4">
              <h2 className="type-label text-gold">{PLAY.result.coach}</h2>
              <p className="mt-2 type-body text-fg">
                {debrief(end, scenario).say}
              </p>
              <p className="mt-2 type-body font-semibold text-fg">
                {debrief(end, scenario).ask}
              </p>
            </section>

            <details className="rounded-md border border-line bg-panel px-4 py-3">
              <summary className="cursor-pointer type-small text-fg-2">
                {PLAY.result.readAsText}
              </summary>
              <ol className="mt-2 flex flex-col gap-1.5 type-small text-fg-2">
                {beats.map((beat, index) => (
                  <li key={index}>{eventLine(beat.event, scenario)}</li>
                ))}
              </ol>
            </details>

            <div className="mt-auto flex flex-col gap-2">
              <Button
                kind="primary"
                block
                onClick={() => {
                  track('whatif_opened', {}, runId);
                  setStep('whatif');
                }}
              >
                {PLAY.result.whatIf}
              </Button>
              <Button kind="secondary" block onClick={another}>
                {PLAY.result.another}
              </Button>
            </div>
          </>
        ) : null}

        {step === 'whatif' && end ? (
          <>
            <div>
              <h2 className="type-title text-fg">{PLAY.whatIf.heading}</h2>
              <p className="mt-1 type-small text-fg-2">{PLAY.whatIf.help}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {whatIfs(config, split).map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    onClick={() => tryWhatIf(option.key, option.split)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-md border border-edge bg-raised px-4 py-3 text-left type-body text-fg hover:bg-line"
                  >
                    <span className="flex-1">
                      {whatIfLabel(option.key, option.moved, scenario)}
                    </span>
                    <ChevronRightIcon className="shrink-0 text-muted" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCustomSplit(split);
                    setStep('custom');
                  }}
                  className="flex min-h-14 w-full items-center gap-3 rounded-md border border-line px-4 py-3 text-left type-body text-fg-2 hover:text-fg"
                >
                  <span className="flex-1">{PLAY.whatIf.custom}</span>
                  <ChevronRightIcon className="shrink-0 text-muted" />
                </button>
              </li>
            </ul>
          </>
        ) : null}

        {step === 'custom' ? (
          <Allocate
            scenario={scenario}
            split={customSplit}
            onChange={setCustomSplit}
            onDone={() => tryWhatIf('custom', customSplit)}
            doneLabel={PLAY.predict.play}
          />
        ) : null}

        {step === 'compare' && end && altEnd && alt ? (
          <>
            <div>
              <h2 className="type-title text-fg">
                {alt.key === 'custom'
                  ? PLAY.whatIf.custom
                  : whatIfLabel(
                      alt.key,
                      whatIfs(config, split).find((o) => o.key === alt.key)
                        ?.moved ?? 0,
                      scenario,
                    )}
              </h2>
              <p className="mt-1 type-small text-fg-2">{PLAY.whatIf.help}</p>
            </div>
            <Compare scenario={scenario} mine={end} theirs={altEnd} />
            <div className="mt-auto flex flex-col gap-2">
              <Button
                kind="primary"
                block
                onClick={() => {
                  track('reveal_seen', {}, runId);
                  setStep('reveal');
                }}
              >
                {PLAY.whatIf.next(words.friend)}
              </Button>
              <Button kind="secondary" block onClick={() => setStep('whatif')}>
                {PLAY.whatIf.tryAnother}
              </Button>
            </div>
          </>
        ) : null}

        {step === 'reveal' ? (
          <Reveal scenario={scenario} split={split} onAnother={another} />
        ) : null}
      </div>
    </div>
  );
}

/** The scheme's promise, calculated (plan §8, 2:30). A hypothetical, and badged as one. */
function Reveal({
  scenario,
  split,
  onAnother,
}: {
  scenario: (typeof PAYDAY)[CountryCode];
  split: Split;
  onAnother: () => void;
}) {
  const { stake, twoYears } = schemeReveal(scenario.config, split);
  const fmt = money(scenario.config.currency);
  const [headline, why] = revealLines(stake, twoYears, scenario);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="type-label text-fg-2">{PLAY.reveal.heading}</h2>
        <TruthBadge truth="hypothetical" />
      </div>
      <Stat
        label={PLAY.reveal.label(fmt(stake))}
        value={fmt(twoYears, { compact: true })}
        hero
      />
      <p className="type-body text-fg">{headline}</p>
      <p className="type-body font-semibold text-fg">{why}</p>
      <div className="mt-auto flex flex-col gap-2">
        <p className="type-title text-fg">{PLAY.reveal.another}</p>
        <Button kind="primary" block onClick={onAnother}>
          {PLAY.reveal.playAgain}
        </Button>
        <Link
          href="/home"
          className="min-h-12 content-center text-center type-body text-fg-2 hover:text-fg"
        >
          {PLAY.reveal.home}
        </Link>
      </div>
    </>
  );
}
