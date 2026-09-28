/**
 * The name, in one place.
 *
 * "Sika Lab" is a working name: *sika* is Twi for money, and a lab is where
 * you try things (spec §66). Renaming is an edit to this file, and every
 * title, share card and WhatsApp line follows. Candidates and the trademark
 * check still to do are in the implementation plan, appendix A.
 */

export const BRAND = {
  name: 'Chartward',
  short: 'Chartward',
  meaning: 'Read the market. Rehearse the decision.',
  promise: 'Read the market. Rehearse the decision.',
  description:
    'Understand prices, read charts, and practise market decisions through interactive lessons. Start with the basics and build your skills with simulated money.',
} as const;

export function siteUrl(): string {
  return process.env.SITE_URL || 'http://localhost:5177';
}

/**
 * The product's WhatsApp number, E.164 without the plus (`233XXXXXXXXX`).
 *
 * **Null until a dedicated number is set up** (plan §18, decision 3). Every
 * WhatsApp button hides itself while this is null, rather than linking to
 * nobody. A constant, not an environment variable: it is printed on public
 * pages anyway, and a constant keeps those pages static.
 */
export const WHATSAPP_DIGITS: string | null = null;

export function whatsAppLink(text: string): string | null {
  return WHATSAPP_DIGITS
    ? `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(text)}`
    : null;
}
