import { SUPPORT } from '@/content/coach';

/**
 * Shown when something a learner typed sounds like crisis (by rule, or when
 * Jev isn't sure it isn't). Calm, no alarms, no upsell, and nothing to do
 * but reach someone. Links are real `tel:` and web links a phone can use.
 */
export function SupportCard() {
  return (
    <section
      aria-labelledby="support-title"
      className="rounded-lg border border-gold/40 bg-gold-soft p-4 text-fg"
    >
      <h3 id="support-title" className="type-title">
        {SUPPORT.title}
      </h3>
      <p className="mt-2 type-body text-fg-2">{SUPPORT.body}</p>
      <ul className="mt-3 grid gap-2">
        {SUPPORT.lines.map((line) => (
          <li key={line.value}>
            <a
              href={line.href}
              className="flex min-h-12 flex-col justify-center rounded-md border border-edge bg-panel px-3 py-2"
              {...(line.href.startsWith('http')
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              <span className="type-small text-fg-2">{line.label}</span>
              <span className="font-mono type-body font-semibold text-gold num">
                {line.value}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 type-small text-fg-2">{SUPPORT.after}</p>
    </section>
  );
}
