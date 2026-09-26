'use client';

/**
 * The lesson widgets' chart: candles, bars or a line, with optional volume
 * underneath, levels across, labelled markers, indicator lines over the
 * price (moving averages, bands), lines drawn through two points
 * (trendlines), and an indicator pane underneath (RSI, MACD). It draws
 * what it's given and computes nothing a learner reads as a number: every
 * series arrives from lib/engines.
 *
 * Direction never depends on colour alone: up candles are hollow and down
 * candles filled, markers carry words (HH, LL, ✕), and lines differ by dash
 * as well as colour. Widgets name each line in words beside the chart.
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

export type LineTone = 'gold' | 'blue' | 'muted' | 'loss' | 'gain';

/** A series over the chart, one value per bar; null leaves a gap. */
export type Overlay = {
  values: readonly (number | null)[];
  tone: LineTone;
  dashed?: boolean;
  width?: number;
};

/** A straight line through two points, drawn across the whole chart. */
export type Ray = {
  a: { index: number; price: number };
  b: { index: number; price: number };
  tone: LineTone;
  dashed?: boolean;
};

/** An indicator pane under the price: lines, an optional histogram, guides. */
export type Pane = {
  lines?: readonly Overlay[];
  histogram?: readonly (number | null)[];
  range?: { low: number; high: number };
  guides?: readonly { value: number; label: string }[];
  label?: string;
};

const LINE_TONE: Record<LineTone, string> = {
  gold: 'stroke-gold',
  blue: 'stroke-series-2',
  muted: 'stroke-edge',
  loss: 'stroke-loss',
  gain: 'stroke-gain',
};

const SLOT = 10;
const H = 200;
const VOL_H = 44;
const PANE_H = 80;

/** Polyline points for a series, split wherever a value is missing. */
function segments(
  values: readonly (number | null)[],
  y: (value: number) => number,
): string[] {
  const out: string[] = [];
  let current: string[] = [];
  values.forEach((value, i) => {
    if (value == null) {
      if (current.length > 1) out.push(current.join(' '));
      current = [];
      return;
    }
    current.push(`${i * SLOT + SLOT / 2},${y(value)}`);
  });
  if (current.length > 1) out.push(current.join(' '));
  return out;
}

/**
 * The pane's scale: fixed when the pane names one (RSI's 0–100), otherwise
 * fitted to its values, and symmetric around zero for a histogram so up and
 * down bars compare fairly.
 */
