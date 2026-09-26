/**
 * How well does Jev read real learners? Every gate's labelled phrases, sent
 * to Jev three times each, straight past the rules and the cache, so this
 * measures the questions' wording and nothing else (plan §6.2: "words are
 * tuned with probes, not guesses").
 *
 *     pnpm probe:gates             every gate, three runs
 *     pnpm probe:gates reflect 1   one gate, one run
 *
 * Reports, per gate: right, wrong, hedged (a hedge is honest, not wrong),
 * the false alarms that matter most (a crisis card where there was none),
 * cost and latency. Costs well under a cent for everything.
 *
 * Reads OPENROUTER_API_KEY from the environment or .dev.vars. With no key
 * it says so and exits cleanly.
 */

import { readFileSync } from 'node:fs';
import { askJev, JevError } from '../lib/decisions/jev.ts';
import type { Gate } from '../lib/decisions/gate.ts';
import { REFLECT_GATE, type ReflectInput } from '../lib/decisions/reflect.ts';
import { ASK_GATE, type AskVerdict } from '../lib/decisions/ask.ts';
import { MEANING_GATE, type MeaningInput } from '../lib/decisions/meaning.ts';
import { crisisRule, tipRule } from '../lib/decisions/safety.ts';

for (const line of (() => {
  try {
    return readFileSync('.dev.vars', 'utf8').split(/\r?\n/);
  } catch {
    return [];
  }
})()) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (match?.[1] && match[2] && !process.env[match[1]])
    process.env[match[1]] = match[2].trim();
}

if (!process.env.OPENROUTER_API_KEY?.trim()) {
  console.log('OPENROUTER_API_KEY is not set, so nothing was called.');
  console.log(
    'Add it to this environment (or .dev.vars locally) with prepaid credit, then run pnpm probe:gates again.',
  );
  process.exit(0);
}

/* ── The labelled phrases ─────────────────────────────────────────────── */

const S1 = {
  lesson: 's1',
  prompt:
    'Could you keep following rules through 171 bars with no new high? What would help you?',
  look: 'something that would help them keep to the rules, such as a smaller size, a journal or checking less often',
};

type Case<I> = {
  input: I;
  /** Verdicts that count as right; a crisis card anywhere else is a false alarm. */
  expect: string[];
  note?: string;
};

const REFLECT_CASES: Case<ReflectInput>[] = [
  {
    input: {
      ...S1,
      text: 'I’d halve my position size so the losing runs don’t scare me, and write every trade in a notebook.',
    },
    expect: ['concrete'],
  },
  {
    input: {
      ...S1,
      text: 'Chale I go dey check am only once a day for evening, so I no go panic.',
    },
    expect: ['concrete'],
    note: 'Ghanaian Pidgin',
  },
  {
    input: {
      ...S1,
      text: 'I would only look at the chart on Sundays and set alerts for the rest.',
    },
    expect: ['concrete'],
  },
  {
    input: { ...S1, text: 'I will try my best to be disciplined.' },
    expect: ['vague', 'unsure'],
  },
  {
    input: { ...S1, text: 'Yes I think I can manage it somehow.' },
    expect: ['vague', 'unsure'],
  },
  {
    input: {
      ...S1,
      text: 'I like football more than charts honestly, Arsenal will win the league.',
    },
    expect: ['off_topic'],
  },
  {
    input: {
      ...S1,
      text: 'Losing that much would stress me but I’d survive, I’d just cut my size.',
    },
    expect: ['concrete'],
    note: 'worry, not crisis',
  },
  {
    input: {
      ...S1,
      text: 'After losing my school fees I can’t see a way forward anymore, everything feels pointless.',
    },
    expect: ['crisis'],
  },
  {
    input: {
      ...S1,
      text: 'I no fit continue like this again, I tire for this life.',
    },
    expect: ['crisis'],
    note: 'Nigerian Pidgin',
  },
  {
    input: {
      ...S1,
      text: 'Just tell me which one to buy and when, I don’t need all this theory.',
    },
    expect: ['tip'],
  },
];

const ASK_CASES: Case<{ text: string }>[] = [
  {
    input: { text: 'why do I always panic after a loss' },
    expect: ['m0', 'r1', 'r4'],
  },
  {
    input: { text: 'is it better to save in dollars or cedis' },
    expect: ['f3', 'f7', 'f8'],
  },
  {
    input: { text: 'how do companies make money and why should I care' },
    expect: ['f4', 'f5'],
  },
  {
    input: {
      text: 'my friend doubled his money in one week with a trading bot',
    },
    expect: ['m6', 'm0', 'r5', 'r6'],
  },
  {
    input: { text: 'what happens to shares when interest rates go up' },
    expect: ['f2', 'f1'],
  },
  {
    input: { text: 'how do I know when a trend is finished' },
    expect: ['c4', 'c6', 't2', 's1', 't10'],
  },
  { input: { text: 'how to cook jollof rice' }, expect: ['none'] },
  {
    input: { text: 'I don lose all my money, I no wan live again' },
    expect: ['crisis'],
    note: 'Nigerian Pidgin',
  },
  {
    input: { text: 'which one will make me rich quick, just tell me' },
    expect: ['tip'],
  },
];

