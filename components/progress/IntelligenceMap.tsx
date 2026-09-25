import { MAP_DOMAINS } from '@/content/copy/shell';

/**
 * The financial intelligence map (spec §87): six domains, each a bar of ten
 * steps. Every bar is empty until the learner has shown something; the
 * levels come from mastery (plan §7), which arrives in Phase 3. Each bar also
 * says its level in words, so the map is readable without seeing the bars.
 */
export function IntelligenceMap({
  levels = {},
}: {
  levels?: Partial<Record<(typeof MAP_DOMAINS)[number], number>>;
}) {
  return (
    <ul className="space-y-3">
      {MAP_DOMAINS.map((domain) => {
        const level = levels[domain] ?? 0;
        return (
          <li key={domain}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="type-small text-fg-2">{domain}</span>
              <span className="num type-small text-muted">{level} of 10</span>
            </div>
            <div className="mt-1.5 grid grid-cols-10 gap-0.5" aria-hidden>
              {Array.from({ length: 10 }, (_, step) => (
                <span
                  key={step}
                  className={`h-1.5 rounded-[1px] ${step < level ? 'bg-gold' : 'bg-raised'}`}
                />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
