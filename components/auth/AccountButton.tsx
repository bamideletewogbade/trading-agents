'use client';

import { Show, UserButton } from '@clerk/react';
import Link from 'next/link';
import { AUTH } from '@/content/auth';
import { MARKETING } from '@/content/marketing';
import { useAccountMode } from './AuthProvider';

/** The account corner of the member bar: Clerk's menu, or a guest chip. */
export function AccountButton() {
  const mode = useAccountMode();
  if (mode === 'guest')
    return (
      <span className="rounded-full border border-edge px-3 py-1 font-mono type-tick text-fg-2 uppercase">
        {AUTH.bar.guest}
      </span>
    );
  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-md px-3 type-small font-semibold text-fg-2 hover:text-fg"
        >
          {MARKETING.nav.signIn}
        </Link>
      </Show>
    </>
  );
}
