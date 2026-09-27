import Link from 'next/link';
import { SIGNALS_PAGE as C } from '@/content/pages';
import { PageHero, Section } from '@/components/marketing/Section';
import { SignalsPreview } from '@/components/marketing/SignalsPreview';
import { Reveal } from '@/components/motion/Reveal';

export const metadata = {
  title: C.meta.title,
  description: C.meta.description,
};

/**
 * Signals, explained for someone deciding whether to trust them: what the
 * rules see today (live), how a signal is made, what each one carries, the
 * rules we hold ourselves to, and the questions people ask. The signals
 * themselves live in the app (/signals).
 */
export default function TradingSignalsPage() {
  return (
    <>
      <PageHero
        kicker={C.hero.kicker}
        titleLead={C.hero.titleLead}
        titleGold={C.hero.titleGold}
        lead={C.hero.lead}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signals"
            className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-7 type-body font-bold text-ink"
          >
            {C.hero.primary}
          </Link>
          <Link
            href="/courses"
            className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg border border-edge bg-raised px-6 type-body font-semibold text-fg [--depth:var(--color-line)]"
          >
            {C.hero.secondary}
          </Link>
        </div>
      </PageHero>

      <Section kicker={C.preview.kicker} title={C.preview.title} tone="panel">
        <SignalsPreview all={C.preview.all} />
      </Section>

      <Section kicker={C.steps.kicker}>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {C.steps.items.map(([name, body], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 60}
              className="rounded-xl border border-line bg-panel p-4"
            >
              <span
                aria-hidden
                className="coin grid size-10 place-items-center font-mono type-small font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
              >
                {i + 1}
              </span>
              <p className="mt-3 type-heading text-fg">{name}</p>
              <p className="mt-1 type-small text-fg-2">{body}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section kicker={C.carries.kicker} tone="panel">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {C.carries.items.map(([name, body], i) => (
            <Reveal
              key={name}
              delay={i * 40}
              className="rounded-xl border border-line bg-panel p-4"
            >
              <dt className="font-mono type-label text-gold">{name}</dt>
              <dd className="mt-1 type-body text-fg">{body}</dd>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section kicker={C.rules.kicker}>
        <ol className="grid gap-2 md:grid-cols-2">
          {C.rules.items.map((rule, i) => (
            <Reveal
              as="li"
              key={rule}
              delay={i * 50}
              className="flex gap-3 rounded-md border border-line bg-panel p-4"
            >
              <span className="font-mono type-small text-gold num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="type-body text-fg">{rule}</span>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section kicker={C.faq.kicker} tone="panel">
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

      <section className="relative overflow-hidden border-t border-line py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-4 sm:px-8">
          <h2 className="max-w-[20ch] text-[2.25rem] leading-[2.5rem] font-[700] tracking-[-0.03em] text-fg sm:text-[3.25rem] sm:leading-[3.5rem]">
            {C.closing.title}
          </h2>
          <p className="max-w-[52ch] type-body text-fg-2">{C.closing.lead}</p>
          <Link
            href="/signals"
            className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-7 type-body font-bold text-ink"
          >
            {C.closing.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
