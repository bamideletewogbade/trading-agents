'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { COACH, ONBOARDING, chipLabel } from '@/content/onboarding';
import { STAGES, TOPICS, lesson } from '@/content/curriculum';
import { formatBp } from '@/lib/core/money';
import { recoveryBp } from '@/lib/engines/risk';
import {
  JEV_OPTIONS,
  STEPS,
  answer,
  answeredCount,
  nextStep,
  placement,
  recoveryRight,
  understand,
  type Market,
  type Profile,
  type Step,
} from '@/lib/onboarding/flow';
import { saveProfile } from '@/lib/client/profile';

/**
 * Onboarding as a chat with Sika, the coach. One question at a time, typed
 * or tapped; a short reaction to each answer; then a summary with where to
 * start. The reading of free text is lib/onboarding/flow.ts (and Jev, when
 * the patterns aren't sure). This component only runs the conversation.
 *
 * Every coach line arrives after a short "typing…" pause, so the chat reads
 * like a conversation rather than a form. Anyone who asked for less motion
 * gets the lines straight away.
 */

type Said =
  | { from: 'coach' | 'me'; text: string }
  | { from: 'summary'; profile: Profile };
type Message = Said & { id: number };

const C = ONBOARDING;
const LOSS = formatBp(5_000);
const GAIN = formatBp(recoveryBp(5_000));

function question(step: Step, profile: Profile): string {
  switch (step) {
    case 'goal':
      return C.ask.goal(profile.name ?? '');
    case 'recovery':
      return C.ask.recovery(LOSS);
    default:
      return C.ask[step] as string;
  }
}

function reaction(step: Step, profile: Profile): string[] {
  switch (step) {
    case 'name':
      return [];
    case 'goal':
      return profile.goal ? [C.ack.goal[profile.goal]] : [];
    case 'experience':
      return profile.experience ? [C.ack.experience[profile.experience]] : [];
    case 'markets':
      return [C.ack.markets(profile.markets?.length ?? 0)];
    case 'recovery':
      return [
        recoveryRight(profile.recoveryAnswerBp)
          ? C.ack.recovery.right(GAIN)
          : C.ack.recovery.wrong(LOSS, GAIN),
      ];
    case 'scam':
      return profile.scam ? [C.ack.scam[profile.scam]] : [];
    case 'time':
      return profile.minutes ? [C.ack.time[profile.minutes]] : [];
  }
}

export function Conversation() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [step, setStep] = useState<Step | null>(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'server' | 'device'>(
    'idle',
  );
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);
  const bottom = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  const push = (message: Said) =>
    setMessages((list) => [...list, { ...message, id: nextId.current++ }]);

  /** Coach lines, one after another, each after a short typing pause. */
  function say(lines: string[], then?: () => void) {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let at = 0;
    timers.current.push(window.setTimeout(() => setTyping(true), 0));
    lines.forEach((line, i) => {
      at += reduce ? 60 : Math.min(1_300, 450 + line.length * 9);
      timers.current.push(
        window.setTimeout(() => {
          push({ from: 'coach', text: line });
          if (i === lines.length - 1) setTyping(false);
        }, at),
      );
    });
    if (lines.length === 0)
      timers.current.push(window.setTimeout(() => setTyping(false), 0));
    if (then) timers.current.push(window.setTimeout(then, at + 20));
  }

  function begin() {
    setMessages([]);
    setProfile({});
    setStep(null);
    setSaving('idle');
    say([...C.hello, question('name', {})], () => setStep('name'));
  }

  const onStart = useEffectEvent(() => begin());
  useEffect(() => {
    // Once per mount. Under React's development double-mount the first
    // mount's timers are cleared and the greeting starts again cleanly.
    if (started.current) return;
    started.current = true;
    const pending = timers.current;
    onStart();
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
      pending.length = 0;
      started.current = false;
      setMessages([]);
    };
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  function accept(current: Step, value: unknown) {
    const next = answer(profile, current, value);
    setProfile(next);
    setStep(null);
    const following = nextStep(next);
    if (following) {
      say([...reaction(current, next), question(following, next)], () =>
        setStep(following),
      );
    } else {
      say(reaction(current, next), () =>
        push({ from: 'summary', profile: next }),
      );
    }
  }

  async function reply(text: string) {
    if (!step) return;
    const current = step;
    push({ from: 'me', text });
    setDraft('');
    const read = understand(current, text);
    if (read.kind === 'sure') return accept(current, read.value);

    // Not sure from the words alone: ask Jev, if this step has fixed options.
    if (JEV_OPTIONS[current]) {
      setStep(null);
      setTyping(true);
      try {
        const response = await fetch('/api/onboarding/understand', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ step: current, text }),
        });
        const result = (await response.json()) as {
          kind: string;
          value?: unknown;
        };
        if (result.kind === 'sure') {
          setTyping(false);
          return accept(current, result.value);
        }
      } catch {
        // Fall through to asking the learner.
      }
      setTyping(false);
    }
    setStep(null);
    say([C.clarify[current]], () => setStep(current));
  }

  function tap(value: unknown) {
    if (!step) return;
    push({ from: 'me', text: chipLabel(step, value) ?? String(value) });
    accept(step, value);
  }

  async function finish(done: Profile) {
    setSaving('saving');
    const saved = await saveProfile(done);
    setSaving(saved.where);
    timers.current.push(window.setTimeout(() => router.push('/desk'), 700));
  }

  const answered = answeredCount(profile);
  const chips = step
    ? (C.chips[step] as { label: string; value: unknown }[])
    : [];

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[720px] flex-col">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between font-mono type-tick text-muted num">
          <span>{C.meta.title}</span>
          <span>
            {C.progress(Math.min(answered, STEPS.length), STEPS.length)}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
            style={{
              width: `${(Math.min(answered, STEPS.length) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
        aria-live="polite"
      >
        <ul className="space-y-3">
          {messages.map((message) =>
            message.from === 'summary' ? (
              <li key={message.id} className="animate-bubble-in">
                <Summary
                  profile={message.profile}
                  saving={saving}
                  onGo={() => finish(message.profile)}
                  onChange={begin}
                />
              </li>
            ) : (
              <li
                key={message.id}
                className={`flex animate-bubble-in items-end gap-2 ${message.from === 'me' ? 'justify-end' : ''}`}
              >
                {message.from === 'coach' ? (
                  <span
                    aria-hidden
                    className="mb-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gold font-mono type-small font-bold text-ink"
                  >
                    {COACH.initial}
                  </span>
                ) : null}
                <p
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 type-body ${message.from === 'coach' ? 'rounded-bl-sm border border-line bg-panel text-fg' : 'rounded-br-sm bg-gold text-ink'}`}
                >
                  <span className="sr-only">
                    {message.from === 'coach' ? `${COACH.name}: ` : ''}
                  </span>
                  {message.text}
                </p>
              </li>
            ),
          )}
          {typing ? (
            <li className="flex items-end gap-2">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-gold font-mono type-small font-bold text-ink"
              >
                {COACH.initial}
              </span>
              <output className="flex gap-1 rounded-2xl rounded-bl-sm border border-line bg-panel px-4 py-3.5">
                <span className="sr-only">{C.typing}</span>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-fg-2 animate-typing"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </output>
            </li>
          ) : null}
        </ul>
        <div ref={bottom} />
      </div>

      <div className="border-t border-line bg-ink px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {chips.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => tap(chip.value)}
                className="min-h-11 rounded-full border border-edge bg-raised px-4 type-small text-fg transition-colors hover:border-gold hover:text-gold"
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) void reply(draft.trim());
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="answer" className="sr-only">
            {C.placeholder}
          </label>
          <input
            id="answer"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!step}
            placeholder={C.placeholder}
            autoComplete="off"
            enterKeyHint="send"
            maxLength={280}
            className="min-h-12 min-w-0 flex-1 rounded-full border border-edge bg-panel px-4 type-body text-fg outline-none placeholder:text-muted focus:border-gold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!step || !draft.trim()}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-gold text-ink disabled:opacity-40"
          >
            <span className="sr-only">{C.send}</span>
            <span aria-hidden className="text-lg font-bold">
              ↑
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

