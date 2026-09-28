import type { CSSProperties } from 'react';
import Link from 'next/link';
import { LANDING } from '@/content/landing';
import { STAGES, lesson } from '@/content/curriculum';
import { BRAND } from '@/lib/brand';
import { FirstShareDemo } from '@/components/landing/FirstShareDemo';
import { LessonTicker } from '@/components/landing/LessonTicker';
import { StepArt } from '@/components/landing/StepArt';
import { CandleFloor } from '@/components/landing/CandleFloor';
import { NoiseField } from '@/components/three/NoiseField';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { AskBox } from '@/components/marketing/AskBox';
import { Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Tilt } from '@/components/motion/Tilt';
import { SplitWords } from '@/components/motion/SplitWords';
import { PointerGlow } from '@/components/motion/PointerGlow';
import { SignalsPreview } from '@/components/marketing/SignalsPreview';
import { CareGate } from '@/components/coach/CareGate';

/**
 * A beginner-first introduction that leads with a decision: make the
 * simplest trade (one share, two prices), see the result, then pick where
 * to start.
 *
 * The depth layer (app/globals.css): the headline turns up word by word,
 * the candle field moves in 3D behind the hero (WebGL only here, only on
 * devices that can afford it), cards lean toward a mouse, and the closing
 * call stands on a chart floor. On a phone the hero is kept short so the
 * first trade's prices show on the first screen. Under reduced motion
 * everything is simply there.
 */

export const metadata = {
  title: {
    absolute: `${BRAND.name}: practise trading decisions before they cost you.`,
  },
  description: LANDING.hero.lead,
};

const L = LANDING;
const titleLeadWords = L.hero.titleLead.split(' ').length;

