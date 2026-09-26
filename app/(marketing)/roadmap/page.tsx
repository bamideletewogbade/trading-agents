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
        kicker={LANDING.loop.kicker}
        title={LANDING.loop.title}
        lead={LANDING.loop.lead}
        tone="panel"
      >
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {LANDING.loop.steps.map(([name, detail], i) => (
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
      </Section>
    </>
  );
}
