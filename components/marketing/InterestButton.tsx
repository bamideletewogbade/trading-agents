'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * "Count me in" for something that doesn't exist yet (the Floor, partner
 * access). It records a learning event, which is all a waitlist needs, so
 * there's no new table to migrate. When nothing can be stored (no database
 * on this deployment), it says so and offers an account instead of
 * pretending.
 */
export function InterestButton({
  type,
  label,
  done,
  fallback,
}: {
  type: 'community_interest' | 'partner_interest';
  label: string;
  done: string;
  fallback: string;
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'stored' | 'unsaved'>(
    'idle',
  );

  if (state === 'stored')
    return <p className="type-body font-semibold text-gold">✓ {done}</p>;
  if (state === 'unsaved')
    return (
      <Link
        href="/sign-up"
        className="inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
      >
        {fallback} →
      </Link>
    );

  return (
    <button
      type="button"
      disabled={state === 'sending'}
      onClick={async () => {
        setState('sending');
        try {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type, data: { from: location.pathname } }),
          });
          setState(response.status === 201 ? 'stored' : 'unsaved');
        } catch {
          setState('unsaved');
        }
      }}
      className="inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink disabled:opacity-60"
    >
      {label}
    </button>
  );
}
