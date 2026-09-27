import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { FEATURES_PAGE as C } from '@/content/pages';
import { PageHero, Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';
import {
  DeskIcon,
  DumbbellIcon,
  JournalIcon,
  PaperIcon,
  PathIcon,
  PersonIcon,
  SignalIcon,
  ToolsIcon,
  WordsIcon,
} from '@/components/ui/icons';

export const metadata = {
  title: C.meta.title,
  description: C.meta.description,
};

const ICONS: Record<
  (typeof C.modules)[number]['icon'],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  desk: DeskIcon,
  path: PathIcon,
  practice: DumbbellIcon,
  signal: SignalIcon,
  journal: JournalIcon,
  paper: PaperIcon,
  tools: ToolsIcon,
  me: PersonIcon,
  words: WordsIcon,
};

/**
 * What you get when you open the desk: every module, what it does, and a
 * link straight into it (they all work as a guest), then what's coming and
 * a line for community owners.
 */
export default function FeaturesPage() {
  return (
    <>
      <PageHero
        kicker={C.hero.kicker}
        titleLead={C.hero.titleLead}
        titleGold={C.hero.titleGold}
        lead={C.hero.lead}
      >
        <Link
          href="/desk"
          className="btn-3d mt-8 inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-7 type-body font-bold text-ink"
        >
          {C.hero.cta}
        </Link>
      </PageHero>

      <section className="border-t border-line py-14 sm:py-20">
        <ul className="mx-auto grid max-w-[1200px] gap-3 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {C.modules.map((module, i) => {
            const Icon = ICONS[module.icon];
            return (
              <Reveal
                as="li"
                key={module.name}
                delay={i * 40}
                className="flex flex-col rounded-xl border border-line bg-panel p-5"
              >
                <span className="flex items-center gap-2 font-mono type-label text-gold">
                  <Icon width={20} height={20} />
                  {module.name}
                </span>
                <span className="mt-3 type-heading text-fg">
                  {module.title}
                </span>
                <span className="mt-1 flex-1 type-small text-fg-2">
                  {module.body}
                </span>
                <Link
                  href={module.href}
                  className="mt-4 inline-flex min-h-11 items-center gap-1 self-start type-small font-semibold text-gold underline underline-offset-4"
                >
                  {module.cta} <span aria-hidden>→</span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <Section kicker={C.soon.kicker} tone="panel">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {C.soon.items.map(([name, body], i) => (
            <Reveal
              as="li"
              key={name}
              delay={i * 40}
              className="rounded-xl border border-dashed border-edge p-4"
            >
              <p className="type-heading text-fg">{name}</p>
              <p className="mt-1 type-small text-fg-2">{body}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <section className="border-t border-line py-14">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-4 px-4 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="type-title text-fg">{C.owners.title}</h2>
            <p className="mt-1 type-body text-fg-2">{C.owners.body}</p>
          </div>
          <Link
            href="/community#owners"
            className="inline-flex min-h-12 shrink-0 items-center rounded-lg border border-edge bg-raised px-5 type-body font-semibold text-fg"
          >
            {C.owners.cta} →
          </Link>
        </div>
      </section>
    </>
  );
}
