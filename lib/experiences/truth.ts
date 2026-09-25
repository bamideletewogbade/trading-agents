/**
 * What kind of thing the learner is looking at (spec §84).
 *
 * Every experience declares one, and the registry (Phase 1) refuses an
 * experience without it. The words for each live in `content/copy/truth.ts`;
 * the badge that draws them is `components/shell/TruthBadge.tsx`.
 */

export const TRUTHS = [
  'simulation',
  'hypothetical',
  'historical',
  'educational',
  'ai',
] as const;

export type Truth = (typeof TRUTHS)[number];
