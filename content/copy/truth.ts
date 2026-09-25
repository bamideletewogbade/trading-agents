import type { Truth } from '@/lib/experiences/truth';

/**
 * The words on a truth badge, and the longer line a screen reader hears.
 * Short on purpose: a badge is read at a glance, beside a number.
 */
export const TRUTH_COPY: Record<Truth, { badge: string; spoken: string }> = {
  simulation: {
    badge: 'Simulation',
    spoken: 'Simulation. Nothing here is real money.',
  },
  hypothetical: {
    badge: 'Hypothetical',
    spoken: 'Hypothetical example. The numbers are made up to teach an idea.',
  },
  historical: {
    badge: 'Historical data',
    spoken: 'Historical data, from the source shown.',
  },
  educational: {
    badge: 'Educational only',
    spoken: 'Educational only. This is not advice about your own money.',
  },
  ai: {
    badge: 'AI',
    spoken: 'Written by the AI coach.',
  },
};
