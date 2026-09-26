import Link from 'next/link';
import { DANGOTE } from '@/content/ipo';
import { MARKETING } from '@/content/marketing';
import { offerStatus } from '@/lib/engines/ipo';

/**
 * The strip above the nav, while the Dangote offer is news. Its words follow
 * the offer's own dates (lib/engines/ipo.ts), so it never says "open" after
 * the close. When the next story comes, swap the content, not this file.
 */

const CLOSES = new Date(`${DANGOTE.offer.closes}T12:00:00Z`).toLocaleDateString(
  'en-GB',
  { day: 'numeric', month: 'short', timeZone: 'UTC' },
);

export function Announcement({ today }: { today: string }) {
  const status = offerStatus(DANGOTE.offer, today);
  const copy = MARKETING.announcement;
  const text =
    status === 'open'
      ? copy.open(CLOSES)
      : status === 'closed'
        ? copy.closed
        : copy.upcoming;
  return (
    <Link href="/ipo" className="group block border-b border-line bg-panel">
      <p className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 px-4 py-2 text-center type-small text-fg-2 sm:px-8">
        <span aria-hidden className="relative flex size-2 shrink-0">
          {status === 'open' ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
          ) : null}
          <span className="relative inline-flex size-2 rounded-full bg-gold" />
        </span>
        <span className="min-w-0">
          {text}{' '}
          <span className="font-semibold whitespace-nowrap text-gold group-hover:underline">
            {copy.cta} →
          </span>
        </span>
      </p>
    </Link>
  );
}
