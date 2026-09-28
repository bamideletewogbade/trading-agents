'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { inCare } from '@/lib/client/notes';

/**
 * Care comes first (docs/member-app-plan.md §4.3): for a week after the
 * support card showed on this device, signals and anything that sells stay
 * out of sight. The server knows nothing of it, so the first paint shows the
 * children and a flagged device swaps them for the fallback at once.
 */

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

export function useInCare(): boolean {
  return useSyncExternalStore(subscribe, inCare, () => false);
}

export function CareGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useInCare() ? fallback : children;
}
