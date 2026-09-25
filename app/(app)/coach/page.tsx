import { COACH } from '@/content/copy/shell';
import { TopBar } from '@/components/shell/TopBar';

export const metadata = { title: COACH.title };

/**
 * The coach (spec §8). In Phase 2 this becomes a conversation where
 * experiences appear inline as cards. For now: what it will be for, the kind
 * of question to ask, and an input that says why it isn't open yet.
 */
export default function CoachPage() {
  return (
    <>
      <TopBar title={COACH.title} />
      <p className="type-body text-fg-2">{COACH.intro}</p>

      <h2 className="mt-6 mb-2 type-label text-muted">{COACH.tryLabel}</h2>
      <ul className="flex flex-col gap-2">
        {COACH.suggestions.map((suggestion) => (
          <li
            key={suggestion}
            className="rounded-md border border-line bg-panel px-4 py-3 type-body text-fg-2"
          >
            {suggestion}
          </li>
        ))}
      </ul>

      <form className="mt-6" aria-describedby="coach-not-ready">
        <label htmlFor="coach-question" className="sr-only">
          {COACH.inputLabel}
        </label>
        <input
          id="coach-question"
          type="text"
          disabled
          placeholder={COACH.inputPlaceholder}
          className="min-h-12 w-full rounded-md border border-edge bg-raised px-4 type-body text-fg placeholder:text-muted disabled:opacity-60"
        />
        <p id="coach-not-ready" className="mt-2 type-small text-muted">
          {COACH.notReady}
        </p>
      </form>
    </>
  );
}
