'use client';

import { useState } from 'react';
import { DANGOTE, IPO_PAGE } from '@/content/ipo';
import { formatBp, formatMoney, fromMinor, shareBp } from '@/lib/core/money';
import { afterListing, allotment, application } from '@/lib/engines/ipo';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { Delta } from '@/components/ui/Delta';

/**
 * Steps 1–3 of IPO 101, wired together: a budget becomes an application,
 * oversubscription cuts it down, and listing day moves what's left. Every
 * figure comes from lib/engines/ipo.ts; the offer's facts from content.
 */

const OFFER = DANGOTE.offer;
const naira = (kobo: number) => formatMoney(fromMinor(kobo, 'NGN'));
const MOVES = [-3_000, -2_000, -1_000, 0, 1_000, 2_000, 3_000];

function Stat({
  label,
  value,
  tone = 'fg',
}: {
  label: string;
  value: string;
  tone?: 'fg' | 'gold';
}) {
  return (
    <div className="rounded-md bg-raised px-3 py-2.5">
      <p className="font-mono type-tick text-muted">{label}</p>
      <p
        className={`mt-0.5 font-mono type-heading num ${tone === 'gold' ? 'text-gold' : 'text-fg'}`}
      >
        {value}
      </p>
    </div>
  );
}

function Step({
  kicker,
  title,
  lead,
  badge,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  badge: 'simulation' | 'hypothetical';
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono type-label text-gold">{kicker}</p>
        <TruthBadge truth={badge} />
      </div>
      <h3 className="mt-2 type-title text-fg">{title}</h3>
      <p className="mt-2 type-small text-fg-2">{lead}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function IpoLab() {
  const C = IPO_PAGE;
  const [budgetNaira, setBudgetNaira] = useState(100_000);
  const [times, setTimes] = useState(2);
  const [moveIndex, setMoveIndex] = useState(3);

  const budget = Math.max(0, Math.min(budgetNaira, 100_000_000)) * 100;
  const applied = application(OFFER, budget);
  const allotBp = Math.floor(10_000 / times);
  const allotted = allotment(OFFER, applied.shares, allotBp);
  const move = MOVES[moveIndex] ?? 0;
  const listed = afterListing(OFFER, allotted.allotted, move);
  const minimumCost = naira(OFFER.minimum * OFFER.price);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Step
        kicker={C.budget.kicker}
        title={C.budget.title}
        lead={C.budget.lead}
        badge="simulation"
      >
        <label className="block">
          <span className="type-label text-fg-2">{C.budget.label}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={budgetNaira}
            onChange={(event) =>
              setBudgetNaira(Math.floor(Number(event.target.value) || 0))
            }
            className="mt-2 min-h-12 w-full rounded-md border border-edge bg-raised px-3 font-mono type-body text-fg num outline-none focus:border-gold"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {C.budget.quick.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setBudgetNaira(amount)}
              className={`min-h-11 rounded-full border px-3 font-mono type-small num ${budgetNaira === amount ? 'border-gold bg-gold-soft text-gold' : 'border-edge text-fg-2'}`}
            >
              {naira(amount * 100)}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            label={C.budget.shares}
            value={applied.shares.toLocaleString('en-NG')}
            tone="gold"
          />
          <Stat label={C.budget.cost} value={naira(applied.cost)} />
          <Stat label={C.budget.change} value={naira(applied.change)} />
        </div>
        {applied.shares === 0 ? (
          <p className="mt-3 type-small text-loss">
            ⚠ {C.budget.tooSmall(minimumCost)}
          </p>
        ) : null}
      </Step>

      <Step
        kicker={C.oversubscribed.kicker}
        title={C.oversubscribed.title}
        lead={C.oversubscribed.lead}
        badge="hypothetical"
      >
        <div>
          <span className="flex items-baseline justify-between">
            <span className="type-label text-fg-2">
              {C.oversubscribed.label}
            </span>
            <span className="font-mono type-small font-semibold text-gold num">
              {C.oversubscribed.times(times)}
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            value={times}
            onChange={(event) => setTimes(Number(event.target.value))}
            aria-label={C.oversubscribed.label}
            className="slider mt-2 h-12 w-full cursor-pointer appearance-none bg-transparent"
            style={{ ['--filled' as string]: `${((times - 1) / 4) * 100}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat
            label={C.oversubscribed.allotted}
            value={`${allotted.allotted.toLocaleString('en-NG')} · ${formatBp(allotBp)}`}
            tone="gold"
          />
          <Stat
            label={C.oversubscribed.refund}
            value={naira(allotted.refund)}
          />
        </div>
        <p className="mt-3 type-small text-muted">{C.oversubscribed.note}</p>
      </Step>

      <Step
        kicker={C.listing.kicker}
        title={C.listing.title}
        lead={C.listing.lead}
        badge="hypothetical"
      >
        <div>
          <span className="flex items-baseline justify-between">
            <span className="type-label text-fg-2">{C.listing.label}</span>
            <span
              className={`font-mono type-small font-semibold num ${move > 0 ? 'text-gain' : move < 0 ? 'text-loss' : 'text-fg-2'}`}
            >
              {move > 0 ? '▲ ' : move < 0 ? '▼ ' : ''}
              {formatBp(move, { signed: true })}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={MOVES.length - 1}
            value={moveIndex}
            onChange={(event) => setMoveIndex(Number(event.target.value))}
            aria-label={C.listing.label}
            className="slider mt-2 h-12 w-full cursor-pointer appearance-none bg-transparent"
            style={{
              ['--filled' as string]: `${(moveIndex / (MOVES.length - 1)) * 100}%`,
            }}
          />
        </div>
        <div className="mt-2 rounded-md bg-raised px-3 py-2.5">
          <p className="font-mono type-tick text-muted">{C.listing.value}</p>
          <p className="mt-0.5 font-mono type-heading text-fg num">
            {naira(listed.value)}
          </p>
          {allotted.allotted > 0 ? (
            <div className="mt-1">
              <Delta
                amount={fromMinor(listed.change, 'NGN')}
                shareBp={shareBp(
                  fromMinor(listed.change, 'NGN'),
                  fromMinor(allotted.allotted * OFFER.price, 'NGN'),
                )}
                size="small"
              />
            </div>
          ) : null}
        </div>
        <p className="mt-3 type-small text-muted">{C.listing.note}</p>
      </Step>
    </div>
  );
}
