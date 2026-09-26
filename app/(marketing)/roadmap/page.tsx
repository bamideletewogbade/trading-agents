import { ROADMAP_PAGE } from '@/content/pages';
import { LANDING } from '@/content/landing';
import { AskBox } from '@/components/marketing/AskBox';
import { PageHero, Section } from '@/components/marketing/Section';
import { Curriculum } from '@/components/landing/Curriculum';

export const metadata = {
  title: ROADMAP_PAGE.meta.title,
  description: ROADMAP_PAGE.meta.description,
};

export default function RoadmapPage() {
  return (
    <>
      <PageHero
        kicker={ROADMAP_PAGE.hero.kicker}
        titleLead={ROADMAP_PAGE.hero.titleLead}
        titleGold={ROADMAP_PAGE.hero.titleGold}
        lead={ROADMAP_PAGE.hero.lead}
      >
        <div className="max-w-[640px]">
          <AskBox />
        </div>
      </PageHero>
      <Section
        kicker={LANDING.curriculum.kicker}
        title={LANDING.curriculum.title}
        lead={LANDING.curriculum.lead}
      >
        <div className="max-w-[860px]">
          <Curriculum />
        </div>
      </Section>
      <Section
        kicker={LANDING.steps.kicker}
        title={LANDING.steps.title}
        lead={LANDING.steps.lead}
        tone="panel"
      >
        <ol className="grid gap-3 sm:grid-cols-3">
          {LANDING.steps.items.map(([name, detail], i) => (
            <li
              key={name}
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
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
