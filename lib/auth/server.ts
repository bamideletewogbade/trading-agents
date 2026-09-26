/**
 * Who is signed in, for the server. Clerk verifies the session; this file
 * only asks. Every route that cares calls `signedInUser(request)` and gets a
 * Clerk user id or null, whether or not Clerk is configured, so a
 * deployment without accounts degrades to guests instead of breaking
 * (lib/capabilities.ts).
 */

import { createClerkClient } from '@clerk/backend';
import { capabilities } from '../capabilities';
import { siteUrl } from '../brand';

/** The publishable key is public by design; the page hands it to the browser. */
export function publishableKey(): string | null {
  return capabilities().auth
    ? (process.env.CLERK_PUBLISHABLE_KEY?.trim() ?? null)
    : null;
}

export async function signedInUser(request: Request): Promise<string | null> {
  if (!capabilities().auth) return null;
  try {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    });
    const state = await clerk.authenticateRequest(request, {
      authorizedParties: [siteUrl(), 'http://localhost:5177'],
    });
    return state.isAuthenticated ? state.toAuth().userId : null;
  } catch (error) {
    // A Clerk outage must not take the lessons down with it: the learner
    // carries on as a guest, and the log says why.
    console.error('[auth] could not verify the session', error);
    return null;
  }
}
