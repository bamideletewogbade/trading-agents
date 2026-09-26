/**
 * Reading a company (f4, f5): an income statement built line by line from
 * what the business does, and valuation by P/E and dividend yield, played
 * forward so a "cheap" share can show whether it was cheap or just bad.
 *
 * Money in integer minor units (pesewas). Per-share figures are kept in
 * hundredths of a pesewa while they compound, so five years of growth don't
 * drift by rounding, and are rounded to pesewas when shown. Pure.
 */

import { mulDiv } from '../core/money.ts';

const BP = 10_000;

export class CompanyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyError';
  }
}

/* ── The income statement (f4) ────────────────────────────────────────── */

export type Business = {
  /** Tonnes of cocoa processed and sold in the year. */
  tonnes: number;
  /** What a tonne of cocoa butter and powder sells for, in pesewas. */
  pricePerTonne: number;
  /** What a tonne of beans costs, in pesewas. */
  beansPerTonne: number;
  /** Energy, packing and haulage for each tonne, in pesewas. */
  processingPerTonne: number;
  /** Salaries, rent and the rest, whatever the volume, in pesewas. */
  fixedCosts: number;
  debt: number;
  interestBp: number;
  taxBp: number;
  shares: number;
};

/**
 * A made-up Kumasi cocoa processor. It buys beans, grinds them into butter
 * and powder, and sells those. The numbers are chosen to be easy to follow,
 * not taken from any real company.
 */
export const COCOA_CO: Business = {
  tonnes: 10_000,
  pricePerTonne: 5_000_000,
  beansPerTonne: 3_600_000,
  processingPerTonne: 400_000,
  fixedCosts: 4_000_000_000,
  debt: 10_000_000_000,
  interestBp: 2_000,
  taxBp: 2_500,
  shares: 100_000_000,
};

export type IncomeStatement = {
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingCosts: number;
  operatingProfit: number;
  interest: number;
  profitBeforeTax: number;
  tax: number;
  netProfit: number;
  grossMarginBp: number;
  netMarginBp: number;
  /** Earnings per share, in pesewas. */
  eps: number;
};

/** Top to bottom: what comes in, what each layer of cost takes, what's left. */
export function incomeStatement(b: Business): IncomeStatement {
  if (b.tonnes < 0 || b.shares <= 0)
    throw new CompanyError('A business needs shares and no negative sales.');
  const revenue = b.tonnes * b.pricePerTonne;
  const costOfSales = b.tonnes * (b.beansPerTonne + b.processingPerTonne);
  const grossProfit = revenue - costOfSales;
  const operatingProfit = grossProfit - b.fixedCosts;
  const interest = mulDiv(b.debt, b.interestBp, BP);
  const profitBeforeTax = operatingProfit - interest;
  // No tax on a loss.
  const tax = profitBeforeTax > 0 ? mulDiv(profitBeforeTax, b.taxBp, BP) : 0;
  const netProfit = profitBeforeTax - tax;
  return {
    revenue,
    costOfSales,
    grossProfit,
    operatingCosts: b.fixedCosts,
    operatingProfit,
    interest,
    profitBeforeTax,
    tax,
    netProfit,
    grossMarginBp: revenue ? mulDiv(grossProfit, BP, revenue) : 0,
    netMarginBp: revenue ? mulDiv(netProfit, BP, revenue) : 0,
    eps: mulDiv(netProfit, 1, b.shares),
  };
}

/** How much one number changed against another, in bp: (after − before) ÷ |before|. */
export function changeBp(before: number, after: number): number {
  if (before === 0) throw new CompanyError('No change from zero.');
  return mulDiv(after - before, BP, Math.abs(before));
}

/* ── Valuation (f5) ───────────────────────────────────────────────────── */

export type Stock = {
  /** Share price today, in pesewas. */
  price: number;
  /** Earnings per share this year, in pesewas. */
  eps: number;
  /** Share of earnings paid out as dividends, in bp. */
  payoutBp: number;
  /** How earnings change each year, in bp (negative for shrinking). */
  growthBp: number;
};

/** Two made-up companies, both earning GH₵1.00 a share this year. */
export const STOCKS: Record<'cheap' | 'dear', Stock> = {
  /** A cement maker whose one big contract is ending: priced at 4 times earnings. */
  cheap: { price: 400, eps: 100, payoutBp: 6_000, growthBp: -3_000 },
  /** A payments company signing up shops fast: priced at 15 times earnings. */
  dear: { price: 1_500, eps: 100, payoutBp: 2_000, growthBp: 2_000 },
};

/** Price ÷ earnings, in hundredths: 400 is a P/E of 4. */
export function peHundredths(stock: Stock): number {
  if (stock.eps <= 0) throw new CompanyError('A P/E needs positive earnings.');
  return mulDiv(stock.price, 100, stock.eps);
}

/** This year's dividend ÷ price, in bp. */
export function dividendYieldBp(stock: Stock): number {
  return mulDiv(mulDiv(stock.eps, stock.payoutBp, BP), BP, stock.price);
}

export type Holding = {
  years: number;
  shares: number;
  /** Money left over after buying whole shares, in pesewas. */
  cash: number;
  dividends: number;
  /** Share price at the end, in pesewas, if the P/E stays the same. */
  endPrice: number;
  endValue: number;
  returnBp: number;
  /** Earnings per share each year, from now, in pesewas. */
  epsPath: number[];
};

/**
 * Buy `amount` of a share and hold it for `years`. Earnings grow (or
 * shrink) each year, dividends are paid from them, and the P/E is held
 * where it started, so the only thing that changes is the business.
 */
export function hold(stock: Stock, amount: number, years = 5): Holding {
  const shares = Math.floor(amount / stock.price);
  const cash = amount - shares * stock.price;
  // Hundredths of a pesewa, so compounding doesn't drift.
  let eps = stock.eps * 100;
  let dividends = 0;
  const epsPath = [stock.eps];
  for (let y = 1; y <= years; y += 1) {
    eps += mulDiv(eps, stock.growthBp, BP);
    dividends += mulDiv(shares * mulDiv(eps, stock.payoutBp, BP), 1, 100);
    epsPath.push(mulDiv(eps, 1, 100));
  }
  const endPrice = mulDiv(mulDiv(eps, peHundredths(stock), 100), 1, 100);
  const endValue = cash + shares * endPrice + dividends;
  return {
    years,
    shares,
    cash,
    dividends,
    endPrice,
    endValue,
    returnBp: mulDiv(endValue - amount, BP, amount),
    epsPath,
  };
}

/**
 * The fastest yearly fall in earnings, in whole-percent steps, at which
 * holding the share still doesn't lose money. How much bad news its low
 * price had already paid for.
 */
export function survivableShrinkBp(
  stock: Stock,
  amount: number,
  years = 5,
): number {
  let growthBp = 0;
  if (hold({ ...stock, growthBp }, amount, years).returnBp < 0) return 0;
  while (
    growthBp > -9_000 &&
    hold({ ...stock, growthBp: growthBp - 100 }, amount, years).returnBp >= 0
  )
    growthBp -= 100;
  return growthBp;
}
