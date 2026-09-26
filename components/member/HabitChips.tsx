'use client';

import { useEffect } from 'react';
import { HABIT } from '@/content/member';
import { syncCompleted, useHabit } from '@/lib/client/progress';
import { FlameIcon } from '@/components/ui/icons';

/**
 * Streak and XP, always in view at the top of the member screens: the two
 * numbers that make coming back feel like progress. Words sit beside every
 * icon (the flame alone would be colour and shape only).
 */
export function HabitChips() {
  const habit = useHabit();
  useEffect(() => {
    void syncCompleted();
  }, []);
  const lit = habit.streak.today;
  return (
    <div className="flex items-center gap-1.5" aria-live="polite">
      <span
        className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-2.5 font-mono type-tick font-semibold num ${lit ? 'border-gold bg-gold-soft text-gold' : 'border-line text-fg-2'}`}
        title={HABIT.streakLabel(habit.streak.current)}
      >
        <FlameIcon
          width={16}
          height={16}
          className={lit ? 'animate-flicker' : 'opacity-60'}
        />
        <span className="sr-only">
          {HABIT.streakLabel(habit.streak.current)}
        </span>
        <span aria-hidden>{habit.streak.current}</span>
      </span>
      <span className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line px-2.5 font-mono type-tick font-semibold text-fg num">
        <span aria-hidden className="text-gold">
          ◆
        </span>
        {HABIT.xp(habit.xp)}
      </span>
    </div>
  );
}
