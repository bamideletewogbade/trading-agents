'use client';

import { useAuth } from '@clerk/react';
import { useEffect } from 'react';
import { registerTokenGetter } from '@/lib/client/session';

/** Lets lib/client/session.ts reach Clerk's token. Rendered only inside ClerkProvider. */
export function TokenBridge() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    registerTokenGetter(isSignedIn ? () => getToken() : null);
    return () => registerTokenGetter(null);
  }, [getToken, isSignedIn]);
  return null;
}
