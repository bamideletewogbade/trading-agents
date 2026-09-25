import type { ReactNode } from 'react';

/**
 * A card (design brief §6): panel surface, 8 px radius, a hairline, 16 px in.
 * No shadow: on a dark screen depth comes from the surface step, not a blur.
 */
export function Card({
  title,
  aside,
  children,
  className,
  as: Tag = 'section',
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'li' | 'article';
}) {
  return (
    <Tag
      className={`rounded-md border border-line bg-panel p-4 ${className ?? ''}`}
    >
      {title || aside ? (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="type-label text-fg-2">{title}</h2> : <span />}
          {aside}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
