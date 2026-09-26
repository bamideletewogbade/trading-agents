'use client';

import type { Placement, Profile } from '@/lib/onboarding/flow';
import { placement } from '@/lib/onboarding/flow';
import { sessionHeaders } from './session';

/**
 * The learner's onboarding profile, in the browser. The server's copy wins
 * when there is one (it follows the account across phones); the phone's
 * copy keeps a guest's answers when there's no database or no network.
 * Every read and write of storage is wrapped: a private tab must not break
 * onboarding.
 */

const KEY = 'sika:profile';

export type Saved = {
  profile: Profile;
  placement: Placement;
  where: 'server' | 'device';
};

function readLocal(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function writeLocal(profile: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Storage blocked: the server copy (if any) still stands.
  }
}

export async function saveProfile(profile: Profile): Promise<Saved> {
  writeLocal(profile);
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
      headers: {
        'content-type': 'application/json',
        ...(await sessionHeaders()),
      },
      body: JSON.stringify({ profile }),
    });
    if (response.status === 201) {
      const stored = (await response.json()) as {
        profile: Profile;
        placement: Placement;
      };
      return { ...stored, where: 'server' };
    }
  } catch {
    // Offline: fall through to the phone's copy.
  }
  return { profile, placement: placement(profile), where: 'device' };
}

export async function loadProfile(): Promise<Saved | null> {
  try {
    // A slow or unreachable server must not leave the desk loading forever.
    const response = await fetch('/api/profile', {
      headers: await sessionHeaders(),
      signal: AbortSignal.timeout(6_000),
    });
    if (response.status === 200) {
      const stored = (await response.json()) as
        | { profile: Profile; placement: Placement }
        | { profile: null };
      if (stored.profile) {
        writeLocal(stored.profile);
        return {
          ...(stored as { profile: Profile; placement: Placement }),
          where: 'server',
        };
      }
    }
  } catch {
    // Offline: use the phone's copy.
  }
  const local = readLocal();
  return local
    ? { profile: local, placement: placement(local), where: 'device' }
    : null;
}