function Summary({
  profile,
  saving,
  onGo,
  onChange,
}: {
  profile: Profile;
  saving: 'idle' | 'saving' | 'server' | 'device';
  onGo: () => void;
  onChange: () => void;
}) {
  const S = ONBOARDING.summary;
  const placed = placement(profile);
  const stage = STAGES[placed.stage];
  const markets = (profile.markets ?? []).map(
    (market: Market) => ONBOARDING.marketLabels[market],
  );
  return (
    <div className="rounded-2xl border border-gold bg-panel p-5">
      <p className="type-body text-fg">{S.lead(profile.name ?? '')}</p>
      <ul className="mt-3 space-y-1.5">
        {[
          profile.goal ? S.goal[profile.goal] : null,
          profile.experience ? S.experience[profile.experience] : null,
          S.markets(markets),
          profile.minutes ? S.minutes(profile.minutes) : null,
        ]
          .filter(Boolean)
          .map((line) => (
            <li key={line} className="flex gap-2 type-small text-fg-2">
              <span aria-hidden className="text-gold">
                ✓
              </span>
              {line}
            </li>
          ))}
      </ul>
      <p className="mt-4 type-heading text-fg">
        {S.start(placed.stage + 1, stage?.title ?? '')}
      </p>
      {placed.reasons.map((reason) => (
        <p key={reason} className="mt-1 type-small text-fg-2">
          {S.reasons[reason]}
        </p>
      ))}
      <p className="mt-4 font-mono type-tick text-muted uppercase">{S.first}</p>
      <ol className="mt-2 space-y-2">
        {placed.lessons.map((id, i) => {
          const item = lesson(id);
          return (
            <li
              key={id}
              className="flex items-start gap-3 rounded-md border border-line bg-raised p-3"
            >
              <span className="font-mono type-small text-gold num">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-mono type-tick text-muted uppercase">
                  {TOPICS[item.topic].label}
                </span>
                <span className="block type-small font-semibold text-fg">
                  {item.title}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onGo}
          disabled={saving !== 'idle'}
          className="min-h-12 rounded-md bg-gold px-5 type-body font-semibold text-ink disabled:opacity-70"
        >
          {saving === 'idle' || saving === 'saving' ? S.go : `✓ ${S.saved}`}
        </button>
        <button
          type="button"
          onClick={onChange}
          disabled={saving !== 'idle'}
          className="min-h-12 rounded-md border border-edge bg-raised px-5 type-body font-semibold text-fg"
        >
          {S.change}
        </button>
      </div>
    </div>
  );
}
