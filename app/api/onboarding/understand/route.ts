import { z } from 'zod';
import { json, readJson, route, ApiError } from '@/lib/api';
import { MEANING_GATE, MEANING_MAX_CHARS } from '@/lib/decisions/meaning';
import { clean } from '@/lib/decisions/safety';
import { decideFor } from '@/lib/decisions/server';
import { JEV_OPTIONS, type Step } from '@/lib/onboarding/flow';

/**
 * When the onboarding's plain patterns can't read an answer, the screen asks
 * here. Jev picks one of the step's fixed options (CLAUDE.md rule 3); a
 * hedged pick (0.35–0.65) comes back as "unsure", and the coach asks the
 * learner a narrower question instead of guessing. Without Jev, or while
 * the breaker holds calls back, "unavailable", which the screen treats the
 * same way (lib/decisions/meaning.ts).
 */

const input = z.object({
  step: z.enum(Object.keys(JEV_OPTIONS) as [Step, ...Step[]]),
  text: z.string().trim().min(1).max(MEANING_MAX_CHARS),
});

export const POST = route(async (request) => {
  const parsed = input.safeParse(await readJson(request, 2 * 1024));
  if (!parsed.success)
    throw new ApiError(422, 'That isn’t something we can read.');
  const text = clean(parsed.data.text, MEANING_MAX_CHARS);
  const decision = await decideFor(request, MEANING_GATE, {
    step: parsed.data.step,
    text,
  });
  return json(decision.verdict);
});
