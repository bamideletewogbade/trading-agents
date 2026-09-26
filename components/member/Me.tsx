'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { STAGES } from '@/content/curriculum';
import { ME } from '@/content/member';
import { DAILY_GOALS, type Badge } from '@/lib/progress/habit';
import { setDailyGoal, useHabit } from '@/lib/client/progress';
import { setBuzz, useBuzzSetting } from '@/lib/client/feel';
import { AccountPanel } from '@/components/auth/AccountPanel';
import { PaletteSetting } from '@/components/shell/PaletteSetting';
import { Segmented } from '@/components/ui/Segmented';
import { FlameIcon } from '@/components/ui/icons';

/**
 * The Me screen: level and XP, the streak, the daily goal, badges, and the
 * few settings that matter on a phone. Everything is worked out from the
 * lesson log (lib/progress/habit.ts); nothing here is stored on its own.
 */

function badgeName(badge: Badge): string {
  if (badge.kind === 'first') return ME.badges.first;
  if (badge.kind === 'streak') return ME.badges.streak(badge.days);
  const stage = STAGES.find((s) => s.key === badge.stage);
  return ME.badges.stage(stage?.title ?? badge.stage);
}

function badgeGlyph(badge: Badge): string {
  if (badge.kind === 'first') return '★';
  if (badge.kind === 'streak') return String(badge.days);
  return `S${STAGES.findIndex((s) => s.key === badge.stage) + 1}`;
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      {title ? (
        <h2 className="font-mono type-label text-muted">{title}</h2>
      ) : null}
      <div className={title ? 'mt-3' : ''}>{children}</div>
    </section>
  );
}

export function Me() {
  const habit = useHabit();
  const buzzOn = useBuzzSetting();
  const { level } = habit;
  return (
    <div className="mx-auto max-w-[560px] space-y-3 px-4 pt-5">
      <h1 className="type-title text-fg">{ME.title}</h1>

      <Card>
        <div className="flex items-center gap-4">
          <div className="perspective-1000">
            <span className="coin grid size-20 place-items-center font-mono type-display font-bold text-ink animate-coin-spin [--face:var(--color-gold)] [--rim:var(--color-gold-deep)]">
              {level.level}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="type-heading text-fg">{ME.level(level.level)}</p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-line"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-700"
                style={{ width: `${level.progressBp / 100}%` }}
              />
            </div>
            <p className="mt-1 font-mono type-tick text-muted num">
              {ME.toNext(level.to - habit.xp)}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-raised p-2">
            <dt className="font-mono type-tick text-muted uppercase">
              {ME.streak}
            </dt>
            <dd
              className={`mt-1 flex items-center justify-center gap-1 type-heading num ${habit.streak.today ? 'text-gold' : 'text-fg'}`}
            >
              <FlameIcon
                width={16}
                height={16}
                className={
                  habit.streak.today ? 'animate-flicker' : 'opacity-50'
                }
              />
              {habit.streak.current}
            </dd>
            <dd className="type-tick text-muted">
              {ME.best(habit.streak.best)}
            </dd>
          </div>
          <div className="rounded-md bg-raised p-2">
            <dt className="font-mono type-tick text-muted uppercase">
              {ME.lessons}
            </dt>
            <dd className="mt-1 type-heading text-fg num">
              {habit.completed.length}
            </dd>
          </div>
          <div className="rounded-md bg-raised p-2">
            <dt className="font-mono type-tick text-muted uppercase">
              {ME.xp}
            </dt>
            <dd className="mt-1 type-heading text-fg num">
              {habit.xp.toLocaleString('en-GB')}
            </dd>
          </div>
        </dl>
        <p className="mt-3 type-tick text-muted">{ME.honest}</p>
      </Card>

      <Card title={ME.goal.title}>
        <p className="mb-3 type-small text-fg-2">{ME.goal.lead}</p>
        <Segmented
          name="daily-goal"
          label={ME.goal.label}
          options={DAILY_GOALS.map((n) => ({
            value: String(n),
            label: ME.goal.option(n),
          }))}
          value={String(habit.goal.goal)}
          onChange={(value) => setDailyGoal(Number(value))}
        />
      </Card>

      <Card title={ME.badges.title}>
        {habit.badges.length === 0 ? (
          <p className="type-small text-fg-2">{ME.badges.none}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {habit.badges.map((badge) => (
              <li
                key={badgeName(badge)}
                className="flex flex-col items-center text-center"
              >
                <span
                  aria-hidden
                  className={`coin grid size-14 place-items-center font-mono type-heading font-bold text-ink ${badge.kind === 'streak' ? '[--face:var(--color-loss)] [--rim:var(--color-loss-deep)]' : '[--face:var(--color-gold)] [--rim:var(--color-gold-deep)]'}`}
                >
                  {badgeGlyph(badge)}
                </span>
                <span className="mt-2 type-tick leading-4 text-fg-2">
                  {badgeName(badge)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={ME.settings.title}>
        <div className="space-y-5">
          <div>
            <Segmented
              name="buzz"
              label={ME.settings.buzz}
              options={[
                { value: 'on', label: ME.settings.on },
                { value: 'off', label: ME.settings.off },
              ]}
              value={buzzOn ? 'on' : 'off'}
              onChange={(value) => setBuzz(value === 'on')}
            />
            <p className="mt-2 type-small text-muted">{ME.settings.buzzHelp}</p>
          </div>
          <PaletteSetting
            label={ME.settings.palette}
            standard={ME.settings.standard}
            blueOrange={ME.settings.blueOrange}
            help={ME.settings.paletteHelp}
          />
          <Link
            href="/onboarding"
            className="inline-flex min-h-11 items-center type-small text-fg-2 underline underline-offset-4"
          >
            {ME.settings.redo}
          </Link>
        </div>
      </Card>

      <Card title={ME.account.title}>
        <AccountPanel />
      </Card>
    </div>
  );
}
