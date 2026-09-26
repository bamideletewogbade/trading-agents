'use client';

/**
 * The signed-in session's token, for API calls, without every caller
 * needing Clerk's hooks. The bridge inside ClerkProvider registers the
 * getter; in guest mode there is none and calls go without a token.
 */

type Getter = () => Promise<string | null>;
let getter: Getter | null = null;

export function registerTokenGetter(next: Getter | null): void {
  getter = next;
}

export async function sessionHeaders(): Promise<Record<string, string>> {
  if (!getter) return {};
  try {
    const token = await getter();
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
