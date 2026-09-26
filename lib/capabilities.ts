/**
 * What this deployment can actually do, asked in one place.
 *
 * Every page and route that depends on a service asks here instead of reading
 * the environment itself, so "what happens when X is not configured" has one
 * answer per X and the product degrades instead of breaking (plan §3):
 *
 * - No database: the first 3 minutes still work, anonymously, and nothing is
 *   saved.
 * - No OpenRouter credit: no Jev and no generated coach turns. The coach
 *   speaks only authored lines; the simulations do not notice.
 * - No Clerk keys: no accounts. Sign-in pages say so, and onboarding and
 *   lessons work as a guest, remembered on the device.
 * - No Paystack: Pro is shown as coming soon.
 * - No WhatsApp Cloud API: "Continue on WhatsApp" becomes a plain wa.me link,
 *   or disappears while there is no number (`lib/brand.ts`).
 *
 * `OPENROUTER_HAS_CREDIT` is a flag a person sets, not something detected.
 * The Decisions API answers 402 on a trial balance, no endpoint reports the
 * balance cheaply, and guessing wrong means every Jev gate fails at once.
 * (Found on the Bishop platform, 20 Sep 2026, and again on Kanea.)
 */

import { WHATSAPP_DIGITS } from './brand';

export type Capabilities = {
  database: boolean;
  /** Accounts through Clerk. Without it, everyone learns as a guest on their device. */
  auth: boolean;
  /** Jev, through OpenRouter's Decisions API. */
  jev: boolean;
  /** Generated coach turns and voice, through OpenRouter chat and audio. */
  coach: boolean;
  payments: boolean;
  /** The Cloud API is wired: webhooks in, messages out. */
  whatsappApi: boolean;
  /** A number exists to link to, API or not. */
  whatsappNumber: boolean;
};

function set(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function capabilities(): Capabilities {
  const credit =
    set('OPENROUTER_API_KEY') && process.env.OPENROUTER_HAS_CREDIT === 'true';
  return {
    database: set('DATABASE_URL'),
    auth: set('CLERK_PUBLISHABLE_KEY') && set('CLERK_SECRET_KEY'),
    jev: credit,
    coach: credit,
    payments: set('PAYSTACK_SECRET_KEY'),
    whatsappApi:
      set('WHATSAPP_ACCESS_TOKEN') &&
      set('WHATSAPP_APP_SECRET') &&
      set('WHATSAPP_PHONE_NUMBER_ID'),
    whatsappNumber: WHATSAPP_DIGITS !== null,
  };
}
