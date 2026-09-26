/**
 * Many trades at once: R-multiples, expectancy, and an account that risks
 * a share of itself on each trade (r3, r4, r6).
 *
 * An R is what one trade risks. A +2R win made twice what was risked; a
 * −1R loss lost what was risked. Thinking in R separates the quality of a
 * strategy from the size of the account.
 *
 * R in hundredths (200 = 2R), money in cents, rates in basis points. Pure,
 * seeded.
 */

import { mulDiv } from '../core/money.ts';
import { createRng } from '../core/rng.ts';

export type Strategy = {
  /** Share of trades that win, in basis points. */
  winBp: number;
  /** What a win makes, in hundredths of R. */
  winR: number;
  /** What a loss costs, in hundredths of R (positive). */
  lossR: number;
};

export class TradesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradesError';
  }
}

function checkStrategy(strategy: Strategy): void {
  if (strategy.winBp < 0 || strategy.winBp > 10_000)
    throw new TradesError('A win rate is between 0% and 100%.');
  if (strategy.winR < 0 || strategy.lossR < 0)
    throw new TradesError('Wins and losses are sized as positive R.');
}

/** Each trade's result in hundredths of R: +winR or −lossR, seeded. */
export function outcomes(
  seed: string,
  count: number,
  strategy: Strategy,
): number[] {
  checkStrategy(strategy);
  const rng = createRng(`trades:${seed}`);
  return Array.from({ length: count }, () =>
    rng.chanceBp(strategy.winBp) ? strategy.winR : -strategy.lossR,
  );
}

export function totalR(results: readonly number[]): number {
  return results.reduce((sum, r) => sum + r, 0);
}

/** What one trade makes on average, in hundredths of R: win% × win − loss% × loss. */
export function expectancyR(strategy: Strategy): number {
  checkStrategy(strategy);
  return Math.round(
    (strategy.winBp * strategy.winR -
      (10_000 - strategy.winBp) * strategy.lossR) /
      10_000,
  );
}

/** The win rate at which a strategy breaks even, in basis points. */
export function breakEvenWinBp(winR: number, lossR: number): number {
  if (winR + lossR <= 0)
    throw new TradesError('Wins or losses must have a size.');
  return Math.round((lossR * 10_000) / (winR + lossR));
}

/**
 * An account that risks `riskBp` of its current balance on each trade.
 * Returns the balance after each trade, starting balance first.
 */
export function equityCurve(
  start: number,
  riskBp: number,
  results: readonly number[],
): number[] {
  const curve = [start];
  let balance = start;
  for (const r of results) {
    const risk = mulDiv(balance, riskBp, 10_000);
    balance = Math.max(0, balance + mulDiv(risk, r, 100));
    curve.push(balance);
  }
  return curve;
}

/** The deepest fall from a peak along a curve, in basis points of that peak. */
export function maxDrawdownBp(curve: readonly number[]): number {
  let peak = curve[0] ?? 0;
  let worst = 0;
  for (const value of curve) {
    peak = Math.max(peak, value);
    if (peak > 0) worst = Math.max(worst, mulDiv(peak - value, 10_000, peak));
  }
  return worst;
}

/**
 * After losing `lossBp`, how many trades gaining `gainBp` each (compounding)
 * it takes to get back to where you started. Capped, so a hopeless climb
 * says so instead of looping forever.
 */
export function tradesToRecover(
  lossBp: number,
  gainBp: number,
  cap = 500,
): number | null {
  if (lossBp <= 0) return 0;
  if (lossBp >= 10_000 || gainBp <= 0) return null;
  let value = 10_000 - lossBp;
  // Work in hundredths of a basis point so small gains still compound.
  value *= 100;
  const target = 10_000 * 100;
  for (let n = 1; n <= cap; n += 1) {
    value += mulDiv(value, gainBp, 10_000);
    if (value >= target) return n;
  }
  return null;
}
