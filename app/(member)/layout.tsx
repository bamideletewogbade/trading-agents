import type { ReactNode } from 'react';
import Link from 'next/link';
import { AUTH } from '@/content/auth';
import { BRAND } from '@/lib/brand';
import { publishableKey } from '@/lib/auth/server';
import { AccountButton } from '@/components/auth/AccountButton';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Mark } from '@/components/marketing/Mark';

/**
 * Where people with (or without) an account go: sign-in, sign-up,
 * onboarding and the desk. Clerk loads only here, so the marketing pages
 * never wait on it.
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider publishableKey={publishableKey()}>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
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
      <main id="content" className="animate-page-in">
        {children}
      </main>
    </AuthProvider>
  );
}