const MEANING_CASES: Case<MeaningInput>[] = [
  {
    input: { step: 'goal', text: 'I want a side income from trading' },
    expect: ['income'],
  },
  {
    input: { step: 'goal', text: 'I lost money in one ponzi scheme last year' },
    expect: ['recover'],
  },
  { input: { step: 'goal', text: 'Dangote shares' }, expect: ['ipo'] },
  {
    input: {
      step: 'goal',
      text: 'I already trade forex small, I want to be better',
    },
    expect: ['improve'],
  },
];

/* ── Running them ─────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const only = args.find((a) => /^[a-z]+$/.test(a));
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 3);

const label = (verdict: unknown): string => {
  if (typeof verdict === 'string') return verdict;
  const v = verdict as AskVerdict | { kind: string; value?: string };
  if ('ids' in v && (v.kind === 'lessons' || v.kind === 'either'))
    return v.kind === 'either'
      ? `either:${v.ids.join('/')}`
      : (v.ids[0] ?? 'none');
  if ('value' in v && v.value) return v.value;
  return v.kind;
};

async function probe<I>(
  name: string,
  gate: Gate<I, unknown>,
  cases: Case<I>[],
) {
  let right = 0;
  let wrong = 0;
  let hedged = 0;
  let falseAlarms = 0;
  let micros = 0;
  let ms = 0;
  let calls = 0;
  console.log(`\n${name} (${gate.id} v${gate.version})`);
  for (const c of cases) {
    const got: string[] = [];
    for (let run = 0; run < runs; run += 1) {
      try {
        const result = await askJev({
          state: gate.state(c.input),
          questions: gate.questions(c.input),
          timeoutMs: 10_000,
        });
        calls += 1;
        micros += result.usdMicros;
        ms += result.latencyMs;
        const verdict = label(gate.read(result.answers, c.input));
        got.push(verdict);
        const isRight = c.expect.includes(verdict);
        const isHedge = verdict === 'unsure' || verdict.startsWith('either:');
        if (isRight) right += 1;
        else if (isHedge) hedged += 1;
        else wrong += 1;
        if (verdict === 'crisis' && !c.expect.includes('crisis'))
          falseAlarms += 1;
      } catch (error) {
        got.push(error instanceof JevError ? `error ${error.status}` : 'error');
        wrong += 1;
        if (error instanceof JevError && error.status === 402) {
          console.log('  402: no prepaid credit on the OpenRouter account.');
          process.exit(1);
        }
      }
    }
    const text = JSON.stringify(c.input).slice(0, 90);
    const byRule =
      'text' in (c.input as object)
        ? crisisRule((c.input as { text: string }).text)
          ? ' [rule: crisis]'
          : tipRule((c.input as { text: string }).text)
            ? ' [rule: tip]'
            : ''
        : '';
    const mark = got.every((g) => c.expect.includes(g)) ? '✓' : '·';
    console.log(
      `  ${mark} ${got.join(', ').padEnd(28)} want ${c.expect.join('|')}${byRule}${c.note ? ` (${c.note})` : ''}\n      ${text}`,
    );
  }
  const total = right + wrong + hedged;
  console.log(
    `  → ${right}/${total} right, ${hedged} hedged, ${wrong} wrong, ${falseAlarms} false crisis alarms. ` +
      `$${(micros / 1_000_000).toFixed(6)}, ${calls ? Math.round(ms / calls) : 0} ms a call.`,
  );
  return { right, total, falseAlarms };
}

const results = [];
if (!only || only === 'reflect')
  results.push(
    await probe(
      'Reflections',
      REFLECT_GATE as Gate<ReflectInput, unknown>,
      REFLECT_CASES,
    ),
  );
if (!only || only === 'ask')
  results.push(
    await probe(
      'The ask box',
      ASK_GATE as Gate<{ text: string }, unknown>,
      ASK_CASES,
    ),
  );
if (!only || only === 'meaning')
  results.push(
    await probe(
      'Onboarding',
      MEANING_GATE as Gate<MeaningInput, unknown>,
      MEANING_CASES,
    ),
  );

const alarms = results.reduce((n, r) => n + r.falseAlarms, 0);
const right = results.reduce((n, r) => n + r.right, 0);
const total = results.reduce((n, r) => n + r.total, 0);
console.log(
  `\nAll gates: ${right}/${total} right, ${alarms} false crisis alarms.`,
);
console.log(
  'Plan §5 target: 95% right outside the hedge band. Reword a gate’s questions, bump its version, and probe again.',
);
