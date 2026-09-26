import Link from 'next/link';
import { LESSON_DEFS } from '@/content/lessons';
import { PLAYER } from '@/content/lessons/widgets';
import { LESSONS } from '@/content/curriculum';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';

/**
 * A lesson, by id. Its beats are built here, on the server, from the
 * lesson's engines, and handed to the player as plain data: the phone gets
 * this lesson's words and numbers without downloading every lesson or the
 * engines that only write words. Anything not yet playable says so and
 * points to the ones that are, rather than a bare 404.
 */

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const lesson = LESSONS.find((item) => item.id === id);
  return { title: lesson?.title ?? PLAYER.notFound.title };
}

export default async function LessonPage({ params }: Params) {
  const { id } = await params;
  const def = LESSON_DEFS[id];
  const playable =
    Boolean(def) &&
    LESSONS.some((item) => item.id === id && item.status === 'live');
  if (!def || !playable)
    return (
      <div className="mx-auto max-w-[520px] px-4 py-20 text-center">
        <h1 className="type-display text-fg">{PLAYER.notFound.title}</h1>
        <p className="mt-3 type-body text-fg-2">{PLAYER.notFound.body}</p>
        <Link
          href="/lessons"
          className="btn-3d mt-6 inline-flex min-h-12 items-center rounded-md bg-gold px-6 type-body font-semibold text-ink"
        >
          {PLAYER.notFound.cta}
        </Link>
      </div>
    );
  return (
    <LessonPlayer
      key={id}
      id={id}
      beats={def.beats()}
      takeaways={def.takeaways}
    />
  );
}
