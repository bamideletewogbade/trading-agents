import Link from 'next/link';
import { LESSONS } from '@/content/curriculum';
import { LANDING } from '@/content/landing';

/**
 * A strip of lessons you can play today, sliding past under the hero: proof
 * there's more than one demo behind the door. Each one is a link. The strip
 * is drawn twice so the loop has no seam; the copy is hidden from screen
 * readers and from the tab order. Hover pauses it so a title can be read;
 * under reduced motion it stands still (app/globals.css).
 */
const LIVE = LESSONS.filter((item) => item.status === 'live' && item.playAt);

export function LessonTicker() {
  const strip = (copy: boolean) => (
    <ul
      className="flex shrink-0 items-center gap-3 pr-3"
      aria-hidden={copy || undefined}
    >
      {LIVE.map((item) => (
        <li key={item.id}>
          <Link
            href={item.playAt!}
            tabIndex={copy ? -1 : undefined}
            className="group flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-panel/80 py-1.5 pr-4 pl-1.5 whitespace-nowrap backdrop-blur transition-colors hover:border-gold"
          >
            <span
              aria-hidden
              className="coin grid size-7 place-items-center font-mono text-[0.625rem] font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
            >
              ▶
            </span>
            <span className="type-small text-fg-2 group-hover:text-fg">
              {item.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label={LANDING.ticker.label}
      className="relative border-y border-line bg-panel/40 py-4"
    >
      <p className="mx-auto mb-3 max-w-[1200px] px-4 font-mono type-tick text-muted uppercase sm:px-8">
        {LANDING.ticker.label} · {LANDING.ticker.count(LIVE.length)}
      </p>
      <div className="fade-x overflow-hidden">
        <div className="flex w-max animate-ticker">
          {strip(false)}
          {strip(true)}
        </div>
      </div>
    </section>
  );
}
