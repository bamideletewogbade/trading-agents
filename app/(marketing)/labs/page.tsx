import Link from 'next/link';
import { LABS_PAGE } from '@/content/pages';
import { LESSONS } from '@/content/curriculum';
import { PageHero, Section } from '@/components/marketing/Section';
import { LeverageDemo } from '@/components/landing/LeverageDemo';
import { ChartDemo } from '@/components/landing/ChartDemo';
import { IpoLab } from '@/components/marketing/IpoLab';
import { NoiseFilter } from '@/components/marketing/NoiseFilter';
import { TruthBadge } from '@/components/shell/TruthBadge';
export const metadata = { title: LABS_PAGE.meta.title, description: LABS_PAGE.meta.description };
const C = LABS_PAGE;
function Flow({ steps }: { steps: readonly (readonly [string,string])[] }) {
  return <ol className="space-y-3">{steps.map(([title,body],i)=><li key={title} className="relative rounded-xl border border-line bg-panel p-5"><span className="font-mono type-tick text-gold">{String(i+1).padStart(2,'0')} {i ? '↓' : ''}</span><h3 className="mt-2 type-heading text-fg">{title}</h3><p className="mt-2 type-small text-fg-2">{body}</p></li>)}</ol>;
}
export default function LabsPage() {
  const live = LESSONS.filter((item) => item.status === 'live').length;
  const lab0 = C.labs[0];
  const lab1 = C.labs[1];
  const lab2 = C.labs[2];
  const lab3 = C.labs[3];

  return (
    <>
      <PageHero
        kicker={C.hero.kicker}
        titleLead={C.hero.titleLead}
        titleGold={C.hero.titleGold}
        lead={C.hero.lead}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono type-small text-gold">
            {C.available(C.labs.length)}
          </span>
          <TruthBadge truth="simulation" />
        </div>
      </PageHero>
      <nav
        aria-label={C.directory}
        className="mx-auto grid max-w-[1200px] gap-3 px-4 pb-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4"
      >
        {C.labs.map((lab) => (
          <a
            key={lab.id}
            href={`#${lab.id}`}
            className="rounded-xl border border-line bg-panel p-4 hover:border-gold"
          >
            <span className="font-mono type-tick text-gold">{lab.badge}</span>
            <span className="mt-2 block type-heading text-fg">{lab.title}</span>
            <span className="mt-3 block type-small text-gold">{C.open} ↓</span>
          </a>
        ))}
      </nav>
      {lab0 ? (
        <Section
          id="risk-lab"
          kicker={lab0.kicker}
          title={lab0.title}
          lead={lab0.lead}
          tone="panel"
        >
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <LeverageDemo />
            <Flow steps={C.riskSteps} />
          </div>
        </Section>
      ) : null}
      {lab1 ? (
        <Section
          id="ipo-lab"
          kicker={lab1.kicker}
          title={lab1.title}
          lead={lab1.lead}
        >
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <IpoLab />
            <div>
              <Flow steps={C.ipoSteps} />
              <Link
                href="/ipo"
                className="mt-4 inline-flex min-h-12 items-center text-gold underline"
              >
                {C.ipoMore} →
              </Link>
            </div>
          </div>
        </Section>
      ) : null}
      {lab2 ? (
        <Section
          id="chart-lab"
          kicker={lab2.kicker}
          title={lab2.title}
          lead={lab2.lead}
          tone="panel"
        >
          <div className="max-w-[760px]">
            <ChartDemo />
          </div>
        </Section>
      ) : null}
      {lab3 ? (
        <Section
          id="noise-lab"
          kicker={lab3.kicker}
          title={lab3.title}
          lead={lab3.lead}
        >
          <div className="max-w-[760px]">
            <NoiseFilter />
            <p className="mt-4 type-small text-muted">{C.noiseNote}</p>
            <Link
              href="/mindset"
              className="mt-3 inline-flex min-h-12 items-center text-gold underline"
            >
              {C.quiz} →
            </Link>
          </div>
        </Section>
      ) : null}
      <Section
        kicker="Ready to train"
        title={C.nextTitle}
        lead={C.nextBody(live, LESSONS.length - live)}
        tone="panel"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/lesson/m1"
            className="btn-3d inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-6 font-bold text-ink"
          >
            {C.tryLesson}
          </Link>
          <Link
            href="/roadmap"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-edge px-6 text-fg"
          >
            {C.curriculum}
          </Link>
        </div>
      </Section>
    </>
  );
}
