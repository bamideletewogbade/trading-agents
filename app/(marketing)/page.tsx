import Link from 'next/link';
import { LANDING } from '@/content/landing';
import { STAGES, lesson } from '@/content/curriculum';
import { DANGOTE } from '@/content/ipo';
import { BRAND } from '@/lib/brand';
import { formatMoney, fromMinor } from '@/lib/core/money';
import { companyValue, trillionsHundredths } from '@/lib/engines/ipo';
import { ChartDemo } from '@/components/landing/ChartDemo';
import { LeverageDemo } from '@/components/landing/LeverageDemo';
import { AskBox } from '@/components/marketing/AskBox';
import { Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';
import { NoiseField } from '@/components/three/NoiseField';

/**
 * The landing page: the front door. Short on purpose, and phone first: say
 * what this is, let people play a real lesson straight away, show the path,
 * and say plainly what we will never do. Sections are plain server markup
 * around a few interactive islands (the chart lesson, the ask box, Risk
 * Lab, the 3D field). Every number is calculated here from an engine and
 * handed to the words formatted.
 */

export const metadata = {
  title: {
    absolute: `${BRAND.name}: learn to trade. Practise before you risk real money.`,
  },
  description: LANDING.hero.lead,
};

const L = LANDING;
const naira = (kobo: number) => formatMoney(fromMinor(kobo, 'NGN'));

function offerFacts() {
  const value = trillionsHundredths(companyValue(DANGOTE.offer));
  const day = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  return [
    [L.ipoTeaser.facts.price, naira(DANGOTE.offer.price)],
    [
      L.ipoTeaser.facts.minimum,
      naira(DANGOTE.offer.minimum * DANGOTE.offer.price),
    ],
    [
      L.ipoTeaser.facts.window,
      `${day(DANGOTE.offer.opens)} – ${day(DANGOTE.offer.closes)}`,
    ],
    [L.ipoTeaser.facts.size, `≈ ₦${Math.round(value / 100)} trillion`],
  ] as const;
}

export default function LandingPage() {
  return (
    <>
      {/* ── Hero, with a real lesson beside it ───────────────────────── */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <NoiseField className="absolute inset-x-0 top-0 h-[440px] opacity-70 [mask-image:linear-gradient(to_bottom,black_35%,transparent)] sm:h-[560px] lg:h-[640px]" />
        <div className="relative mx-auto grid max-w-[1200px] gap-10 px-4 pt-10 pb-14 sm:px-8 lg:grid-cols-[1fr_1.02fr] lg:items-start lg:pt-24">
          <div className="lg:sticky lg:top-28">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1 font-mono type-tick text-fg-2 uppercase backdrop-blur">
              <span
                className="size-1.5 shrink-0 rounded-full bg-gold"
                aria-hidden
              />
              <span className="min-w-0">{L.hero.eyebrow}</span>
            </p>
            <h1 className="mt-5 text-[2.375rem] leading-[2.5rem] font-[700] tracking-[-0.035em] text-balance text-fg sm:text-[4.25rem] sm:leading-[4.25rem]">
              {L.hero.titleLead}{' '}
              <span className="text-gold-sheen">{L.hero.titleGold}</span>
            </h1>
            <p className="mt-5 max-w-[48ch] type-body text-fg-2 sm:text-[1.125rem] sm:leading-8">
              {L.hero.lead}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="btn-3d relative inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-7 type-body font-bold text-ink"
              >
                {L.hero.primary}
              </Link>
              <a
                href="#demo"
                className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg border border-edge bg-raised/80 px-6 type-body font-semibold text-fg backdrop-blur [--depth:var(--color-line)]"
              >
                {L.hero.secondary}
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {L.hero.promises.map((promise) => (
                <li
                  key={promise}
                  className="flex items-center gap-1.5 type-small text-fg-2"
                >
                  <span aria-hidden className="text-gold">
                    ✓
                  </span>
                  {promise}
                </li>
              ))}
            </ul>
          </div>
          <div id="demo" className="scroll-mt-24">
            <ChartDemo />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <Section
        kicker={L.steps.kicker}
        title={L.steps.title}
        lead={L.steps.lead}
        tone="panel"
      >
        <ol className="grid gap-3 sm:grid-cols-3">
          {L.steps.items.map(([name, detail], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 80}
              className="flex gap-4 rounded-xl border border-line bg-panel p-4 sm:flex-col"
            >
              <span
                aria-hidden
                className="coin grid size-12 shrink-0 place-items-center font-mono type-heading font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]"
              >
                {i + 1}
              </span>
              <span>
                <span className="block type-heading text-fg">{name}</span>
                <span className="mt-1 block type-small text-fg-2">
                  {detail}
                </span>
              </span>
            </Reveal>
          ))}
        </ol>
        <p className="mt-5 max-w-[60ch] type-body text-fg">{L.steps.habit}</p>
        <Link
          href="/mindset"
          className="mt-3 inline-flex min-h-11 items-center type-small font-semibold text-gold underline underline-offset-4"
        >
          {L.steps.mindset} →
        </Link>
      </Section>

      {/* ── The path ─────────────────────────────────────────────────── */}
      <Section
        id="roadmap"
        kicker={L.curriculum.kicker}
        title={L.curriculum.title}
        lead={L.curriculum.lead}
      >
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, i) => {
            const live = stage.lessons.filter(
              (id) => lesson(id).status === 'live',
            ).length;
            return (
              <Reveal
                as="li"
                key={stage.key}
                delay={i * 50}
                className={`flex items-center gap-3 rounded-xl border bg-panel p-3 ${live ? 'border-gold' : 'border-line'}`}
              >
                <span
                  aria-hidden
                  className={`coin grid size-10 shrink-0 place-items-center font-mono type-small font-bold ${live ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]' : 'text-fg-2'}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block type-body font-semibold text-fg">
                    {stage.title}
                  </span>
                  <span className="block font-mono type-tick text-muted num">
                    {L.curriculum.lessonsCount(stage.lessons.length)}
                    {live
                      ? ` · ▶ ${live} ${L.curriculum.status.live.toLowerCase()}`
                      : ` · ${L.curriculum.status.planned.toLowerCase()}`}
                  </span>
                </span>
              </Reveal>
            );
          })}
        </ol>
        <div className="mt-6 grid gap-5 lg:grid-cols-[auto_1fr] lg:items-end">
          <Link
            href="/roadmap"
            className="btn-3d inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-6 type-body font-bold text-ink"
          >
            {L.roadmapStrip.cta} →
          </Link>
          <div className="max-w-[560px]">
            <p className="mb-2 font-mono type-label text-fg-2">
              {L.roadmapStrip.search}
            </p>
            <AskBox compact />
          </div>
        </div>
      </Section>

      {/* ── Risk Lab ─────────────────────────────────────────────────── */}
      <Section
        id="risk-lab"
        kicker={L.risk.kicker}
        title={L.risk.title}
        lead={L.risk.lead}
        tone="panel"
      >
        <Reveal className="max-w-[640px]">
          <LeverageDemo />
        </Reveal>
      </Section>

      {/* ── The Dangote moment ───────────────────────────────────────── */}
      <Section
        kicker={L.ipoTeaser.kicker}
        title={L.ipoTeaser.title}
        lead={L.ipoTeaser.lead}
      >
        <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {offerFacts().map(([label, value], i) => (
            <Reveal
              key={label}
              delay={i * 60}
              className="rounded-xl border border-line bg-panel p-4"
            >
              <dt className="font-mono type-tick text-muted">{label}</dt>
              <dd className="mt-1 font-mono type-heading text-fg num">
                {value}
              </dd>
            </Reveal>
          ))}
        </dl>
        <Link
          href="/ipo"
          className="btn-3d mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-6 type-body font-bold text-ink"
        >
          {L.ipoTeaser.cta} →
        </Link>
      </Section>

      {/* ── Never, and the price ─────────────────────────────────────── */}
      <Section kicker={L.never.kicker} tone="panel">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {L.never.items.map((item, i) => (
            <Reveal
              as="li"
              key={item}
              delay={i * 40}
              className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3 type-body text-fg"
            >
              <span aria-hidden className="font-mono text-loss">
                ✕
              </span>
              {item}
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 max-w-[60ch] type-body text-fg">{L.never.free}</p>
        <Link
          href="/pricing"
          className="mt-3 inline-flex min-h-11 items-center type-small font-semibold text-gold underline underline-offset-4"
        >
          {L.never.pricing} →
        </Link>
      </Section>

      {/* ── Closing ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-line py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-4 sm:px-8">
          <h2 className="max-w-[18ch] text-[2.25rem] leading-[2.5rem] font-[700] tracking-[-0.03em] text-fg sm:text-[3.5rem] sm:leading-[3.75rem]">
            {L.closing.title}
          </h2>
          <p className="max-w-[52ch] type-body text-fg-2">{L.closing.lead}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/sign-up"
              className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-7 type-body font-bold text-ink"
            >
              {L.closing.cta}
            </Link>
            <a
              href="#demo"
              className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg border border-edge bg-raised px-6 type-body font-semibold text-fg [--depth:var(--color-line)]"
            >
              {L.closing.secondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
