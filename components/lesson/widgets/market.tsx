'use client';

import { useState } from 'react';
import { WIDGET_COPY } from '@/content/lessons/widgets';
import { formatMoney, fromMinor } from '@/lib/core/money';
import {
  costsOfTrading,
  fillBuy,
  gappyPath,
  makeBook,
  marketBuy,
  roundTripCost,
  type Book,
  type MarketOrderResult,
  type OrderKind,
} from '@/lib/engines/market';
import {
  Button,
  Choices,
  Slider,
  Stat,
  useDone,
  type WidgetComponentProps,
} from './kit';

/** Stage 1 widgets: how a price is made, what it costs to trade, and order types. */

const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));

/* ── The order book (m1) ──────────────────────────────────────────────── */

export function OrderBookWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.orderBook;
  const done = useDone(onDone);
  const seed = String(props?.seed ?? 'book');
  const [book, setBook] = useState<Book>(() => makeBook(seed));
  const [result, setResult] = useState<MarketOrderResult | null>(null);

  const buy = (quantity: number) => {
    const fresh = makeBook(seed);
    const next = marketBuy(fresh, quantity);
    setBook(next.book);
    setResult(next);
    done();
  };
  const consumed = new Set(result?.fills.map((fill) => fill.price));
  const original = makeBook(seed);
  const asks = [...original.asks].slice(0, 6).reverse();
  const bids = original.bids.slice(0, 6);
  const left = (price: number) =>
    book.asks.find((level) => level.price === price)?.size ?? 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-line font-mono type-small num">
        <p className="bg-raised px-3 py-1.5 type-tick text-loss">{C.asks}</p>
        {asks.map((level) => {
          const remaining = result ? left(level.price) : level.size;
          const gone = consumed.has(level.price);
          return (
            <div
              key={level.price}
              className={`flex justify-between px-3 py-1.5 ${gone ? 'bg-gold-soft' : ''}`}
            >
              <span className={gone ? 'text-gold' : 'text-fg'}>
                {usd(level.price)}
              </span>
              <span
                className={
                  remaining === 0 ? 'text-muted line-through' : 'text-fg-2'
                }
              >
                {remaining === 0 ? level.size : remaining}
              </span>
            </div>
          );
        })}
        <div className="flex justify-between border-y border-line bg-panel px-3 py-2">
          <span className="type-tick text-muted">{C.last}</span>
          <span className="font-semibold text-gold">
            {result?.last ? usd(result.last) : '—'}
          </span>
        </div>
        {bids.map((level) => (
          <div key={level.price} className="flex justify-between px-3 py-1.5">
            <span className="text-fg">{usd(level.price)}</span>
            <span className="text-fg-2">{level.size}</span>
          </div>
        ))}
        <p className="bg-raised px-3 py-1.5 type-tick text-gain">{C.bids}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button kind="secondary" onClick={() => buy(20)}>
          {C.buySmall(20)}
        </Button>
        <Button onClick={() => buy(150)}>{C.buyBig(150)}</Button>
      </div>
      {result ? (
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={C.filled(result.filled)}
            value={usd(result.last ?? 0)}
            tone="gold"
          />
          <Stat label={C.average} value={usd(result.average ?? 0)} />
        </div>
      ) : null}
    </div>
  );
}

/* ── The spread (m2) ──────────────────────────────────────────────────── */

export function SpreadWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.spread;
  const book = makeBook(String(props?.seed ?? 'spread'));
  const bid = book.bids[0]!.price;
  const ask = book.asks[0]!.price;
  const [trips, setTrips] = useState(0);
  const done = useDone(onDone);
  const quantity = 10;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label={C.bid} value={usd(bid)} tone="gain" />
        <Stat label={C.ask} value={usd(ask)} tone="loss" />
      </div>
      <Button
        onClick={() => {
          const next = trips + 1;
          setTrips(next);
          if (next >= 3) done();
        }}
      >
        {C.button(quantity)}
      </Button>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={C.trips} value={trips} />
        <Stat
          label={C.cost}
          value={usd(roundTripCost(bid, ask, quantity, trips))}
          tone={trips ? 'loss' : 'fg'}
        />
        <Stat label={C.price} value={C.none} />
      </div>
    </div>
  );
}

/* ── Order types (m3) ─────────────────────────────────────────────────── */

