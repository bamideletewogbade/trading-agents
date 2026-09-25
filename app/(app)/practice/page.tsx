import { PRACTICE } from '@/content/copy/shell';
import { LABS } from '@/content/worlds';
import { TopBar } from '@/components/shell/TopBar';
import { Card } from '@/components/ui/Card';
import { ChevronRightIcon } from '@/components/ui/icons';

export const metadata = { title: PRACTICE.title };

/** Practice is separate from lessons (spec §29): labs and the daily challenge. */
export default function PracticePage() {
  return (
    <>
      <TopBar title={PRACTICE.title} />
      <p className="mb-4 type-body text-fg-2">{PRACTICE.intro}</p>

      <Card title={PRACTICE.daily} className="mb-3">
        <p className="type-small text-fg-2">{PRACTICE.dailyDetail}</p>
      </Card>

      <ul className="space-y-3">
        {LABS.map((lab) => {
          const open = lab.status === 'mvp';
          return (
            <li
              key={lab.key}
              className={`flex items-center gap-3 rounded-md border p-4 ${open ? 'border-line bg-panel' : 'border-line/60 bg-ink'}`}
            >
              <div className="min-w-0 flex-1">
                <h2
                  className={`type-heading ${open ? 'text-fg' : 'text-fg-2'}`}
                >
                  {lab.name}
                </h2>
                <p className="mt-1 type-small text-fg-2">{lab.line}</p>
              </div>
              {open ? (
                <ChevronRightIcon className="shrink-0 text-muted" />
              ) : (
                <span className="type-label text-muted">{PRACTICE.soon}</span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
