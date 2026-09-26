import { z } from 'zod';
import { json, readJson, route, ApiError } from '@/lib/api';
import { ASK_GATE, ASK_MAX_CHARS } from '@/lib/decisions/ask';
import { clean } from '@/lib/decisions/safety';
import { decideFor } from '@/lib/decisions/server';

/**
 * The ask box, when the keywords on the phone found nothing: Jev picks from
 * the live lessons (lib/decisions/ask.ts). Answers lesson ids, never words;
 * the box already has every lesson's title.
 */

const input = z.object({ text: z.string().max(2_000) });

export const POST = route(async (request) => {
  const parsed = input.safeParse(await readJson(request, 4 * 1024));
  if (!parsed.success)
    throw new ApiError(422, 'That isn’t something we can read.');
  const text = clean(parsed.data.text, ASK_MAX_CHARS);
  if (!text) throw new ApiError(422, 'There’s nothing to look for yet.');
  const decision = await decideFor(request, ASK_GATE, { text });
  return json(decision.verdict);
});
