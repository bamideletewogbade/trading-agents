'use client';

import { useState } from 'react';
import { MINDSET } from '@/content/mindset';

/**
 * Noise or signal: one card at a time. The learner calls it, and the card
 * turns over (a real 3D flip) to show the answer and why. The answer is
 * said in words and with an icon, not only by colour.
 */

const COPY = MINDSET.game;
type Call = 'noise' | 'signal';

export function SignalOrNoise({ onDone }: { onDone?: () => void } = {}) {
  const [index, setIndex] = useState(0);
  const [call, setCall] = useState<Call | null>(null);
  const [right, setRight] = useState(0);
  const total = COPY.cards.length;
  const finished = index >= total;
  const card = COPY.cards[Math.min(index, total - 1)]!;
  const correct = call !== null && call === card.answer;

  function choose(choice: Call) {
    if (call) return;
    setCall(choice);
    if (choice === card.answer) setRight((n) => n + 1);
  }

  if (finished)
    return (
      <div className="rounded-lg border border-gold bg-panel p-6 text-center">
        <p className="font-mono type-display text-gold num">
          {COPY.final(right, total)}
        </p>
        <p className="mx-auto mt-3 max-w-[40ch] type-body text-fg">
          {COPY.done(right, total)}
        </p>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setCall(null);
            setRight(0);
          }}
          className="mt-5 min-h-12 rounded-md border border-edge bg-raised px-5 type-small font-semibold text-fg"
        >
          {COPY.again}
        </button>
      </div>
    );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between font-mono type-tick text-muted num">
        <span>
          {index + 1} / {total}
        </span>
        <span>{COPY.score(right)}</span>
      </div>
      <div className="perspective-1000">
        <div
          className={`relative min-h-56 preserve-3d transition-transform duration-700 ease-out ${call ? '[transform:rotateY(180deg)]' : ''}`}
        >
          <div className="absolute inset-0 flex items-center rounded-lg border border-line bg-panel p-6 backface-hidden">
            <p className="type-title text-fg">{card.text}</p>
          </div>
          <div
            className={`absolute inset-0 flex flex-col justify-center rounded-lg border bg-panel p-6 backface-hidden [transform:rotateY(180deg)] ${correct ? 'border-gold' : 'border-loss'}`}
          >
            <p
              className={`font-mono type-label ${correct ? 'text-gold' : 'text-loss'}`}
            >
              {correct ? `✓ ${COPY.right}` : `✕ ${COPY.wrong}`} ·{' '}
              {card.answer === 'signal' ? COPY.signal : COPY.noise}
            </p>
            <p className="mt-3 type-body text-fg">{card.why}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {call === null ? (
          <>
            <button
              type="button"
              onClick={() => choose('noise')}
              className="min-h-14 rounded-md border border-edge bg-raised type-body font-semibold text-fg active:scale-[0.98]"
            >
              〰 {COPY.noise}
            </button>
            <button
              type="button"
              onClick={() => choose('signal')}
              className="min-h-14 rounded-md border border-gold bg-gold-soft type-body font-semibold text-gold active:scale-[0.98]"
            >
              ◆ {COPY.signal}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (index + 1 >= total) onDone?.();
              setIndex((n) => n + 1);
              setCall(null);
            }}
            className="col-span-2 min-h-14 rounded-md bg-gold type-body font-semibold text-ink"
          >
            {COPY.next} →
          </button>
        )}
      </div>
    </div>
  );
}
