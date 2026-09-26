'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { YEARS } from '@/content/lessons/history';
import { STAGE5_SEEDS } from '@/content/lessons/seeds';
import { WIDGET_COPY } from '@/content/lessons/widgets';
import {
  formatBp,
  formatMoney,
  fromMinor,
  type Currency,
} from '@/lib/core/money';
import {
  COCOA_CO,
  STOCKS,
  dividendYieldBp,
  hold,
  incomeStatement,
  peHundredths,
  survivableShrinkBp,
  changeBp,
  type IncomeStatement,
} from '@/lib/engines/company';
import {
  CARRY,
  COMMODITY_PRICES,
  EXPORTERS,
  NEWS,
  POLICY,
  RELEASE,
  SAVER,
  basePrices,
  carryRun,
  dollarFlow,
  localPrice,
  newsDay,
  newsPullback,
  playEntry,
  playRelease,
  policyEffects,
  realValue,
  releaseDay,
  savedThrough,
  type Commodity,
  type EntryPlan,
  type NewsKind,
  type PullbackEnding,
  type ReleaseEnding,
  type ReleasePlan,
  type SavingsPlace,
} from '@/lib/engines/macro';
import { PriceChart } from '../PriceChart';
import {
  Button,
  Choices,
  Slider,
  Stat,
  useDone,
  type WidgetComponentProps,
} from './kit';

/**
 * Stage 5 widgets: fundamental analysis. Each draws what an engine in
 * lib/engines/macro.ts or lib/engines/company.ts computed; the words come
 * from content/lessons/widgets.ts, and the published figures from
 * content/lessons/history.ts.
 */

const money = (minor: number, currency: Currency, signed = false) =>
  formatMoney(fromMinor(minor, currency), { signed });
const ghs = (minor: number, signed = false) => money(minor, 'GHS', signed);
const usd = (cents: number, signed = false) => money(cents, 'USD', signed);
const big = (minor: number, currency: Currency) =>
  formatMoney(fromMinor(minor, currency), { compact: true });
/** Basis points as percentage points, without the % sign: 75 → "0.75". */
const points = (bp: number, signed = false) =>
  formatBp(bp, { signed }).replace('%', '');
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

/* ── News and surprise (f1) ───────────────────────────────────────────── */

export function NewsSurpriseWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.newsSurprise;
  const done = useDone(onDone);
  const [kind, setKind] = useState<NewsKind>('earnings');
  const [actual, setActual] = useState<Record<NewsKind, number>>({
    rates: NEWS.rates.expectedBp,
    inflation: NEWS.inflation.expectedBp,
    earnings: NEWS.earnings.expectedBp,
  });
  const [tried, setTried] = useState(new Set<NewsKind>());
  const config = NEWS[kind];
  const day = useMemo(
    () => newsDay(STAGE5_SEEDS.news, kind, actual[kind]),
    [kind, actual],
  );
  const expected =
    kind === 'rates'
      ? C.expected.rates(points(config.expectedBp))
      : kind === 'inflation'
        ? C.expected.inflation(formatBp(config.expectedBp))
        : C.expected.earnings(formatBp(config.expectedBp));
  const value = actual[kind];
  const shown =
    kind === 'rates'
      ? C.shown.rates(points(value))
      : kind === 'inflation'
        ? C.shown.inflation(formatBp(value))
        : C.shown.earnings(formatBp(Math.abs(value)), value >= 0);
  return (
    <div className="space-y-3">
      <Choices
        name="news-kind"
        label={C.which}
        options={(['rates', 'inflation', 'earnings'] as const).map((k) => ({
          value: k,
          label: C.kinds[k],
        }))}
        value={kind}
        onChange={setKind}
      />
      <p className="font-mono type-small text-fg-2">{expected}</p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
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
        />
      </div>
      <p className="font-mono type-tick text-muted">{C.before}</p>
      <Slider
        label={C.actual}
        shown={shown}
        min={config.lowBp}
        max={config.highBp}
        step={config.stepBp}
        value={value}
        onChange={(v) => {
          setActual((a) => ({ ...a, [kind]: v }));
          const next = new Set(tried).add(kind);
          setTried(next);
          if (next.size >= 2) done();
        }}
      />
      <Result>
        {day.surpriseBp === 0 ? (
          <p>{C.none}</p>
        ) : (
          <p>
            {day.moveBp >= 0 ? '▲ ' : '▼ '}
            {C.result(
              points(day.surpriseBp, true),
              formatBp(day.moveBp, { signed: true }),
            )}
          </p>
        )}
      </Result>
    </div>
  );
}

