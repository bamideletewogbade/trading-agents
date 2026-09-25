/**
 * Mobile numbers: one normal form per person, whatever way it was typed.
 *
 * The phone number is the learner's identity (plan §10.2, stage W0). There
 * are no passwords: you continue on WhatsApp, and later you pay from the same
 * number. So every way in (the web, a WhatsApp webhook, a Paystack payment)
 * must produce the same string for the same person, or one learner becomes
 * three with no shared progress.
 *
 * Normal form is E.164 with no spaces: `+233244123456`.
 *
 * Ghana's rules are ported from Kanea Studio; Nigeria and Kenya are new.
 *
 * Pure: `pnpm check` runs this file under plain Node.
 */

import { COUNTRIES, type CountryCode } from './country.ts';

/** What a mobile number looks like after the country code, per country. */
const NATIONAL: Record<CountryCode, RegExp> = {
  // 02x and 05x mobile ranges.
  GH: /^[25]\d{8}$/,
  // 070, 080, 081, 090, 091 ranges.
  NG: /^[789][01]\d{8}$/,
  // 07xx and the newer 01xx ranges.
  KE: /^(7\d{8}|1[01]\d{7})$/,
};

export type Phone = { e164: string; country: CountryCode };

/**
 * Any way a mobile number gets typed, reduced to E.164, or null.
 *
 * A number with its country code identifies its own country. A local number
 * (`0244 123 456`) is read in `fallback`, the learner's chosen country.
 * Landlines are refused: they cannot hold WhatsApp or mobile money, which are
 * the only two things this number is for.
 */
export function normalisePhone(
  input: string,
  fallback: CountryCode,
): Phone | null {
  const cleaned = input.trim().replace(/[\s()\-.]/g, '');
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/^\+/, '').replace(/^00/, '');
  if (!/^\d+$/.test(digits)) return null;

  for (const country of Object.values(COUNTRIES)) {
    if (
      digits.startsWith(country.dialCode) &&
      digits.length === country.dialCode.length + country.nationalLength
    ) {
      const national = digits.slice(country.dialCode.length);
      return NATIONAL[country.code].test(national)
        ? { e164: `+${digits}`, country: country.code }
        : null;
    }
  }
  if (hasPlus) return null;

  const local = COUNTRIES[fallback];
  let national: string;
  if (digits.startsWith('0') && digits.length === local.nationalLength + 1)
    national = digits.slice(1);
  else if (digits.length === local.nationalLength) national = digits;
  else return null;

  return NATIONAL[fallback].test(national)
    ? { e164: `+${local.dialCode}${national}`, country: fallback }
    : null;
}

/**
 * Mobile-money networks by Paystack provider code. `vod` is Telecel (Vodafone
 * Ghana rebranded in 2023) and Paystack still takes `vod` and rejects
 * `telecel`, so do not "fix" the mismatch. `mpesa` is Kenya.
 */
export type MomoProvider = 'mtn' | 'vod' | 'atl' | 'mpesa';

export const MOMO_LABELS: Record<MomoProvider, string> = {
  mtn: 'MTN MoMo',
  vod: 'Telecel Cash',
  atl: 'AirtelTigo Money',
  mpesa: 'M-Pesa',
};

const GHANA_PREFIXES: Record<'mtn' | 'vod' | 'atl', readonly string[]> = {
  mtn: ['024', '025', '053', '054', '055', '059'],
  vod: ['020', '050'],
  atl: ['026', '027', '056', '057'],
};

/**
 * A guess, never a decision. Ghana has had number portability since 2011, so
 * a pay screen pre-selects this network and keeps the others one tap away.
 * Kenya is always M-Pesa until Airtel Money is added.
 */
export function guessMomoProvider(phone: Phone): MomoProvider | null {
  if (phone.country === 'KE') return 'mpesa';
  if (phone.country !== 'GH') return null;
  const prefix = `0${phone.e164.slice(4, 6)}`;
  for (const [provider, prefixes] of Object.entries(GHANA_PREFIXES))
    if (prefixes.includes(prefix)) return provider as MomoProvider;
  return null;
}

/**
 * For reading back to a person, the way the number is written locally:
 * `024 412 3456` · `0803 123 4567` · `0712 345 678`.
 */
export function formatPhone(phone: Phone): string {
  const national = phone.e164.slice(
    COUNTRIES[phone.country].dialCode.length + 1,
  );
  const local = `0${national}`;
  switch (phone.country) {
    case 'GH':
      return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    case 'NG':
    case 'KE':
      return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
}

/** `+233244123456` → `233244123456`, the form a wa.me link wants. */
export function waDigits(phone: Phone): string {
  return phone.e164.slice(1);
}
