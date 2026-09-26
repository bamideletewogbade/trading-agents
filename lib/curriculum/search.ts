/**
 * The open-ended box: someone types what they want to understand, in their
 * own words, and gets the lessons that teach it.
 *
 * Deterministic on purpose. It composes from the registered curriculum and
 * never invents a lesson (CLAUDE.md rule 2), and it answers instantly on a
 * slow phone. When the coach is live, a query this finds nothing for can go
 * to Jev as a one-of question over the same lesson ids; the contract (a list
 * of lesson ids) doesn't change.
 *
 * Pure: `pnpm check` runs it under plain Node.
 */

import { LESSONS, TOPICS, type Lesson } from '../../content/curriculum.ts';

const STOP = new Set(
  'a an and are be can do does for how i in is it me my of on or should that the this to understand want what when where which why with you your'.split(
    ' ',
  ),
);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%/ ]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

export type Match = { lesson: Lesson; score: number };

/**
 * Lessons for a query, best first, at most `limit`. A keyword phrase that
 * appears whole in the query scores highest ("stop loss" beats "stop"), then
 * words in the title, then words in what you do in the lesson. Live lessons
 * win ties, so the first thing offered is something you can play now.
 */
export function searchLessons(query: string, limit = 3): Match[] {
  const text = ` ${words(query).join(' ')} `;
  const terms = words(query);
  if (terms.length === 0) return [];
  const scored: Match[] = [];
  for (const lesson of LESSONS) {
    let score = 0;
    for (const keyword of lesson.keywords ?? []) {
      if (text.includes(` ${words(keyword).join(' ')} `))
        score += 6 * Math.max(1, words(keyword).length);
    }
    const title = new Set(words(lesson.title));
    const practice = new Set(words(lesson.practice));
    const topic = new Set(words(TOPICS[lesson.topic].label));
    for (const term of terms) {
      if (title.has(term)) score += 4;
      if (practice.has(term)) score += 1;
      if (topic.has(term)) score += 1;
    }
    if (score > 0) scored.push({ lesson, score });
  }
  const statusRank = { live: 0, next: 1, planned: 2 } as const;
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        statusRank[a.lesson.status] - statusRank[b.lesson.status],
    )
    .slice(0, limit);
}
