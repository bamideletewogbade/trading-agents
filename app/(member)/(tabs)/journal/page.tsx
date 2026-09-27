import { JOURNAL } from '@/content/journal';
import { Journal } from '@/components/trade/Journal';

export const metadata = { title: JOURNAL.meta.title };

type Search = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v.slice(0, 40) : undefined;

/** A signal's "Log it in my journal" arrives with the trade filled in. */
export default async function JournalPage({ searchParams }: Search) {
  const q = await searchParams;
  return (
    <Journal
      key={new URLSearchParams(
        Object.entries(q).flatMap(([k, v]) =>
          typeof v === 'string' ? [[k, v]] : [],
        ),
      ).toString()}
      start={{
        market: one(q.market),
        side: one(q.side),
        entry: one(q.entry),
        stop: one(q.stop),
        target: one(q.target),
        setup: one(q.setup),
        source: one(q.source),
      }}
    />
  );
}
