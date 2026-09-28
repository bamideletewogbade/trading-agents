import type { CSSProperties } from 'react';

/**
 * A small moving picture for each step of "How it works": a choice being
 * tapped, a chart playing out, a replay coming round again. Decoration
 * beside words that already say it all, so it's hidden from screen readers.
 * Each one waits for its card to scroll into view (`await-reveal`).
 */
export function StepArt({ step }: { step: 0 | 1 | 2 }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 72"
      className="h-[72px] w-full max-w-[220px] overflow-visible"
    >
      {step === 0 ? <Choose /> : step === 1 ? <PlayOut /> : <Again />}
    </svg>
  );
}

function Choose() {
  return (
    <>
      <rect
        x="4"
        y="18"
        width="70"
        height="34"
        rx="8"
        className="fill-gold-soft stroke-gold"
        strokeWidth="1.5"
      />
      <rect
        x="86"
        y="18"
        width="70"
        height="34"
        rx="8"
        className="fill-raised stroke-edge"
        strokeWidth="1.5"
      />
      {/* Up and down arrows, so the choice reads without colour. */}
      <path
        d="M39 42 V28 M33 34 L39 28 L45 34"
        className="fill-none stroke-gold"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M121 28 V42 M115 36 L121 42 L127 36"
        className="fill-none stroke-fg-2"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The tap: a ring breathing out where the finger lands. */}
      <circle
        cx="52"
        cy="46"
        r="9"
        className="await-reveal animate-ring-out fill-none stroke-gold"
        strokeWidth="1.5"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <circle cx="52" cy="46" r="4" className="fill-gold" />
    </>
  );
}

const PLAY = [34, 40, 30, 44, 38, 50, 46, 58, 54, 62];

function PlayOut() {
  return (
    <>
      <line
        x1="0"
        x2="160"
        y1="66"
        y2="66"
        className="stroke-line"
        strokeWidth="1"
      />
      {PLAY.map((level, i) => {
        const prev = PLAY[i - 1] ?? 30;
        const up = level >= prev;
        const top = 70 - Math.max(level, prev);
        return (
          <rect
            key={i}
            x={6 + i * 15}
            y={top}
            width="8"
            height={Math.max(3, Math.abs(level - prev))}
            rx="1.5"
            strokeWidth="1.5"
            className={`await-reveal animate-candle-in ${up ? 'fill-ink stroke-gain-mark' : 'fill-loss-mark stroke-loss-mark'}`}
            style={{ '--i': i * 6 } as CSSProperties}
          />
        );
      })}
      <polyline
        points={PLAY.map((level, i) => `${10 + i * 15},${70 - level}`).join(
          ' ',
        )}
        className="await-reveal animate-line-draw fill-none stroke-gold"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ '--len': 200, animationDelay: '500ms' } as CSSProperties}
      />
    </>
  );
}

function Again() {
  return (
    <>
      <g
        className="await-reveal animate-spin-slow"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <path
          d="M80 10 A26 26 0 1 1 55.5 27"
          className="fill-none stroke-gold"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M52 16 L55.5 27 L66 23"
          className="fill-none stroke-gold"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M70 37 L77 44 L91 30"
        className="await-reveal animate-line-draw fill-none stroke-gain-mark"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ '--len': 40, animationDelay: '600ms' } as CSSProperties}
      />
    </>
  );
}
