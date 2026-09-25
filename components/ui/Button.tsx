import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Buttons (design brief §6). Three kinds, one of them gold:
 *
 * - `primary`: the one thing to do next. Gold, full width on phones, in the
 *   bottom third of the screen. Never more than one per screen.
 * - `secondary`: other things to do. Raised, with a visible edge.
 * - `quiet`: "Skip", "Not now". Words only.
 *
 * A disabled button always comes with `reason`, a line saying why it can't be
 * pressed yet, because a greyed-out button on its own reads as broken.
 */

type Kind = 'primary' | 'secondary' | 'quiet';

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 type-body font-semibold transition-[transform,filter,background-color] duration-(--duration-fast) ease-out active:scale-[0.98] select-none';

const KINDS: Record<Kind, string> = {
  primary: 'bg-gold text-ink hover:brightness-110 active:brightness-90',
  secondary: 'bg-raised text-fg border border-edge hover:bg-line',
  quiet: 'text-fg-2 hover:text-fg underline-offset-4 hover:underline',
};

function classes(kind: Kind, block: boolean, extra?: string): string {
  return [BASE, KINDS[kind], block ? 'w-full' : '', extra ?? ''].join(' ');
}

export function Button({
  kind = 'secondary',
  block = false,
  reason,
  className,
  children,
  ...props
}: ComponentProps<'button'> & {
  kind?: Kind;
  block?: boolean;
  reason?: string;
  children: ReactNode;
}) {
  const button = (
    <button
      type="button"
      className={`${classes(kind, block, className)} disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100`}
      {...props}
    >
      {children}
    </button>
  );
  if (!props.disabled || !reason) return button;
  return (
    <div className={block ? 'w-full' : ''}>
      {button}
      <p className="mt-2 type-small text-muted">{reason}</p>
    </div>
  );
}

export function ButtonLink({
  kind = 'secondary',
  block = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  kind?: Kind;
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <Link className={classes(kind, block, className)} {...props}>
      {children}
    </Link>
  );
}
