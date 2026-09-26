import Link from 'next/link';
import { MINDSET } from '@/content/mindset';
import {
  formatBp,
  formatMoney,
  fromMinor,
  ofBp,
  money,
} from '@/lib/core/money';
import { compound } from '@/lib/engines/risk';
import { NoiseFilter } from '@/components/marketing/NoiseFilter';
import { PageHero, Section } from '@/components/marketing/Section';
import { SignalOrNoise } from '@/components/marketing/SignalOrNoise';
import { Reveal } from '@/components/motion/Reveal';

export const metadata = {
  title: MINDSET.meta.title,
  description: MINDSET.meta.description,
};

/** Numbers for the "honest income" block, from the engines. */
function honest() {
  const capital = money(200_000, 'NGN');
  const goodBp = 300;
  const schemeBp = 3_000;
  return {
    capital: formatMoney(capital),
    good: formatBp(goodBp),
    gain: formatMoney(ofBp(capital, goodBp)),
    scheme: formatBp(schemeBp),
    year: formatMoney(fromMinor(compound(capital.minor, schemeBp, 12), 'NGN')),
  };
}

export default function MindsetPage() {
  const h = honest();
  return (
    <>
      <PageHero
        kicker={MINDSET.hero.kicker}
        titleLead={MINDSET.hero.titleLead}
        titleGold={MINDSET.hero.titleGold}
        lead={MINDSET.hero.lead}
      />

      <Section
        kicker={MINDSET.filter.kicker}
        title={MINDSET.filter.title}
        lead={MINDSET.filter.lead}
      >
        <Reveal className="max-w-[760px]">
          <NoiseFilter />
        </Reveal>
      </Section>

      <Section
        kicker={MINDSET.game.kicker}
        title={MINDSET.game.title}
        lead={MINDSET.game.lead}
        tone="panel"
      >
        <div className="max-w-[560px]">
          <SignalOrNoise />
        </div>
      </Section>

      <Section kicker={MINDSET.principles.kicker}>
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {MINDSET.principles.items.map(([title, body], i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 60}
              className="rounded-lg border border-line bg-panel p-5"
            >
              <p className="font-mono type-tick text-gold num">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="mt-2 type-heading text-fg">{title}</p>
              <p className="mt-2 type-small text-fg-2">{body}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section
        kicker={MINDSET.honest.kicker}
        title={MINDSET.honest.title}
        tone="panel"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Reveal className="rounded-lg border border-line bg-panel p-5">
            <p className="font-mono type-label text-gain">▲ {h.good}</p>
            <p className="mt-3 type-body text-fg num">
              {MINDSET.honest.good(h.good, h.capital, h.gain)}
            </p>
          </Reveal>
          <Reveal
            delay={80}
            className="rounded-lg border border-loss/60 bg-panel p-5"
          >
            <p className="font-mono type-label text-loss">⚠ {h.scheme}</p>
            <p className="mt-3 type-body text-fg num">
              {MINDSET.honest.scheme(h.scheme, h.capital, h.year)}
            </p>
          </Reveal>
        </div>
        <p className="mt-6 max-w-[60ch] border-l-2 border-gold pl-4 type-body text-fg">
          {MINDSET.honest.point}
        </p>
      </Section>

      <section className="border-t border-line py-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <h2 className="type-display text-fg">{MINDSET.cta.title}</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
            >
              {MINDSET.cta.primary}
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-6 type-body font-semibold text-fg"
            >
              {MINDSET.cta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
