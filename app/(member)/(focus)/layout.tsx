import type { ReactNode } from 'react';
import Link from 'next/link';
import { AUTH } from '@/content/auth';
import { BRAND } from '@/lib/brand';
import { AccountButton } from '@/components/auth/AccountButton';
import { Mark } from '@/components/marketing/Mark';

/** Sign-in, sign-up and the starting chat: one thing on screen, a way home. */
export default function FocusLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={BRAND.name}
          >
            <Mark />
            <span className="type-heading text-fg">{BRAND.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/desk"
              className="inline-flex min-h-11 items-center rounded-md px-3 type-small font-semibold text-fg-2 hover:text-fg"
            >
              {AUTH.bar.desk}
            </Link>
            <AccountButton />
          </div>
        </div>
      </header>
      <div className="animate-page-in">{children}</div>
    </>
  );
}
