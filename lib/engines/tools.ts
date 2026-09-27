/**
 * The calculators on the Tools screen: the arithmetic the risk lessons
 * teach (r1–r6), for real trades. Position size in any market, forex lots,
 * risk and reward, the climb back from a loss, and what a promised monthly
 * return claims. Every answer is rounded the safe way: never size more than
 * you meant to risk.
 *
 * Money in minor units, prices as integers at a stated number of decimals,
 * quantities in hundred-millionths of a unit (so 0.02 BTC is 2,000,000),
 * R in hundredths, rates in bp. Pure.
 */

import { BP_PER_WHOLE, mulDiv, pow10 } from '../core/money.ts';
import { compound, recoveryBp } from './risk.ts';
import { breakEvenWinBp, expectancyR, tradesToRecover } from './trades.ts';

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}

/** Quantities are counted in hundred-millionths of a unit. */
export const QUANTITY_PLACES = 8;
const Q = BigInt(pow10(QUANTITY_PLACES));

export type Sizing = {
  /** The money at risk if the stop is hit. */
  riskMinor: number;
  /** How much to buy or sell, in hundred-millionths of a unit. */
  quantity: number;
  /** What that position is worth at the entry, in minor units. */
  valueMinor: number;
  /** The position's value against the account, in tenths: 32 means 3.2×. */
  exposureTenths: number;
  /** The stop's distance as a share of the entry. */
  stopBp: number;
};

/**
 * Position size: how much to buy so that the stop loses `riskBp` of the
 * account. The account is in the currency the price is quoted in (dollars
 * for BTC/USD). Rounded down.
 */
export function sizePosition(input: {
  accountMinor: number;
  riskBp: number;
  entry: number;
  stop: number;
  decimals: number;
}): Sizing {
  const { accountMinor, riskBp, entry, stop, decimals } = input;
  if (!Number.isSafeInteger(accountMinor) || accountMinor <= 0)
    throw new ToolError('The account needs an amount.');
  if (!Number.isSafeInteger(riskBp) || riskBp <= 0 || riskBp > BP_PER_WHOLE)
    throw new ToolError('Risk is a share of the account, above 0%.');
  if (entry <= 0 || stop <= 0 || entry === stop)
    throw new ToolError('The stop must differ from the entry.');
  const riskMinor = Math.floor((accountMinor * riskBp) / BP_PER_WHOLE);
  const scale = BigInt(pow10(decimals));
  // Minor units lost per whole unit if the stop is hit: distance × 100 / 10^decimals.
  const distance = BigInt(Math.abs(entry - stop));
  const quantity = Number((BigInt(riskMinor) * scale * Q) / (distance * 100n));
  const valueMinor = Number(
    (BigInt(quantity) * BigInt(entry) * 100n) / (Q * scale),
  );
  return {
    riskMinor,
    quantity,
    valueMinor,
    exposureTenths: mulDiv(valueMinor, 10, accountMinor),
    stopBp: mulDiv(Math.abs(entry - stop), BP_PER_WHOLE, entry),
  };
}

/** A standard forex lot is 100,000 units of the base currency. */
export const LOT_UNITS = 100_000;
/** On a pair quoted in dollars, a pip on one standard lot is worth $10. */
export const PIP_VALUE_MINOR = 1_000;

/**
 * Forex lots for a pair quoted in dollars (EUR/USD, GBP/USD): risk ÷ (stop
 * in pips × $10), in hundredths of a lot, rounded down to what a broker
 * accepts. `stopPipTenths` is the stop in tenths of a pip (15.5 pips = 155).
 */
export function forexLots(input: {
  accountMinor: number;
  riskBp: number;
  stopPipTenths: number;
}): { riskMinor: number; lotsHundredths: number; pipValueMinor: number } {
  const { accountMinor, riskBp, stopPipTenths } = input;
  if (!Number.isSafeInteger(accountMinor) || accountMinor <= 0)
    throw new ToolError('The account needs an amount.');
  if (!Number.isSafeInteger(stopPipTenths) || stopPipTenths <= 0)
    throw new ToolError('The stop needs a distance in pips.');
  const riskMinor = Math.floor((accountMinor * riskBp) / BP_PER_WHOLE);
  // One lot loses stopPipTenths / 10 × $10 = stopPipTenths × 100 cents.
  const lotsHundredths = Math.floor(riskMinor / stopPipTenths);
  return {
    riskMinor,
    lotsHundredths,
    pipValueMinor: mulDiv(lotsHundredths, PIP_VALUE_MINOR, 100),
  };
}

