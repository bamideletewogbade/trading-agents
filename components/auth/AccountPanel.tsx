'use client';

import { Show, UserButton } from '@clerk/react';
import Link from 'next/link';
import { ME } from '@/content/member';
import { useAccountMode } from './AuthProvider';

/** The Me screen's account corner: Clerk's menu when signed in, a sign-up nudge otherwise. */
export function AccountPanel() {
  const mode = useAccountMode();
  const nudge = (
    <>
      <p className="type-small text-fg-2">{ME.account.guest}</p>
      {mode === 'clerk' ? (
        <Link
          href="/sign-up"
          className="btn-3d mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-gold px-4 type-body font-semibold text-ink"
        >
          {ME.account.create}
        </Link>
      ) : null}
    </>
  );
  if (mode === 'guest') return nudge;
  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">{nudge}</Show>
    </>
  );
}
