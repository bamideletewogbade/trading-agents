'use client';

import { useMemo, useState } from 'react';
import { MINDSET } from '@/content/mindset';
import {
  NOISE_LAB,
  movingAverage,
  noisyPrices,
  turns,
} from '@/lib/engines/noise';
import { TruthBadge } from '@/components/shell/TruthBadge';

/**
 * Noise vs signal, by hand: a jumpy price and a moving average whose length
 * the learner slides. The count of direction changes, price against filter,
 * is the lesson in one number (lib/engines/noise.ts).
 */

const COPY = MINDSET.filter;
const W = 600;
const H = 220;

export function NoiseFilter() {
  const [length, setLength] = useState(1);
  const prices = useMemo(() => noisyPrices(NOISE_LAB, 'mindset'), []);
  const average = useMemo(
    () => movingAverage(prices, length),
    [prices, length],
  );

  const low = Math.min(...prices) - 40;
  const high = Math.max(...prices) + 40;
  const x = (i: number) => (i / (prices.length - 1)) * W;
  const y = (v: number) => ((high - v) / (high - low)) * H;
  const pricePath = prices.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const averagePath = average
    .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
    .filter(Boolean)
    .join(' ');
  const filled = ((length - 1) / 29) * 100;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="type-heading text-fg">{COPY.title}</p>
        <TruthBadge truth="simulation" />
      </div>
      <div className="p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-52 w-full sm:h-64"
          aria-hidden
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={H * f}
              y2={H * f}
              className="stroke-line"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <polyline
            points={pricePath}
            fill="none"
            className="stroke-edge"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {length > 1 ? (
            <polyline
              points={averagePath}
              fill="none"
              className="stroke-gold"
              strokeWidth={3}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        <p className="mt-2 flex gap-4 font-mono type-tick text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-edge" /> {COPY.price}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full bg-gold" /> {COPY.line}
          </span>
        </p>

        <div className="mt-5">
          <span className="flex items-baseline justify-between">
            <span className="type-label text-fg-2">{COPY.label}</span>
            <span className="font-mono type-body font-semibold text-gold num">
              {COPY.days(length)}
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
            aria-label={COPY.label}
            className="slider mt-2 h-12 w-full cursor-pointer appearance-none bg-transparent"
            style={{ ['--filled' as string]: `${filled}%` }}
          />
        </div>
        <p className="mt-2 type-body text-fg num" aria-live="polite">
          {COPY.turns(turns(prices), turns(length > 1 ? average : prices))}
        </p>
        <p className="mt-2 type-small text-fg-2">{COPY.tradeoff}</p>
      </div>
    </div>
  );
}
