import { PLAY } from '@/content/copy/play';
import { money, type PaydayScenario } from '@/content/scenarios/payday';
import type { MonthEnd } from '@/lib/engines/payday';
import { fromMinor, subtract } from '@/lib/core/money';
import { Delta } from '@/components/ui/Delta';

/**
 * Two timelines side by side (spec §68): the month as the learner played it,
 * and the same month with one change. The columns wear the chart palette's
 * first two slots (you, what if) and say so in words, and each row names
 * what changed with a marker and a word.
 */
export function Compare({
  scenario,
  mine,
  theirs,
}: {
  scenario: PaydayScenario;
  mine: MonthEnd;
  theirs: MonthEnd;
}) {
  const { currency } = scenario.config;
  const fmt = money(currency);
  const change = (after: number, before: number) =>
    subtract(fromMinor(after, currency), fromMinor(before, currency));

  const rows = [
    {
      label: PLAY.whatIf.rows.cover,
      you: PLAY.predict.days(mine.daysOfCover),
      them: PLAY.predict.days(theirs.daysOfCover),
      delta: null,
    },
    {
      label: PLAY.whatIf.rows.savings,
      you: fmt(mine.savings),
      them: fmt(theirs.savings),
      delta: (
        <Delta
          amount={change(theirs.savings, mine.savings)}
          size="small"
          words={{ gain: 'more', loss: 'less', none: 'same' }}
        />
      ),
    },
    {
      label: PLAY.whatIf.rows.owed,
      you: fmt(mine.debt),
      them: fmt(theirs.debt),
      // Owing less is the good direction, so the words follow the meaning, not the sign.
      delta: (
        <Delta
          amount={change(mine.debt, theirs.debt)}
          size="small"
          words={{ gain: 'less owed', loss: 'more owed', none: 'same' }}
        />
      ),
    },
    {
      label: PLAY.whatIf.rows.net,
      you: fmt(mine.net, { signed: true }),
      them: fmt(theirs.net, { signed: true }),
      delta: (
        <Delta
          amount={change(theirs.net, mine.net)}
          size="small"
          words={{ gain: 'better', loss: 'worse', none: 'same' }}
        />
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-line px-4 py-2 type-label">
        <span className="text-muted" />
        <span className="inline-flex items-center gap-1.5 text-fg-2">
          <span className="size-2 rounded-full bg-series-1" aria-hidden />
          {PLAY.whatIf.you}
        </span>
        <span className="inline-flex items-center gap-1.5 text-fg-2">
          <span className="size-2 rounded-full bg-series-2" aria-hidden />
          {PLAY.whatIf.them}
        </span>
      </div>
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-b border-line px-4 py-3 last:border-b-0"
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
              <dt className="type-small text-fg-2">{row.label}</dt>
              <dd className="num text-right type-body text-fg-2">{row.you}</dd>
              <dd className="num text-right type-body font-semibold text-fg">
                {row.them}
              </dd>
            </div>
            {row.delta ? (
              <div className="mt-1 flex justify-end">{row.delta}</div>
            ) : null}
          </div>
        ))}
      </dl>
      <p className="border-t border-line px-4 py-2 type-small text-muted">
        {PLAY.whatIf.net}
      </p>
    </div>
  );
}
