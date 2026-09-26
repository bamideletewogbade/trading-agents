'use client';

import { ClerkProvider } from '@clerk/react';
import { createContext, useContext, type ReactNode } from 'react';
import { TokenBridge } from './TokenBridge';

/**
 * Accounts, when this deployment has them. The publishable key comes from
 * the server at request time (lib/auth/server.ts), not from the build, so
 * turning accounts on is a dashboard variable, not a redeploy of code.
 *
 * Without a key everything below still renders: `useAccountMode()` says
 * 'guest', and components that would show Clerk's UI show a guest version.
 * Nothing calls a Clerk hook outside ClerkProvider.
 */

type Mode = 'clerk' | 'guest';
const ModeContext = createContext<Mode>('guest');

export function useAccountMode(): Mode {
  return useContext(ModeContext);
}

/** Clerk's components drawn in our colours (app/globals.css), dark only. */
const APPEARANCE = {
  variables: {
    colorPrimary: '#ebae3f',
    colorPrimaryForeground: '#0a0c10',
    colorBackground: '#12161c',
    colorForeground: '#e9edf2',
    colorMutedForeground: '#aeb6c2',
    colorMuted: '#1a1f27',
    colorInput: '#1a1f27',
    colorInputForeground: '#e9edf2',
    colorBorder: '#65707f',
    colorNeutral: '#e9edf2',
    colorDanger: '#f2735f',
    colorSuccess: '#2bc4a0',
    colorRing: '#ebae3f',
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
    borderRadius: '8px',
  },
};

export function AuthProvider({
  publishableKey,
  children,
}: {
  publishableKey: string | null;
  children: ReactNode;
}) {
  if (!publishableKey)
    return (
      <ModeContext.Provider value="guest">{children}</ModeContext.Provider>
    );
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={APPEARANCE}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/desk"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignOutUrl="/"
    >
      <TokenBridge />
      <ModeContext.Provider value="clerk">{children}</ModeContext.Provider>
    </ClerkProvider>
  );
}
