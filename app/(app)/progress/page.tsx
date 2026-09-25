import { HOME, PROGRESS } from '@/content/copy/shell';
import { TopBar } from '@/components/shell/TopBar';
import { Card } from '@/components/ui/Card';
import { IntelligenceMap } from '@/components/progress/IntelligenceMap';
import { PaletteSetting } from '@/components/shell/PaletteSetting';

export const metadata = { title: PROGRESS.title };

/**
 * Progress shows what the learner can do (spec §28, §31), what the coach
 * remembers about how they learn (spec §40, deletable), and the few settings
 * that belong to this device.
 */
export default function ProgressPage() {
  return (
    <>
      <TopBar title={PROGRESS.title} />
      <p className="mb-4 type-body text-fg-2">{PROGRESS.intro}</p>
      <div className="space-y-3">
        <Card title={HOME.mapTitle}>
          <IntelligenceMap />
        </Card>

        <Card title={PROGRESS.levelsTitle}>
          <ol className="space-y-2">
            {PROGRESS.levels.map(([name, line], index) => (
              <li key={name} className="flex gap-3">
                <span className="num w-5 shrink-0 type-small text-muted">
                  {index + 1}
                </span>
                <p className="type-small">
                  <span className="font-semibold text-fg">{name}.</span>{' '}
                  <span className="text-fg-2">{line}</span>
                </p>
              </li>
            ))}
          </ol>
        </Card>

        <Card title={PROGRESS.remembersTitle}>
          <p className="type-small text-fg-2">{PROGRESS.remembersEmpty}</p>
        </Card>

        <Card title={PROGRESS.settingsTitle}>
          <PaletteSetting
            label={PROGRESS.paletteLabel}
            standard={PROGRESS.paletteStandard}
            blueOrange={PROGRESS.paletteBlueOrange}
            help={PROGRESS.paletteHelp}
          />
        </Card>
      </div>
    </>
  );
}
