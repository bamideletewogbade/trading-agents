/**
 * Chat models through OpenRouter, for the only two jobs that write prose:
 * the coach and the weekly analyst (plan §6.3). Everything that *decides*
 * goes to Jev instead (lib/decisions/jev.ts).
 *
 * Callers name a **profile** (what the job is), never a model. Models are
 * configuration, pinned, each profile with a fallback list that OpenRouter
 * tries in order, so a silent model update can't change how we teach and an
 * outage at one provider isn't an outage for us. Every reply must be JSON
 * matching a schema; anything else is an error, never "best effort" text.
 *
 * Pattern from Kanea Studio's `askForJson` and Aksen Labs' routing profiles.
 */

import { usdMicros } from '../core/money.ts';

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type Profile = 'coach_fast' | 'coach_deep' | 'extract';

type ProfileConfig = {
  models: readonly string[];
  maxTokens: number;
  temperature: number;
  reasoning: 'minimal' | 'low' | 'medium';
  timeoutMs: number;
};

/*
 * Candidates are what earlier projects measured, not guesses: Kanea found
 * Gemini 3.8 Flash fast and cheap for structured replies (24 Sep 2026), and
 * Aksen's auto-router picked it for conversation (10 Sep 2026). Re-measure
 * with `pnpm probe:openrouter` before relying on any of them, and override
 * per profile with OPENROUTER_MODELS_<PROFILE>="a,b".
 */
export const PROFILES: Record<Profile, ProfileConfig> = {
  coach_fast: {
    models: ['google/gemini-3.8-flash', 'google/gemini-3.7-flash'],
    maxTokens: 500,
    temperature: 0.4,
    reasoning: 'minimal',
    timeoutMs: 12_000,
  },
  coach_deep: {
    models: ['anthropic/claude-sonnet-5', 'google/gemini-3.8-flash'],
    maxTokens: 800,
    temperature: 0.4,
    reasoning: 'low',
    timeoutMs: 25_000,
  },
  extract: {
    models: ['google/gemini-3.8-flash', 'google/gemini-3.7-flash'],
    maxTokens: 300,
    temperature: 0,
    reasoning: 'minimal',
    timeoutMs: 10_000,
  },
};

export function modelsFor(profile: Profile): string[] {
  const override =
    process.env[`OPENROUTER_MODELS_${profile.toUpperCase()}`]?.trim();
  const models = override
    ? override
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean)
    : [...PROFILES[profile].models];
  // OpenRouter's `models` fallback list; three is our own cap, not theirs.
  return models.slice(0, 3);
}

export class ChatError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ChatError';
    this.status = status;
  }
}

export type JsonReply = {
  data: unknown;
  model: string;
  usdMicros: number;
  ms: number;
};

export async function askJson(input: {
  profile: Profile;
  system: string;
  user: string;
  schema: { name: string; schema: Record<string, unknown> };
  fetchImpl?: typeof fetch;
}): Promise<JsonReply> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new ChatError(503, 'OPENROUTER_API_KEY is not set.');
  const config = PROFILES[input.profile];
  const models = modelsFor(input.profile);
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  let response: Response;
  try {
    response = await (input.fetchImpl ?? fetch)(CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5177',
        'X-Title': 'Sika Lab',
      },
      body: JSON.stringify({
        model: models[0],
        models,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        reasoning: { effort: config.reasoning },
        response_format: {
          type: 'json_schema',
          json_schema: { ...input.schema, strict: true },
        },
        usage: { include: true },
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
      }),
    });
  } catch {
    throw new ChatError(
      controller.signal.aborted ? 504 : 502,
      controller.signal.aborted
        ? 'The model took too long.'
        : 'OpenRouter could not be reached.',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 402)
    throw new ChatError(503, 'No prepaid credit on the OpenRouter account.');
  const body = (await response.json().catch(() => null)) as {
    model?: string;
    error?: { message?: string };
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    usage?: { cost?: number };
  } | null;
  if (!response.ok || !body)
    throw new ChatError(
      502,
      `OpenRouter returned ${response.status}: ${body?.error?.message ?? 'no body'}`,
    );

  const choice = body.choices?.[0];
  if (choice?.finish_reason === 'length')
    throw new ChatError(502, 'The reply was cut off.');
  let data: unknown;
  try {
    // Strict schemas come back bare; strip a code fence if a fallback model adds one.
    data = JSON.parse(
      (choice?.message?.content ?? '').replace(/^```(?:json)?\s*|\s*```$/g, ''),
    );
  } catch {
    throw new ChatError(502, 'The model did not return JSON.');
  }
  return {
    data,
    model: body.model ?? models[0] ?? 'unknown',
    usdMicros: usdMicros(body.usage?.cost ?? 0),
    ms: Date.now() - started,
  };
}
