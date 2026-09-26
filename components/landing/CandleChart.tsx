'use client';

import type { Candle } from '@/lib/engines/chart';

/**
 * A candlestick chart in SVG, for lessons that need a handful of candles and
 * lines. Draws only what it's given: every price comes from an engine.
 *
 * Direction is shown by shape as well as colour: up candles are hollow, down
 * candles are filled, the way traders' hollow-candle charts do it. That still
 * reads in greyscale and to someone who can't tell red from green (design
 * brief rule 3).
 *
 * The SVG stretches to the width it's given (preserveAspectRatio="none"), so
 * anything that must keep its shape, like labels and markers, is laid over
 * it in HTML, positioned by percentage.
 */

const SLOT = 10;
const HEIGHT = 200;

export type ChartLevel = {
  price: number;
  label: string;
  tone: 'gold' | 'muted' | 'loss' | 'fg';
  dashed?: boolean;
};

export type ChartMark = {
  index: number;
  price: number;
  label: string;
  tone: 'gold' | 'loss';
  /** Draw the mark under the price (a low) or over it (a high). */
  side: 'below' | 'above';
};

const LINE_TONE: Record<ChartLevel['tone'], string> = {
  gold: 'stroke-gold',
  muted: 'stroke-edge',
  loss: 'stroke-loss',
  fg: 'stroke-fg-2',
};

const LABEL_TONE: Record<ChartLevel['tone'], string> = {
  gold: 'bg-gold text-ink',
  muted: 'bg-raised text-fg-2 border border-edge',
  loss: 'bg-loss text-ink',
  fg: 'bg-fg text-ink',
};

export function CandleChart({
  candles,
  slots,
  view,
  levels = [],
  marks = [],
  selected,
  futureFrom,
  futureLabel,
  label,
}: {
  candles: readonly Candle[];
  /** How many candle slots the x-axis has, drawn or not. */
  slots: number;
  view: { low: number; high: number };
  levels?: readonly ChartLevel[];
  marks?: readonly ChartMark[];
  selected?: number | null;
  /** Slots from here on are shaded as the part of the chart not yet played. */
  futureFrom?: number | null;
  futureLabel?: string;
  label: string;
}) {
  const width = slots * SLOT;
  const y = (price: number) =>
    ((view.high - price) / (view.high - view.low)) * HEIGHT;
  const topPercent = (price: number) =>
    Math.min(100, Math.max(0, (y(price) / HEIGHT) * 100));
  const leftPercent = (index: number) =>
    ((index * SLOT + SLOT / 2) / width) * 100;

  return (
    <div className="relative select-none">
      <span className="sr-only">{label}</span>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-56 w-full touch-manipulation sm:h-72"
        aria-hidden
      >
        {/* Chart paper: quiet horizontal gridlines. */}
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={HEIGHT * f}
            y2={HEIGHT * f}
            className="stroke-line"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {futureFrom != null && futureFrom < slots ? (
          <rect
            x={futureFrom * SLOT}
            y={0}
            width={(slots - futureFrom) * SLOT}
            height={HEIGHT}
            className="fill-raised"
            opacity={0.55}
          />
        ) : null}

        {selected != null ? (
          <rect
            x={selected * SLOT}
            y={0}
            width={SLOT}
            height={HEIGHT}
            className="fill-gold-soft"
          />
        ) : null}

        {levels.map((level) => (
          <line
            key={`${level.label}-${level.price}`}
            x1={0}
            x2={width}
            y1={y(level.price)}
            y2={y(level.price)}
            className={LINE_TONE[level.tone]}
            strokeWidth={1.5}
            strokeDasharray={level.dashed ? '5 4' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {candles.map((candle, i) => {
          const up = candle.close >= candle.open;
          const x = i * SLOT + SLOT / 2;
          const top = y(Math.max(candle.open, candle.close));
          const bottom = y(Math.min(candle.open, candle.close));
          return (
            <g key={i}>
              <line
                x1={x}
                x2={x}
                y1={y(candle.high)}
                y2={y(candle.low)}
                className={up ? 'stroke-gain-mark' : 'stroke-loss-mark'}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={x - 3}
                y={top}
                width={6}
                height={Math.max(bottom - top, 1)}
                className={
                  up
                    ? 'fill-panel stroke-gain-mark'
                    : 'fill-loss-mark stroke-loss-mark'
                }
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {/* Labels and markers, in HTML so they keep their shape. */}
      {levels
        .filter((level) => level.label)
        .map((level) => (
          <span
            key={`label-${level.label}-${level.price}`}
            className={`pointer-events-none absolute right-1 -translate-y-1/2 rounded-sm px-1.5 font-mono text-[0.6875rem] leading-4 font-semibold num ${LABEL_TONE[level.tone]}`}
            style={{ top: `${topPercent(level.price)}%` }}
          >
            {level.label}
          </span>
        ))}

      {marks.map((mark) => (
        <span
          key={`mark-${mark.index}-${mark.label}`}
          aria-hidden
          className={`pointer-events-none absolute -translate-x-1/2 font-mono text-[0.625rem] leading-3 font-bold ${mark.tone === 'gold' ? 'text-gold' : 'text-loss'} ${mark.side === 'below' ? 'translate-y-1' : '-translate-y-4'}`}
          style={{
            left: `${leftPercent(mark.index)}%`,
            top: `${topPercent(mark.price)}%`,
          }}
        >
          {mark.label}
        </span>
      ))}

      {futureFrom != null && futureFrom < slots && futureLabel ? (
        <span
          className="pointer-events-none absolute top-2 font-mono type-tick text-muted uppercase"
          style={{
            left: `${(futureFrom / slots) * 100}%`,
            paddingLeft: 6,
          }}
        >
          {futureLabel}
        </span>
      ) : null}
    </div>
  );
}