export default function LandingPage() {
  return (
    <>
      {/* How far down the page you are (CSS scroll timeline, no script). */}
      <div
        aria-hidden
        className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-[55] hidden h-0.5 bg-gold"
      />

      {/* ── Hero, with a real lesson beside it ───────────────────────── */}
      <section id="top" className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-25" />
        <NoiseField className="absolute inset-x-0 bottom-0 -z-10 h-[62%] opacity-50 [mask-image:linear-gradient(to_top,black_10%,transparent)] lg:h-[78%] lg:opacity-75" />
        {/* Keeps the words on clean paper: the field shows round them, not through them. */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_48%_38%_at_24%_60%,var(--color-ink)_45%,transparent_100%)]" />
        <PointerGlow className="-z-10" />
        {/* Source order is headline, trade, explanation: on a phone the
            question "Would you take this trade?" is followed straight away
            by the trade itself. On a laptop the words sit in one column and
            the trade beside them. */}
        <div className="relative mx-auto grid max-w-[1200px] gap-6 px-4 pt-5 pb-10 sm:gap-8 sm:px-8 sm:py-14 lg:grid-cols-[1fr_1.02fr] lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-10 lg:gap-y-0 lg:py-20">
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <p className="inline-flex max-w-full animate-page-in items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1 font-mono type-tick text-fg-2 uppercase backdrop-blur">
              <span className="relative flex size-1.5 shrink-0" aria-hidden>
                <span className="absolute inset-0 animate-ring-out rounded-full bg-gold" />
                <span className="relative size-1.5 rounded-full bg-gold" />
              </span>
              <span className="min-w-0">{L.hero.eyebrow}</span>
            </p>
            <h1 className="mt-4 text-[2.1rem] leading-[2.35rem] font-[700] tracking-[-0.035em] text-balance text-fg [perspective:900px] sm:text-[3.75rem] sm:leading-[4.05rem]">
              <SplitWords text={L.hero.titleLead} start={80} />{' '}
              <SplitWords
                text={L.hero.titleGold}
                start={80}
                offset={titleLeadWords}
                wordClassName="text-gold-sheen"
              />
            </h1>
          </div>

          <div
            id="demo"
            className="relative scroll-mt-24 animate-page-in lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-center"
            style={{ animationDelay: '380ms' }}
          >
            {/* A gold light behind the card, and two coins hovering by it. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 animate-glow rounded-[2rem] bg-[radial-gradient(ellipse_at_60%_40%,color-mix(in_srgb,var(--color-gold)_22%,transparent),transparent_65%)] blur-2xl"
            />
            <FloatingCoin
              className="-top-5 -right-2 size-11 sm:-top-6 sm:-right-5 sm:size-14"
              start={0}
              tilt={-8}
            />
            <FloatingCoin
              className="-bottom-4 -left-3 hidden size-9 lg:block"
              start={-2400}
              tilt={10}
            />
            <Tilt max={4} className="rounded-2xl">
              <FirstShareDemo />
            </Tilt>
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-3">
            <p
              className="max-w-[43ch] animate-page-in type-body text-fg-2 sm:text-[1.125rem] sm:leading-8 lg:mt-4"
              style={{ animationDelay: '520ms' }}
            >
              {L.hero.lead}
            </p>
            <div
              className="mt-3 flex animate-page-in flex-wrap items-center gap-x-4 gap-y-2 lg:mt-5"
              style={{ animationDelay: '620ms' }}
            >
              {/* On a phone the trade is already above; this button is for
                  the laptop, where it sits beside the words. */}
              <Link
                href="#demo"
                className="btn-3d group relative hidden min-h-13 items-center justify-center gap-2 overflow-hidden rounded-lg bg-gold px-7 type-body font-bold text-ink lg:inline-flex"
              >
                {/* A glint crossing the button when you point at it. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,white_45%,transparent),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-[420%]"
                />
                {L.hero.primary}
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-12 items-center px-1 type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
              >
                {L.hero.secondary}
              </Link>
            </div>
            <ul
              className="mt-3 flex animate-page-in flex-wrap gap-x-4 gap-y-1 sm:mt-4"
              style={{ animationDelay: '700ms' }}
            >
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
        </div>
      </section>

      <LessonTicker />

      <Section
        kicker={L.steps.kicker}
        title={L.steps.title}
        lead={L.steps.lead}
        tone="panel"
      >
        <ol className="relative grid gap-4 md:grid-cols-3 md:gap-5">
          {/* The thread from one step to the next, on wide screens. */}
          <span
            aria-hidden
            className="absolute top-[3.25rem] right-[16%] left-[16%] hidden h-px bg-[linear-gradient(90deg,transparent,var(--color-gold-deep),var(--color-gold),var(--color-gold-deep),transparent)] md:block"
          />
          {L.steps.items.map(([title, body], index) => (
            <Reveal as="li" key={title} delay={index * 120}>
              <Tilt className="h-full rounded-2xl border border-line bg-panel p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="coin reveal-spin grid size-11 shrink-0 place-items-center font-mono type-small font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]">
                    0{index + 1}
                  </span>
                  <StepArt step={index as 0 | 1 | 2} />
                </div>
                <h3 className="mt-5 type-title text-fg">{title}</h3>
                <p className="mt-2 type-body text-fg-2">{body}</p>
              </Tilt>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section kicker={L.starter.kicker} title={L.starter.title}>
        <ul className="grid gap-4 md:grid-cols-3">
          {L.starter.items.map((item, i) => (
            <Reveal as="li" key={item.href} delay={i * 90}>
              <Tilt className="h-full rounded-2xl border border-line bg-panel">
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl p-5 sm:p-6"
                >
                  <span className="font-mono type-tick text-muted uppercase num">
                    0{i + 1} / 0{L.starter.items.length}
                  </span>
                  <h3 className="mt-3 type-title text-fg">{item.title}</h3>
                  <p className="mt-3 flex-1 type-body text-fg-2">{item.body}</p>
                  <span className="mt-6 inline-flex min-h-11 items-center gap-1.5 type-small font-semibold text-gold">
                    {item.cta}
                    <span
                      aria-hidden
                      className="transition-transform duration-200 group-hover:translate-x-1.5"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ── The courses ──────────────────────────────────────────────── */}
      <Section
        id="courses"
        tone="panel"
        kicker={L.curriculum.kicker}
        title={L.curriculum.title}
        lead={L.curriculum.lead}
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, i) => {
            const live = stage.lessons.filter(
              (id) => lesson(id).status === 'live',
            ).length;
            return (
              <Reveal as="li" key={stage.key} delay={i * 60}>
                <Tilt
                  max={6}
                  className={`flex h-full items-center gap-3 rounded-xl border bg-panel p-3 ${live ? 'border-edge' : 'border-line'}`}
                >
                  <span
                    aria-hidden
                    className={`coin reveal-spin grid size-10 shrink-0 place-items-center font-mono type-small font-bold ${live ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]' : 'text-fg-2'}`}
                    style={{ animationDelay: `${i * 60 + 120}ms` }}
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
                </Tilt>
              </Reveal>
            );
          })}
        </ol>
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
          <Link
            href="/courses"
            className="btn-3d inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-6 type-body font-bold text-ink"
          >
            {L.roadmapStrip.cta} →
          </Link>
          <div className="min-w-0 max-w-[560px]">
            <p className="mb-2 font-mono type-label text-fg-2">
              {L.roadmapStrip.search}
            </p>
            <AskBox compact />
          </div>
        </div>
      </Section>

      {/* ── Today's signals, live: the same reading members see. Hidden
          on a device where the support card showed this week. ─────────── */}
      <CareGate>
        <Section
          kicker={L.signals.kicker}
          title={L.signals.title}
          lead={L.signals.lead}
        >
          <SignalsPreview all={L.signals.all} />
          <Link
            href="/trading-signals"
            className="mt-1 inline-flex min-h-11 items-center type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
          >
            {L.signals.how} →
          </Link>
        </Section>
      </CareGate>

      {/* ── Made for Ghana and Nigeria ──────────────────────────────── */}
      <Section
        kicker={L.local.kicker}
        title={L.local.title}
        lead={L.local.lead}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {L.local.lessons.slice(0, 3).map((id, i) => {
            const item = lesson(id);
            return (
              <Reveal as="li" key={id} delay={i * 80}>
                <Tilt className="flex h-full flex-col rounded-2xl border border-line bg-panel p-5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono type-tick text-gold uppercase">
                      {L.local.play}
                    </span>
                    <TruthBadge truth={item.truth} />
                  </span>
                  <h3 className="mt-3 type-heading text-fg">
                    {L.local.cards[id].title}
                  </h3>
                  <span className="mt-1 flex-1 type-small text-fg-2">
                    {L.local.cards[id].body}
                  </span>
                  {item.playAt ? (
                    <Link
                      href={item.playAt}
                      className="btn-3d mt-5 inline-flex min-h-11 items-center self-start rounded-md bg-gold px-4 type-small font-semibold text-ink"
                    >
                      {L.local.play} →
                    </Link>
                  ) : null}
                </Tilt>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      {/* ── Closing, on the chart floor ──────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-t border-line pt-16 pb-44 sm:pt-24 sm:pb-64">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-20" />
        <CandleFloor className="-z-10" />
        <PointerGlow className="-z-10" />
        <Reveal className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-4 sm:px-8">
          <h2 className="max-w-[18ch] text-[2.25rem] leading-[2.5rem] font-[700] tracking-[-0.03em] text-fg sm:text-[3.5rem] sm:leading-[3.75rem]">
            {L.closing.title}
          </h2>
          <p className="max-w-[52ch] type-body text-fg-2">{L.closing.lead}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/lesson/m1"
              className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-7 type-body font-bold text-ink"
            >
              {L.closing.cta}
            </Link>
            <a
              href="#demo"
              className="btn-3d inline-flex min-h-13 items-center justify-center rounded-lg border border-edge bg-raised/90 px-6 type-body font-semibold text-fg backdrop-blur [--depth:var(--color-line)]"
            >
              {L.closing.secondary}
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/** A gold coin turning on its edge, hovering beside the first trade. */
function FloatingCoin({
  className,
  start,
  tilt,
}: {
  className: string;
  start: number;
  tilt: number;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 animate-hover-y [perspective:400px] ${className}`}
      style={
        { '--start': `${start}ms`, '--tilt': `${tilt}deg` } as CSSProperties
      }
    >
      <span className="coin animate-coin-turn grid size-full place-items-center font-mono text-[0.7rem] font-bold text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)] [transform-style:preserve-3d]">
        ₵
      </span>
    </span>
  );
}
