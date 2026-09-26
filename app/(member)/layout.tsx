import type { ReactNode } from 'react';
import { publishableKey } from '@/lib/auth/server';
import { AuthProvider } from '@/components/auth/AuthProvider';

/**
 * Where people with (or without) an account go. Clerk loads only here, so
 * the marketing pages never wait on it. Each group inside draws its own
 * frame: (tabs) for the path, library and profile, (focus) for sign-in and
 * onboarding, and the lesson player full screen with nothing around it.
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider publishableKey={publishableKey()}>
      <main id="content">{children}</main>
    </AuthProvider>
  );
}
