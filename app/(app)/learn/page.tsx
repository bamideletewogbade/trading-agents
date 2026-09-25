import { LEARN } from '@/content/copy/shell';
import { WORLDS } from '@/content/worlds';
import { TopBar } from '@/components/shell/TopBar';
import { LockIcon } from '@/components/ui/icons';

export const metadata = { title: LEARN.title };

/**
 * The worlds as a path (spec §65), not a course catalogue. Later worlds are
 * shown locked so the learner can see where the path goes.
 */
export default function LearnPage() {
  return (
    <>
      <TopBar title={LEARN.title} />
      <p className="mb-4 type-body text-fg-2">{LEARN.intro}</p>
      <ol className="relative space-y-3 before:absolute before:top-4 before:bottom-4 before:left-[1.1875rem] before:w-px before:bg-line">
        {WORLDS.map((world, index) => {
          const open = world.status === 'mvp';
          return (
            <li key={world.key} className="relative flex gap-3">
              <span
                className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-md border num type-heading ${
                  open
                    ? 'border-gold bg-panel text-gold'
                    : 'border-line bg-ink text-muted'
                }`}
              >
                {index + 1}
              </span>
              <div
                className={`min-w-0 flex-1 rounded-md border p-4 ${open ? 'border-line bg-panel' : 'border-line/60 bg-ink'}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    className={`type-heading ${open ? 'text-fg' : 'text-fg-2'}`}
                  >
                    {world.name}
                  </h2>
                  {open ? (
                    <span className="num type-small text-muted">
                      {LEARN.lessons(world.lessons)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 type-label text-muted">
                      <LockIcon width={14} height={14} />
                      {LEARN.locked}
                    </span>
                  )}
                </div>
                <p className="mt-1 type-small text-fg-2">{world.line}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
