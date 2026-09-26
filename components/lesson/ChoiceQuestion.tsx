'use client';

import { PLAYER } from '@/content/lessons/widgets';
import type { Option } from '@/lib/lessons/types';

/**
 * One multiple-choice question, as lessons and practice rounds both show
 * it: tactile options, a pop and "+XP" for a right first answer, a shake
 * for a wrong one, and the option's explanation underneath. The learner can
 * keep picking until they find the right one; only the first pick counts.
 * The words "Right" and "Not quite" say what happened; motion only adds to
 * it.
 */
export function ChoiceQuestion({
  prompt,
  options,
  picks,
  onPick,
  pop,
  xp,
}: {
  prompt: string;
  options: readonly Option[];
  /** Options picked so far, in order. */
  picks: readonly number[];
  onPick: (option: number) => void;
  /** The option to float "+XP" over, and a stamp so it replays. */
  pop: { option: number; at: number } | null;
  xp: number;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="type-title text-fg">{prompt}</legend>
      <div className="mt-4 space-y-3">
        {options.map((option, i) => {
          const chosen = picks.includes(i);
          const latest = picks.at(-1) === i;
          return (
            <div key={option.label} className="relative">
              <button
                type="button"
                aria-pressed={chosen}
                onClick={() => onPick(i)}
                className={`btn-3d flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left type-body ${
                  chosen
                    ? option.correct
                      ? 'border-gold bg-gold-soft text-fg [--depth:var(--color-gold-deep)]'
                      : 'border-loss bg-panel text-fg [--depth:var(--color-loss-deep)]'
                    : 'border-edge bg-raised text-fg [--depth:var(--color-line)]'
                } ${latest ? (option.correct ? 'animate-pop' : 'animate-shake') : ''}`}
              >
                <span
                  aria-hidden
                  className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono type-small ${chosen ? (option.correct ? 'border-gold bg-gold text-ink' : 'border-loss text-loss') : 'border-edge text-fg-2'}`}
                >
                  {chosen
                    ? option.correct
                      ? '✓'
                      : '✕'
                    : String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0">{option.label}</span>
              </button>
              {pop?.option === i ? (
                <span
                  key={pop.at}
                  aria-hidden
                  className="pointer-events-none absolute -top-2 right-3 rounded-full bg-gold px-2 py-0.5 font-mono type-tick font-bold text-ink animate-float-up"
                >
                  +{xp} XP
                </span>
              ) : null}
              {latest ? (
                <p
                  className={`mt-2 ml-10 type-small animate-bubble-in ${option.correct ? 'text-fg' : 'text-fg-2'}`}
                  aria-live="polite"
                >
                  <span
                    className={`font-semibold ${option.correct ? 'text-gold' : 'text-loss'}`}
                  >
                    {option.correct ? PLAYER.right : PLAYER.notQuite}.
                  </span>{' '}
                  {option.feedback}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