/** Risk and reward: the target in R, and the win rate that breaks even at it. */
export function riskReward(input: {
  entry: number;
  stop: number;
  target: number;
}): { side: 'buy' | 'sell'; rewardR: number; breakEvenBp: number } {
  const { entry, stop, target } = input;
  if (entry === stop)
    throw new ToolError('The stop must differ from the entry.');
  const side = stop < entry ? 'buy' : 'sell';
  if (side === 'buy' ? target <= entry : target >= entry)
    throw new ToolError('The target must sit on the other side of the entry.');
  const rewardR = mulDiv(Math.abs(target - entry), 100, Math.abs(entry - stop));
  return { side, rewardR, breakEvenBp: breakEvenWinBp(rewardR, 100) };
}

/** After a loss: the gain that gets back to even, and how many good trades that is. */
export function climbBack(input: { lossBp: number; gainPerTradeBp: number }): {
  neededBp: number;
  trades: number | null;
} {
  return {
    neededBp: recoveryBp(input.lossBp),
    trades: tradesToRecover(input.lossBp, input.gainPerTradeBp),
  };
}

/** What a promised monthly return compounds to, and the multiple, in hundredths. */
export function promise(input: {
  amountMinor: number;
  monthlyBp: number;
  months: number;
}): { endMinor: number; multipleHundredths: number } {
  const endMinor = compound(input.amountMinor, input.monthlyBp, input.months);
  return {
    endMinor,
    multipleHundredths: mulDiv(endMinor, 100, input.amountMinor),
  };
}

/** Expectancy from a win rate and the average win and loss, per trade and per 100. */
export function edge(input: { winBp: number; winR: number; lossR: number }): {
  perTrade: number;
  perHundred: number;
  breakEvenBp: number;
} {
  const perTrade = expectancyR(input);
  return {
    perTrade,
    perHundred: perTrade * 100,
    breakEvenBp: breakEvenWinBp(input.winR, input.lossR),
  };
}

/** 2000000 → "0.02"; trailing zeros dropped. */
export function formatQuantity(quantity: number): string {
  const unit = pow10(QUANTITY_PLACES);
  const whole = Math.floor(quantity / unit);
  const fraction = String(quantity % unit)
    .padStart(QUANTITY_PLACES, '0')
    .replace(/0+$/, '');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/** "1.5" or "1.5%" → 150 bp. At most two decimals; null for anything else. */
export function parsePercent(text: string): number | null {
  const match = /^(\d{1,4})(?:\.(\d{1,2}))?\s*%?$/.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

/** "25" or "15.5" pips → tenths of a pip. */
export function parsePips(text: string): number | null {
  const match = /^(\d{1,5})(?:\.(\d))?$/.exec(text.trim());
  if (!match) return null;
  const tenths = Number(match[1]) * 10 + Number(match[2] ?? '0');
  return tenths > 0 ? tenths : null;
}

/** A whole number of months or trades, 1 to `max`. */
export function parseCount(text: string, max: number): number | null {
  const match = /^\d{1,4}$/.exec(text.trim());
  if (!match) return null;
  const n = Number(text.trim());
  return n >= 1 && n <= max ? n : null;
}

/** 20 → "0.20": lots are traded in hundredths. */
export function formatLots(hundredths: number): string {
  return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;
}

/** A position worth more than the account (10 tenths) needs leverage. */
export const LEVERAGE_FROM_TENTHS = 10;
/**
 * A promised 3% a month is more than 40% a year: past what honest
 * investments pay, and where the promise check says so.
 */
export const TOO_GOOD_MONTHLY_BP = 300;

/**
 * A typed price at a market's decimals: "84,025.55" at 1 decimal is
 * 840256 (rounded half up past the market's precision). Null when it isn't
 * a price.
 */
export function priceAt(text: string, decimals: number): number | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text.trim().replace(/,/g, ''));
  if (!match) return null;
  const fraction = match[2] ?? '';
  const kept = fraction.slice(0, decimals).padEnd(decimals, '0');
  let units = Number(match[1]) * pow10(decimals) + Number(kept || '0');
  if (fraction.length > decimals && Number(fraction[decimals]) >= 5) units += 1;
  return Number.isSafeInteger(units) && units > 0 ? units : null;
}
