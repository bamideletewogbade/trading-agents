'use client';

/**
 * The lesson widgets' chart: candles, bars or a line, with optional volume
 * underneath, levels across and labelled markers. It draws what it's given
 * and computes nothing a learner reads as a number.
 *
 * Direction never depends on colour alone: up candles are hollow and down
 * candles filled, and markers carry words (HH, LL, ✕).
 */

type Ohlc = {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
};

export type Marker = {
  index: number;
  price: number;
  label: string;
  tone: 'gold' | 'loss' | 'gain' | 'fg';
  side: 'above' | 'below';
};

export type Level = {
  price: number;
  label?: string;
  tone: 'gold' | 'loss' | 'muted';
  dashed?: boolean;
};

const SLOT = 10;
const H = 200;
const VOL_H = 44;

const TONE: Record<Marker['tone'], string> = {
  gold: 'text-gold',
  loss: 'text-loss',
  gain: 'text-gain',
  fg: 'text-fg',
};

export function PriceChart({
  bars,
  slots,
  mode = 'candle',
  domain,
  levels = [],
  markers = [],
  volume = false,
  futureFrom,
  className = 'h-48 sm:h-60',
}: {
  bars: readonly Ohlc[];
  slots?: number;
  mode?: 'candle' | 'bar' | 'line';
  domain?: { low: number; high: number };
  levels?: readonly Level[];
  markers?: readonly Marker[];
  volume?: boolean;
  futureFrom?: number;
  className?: string;
}) {
  const count = Math.max(slots ?? bars.length, 1);
  const width = count * SLOT;
  const lows = bars.map((bar) => bar.low);
  const highs = bars.map((bar) => bar.high);
  const pad = Math.max(
    10,
    Math.round((Math.max(...highs) - Math.min(...lows) || 100) * 0.08),
  );
  const low = domain?.low ?? Math.min(...lows) - pad;
  const high = domain?.high ?? Math.max(...highs) + pad;
  const y = (price: number) => ((high - price) / (high - low)) * H;
  const maxVolume = Math.max(1, ...bars.map((bar) => bar.volume ?? 0));
  const total = volume ? H + VOL_H + 8 : H;
  const pct = (value: number, of: number) => `${(value / of) * 100}%`;

  return (
    <div className="relative select-none" aria-hidden>
      <svg
        viewBox={`0 0 ${width} ${total}`}
        preserveAspectRatio="none"
        className={`block w-full ${className}`}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={H * f}
            y2={H * f}
            className="stroke-line"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {futureFrom !== undefined && futureFrom < count ? (
          <rect
            x={futureFrom * SLOT}
            y={0}
            width={(count - futureFrom) * SLOT}
            height={total}
            className="fill-raised"
            opacity={0.5}
          />
        ) : null}
        {levels.map((level) => (
          <line
            key={`${level.price}-${level.label ?? ''}`}
            x1={0}
            x2={width}
            y1={y(level.price)}
            y2={y(level.price)}
            className={
              level.tone === 'gold'
                ? 'stroke-gold'
                : level.tone === 'loss'
                  ? 'stroke-loss'
                  : 'stroke-edge'
            }
            strokeWidth={1.5}
            strokeDasharray={level.dashed ? '5 4' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {mode === 'line' ? (
          <polyline
            points={bars
              .map((bar, i) => `${i * SLOT + SLOT / 2},${y(bar.close)}`)
              .join(' ')}
            fill="none"
            className="stroke-gold"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          bars.map((bar, i) => {
            const up = bar.close >= bar.open;
            const x = i * SLOT + SLOT / 2;
            const tone = up ? 'stroke-gain-mark' : 'stroke-loss-mark';
            if (mode === 'bar')
              return (
                <g key={i} className={tone} strokeWidth={1.5}>
                  <line
                    x1={x}
                    x2={x}
                    y1={y(bar.high)}
                    y2={y(bar.low)}
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={x - 3}
                    x2={x}
                    y1={y(bar.open)}
                    y2={y(bar.open)}
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={x}
                    x2={x + 3}
                    y1={y(bar.close)}
                    y2={y(bar.close)}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            const top = y(Math.max(bar.open, bar.close));
            const bottom = y(Math.min(bar.open, bar.close));
            return (
              <g key={i}>
                <line
                  x1={x}
                  x2={x}
                  y1={y(bar.high)}
                  y2={y(bar.low)}
                  className={tone}
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
          })
        )}
        {volume
          ? bars.map((bar, i) => {
              const h = ((bar.volume ?? 0) / maxVolume) * VOL_H;
              return (
                <rect
                  key={`v${i}`}
                  x={i * SLOT + 2}
                  y={total - h}
                  width={SLOT - 4}
                  height={h}
                  className={
                    bar.close >= bar.open ? 'fill-baseline' : 'fill-edge'
                  }
                />
              );
            })
          : null}
      </svg>
      {levels
        .filter((level) => level.label)
        .map((level) => (
          <span
            key={`l-${level.price}-${level.label}`}
            className={`pointer-events-none absolute right-1 -translate-y-1/2 rounded-sm px-1.5 font-mono text-[0.6875rem] leading-4 font-semibold num ${level.tone === 'gold' ? 'bg-gold text-ink' : level.tone === 'loss' ? 'bg-loss text-ink' : 'border border-edge bg-raised text-fg-2'}`}
            style={{ top: pct(y(level.price), total) }}
          >
            {level.label}
          </span>
        ))}
      {markers.map((marker) => (
        <span
          key={`m-${marker.index}-${marker.label}`}
          className={`pointer-events-none absolute -translate-x-1/2 font-mono text-[0.625rem] leading-3 font-bold ${TONE[marker.tone]} ${marker.side === 'below' ? 'translate-y-1' : '-translate-y-4'}`}
          style={{
            left: pct(marker.index * SLOT + SLOT / 2, width),
            top: pct(y(marker.price), total),
          }}
        >
          {marker.label}
        </span>
      ))}
    </div>
  );
}
