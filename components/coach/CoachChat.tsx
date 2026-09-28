'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { COACH_CHAT as C } from '@/content/coach';
import { BRAND } from '@/lib/brand';
import { markCare } from '@/lib/client/notes';
import { sessionHeaders } from '@/lib/client/session';
import { SupportCard } from './SupportCard';

type Reply = {
  source: 'ai' | 'guide' | 'crisis';
  text: string;
  lessons: { id: string; title: string; href: string }[];
  /** A tip request: point at Signals, which show their reasons and record. */
  signals?: boolean;
};
type Turn = { question: string; reply: Reply };

/**
 * The coach (app/api/coach). Model text is only ever text: no markup, and
 * only registered lesson links are drawn. A crisis reply is the support card
 * and nothing else, and marks the device so signals and anything that sells
 * stay out of sight for a while (components/coach/CareGate.tsx).
 */
export function CoachChat({ configured }: { configured: boolean }) {
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const sending = useRef(false);

  async function send(question: string) {
    const asked = question.trim();
    if (sending.current || !asked) return;
    sending.current = true;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(await sessionHeaders()),
        },
        body: JSON.stringify({
          message: asked,
          previousQuestions: turns
            .filter((turn) => turn.reply.source !== 'crisis')
            .slice(-3)
            .map((turn) => turn.question),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(String(response.status));
      const reply = (await response.json()) as Reply;
      if (
        !['ai', 'guide', 'crisis'].includes(reply.source) ||
        typeof reply.text !== 'string' ||
        !Array.isArray(reply.lessons)
      )
        throw new Error('incomplete');
      if (reply.source === 'crisis') markCare();
      setTurns((all) => [...all.slice(-19), { question: asked, reply }]);
      setDraft('');
    } catch {
      setError(true);
      setDraft(asked);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_280px]">
      <section className="min-w-0">
        <Link
          href="/desk"
          className="inline-flex min-h-11 items-center type-small text-fg-2"
        >
          {C.back}
        </Link>
        <h1 className="mt-2 type-display text-fg">{C.title(BRAND.name)}</h1>
        <p className="mt-3 type-body text-fg-2">{C.lead}</p>
        {configured ? null : (
          <p className="mt-3 rounded-lg border border-line bg-panel p-3 type-small text-fg-2">
            {C.offline}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {C.prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={busy}
              onClick={() => {
                setDraft(prompt);
                void send(prompt);
              }}
              className="min-h-11 rounded-lg border border-edge px-3 py-2 text-left type-small text-fg transition-colors hover:border-gold disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <ol
          className="mt-6 space-y-6"
          aria-live="polite"
          aria-relevant="additions"
        >
          {turns.map((turn, index) => (
            <li key={index} className="animate-bubble-in space-y-3">
              <p className="ml-6 rounded-xl bg-raised p-4 type-body text-fg">
                <span className="mb-1 block font-mono type-tick text-muted uppercase">
                  {C.you}
                </span>
                {turn.question}
              </p>
              {turn.reply.source === 'crisis' ? (
                <SupportCard />
              ) : (
                <div className="rounded-xl border border-line bg-panel p-4">
                  <p className="font-mono type-tick text-gold uppercase">
                    {C.source[turn.reply.source]}
                  </p>
                  <p className="mt-2 break-words whitespace-pre-wrap type-body text-fg">
                    {turn.reply.text}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {turn.reply.lessons
                      .filter((lesson) =>
                        /^\/lesson\/[a-z0-9]+$/.test(lesson.href),
                      )
                      .map((lesson) => (
                        <li key={lesson.id}>
                          <Link
                            href={lesson.href}
                            className="inline-flex min-h-11 items-center type-small font-semibold text-gold"
                          >
                            {C.practise(lesson.title)} →
                          </Link>
                        </li>
                      ))}
                    {turn.reply.signals ? (
                      <li>
                        <Link
                          href="/signals"
                          className="inline-flex min-h-11 items-center type-small font-semibold text-fg-2 underline underline-offset-4 hover:text-fg"
                        >
                          {C.signals} →
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ol>
        {busy ? (
          <output className="mt-4 block type-small text-fg-2">
            {C.thinking}
          </output>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-edge p-3 type-small text-loss"
          >
            {C.error}
          </p>
        ) : null}
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <label
            htmlFor="coach-question"
            className="block type-small font-semibold text-fg"
          >
            {C.label}
          </label>
          <textarea
            id="coach-question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            disabled={busy}
            className="mt-2 w-full resize-y rounded-xl border border-edge bg-panel p-3 type-body text-fg outline-none focus:border-gold"
            placeholder={C.placeholder}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="btn-3d min-h-12 rounded-lg bg-gold px-6 type-body font-semibold text-ink disabled:opacity-50"
            >
              {busy ? C.asking : C.ask}
            </button>
          </div>
        </form>
      </section>
      <aside className="space-y-4 lg:pt-16">
        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 className="type-heading text-fg">{C.how.title}</h2>
          <ol className="mt-3 space-y-3 type-small text-fg-2">
            {C.how.steps.map((step, i) => (
              <li key={step}>
                {i + 1}. {step}
              </li>
            ))}
          </ol>
        </div>
        <p className="type-small text-fg-2">{C.scope}</p>
        <p className="type-small text-muted">{C.privacy}</p>
        <Link
          href="/lessons"
          className="inline-flex min-h-11 items-center type-small font-semibold text-gold"
        >
          {C.all}
        </Link>
      </aside>
    </div>
  );
}
