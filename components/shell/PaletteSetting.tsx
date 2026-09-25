'use client';

import { useSyncExternalStore } from 'react';
import { Segmented } from '@/components/ui/Segmented';

/**
 * Progress › Settings › Gain and loss colours (design brief §3).
 *
 * Kept on the device, not the account: it's about this screen and these
 * eyes, and it has to apply before sign-in and before first paint. The
 * inline script in app/layout.tsx reads the same key and sets
 * `data-palette` on <html>.
 *
 * That attribute is the one source of truth, so the control reads it as an
 * external store: React renders "standard" on the server and during
 * hydration, then switches to whatever the page already painted with. No
 * state is copied into React, so the two can't disagree.
 */

export const PALETTE_KEY = 'sika:palette';

type Palette = 'standard' | 'blue-orange';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-palette'],
  });
  return () => observer.disconnect();
}

function readPalette(): Palette {
  return document.documentElement.dataset.palette === 'blue-orange'
    ? 'blue-orange'
    : 'standard';
}

function choose(next: Palette): void {
  if (next === 'blue-orange')
    document.documentElement.dataset.palette = 'blue-orange';
  else delete document.documentElement.dataset.palette;
  try {
    localStorage.setItem(PALETTE_KEY, next);
  } catch {
    // Private mode or storage switched off: the choice holds until reload.
  }
}

export function PaletteSetting({
  label,
  standard,
  blueOrange,
  help,
}: {
  label: string;
  standard: string;
  blueOrange: string;
  help: string;
}) {
  const palette = useSyncExternalStore(
    subscribe,
    readPalette,
    () => 'standard' as const,
  );

  return (
    <div>
      <Segmented
        name="palette"
        label={label}
        value={palette}
        onChange={choose}
        options={[
          { value: 'standard', label: standard },
          { value: 'blue-orange', label: blueOrange },
        ]}
      />
      <p className="mt-2 type-small text-muted">{help}</p>
    </div>
  );
}
