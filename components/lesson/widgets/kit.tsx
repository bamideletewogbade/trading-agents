'use client';

import { useRef, type ReactNode } from 'react';
import type { WidgetProps } from '@/lib/lessons/types';

/** What every widget receives from the player. */
export type WidgetComponentProps = {
  props?: WidgetProps;
  /** Call once the learner has done the widget's one thing; unlocks Continue. */
  onDone: () => void;
};

/** `onDone`, but only the first time: widgets can call it freely. */
export function useDone(onDone: () => void): () => void {
  const fired = useRef(false);
  return () => {
    if (fired.current) return;
    fired.current = true;
    onDone();
  };
}

export function Stat({
  label,
  value,
  tone = 'fg',
}: {
  label: string;
  value: ReactNode;
  tone?: 'fg' | 'gold' | 'gain' | 'loss';
}) {
  const color = {
    fg: 'text-fg',
    gold: 'text-gold',
    gain: 'text-gain',
    loss: 'text-loss',
  }[tone];
  return (
    <div className="rounded-md bg-raised px-3 py-2.5">
      <p className="font-mono type-tick text-muted">{label}</p>
      <p className={`mt-0.5 font-mono type-heading num ${color}`}>{value}</p>
    </div>
  );
}

/** A row of options, one chosen; native radios so arrows and screen readers work. */
export function Choices<T extends string | number>({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-2 text-center type-small font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${value === option.value ? 'border-gold bg-gold-soft text-gold' : 'border-edge bg-raised text-fg'}`}
          >
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A labelled range slider in the design system's style. */
export function Slider({
  label,
  shown,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  shown: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <span className="flex items-baseline justify-between gap-2">
        <span className="type-label text-fg-2">{label}</span>
        <span className="font-mono type-small font-semibold text-gold num">
          {shown}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider mt-1 h-12 w-full cursor-pointer appearance-none bg-transparent"
        style={{
          ['--filled' as string]: `${((value - min) / (max - min)) * 100}%`,
        }}
      />
    </div>
  );
}

export function Button({
  children,
  onClick,
  kind = 'primary',
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  kind?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-12 w-full rounded-md px-4 type-small font-semibold active:scale-[0.98] disabled:opacity-40 ${kind === 'primary' ? 'bg-gold text-ink' : 'border border-edge bg-raised text-fg'}`}
    >
      {children}
    </button>
  );
}
