import Link from 'next/link';
import { LANDING } from '@/content/landing';
import { STAGES, TOPICS, lesson } from '@/content/curriculum';
import { FEATURES_PAGE } from '@/content/pages';
import { BRAND } from '@/lib/brand';
import { ChartDemo } from '@/components/landing/ChartDemo';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { AskBox } from '@/components/marketing/AskBox';
import { Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';
import { NoiseField } from '@/components/three/NoiseField';
import { SignalsPreview } from '@/components/marketing/SignalsPreview';

/**
 * The landing page: the front door. Short on purpose, and phone first: say
 * what this is, let people play a real lesson straight away, show the desk
 * (courses, signals, journal, tools), today's signals live, the courses and
 * the lessons made for here. Sections are plain server markup around a few
 * interactive islands (the chart lesson, the signals preview, the ask box,
 * the 3D field). Every number is calculated from an engine and handed to
 * the words formatted.
 */

export const metadata = {
  title: {
    absolute: `${BRAND.name}: learn to trade. Practise before you risk real money.`,
  },
  description: LANDING.hero.lead,
};

const L = LANDING;
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
                href="/desk"
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

      {/* ── One desk ─────────────────────────────────────────────────── */}
      <Section
        kicker={L.desk.kicker}
        title={L.desk.title}
        lead={L.desk.lead}
        tone="panel"
      >
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {FEATURES_PAGE.modules
            .filter((m) =>
              (L.desk.modules as readonly string[]).includes(m.name),
            )
            .map((module, i) => (
              <Reveal as="li" key={module.name} delay={i * 50}>
                {/* On a phone, a compact tile that is all link; the detail shows from sm up. */}
                <Link
                  href={module.href}
                  className="flex h-full flex-col rounded-xl border border-line bg-panel p-3 hover:border-edge sm:p-4"
                >
                  <span className="font-mono type-label text-gold">
                    {module.name}
                  </span>
                  <span className="mt-1 type-small font-semibold text-fg sm:mt-2 sm:type-heading">
                    {module.title}
                  </span>
                  <span className="mt-1 hidden flex-1 type-small text-fg-2 sm:block">
                    {module.body}
                  </span>
                  <span className="mt-3 hidden items-center gap-1 self-start type-small font-semibold text-gold underline underline-offset-4 sm:inline-flex">
                    {module.cta} <span aria-hidden>→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
        </ul>
        <Link
          href="/features"
          className="mt-5 inline-flex min-h-11 items-center type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
        >
          {L.desk.all} →
        </Link>
      </Section>

      {/* ── Today's signals, live ─────────────────────────────────────── */}
      <Section
        kicker={L.signals.kicker}
        title={L.signals.title}
        lead={L.signals.lead}
      >
        <SignalsPreview all={L.signals.all} />
        <Link
          href="/trading-signals"
          className="mt-2 inline-flex min-h-11 items-center type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
        >
          {L.signals.how} →
        </Link>
      </Section>

      {/* ── The courses ──────────────────────────────────────────────── */}
      <Section
        id="courses"
        tone="panel"
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
            href="/courses"
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

      {/* ── Made for Ghana and Nigeria ──────────────────────────────── */}
      <Section
        kicker={L.local.kicker}
        title={L.local.title}
        lead={L.local.lead}
      >
        {/* Three on a phone, so the page stays short; all six from sm up. */}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-sm:[&>li:nth-child(n+4)]:hidden">
          {L.local.lessons.map((id, i) => {
            const item = lesson(id);
            return (
              <Reveal
                as="li"
                key={id}
                delay={i * 50}
                className="flex flex-col rounded-xl border border-line bg-panel p-4"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono type-tick text-gold uppercase">
                    {TOPICS[item.topic].label}
                  </span>
                  <TruthBadge truth={item.truth} />
                </span>
                <span className="mt-2 type-heading text-fg">{item.title}</span>
                <span className="mt-1 flex-1 type-small text-fg-2">
                  {item.practice}
                </span>
                {item.playAt ? (
                  <Link
                    href={item.playAt}
                    className="mt-4 inline-flex min-h-11 items-center self-start rounded-md bg-gold px-4 type-small font-semibold text-ink"
                  >
                    {L.local.play} →
                  </Link>
                ) : null}
              </Reveal>
            );
          })}
        </ul>
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
              href="/desk"
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
