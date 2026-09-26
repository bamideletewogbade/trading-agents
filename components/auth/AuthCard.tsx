'use client';

import Link from 'next/link';
import { SignIn, SignUp } from '@clerk/react';
import { AUTH } from '@/content/auth';
import { useAccountMode } from './AuthProvider';

/**
 * The sign-in or sign-up form: Clerk's, in our colours, when accounts are
 * on; otherwise an honest note and a way to carry on as a guest. Hash
 * routing keeps Clerk's multi-step flow inside this one page, so no
 * catch-all routes are needed.
 */
export function AuthCard({ kind }: { kind: 'sign-in' | 'sign-up' }) {
  const mode = useAccountMode();
  if (mode === 'clerk')
    return kind === 'sign-in' ? (
      <SignIn routing="hash" signUpUrl="/sign-up" fallbackRedirectUrl="/desk" />
    ) : (
      <SignUp
        routing="hash"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
      />
    );

  return (
    <div className="w-full max-w-[400px] rounded-lg border border-line bg-panel p-6">
      <p className="font-mono type-label text-gold">{AUTH.bar.guest}</p>
      <h2 className="mt-2 type-title text-fg">{AUTH.guest.title}</h2>
      <p className="mt-2 type-small text-fg-2">{AUTH.guest.body}</p>
      <Link
        href="/onboarding"
        className="mt-6 flex min-h-12 items-center justify-center rounded-md bg-gold px-5 type-body font-semibold text-ink"
      >
        {AUTH.guest.cta}
      </Link>
      <Link
        href="/"
        className="mt-2 flex min-h-12 items-center justify-center type-small text-fg-2 hover:text-fg"
      >
        {AUTH.guest.back}
      </Link>
    </div>
  );
}
