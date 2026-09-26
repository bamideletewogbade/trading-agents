import Link from 'next/link';
import { LANDING } from '@/content/landing';
import { LESSONS, STAGES, lesson } from '@/content/curriculum';
import { DANGOTE } from '@/content/ipo';
import { BRAND } from '@/lib/brand';
import { formatBp, formatMoney, fromMinor } from '@/lib/core/money';
import { chartScenario } from '@/lib/engines/chart';
import { companyValue, trillionsHundredths } from '@/lib/engines/ipo';
import {
  LEVERAGE_LAB,
  doubled,
  liquidationMoveBp,
  positionSize,
  recoveryBp,
} from '@/lib/engines/risk';
import { ChartDemo } from '@/components/landing/ChartDemo';
import { LeverageDemo } from '@/components/landing/LeverageDemo';
import { AskBox } from '@/components/marketing/AskBox';
import { Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';
import { NoiseField } from '@/components/three/NoiseField';

/**
 * The landing page: the front door, and the brief for everything after it.
 * Sections are plain server markup around a few interactive islands (the
 * chart lesson, the ask box, Risk Lab, the 3D field), so each can change
 * without touching the others. Every number is calculated here from an
 * engine and handed to the words formatted.
 */

export const metadata = {
  title: {
    absolute: `${BRAND.name}: trading is a skill. Practise it here first.`,
  },
  description: LANDING.hero.lead,
};

const L = LANDING;
const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
const cedis = (pesewas: number) => formatMoney(fromMinor(pesewas, 'GHS'));
const naira = (kobo: number) => formatMoney(fromMinor(kobo, 'NGN'));

function figures() {
  const koko = chartScenario('koko', 'bounce');
  const sizingAccount = 100_000;
  const sizingRiskBp = 100;
  const doublingStart = 10_000;
  const value = trillionsHundredths(companyValue(DANGOTE.offer));
  return {
    liq50: formatBp(-liquidationMoveBp(LEVERAGE_LAB, 50)),
    liq20: formatBp(-liquidationMoveBp(LEVERAGE_LAB, 20)),
    recover50: [formatBp(5_000), formatBp(recoveryBp(5_000))] as const,
    recover20: [formatBp(2_000), formatBp(recoveryBp(2_000))] as const,
    doublingUsd: [usd(doublingStart), usd(doubled(doublingStart, 12))] as const,
    doublingGhs: [
      cedis(doublingStart),
      cedis(doubled(doublingStart, 12)),
    ] as const,
    sizing: {
      risk: formatBp(sizingRiskBp),
      account: usd(sizingAccount),
      stop: usd(koko.entry - koko.stops.room),
      shares: positionSize(
        sizingAccount,
        sizingRiskBp,
        koko.entry,
        koko.stops.room,
      ),
    },
    ipo: {
      price: naira(DANGOTE.offer.price),
      minimum: naira(DANGOTE.offer.minimum * DANGOTE.offer.price),
      value: `≈ ₦${Math.round(value / 100)} trillion`,
    },
    live: LESSONS.filter((item) => item.status === 'live').length,
    total: LESSONS.length,
  };
}

export default function LandingPage() {
  const f = figures();
  const tickerItems = [
    L.ticker.items.liquidation(50, f.liq50),
    L.ticker.items.recovery(...f.recover50),
    L.ticker.items.support,
    L.ticker.items.doubling(...f.doublingUsd),
    L.ticker.items.sizing(
      f.sizing.risk,
      f.sizing.account,
      f.sizing.stop,
      f.sizing.shares,
    ),
    L.ticker.items.recovery(...f.recover20),
    L.ticker.items.rsi,
  ];
  const offerWindow = `${new Date(`${DANGOTE.offer.opens}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} – ${new Date(`${DANGOTE.offer.closes}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <NoiseField className="absolute inset-x-0 top-0 h-[440px] opacity-70 [mask-image:linear-gradient(to_bottom,black_35%,transparent)] sm:h-[560px] lg:h-[640px]" />
        <div className="relative mx-auto grid max-w-[1200px] gap-10 px-4 pt-10 pb-16 sm:px-8 lg:grid-cols-[1fr_1.02fr] lg:items-start lg:pt-24">
          <div className="lg:sticky lg:top-28">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1 font-mono type-tick text-fg-2 uppercase backdrop-blur">
              <span
                className="size-1.5 shrink-0 rounded-full bg-gold"
                aria-hidden
              />
              <span className="min-w-0">{L.hero.eyebrow}</span>
            </p>
            <h1 className="mt-5 text-[2.75rem] leading-[2.875rem] font-[700] tracking-[-0.035em] text-balance text-fg sm:text-[4.25rem] sm:leading-[4.25rem]">
              {L.hero.titleLead}{' '}
              <span className="text-gold-sheen">{L.hero.titleGold}</span>
            </h1>
            <p className="mt-5 max-w-[52ch] type-body text-fg-2 sm:text-[1.125rem] sm:leading-8">
              {L.hero.lead}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="relative inline-flex min-h-12 items-center justify-center rounded-md bg-gold px-7 type-body font-semibold text-ink"
              >
                <span
                  aria-hidden
                  className="absolute -inset-1 -z-10 rounded-lg bg-gold/40 blur-md animate-glow"
                />
                {L.hero.primary}
              </Link>
              <a
                href="#demo"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised/80 px-6 type-body font-semibold text-fg backdrop-blur"
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
            <div className="mt-8 max-w-[560px]">
              <p className="mb-2 font-mono type-label text-fg-2">
                {L.ask.label}
              </p>
              <AskBox compact />
            </div>
          </div>
          <div id="demo" className="scroll-mt-24">
            <ChartDemo />
          </div>
        </div>
      </section>

      {/* ── Ticker: lessons, not prices ─────────────────────────────── */}
      <div className="border-y border-line bg-panel">
        <div className="mx-auto flex max-w-[1200px] items-stretch">
          <p className="hidden shrink-0 items-center border-r border-line px-4 font-mono type-tick text-gold uppercase sm:flex">
            {L.ticker.label}
          </p>
          <div className="min-w-0 flex-1 overflow-hidden">
            <ul
              className="flex w-max animate-ticker"
              aria-label={L.ticker.label}
            >
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <li
                  key={i}
                  aria-hidden={i >= tickerItems.length}
                  className="flex items-center gap-3 px-5 py-3 font-mono type-small whitespace-nowrap text-fg-2 num"
                >
                  <span aria-hidden className="text-gold">
                    ◆
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <Section kicker={L.personas.kicker} title={L.personas.title}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {L.personas.items.map((persona, i) => (
            <Reveal as="li" key={persona.who} delay={i * 70}>
              <Link
                href={persona.href}
                className="group flex h-full flex-col rounded-lg border border-line bg-panel p-5 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-gold"
              >
                <p className="type-heading text-fg">{persona.who}</p>
                <p className="mt-2 flex-1 type-small text-fg-2">
                  {persona.need}
                </p>
                <p className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 type-small font-semibold text-gold">
                  {persona.give}
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ── The Dangote moment ───────────────────────────────────────── */}
      <Section
        kicker={L.ipoTeaser.kicker}
        title={L.ipoTeaser.title}
        lead={L.ipoTeaser.lead}
        tone="panel"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(
              [
                [L.ipoTeaser.facts.price, f.ipo.price],
                [L.ipoTeaser.facts.minimum, f.ipo.minimum],
                [L.ipoTeaser.facts.window, offerWindow],
                [L.ipoTeaser.facts.size, f.ipo.value],
              ] as const
            ).map(([label, value], i) => (
              <Reveal
                key={label}
                delay={i * 60}
                className="rounded-md border border-line bg-panel p-4"
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
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
          >
            {L.ipoTeaser.cta} →
          </Link>
        </div>
      </Section>

      {/* ── How every lesson works ───────────────────────────────────── */}
      <Section kicker={L.loop.kicker} title={L.loop.title} lead={L.loop.lead}>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {L.loop.steps.map(([name, detail], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 50}
              className="rounded-md border border-line bg-panel p-4"
            >
              <p className="font-mono type-tick text-gold num">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="mt-2 type-body font-semibold text-fg">{name}</p>
              <p className="mt-1 type-small text-fg-2">{detail}</p>
            </Reveal>
          ))}
        </ol>
        <p className="mt-5 flex flex-wrap items-center gap-2 type-small text-muted">
          <span className="font-mono type-tick uppercase">
            {L.loop.oldLabel}:
          </span>
          {L.loop.old.map((word, i) => (
            <span key={word} className="line-through decoration-loss">
              {word}
              {i < L.loop.old.length - 1 ? ' →' : ''}
            </span>
          ))}
        </p>
      </Section>

      {/* ── The roadmap, in one strip ────────────────────────────────── */}
      <Section
        id="roadmap"
        kicker={L.curriculum.kicker}
        title={L.curriculum.title}
        lead={L.curriculum.lead}
        tone="panel"
      >
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {STAGES.map((stage, i) => {
            const live = stage.lessons.filter(
              (id) => lesson(id).status === 'live',
            ).length;
            return (
              <Reveal
                as="li"
                key={stage.key}
                delay={i * 50}
                className={`rounded-md border bg-panel p-4 ${live ? 'border-gold' : 'border-line'}`}
              >
                <p className="font-mono type-tick text-muted num">
                  {L.curriculum.stage(i + 1)} ·{' '}
                  {L.curriculum.lessonsCount(stage.lessons.length)}
                </p>
                <p className="mt-2 type-body font-semibold text-fg">
                  {stage.title}
                </p>
                {live ? (
                  <p className="mt-2 font-mono type-tick text-gold">
                    ▶ {live} {L.curriculum.status.live.toLowerCase()}
                  </p>
                ) : null}
              </Reveal>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/roadmap"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
          >
            {L.roadmapStrip.cta} →
          </Link>
          <p className="type-small text-fg-2">{L.roadmapStrip.single}</p>
        </div>
      </Section>

      {/* ── Risk Lab ─────────────────────────────────────────────────── */}
      <Section
        id="risk-lab"
        kicker={L.risk.kicker}
        title={L.risk.title}
        lead={L.risk.lead}
      >
        <Reveal className="max-w-[640px]">
          <LeverageDemo />
        </Reveal>
      </Section>

      {/* ── Noise vs signal ──────────────────────────────────────────── */}
      <Section
        kicker={L.noiseTeaser.kicker}
        title={L.noiseTeaser.title}
        lead={L.noiseTeaser.lead}
        tone="panel"
      >
        <Link
          href="/mindset"
          className="inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
        >
          {L.noiseTeaser.cta} →
        </Link>
      </Section>

      {/* ── The coach ────────────────────────────────────────────────── */}
      <Section
        id="coach"
        kicker={L.coach.kicker}
        title={L.coach.title}
        lead={L.coach.lead}
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-line bg-panel p-4">
            {(
              [
                ['coach', L.coach.chat.coach1(20)],
                ['me', L.coach.chat.learner1],
                ['coach', L.coach.chat.coach2(f.liq20)],
                ['me', L.coach.chat.learner2],
                ['coach', L.coach.chat.coach3(f.liq20, 20)],
              ] as const
            ).map(([who, text], i) => (
              <Reveal key={i} delay={i * 120}>
                <p
                  className={`max-w-[85%] rounded-lg px-3 py-2 type-small ${who === 'coach' ? 'rounded-tl-sm border border-line bg-raised text-fg' : 'ml-auto rounded-tr-sm bg-gold-soft text-fg'}`}
                >
                  {text}
                </p>
              </Reveal>
            ))}
          </div>
          <ul className="space-y-5">
            {L.coach.points.map(([title, body], i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 80}
                className="border-l-2 border-gold pl-4"
              >
                <p className="type-body font-semibold text-fg">{title}</p>
                <p className="mt-1 type-small text-fg-2">{body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Built for here ───────────────────────────────────────────── */}
      <Section kicker={L.local.kicker} title={L.local.title} tone="panel">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {L.local.markets.map(([name, detail], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 60}
              className="rounded-md border border-line bg-panel p-4"
            >
              <p className="type-body font-semibold text-fg">{name}</p>
              <p className="mt-1 type-small text-fg-2">{detail}</p>
            </Reveal>
          ))}
        </ul>
        <Reveal className="mt-4 rounded-md border border-loss/50 bg-panel p-4">
          <p className="type-body font-semibold text-fg">
            <span aria-hidden className="text-loss">
              ⚠{' '}
            </span>
            {L.local.scamTitle}
          </p>
          <p className="mt-1 type-small text-fg-2 num">
            {L.local.scamBody(...f.doublingGhs)}
          </p>
        </Reveal>
      </Section>

      {/* ── WhatsApp and community ───────────────────────────────────── */}
      <Section
        kicker={L.whatsapp.kicker}
        title={L.whatsapp.title}
        lead={L.whatsapp.lead}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="max-w-[420px] rounded-lg border border-line bg-panel p-4">
            <p className="font-mono type-tick text-muted uppercase">
              {L.whatsapp.bubbleFrom}
            </p>
            <p className="mt-2 rounded-lg rounded-tl-sm bg-raised px-3 py-2 type-small text-fg">
              {L.whatsapp.bubble}
            </p>
            <ul className="mt-2 space-y-1">
              {L.whatsapp.options.map((option) => (
                <li
                  key={option}
                  className="rounded-md border border-line px-3 py-2 type-small text-fg-2"
                >
                  {option}
                </li>
              ))}
            </ul>
            <p className="mt-2 ml-auto w-fit rounded-lg rounded-tr-sm bg-gold-soft px-3 py-2 type-small font-semibold text-fg">
              {L.whatsapp.reply}
            </p>
          </Reveal>
          <Reveal
            delay={100}
            className="rounded-lg border border-gold bg-panel p-6"
          >
            <p className="font-mono type-label text-gold">
              {L.community.kicker}
            </p>
            <p className="mt-3 type-title text-fg">{L.community.title}</p>
            <p className="mt-2 type-small text-fg-2">{L.community.lead}</p>
            <Link
              href="/community"
              className="mt-5 inline-flex min-h-12 items-center rounded-md bg-gold px-5 type-small font-semibold text-ink"
            >
              {L.community.cta} →
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* ── What others proved ───────────────────────────────────────── */}
      <Section kicker={L.field.kicker} title={L.field.title} tone="panel">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {L.field.items.map(([name, proved, ours], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 50}
              className="rounded-md border border-line bg-panel p-4"
            >
              <p className="font-mono type-label text-fg">{name}</p>
              <p className="mt-2 type-small text-fg-2">{proved}</p>
              <p className="mt-2 type-small text-gold">→ {ours}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ── Never ────────────────────────────────────────────────────── */}
      <Section kicker={L.never.kicker}>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {L.never.items.map((item, i) => (
            <Reveal
              as="li"
              key={item}
              delay={i * 40}
              className="flex items-center gap-3 rounded-md border border-line bg-panel px-4 py-3 type-body text-fg"
            >
              <span aria-hidden className="font-mono text-loss">
                ✕
              </span>
              {item}
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ── Pricing and build status ─────────────────────────────────── */}
      <Section kicker={L.pricing.kicker} title={L.pricing.title} tone="panel">
        <ul className="grid gap-2 lg:grid-cols-3">
          {L.pricing.tiers.map(([name, body], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 70}
              className={`rounded-md border bg-panel p-5 ${i === 1 ? 'border-gold' : 'border-line'}`}
            >
              <p className="type-title text-fg">{name}</p>
              <p className="mt-2 type-small text-fg-2">{body}</p>
            </Reveal>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex min-h-12 items-center rounded-md border border-edge bg-raised px-5 type-small font-semibold text-fg"
          >
            {L.pricing.cta} →
          </Link>
          <p className="type-small text-muted">{L.pricing.note}</p>
        </div>
      </Section>

      <Section kicker={L.build.kicker} title={L.build.title}>
        <ol className="space-y-2">
          {L.build.items.map(([when, what], i) => (
            <Reveal
              as="li"
              key={when}
              delay={i * 50}
              className="flex gap-4 rounded-md border border-line bg-panel p-4"
            >
              <span
                className={`w-14 shrink-0 font-mono type-label ${i === 0 ? 'text-gold' : 'text-muted'}`}
              >
                {when}
              </span>
              <span className="type-small text-fg">{what}</span>
            </Reveal>
          ))}
        </ol>
        <p className="mt-4 font-mono type-small text-fg-2 num">
          {f.live} / {f.total} {L.curriculum.status.live.toLowerCase()}
        </p>
      </Section>

      {/* ── Closing ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-line py-20">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-4 sm:px-8">
          <h2 className="max-w-[18ch] text-[2.25rem] leading-[2.5rem] font-[700] tracking-[-0.03em] text-fg sm:text-[3.5rem] sm:leading-[3.75rem]">
            {L.closing.title}
          </h2>
          <p className="max-w-[52ch] type-body text-fg-2">{L.closing.lead}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-gold px-7 type-body font-semibold text-ink"
            >
              {L.closing.cta}
            </Link>
            <a
              href="#demo"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-6 type-body font-semibold text-fg"
            >
              {L.closing.secondary}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
