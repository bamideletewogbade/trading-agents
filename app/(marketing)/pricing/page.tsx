import Link from 'next/link';
import { PRICING_PAGE } from '@/content/pages';
import { InterestButton } from '@/components/marketing/InterestButton';
import { PageHero, Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';

export const metadata = {
  title: PRICING_PAGE.meta.title,
  description: PRICING_PAGE.meta.description,
};

const C = PRICING_PAGE;

export default function PricingPage() {
  return (
    <>
      <PageHero
        kicker={C.hero.kicker}
        titleLead={C.hero.titleLead}
        titleGold={C.hero.titleGold}
        lead={C.hero.lead}
      />
      <section className="border-t border-line py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-4 sm:px-8 lg:grid-cols-3">
          {C.tiers.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={i * 80}
              className={`relative flex flex-col rounded-lg border bg-panel p-6 ${'featured' in tier && tier.featured ? 'border-gold lg:-translate-y-2' : 'border-line'}`}
            >
              <p className="font-mono type-label text-gold">{tier.name}</p>
              <p className="mt-3 type-title text-fg">{tier.price}</p>
              <p className="mt-1 type-small text-fg-2">{tier.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {tier.items.map((item) => (
                  <li key={item} className="flex gap-2 type-small text-fg">
                    <span aria-hidden className="text-gold">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-6 inline-flex min-h-12 items-center justify-center rounded-md px-5 type-body font-semibold ${'featured' in tier && tier.featured ? 'bg-gold text-ink' : 'border border-edge bg-raised text-fg'}`}
              >
                {tier.cta}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <Section kicker={C.partners.title} lead={C.partners.body} tone="panel">
        <InterestButton
          type="partner_interest"
          label={C.partners.cta}
          done={C.partners.done}
          fallback={C.partners.fallback}
        />
      </Section>
      <Section kicker={C.faq.kicker}>
        <div className="max-w-[760px] divide-y divide-line rounded-lg border border-line bg-panel">
          {C.faq.items.map(([question, answer]) => (
            <details key={question} className="group p-5">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 type-body font-semibold text-fg">
                {question}
                <span
                  aria-hidden
                  className="font-mono text-gold transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 type-small text-fg-2">{answer}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
