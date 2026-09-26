import { z } from 'zod';
import { LESSONS } from '@/content/curriculum';
import { LESSON_DEFS } from '@/content/lessons';
import { json, readJson, route, ApiError } from '@/lib/api';
import { clean } from '@/lib/decisions/safety';
import { REFLECT_GATE, REFLECT_MAX_CHARS } from '@/lib/decisions/reflect';
import { decideFor } from '@/lib/decisions/server';
import type { Beat } from '@/lib/lessons/types';

/**
 * A learner's answer to a lesson's reflect question. The question, and
 * what a good answer names, come from the server's own copy of the lesson,
 * by position: a browser can't rewrite what it's being judged against.
 * Answers a verdict; the words for it live in content/coach.ts.
 */

const input = z.object({
  lesson: z.string().max(12),
  beat: z.number().int().min(0).max(60),
  text: z.string().max(4_000),
});

// A lesson's beats are the same every time: build each once per isolate.
const built = new Map<string, Beat[]>();
function beatsOf(id: string): Beat[] | null {
  const def = LESSON_DEFS[id];
  const live = LESSONS.some((l) => l.id === id && l.status === 'live');
  if (!def || !live) return null;
  const cached = built.get(id);
  if (cached) return cached;
  const beats = def.beats();
  built.set(id, beats);
  return beats;
}

export const POST = route(async (request) => {
  const parsed = input.safeParse(await readJson(request, 8 * 1024));
  if (!parsed.success)
    throw new ApiError(422, 'That isn’t something we can read.');
  const beat = beatsOf(parsed.data.lesson)?.[parsed.data.beat];
  if (beat?.kind !== 'reflect')
    throw new ApiError(404, 'That lesson has no question there.');
  const text = clean(parsed.data.text, REFLECT_MAX_CHARS);
  if (!text) throw new ApiError(422, 'There’s nothing to read yet.');
  const decision = await decideFor(request, REFLECT_GATE, {
    lesson: parsed.data.lesson,
    prompt: beat.prompt,
    look: beat.look,
    text,
  });
  return json({ verdict: decision.verdict });
});