/* ── The central bank's rate (f2) ─────────────────────────────────────── */

export function RateSetterWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.rateSetter;
  const done = useDone(onDone);
  const [rate, setRate] = useState<number>(POLICY.startBp);
  const start = useMemo(() => policyEffects(POLICY.startBp), []);
  const now = policyEffects(rate);
  const delta = (a: number, b: number) => C.change(ghs(a - b, true));
  const card = (
    label: string,
    value: string,
    change: string,
    tone: 'gain' | 'loss' | 'fg',
  ) => (
    <div className="rounded-md border border-line bg-panel p-3">
      <p className="type-small text-fg-2">{label}</p>
      <p className="mt-1 font-mono type-title text-fg num">{value}</p>
      <p
        className={`font-mono type-tick num ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-muted'}`}
      >
        {change}
      </p>
    </div>
  );
  const tone = (better: boolean, same: boolean) =>
    (same ? 'fg' : better ? 'gain' : 'loss') as 'gain' | 'loss' | 'fg';
  const same = rate === POLICY.startBp;
  return (
    <div className="space-y-3">
      <Slider
        label={C.rate}
        shown={formatBp(rate)}
        min={POLICY.lowBp}
        max={POLICY.highBp}
        step={POLICY.stepBp}
        value={rate}
        onChange={(v) => {
          setRate(v);
          if (v !== POLICY.startBp) done();
        }}
      />
      <p className="font-mono type-tick text-muted">
        {C.start(formatBp(POLICY.startBp))}
      </p>
      <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
        {card(
          C.deposit(ghs(POLICY.deposit.amount)),
          ghs(now.deposit.interest),
          delta(now.deposit.interest, start.deposit.interest),
          tone(now.deposit.interest > start.deposit.interest, same),
        )}
        {card(
          C.loan(ghs(POLICY.loan.amount), POLICY.loan.months),
          ghs(now.loan.monthly),
          delta(now.loan.monthly, start.loan.monthly),
          tone(now.loan.monthly < start.loan.monthly, same),
        )}
        {card(
          C.bond(
            POLICY.bond.years,
            ghs(POLICY.bond.face),
            formatBp(POLICY.bond.couponBp),
          ),
          ghs(now.bond.price),
          delta(now.bond.price, start.bond.price),
          tone(now.bond.price > start.bond.price, same),
        )}
        {card(
          C.share(ghs(POLICY.share.dividend)),
          ghs(now.share.value),
          delta(now.share.value, start.share.value),
          tone(now.share.value > start.share.value, same),
        )}
      </div>
    </div>
  );
}

/* ── Inflation and your currency (f3), on published figures ───────────── */

