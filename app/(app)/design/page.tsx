import type { ReactNode } from 'react';
import {
  add,
  formatMoney,
  fromMinor,
  money,
  ofBp,
  shareBp,
  times,
} from '@/lib/core/money';
import { TopBar } from '@/components/shell/TopBar';
import { TruthBadge } from '@/components/shell/TruthBadge';
import { ExperienceFrame } from '@/components/shell/ExperienceFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Delta } from '@/components/ui/Delta';
import { Stat } from '@/components/ui/Stat';
import {
  ApproxIcon,
  BookIcon,
  ClockIcon,
  CoachIcon,
  DumbbellIcon,
  HomeIcon,
  LockIcon,
  LoopIcon,
  StepsIcon,
  TriangleDown,
  TriangleUp,
  WarningIcon,
} from '@/components/ui/icons';
import { INKS, SERIES, SURFACES, TYPE_SCALE } from './tokens';
import { SpecimenControls } from './SpecimenControls';

export const metadata = { title: 'Design specimen', robots: { index: false } };

/**
 * The design brief, drawn (docs/design-brief.md §14). This page exists so
 * the brief can be approved on a phone rather than in prose. It isn't in the
 * tabs; open /design directly.
 */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 type-label text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  // The spec's own leverage example, calculated by lib/core, not typed in.
  const capital = money(500, 'USD');
  const exposure = times(capital, 20);
  const pnl = ofBp(exposure, -300);
  const left = add(capital, pnl);
  const gain = money(300, 'GHS');

  return (
    <>
      <TopBar
        title="Design specimen"
        action={<span className="type-label text-gold">Draft</span>}
      />
      <p className="type-body text-fg-2">
        Every token and component from the design brief, for approval on a
        phone.
      </p>

      <Section title="Surfaces">
        <ul className="grid grid-cols-1 gap-2">
          {SURFACES.map((surface) => (
            <li key={surface.name} className="flex items-center gap-3">
              <span
                className={`size-10 shrink-0 rounded-md border border-line ${surface.swatch}`}
              />
              <span className="min-w-0">
                <span className="block type-small font-semibold text-fg">
                  {surface.name}{' '}
                  <span className="num font-normal text-muted">
                    {surface.hex}
                  </span>
                </span>
                <span className="block type-small text-fg-2">
                  {surface.role}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Words and states">
        <Card>
          <ul className="space-y-2">
            {INKS.map((ink) => (
              <li
                key={ink.name}
                className="flex items-baseline justify-between gap-3"
              >
                <span className={`type-body font-semibold ${ink.text}`}>
                  {ink.name}
                </span>
                <span className="text-right type-small text-fg-2">
                  {ink.role}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Type · Inter">
        <div className="space-y-4">
          {TYPE_SCALE.map((style) => (
            <div key={style.name}>
              <p className="type-tick text-muted">{style.name}</p>
              <p className={`${style.className} break-words text-fg`}>
                {style.sample}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Numbers say it four ways">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Position" value={formatMoney(exposure)} />
            <Stat label="Left" value={formatMoney(left)} />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Delta amount={pnl} shareBp={shareBp(pnl, capital)} />
            <Delta amount={gain} />
          </div>
        </Card>
      </Section>

      <Section title="An experience, framed">
        <ExperienceFrame
          title="Leverage"
          truth="simulation"
          summary={[
            `You put in ${formatMoney(capital)} at 20×, so you control ${formatMoney(exposure)}.`,
            `The market moved 3% against you. That cost ${formatMoney(fromMinor(-pnl.minor, pnl.currency))}, and you have ${formatMoney(left)} left.`,
          ]}
          actions={
            <>
              <Button kind="primary" block>
                Try 50×
              </Button>
              <Button kind="quiet" block>
                Explain it to me
              </Button>
            </>
          }
        >
          <Stat
            label="Your account"
            value={formatMoney(left)}
            hero
            delta={<Delta amount={pnl} shareBp={shareBp(pnl, capital)} />}
          />
        </ExperienceFrame>
      </Section>

      <Section title="Truth badges">
        <div className="flex flex-wrap gap-2">
          <TruthBadge truth="simulation" />
          <TruthBadge truth="hypothetical" />
          <TruthBadge truth="educational" />
          <TruthBadge truth="ai" />
          <TruthBadge
            truth="historical"
            source={{ name: 'Ghana Statistical Service', date: 'Dec 2022' }}
          />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-3">
          <Button kind="primary" block>
            Play the month
          </Button>
          <Button kind="secondary" block>
            What if I saved 10%?
          </Button>
          <Button kind="quiet">Skip to the result</Button>
          <Button
            kind="primary"
            block
            disabled
            reason="Put all GH₵3,000 somewhere first."
          >
            Play the month
          </Button>
        </div>
      </Section>

      <Section title="Controls">
        <Card>
          <SpecimenControls />
        </Card>
      </Section>

      <Section title="Chart colours · validated order">
        <ul className="grid grid-cols-7 gap-1.5">
          {SERIES.map((series) => (
            <li key={series.slot} className="text-center">
              <span className={`block h-10 rounded-sm ${series.swatch}`} />
              <span className="mt-1 block num type-tick text-fg-2">
                {series.slot}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 type-small text-fg-2">
          1 is you, 2 is the what-if. Neighbours stay apart for colour-blind
          readers (ΔE 8.6) and everyone else (20.9).
        </p>
        <div className="mt-4 flex items-center gap-4 type-small">
          <span className="inline-flex items-center gap-1.5 text-fg-2">
            <span className="h-1 w-8 rounded-full bg-gain-mark" /> gain
          </span>
          <span className="inline-flex items-center gap-1.5 text-fg-2">
            <span className="h-1 w-8 rounded-full bg-loss-mark" /> loss
          </span>
          <span className="inline-flex items-center gap-1.5 text-fg-2">
            <span className="h-0 w-8 border-t-2 border-dashed border-ended" />{' '}
            ended
          </span>
        </div>
      </Section>

      <Section title="Icons">
        <ul className="grid grid-cols-4 gap-4 text-fg-2">
          {[
            ['Home', HomeIcon],
            ['Learn', BookIcon],
            ['Practice', DumbbellIcon],
            ['Progress', StepsIcon],
            ['Coach', CoachIcon],
            ['Simulation', LoopIcon],
            ['Hypothetical', ApproxIcon],
            ['Historical', ClockIcon],
            ['Locked', LockIcon],
            ['Caution', WarningIcon],
            ['Gain', TriangleUp],
            ['Loss', TriangleDown],
          ].map(([name, Icon]) => {
            const Glyph = Icon as typeof HomeIcon;
            return (
              <li
                key={name as string}
                className="flex flex-col items-center gap-1.5"
              >
                <Glyph />
                <span className="type-tick text-muted">{name as string}</span>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
