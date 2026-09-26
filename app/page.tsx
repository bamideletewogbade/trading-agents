import type { ReactNode } from 'react';
import { LANDING } from '@/content/landing';
import { LESSONS, STAGES } from '@/content/curriculum';
import { BRAND } from '@/lib/brand';
import { formatBp, formatMoney, fromMinor } from '@/lib/core/money';
import { chartScenario } from '@/lib/engines/chart';
import {
  LEVERAGE_LAB,
  doubled,
  liquidationMoveBp,
  positionSize,
  recoveryBp,
} from '@/lib/engines/risk';
import { ChartDemo } from '@/components/landing/ChartDemo';
import { Curriculum } from '@/components/landing/Curriculum';
import { LeverageDemo } from '@/components/landing/LeverageDemo';

/**
 * The landing page, and the brief for everything built after it
 * (docs/research/competitors.md says why it looks like this). Full screen,
 * outside the tabbed app: this is the front door.
 *
 * Two lessons are playable right here, because the spec's bar is that the
 * first three minutes prove the idea (§98). The roadmap below is drawn from
 * content/curriculum.ts, the same list the lesson player will use.
 *
 * Every number is calculated here from an engine and passed to the words as
 * a formatted string.
 */

export const metadata = {
  title: { absolute: `${BRAND.name}: learn to read the market` },
  description: LANDING.hero.lead,
};

const L = LANDING;
const usd = (cents: number) => formatMoney(fromMinor(cents, 'USD'));
const cedis = (pesewas: number) => formatMoney(fromMinor(pesewas, 'GHS'));

/** Numbers the page's words need, from the engines. */
function figures() {
  const koko = chartScenario('koko', 'bounce');
  const sizingAccount = 100_000;
  const sizingRiskBp = 100;
  const doublingStart = 10_000;
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
    live: LESSONS.filter((item) => item.status === 'live').length,
    total: LESSONS.length,
  };
}

