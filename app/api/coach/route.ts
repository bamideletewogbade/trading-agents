import { z } from 'zod';
import { json, readJson, route, ApiError } from '@/lib/api';
import { BRAND } from '@/lib/brand';
import { capabilities } from '@/lib/capabilities';
import {
  COACH_GATE,
  COACH_HISTORY,
  COACH_MAX_CHARS,
  coachSystem,
  coachUser,
  guardReply,
  type LessonContext,
} from '@/lib/decisions/coach';
import { TIP_LESSONS } from '@/lib/decisions/ask';
import { clean } from '@/lib/decisions/safety';
import { clientOf, decideFor } from '@/lib/decisions/server';
import { askJson } from '@/lib/intelligence/openrouter';
import { searchLessons } from '@/lib/curriculum/search';
import { LESSONS } from '@/content/curriculum';
import { COACH_CHAT as C } from '@/content/coach';

/**
 * The coach: a question in, a short explanation and lessons to practise out.
 *
 * 1. Safety first, through `decideFor` (lib/decisions/coach.ts): a crisis
 *    shows the support card and nothing else; a tip request gets the lessons
 *    on judging a call and a pointer to Signals.
 * 2. Then, when the coach is on and this person hasn't asked too much too
 *    fast, a chat model explains; its lesson ids are checked against live
 *    lessons, and a reply carrying a number it made up is swapped for the
 *    authored guide (rule 1).
 * 3. Anything else, or any failure: the authored guide and the lessons the
 *    keyword search found. The screen always gets an answer.
 */

const input = z.object({
  message: z.string().trim().min(1).max(COACH_MAX_CHARS),
  previousQuestions: z
    .array(z.string().max(COACH_MAX_CHARS))
    .max(20)
    .optional(),
});

type LessonLink = { id: string; title: string; href: string };

function linksFor(ids: readonly string[]): LessonLink[] {
  const seen = new Set<string>();
  const links: LessonLink[] = [];
  for (const id of ids) {
    const item = LESSONS.find((l) => l.id === id);
    if (!item || item.status !== 'live' || !item.playAt || seen.has(id))
      continue;
    seen.add(id);
    links.push({ id, title: item.title, href: item.playAt });
  }
  return links;
}

/* A written reply costs more than a Jev call, so it has its own limit per
   person: a burst of 8, then one every 20 seconds. Per isolate, like the
   gate's; enough to stop a loop or a script running up the bill. */
const BURST = 8;
const REFILL_MS = 20_000;
const buckets = new Map<string, { tokens: number; at: number }>();

function mayWrite(client: string, now = Date.now()): boolean {
  const bucket = buckets.get(client) ?? { tokens: BURST, at: now };
  const earned = Math.floor((now - bucket.at) / REFILL_MS);
  let tokens = Math.min(BURST, bucket.tokens + earned);
  const at = tokens >= BURST ? now : bucket.at + earned * REFILL_MS;
  buckets.delete(client);
  if (tokens <= 0) {
    buckets.set(client, { tokens: 0, at });
    return false;
  }
  tokens -= 1;
  buckets.set(client, { tokens, at });
  while (buckets.size > 5_000) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
  return true;
}

export const POST = route(async (request) => {
  const parsed = input.safeParse(await readJson(request, 16 * 1024));
  if (!parsed.success)
    throw new ApiError(422, 'That isn’t a question we can read.');
  const message = clean(parsed.data.message, COACH_MAX_CHARS);
  if (!message) throw new ApiError(422, 'That isn’t a question we can read.');
  const previous = (parsed.data.previousQuestions ?? [])
    .slice(-COACH_HISTORY.turns)
    .map((q) => clean(q, COACH_HISTORY.chars))
    .filter(Boolean);

  const safety = await decideFor(request, COACH_GATE, { text: message });
  if (safety.verdict === 'crisis')
    return json({ source: 'crisis', text: '', lessons: [] });
  if (safety.verdict === 'tip')
    return json({
      source: 'guide',
      text: C.tip,
      lessons: linksFor([...TIP_LESSONS, 'r1', 'r2']),
      signals: true,
    });

  const matches = searchLessons(message, 3).filter(
    (m) => m.lesson.status === 'live' && m.lesson.playAt,
  );
  const found = linksFor(matches.map((m) => m.lesson.id));
  const top = matches[0]?.lesson;
  const guide = (note?: string) =>
    json({
      source: 'guide',
      text: [
        note,
        top
          ? C.guide(BRAND.name, message.slice(0, 80), top.title)
          : C.guideNone(BRAND.name),
      ]
        .filter(Boolean)
        .join(' '),
      lessons: found,
    });

  if (!capabilities().coach) return guide();
  if (!mayWrite(clientOf(request).client)) return guide(C.busy);

  const context: LessonContext[] = matches.map((m) => ({
    id: m.lesson.id,
    title: m.lesson.title,
    practice: m.lesson.practice,
  }));
  try {
    const reply = await askJson({
      profile: 'coach_fast',
      system: coachSystem(BRAND.name, context),
      user: coachUser(message, previous),
      schema: {
        name: 'coach_reply',
        schema: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            lessonIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['explanation', 'lessonIds'],
          additionalProperties: false,
        },
      },
    });
    const data = reply.data as { explanation?: unknown; lessonIds?: unknown };
    const text =
      typeof data.explanation === 'string'
        ? clean(data.explanation, 1_200)
        : '';
    if (!text || !guardReply(text, [message, ...previous].join(' '), context)) {
      if (text) console.warn('[coach] reply held back by the number guard');
      return guide();
    }
    const ids = Array.isArray(data.lessonIds)
      ? data.lessonIds.filter((id): id is string => typeof id === 'string')
      : [];
    const lessons = linksFor(ids);
    return json({
      source: 'ai',
      text,
      lessons: lessons.length ? lessons : found,
    });
  } catch (error) {
    console.error('[coach]', error);
    return guide();
  }
});
