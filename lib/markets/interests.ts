/**
 * From what someone said they're curious about (onboarding's markets
 * question) to the markets signals can read. Onboarding asks in broad
 * families, "crypto" or "forex", because that's how people talk; signals
 * read single markets. Local and US stocks have no feed yet
 * (docs/member-app-plan.md §4.4), so they map to nothing rather than to a
 * stand-in.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import type { Market as Interest } from '../onboarding/flow.ts';
import { MARKETS, type MarketClass } from './catalog.ts';

const FAMILY: Record<Interest, MarketClass | null> = {
  crypto: 'crypto',
  forex: 'fx',
  commodities: 'metal',
  local: null,
  us: null,
};

/**
 * The signal markets that match these interests, in catalog order. An empty
 * list means "not chosen": the feed shows every market.
 */
export function marketsFor(interests: readonly Interest[]): string[] {
  const families = new Set(
    interests.map((interest) => FAMILY[interest]).filter(Boolean),
  );
  return MARKETS.filter((m) => families.has(m.class)).map((m) => m.id);
}

/** Interests we'd like to read but can't yet: said back honestly on the signals screen. */
export function unreadInterests(interests: readonly Interest[]): Interest[] {
  return interests.filter((interest) => FAMILY[interest] === null);
}

/** A saved choice, cleaned: known ids only, each once, in catalog order. */
export function cleanChoice(ids: readonly unknown[]): string[] {
  const wanted = new Set(ids.filter((id) => typeof id === 'string'));
  return MARKETS.filter((m) => wanted.has(m.id)).map((m) => m.id);
}
