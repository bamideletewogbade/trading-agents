import { LESSON_DEFS } from '@/content/lessons';
import { LESSONS } from '@/content/curriculum';
import { json, route } from '@/lib/api';
import {
  lessonOfKey,
  questionKey,
  type PracticeQuestion,
} from '@/lib/progress/review';

/**
 * Questions for a practice round, by key (lib/progress/review.ts): built
 * here from the lessons, exactly as the lesson page builds them, so the
 * phone never downloads every lesson to practise five questions. A key
 * whose question no longer exists (the lesson was reworded) is left out,
 * and the round simply skips it. Reads nothing about the learner.
 */

const KEY = /^[a-z0-9]{1,8}:[0-9a-f]{8}$/;

export const GET = route(async (request) => {
  const keys = (new URL(request.url).searchParams.get('keys') ?? '')
    .split(',')
    .filter((key) => KEY.test(key))
    .slice(0, 10);
  const built = new Map<string, PracticeQuestion[]>();
  const questions: PracticeQuestion[] = [];
  for (const key of keys) {
    const lesson = lessonOfKey(key);
    const def = LESSON_DEFS[lesson];
    const meta = LESSONS.find((item) => item.id === lesson);
    if (!def || !meta) continue;
    if (!built.has(lesson))
      built.set(
        lesson,
        def.beats().flatMap((beat) =>
          beat.kind === 'choice'
            ? [
                {
                  key: questionKey(lesson, beat.prompt),
                  lesson,
                  lessonTitle: meta.title,
                  prompt: beat.prompt,
                  options: beat.options,
                },
              ]
            : [],
        ),
      );
    const found = built.get(lesson)?.find((q) => q.key === key);
    if (found) questions.push(found);
  }
  return json({ questions });
});
