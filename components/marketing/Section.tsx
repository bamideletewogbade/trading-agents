import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';

/**
 * A marketing section: a mono kicker, a headline, a lead, then whatever the
 * page brings. One component so every page keeps the same rhythm, and a
 * redesign is one edit.
 */
export function Section({
  id,
  kicker,
  title,
  lead,
  children,
  tone = 'plain',
}: {
  id?: string;
  kicker: string;
  title?: ReactNode;
  lead?: string;
  children?: ReactNode;
  tone?: 'plain' | 'panel';
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t border-line py-16 sm:py-24 ${tone === 'panel' ? 'bg-panel/40' : ''}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <Reveal>
          <p className="font-mono type-label text-gold">{kicker}</p>
          {title ? (
            <h2 className="mt-3 max-w-[24ch] text-[1.875rem] leading-[2.25rem] font-[650] tracking-[-0.02em] text-balance text-fg sm:text-[2.75rem] sm:leading-[3.125rem]">
              {title}
            </h2>
          ) : null}
          {lead ? (
            <p className="mt-4 max-w-[62ch] type-body text-fg-2 sm:text-[1.0625rem] sm:leading-7">
              {lead}
            </p>
          ) : null}
        </Reveal>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}

/** The opening block of an inner page: bigger type, and the grid behind it. */
export function PageHero({
  kicker,
  titleLead,
  titleGold,
  lead,
  children,
}: {
  kicker: string;
  titleLead: string;
  titleGold?: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto max-w-[1200px] px-4 pt-12 pb-14 sm:px-8 sm:pt-20 sm:pb-20">
        <p className="font-mono type-label text-gold">{kicker}</p>
        <h1 className="mt-4 max-w-[18ch] text-[2.5rem] leading-[2.75rem] font-[680] tracking-[-0.03em] text-balance text-fg sm:text-[4rem] sm:leading-[4.25rem]">
          {titleLead}{' '}
          {titleGold ? (
            <span className="text-gold-sheen">{titleGold}</span>
          ) : null}
        </h1>
        <p className="mt-5 max-w-[58ch] type-body text-fg-2 sm:text-[1.125rem] sm:leading-8">
          {lead}
        </p>
        {children}
      </div>
    </section>
  );
}
