'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TOOLS as C } from '@/content/tools';
import { lesson } from '@/content/curriculum';
import {
  formatBp,
  formatMoney,
  parseMoney,
  type Currency,
} from '@/lib/core/money';
import { atSamePlaces } from '@/lib/engines/journal';
import {
  climbBack,
  edge,
  LEVERAGE_FROM_TENTHS,
  TOO_GOOD_MONTHLY_BP,
  forexLots,
  formatLots,
  formatQuantity,
  parseCount,
  parsePercent,
  parsePips,
  promise,
  riskReward,
  sizePosition,
} from '@/lib/engines/tools';
import { formatR, formatTimes } from '@/lib/engines/trades';
import { Segmented } from '@/components/ui/Segmented';
import { Answers, Field, Note } from './fields';

/**
 * The calculators. One at a time: a list to pick from (a column on a
 * laptop, a grid of chips on a phone), then its boxes and its answers,
 * worked out by lib/engines/tools.ts as you type. A signal's "Size this
 * trade" arrives with its entry, stop and target filled in.
 */

type ToolId = keyof typeof C.list;
const IDS = Object.keys(C.list) as ToolId[];

export type ToolsStart = {
  tool?: string;
  entry?: string;
  stop?: string;
  target?: string;
};

/** Run an engine call; a refusal (bad input) means no answer yet. */
function attempt<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

const CURRENCIES: readonly { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'GHS', label: 'GHS' },
  { value: 'NGN', label: 'NGN' },
];

function Size({ start }: { start: ToolsStart }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [account, setAccount] = useState('1000');
  const [risk, setRisk] = useState('1');
  const [entry, setEntry] = useState(start.entry ?? '');
  const [stop, setStop] = useState(start.stop ?? '');
  const money = parseMoney(account, currency);
  const riskBp = parsePercent(risk);
  const prices = atSamePlaces([entry, stop]);
  const result =
    money && riskBp && prices?.units[0] && prices.units[1]
      ? attempt(() =>
          sizePosition({
            accountMinor: money.minor,
            riskBp,
            entry: prices.units[0] as number,
            stop: prices.units[1] as number,
            decimals: prices.decimals,
          }),
        )
      : null;
  const side =
    prices?.units[0] && prices.units[1] && prices.units[1] < prices.units[0]
      ? 'buy'
      : 'sell';
  return (
    <div className="space-y-4">
      <Segmented
        name="currency"
        label={C.fields.currency}
        options={CURRENCIES}
        value={currency}
        onChange={setCurrency}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="size-account"
          label={C.fields.account}
          value={account}
          onChange={setAccount}
          help={C.fields.accountHelp}
        />
        <Field
          id="size-risk"
          label={C.fields.risk}
          value={risk}
          onChange={setRisk}
        />
        <Field
          id="size-entry"
          label={C.fields.entry}
          value={entry}
          onChange={setEntry}
          placeholder={C.fields.entryHint}
        />
        <Field
          id="size-stop"
          label={C.fields.stop}
          value={stop}
          onChange={setStop}
          placeholder={C.fields.stopHint}
        />
      </div>
      <Answers
        empty={C.invalid}
        rows={
          result
            ? [
                {
                  label: C.results.quantity,
                  value: formatQuantity(result.quantity),
                  strong: true,
                },
                {
                  label: C.results.risk,
                  value: formatMoney({ minor: result.riskMinor, currency }),
                },
                { label: C.results.side, value: C.side[side] },
                {
                  label: C.results.value,
                  value: formatMoney({ minor: result.valueMinor, currency }),
                },
                {
                  label: C.results.exposure,
                  value: formatTimes(result.exposureTenths),
                },
                { label: C.results.stopShare, value: formatBp(result.stopBp) },
              ]
            : null
        }
      />
      {result && result.exposureTenths > LEVERAGE_FROM_TENTHS ? (
        <Note tone="warn">{C.warn.leverage}</Note>
      ) : null}
    </div>
  );
}

