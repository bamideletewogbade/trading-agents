import Link from 'next/link';
import { DANGOTE, IPO_PAGE } from '@/content/ipo';
import { formatBp, formatMoney, fromMinor } from '@/lib/core/money';
import {
  companyValue,
  offerStatus,
  peHundredths,
  trillionsHundredths,
} from '@/lib/engines/ipo';
import { IpoLab } from '@/components/marketing/IpoLab';
import { PageHero, Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';
import { TruthBadge } from '@/components/shell/TruthBadge';

export const metadata = {
  title: IPO_PAGE.meta.title,
  description: IPO_PAGE.meta.description,
};

const C = IPO_PAGE;
const O = DANGOTE.offer;
const naira = (kobo: number) => formatMoney(fromMinor(kobo, 'NGN'));
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
/** Hundredths of a trillion → "₦65.23 trillion". */
const trillions = (hundredths: number) =>
  `₦${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')} trillion`;
/** Whole naira → "4.1 billion", "2.15 trillion", for counts too big for a Money. */
function big(amount: number): string {
  if (amount >= 1e12) return `${Math.round(amount / 1e10) / 100} trillion`;
  return `${Math.round(amount / 1e7) / 100} billion`;
}

export default function IpoPage() {
  const today = new Date().toISOString().slice(0, 10);
  const status = offerStatus(O, today);
  const value = companyValue(O);
  const yearly = DANGOTE.halfYearProfit * 2;
  const pe = peHundredths(value, yearly);
  const peText = `${Math.floor(pe / 100)}.${String(pe % 100).padStart(2, '0')}`;
  const raising = (O.offered * O.price) / 100;

  const facts: [string, string][] = [
    [C.facts.items.price, naira(O.price)],
    [
      C.facts.items.minimum,
      C.facts.minimumLine(O.minimum, naira(O.minimum * O.price)),
    ],
    [C.facts.items.lot, C.facts.lotLine(O.lot)],
    [C.facts.items.offered, big(O.offered)],
    [C.facts.items.raising, `₦${big(raising)}`],
    [C.facts.items.stake, `≈ ${formatBp(O.stakeBp)}`],
    [C.facts.items.window, `${day(O.opens)} – ${day(O.closes)}`],
    [C.facts.items.allotment, DANGOTE.allotmentBasis],
    [C.facts.items.crediting, DANGOTE.crediting],
    [C.facts.items.exchange, DANGOTE.exchange],
  ];

  return (
    <>
      <PageHero
        kicker={C.hero.kicker}
        titleLead={C.hero.titleLead}
        titleGold={C.hero.titleGold}
        lead={C.hero.lead}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono type-tick text-fg-2 uppercase">
            <span
              aria-hidden
              className={`size-2 rounded-full ${status === 'open' ? 'bg-gain' : 'bg-edge'}`}
            />
            {status === 'open'
              ? C.hero.status.open(day(O.closes))
              : status === 'closed'
                ? C.hero.status.closed
                : C.hero.status.upcoming}
          </span>
          <TruthBadge truth="educational" />
        </div>
      </PageHero>

      <Section kicker={C.facts.kicker} title={C.facts.title}>
        <dl className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {facts.map(([label, text], i) => (
            <Reveal
              key={label}
              delay={i * 30}
              className="rounded-md border border-line bg-panel p-3"
            >
              <dt className="font-mono type-tick text-muted">{label}</dt>
              <dd className="mt-1 type-small font-semibold text-fg num">
                {text}
              </dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-4 type-small text-muted">
          {C.facts.checked(DANGOTE.checked)}
        </p>
        <p className="mt-2 type-small text-fg-2">
          {C.facts.sources}:{' '}
          {DANGOTE.sources.map((source, i) => (
            <span key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-edge underline-offset-4 hover:text-fg"
              >
                {source.name}
              </a>
              {i < DANGOTE.sources.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </Section>

      <section className="border-t border-line py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <IpoLab />
        </div>
      </section>

      <Section
        kicker={C.size.kicker}
        title={C.size.title}
        lead={C.size.lead}
        tone="panel"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Reveal className="rounded-lg border border-line bg-panel p-5">
            <p className="font-mono type-tick text-muted">{C.size.value}</p>
            <p className="mt-1 font-mono type-title text-gold num">
              ≈ {trillions(trillionsHundredths(value))}
            </p>
            <p className="mt-3 type-small text-fg-2">
              {C.size.valueHow(big(O.offered), formatBp(O.stakeBp))}
            </p>
            <p className="mt-2 type-small text-muted">
              {C.size.valueCheck(trillions(DANGOTE.publishedValueHundredths))}
            </p>
          </Reveal>
          <Reveal
            delay={80}
            className="rounded-lg border border-line bg-panel p-5"
          >
            <p className="font-mono type-tick text-muted">{C.size.profit}</p>
            <p className="mt-1 font-mono type-title text-fg num">
              ₦{big(DANGOTE.halfYearProfit)}
            </p>
            <p className="mt-4 font-mono type-tick text-muted">
              {C.size.yearly}
            </p>
            <p className="mt-1 font-mono type-title text-fg num">
              ₦{big(yearly)}
            </p>
            <p className="mt-3 type-small text-muted">{C.size.yearlyNote}</p>
          </Reveal>
          <Reveal
            delay={160}
            className="rounded-lg border border-gold bg-panel p-5"
          >
            <p className="font-mono type-tick text-muted">{C.size.pe}</p>
            <p className="mt-1 font-mono type-title text-gold num">
              ≈ {peText}×
            </p>
            <p className="mt-3 type-small text-fg">{C.size.peLine(peText)}</p>
          </Reveal>
        </div>
      </Section>

      <Section kicker={C.noise.kicker}>
        <div className="grid gap-3 md:grid-cols-2">
          <Reveal className="rounded-lg border border-line bg-panel p-5">
            <p className="font-mono type-label text-loss">
              〰 {C.noise.noiseTitle}
            </p>
            <ul className="mt-3 space-y-2">
              {C.noise.noiseItems.map((item) => (
                <li key={item} className="flex gap-2 type-small text-fg-2">
                  <span aria-hidden className="text-loss">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal
            delay={80}
            className="rounded-lg border border-gold bg-panel p-5"
          >
            <p className="font-mono type-label text-gold">
              ◆ {C.noise.signalTitle}
            </p>
            <ul className="mt-3 space-y-2">
              {C.noise.signalItems.map((item) => (
                <li key={item} className="flex gap-2 type-small text-fg">
                  <span aria-hidden className="text-gold">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section kicker={C.ask.kicker} tone="panel">
        <ol className="grid gap-2 md:grid-cols-2">
          {C.ask.items.map((item, i) => (
            <Reveal
              as="li"
              key={item}
              delay={i * 40}
              className="flex gap-3 rounded-md border border-line bg-panel p-4"
            >
              <span className="font-mono type-small text-gold num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="type-body text-fg">{item}</span>
            </Reveal>
          ))}
        </ol>
        <p className="mt-6 rounded-md border border-loss/60 bg-panel p-4 type-small text-fg">
          <span aria-hidden className="text-loss">
            ⚠{' '}
          </span>
          {C.safety}
        </p>
      </Section>

      <section className="border-t border-line py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 className="type-display text-fg">{C.deeper.title}</h2>
          <p className="mt-3 max-w-[56ch] type-body text-fg-2">
            {C.deeper.body}
          </p>
          <Link
            href="/roadmap"
            className="mt-6 inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
          >
            {C.deeper.cta} →
          </Link>
        </div>
      </section>
    </>
  );
}
