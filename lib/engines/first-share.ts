/** A beginner's first trade: one share, integer minor units, no fees. */
export const FIRST_SHARE = {
  buy: 1000,
  scenarios: [
    { id: 'higher', sell: 1200 },
    { id: 'lower', sell: 800 },
    { id: 'same', sell: 1000 },
  ],
} as const;

export function firstShareResult(sell: number) {
  if (!Number.isSafeInteger(sell) || sell < 0)
    throw new Error(
      'The sale price must be a non-negative integer in minor units.',
    );
  const change = sell - FIRST_SHARE.buy;
  return {
    buy: FIRST_SHARE.buy,
    sell,
    change,
    outcome: change > 0 ? 'gain' : change < 0 ? 'loss' : 'same',
  } as const;
}
