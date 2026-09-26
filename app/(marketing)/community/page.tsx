import { COMMUNITY_PAGE } from '@/content/pages';
import { InterestButton } from '@/components/marketing/InterestButton';
import { PageHero, Section } from '@/components/marketing/Section';
import { Reveal } from '@/components/motion/Reveal';

export const metadata = {
  title: COMMUNITY_PAGE.meta.title,
  description: COMMUNITY_PAGE.meta.description,
};

const C = COMMUNITY_PAGE;

/** A breakdown as it will look on the Floor: the plan, locked before the move. */
function BreakdownPreview() {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-raised font-mono type-small text-gold">
          {C.preview.initials}
        </span>
        <div className="min-w-0">
          <p className="type-small font-semibold text-fg">{C.preview.author}</p>
          <p className="font-mono type-tick text-muted">{C.preview.kind}</p>
        </div>
      </div>
      <svg viewBox="0 0 300 90" className="mt-4 h-24 w-full" aria-hidden>
        <polyline
          points="0,70 30,62 60,66 90,50 120,56 150,40 180,46 210,30"
          className="fill-none stroke-edge"
          strokeWidth="2"
        />
        <polyline
          points="210,30 240,24 270,28 300,14"
          className="fill-none stroke-gold"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
        <line
          x1="0"
          x2="300"
          y1="58"
          y2="58"
          className="stroke-loss"
          strokeDasharray="5 4"
        />
      </svg>
      <dl className="mt-3 grid grid-cols-3 gap-2 font-mono type-tick">
        <div className="rounded-md bg-raised p-2">
          <dt className="text-muted">{C.preview.thesis[0]}</dt>
          <dd className="text-fg">{C.preview.thesis[1]}</dd>
        </div>
        <div className="rounded-md bg-raised p-2">
          <dt className="text-muted">{C.preview.stop[0]}</dt>
          <dd className="text-loss">{C.preview.stop[1]}</dd>
        </div>
        <div className="rounded-md bg-raised p-2">
          <dt className="text-muted">{C.preview.risk[0]}</dt>
          <dd className="text-fg">{C.preview.risk[1]}</dd>
        </div>
      </dl>
      <p className="mt-3 type-tick text-muted">{C.preview.note}</p>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <>
      <PageHero
        kicker={C.hero.kicker}
        titleLead={C.hero.titleLead}
        titleGold={C.hero.titleGold}
        lead={C.hero.lead}
      >
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-3">
            <InterestButton
              type="community_interest"
              label={C.join.cta}
              done={C.join.done}
              fallback={C.join.signUp}
            />
            <p className="type-small text-muted">{C.join.body}</p>
          </div>
          <BreakdownPreview />
        </div>
      </PageHero>
      <Section kicker={C.features.kicker}>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {C.features.items.map(([title, body], i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 50}
              className="rounded-lg border border-line bg-panel p-5"
            >
              <p className="type-heading text-fg">{title}</p>
              <p className="mt-2 type-small text-fg-2">{body}</p>
            </Reveal>
          ))}
        </ul>
      </Section>
      <Section kicker={C.rules.kicker} tone="panel">
        <ol className="grid gap-2 md:grid-cols-2">
          {C.rules.items.map((rule, i) => (
            <Reveal
              as="li"
              key={rule}
              delay={i * 50}
              className="flex gap-3 rounded-md border border-line bg-panel p-4"
            >
              <span className="font-mono type-small text-gold num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="type-body text-fg">{rule}</span>
            </Reveal>
          ))}
        </ol>
      </Section>
      <Section kicker={C.safety.kicker}>
        <ul className="grid gap-2 md:grid-cols-2">
          {C.safety.items.map((item) => (
            <li key={item} className="flex gap-3 type-body text-fg-2">
              <span aria-hidden className="text-gold">
                ◆
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-lg border border-gold bg-panel p-6">
          <p className="type-title text-fg">{C.join.title}</p>
          <p className="mt-2 type-small text-fg-2">{C.join.body}</p>
          <div className="mt-5">
            <InterestButton
              type="community_interest"
              label={C.join.cta}
              done={C.join.done}
              fallback={C.join.signUp}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
