'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { SupportCard } from '@/components/coach/SupportCard';
import { COACH, ONBOARDING, chipLabel } from '@/content/onboarding';
import { STAGES, TOPICS, lesson } from '@/content/curriculum';
import { markCare } from '@/lib/client/notes';
import { formatBp } from '@/lib/core/money';
import { crisisRule } from '@/lib/decisions/safety';
import { recoveryBp } from '@/lib/engines/risk';
import {
  JEV_OPTIONS,
  MARKETS,
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
 * Typing is always an answer. When the reading can't place one, Sika asks
 * again with examples of what to type; after a second miss she moves on,
 * and that question is skipped (placement works without it).
 *
 * Anything typed passes the crisis rules first (lib/decisions/safety.ts):
 * a match shows the support card in the chat, and the question waits.
 *
 * Every coach line arrives after a short "typing…" pause, so the chat reads
 * like a conversation rather than a form. Anyone who asked for less motion
 * gets the lines straight away.
 */

type Said =
  | { from: 'coach' | 'me'; text: string }
  | { from: 'summary'; profile: Profile }
  | { from: 'support' };
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
  // Answers the reading couldn't place, per question. Two, and it moves on:
  // nobody gets stuck asked the same thing forever.
  const [misses, setMisses] = useState<Partial<Record<Step, number>>>({});
  const [skipped, setSkipped] = useState<Step[]>([]);
  const [draft, setDraft] = useState('');
  // The markets question takes several answers: ticked here, sent with Done.
  const [picked, setPicked] = useState<Market[]>([]);
  // After the support card, no suggestions until they write again: the card
  // keeps the room, and nothing nudges them back into the questions.
  const [calm, setCalm] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'server' | 'device'>(
    'idle',
  );
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);
  const log = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
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
    setMisses({});
    setSkipped([]);
    setCalm(false);
    setStep(null);
    setSaving('idle');
    setPicked([]);
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

  // Keep the newest line in view. The bottom moves when a line arrives and
  // also when the chips row below appears or the keyboard opens, which
  // shrinks the log without adding to it, so both sizes are watched. Only a
  // scroll upward lets go: a learner rereading is left there until the next
  // line. (Judging by distance alone lets go by mistake when a line and the
  // chips land in the same frame.)
  useEffect(() => {
    const box = log.current;
    if (!box) return;
    let last = box.scrollTop;
    const toEnd = () => {
      if (pinned.current) box.scrollTop = box.scrollHeight;
    };
    const onScroll = () => {
      const gap = box.scrollHeight - box.scrollTop - box.clientHeight;
      if (gap < 48) pinned.current = true;
      else if (box.scrollTop < last) pinned.current = false;
      last = box.scrollTop;
    };
    const watch = new ResizeObserver(toEnd);
    watch.observe(box);
    if (box.firstElementChild) watch.observe(box.firstElementChild);
    box.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      watch.disconnect();
      box.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    pinned.current = true;
    const box = log.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, typing]);

  /** Move on: to the next open question, or the summary. */
  function advance(next: Profile, lines: string[], skip: Step[] = skipped) {
    setStep(null);
    const following = nextStep(next, skip);
    if (following) {
      say([...lines, question(following, next)], () => setStep(following));
    } else {
      say(lines, () => push({ from: 'summary', profile: next }));
    }
  }

  function accept(current: Step, value: unknown) {
    if (current === 'name' && value === '') {
      // They'd rather not say: carry on without a name, and don't ask again.
      const skip = [...skipped, current];
      setSkipped(skip);
      advance(profile, [C.noName], skip);
      return;
    }
    const next = answer(profile, current, value);
    setProfile(next);
    setPicked([]);
    advance(next, reaction(current, next));
  }

  /** The reading couldn't place an answer: ask again in other words, or, the second time, move on. */
  function missed(current: Step) {
    const count = (misses[current] ?? 0) + 1;
    setMisses((all) => ({ ...all, [current]: count }));
    if (count >= 2) {
      const skip = [...skipped, current];
      setSkipped(skip);
      advance(profile, [C.skip], skip);
      return;
    }
    setStep(null);
    say([C.clarify[current]], () => setStep(current));
  }

  /** Something typed sounded like crisis: the support card, then the same question waits, not counted as a miss. */
  function care(current: Step) {
    markCare();
    setCalm(true);
    setStep(null);
    say([C.care.before], () => {
      push({ from: 'support' });
      say([C.care.after], () => setStep(current));
    });
  }

  async function reply(text: string) {
    if (!step) return;
    const current = step;
    push({ from: 'me', text });
    setDraft('');
    setCalm(false);
    if (crisisRule(text)) return care(current);
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
        if (result.kind === 'crisis') {
          setTyping(false);
          return care(current);
        }
      } catch {
        // Fall through to asking the learner.
      }
      setTyping(false);
    }
    missed(current);
  }

  function tap(value: unknown) {
    if (!step) return;
    push({ from: 'me', text: chipLabel(step, value) ?? String(value) });
    accept(step, value);
  }

  /** Send the ticked markets together, in the order the chips show them. */
  function sendPicked() {
    if (step !== 'markets' || !picked.length) return;
    const labels = picked.map(
      (market) => chipLabel('markets', [market]) ?? market,
    );
    push({ from: 'me', text: labels.join(', ') });
    setPicked([]);
    accept('markets', picked);
  }

  function togglePick(market: Market) {
    setPicked((list) =>
      list.includes(market)
        ? list.filter((m) => m !== market)
        : MARKETS.filter((m) => m === market || list.includes(m)),
    );
  }

  async function finish(done: Profile) {
    setSaving('saving');
    const saved = await saveProfile(done);
    setSaving(saved.where);
    timers.current.push(window.setTimeout(() => router.push('/desk'), 700));
  }

  const answered = answeredCount(profile) + skipped.length;
  const chips =
    step && !calm ? (C.chips[step] as { label: string; value: unknown }[]) : [];

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
        ref={log}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
        aria-live="polite"
      >
        <ul className="space-y-3">
          {messages.map((message) =>
            message.from === 'support' ? (
              <li key={message.id} className="animate-bubble-in">
                <SupportCard />
              </li>
            ) : message.from === 'summary' ? (
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
      </div>

      <div className="border-t border-line bg-ink px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {chips.length && step === 'markets' ? (
          <fieldset className="mb-3 animate-bubble-in">
            <legend className="mb-2 font-mono type-tick text-muted">
              {C.multi.legend}
            </legend>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => {
                const value = chip.value as Market[];
                const market = value[0];
                // "Not sure yet" is an answer on its own, not one of many.
                if (!market)
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => tap(value)}
                      className="min-h-11 rounded-full border border-dashed border-edge px-4 type-small text-fg-2 transition-colors hover:border-gold hover:text-gold"
                    >
                      {chip.label}
                    </button>
                  );
                const on = picked.includes(market);
                return (
                  <label
                    key={chip.label}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 type-small transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${on ? 'border-gold bg-gold-soft font-semibold text-fg' : 'border-edge bg-raised text-fg hover:border-gold'}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => togglePick(market)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`grid size-4 place-items-center rounded-[4px] border text-[0.65rem] leading-none font-bold transition-colors ${on ? 'animate-pop border-gold bg-gold text-ink' : 'border-edge'}`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    {chip.label}
                  </label>
                );
              })}
              <button
                type="button"
                onClick={sendPicked}
                disabled={!picked.length}
                className="btn-3d min-h-11 rounded-full bg-gold px-5 type-small font-bold text-ink disabled:opacity-40"
              >
                {C.multi.done(picked.length)}
              </button>
            </div>
          </fieldset>
        ) : chips.length ? (
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
