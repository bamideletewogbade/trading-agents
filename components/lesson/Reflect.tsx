'use client';

import { useState } from 'react';
import { REFLECT } from '@/content/coach';
import { SupportCard } from '@/components/coach/SupportCard';
import { asksAgain, type ReflectVerdict } from '@/lib/decisions/reflect';
import { markCare, saveNote } from '@/lib/client/notes';

/**
 * A lesson's reflect question, answered in the learner's own words. Saving
 * keeps the answer on the phone (lib/client/notes.ts) and asks the server
 * for a reply that fits (app/api/reflect): praise when it's concrete, one
 * narrower question when it's vague, the support card if it sounds like
 * crisis. The reply is always an authored line (content/coach.ts).
 *
 * Nothing here blocks the lesson: Continue works whether or not they
 * answer, and a slow or failed reply just says "saved".
 */

const VERDICTS: readonly ReflectVerdict[] = [
  'crisis',
  'tip',
  'short',
  'off_topic',
  'concrete',
  'vague',
  'unsure',
  'kept',
];

async function ask(
  lesson: string,
  beat: number,
  text: string,
): Promise<ReflectVerdict> {
  try {
    const response = await fetch('/api/reflect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lesson, beat, text }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return 'kept';
    const body = (await response.json()) as { verdict?: unknown };
    return VERDICTS.includes(body.verdict as ReflectVerdict)
      ? (body.verdict as ReflectVerdict)
      : 'kept';
  } catch {
    return 'kept';
  }
}

export function Reflect({
  lesson,
  beat,
  prompt,
  placeholder,
  followUp,
}: {
  lesson: string;
  beat: number;
  prompt: string;
  placeholder: string;
  followUp?: string;
}) {
  const [text, setText] = useState('');
  const [round, setRound] = useState(0);
  const [verdict, setVerdict] = useState<ReflectVerdict | null>(null);
  const [pending, setPending] = useState(false);

  // One more try after a vague, unclear, too-short or off-topic answer.
  const retry =
    verdict !== null && (asksAgain(verdict) || verdict === 'off_topic');
  const again = retry && round === 1;
  const done = round >= 2 || (verdict !== null && !retry);

  async function submit() {
    const words = text.trim();
    if (!words || pending) return;
    setPending(true);
    saveNote({ lesson, prompt, text: words });
    const next = await ask(lesson, beat, words);
    if (next === 'crisis') markCare();
    setVerdict(next);
    setRound((r) => r + 1);
    setPending(false);
  }

  const reply =
    verdict === null || verdict === 'crisis'
      ? null
      : round >= 2 && retry
        ? REFLECT.second
        : REFLECT.reply[verdict];

  return (
    <div className="mt-4 space-y-3">
      <label className="block">
        <span className="type-title text-fg">{prompt}</span>
        <textarea
          rows={4}
          value={text}
          maxLength={600}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          disabled={pending || done}
          className="mt-3 w-full rounded-md border border-edge bg-panel p-3 type-body text-fg outline-none focus:border-gold disabled:opacity-70"
        />
      </label>
      {reply ? (
        <p
          aria-live="polite"
          className="animate-bubble-in rounded-lg rounded-tl-sm border border-line bg-raised px-3 py-2 type-body text-fg"
        >
          {reply}
        </p>
      ) : null}
      {again && followUp && verdict !== 'off_topic' ? (
        <p className="type-small text-gold">{followUp}</p>
      ) : null}
      {verdict === 'crisis' ? <SupportCard /> : null}
      {!done ? (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!text.trim() || pending}
          className="btn-3d min-h-12 w-full rounded-lg border border-edge bg-raised px-4 type-small font-semibold text-fg [--depth:var(--color-line)] disabled:opacity-50"
        >
          {pending
            ? REFLECT.saving
            : round === 0
              ? REFLECT.save
              : REFLECT.saveAgain}
        </button>
      ) : null}
    </div>
  );
}