function Section({
  id,
  number,
  kicker,
  title,
  lead,
  children,
}: {
  id?: string;
  number: string;
  kicker: string;
  title?: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-16 border-t border-line py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
        <p className="font-mono type-label text-gold">
          {number} / {kicker}
        </p>
        {title ? (
          <h2 className="mt-3 max-w-[22ch] type-display text-fg sm:text-[2.5rem] sm:leading-[2.875rem]">
            {title}
          </h2>
        ) : null}
        {lead ? (
          <p className="mt-4 max-w-[60ch] type-body text-fg-2">{lead}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Mark() {
  // Rising steps in gold, the placeholder mark (lib/brand.ts).
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" className="fill-gold" />
      <path
        d="M5 18h4v-4h4v-4h4V6h2"
        className="fill-none stroke-ink"
        strokeWidth="2.2"
      />
    </svg>
  );
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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-8">
          <a href="#top" className="flex items-center gap-2">
            <Mark />
            <span className="type-heading text-fg">{BRAND.name}</span>
          </a>
          <nav
            aria-label="Sections"
            className="hidden items-center gap-6 md:flex"
          >
            {(
              [
                ['#roadmap', L.nav.roadmap],
                ['#risk-lab', L.nav.riskLab],
                ['#coach', L.nav.coach],
              ] as const
            ).map(([href, text]) => (
              <a
                key={href}
                href={href}
                className="type-small text-fg-2 hover:text-fg"
              >
                {text}
              </a>
            ))}
          </nav>
          <a
            href="#demo"
            className="inline-flex min-h-12 items-center rounded-md bg-gold px-4 type-small font-semibold text-ink"
          >
            {L.nav.start}
          </a>
        </div>
      </header>

      <main id="content">
        {/* Hero, with the first lesson in it. */}
        <section id="top" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
          <div className="relative mx-auto grid max-w-[1120px] gap-10 px-4 pt-10 pb-14 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:pt-20">
            <div className="lg:sticky lg:top-24">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 font-mono type-tick text-fg-2 uppercase">
                <span className="size-1.5 rounded-full bg-gold" aria-hidden />
                {L.hero.eyebrow}
              </p>
              <h1 className="mt-5 text-[2.5rem] leading-[2.75rem] font-[650] tracking-[-0.025em] text-fg sm:text-[3.5rem] sm:leading-[3.75rem]">
                {L.hero.title}
              </h1>
              <p className="mt-5 max-w-[52ch] type-body text-fg-2 sm:text-[1.125rem] sm:leading-7">
                {L.hero.lead}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#demo"
                  className="inline-flex min-h-12 items-center justify-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
                >
                  {L.hero.primary}
                </a>
                <a
                  href="#roadmap"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-6 type-body font-semibold text-fg"
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
            <div id="demo" className="scroll-mt-20">
              <ChartDemo />
            </div>
          </div>
        </section>

        {/* Ticker: lessons, not prices. */}
        <div className="border-y border-line bg-panel">
          <div className="mx-auto flex max-w-[1120px] items-stretch">
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

        <Section
          number="01"
          kicker={L.loop.kicker}
          title={L.loop.title}
          lead={L.loop.lead}
        >
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            {L.loop.steps.map(([name, detail], i) => (
              <li
                key={name}
                className="rounded-md border border-line bg-panel p-4"
              >
                <p className="font-mono type-tick text-gold num">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-2 type-body font-semibold text-fg">{name}</p>
                <p className="mt-1 type-small text-fg-2">{detail}</p>
              </li>
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

        <Section
          id="roadmap"
          number="02"
          kicker={L.curriculum.kicker}
          title={L.curriculum.title}
          lead={L.curriculum.lead}
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <Curriculum />
            <aside className="space-y-2 lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-md border border-line bg-panel p-4 font-mono num">
                <p className="type-tick text-muted uppercase">
                  {L.curriculum.tabs.path}
                </p>
                <p className="mt-1 type-title text-fg">
                  {f.total}{' '}
                  <span className="type-small text-fg-2">
                    {L.curriculum.summary(STAGES.length)}
                  </span>
                </p>
                <p className="mt-1 type-small text-gold">
                  {f.live} {L.curriculum.status.live.toLowerCase()}
                </p>
              </div>
            </aside>
          </div>
        </Section>

        <Section
          id="risk-lab"
          number="03"
          kicker={L.risk.kicker}
          title={L.risk.title}
          lead={L.risk.lead}
        >
          <div className="max-w-[640px]">
            <LeverageDemo />
          </div>
        </Section>

        <Section
          id="coach"
          number="04"
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
                <p
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 type-small ${who === 'coach' ? 'rounded-tl-sm border border-line bg-raised text-fg' : 'ml-auto rounded-tr-sm bg-gold-soft text-fg'}`}
                >
                  {text}
                </p>
              ))}
            </div>
            <ul className="space-y-5">
              {L.coach.points.map(([title, body]) => (
                <li key={title} className="border-l-2 border-gold pl-4">
                  <p className="type-body font-semibold text-fg">{title}</p>
                  <p className="mt-1 type-small text-fg-2">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section number="05" kicker={L.local.kicker} title={L.local.title}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {L.local.markets.map(([name, detail]) => (
              <li
                key={name}
                className="rounded-md border border-line bg-panel p-4"
              >
                <p className="type-body font-semibold text-fg">{name}</p>
                <p className="mt-1 type-small text-fg-2">{detail}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-md border border-loss/50 bg-panel p-4">
            <p className="type-body font-semibold text-fg">
              <span aria-hidden className="text-loss">
                ⚠{' '}
              </span>
              {L.local.scamTitle}
            </p>
            <p className="mt-1 type-small text-fg-2 num">
              {L.local.scamBody(...f.doublingGhs)}
            </p>
          </div>
        </Section>

        <Section
          number="06"
          kicker={L.whatsapp.kicker}
          title={L.whatsapp.title}
          lead={L.whatsapp.lead}
        >
          <div className="max-w-[420px] rounded-lg border border-line bg-panel p-4">
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
          </div>
        </Section>

        <Section number="07" kicker={L.field.kicker} title={L.field.title}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {L.field.items.map(([name, proved, ours]) => (
              <li
                key={name}
                className="rounded-md border border-line bg-panel p-4"
              >
                <p className="font-mono type-label text-fg">{name}</p>
                <p className="mt-2 type-small text-fg-2">{proved}</p>
                <p className="mt-2 type-small text-gold">→ {ours}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section number="08" kicker={L.never.kicker}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {L.never.items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-md border border-line bg-panel px-4 py-3 type-body text-fg"
              >
                <span aria-hidden className="font-mono text-loss">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section number="09" kicker={L.pricing.kicker} title={L.pricing.title}>
          <ul className="grid gap-2 lg:grid-cols-3">
            {L.pricing.tiers.map(([name, body], i) => (
              <li
                key={name}
                className={`rounded-md border bg-panel p-5 ${i === 1 ? 'border-gold' : 'border-line'}`}
              >
                <p className="type-title text-fg">{name}</p>
                <p className="mt-2 type-small text-fg-2">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 type-small text-muted">{L.pricing.note}</p>
        </Section>

        <Section number="10" kicker={L.build.kicker} title={L.build.title}>
          <ol className="space-y-2">
            {L.build.items.map(([when, what], i) => (
              <li
                key={when}
                className="flex gap-4 rounded-md border border-line bg-panel p-4"
              >
                <span
                  className={`w-14 shrink-0 font-mono type-label ${i === 0 ? 'text-gold' : 'text-muted'}`}
                >
                  {when}
                </span>
                <span className="type-small text-fg">{what}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section className="border-t border-line py-16">
          <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-6 px-4 sm:px-8">
            <h2 className="type-display text-fg">{L.closing.title}</h2>
            <a
              href="#demo"
              className="inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
            >
              {L.closing.cta}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto max-w-[1120px] space-y-2 px-4 sm:px-8">
          <p className="flex items-center gap-2 type-small font-semibold text-fg">
            <Mark /> {BRAND.name}
          </p>
          <p className="max-w-[70ch] type-small text-muted">
            {L.footer.disclaimer}
          </p>
        </div>
      </footer>
    </>
  );
}
