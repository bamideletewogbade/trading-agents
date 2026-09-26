import type { LessonDef } from '../../lib/lessons/types.ts';
import { STAGE_1 } from './stage1.ts';
import { STAGE_2 } from './stage2.ts';
import { STAGE_3 } from './stage3.ts';

/**
 * Every lesson the player can play, by id. The curriculum
 * (content/curriculum.ts) says where each sits and whether it's live;
 * scripts/check-lessons.ts proves the two agree.
 */
export const LESSON_DEFS: Record<string, LessonDef> = {
  ...STAGE_1,
  ...STAGE_2,
  ...STAGE_3,
};

export { WIDGET_NAMES } from '../../lib/lessons/types.ts';
