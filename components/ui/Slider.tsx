'use client';

import { useId, type CSSProperties } from 'react';

/**
 * A number the learner sets by thumb (design brief §6).
 *
 * A native range input underneath, so keyboards, screen readers and every
 * Android browser already know how to drive it; styled to a 4 px track and a
 * 28 px thumb with a 48 px touch area. The − and + steppers are there for
 * precision (a thumb is not a precise instrument) and for anyone who can't
 * drag. The value above the track is large and tabular, and is whatever
 * `format` returns: the slider holds a plain integer, formatting belongs to
 * the caller, and any money in it comes from `lib/core/money`.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const filled = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="type-label text-fg-2">
          {label}
        </label>
        <output
          htmlFor={id}
          className="num type-title text-fg"
          aria-live="polite"
        >
          {format(value)}
        </output>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-edge bg-raised type-title text-fg disabled:opacity-40"
          aria-label={`Less ${label.toLowerCase()}`}
        >
          −
        </button>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={format(value)}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          className="slider h-12 w-full min-w-0 cursor-pointer appearance-none bg-transparent"
          style={{ '--filled': `${filled}%` } as CSSProperties}
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-edge bg-raised type-title text-fg disabled:opacity-40"
          aria-label={`More ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
