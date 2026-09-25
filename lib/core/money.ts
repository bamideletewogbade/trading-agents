/**
 * Money, as integers, in more than one currency.
 *
 * Every amount is a whole number of the currency's **minor unit** (pesewas,
 * kobo, cents) carried with its currency code, so GH₵ 1,000 is
 * `{ minor: 100000, currency: 'GHS' }`. No float crosses a boundary: GH₵ 0.10
 * plus GH₵ 0.20 is not GH₵ 0.30 in IEEE 754, and a simulation whose balance is
 * a pesewa off teaches the learner to distrust the whole screen.
 *
 * Two more units live here because the product really uses them:
 *
 * - **Basis points** for every percentage and rate (1% = 100 bp). A 3% move is
 *   `-300`, leverage stays a plain integer multiple.
 * - **Micro-dollars** for what the AI costs us (1 USD = 1,000,000). A Jev call
 *   at $0.00004 is the integer 40.
 *
 * Ported from Kanea Studio's `money.ts` (itself from the Derrick store) and
 * widened from cedis-only to the countries in `country.ts`.
 *
 * Pure: `pnpm check` runs this file under plain Node.
 */

export const CURRENCIES = {
  GHS: { symbol: 'GH₵', spaced: false, name: 'Ghana cedi', minorPerMajor: 100 },
  NGN: {
    symbol: '₦',
    spaced: false,
    name: 'Nigerian naira',
    minorPerMajor: 100,
  },
  KES: {
    symbol: 'KSh',
    spaced: true,
    name: 'Kenyan shilling',
    minorPerMajor: 100,
  },
  USD: { symbol: '$', spaced: false, name: 'US dollar', minorPerMajor: 100 },
} as const;

export type Currency = keyof typeof CURRENCIES;

export type Money = { readonly minor: number; readonly currency: Currency };

export const BP_PER_WHOLE = 10_000;
export const MICROS_PER_DOLLAR = 1_000_000;

/**
 * The largest amount any simulation may hold: ten trillion major units.
 * Large enough for "GH₵ 300 doubling every month for two years" (about GH₵ 5
 * billion), small enough that minor units stay safe integers.
 */
export const MAX_MINOR = 10_000_000_000_000 * 100;

export function isCurrency(value: string): value is Currency {
  return Object.hasOwn(CURRENCIES, value);
}

function assertMinor(minor: number): number {
  if (!Number.isSafeInteger(minor) || Math.abs(minor) > MAX_MINOR)
    throw new RangeError(`Not a valid minor amount: ${minor}`);
  return minor;
}

/** Whole or decimal major units to Money: `money(1000, 'GHS')`. */
export function money(major: number, currency: Currency): Money {
  const minor = Math.round(major * CURRENCIES[currency].minorPerMajor);
  return { minor: assertMinor(minor), currency };
}

export function fromMinor(minor: number, currency: Currency): Money {
  return { minor: assertMinor(minor), currency };
}

function same(a: Money, b: Money): void {
  if (a.currency !== b.currency)
    throw new TypeError(`Cannot combine ${a.currency} with ${b.currency}.`);
}

