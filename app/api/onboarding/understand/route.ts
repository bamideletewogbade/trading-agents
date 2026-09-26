import { z } from 'zod';
import { askJev, JevError, UNTRUSTED } from '@/lib/decisions/jev';
import { readChoice } from '@/lib/decisions/read';
import { json, readJson, route, ApiError } from '@/lib/api';
import { capabilities } from '@/lib/capabilities';
import { JEV_OPTIONS, type Step } from '@/lib/onboarding/flow';

/**
 * When the onboarding's plain patterns can't read an answer, the screen asks
 * here. Jev picks one of the step's fixed options (CLAUDE.md rule 3); a
 * hedged pick (0.35–0.65) comes back as "unsure", and the coach asks the
 * learner a narrower question instead of guessing. Without Jev, always
 * "unavailable", which the screen treats the same way.
 */

const input = z.object({
  step: z.enum(Object.keys(JEV_OPTIONS) as [Step, ...Step[]]),
  text: z.string().trim().min(1).max(280),
});

export const POST = route(async (request) => {
  const parsed = input.safeParse(await readJson(request, 2 * 1024));
  if (!parsed.success)
    throw new ApiError(422, 'That isn’t something we can read.');
  if (!capabilities().jev) return json({ kind: 'unavailable' });
  const { step, text } = parsed.data;
  const options = JEV_OPTIONS[step] ?? {};
  try {
    const result = await askJev({
      state: { question: step, answer: text },
      questions: {
        meaning: {
          type: 'choice',
          instructions: `A new learner answered an onboarding question in their own words (state.answer). Which option best describes what they meant? ${UNTRUSTED}`,
          criteria: options,
        },
      },
      timeoutMs: 5_000,
    });
    const read = readChoice(result.answers.meaning, Object.keys(options));
    return json(
      read.kind === 'sure'
        ? { kind: 'sure', value: read.value }
        : { kind: 'unsure' },
    );
  } catch (error) {
    if (error instanceof JevError) return json({ kind: 'unavailable' });
    throw error;
  }
});