export function OrderTypesWidget({ props, onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.orderTypes;
  const path = gappyPath(String(props?.seed ?? 'orders'));
  const start = path[0]!;
  const prices: Record<OrderKind, number> = {
    market: start,
    limit: start - 30,
    stop: start + 60,
  };
  const [kind, setKind] = useState<OrderKind>('market');
  const [played, setPlayed] = useState<Set<OrderKind>>(new Set());
  const done = useDone(onDone);
  const [shown, setShown] = useState<OrderKind | null>(null);
  const result = shown
    ? fillBuy(path, {
        kind: shown,
        price: shown === 'market' ? undefined : prices[shown],
      })
    : null;

  const low = Math.min(...path) - 20;
  const high = Math.max(...path) + 20;
  const x = (i: number) => (i / (path.length - 1)) * 400;
  const y = (p: number) => ((high - p) / (high - low)) * 140;

  return (
    <div className="space-y-4">
      <Choices
        name="order-kind"
        label={C.play}
        options={(['market', 'limit', 'stop'] as const).map((value) => ({
          value,
          label: C.kinds[value],
        }))}
        value={kind}
        onChange={(value) => {
          setKind(value);
          setShown(null);
        }}
      />
      <p className="type-small text-fg-2">
        {C.describe[kind](usd(prices[kind]))}
      </p>
      <div className="relative rounded-md border border-line bg-ink">
        <svg
          viewBox="0 0 400 140"
          preserveAspectRatio="none"
          className="block h-36 w-full"
          aria-hidden
        >
          {kind !== 'market' ? (
            <line
              x1={0}
              x2={400}
              y1={y(prices[kind])}
              y2={y(prices[kind])}
              className="stroke-gold"
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <polyline
            points={(shown ? path : path.slice(0, 1))
              .map((p, i) => `${x(i)},${y(p)}`)
              .join(' ')}
            fill="none"
            className="stroke-fg-2"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {result?.step != null && result.price != null ? (
            <circle
              cx={x(result.step)}
              cy={y(result.price)}
              r={5}
              className="fill-gold"
            />
          ) : null}
        </svg>
      </div>
      <Button
        onClick={() => {
          setShown(kind);
          const next = new Set(played).add(kind);
          setPlayed(next);
          if (next.size >= 2) done();
        }}
      >
        {C.play}
      </Button>
      {result ? (
        <div
          className="rounded-md border border-line bg-panel p-3 type-small"
          aria-live="polite"
        >
          {result.price === null ? (
            <p className="text-fg-2">{C.never}</p>
          ) : (
            <>
              <p className="font-semibold text-fg">
                {C.filled(usd(result.price), result.step ?? 0)}
              </p>
              {result.slippage > 0 ? (
                <p className="mt-1 text-loss">
                  ▼ {C.slipped(usd(result.slippage))}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ── Which market moves first (m4) ────────────────────────────────────── */

export function MarketSorterWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.sorter;
  const done = useDone(onDone);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return (
    <ul className="space-y-3">
      {C.items.map((item, i) => {
        const picked = answers[i];
        return (
          <li
            key={item.headline}
            className="rounded-md border border-line bg-panel p-3"
          >
            <p className="type-small font-semibold text-fg">
              “{item.headline}”
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {C.markets.map((market) => (
                <button
                  key={market}
                  type="button"
                  disabled={picked !== undefined}
                  onClick={() => {
                    const next = { ...answers, [i]: market };
                    setAnswers(next);
                    if (Object.keys(next).length === C.items.length) done();
                  }}
                  className={`min-h-11 rounded-md border px-2 type-small ${picked === market ? (market === item.answer ? 'border-gold bg-gold-soft text-gold' : 'border-loss text-loss') : picked && market === item.answer ? 'border-gold text-gold' : 'border-edge bg-raised text-fg'}`}
                >
                  {market}
                </button>
              ))}
            </div>
            {picked ? (
              <p className="mt-2 type-small text-fg-2">
                <span
                  className={
                    picked === item.answer
                      ? 'font-semibold text-gold'
                      : 'font-semibold text-loss'
                  }
                >
                  {picked === item.answer
                    ? `✓ ${C.right}`
                    : `✕ ${C.wrong(item.answer)}`}
                </span>{' '}
                {item.why}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ── Where the deposit goes (m6) ──────────────────────────────────────── */

export function CostsWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.costs;
  const done = useDone(onDone);
  const [trades, setTrades] = useState(40);
  const [nights, setNights] = useState(20);
  const [signals, setSignals] = useState(true);
  const deposit = 10_000;
  const costs = costsOfTrading({
    deposit,
    trades,
    spreadPerTrade: 60,
    nightsHeld: nights,
    overnightPerNight: 25,
    subscription: signals ? 3_000 : 0,
  });
  const share = (part: number) =>
    `${Math.max(0, Math.min(100, (part / deposit) * 100))}%`;
  return (
    <div className="space-y-4">
      <Slider
        label={C.trades}
        shown={String(trades)}
        min={0}
        max={80}
        step={5}
        value={trades}
        onChange={(v) => {
          setTrades(v);
          done();
        }}
      />
      <Slider
        label={C.nights}
        shown={String(nights)}
        min={0}
        max={30}
        value={nights}
        onChange={(v) => {
          setNights(v);
          done();
        }}
      />
      <Choices
        name="signals"
        label={C.subscription}
        options={[
          { value: 'yes', label: `${C.subscription}: ${C.yes}` },
          { value: 'no', label: C.no },
        ]}
        value={signals ? 'yes' : 'no'}
        onChange={(v) => {
          setSignals(v === 'yes');
          done();
        }}
      />
      <div
        aria-hidden
        className="flex h-4 overflow-hidden rounded-full bg-raised"
      >
        <span className="bg-loss" style={{ width: share(costs.spreads) }} />
        <span
          className="bg-loss-mark"
          style={{ width: share(costs.overnight) }}
        />
        <span
          className="bg-edge"
          style={{ width: share(costs.subscription) }}
        />
        <span
          className="bg-gain-mark"
          style={{ width: share(Math.max(costs.left, 0)) }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={C.spreads} value={usd(costs.spreads)} tone="loss" />
        <Stat label={C.overnight} value={usd(costs.overnight)} tone="loss" />
        <Stat label={C.signals} value={usd(costs.subscription)} tone="loss" />
        <Stat label={C.left} value={usd(Math.max(costs.left, 0))} tone="gold" />
      </div>
      <p className="font-mono type-tick text-muted">
        {C.deposit}: {usd(deposit)}
      </p>
    </div>
  );
}
