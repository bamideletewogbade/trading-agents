'use client';

import type { ReactNode } from 'react';

/**
 * Inputs and answers shared by the Tools and Journal screens. Numbers are
 * typed as text and parsed exactly by the engines (never `parseFloat`), so
 * 1.0854 stays 1.0854.
 */

export function Field({
  id,
  label,
  value,
  onChange,
  help,
  placeholder,
  mode = 'decimal',
  invalid = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  placeholder?: string;
  mode?: 'decimal' | 'text' | 'numeric';
  invalid?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block type-label text-fg-2">
        {label}
      </label>
      <input
        id={id}
        value={value}
        inputMode={mode === 'text' ? 'text' : mode}
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 block min-h-12 w-full rounded-md border bg-ink px-3 type-body text-fg outline-none placeholder:text-muted focus:border-gold ${mode === 'text' ? '' : 'font-mono num'} ${invalid ? 'border-loss' : 'border-line'}`}
      />
      {help ? (
        <p id={`${id}-help`} className="mt-1 type-tick text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function Answers({
  rows,
  empty,
}: {
  rows: readonly { label: string; value: string; strong?: boolean }[] | null;
  empty: string;
}) {
  if (!rows)
    return (
      <p className="rounded-lg border border-dashed border-edge p-4 type-small text-fg-2">
        {empty}
      </p>
    );
  return (
    <dl className="grid grid-cols-2 gap-2" aria-live="polite">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`min-w-0 rounded-lg border p-3 ${row.strong ? 'col-span-2 border-gold bg-gold-soft' : 'border-line bg-ink/40'}`}
        >
          <dt className="font-mono type-tick text-muted uppercase">
            {row.label}
          </dt>
          <dd
            className={`mt-1 break-words font-mono font-semibold text-fg num ${row.strong ? 'type-title' : 'type-body'}`}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Note({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn';
  children: ReactNode;
}) {
  return (
    <p
      className={`rounded-md border p-3 type-small ${tone === 'warn' ? 'border-loss text-fg' : 'border-line text-fg-2'}`}
    >
      {tone === 'warn' ? (
        <span aria-hidden className="mr-1.5 font-bold text-loss">
          !
        </span>
      ) : null}
      {children}
    </p>
  );
}