export function InflationReplayWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.inflationReplay;
  const [which, setWhich] = useState<'ghana' | 'nigeria'>('ghana');
  const [place, setPlace] = useState<SavingsPlace>('savings');
  const [shown, setShown] = useState(1);
  const year = YEARS[which];
  const all = shown >= year.months.length;
  const month = shown - 1;
  const currency = year.currency;
  const saved = SAVER.saved[currency];
  const places: SavingsPlace[] = year.billBp
    ? ['cash', 'savings', 'bills']
    : ['cash', 'savings'];
  const ended = savedThrough(saved, place, year.billBp);
  const inflation = year.inflationBp.at(-1)!;
  const top = Math.max(...year.inflationBp, ...(year.policyBp ?? []));
  const label = (p: SavingsPlace) =>
    p === 'savings' ? C.places.savings(formatBp(SAVER.savingsBp)) : C.places[p];
  return (
    <div className="space-y-3">
      <TruthBadge
        truth="historical"
        source={{ name: year.publisher, date: String(year.year) }}
      />
      <Choices
        name="which-year"
        label={C.which}
        options={(['ghana', 'nigeria'] as const).map((value) => ({
          value,
          label: C.years[value],
        }))}
        value={which}
        onChange={(value) => {
          setWhich(value);
          setShown(1);
          if (value === 'nigeria' && place === 'bills') setPlace('savings');
        }}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={asBars(year.inflationBp.slice(0, shown))}
          slots={year.months.length}
          mode="line"
          domain={{ low: 0, high: top + 600 }}
          lines={
            year.policyBp
              ? [
                  {
                    values: year.policyBp.slice(0, shown),
                    tone: 'blue',
                    dashed: true,
                  },
                ]
              : []
          }
          levels={[
            {
              price: year.inflationBp[month]!,
              label: formatBp(year.inflationBp[month]!),
              tone: 'gold',
            },
          ]}
        />
      </div>
      <p className="flex flex-wrap gap-x-4 font-mono type-tick text-muted">
        <span>— {C.legend.inflation}</span>
        {year.policyBp ? <span>- - {C.legend.policy}</span> : null}
      </p>
      <p className="type-small text-fg" aria-live="polite">
        {C.now(year.months[month]!, formatBp(year.inflationBp[month]!))}
      </p>
      <Choices
        name="savings-place"
        label={C.keep}
        options={places.map((value) => ({ value, label: label(value) }))}
        value={place}
        onChange={setPlace}
      />
      <p className="font-mono type-tick text-muted">
        {place === 'bills'
          ? C.billsNote
          : place === 'savings'
            ? C.savingsNote(formatBp(SAVER.savingsBp))
            : ''}
      </p>
      {all ? (
        <Result>
          <p>{C.saved(money(saved, currency), money(ended, currency))}</p>
          <p>
            {C.bought(
              formatBp(inflation),
              money(realValue(ended, inflation), currency),
            )}
          </p>
          <p>
            {C.phone(
              usd(SAVER.phoneUsd),
              money(localPrice(SAVER.phoneUsd, year.fx.start), currency),
              money(localPrice(SAVER.phoneUsd, year.fx.end), currency),
            )}
          </p>
        </Result>
      ) : null}
      {all ? (
        <Button kind="secondary" onClick={() => setShown(1)}>
          {C.again}
        </Button>
      ) : (
        <Button
          onClick={() => {
            const next = Math.min(year.months.length, shown + 1);
            setShown(next);
            if (next >= year.months.length) onDone();
          }}
        >
          {C.next}
        </Button>
      )}
      <p className="type-tick text-muted">
        {C.source}:{' '}
        {year.sources.map((source, i) => (
          <span key={source.url}>
            {i ? ' · ' : ''}
            <a
              href={source.url}
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {source.name}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

/* ── The income statement (f4) ────────────────────────────────────────── */

const STATEMENT_LINES: {
  key: keyof IncomeStatement;
  total?: boolean;
  minus?: boolean;
}[] = [
  { key: 'revenue' },
  { key: 'costOfSales', minus: true },
  { key: 'grossProfit', total: true },
  { key: 'operatingCosts', minus: true },
  { key: 'operatingProfit', total: true },
  { key: 'interest', minus: true },
  { key: 'profitBeforeTax', total: true },
  { key: 'tax', minus: true },
  { key: 'netProfit', total: true },
];

export function IncomeStatementWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.incomeStatement;
  const done = useDone(onDone);
  const [tonnes, setTonnes] = useState(COCOA_CO.tonnes);
  const [beans, setBeans] = useState(COCOA_CO.beansPerTonne);
  const base = useMemo(() => incomeStatement(COCOA_CO), []);
  const s = incomeStatement({ ...COCOA_CO, tonnes, beansPerTonne: beans });
  const name = (key: keyof IncomeStatement) =>
    key === 'tax'
      ? C.lines.tax(formatBp(COCOA_CO.taxBp))
      : C.lines[key as Exclude<keyof typeof C.lines, 'tax'>];
  const changed =
    tonnes !== COCOA_CO.tonnes || beans !== COCOA_CO.beansPerTonne;
  return (
    <div className="space-y-3">
      <Slider
        label={C.tonnes}
        shown={C.tonnesShown(tonnes.toLocaleString('en-GB'))}
        min={6_000}
        max={14_000}
        step={500}
        value={tonnes}
        onChange={(v) => {
          setTonnes(v);
          done();
        }}
      />
      <Slider
        label={C.beans}
        shown={ghs(beans)}
        min={3_000_000}
        max={4_500_000}
        step={100_000}
        value={beans}
        onChange={(v) => {
          setBeans(v);
          done();
        }}
      />
      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full type-small">
          <tbody className="divide-y divide-line">
            {STATEMENT_LINES.map(({ key, total, minus }) => (
              <tr key={key} className={total ? 'bg-raised' : ''}>
                <th
                  scope="row"
                  className={`px-3 py-2 text-left font-normal ${total ? 'font-semibold text-fg' : 'text-fg-2'}`}
                >
                  {minus ? '− ' : total ? '= ' : ''}
                  {name(key)}
                </th>
                <td
                  className={`px-3 py-2 text-right font-mono whitespace-nowrap num ${total && (s[key] as number) < 0 ? 'text-loss' : 'text-fg'}`}
                >
                  {big(
                    total ? (s[key] as number) : Math.abs(s[key] as number),
                    'GHS',
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={C.grossMargin} value={formatBp(s.grossMarginBp)} />
        <Stat
          label={C.netMargin}
          value={formatBp(s.netMarginBp)}
          tone={s.netProfit < 0 ? 'loss' : 'fg'}
        />
        <Stat label={C.eps} value={ghs(s.eps)} />
      </div>
      {changed ? (
        <p className="type-small text-fg" aria-live="polite">
          {C.versus(
            formatBp(changeBp(base.netProfit, s.netProfit), { signed: true }),
          )}
        </p>
      ) : null}
    </div>
  );
}

/* ── Cheap or just bad? (f5) ──────────────────────────────────────────── */

export function ValueTrapWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.valueTrap;
  const [played, setPlayed] = useState(false);
  const [growth, setGrowth] = useState<number>(STOCKS.cheap.growthBp);
  const amount = 100_000;
  const years = 5;
  const cheap = { ...STOCKS.cheap, growthBp: growth };
  const results = {
    cheap: hold(cheap, amount, years),
    dear: hold(STOCKS.dear, amount, years),
  };
  const floor = useMemo(
    () => survivableShrinkBp(STOCKS.cheap, amount, years),
    [],
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {(['cheap', 'dear'] as const).map((key) => {
          const stock = key === 'cheap' ? cheap : STOCKS.dear;
          const r = results[key];
          return (
            <div
              key={key}
              className="rounded-md border border-line bg-panel p-3"
            >
              <p className="type-small font-semibold text-fg">{C.names[key]}</p>
              <p className="type-tick text-fg-2">{C.story[key]}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Stat
                  label={C.pe}
                  value={C.times((peHundredths(stock) / 100).toFixed(0))}
                />
                <Stat
                  label={C.yield}
                  value={formatBp(dividendYieldBp(stock))}
                />
              </div>
              {played ? (
                <div className="mt-2 space-y-1" aria-live="polite">
                  <p className="font-mono type-tick text-muted">
                    {C.earnings}: {r.epsPath.map((eps) => ghs(eps)).join(' → ')}
                  </p>
                  <p
                    className={`type-small font-semibold ${r.returnBp < 0 ? 'text-loss' : 'text-gain'}`}
                  >
                    {r.returnBp < 0 ? '▼ ' : '▲ '}
                    {C.ended(
                      ghs(r.endValue),
                      formatBp(r.returnBp, { signed: true }),
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {played ? (
        <>
          <p className="type-small text-fg-2">{C.invested(ghs(amount))}</p>
          <Slider
            label={C.slider}
            shown={formatBp(growth, { signed: true })}
            min={-4_000}
            max={1_000}
            step={500}
            value={growth}
            onChange={setGrowth}
          />
          <p className="type-small text-fg">{C.shrink(formatBp(-floor))}</p>
        </>
      ) : (
        <Button
          onClick={() => {
            setPlayed(true);
            onDone();
          }}
        >
          {C.play(years)}
        </Button>
      )}
    </div>
  );
}

/* ── A rate-decision day (f6) ─────────────────────────────────────────── */

const ENDINGS: ReleaseEnding[] = ['up', 'down', 'reverse'];

export function ReleaseDayWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.releaseDay;
  const done = useDone(onDone);
  const [plan, setPlan] = useState<ReleasePlan>('hold');
  const [ending, setEnding] = useState(0);
  const [played, setPlayed] = useState(false);
  const [tried, setTried] = useState(new Set<ReleasePlan>());
  const day = useMemo(
    () => releaseDay(STAGE5_SEEDS.release, ENDINGS[ending]!),
    [ending],
  );
  const result = playRelease(day, plan);
  const pre = day.bars.slice(0, day.at);
  return (
    <div className="space-y-3">
      <Choices
        name="release-plan"
        label={C.plan}
        options={(['hold', 'wait'] as const).map((value) => ({
          value,
          label: C.plans[value],
        }))}
        value={plan}
        onChange={(value) => {
          setPlan(value);
          setPlayed(false);
        }}
      />
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={played ? day.bars : pre}
          slots={day.bars.length}
          futureFrom={played ? undefined : day.at}
          markers={
            played
              ? [
                  {
                    index: day.at,
                    price: day.bars[day.at]!.high,
                    label: C.news,
                    tone: 'gold',
                    side: 'above',
                  },
                ]
              : []
          }
          levels={
            played
              ? [
                  { price: result.entry, tone: 'gold', label: C.entry },
                  {
                    price: result.stop,
                    tone: 'loss',
                    dashed: true,
                    label: C.stop,
                  },
                ]
              : []
          }
        />
      </div>
      {played ? (
        <Result>
          <p>{C.at(C.side[result.side], usd(result.entry))}</p>
          <p>{C.planned(usd(-result.planned))}</p>
          {result.fill !== null &&
          result.fill < result.stop &&
          result.side === 'long' &&
          result.stop - result.fill > RELEASE.normalSpread ? (
            <p className="text-loss">
              {C.slipped(usd(result.fill), usd(result.stop))}
            </p>
          ) : result.fill !== null ? (
            <p>{C.filled(usd(result.fill))}</p>
          ) : null}
          <p
            className={`font-semibold ${result.pnl < 0 ? 'text-loss' : 'text-gain'}`}
          >
            {result.pnl < 0 ? '▼ ' : '▲ '}
            {C.result(usd(result.pnl, true))}
          </p>
          <p className="type-tick text-muted">
            {C.spread(usd(RELEASE.normalSpread), usd(RELEASE.newsSpread))}
          </p>
        </Result>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => {
            setPlayed(true);
            const next = new Set(tried).add(plan);
            setTried(next);
            if (next.size === 2) done();
          }}
        >
          {C.play}
        </Button>
        <Button
          kind="secondary"
          onClick={() => {
            setEnding((e) => (e + 1) % ENDINGS.length);
            setPlayed(false);
          }}
        >
          {C.another}
        </Button>
      </div>
    </div>
  );
}

/* ── Where the dollars come from (f7) ─────────────────────────────────── */

export function DollarEarningsWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.dollarEarnings;
  const done = useDone(onDone);
  const [prices, setPrices] = useState<Record<Commodity, number>>(basePrices);
  const dollars = (usdM: number, signed = false) =>
    formatMoney(fromMinor(usdM * 100_000_000, 'USD'), {
      compact: true,
      signed,
    });
  return (
    <div className="space-y-3">
      {(['oil', 'gold', 'cocoa'] as const).map((good) => {
        const range = COMMODITY_PRICES[good];
        return (
          <Slider
            key={good}
            label={C.prices[good]}
            shown={usd(prices[good] * 100)}
            min={range.low}
            max={range.high}
            step={range.step}
            value={prices[good]}
            onChange={(v) => {
              setPrices((p) => ({ ...p, [good]: v }));
              done();
            }}
          />
        );
      })}
      <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
        {(['oil', 'mixed'] as const).map((key) => {
          const flow = dollarFlow(EXPORTERS[key], prices);
          const short = flow.gapUsdM < 0;
          const earnedShare = Math.min(
            100,
            (flow.earnedUsdM / Math.max(flow.earnedUsdM, flow.needsUsdM)) * 100,
          );
          const needsShare = Math.min(
            100,
            (flow.needsUsdM / Math.max(flow.earnedUsdM, flow.needsUsdM)) * 100,
          );
          return (
            <div
              key={key}
              className="rounded-md border border-line bg-panel p-3"
            >
              <p className="type-small font-semibold text-fg">
                {C.countries[key]}
              </p>
              <div className="mt-2 space-y-1.5 font-mono type-tick">
                <p className="flex justify-between text-fg-2">
                  <span>{C.earned}</span>
                  <span className="num text-fg">
                    {dollars(flow.earnedUsdM)}
                  </span>
                </p>
                <div className="h-2 rounded-full bg-line" aria-hidden>
                  <div
                    className="h-2 rounded-full bg-gold"
                    style={{ width: `${earnedShare}%` }}
                  />
                </div>
                <p className="flex justify-between text-fg-2">
                  <span>{C.needs}</span>
                  <span className="num text-fg">{dollars(flow.needsUsdM)}</span>
                </p>
                <div className="h-2 rounded-full bg-line" aria-hidden>
                  <div
                    className="h-2 rounded-full bg-edge"
                    style={{ width: `${needsShare}%` }}
                  />
                </div>
                <p
                  className={`flex justify-between ${short ? 'text-loss' : 'text-gain'}`}
                >
                  <span>{C.gap}</span>
                  <span className="num">{dollars(flow.gapUsdM, true)}</span>
                </p>
                <p className="text-muted">
                  {C.ofNeeds(formatBp(flow.gapBp, { signed: true }))}
                </p>
              </div>
              <p
                className={`mt-2 type-small ${short ? 'text-loss' : 'text-fg-2'}`}
              >
                {short ? '▼ ' : '▲ '}
                {short ? C.pressure : C.support}
              </p>
            </div>
          );
        })}
      </div>
      <p className="font-mono type-tick text-muted">{C.illustrative}</p>
    </div>
  );
}

/* ── The carry trade (f8) ─────────────────────────────────────────────── */

export function CarryTradeWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.carryTrade;
  const [devalue, setDevalue] = useState(true);
  const [shown, setShown] = useState(4);
  const run = useMemo(() => carryRun(STAGE5_SEEDS.carry, devalue), [devalue]);
  const step = 3;
  const all = shown >= run.length;
  const now = run[shown - 1]!;
  const hit = devalue && shown > CARRY.devalueMonth;
  const before = run[CARRY.devalueMonth - 1]!;
  const values = run.map((m) => m.profit);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const pad = Math.round((high - low) * 0.1);
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={asBars(values.slice(0, shown))}
          slots={run.length}
          mode="line"
          domain={{ low: low - pad, high: high + pad }}
          futureFrom={all ? undefined : shown}
          levels={[{ price: 0, tone: 'muted', dashed: true, label: C.zero }]}
          markers={
            hit
              ? [
                  {
                    index: CARRY.devalueMonth,
                    price: run[CARRY.devalueMonth]!.profit,
                    label: '✕',
                    tone: 'loss',
                    side: 'below',
                  },
                ]
              : []
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label={C.profit}
          value={usd(now.profit, true)}
          tone={now.profit < 0 ? 'loss' : 'gain'}
        />
        <Stat label={C.fx} value={(now.fx / 10_000).toFixed(2)} />
      </div>
      <p className="font-mono type-tick text-muted">{C.month(now.month)}</p>
      {hit ? (
        <p className="type-small text-loss">
          {C.devalued(formatBp(CARRY.devalueBp))}
        </p>
      ) : null}
      {all ? (
        <Result>
          <p>
            {devalue
              ? C.summary(usd(before.profit, true), usd(now.profit, true))
              : C.calm(usd(now.profit, true))}
          </p>
        </Result>
      ) : null}
      {all ? (
        <Button
          kind="secondary"
          onClick={() => {
            setDevalue((d) => !d);
            setShown(4);
          }}
        >
          {devalue ? C.again : C.withIt}
        </Button>
      ) : (
        <Button
          onClick={() => {
            const next = Math.min(run.length, shown + step);
            setShown(next);
            if (next >= run.length) onDone();
          }}
        >
          {C.next(step)}
        </Button>
      )}
    </div>
  );
}

/* ── Fundamentals for direction, the chart for timing (f9) ───────────── */

const PLANS: EntryPlan[] = ['chase', 'pullback', 'fade'];

export function NewsPullbackWidget({ onDone }: WidgetComponentProps) {
  const C = WIDGET_COPY.newsPullback;
  const [plan, setPlan] = useState<EntryPlan>('pullback');
  const [ending, setEnding] = useState<PullbackEnding>('holds');
  const [played, setPlayed] = useState(false);
  const scenario = useMemo(
    () => newsPullback(STAGE5_SEEDS.pullback, ending),
    [ending],
  );
  const slots = scenario.seen.length + scenario.next.length;
  const result = playEntry(scenario, plan);
  const r = (hundredths: number) =>
    `${hundredths >= 0 ? '+' : '−'}${(Math.abs(hundredths) / 100).toFixed(1)}R`;
  return (
    <div className="space-y-3">
      <p className="rounded-md border border-gold bg-gold-soft p-3 type-small text-fg">
        {C.headline}
      </p>
      <div className="rounded-md border border-line bg-ink p-2">
        <PriceChart
          bars={played ? [...scenario.seen, ...scenario.next] : scenario.seen}
          slots={slots}
          futureFrom={played ? undefined : scenario.seen.length}
          levels={[
            {
              price: scenario.support,
              tone: 'muted',
              dashed: true,
              label: C.support,
            },
            ...(played
              ? [
                  {
                    price: result.entry,
                    tone: 'gold' as const,
                    label: C.entry,
                  },
                  {
                    price: result.stop,
                    tone: 'loss' as const,
                    dashed: true,
                    label: C.stop,
                  },
                ]
              : []),
          ]}
        />
      </div>
      <Choices
        name="entry-plan"
        label={C.plan}
        options={PLANS.map((value) => ({ value, label: C.plans[value] }))}
        value={plan}
        onChange={(value) => {
          setPlan(value);
          setPlayed(false);
        }}
      />
      {played ? (
        <Result>
          <p>{C.endings[ending]}</p>
          <p
            className={`font-semibold ${result.r < 0 ? 'text-loss' : 'text-gain'}`}
          >
            {C.result(r(result.r))}
          </p>
          <p className="pt-1 font-mono type-tick text-muted">{C.all}</p>
          <ul className="font-mono type-tick text-fg-2">
            {PLANS.map((p) => (
              <li key={p} className="flex justify-between gap-2">
                <span>{C.plans[p]}</span>
                <span className="num">{r(playEntry(scenario, p).r)}</span>
              </li>
            ))}
          </ul>
        </Result>
      ) : null}
      <Button
        onClick={() => {
          if (played) setEnding((e) => (e === 'holds' ? 'fails' : 'holds'));
          setPlayed(true);
          onDone();
        }}
      >
        {played ? C.other[ending] : C.play}
      </Button>
    </div>
  );
}
