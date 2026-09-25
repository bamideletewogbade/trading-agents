import { TRUTH_COPY } from '@/content/copy/truth';
import type { Truth } from '@/lib/experiences/truth';
import {
  ApproxIcon,
  BookIcon,
  ClockIcon,
  LoopIcon,
} from '@/components/ui/icons';

/**
 * What kind of thing this is, said in words first (spec §84, design brief
 * §7). Text, then icon, then border style, then colour, so the badge still
 * reads in greyscale and in forced-colours mode.
 *
 * Historical data must name its source and date: a badge that says
 * "historical" without saying whose history is decoration.
 */

const STYLE: Record<Truth, string> = {
  simulation: 'border border-solid border-info text-info',
  hypothetical: 'border border-dashed border-fg-2 text-fg-2',
  historical: 'border-2 border-solid border-fg text-fg',
  educational: 'border border-solid border-gold text-gold',
  ai: 'border border-dotted border-fg-2 text-fg-2',
};

function BadgeIcon({ truth }: { truth: Truth }) {
  const size = { width: 14, height: 14 };
  switch (truth) {
    case 'simulation':
      return <LoopIcon {...size} />;
    case 'hypothetical':
      return <ApproxIcon {...size} />;
    case 'historical':
      return <ClockIcon {...size} />;
    case 'educational':
      return <BookIcon {...size} />;
    case 'ai':
      return null;
  }
}

export function TruthBadge({
  truth,
  source,
}: {
  truth: Truth;
  source?: { name: string; date: string };
}) {
  const copy = TRUTH_COPY[truth];
  const detail =
    truth === 'historical' && source
      ? ` · ${source.name} · ${source.date}`
      : '';
  return (
    <span
      className={`inline-flex max-w-full items-start gap-1 rounded-sm px-1.5 py-0.5 type-label ${STYLE[truth]}`}
      title={copy.spoken}
    >
      <BadgeIcon truth={truth} />
      <span className="min-w-0 break-words">
        {copy.badge}
        {detail}
      </span>
      <span className="sr-only">. {copy.spoken}</span>
    </span>
  );
}
