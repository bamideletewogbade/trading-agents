'use client';

import { useEffect, useState } from 'react';
import { PAPER_PAGE as C } from '@/content/paper';
import { JOURNAL } from '@/content/journal';
import { SIGNALS } from '@/content/signals';
import { formatBp, formatMoney } from '@/lib/core/money';
import {
  FEELINGS,
  SETUPS,
  type Feeling,
  type JournalSetup,
} from '@/lib/engines/journal';
import { PAPER, type PaperAccount, type Position } from '@/lib/engines/paper';
import { formatQuantity, priceAt, sizePosition } from '@/lib/engines/tools';
import { formatR } from '@/lib/engines/trades';
import { MARKETS, formatPrice, marketById } from '@/lib/markets/catalog';
import {
  closePosition,
  fetchQuote,
  placeOrder,
  refreshPaper,
  resetPaper,
  usePaper,
  type Quote,
} from '@/lib/client/paper';
import { useSignals } from '@/lib/client/signals';
import { SideTag } from '@/components/signals/parts';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { Segmented } from '@/components/ui/Segmented';
import { Field, Note } from './fields';

/**
 * The paper account (lib/engines/paper.ts): an order ticket, the positions
 * it holds, and the trades it closed. Every price and size comes from the
 * server; the ticket only previews what a fill would look like, from the
 * live quote and the tools engine. A signal's "Paper-trade it" arrives with
 * its market, side, stop and target filled in.
 */

export type PaperStart = {
  market?: string;
  side?: string;
  stop?: string;
  target?: string;
  setup?: string;
  signal?: string;
};

