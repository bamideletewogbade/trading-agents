import Link from 'next/link';
import type { Lesson } from '@/content/curriculum';

/**
 * One lesson in a list, folded: the title and a line of facts, and a
 * chevron. Opening it says what you'll actually do in the lesson and gives
 * the Play button. Lists stay short and scannable; the detail is one tap
 * away. A native <details>, so it works with a keyboard and a screen
 * reader, and without JavaScript.
 */

export type RowState = 'done' | 'live' | 'soon';

export type RowWords = {
  play: string;
  again: string;
  soon: string;
};

export function LessonRow({
  item,
  state,
  meta,
  words,
}: {
  item: Lesson;
  state: RowState;
  /** The line under the title: minutes, topic, done. Already worded. */
  meta: string;
  words: RowWords;
}) {
  return (
    <li>
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-3 py-2 hover:bg-raised [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className={`coin grid size-9 shrink-0 place-items-center text-sm font-bold ${state === 'done' ? 'text-ink [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]' : state === 'live' ? 'text-fg-2' : 'text-muted opacity-60'}`}
          >
            {state === 'done' ? '✓' : state === 'live' ? '▶' : '·'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block type-small font-semibold text-fg">
              {item.title}
            </span>
            <span className="block font-mono type-tick text-muted">{meta}</span>
          </span>
          <span
            aria-hidden
            className="shrink-0 text-fg-2 transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <div className="flex flex-col gap-3 px-3 pb-4 pl-15 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-small text-fg-2">{item.practice}</p>
          {state !== 'soon' && item.playAt ? (
            <Link
              href={item.playAt}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-md px-4 type-small font-bold ${state === 'done' ? 'border border-edge bg-raised text-fg' : 'btn-3d bg-gold text-ink'}`}
            >
              {state === 'done' ? words.again : words.play} →
            </Link>
          ) : (
            <span className="shrink-0 self-start rounded-sm border border-line px-2 py-1 font-mono type-tick text-muted uppercase">
              {words.soon}
            </span>
          )}
        </div>
      </details>
    </li>
  );
}
