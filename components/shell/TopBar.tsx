import type { ReactNode } from 'react';

/**
 * A screen's title on the left and at most one action on the right (design
 * brief §6). No hamburger: everything a learner needs is one of the five tabs.
 */
export function TopBar({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-3 pt-[env(safe-area-inset-top)]">
      <h1 className="type-title text-fg">{title}</h1>
      {action}
    </header>
  );
}
