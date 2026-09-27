/**
 * Where a learner is on the path: the next lesson to play and the stage it
 * sits in. The desk and the path both ask here, so they never disagree.
 *
 * The next lesson is the first of their placement lessons not yet done,
 * then the first playable lesson from their starting stage onwards, then
 * any. Someone who skipped the chat starts at the very first lesson.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { STAGES, lesson } from '../../content/curriculum.ts';

export function nextLesson(
  completed: readonly string[],
  placement: { stage: number; lessons: readonly string[] } | null,
): string | null {
  const start = placement?.stage ?? 0;
  const order = [
    ...(placement?.lessons ?? []),
    ...STAGES.slice(start).flatMap((s) => [...s.lessons]),
    ...STAGES.flatMap((s) => [...s.lessons]),
  ];
  return (
    order.find(
      (id) => !completed.includes(id) && lesson(id).status === 'live',
    ) ?? null
  );
}

/** The stage holding `id`, or the placement's stage when there's no next lesson. */
export function stageOf(id: string | null, fallback = 0): number {
  const found = STAGES.findIndex(
    (stage) => id !== null && (stage.lessons as readonly string[]).includes(id),
  );
  return found === -1 ? fallback : found;
}