function Lots() {
  const [account, setAccount] = useState('1000');
  const [risk, setRisk] = useState('1');
  const [pips, setPips] = useState('25');
  const money = parseMoney(account, 'USD');
  const riskBp = parsePercent(risk);
  const tenths = parsePips(pips);
  const result =
    money && riskBp && tenths
      ? attempt(() =>
          forexLots({
            accountMinor: money.minor,
            riskBp,
            stopPipTenths: tenths,
          }),
        )
      : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          id="lots-account"
          label={C.fields.account}
          value={account}
          onChange={setAccount}
          help={C.fields.inDollars}
        />
        <Field
          id="lots-risk"
          label={C.fields.risk}
          value={risk}
          onChange={setRisk}
        />
        <Field
          id="lots-pips"
          label={C.fields.pips}
          value={pips}
          onChange={setPips}
        />
      </div>
      <Answers
        empty={C.invalid}
        rows={
          result
            ? [
                {
                  label: C.results.lots,
                  value: formatLots(result.lotsHundredths),
                  strong: true,
                },
                {
                  label: C.results.risk,
                  value: formatMoney({
                    minor: result.riskMinor,
                    currency: 'USD',
                  }),
                },
                {
                  label: C.results.pipValue,
                  value: formatMoney({
                    minor: result.pipValueMinor,
                    currency: 'USD',
                  }),
                },
              ]
            : null
        }
      />
      {result && result.lotsHundredths === 0 ? (
        <Note tone="warn">{C.warn.tiny}</Note>
      ) : null}
    </div>
  );
}

function RiskReward({ start }: { start: ToolsStart }) {
  const [entry, setEntry] = useState(start.entry ?? '');
  const [stop, setStop] = useState(start.stop ?? '');
  const [target, setTarget] = useState(start.target ?? '');
  const prices = atSamePlaces([entry, stop, target]);
  const [e, s, t] = prices?.units ?? [];
  const result =
    e && s && t
      ? attempt(() => riskReward({ entry: e, stop: s, target: t }))
      : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          id="rr-entry"
          label={C.fields.entry}
          value={entry}
          onChange={setEntry}
        />
        <Field
          id="rr-stop"
          label={C.fields.stop}
          value={stop}
          onChange={setStop}
        />
        <Field
          id="rr-target"
          label={C.fields.target}
          value={target}
          onChange={setTarget}
        />
      </div>
      <Answers
        empty={e && s && t ? C.wrongSide : C.invalid}
        rows={
          result
            ? [
                {
                  label: C.results.reward,
                  value: formatR(result.rewardR, { signed: false }),
                  strong: true,
                },
                {
                  label: C.results.breakEven,
                  value: formatBp(result.breakEvenBp),
                },
                { label: C.results.side, value: C.side[result.side] },
              ]
            : null
        }
      />
    </div>
  );
}

function Climb() {
  const [loss, setLoss] = useState('30');
  const [gain, setGain] = useState('2');
  const lossBp = parsePercent(loss);
  const gainBp = parsePercent(gain);
  const result =
    lossBp && gainBp
      ? attempt(() => climbBack({ lossBp, gainPerTradeBp: gainBp }))
      : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="climb-loss"
          label={C.fields.loss}
          value={loss}
          onChange={setLoss}
        />
        <Field
          id="climb-gain"
          label={C.fields.gain}
          value={gain}
          onChange={setGain}
        />
      </div>
      <Answers
        empty={C.invalid}
        rows={
          result
            ? [
                {
                  label: C.results.needed,
                  value: formatBp(result.neededBp),
                  strong: true,
                },
                {
                  label: C.results.trades,
                  value:
                    result.trades === null
                      ? C.results.never
                      : String(result.trades),
                },
              ]
            : null
        }
      />
    </div>
  );
}

function Promise_() {
  const [amount, setAmount] = useState('1000');
  const [monthly, setMonthly] = useState('10');
  const [months, setMonths] = useState('12');
  const money = parseMoney(amount, 'GHS');
  const rateBp = parsePercent(monthly);
  const count = parseCount(months, 120);
  const result =
    money && rateBp !== null && count
      ? attempt(() =>
          promise({
            amountMinor: money.minor,
            monthlyBp: rateBp,
            months: count,
          }),
        )
      : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          id="p-amount"
          label={C.fields.amount}
          value={amount}
          onChange={setAmount}
          help={C.fields.inCedis}
        />
        <Field
          id="p-monthly"
          label={C.fields.monthly}
          value={monthly}
          onChange={setMonthly}
        />
        <Field
          id="p-months"
          label={C.fields.months}
          value={months}
          onChange={setMonths}
          mode="numeric"
        />
      </div>
      <Answers
        empty={C.invalid}
        rows={
          result
            ? [
                {
                  label: C.results.end,
                  value: formatMoney(
                    { minor: result.endMinor, currency: 'GHS' },
                    { compact: true },
                  ),
                  strong: true,
                },
                {
                  label: C.results.multiple,
                  value: formatTimes(
                    Math.floor(result.multipleHundredths / 10),
                  ),
                },
              ]
            : null
        }
      />
      {result && rateBp !== null && rateBp >= TOO_GOOD_MONTHLY_BP ? (
        <Note tone="warn">{C.warn.promise}</Note>
      ) : null}
    </div>
  );
}

