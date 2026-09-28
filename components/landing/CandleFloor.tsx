import type { CSSProperties } from 'react';
import { createRng } from '@/lib/core/rng';
import { Reveal } from '@/components/motion/Reveal';

/**
 * The closing section's stage: chart paper laid flat and running toward you
 * in CSS 3D, with a row of candles rising along the horizon into one gold
 * climb. Pure decoration, drawn on the server from a pinned seed (so it's
 * the same on every load), no WebGL, and still under reduced motion.
 * Hollow and filled bodies say up and down without colour (CLAUDE.md rule 7).
 */
const CANDLES = (() => {
  const rng = createRng('closing-floor');
  let level = 14;
  return Array.from({ length: 28 }, (_, i) => {
    // A drift upward with honest wobble: some candles fall.
    const move = rng.int(-6, 11);
    const open = level;
    level = Math.max(12, Math.min(86, level + move));
    const close = level;
    const top = Math.max(open, close) + rng.int(2, 9);
    const bottom = Math.min(open, close) - rng.int(2, 9);
    return { i, open, close, top, bottom, up: close >= open };
  });
})();

export function CandleFloor({ className = '' }: { className?: string }) {
  return (
    <Reveal
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* The floor, tipped back into the distance. */}
      <div className="absolute inset-x-[-40%] bottom-0 h-[48%] [perspective:420px] [perspective-origin:50%_0%]">
        <div className="floor-grid absolute inset-0 origin-top [transform:rotateX(62deg)]" />
      </div>
      {/* The horizon glow the candles stand in front of. */}
      <div className="absolute inset-x-0 bottom-[36%] h-40 bg-[radial-gradient(ellipse_at_70%_50%,color-mix(in_srgb,var(--color-gold)_16%,transparent),transparent_70%)]" />
      {/* Below the words on a phone; beside them, rising to the right, on a laptop. */}
      <svg
        aria-hidden
        viewBox="0 0 560 100"
        preserveAspectRatio="none"
        className="absolute right-[4%] bottom-[7%] h-[120px] w-[92%] opacity-85 sm:bottom-[10%] sm:h-[170px] lg:right-[3%] lg:bottom-[40%] lg:h-[44%] lg:w-[40%]"
      >
        {CANDLES.map((c) => {
          const x = 10 + c.i * 19.5;
          const bodyTop = 100 - Math.max(c.open, c.close);
          const bodyHeight = Math.max(2, Math.abs(c.close - c.open));
          return (
            <g
              key={c.i}
              className="await-reveal animate-candle-grow"
              style={{ '--i': c.i } as CSSProperties}
            >
              <line
                x1={x}
                x2={x}
                y1={100 - c.top}
                y2={100 - c.bottom}
                className={c.up ? 'stroke-gain-mark' : 'stroke-loss-mark'}
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={x - 5}
                y={bodyTop}
                width={10}
                height={bodyHeight}
                rx={1.5}
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
                className={
                  c.up
                    ? 'fill-ink stroke-gain-mark'
                    : 'fill-loss-mark stroke-loss-mark'
                }
              />
            </g>
          );
        })}
        <polyline
          points={CANDLES.map(
            (c) => `${10 + c.i * 19.5},${100 - c.close}`,
          ).join(' ')}
          className="await-reveal animate-line-draw fill-none stroke-gold"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ '--len': 1600, animationDelay: '900ms' } as CSSProperties}
        />
      </svg>
    </Reveal>
  );
}
