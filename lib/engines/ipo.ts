/**
 * IPO maths: what an application buys, what oversubscription does to it,
 * what a listing-day move does to it, and how big the company is at the
 * offer price.
 *
 * The facts of any particular offer (price, lot size, dates) are content,
 * with sources and a checked date (content/ipo.ts). This file only does the
 * arithmetic, so the lesson survives the next IPO unchanged.
 *
 * Money in kobo (or pesewas), integers. Company-sized numbers pass 2^53 in
 * kobo, so they are worked in BigInt and returned in whole naira.
 */

export type Offer = {
  /** Price per share in minor units (kobo). */
  readonly price: number;
  /** The smallest application, in shares. */
  readonly minimum: number;
  /** Applications above the minimum go up in multiples of this. */
  readonly lot: number;
  /** Shares on offer. */
  readonly offered: number;
  /** What the offered shares are of the enlarged company, in basis points. */
  readonly stakeBp: number;
  /** ISO dates, inclusive. */
  readonly opens: string;
  readonly closes: string;
};

export class IpoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IpoError';
  }
}

export type Application = {
  shares: number;
  /** What those shares cost, in minor units. */
  cost: number;
  /** What's left of the budget, in minor units. */
  change: number;
};

/** How many shares a budget buys: whole lots, and at least the minimum, or none. */
export function application(offer: Offer, budget: number): Application {
  if (!Number.isSafeInteger(budget) || budget < 0)
    throw new IpoError('A budget is a whole, non-negative amount.');
  const affordable = Math.floor(budget / offer.price);
  const shares = Math.floor(affordable / offer.lot) * offer.lot;
  const valid = shares >= offer.minimum ? shares : 0;
  return {
    shares: valid,
    cost: valid * offer.price,
    change: budget - valid * offer.price,
  };
}

export type Allotment = {
  /** Shares you get. */
  allotted: number;
  /** Money back for the shares you didn't get, in minor units. */
  refund: number;
};

/**
 * When more is asked for than is offered, each applicant gets a share of
 * what they asked for. `allotBp` is that share (10,000 = everything). Rounded
 * down to whole lots: an allotment never gives you more than the offer can.
 */
export function allotment(
  offer: Offer,
  applied: number,
  allotBp: number,
): Allotment {
  if (allotBp < 0 || allotBp > 10_000)
    throw new IpoError('An allotment is between 0% and 100%.');
  const raw = Math.floor((applied * allotBp) / 10_000);
  const allotted = Math.floor(raw / offer.lot) * offer.lot;
  return { allotted, refund: (applied - allotted) * offer.price };
}

/** What `shares` are worth after the price moves `moveBp` from the offer price. */
export function afterListing(
  offer: Offer,
  shares: number,
  moveBp: number,
): { value: number; change: number } {
  const price = Math.floor((offer.price * (10_000 + moveBp)) / 10_000);
  const value = shares * price;
  return { value, change: value - shares * offer.price };
}

/**
 * The whole company at the offer price, in whole naira: shares offered ÷
 * their stake gives all the shares, × price gives the value.
 */
export function companyValue(offer: Offer): number {
  const allShares = (BigInt(offer.offered) * 10_000n) / BigInt(offer.stakeBp);
  const value = (allShares * BigInt(offer.price)) / 100n;
  if (value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new IpoError('Too large to count exactly.');
  return Number(value);
}

/** Price ÷ yearly profit, in hundredths (1279 means 12.79×). */
export function peHundredths(value: number, yearlyProfit: number): number {
  if (yearlyProfit <= 0) throw new IpoError('A P/E needs a profit above zero.');
  return Math.round((value * 100) / yearlyProfit);
}

/** `65227272727050` → `6523`: trillions, in hundredths, rounded half up. */
export function trillionsHundredths(amount: number): number {
  return Math.floor((amount + 5_000_000_000) / 10_000_000_000);
}

export type OfferStatus = 'upcoming' | 'open' | 'closed';

/** Where the offer stands on `today` (an ISO date). Content picks the words. */
export function offerStatus(offer: Offer, today: string): OfferStatus {
  if (today < offer.opens) return 'upcoming';
  if (today > offer.closes) return 'closed';
  return 'open';
}