const RISKS = [50, 100, 200] as const;
const usd = (minor: number, signed = false) =>
  formatMoney({ minor, currency: 'USD' }, { signed });

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
            className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3 type-small has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${value === option ? 'border-gold bg-gold-soft font-semibold text-fg' : 'border-line text-fg-2 hover:text-fg'}`}
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

function Ticket({
  start,
  account,
}: {
  start: PaperStart;
  account: PaperAccount | null;
}) {
  const signals = useSignals();
  const available =
    signals.state === 'ready'
      ? signals.data.markets.filter((m) => marketById(m.market.id)?.paper)
      : [];
  const ids = available.length
    ? available.map((m) => m.market.id)
    : MARKETS.filter((m) => m.paper && m.source === 'kraken').map((m) => m.id);
  const [market, setMarket] = useState(
    start.market && marketById(start.market)?.paper ? start.market : 'btc',
  );
  const [side, setSide] = useState<'buy' | 'sell'>(
    start.side === 'sell' ? 'sell' : 'buy',
  );
  const [stop, setStop] = useState(start.stop ?? '');
  const [target, setTarget] = useState(start.target ?? '');
  const [riskBp, setRiskBp] = useState<number>(PAPER.riskBp.usual);
  const [setup, setSetup] = useState<JournalSetup>(
    (SETUPS as readonly string[]).includes(start.setup ?? '')
      ? (start.setup as JournalSetup)
      : 'other',
  );
  const [feeling, setFeeling] = useState<Feeling>('calm');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'info' | 'warn';
    text: string;
  } | null>(null);
  const info = marketById(market)!;

  useEffect(() => {
    let live = true;
    fetchQuote(market).then(
      (q) => {
        if (!live) return;
        setQuote(q);
        setQuoteFailed(false);
      },
      () => live && setQuoteFailed(true),
    );
    return () => {
      live = false;
    };
  }, [market]);

  const fill = quote ? (side === 'buy' ? quote.ask : quote.bid) : null;
  const stopUnits = priceAt(stop, info.decimals);
  const preview = (() => {
    if (!fill || !stopUnits) return null;
    if (side === 'buy' ? stopUnits >= fill : stopUnits <= fill) return 'wrong';
    try {
      const size = sizePosition({
        accountMinor: account?.equityMinor ?? PAPER.startMinor,
        riskBp,
        entry: fill,
        stop: stopUnits,
        decimals: info.decimals,
      });
      return size;
    } catch {
      return null;
    }
  })();

  async function place() {
    setBusy(true);
    setMessage(null);
    try {
      const answer = await placeOrder({
        market,
        side,
        stop,
        target,
        riskBp,
        setup,
        feeling,
        signal: start.signal === '1',
      });
      const filled = answer.filled;
      if (filled && filled.kind === 'open') {
        setMessage({
          tone: 'info',
          text: `${C.ticket.filled(filled.side, formatQuantity(filled.quantity), filled.symbol, formatPrice(filled.price, filled.decimals))}${answer.trimmed ? ` ${C.ticket.trimmed}` : ''}`,
        });
        setStop('');
        setTarget('');
      }
    } catch (error) {
      setMessage({ tone: 'warn', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void place();
      }}
      className="space-y-4 rounded-xl border border-gold bg-panel p-4 sm:p-5"
    >
      <h2 className="type-title text-fg">{C.ticket.title}</h2>
      {start.signal === '1' ? <Note>{C.ticket.fromSignal}</Note> : null}
      <fieldset>
        <legend className="mb-2 type-label text-fg-2">{C.ticket.market}</legend>
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => {
            const m = marketById(id)!;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={market === id}
                onClick={() => {
                  setMarket(id);
                  setQuote(null);
                }}
                className={`min-h-10 rounded-full border px-3 type-small ${market === id ? 'border-gold bg-gold-soft font-semibold text-fg' : 'border-line text-fg-2 hover:text-fg'}`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Segmented
        name="paper-side"
        label={C.ticket.side}
        options={[
          { value: 'buy', label: C.ticket.buy },
          { value: 'sell', label: C.ticket.sell },
        ]}
        value={side}
        onChange={setSide}
      />
      <p className="font-mono type-tick text-fg-2 num" aria-live="polite">
        {quote
          ? C.ticket.quote(
              formatPrice(quote.bid, info.decimals),
              formatPrice(quote.ask, info.decimals),
            )
          : quoteFailed
            ? C.ticket.noQuote
            : SIGNALS.loading}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="paper-stop"
          label={C.ticket.stop}
          value={stop}
          onChange={setStop}
          help={C.ticket.stopHelp(side)}
          invalid={preview === 'wrong'}
        />
        <Field
          id="paper-target"
          label={C.ticket.target}
          value={target}
          onChange={setTarget}
        />
      </div>
      <Segmented
        name="paper-risk"
        label={C.ticket.risk}
        options={RISKS.map((bp) => ({
          value: String(bp),
          label: formatBp(bp),
        }))}
        value={String(riskBp)}
        onChange={(value) => setRiskBp(Number(value))}
      />
      <Chips
        label={C.ticket.setup}
        options={SETUPS}
        words={JOURNAL.setups}
        value={setup}
        onChange={setSetup}
      />
      <Chips
        label={C.ticket.feeling}
        options={FEELINGS}
        words={JOURNAL.feelings}
        value={feeling}
        onChange={setFeeling}
      />
      {preview && preview !== 'wrong' ? (
        <p className="rounded-md border border-line bg-ink/40 p-3 type-small text-fg">
          {C.ticket.preview(
            formatQuantity(preview.quantity),
            usd(preview.valueMinor),
            usd(preview.riskMinor),
          )}
          <span className="mt-1 block type-tick text-muted">
            {C.ticket.previewNote}
          </span>
        </p>
      ) : null}
      {preview === 'wrong' ? (
        <Note tone="warn">{C.ticket.stopHelp(side)}</Note>
      ) : null}
      {message ? <Note tone={message.tone}>{message.text}</Note> : null}
      <button
        type="submit"
        disabled={busy || !stopUnits || preview === 'wrong'}
        className="btn-3d flex min-h-12 w-full items-center justify-center rounded-md bg-gold px-5 type-body font-bold text-ink disabled:opacity-50"
      >
        {busy ? C.ticket.placing : C.ticket.place}
      </button>
    </form>
  );
}

function PositionRow({ position }: { position: Position }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const price = (units: number) => formatPrice(units, position.decimals);
  const tone =
    position.unrealisedMinor > 0
      ? 'text-gain'
      : position.unrealisedMinor < 0
        ? 'text-loss'
        : 'text-fg-2';
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="type-small font-semibold text-fg">
              {position.symbol}
            </span>
            <SideTag side={position.side} />
            <span className="font-mono type-tick text-muted num">
              {formatQuantity(position.quantity)}
            </span>
          </p>
          <p className="mt-0.5 font-mono type-tick text-muted num">
            {C.positions.entry} {price(position.price)} · {C.positions.now}{' '}
            {price(position.mark)} · {C.positions.stop} {price(position.stop)}
            {position.target !== null
              ? ` · ${C.positions.target} ${price(position.target)}`
              : ''}
          </p>
          {note ? <p className="mt-1 type-tick text-fg-2">{note}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-mono type-small font-bold num ${tone}`}>
            {usd(position.unrealisedMinor, true)}
          </p>
          <p className={`font-mono type-tick num ${tone}`}>
            {formatR(position.r)}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const answer = await closePosition(position.id);
                if (answer.notice) setNote(answer.notice);
              } catch (error) {
                setNote((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-1 inline-flex min-h-10 items-center rounded-md border border-edge bg-raised px-3 type-tick font-semibold text-fg disabled:opacity-50"
          >
            {busy ? C.positions.closing : C.positions.close}
          </button>
        </div>
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  tone = 'text-fg',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-panel p-3">
      <p className="font-mono type-tick text-muted uppercase">{label}</p>
      <p className={`mt-1 truncate font-mono type-heading num ${tone}`}>
        {value}
      </p>
    </div>
  );
}

export function Paper({ start }: { start: PaperStart }) {
  const paper = usePaper();
  const account = paper.state === 'ready' ? paper.account : null;
  const [resetting, setResetting] = useState(false);
  const closedNewest = account ? [...account.closed].reverse() : [];

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-5 pb-8 sm:px-8 lg:pt-8">
      <p className="font-mono type-label text-gold">{C.kicker}</p>
      <h1 className="mt-1 type-display text-fg">{C.title}</h1>
      <p className="mt-2 max-w-[62ch] type-body text-fg-2">{C.lead}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <TruthBadge truth="simulation" />
        <TruthBadge truth="market" />
      </div>

      {paper.state === 'error' ? (
        <div className="mt-5 rounded-xl border border-line bg-panel p-4">
          <p className="type-body text-fg">{C.error}</p>
          <button
            type="button"
            onClick={() => void refreshPaper()}
            className="mt-3 inline-flex min-h-11 items-center rounded-md border border-edge bg-raised px-4 type-small font-semibold text-fg"
          >
            {C.retry}
          </button>
        </div>
      ) : null}

      {account ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={C.stats.equity} value={usd(account.equityMinor)} />
            <Stat
              label={C.stats.returned}
              value={formatBp(account.returnBp, { signed: true })}
              tone={
                account.returnBp > 0
                  ? 'text-gain'
                  : account.returnBp < 0
                    ? 'text-loss'
                    : 'text-fg'
              }
            />
            <Stat label={C.stats.cash} value={usd(account.cashMinor)} />
            <Stat
              label={C.stats.open}
              value={C.stats.openOf(account.open.length, PAPER.maxOpen)}
            />
          </div>
          <p className="mt-2 font-mono type-tick text-muted">
            {C.stats.record(
              account.closed.length,
              formatBp(account.winRateBp),
              formatR(account.avgR),
            )}
          </p>
        </>
      ) : paper.state !== 'error' ? (
        <div aria-busy className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <p className="sr-only">{C.loading}</p>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[4.5rem] animate-pulse rounded-lg border border-line bg-panel"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start lg:gap-6">
        <div
          className={`min-w-0 space-y-4 ${start.stop ? 'order-2' : 'order-1'} lg:order-none`}
        >
          <section
            aria-labelledby="open-positions"
            className="rounded-xl border border-line bg-panel px-4 pt-3 pb-1"
          >
            <h2 id="open-positions" className="font-mono type-label text-fg-2">
              {C.positions.title}
            </h2>
            {account?.open.length ? (
              <ul className="divide-y divide-line">
                {account.open.map((position) => (
                  <PositionRow key={position.id} position={position} />
                ))}
              </ul>
            ) : (
              <p className="py-3 type-small text-fg-2">{C.positions.none}</p>
            )}
          </section>

          {closedNewest.length ? (
            <section
              aria-labelledby="closed-paper"
              className="rounded-xl border border-line bg-panel px-4 pt-3 pb-1"
            >
              <h2 id="closed-paper" className="font-mono type-label text-fg-2">
                {C.closed.title}
              </h2>
              <ul className="divide-y divide-line">
                {closedNewest.map((trade) => {
                  const tone =
                    trade.pnlMinor > 0
                      ? 'text-gain'
                      : trade.pnlMinor < 0
                        ? 'text-loss'
                        : 'text-fg-2';
                  return (
                    <li
                      key={trade.open.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="type-small font-semibold text-fg">
                            {trade.open.symbol}
                          </span>
                          <SideTag side={trade.open.side} />
                        </span>
                        <span className="block font-mono type-tick text-muted num">
                          {formatPrice(trade.open.price, trade.open.decimals)} →{' '}
                          {formatPrice(trade.close.price, trade.open.decimals)}{' '}
                          · {C.closed.why[trade.close.why]}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-right font-mono type-tick font-semibold num ${tone}`}
                      >
                        {usd(trade.pnlMinor, true)}
                        <span className="block font-normal">
                          {formatR(trade.r)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <details className="rounded-xl border border-line bg-panel p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 type-heading text-fg">
              {C.how.title}
              <span aria-hidden className="text-fg-2">
                ▾
              </span>
            </summary>
            <ul className="mt-2 space-y-2">
              {C.how.points.map((point) => (
                <li key={point} className="flex gap-2 type-small text-fg-2">
                  <span aria-hidden className="text-gold">
                    ◆
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </details>

          {account && (account.open.length || account.closed.length) ? (
            <button
              type="button"
              disabled={resetting}
              onClick={async () => {
                if (!window.confirm(C.reset.confirm)) return;
                setResetting(true);
                try {
                  await resetPaper();
                } finally {
                  setResetting(false);
                }
              }}
              className="inline-flex min-h-11 items-center type-small text-muted underline underline-offset-4 hover:text-fg"
            >
              {C.reset.action}
            </button>
          ) : null}
        </div>

        <div
          className={`${start.stop ? 'order-1' : 'order-2'} lg:sticky lg:top-6 lg:order-none`}
        >
          <Ticket start={start} account={account} />
        </div>
      </div>
    </div>
  );
}
