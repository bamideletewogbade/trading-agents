import { PAPER_PAGE } from '@/content/paper';
import { Paper } from '@/components/trade/Paper';

export const metadata = { title: PAPER_PAGE.meta.title };

type Search = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v.slice(0, 40) : undefined;

/** A signal's "Paper-trade it" arrives with the market, side, stop and target filled in. */
export default async function PaperPage({ searchParams }: Search) {
  const q = await searchParams;
  const start = {
    market: one(q.market),
    side: one(q.side),
    stop: one(q.stop),
    target: one(q.target),
    setup: one(q.setup),
    signal: one(q.signal),
  };
  return <Paper key={JSON.stringify(start)} start={start} />;
}
