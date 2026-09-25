/**
 * The countries we teach in, and what changes between them.
 *
 * Spec §22–23: "African users" do not share one financial reality. Currency
 * is the smallest part of it; this file holds the parts code needs (money,
 * phone numbers, how people pay us), and `content/` holds the rest (personas,
 * events, words).
 *
 * `status` is the launch order from the plan: Ghana first, then Nigeria, then
 * Kenya. A country that is not `launch` can still be chosen on the first
 * screen; it gets its own currency and a note that local scenarios are coming.
 *
 * Pure: `pnpm check` runs this file under plain Node.
 */

import type { Currency } from './money.ts';

export type CountryCode = 'GH' | 'NG' | 'KE';

export type Country = {
  code: CountryCode;
  name: string;
  flag: string;
  currency: Currency;
  /** Without the plus: `233`. */
  dialCode: string;
  /** Digits after the country code in a mobile number. */
  nationalLength: number;
  status: 'launch' | 'next' | 'later';
  /** How a learner here pays for a pass. See implementation plan §9.2. */
  payRail: 'mobile_money' | 'bank_transfer';
  /** BCP 47 tag for `<html lang>` and speech. */
  locale: string;
};

export const COUNTRIES: Record<CountryCode, Country> = {
  GH: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    dialCode: '233',
    nationalLength: 9,
    status: 'launch',
    payRail: 'mobile_money',
    locale: 'en-GH',
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    dialCode: '234',
    nationalLength: 10,
    status: 'next',
    payRail: 'bank_transfer',
    locale: 'en-NG',
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    dialCode: '254',
    nationalLength: 9,
    status: 'later',
    payRail: 'mobile_money',
    locale: 'en-KE',
  },
};

/** The order countries are offered on the first screen. */
export const COUNTRY_ORDER: readonly CountryCode[] = ['GH', 'NG', 'KE'];

export const DEFAULT_COUNTRY: CountryCode = 'GH';

export function isCountryCode(value: string): value is CountryCode {
  return Object.hasOwn(COUNTRIES, value);
}

/**
 * A guess from Cloudflare's `request.cf.country` (or any ISO code). Only a
 * guess: the first screen shows it pre-selected and one tap away from the
 * others, because a Ghanaian on a Lagos trip is still learning in cedis.
 */
export function guessCountry(isoCode: string | null | undefined): CountryCode {
  const upper = (isoCode ?? '').trim().toUpperCase();
  return isCountryCode(upper) ? upper : DEFAULT_COUNTRY;
}
