'use client';

import Link from 'next/link';
import { useState } from 'react';
import { JOURNAL as C, tradeDay } from '@/content/journal';
import { lesson } from '@/content/curriculum';
import { formatBp } from '@/lib/core/money';
import {
  FEELINGS,
  SETUPS,
  SOURCES,
  atSamePlaces,
  journalStats,
  plannedR,
  problemOf,
  tradeR,
  withExit,
  type Feeling,
  type JournalSetup,
  type JournalSide,
  type JournalTrade,
  type TradeSource,
} from '@/lib/engines/journal';
import { formatR } from '@/lib/engines/trades';
import { formatPrice } from '@/lib/markets/catalog';
import {
  newTradeId,
  removeTrade,
  saveTrade,
  useJournal,
} from '@/lib/client/journal';
import { Segmented } from '@/components/ui/Segmented';
import { SideTag } from '@/components/signals/parts';
import { Field, Note } from './fields';

/**
 * The journal (lesson p2): log a trade, close it, and see what your trades
 * say: win rate beside average R, the curve in R, whether stops were kept,
 * and the setup or feeling that costs most, with the lesson for it. The
 * arithmetic is lib/engines/journal.ts; the trades stay on this device.
 */

export type JournalStart = {
  market?: string;
  side?: string;
  entry?: string;
  stop?: string;
  target?: string;
  setup?: string;
  source?: string;
};

function pick<T extends string>(
  options: readonly T[],
  value: string | undefined,
  fallback: T,
): T {
  return (options as readonly string[]).includes(value ?? '')
    ? (value as T)
    : fallback;
}

