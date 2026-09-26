/**
 * Risk Lab: leverage, liquidation, and the maths of getting back to even.
 *
 * The leverage lesson is spec §19: "You have $100. Choose your leverage. The
 * market moves against you by 3%." The twist that makes it a lesson and not a
 * calculator: the market doesn't travel to −3% in a straight line. The path
 * dips further on the way, and at high leverage the dip, not the ending, is
 * what ends you.
 *
 * Money in integer cents, moves in basis points. Pure and seeded.
 */

import { BP_PER_WHOLE, mulDiv } from '../core/money.ts';
import { createRng } from '../core/rng.ts';

/** Every leverage offered divides 10,000 exactly, so liquidation lands on a whole basis point. */
export const LEVERAGES = [1, 2, 5, 10, 20, 25, 50] as const;
export type Leverage = (typeof LEVERAGES)[number];

export type LeverageConfig = {
  /** The learner's own money, in cents. */
  readonly capital: number;
  readonly steps: number;
  /** Where the market ends up, from entry, in basis points. */
  readonly endMoveBp: number;
  /** The largest move in one step, in basis points. */
  readonly stepBp: number;
  /** The exchange closes you out when equity falls to this share of the position. */
  readonly maintenanceBp: number;
};

export const LEVERAGE_LAB: LeverageConfig = {
  capital: 10_000,
  steps: 48,
  endMoveBp: -300,
  stepBp: 45,
  maintenanceBp: 50,
};

export class RiskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RiskError';
  }
}

/**
 * The market's path from entry, in basis points: starts at 0 and ends exactly
 * at `endMoveBp`. A seeded random walk, pinned at both ends (a Brownian
 * bridge in integers).
 */
export function marketPath(config: LeverageConfig, seed: string): number[] {
  const rng = createRng(`leverage:${seed}`);
  const walk = [0];
  for (let i = 1; i <= config.steps; i += 1)
    walk.push((walk[i - 1] as number) + rng.int(-config.stepBp, config.stepBp));
  const drift = (walk[config.steps] as number) - config.endMoveBp;
  return walk.map((value, i) => value - mulDiv(i, drift, config.steps));
}

/** The move against you at which you are closed out, in basis points (negative). */
export function liquidationMoveBp(
  config: LeverageConfig,
  leverage: number,
): number {
  if (
    !Number.isSafeInteger(leverage) ||
    leverage < 1 ||
    BP_PER_WHOLE % leverage !== 0
  )
    throw new RiskError(`Leverage ${leverage} doesn't divide 10,000.`);
  return config.maintenanceBp - BP_PER_WHOLE / leverage;
}

export type LeverageRun = {
  leverage: number;
  /** Capital × leverage, in cents. */
  position: number;
  path: number[];
  /** Equity after each step, in cents; 0 from liquidation on. */
  equity: number[];
  /** The step at which the position was closed out, or null. */
  liquidatedAt: number | null;
  liquidationBp: number;
  /** The deepest the market went against you, in basis points. */
  worstBp: number;
  /** What's left at the end, in cents. */
  final: number;
  /** final − capital, in cents. */
  pnl: number;
};

export function runLeverage(
  config: LeverageConfig,
  leverage: number,
  seed: string,
): LeverageRun {
  const liquidationBp = liquidationMoveBp(config, leverage);
  const position = config.capital * leverage;
  const maintenance = mulDiv(position, config.maintenanceBp, BP_PER_WHOLE);
  const path = marketPath(config, seed);
  const equity: number[] = [];
  let liquidatedAt: number | null = null;
  path.forEach((moveBp, step) => {
    if (liquidatedAt !== null) {
      equity.push(0);
      return;
    }
    const value = config.capital + mulDiv(position, moveBp, BP_PER_WHOLE);
    if (value <= maintenance) {
      // Closed out: the margin is gone. What's left above zero covers the
      // exchange's fee in real life; here the lesson is simply "all of it".
      liquidatedAt = step;
      equity.push(0);
      return;
    }
    equity.push(value);
  });
  const final = equity[equity.length - 1] as number;
  return {
    leverage,
    position,
    path,
    equity,
    liquidatedAt,
    liquidationBp,
    worstBp: Math.min(...path),
    final,
    pnl: final - config.capital,
  };
}

/** How the learner might have guessed it would go, and how it went. */
export type LossBand = 'little' | 'lot' | 'all';

export function lossBand(config: LeverageConfig, run: LeverageRun): LossBand {
  if (run.final <= 0) return 'all';
  const lossBp = mulDiv(-run.pnl, BP_PER_WHOLE, config.capital);
  return lossBp < 1_000 ? 'little' : 'lot';
}

/**
 * After losing `lossBp`, the gain needed to get back to even, in basis
 * points. Lose 50%, need 100%. Rounded half away from zero.
 */
export function recoveryBp(lossBp: number): number {
  if (!Number.isSafeInteger(lossBp) || lossBp <= 0 || lossBp >= BP_PER_WHOLE)
    throw new RiskError('A loss must be between 0 and 100%, exclusive.');
  return mulDiv(BP_PER_WHOLE, lossBp, BP_PER_WHOLE - lossBp);
}

/**
 * What a "doubles every N days" scheme promises `amount` becomes after
 * `doublings`. Exact integers; refuses to count past what can be counted.
 */
export function doubled(amount: number, doublings: number): number {
  let value = amount;
  for (let i = 0; i < doublings; i += 1) {
    value *= 2;
    if (!Number.isSafeInteger(value))
      throw new RiskError('The promise outgrew what can be counted exactly.');
  }
  return value;
}

/**
 * Position size for a trade: how many units so that hitting the stop loses
 * `riskBp` of the account. Rounded down: never risk more than you meant to.
 */
export function positionSize(
  account: number,
  riskBp: number,
  entry: number,
  stop: number,
): number {
  if (stop >= entry) throw new RiskError('The stop must sit below the entry.');
  const riskCents = Math.floor((account * riskBp) / BP_PER_WHOLE);
  return Math.floor(riskCents / (entry - stop));
}

/**
 * `amount` growing `rateBp` a period for `periods`, rounded to the minor
 * unit each period, as a statement or a bank would. For showing what a
 * promised monthly return really claims.
 */
export function compound(
  amount: number,
  rateBp: number,
  periods: number,
): number {
  let value = amount;
  for (let i = 0; i < periods; i += 1) {
    value += mulDiv(value, rateBp, BP_PER_WHOLE);
    if (!Number.isSafeInteger(value))
      throw new RiskError('That grows past what can be counted exactly.');
  }
  return value;
}