export function add(a: Money, b: Money): Money {
  same(a, b);
  return fromMinor(a.minor + b.minor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  same(a, b);
  return fromMinor(a.minor - b.minor, a.currency);
}

/** An integer multiple: a position at 20× leverage is `times(capital, 20)`. */
export function times(a: Money, factor: number): Money {
  if (!Number.isSafeInteger(factor))
    throw new RangeError(`Not an integer factor: ${factor}`);
  return fromMinor(a.minor * factor, a.currency);
}

/**
 * `a × b ÷ c` on integers, exactly, rounding half away from zero.
 *
 * BigInt because the product of an amount and a rate can pass 2^53 long
 * before either input does, and a silently rounded product is exactly the
 * float error this file exists to prevent.
 */
export function mulDiv(a: number, b: number, c: number): number {
  if (c === 0) throw new RangeError('Division by zero.');
  const numerator = BigInt(a) * BigInt(b);
  const divisor = BigInt(c);
  const negative = numerator < 0n !== divisor < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = divisor < 0n ? -divisor : divisor;
  const quotient = (n * 2n + d) / (d * 2n);
  return Number(negative ? -quotient : quotient);
}

/** Apply a rate in basis points: 3% of GH₵ 1,000 is `ofBp(money(1000), 300)`. */
export function ofBp(amount: Money, bp: number): Money {
  return fromMinor(mulDiv(amount.minor, bp, BP_PER_WHOLE), amount.currency);
}

/** What share of `whole` is `part`, in basis points, rounded half away from zero. */
export function shareBp(part: Money, whole: Money): number {
  same(part, whole);
  if (whole.minor === 0) throw new RangeError('Share of zero.');
  return mulDiv(part.minor, BP_PER_WHOLE, whole.minor);
}

/** `12.5` → `1250`. For writing rates in content files as percentages. */
export function percentToBp(percent: number): number {
  const bp = Math.round(percent * 100);
  if (!Number.isSafeInteger(bp))
    throw new RangeError(`Not a valid percentage: ${percent}`);
  return bp;
}

/** Dollars to micro-dollars, rounding to the nearest micro. */
export function usdMicros(dollars: number): number {
  return Math.round(dollars * MICROS_PER_DOLLAR);
}

/**
 * Parse an amount the way people type it: `1000`, `1,250.50`, `GH₵ 85`,
 * `₦2,500`, `KSh 250`, `GHS 49`. Returns null rather than guessing. More than
 * two decimal places is refused, not rounded, because `12.005` is a typo worth
 * showing back to the person.
 */
export function parseMoney(input: string, currency: Currency): Money | null {
  const prefixes: Record<Currency, RegExp> = {
    GHS: /^(GHS|GH₵|GH¢|₵|¢|GH\s*cedis?|cedis?)\s*/i,
    NGN: /^(NGN|₦|N(?=\d)|naira)\s*/i,
    KES: /^(KES|KSh|Ksh|shillings?)\s*/i,
    USD: /^(USD|US\$|\$)\s*/i,
  };
  const cleaned = input
    .trim()
    .replace(prefixes[currency], '')
    .replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const minor =
    Number(match[1]) * 100 + Number((match[2] ?? '0').padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR) return null;
  return { minor, currency };
}

function group(whole: number): string {
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * `{ 125050, GHS }` → `GH₵1,250.50`; `{ 100000, GHS }` → `GH₵1,000`;
 * `{ -6000, USD }` → `−$60`; `{ 25000, KES }` → `KSh 250`.
 *
 * Whole amounts drop the `.00`; anything with a minor part shows both digits.
 * The symbol and the grouping are written out here rather than left to
 * `Intl`, which renders GHS as `GH₵` in some runtimes and `GHS` in others: a
 * number that changes on hydration reads as two numbers. Negative amounts use
 * the true minus sign (U+2212), which lines up with the digits.
 */
export function formatMoney(
  amount: Money,
  options: { signed?: boolean; compact?: boolean } = {},
): string {
  const { symbol, spaced } = CURRENCIES[amount.currency];
  const absolute = Math.abs(amount.minor);
  const whole = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const compact = options.compact ? compactBody(whole) : null;
  const body =
    compact ??
    (remainder === 0
      ? group(whole)
      : `${group(whole)}.${String(remainder).padStart(2, '0')}`);
  const sign =
    amount.minor < 0 ? '−' : options.signed && amount.minor > 0 ? '+' : '';
  return `${sign}${symbol}${spaced ? ' ' : ''}${body}`;
}

const SCALES = [
  [1_000_000_000_000, 'trillion'],
  [1_000_000_000, 'billion'],
  [1_000_000, 'million'],
] as const;

/**
 * `5033164800` → `5.03 billion`. For hero numbers only, where
 * GH₵5,033,164,800 would wrap onto two lines of a phone. At most two decimals,
 * trailing zeros dropped; below a million, null, and the full amount is shown.
 */
function compactBody(whole: number): string | null {
  for (const [scale, word] of SCALES) {
    // Compared after rounding, so 999,999,999 reads "1 billion", not "1,000 million".
    const hundredths = mulDiv(whole, 100, scale);
    if (hundredths < 100) continue;
    const fraction = String(hundredths % 100)
      .padStart(2, '0')
      .replace(/0+$/, '');
    return `${group(Math.floor(hundredths / 100))}${fraction ? `.${fraction}` : ''} ${word}`;
  }
  return null;
}

/**
 * `-300` → `−3%`, `1250` → `12.5%`, `27` → `0.27%`. Trailing zeros dropped,
 * never more than two decimals because a basis point is the finest unit.
 */
export function formatBp(
  bp: number,
  options: { signed?: boolean } = {},
): string {
  if (!Number.isSafeInteger(bp))
    throw new RangeError(`Not a basis-point value: ${bp}`);
  const absolute = Math.abs(bp);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100)
    .padStart(2, '0')
    .replace(/0+$/, '');
  const sign = bp < 0 ? '−' : options.signed && bp > 0 ? '+' : '';
  return `${sign}${group(whole)}${fraction ? `.${fraction}` : ''}%`;
}
