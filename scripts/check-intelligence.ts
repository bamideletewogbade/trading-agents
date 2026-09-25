/**
 * Assertions over the intelligence layer, with no network: the hedge band,
 * the numeric guard, and the exact requests the OpenRouter clients send
 * (a mocked fetch stands in for OpenRouter).
 *
 *     pnpm check        (runs this after the core and engine checks)
 *
 * The live counterpart, which spends a fraction of a cent, is
 * `pnpm probe:openrouter`.
 */

import { deepStrictEqual, equal, ok, rejects } from 'node:assert/strict';
import { readChoice, readYesNo } from '../lib/decisions/read.ts';
import { askJev, JEV_MODEL } from '../lib/decisions/jev.ts';
import { askJson, modelsFor } from '../lib/intelligence/openrouter.ts';
import {
  allowedNumbers,
  checkNumbers,
  numbersIn,
} from '../lib/intelligence/guard.ts';
import { payday } from '../lib/experiences/payday.ts';
import { PAYDAY } from '../content/scenarios/payday.ts';

let passed = 0;
const failures: string[] = [];

async function check(
  name: string,
  run: () => void | Promise<void>,
): Promise<void> {
  try {
    await run();
    passed += 1;
  } catch (error) {
    failures.push(
      `✗ ${name}\n    ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
    );
  }
}

/** A fetch that records what it was asked and answers with `reply`. */
function mockFetch(status: number, reply: unknown) {
  const calls: { url: string; body: string }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: typeof init.body === 'string' ? init.body : '' });
    return new Response(JSON.stringify(reply), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

/* ── The hedge band ────────────────────────────────────────────────────── */

await check('0.35–0.65 is hedged, never a yes or a no', () => {
  equal(readYesNo({ type: 'noul', noul: 0.5 }).kind, 'hedged');
  equal(readYesNo({ type: 'noul', noul: 0.64 }).kind, 'hedged');
  equal(readYesNo({ type: 'noul', noul: 0.36 }).kind, 'hedged');
  deepStrictEqual(readYesNo({ type: 'noul', noul: 0.9 }), {
    kind: 'sure',
    value: true,
    confidence: 0.9,
  });
  equal(readYesNo({ type: 'noul', noul: 0.1 }).kind, 'sure');
  equal(readYesNo({ type: 'noul' }).kind, 'missing');
  equal(readYesNo(undefined).kind, 'missing');
});

await check(
  'a choice is hedged unless its option is clearly ahead, and unknown options are missing',
  () => {
    equal(
      readChoice({ type: 'choice', choice: 'a', confidence: 0.6 }, ['a', 'b'])
        .kind,
      'hedged',
    );
    equal(
      readChoice({ type: 'choice', choice: 'a', confidence: 0.8 }, ['a', 'b'])
        .kind,
      'sure',
    );
    equal(
      readChoice({ type: 'choice', choice: 'z', confidence: 0.99 }, ['a', 'b'])
        .kind,
      'missing',
    );
  },
);

/* ── The numeric guard ─────────────────────────────────────────────────── */

const GH = PAYDAY.GH.config;
const EXAMPLE = {
  rent: 90_000,
  family: 40_000,
  savings: 20_000,
  scheme: 30_000,
  spend: 120_000,
};
let state = payday.init(GH, 'pilot');
for (const action of [
  { type: 'allocate', split: EXAMPLE },
  { type: 'predict', days: 90 },
  { type: 'play' },
] as const)
  state = payday.step(state, action).state;
const facts = payday.facts(state);

await check('numbers are read the way people write them', () => {
  deepStrictEqual(numbersIn('GH₵1,250.50 and 60% at 20× for 0.4 days'), [
    '1250.5',
    '60',
    '20',
    '0.4',
  ]);
});

await check('the coach may repeat engine numbers', () => {
  const line =
    'The GH₵600 repair left you short, so a loan app lent you GH₵400 and charged GH₵60. You owe GH₵460.';
  deepStrictEqual(checkNumbers(line, allowedNumbers(facts)), {
    ok: true,
    unknown: [],
  });
});

await check('the coach may not invent one', () => {
  const line = 'Most people keep GH₵2,000 aside, about 45 days of cover.';
  deepStrictEqual(checkNumbers(line, allowedNumbers(facts)), {
    ok: false,
    unknown: ['2000', '45'],
  });
});

await check('small counts and the learner’s own numbers are allowed', () => {
  ok(checkNumbers('Let’s try two changes, or 3.', allowedNumbers(facts)).ok);
  ok(
    checkNumbers(
      'You said 250 would be enough.',
      allowedNumbers(facts, 'I think 250 is enough'),
    ).ok,
  );
  ok(!checkNumbers('You said 250 would be enough.', allowedNumbers(facts)).ok);
});

/* ── The clients send exactly what OpenRouter expects ──────────────────── */

process.env.OPENROUTER_API_KEY = 'sk-or-test-not-a-real-key';

await check(
  'Jev goes to the alpha Decisions endpoint, pinned, and reads answers',
  async () => {
    const { impl, calls } = mockFetch(200, {
      model: JEV_MODEL,
      answers: { right: { type: 'noul', noul: 0.91 } },
      usage: { cost: 0.00004 },
    });
    const result = await askJev({
      state: { said: 'leverage made the loss bigger' },
      questions: {
        right: {
          type: 'noul',
          instructions: 'Is it right?',
          criteria: { true: 'yes', false: 'no' },
        },
      },
      fetchImpl: impl,
    });
    equal(calls[0]?.url, 'https://openrouter.ai/api/alpha/decisions');
    equal(JSON.parse(calls[0]?.body ?? '{}').model, 'typesafe/jev-1.13');
    equal(result.answers.right?.noul, 0.91);
    equal(result.usdMicros, 40);
  },
);

await check(
  'no prepaid credit is named as such, not as a model error',
  async () => {
    const { impl } = mockFetch(402, { error: { message: 'Payment required' } });
    await rejects(
      askJev({ state: {}, questions: {}, fetchImpl: impl }),
      /prepaid credit/,
    );
    await rejects(
      askJson({
        profile: 'coach_fast',
        system: 's',
        user: 'u',
        schema: { name: 'x', schema: {} },
        fetchImpl: impl,
      }),
      /prepaid credit/,
    );
  },
);

await check(
  'chat asks for strict JSON with the profile’s fallbacks, and refuses prose',
  async () => {
    const { impl, calls } = mockFetch(200, {
      model: 'google/gemini-3.8-flash',
      choices: [{ message: { content: '{"say":"hi"}' } }],
      usage: { cost: 0.0002 },
    });
    const reply = await askJson({
      profile: 'coach_fast',
      system: 's',
      user: 'u',
      schema: { name: 'turn', schema: { type: 'object' } },
      fetchImpl: impl,
    });
    const sent = JSON.parse(calls[0]?.body ?? '{}');
    deepStrictEqual(sent.models, modelsFor('coach_fast'));
    equal(sent.response_format.json_schema.strict, true);
    deepStrictEqual(reply.data, { say: 'hi' });
    equal(reply.usdMicros, 200);
    const prose = mockFetch(200, {
      choices: [{ message: { content: 'Sure! Here is my answer.' } }],
    });
    await rejects(
      askJson({
        profile: 'coach_fast',
        system: 's',
        user: 'u',
        schema: { name: 'x', schema: {} },
        fetchImpl: prose.impl,
      }),
      /did not return JSON/,
    );
    const cut = mockFetch(200, {
      choices: [{ message: { content: '{"say":' }, finish_reason: 'length' }],
    });
    await rejects(
      askJson({
        profile: 'coach_fast',
        system: 's',
        user: 'u',
        schema: { name: 'x', schema: {} },
        fetchImpl: cut.impl,
      }),
      /cut off/,
    );
  },
);

await check(
  'a model list can be overridden per profile, capped at three',
  () => {
    process.env.OPENROUTER_MODELS_EXTRACT = 'a/one, b/two ,c/three,d/four';
    deepStrictEqual(modelsFor('extract'), ['a/one', 'b/two', 'c/three']);
    delete process.env.OPENROUTER_MODELS_EXTRACT;
  },
);

delete process.env.OPENROUTER_API_KEY;

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ intelligence: ${passed} checks passed (no network).`);