function Edge() {
  const [win, setWin] = useState('40');
  const [winR, setWinR] = useState('2');
  const [lossR, setLossR] = useState('1');
  const winBp = parsePercent(win);
  const w = parsePercent(winR);
  const l = parsePercent(lossR);
  const result =
    winBp !== null && winBp <= 10_000 && w !== null && l !== null
      ? attempt(() => edge({ winBp, winR: w, lossR: l }))
      : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          id="e-win"
          label={C.fields.winRate}
          value={win}
          onChange={setWin}
        />
        <Field
          id="e-winr"
          label={C.fields.winR}
          value={winR}
          onChange={setWinR}
        />
        <Field
          id="e-lossr"
          label={C.fields.lossR}
          value={lossR}
          onChange={setLossR}
        />
      </div>
      <Answers
        empty={C.invalid}
        rows={
          result
            ? [
                {
                  label: C.results.perTrade,
                  value: formatR(result.perTrade),
                  strong: true,
                },
                {
                  label: C.results.perHundred,
                  value: formatR(result.perHundred),
                },
                {
                  label: C.results.breakEven,
                  value: formatBp(result.breakEvenBp),
                },
              ]
            : null
        }
      />
      {result && result.perTrade < 0 ? (
        <Note tone="warn">{C.warn.negative}</Note>
      ) : null}
    </div>
  );
}

export function Tools({ start }: { start: ToolsStart }) {
  const first: ToolId =
    start.tool && (IDS as string[]).includes(start.tool)
      ? (start.tool as ToolId)
      : start.target && !start.entry
        ? 'rr'
        : 'size';
  const [tool, setTool] = useState<ToolId>(first);
  const info = C.list[tool];
  const teach = lesson(info.lesson);

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-5 pb-8 sm:px-8 lg:pt-8">
      <p className="font-mono type-label text-gold">{C.kicker}</p>
      <h1 className="mt-1 type-display text-fg">{C.title}</h1>
      <p className="mt-2 max-w-[60ch] type-body text-fg-2">{C.lead}</p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <nav aria-label={C.pick}>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={tool === id}
                  onClick={() => setTool(id)}
                  className={`flex min-h-12 w-full items-center rounded-lg border px-3 text-left type-small font-semibold ${tool === id ? 'border-gold bg-gold-soft text-fg' : 'border-line bg-panel text-fg-2 hover:text-fg'}`}
                >
                  {C.list[id].name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section
          aria-labelledby="tool-title"
          className="mt-4 rounded-xl border border-line bg-panel p-4 sm:p-5 lg:mt-0"
        >
          <h2 id="tool-title" className="type-title text-fg">
            {info.name}
          </h2>
          <p className="mt-1 type-small text-fg-2">{info.lead}</p>
          <div className="mt-4">
            {tool === 'size' ? <Size start={start} /> : null}
            {tool === 'lots' ? <Lots /> : null}
            {tool === 'rr' ? <RiskReward start={start} /> : null}
            {tool === 'climb' ? <Climb /> : null}
            {tool === 'promise' ? <Promise_ /> : null}
            {tool === 'edge' ? <Edge /> : null}
          </div>
          {teach.playAt ? (
            <Link
              href={teach.playAt}
              className="mt-4 inline-flex min-h-11 items-center gap-1 type-small font-semibold text-gold underline underline-offset-4"
            >
              {C.learn(teach.title)} <span aria-hidden>→</span>
            </Link>
          ) : null}
        </section>
      </div>
      <p className="mt-4 type-tick text-muted">{C.honest}</p>
    </div>
  );
}
