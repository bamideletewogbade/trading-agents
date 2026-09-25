/**
 * Identifiers, for two audiences.
 *
 * Rows get a UUID nobody sees. Things a person reads aloud, types into
 * WhatsApp or sees on a receipt (a login code, a payment reference) get a
 * short code from an alphabet with nothing easily misread in it.
 *
 * Ported from Kanea Studio.
 */

export function newId(): string {
  return crypto.randomUUID();
}

/**
 * Crockford base32 minus everything that gets misread: no I, L or 1, no O or
 * 0, and no U (so no generated code spells anything rude, which matters on a
 * string that goes into someone's chat).
 */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let code = '';
  // 256 is not a multiple of 30, so the first 16 letters are very slightly
  // more likely. Fine for a reference; never use this for a secret key.
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

/** `K7Q2-9FXM`: the one-time code a learner sends to us on WhatsApp to sign in. */
export function newLoginCode(): string {
  const code = randomCode(8);
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
