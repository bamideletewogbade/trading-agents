/**
 * Published figures the fundamental-analysis lessons use, each with where
 * it came from and when we checked. Facts only: the maths that turns them
 * into "what your savings bought" lives in lib/engines/macro.ts.
 *
 * Rates in basis points (54.1% = 5_410); exchange rates as local currency
 * per US dollar in ten-thousandths (GH₵6.0061 = 60_061). Months run from
 * December of the year before to December, so each series starts where the
 * year did.
 *
 * Checked 26 Sep 2026.
 */

export type YearOfData = {
  country: string;
  currency: 'GHS' | 'NGN';
  year: number;
  months: readonly string[];
  /** Headline inflation, year on year, at each month. */
  inflationBp: readonly number[];
  /**
   * Dollar exchange rate at the start and end of the year, and the weakest
   * month-end where the source gives every month (the rate may have been
   * weaker between month-ends).
   */
  fx: {
    start: number;
    end: number;
    weakestMonthEnd?: { rate: number; month: string };
  };
  /** The central bank's policy rate at each month, where we use it. */
  policyBp?: readonly number[];
  /** The 91-day Treasury bill rate (interest-rate equivalent) at each month, where we use it. */
  billBp?: readonly number[];
  sources: readonly { name: string; url: string }[];
  /** Who published it, short enough for a badge. */
  publisher: string;
  checked: string;
};

const MONTHS = (year: number) => [
  `Dec ${year - 1}`,
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  `Dec ${year}`,
];

/** Ghana, 2022. Everything from the Bank of Ghana's bulletin for December 2022. */
export const GHANA_2022: YearOfData = {
  country: 'Ghana',
  currency: 'GHS',
  year: 2022,
  months: MONTHS(2022),
  // Table 19, headline inflation.
  inflationBp: [
    1_260, 1_390, 1_570, 1_940, 2_340, 2_760, 2_980, 3_170, 3_390, 3_720, 4_040,
    5_030, 5_410,
  ],
  // Table 18, interbank US dollar, end of period.
  fx: {
    start: 60_061,
    end: 85_760,
    weakestMonthEnd: { rate: 131_044, month: 'November 2022' },
  },
  // Selected indicators: monetary policy rate.
  policyBp: [
    1_450, 1_450, 1_450, 1_700, 1_700, 1_900, 1_900, 1_900, 2_200, 2_200, 2_450,
    2_700, 2_700,
  ],
  // Selected indicators: 91-day bill, interest rate equivalent.
  billBp: [
    1_249, 1_255, 1_282, 1_349, 1_622, 1_905, 2_415, 2_616, 2_768, 2_965, 3_153,
    3_462, 3_548,
  ],
  sources: [
    {
      name: 'Bank of Ghana, Monthly Statistical Bulletin, December 2022',
      url: 'https://www.bog.gov.gh/wp-content/uploads/2023/03/Statistical-Bulletin-DECEMBER-2022.pdf',
    },
  ],
  publisher: 'Bank of Ghana',
  checked: '26 Sep 2026',
};

/** Nigeria, 2023. Inflation from the NBS; the official (NAFEM) dollar rate from FMDQ data. */
export const NIGERIA_2023: YearOfData = {
  country: 'Nigeria',
  currency: 'NGN',
  year: 2023,
  months: MONTHS(2023),
  inflationBp: [
    2_134, 2_182, 2_191, 2_204, 2_222, 2_241, 2_279, 2_408, 2_580, 2_672, 2_733,
    2_820, 2_892,
  ],
  // ₦461.5 at the start of 2023, ₦907.11 at its last close.
  fx: { start: 4_615_000, end: 9_071_100 },
  sources: [
    {
      name: 'National Bureau of Statistics, CPI and Inflation Report, December 2023',
      url: 'https://nigerianstat.gov.ng/elibrary/read/1241439',
    },
    {
      name: 'Nairametrics: NAFEM exchange rate ends 2023 at N907.11 (FMDQ data)',
      url: 'https://nairametrics.com/2023/12/29/nafem-exchange-rate-ends-2023-at-n907-11-26-8-depreciation-since-unification/',
    },
  ],
  publisher: 'NBS and FMDQ',
  checked: '26 Sep 2026',
};

export const YEARS = { ghana: GHANA_2022, nigeria: NIGERIA_2023 } as const;