function paneScale(pane: Pane | undefined): { low: number; high: number } {
  let min = Infinity;
  let max = -Infinity;
  let extent = 1e-9;
  const take = (value: number | null) => {
    if (value == null) return;
    if (value < min) min = value;
    if (value > max) max = value;
    if (Math.abs(value) > extent) extent = Math.abs(value);
  };
  for (const line of pane?.lines ?? [])
    for (const value of line.values) take(value);
  for (const value of pane?.histogram ?? []) take(value);
  if (min === Infinity) min = max = 0;
  return {
    low: pane?.range?.low ?? (pane?.histogram ? -extent : min),
    high: pane?.range?.high ?? (pane?.histogram ? extent : max),
  };
}

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
  lines = [],
  rays = [],
  pane,
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
  lines?: readonly Overlay[];
  rays?: readonly Ray[];
  pane?: Pane;
  className?: string;
}) {
  const count = Math.max(slots ?? bars.length, 1);
  const width = count * SLOT;
  const overlayValues = lines.flatMap((line) =>
    line.values.filter((value): value is number => value != null),
  );
  const lows = [...bars.map((bar) => bar.low), ...overlayValues];
  const highs = [...bars.map((bar) => bar.high), ...overlayValues];
  const pad = Math.max(
    10,
    Math.round((Math.max(...highs) - Math.min(...lows) || 100) * 0.08),
  );
  const low = domain?.low ?? Math.min(...lows) - pad;
  const high = domain?.high ?? Math.max(...highs) + pad;
  const y = (price: number) => ((high - price) / (high - low)) * H;
  const maxVolume = Math.max(1, ...bars.map((bar) => bar.volume ?? 0));
  const volumeTop = H + 8;
  const paneTop = H + (volume ? VOL_H + 8 : 0) + 12;
  const total = pane ? paneTop + PANE_H : volume ? H + VOL_H + 8 : H;
  const { low: paneLow, high: paneHigh } = paneScale(pane);
  const py = (value: number) =>
    paneTop + ((paneHigh - value) / (paneHigh - paneLow || 1)) * PANE_H;
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
        {rays.map((ray, n) => {
          const slope =
            (ray.b.price - ray.a.price) / (ray.b.index - ray.a.index);
          const at = (i: number) => ray.a.price + slope * (i - ray.a.index);
          return (
            <line
              key={`ray-${n}`}
              x1={SLOT / 2}
              x2={width - SLOT / 2}
              y1={y(at(0))}
              y2={y(at(count - 1))}
              className={LINE_TONE[ray.tone]}
              strokeWidth={2}
              strokeDasharray={ray.dashed ? '6 4' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
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
        {lines.flatMap((line, n) =>
          segments(line.values, y).map((points, m) => (
            <polyline
              key={`ov-${n}-${m}`}
              points={points}
              fill="none"
              className={LINE_TONE[line.tone]}
              strokeWidth={line.width ?? 2}
              strokeDasharray={line.dashed ? '5 4' : undefined}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )),
        )}
        {volume
          ? bars.map((bar, i) => {
              const h = ((bar.volume ?? 0) / maxVolume) * VOL_H;
              return (
                <rect
                  key={`v${i}`}
                  x={i * SLOT + 2}
                  y={volumeTop + VOL_H - h}
                  width={SLOT - 4}
                  height={h}
                  className={
                    bar.close >= bar.open ? 'fill-baseline' : 'fill-edge'
                  }
                />
              );
            })
          : null}
        {pane ? (
          <g>
            <line
              x1={0}
              x2={width}
              y1={paneTop - 6}
              y2={paneTop - 6}
              className="stroke-line"
              vectorEffect="non-scaling-stroke"
            />
            {(pane.guides ?? []).map((guide) => (
              <line
                key={`g-${guide.value}`}
                x1={0}
                x2={width}
                y1={py(guide.value)}
                y2={py(guide.value)}
                className="stroke-edge"
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {pane.histogram?.map((value, i) =>
              value == null ? null : (
                <rect
                  key={`h-${i}`}
                  x={i * SLOT + 2}
                  y={Math.min(py(value), py(0))}
                  width={SLOT - 4}
                  height={Math.max(Math.abs(py(value) - py(0)), 0.5)}
                  className={value >= 0 ? 'fill-baseline' : 'fill-edge'}
                />
              ),
            )}
            {(pane.lines ?? []).flatMap((line, n) =>
              segments(line.values, py).map((points, m) => (
                <polyline
                  key={`pl-${n}-${m}`}
                  points={points}
                  fill="none"
                  className={LINE_TONE[line.tone]}
                  strokeWidth={line.width ?? 1.5}
                  strokeDasharray={line.dashed ? '5 4' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              )),
            )}
          </g>
        ) : null}
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
      {pane?.label ? (
        <span
          className="pointer-events-none absolute left-1 font-mono text-[0.625rem] leading-3 text-muted uppercase"
          style={{ top: pct(paneTop - 2, total) }}
        >
          {pane.label}
        </span>
      ) : null}
      {(pane?.guides ?? []).map((guide) => (
        <span
          key={`gl-${guide.value}`}
          className="pointer-events-none absolute right-1 -translate-y-1/2 font-mono text-[0.625rem] leading-3 text-muted num"
          style={{ top: pct(py(guide.value), total) }}
        >
          {guide.label}
        </span>
      ))}
    </div>
  );
}