function Chips<T extends string>({
  label,
  options,
  words,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  words: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 type-label text-fg-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 type-small has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${value === option ? 'border-gold bg-gold-soft font-semibold text-fg' : 'border-line text-fg-2 hover:text-fg'}`}
          >
            <input
              type="radio"
              name={label}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {words[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TradeForm({
  start,
  onDone,
}: {
  start: JournalStart;
  onDone: () => void;
}) {
  const [market, setMarket] = useState(start.market ?? '');
  const [side, setSide] = useState<JournalSide>(
    start.side === 'sell' ? 'sell' : 'buy',
  );
  const [entry, setEntry] = useState(start.entry ?? '');
  const [stop, setStop] = useState(start.stop ?? '');
  const [target, setTarget] = useState(start.target ?? '');
  const [exit, setExit] = useState('');
  const [setup, setSetup] = useState<JournalSetup>(
    pick(SETUPS, start.setup, 'other'),
  );
  const [feeling, setFeeling] = useState<Feeling>('calm');
  const [source, setSource] = useState<TradeSource>(
    pick(SOURCES, start.source, 'own'),
  );
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<keyof typeof C.problems | null>(null);

  function submit() {
    if (!market.trim() || !entry.trim() || !stop.trim())
      return setProblem('missing');
    const prices = atSamePlaces([entry, stop, target, exit]);
    if (!prices) return setProblem('price');
    const [e, s, t, x] = prices.units;
    const now = Date.now();
    const trade: JournalTrade = {
      id: newTradeId(),
      market: market.trim().slice(0, 40),
      side,
      decimals: prices.decimals,
      entry: e as number,
      stop: s as number,
      target: t ?? null,
      exit: x ?? null,
      setup,
      feeling,
      source,
      openedAt: now,
      closedAt: x ? now : null,
      note: note.trim().slice(0, 500),
    };
    const wrong = problemOf(trade);
    if (wrong) return setProblem(wrong);
    saveTrade(trade);
    onDone();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mt-4 space-y-4 rounded-xl border border-gold bg-panel p-4 sm:p-5"
      noValidate
    >
      <h2 className="type-title text-fg">{C.form.title}</h2>
      {start.source === 'signal' ? <Note>{C.form.fromSignal}</Note> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="j-market"
          label={C.form.market}
          value={market}
          onChange={setMarket}
          placeholder={C.form.marketHint}
          mode="text"
        />
        <Segmented
          name="j-side"
          label={C.form.side}
          options={[
            { value: 'buy', label: C.form.buy },
            { value: 'sell', label: C.form.sell },
          ]}
          value={side}
          onChange={setSide}
        />
        <Field
          id="j-entry"
          label={C.form.entry}
          value={entry}
          onChange={setEntry}
        />
        <Field
          id="j-stop"
          label={C.form.stop}
          value={stop}
          onChange={setStop}
          help={C.form.stopHelp}
        />
        <Field
          id="j-target"
          label={C.form.target}
          value={target}
          onChange={setTarget}
        />
        <Field
          id="j-exit"
          label={C.form.exit}
          value={exit}
          onChange={setExit}
        />
      </div>
      <Chips
        label={C.form.setup}
        options={SETUPS}
        words={C.setups}
        value={setup}
        onChange={setSetup}
      />
      <Chips
        label={C.form.feeling}
        options={FEELINGS}
        words={C.feelings}
        value={feeling}
        onChange={setFeeling}
      />
      <Chips
        label={C.form.source}
        options={SOURCES}
        words={C.sources}
        value={source}
        onChange={setSource}
      />
      <div>
        <label htmlFor="j-note" className="block type-label text-fg-2">
          {C.form.note}
        </label>
        <textarea
          id="j-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          className="mt-1.5 block w-full rounded-md border border-line bg-ink px-3 py-2 type-body text-fg outline-none focus:border-gold"
        />
      </div>
      {problem ? <Note tone="warn">{C.problems[problem]}</Note> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn-3d inline-flex min-h-12 items-center rounded-md bg-gold px-5 type-body font-bold text-ink"
        >
          {C.form.save}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex min-h-12 items-center rounded-md border border-edge px-5 type-body font-semibold text-fg"
        >
          {C.form.cancel}
        </button>
      </div>
    </form>
  );
}

function TradeRow({ trade }: { trade: JournalTrade }) {
  const [closing, setClosing] = useState(false);
  const [exit, setExit] = useState('');
  const [bad, setBad] = useState(false);
  const r = tradeR(trade);
  const planned = plannedR(trade);
  const price = (units: number) => formatPrice(units, trade.decimals);
  const when = tradeDay(trade.closedAt ?? trade.openedAt);

  function close() {
    const closed = withExit(trade, exit, Date.now());
    if (!closed) return setBad(true);
    saveTrade(closed);
  }

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="type-small font-semibold text-fg">
              {trade.market}
            </span>
            <SideTag side={trade.side} />
            <span className="type-tick text-fg-2">
              {C.setups[trade.setup]} · {C.feelings[trade.feeling]}
            </span>
          </p>
          <p className="mt-0.5 font-mono type-tick text-muted num">
            {when} · {price(trade.entry)} →{' '}
            {trade.exit === null ? '…' : price(trade.exit)} ·{' '}
            {C.form.stop.toLowerCase()} {price(trade.stop)}
            {planned !== null && r === null
              ? ` · ${C.planned(formatR(planned, { signed: false }))}`
              : ''}
          </p>
          {trade.note ? (
            <p className="mt-1 type-tick text-fg-2">{trade.note}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          {r !== null ? (
            <p
              className={`font-mono type-small font-bold num ${r > 0 ? 'text-gain' : r < 0 ? 'text-loss' : 'text-fg-2'}`}
            >
              {formatR(r)}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setClosing((v) => !v)}
              className="inline-flex min-h-10 items-center rounded-md border border-edge bg-raised px-3 type-tick font-semibold text-fg"
            >
              {C.close.action}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(C.confirmRemove)) removeTrade(trade.id);
            }}
            className="mt-1 inline-flex min-h-9 items-center type-tick text-muted underline underline-offset-2 hover:text-fg"
          >
            {C.remove}
          </button>
        </div>
      </div>
      {closing && r === null ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            close();
          }}
          className="mt-2 flex items-end gap-2"
        >
          <div className="min-w-0 flex-1">
            <Field
              id={`exit-${trade.id}`}
              label={C.close.label}
              value={exit}
              onChange={setExit}
              invalid={bad}
            />
          </div>
          <button
            type="submit"
            className="btn-3d inline-flex min-h-12 shrink-0 items-center rounded-md bg-gold px-4 type-small font-bold text-ink"
          >
            {C.close.save}
          </button>
        </form>
      ) : null}
    </li>
  );
}

function Curve({ values }: { values: readonly number[] }) {
  if (values.length < 2) return null;
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = high - low || 1;
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) => 40 - ((v - low) / span) * 40;
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="block h-16 w-full"
      aria-hidden
    >
      <line
        x1={0}
        x2={100}
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
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-panel p-3">
      <p className="font-mono type-tick text-muted uppercase">{label}</p>
      <p className="mt-1 truncate font-mono type-heading text-fg num">
        {value}
      </p>
    </div>
  );
}

export function Journal({ start }: { start: JournalStart }) {
  const trades = useJournal();
  const [adding, setAdding] = useState(Boolean(start.entry));
  // A signal's prices fill the first form only; the next "Log a trade" is blank.
  const [prefill, setPrefill] = useState<JournalStart>(start);
  const done = () => {
    setAdding(false);
    if (prefill.entry) {
      setPrefill({});
      window.history.replaceState(null, '', '/journal');
    }
  };
  const stats = journalStats(trades);
  const open = trades.filter((t) => t.exit === null);
  const closed = trades.filter((t) => t.exit !== null);
  const leakLesson = lesson(C.leak.lesson);

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-5 pb-8 sm:px-8 lg:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono type-label text-gold">{C.kicker}</p>
          <h1 className="mt-1 type-display text-fg">{C.title}</h1>
          <p className="mt-2 max-w-[60ch] type-body text-fg-2">
            {C.lead} <span className="text-muted">{C.device}</span>
          </p>
        </div>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-3d inline-flex min-h-12 items-center rounded-md bg-gold px-5 type-body font-bold text-ink"
          >
            {C.add}
          </button>
        ) : null}
      </div>

      {adding ? <TradeForm start={prefill} onDone={done} /> : null}

      {!trades.length && !adding ? (
        <p className="mt-6 rounded-xl border border-dashed border-edge p-5 type-body text-fg-2">
          {C.empty}
        </p>
      ) : null}

      {trades.length ? (
        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start lg:gap-6">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label={C.stats.closed} value={String(stats.closed)} />
              <Stat
                label={C.stats.won}
                value={stats.closed ? formatBp(stats.winRateBp) : '—'}
              />
              <Stat
                label={C.stats.average}
                value={stats.closed ? formatR(stats.avgR) : '—'}
              />
              <Stat label={C.stats.total} value={formatR(stats.totalR)} />
            </div>

            {open.length ? (
              <section
                aria-labelledby="open-trades"
                className="rounded-xl border border-line bg-panel px-4 pt-3"
              >
                <h2 id="open-trades" className="font-mono type-label text-fg-2">
                  {C.lists.open}{' '}
                  <span className="text-muted num">· {open.length}</span>
                </h2>
                <ul className="divide-y divide-line">
                  {open.map((trade) => (
                    <TradeRow key={trade.id} trade={trade} />
                  ))}
                </ul>
              </section>
            ) : null}

            {closed.length ? (
              <section
                aria-labelledby="closed-trades"
                className="rounded-xl border border-line bg-panel px-4 pt-3"
              >
                <h2
                  id="closed-trades"
                  className="font-mono type-label text-fg-2"
                >
                  {C.lists.closed}{' '}
                  <span className="text-muted num">· {closed.length}</span>
                </h2>
                <ul className="divide-y divide-line">
                  {closed.map((trade) => (
                    <TradeRow key={trade.id} trade={trade} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="mt-4 space-y-4 lg:mt-0">
            {stats.closed > 1 ? (
              <section className="rounded-xl border border-line bg-panel p-4">
                <h2 className="font-mono type-label text-fg-2">
                  {C.stats.curve}
                </h2>
                <div className="mt-2">
                  <Curve values={stats.curve} />
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 font-mono type-tick">
                  <div>
                    <dt className="text-muted uppercase">{C.stats.drawdown}</dt>
                    <dd className="text-fg num">{formatR(-stats.drawdownR)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted uppercase">{C.stats.stops}</dt>
                    <dd className="text-fg num">
                      {C.stats.stopsValue(stats.stopsKept, stats.losses)}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : null}

            {stats.leak ? (
              <section className="rounded-xl border border-loss p-4">
                <h2 className="type-heading text-fg">{C.leak.title}</h2>
                <p className="mt-1 type-small text-fg-2">
                  {stats.leak.by === 'setup'
                    ? C.leak.setup(
                        C.setups[stats.leak.key as JournalSetup],
                        stats.leak.trades,
                        formatR(stats.leak.avgR),
                      )
                    : C.leak.feeling(
                        C.feelings[stats.leak.key as Feeling],
                        stats.leak.trades,
                        formatR(stats.leak.avgR),
                      )}
                </p>
                {leakLesson.playAt ? (
                  <Link
                    href={leakLesson.playAt}
                    className="mt-2 inline-flex min-h-11 items-center gap-1 type-small font-semibold text-gold underline underline-offset-4"
                  >
                    {leakLesson.title} <span aria-hidden>→</span>
                  </Link>
                ) : null}
              </section>
            ) : null}

            {stats.closed ? (
              <section className="rounded-xl border border-line bg-panel p-4">
                {(
                  [
                    ['setup', C.groups.setup, stats.bySetup],
                    ['feeling', C.groups.feeling, stats.byFeeling],
                  ] as const
                ).map(([kind, title, groups]) => (
                  <div key={kind} className="mt-3 first:mt-0">
                    <h2 className="font-mono type-label text-fg-2">{title}</h2>
                    <ul className="mt-1 divide-y divide-line">
                      {groups.map((g) => (
                        <li
                          key={g.key}
                          className="flex items-center justify-between gap-2 py-2 type-small"
                        >
                          <span className="text-fg">
                            {kind === 'setup'
                              ? C.setups[g.key as JournalSetup]
                              : C.feelings[g.key as Feeling]}
                            <span className="ml-2 type-tick text-muted">
                              {C.groups.trades(g.trades)}
                            </span>
                          </span>
                          <span className="font-mono num text-fg-2">
                            {formatBp(g.winRateBp)} · {formatR(g.avgR)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}
            <p className="type-tick text-muted">{C.honest}</p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
