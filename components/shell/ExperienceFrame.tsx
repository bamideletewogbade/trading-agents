import type { ReactNode } from 'react';
import type { Truth } from '@/lib/experiences/truth';
import { TruthBadge } from './TruthBadge';

/**
 * The frame every experience sits in (design brief §6), inline in the coach
 * or full screen in a Lab:
 *
 * - on top, its title and its truth badge, which is not optional;
 * - in the middle, the experience itself;
 * - at the bottom, its actions, in thumb reach;
 * - and "Read this as text": the engine's own plain-language summary (the
 *   `Facts.lines` of plan §4.1). The same sentences feed the coach, the screen
 *   reader and WhatsApp. A native <details>, so it works before any script
 *   has loaded.
 */
export function ExperienceFrame({
  title,
  truth,
  source,
  summary,
  summaryLabel = 'Read this as text',
  actions,
  children,
}: {
  title: string;
  truth: Truth;
  source?: { name: string; date: string };
  summary: readonly string[];
  summaryLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="type-heading text-fg">{title}</h2>
        <TruthBadge truth={truth} source={source} />
      </header>
      <div className="p-4">{children}</div>
      <details className="group border-t border-line px-4 py-3">
        <summary className="cursor-pointer type-small text-fg-2 marker:text-muted hover:text-fg">
          {summaryLabel}
        </summary>
        <ul className="mt-2 space-y-1 type-small text-fg-2">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
      {actions ? (
        <footer className="flex flex-col gap-2 border-t border-line p-4">
          {actions}
        </footer>
      ) : null}
    </section>
  );
}
