import type { ReactNode } from 'react';

/**
 * A number with its name (design brief §6). The value is already formatted:
 * it comes from an engine through `lib/core/money`, never from a component.
 */
export function Stat({
  label,
  value,
  delta,
  hero = false,
}: {
  label: string;
  value: string;
  delta?: ReactNode;
  /** The number that just changed: the biggest thing on the screen. */
  hero?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="type-label text-muted">{label}</p>
      <p
        className={`mt-1 num text-fg ${hero ? 'type-hero' : 'type-display'} break-words`}
      >
        {value}
      </p>
      {delta ? <div className="mt-1">{delta}</div> : null}
    </div>
  );
}
