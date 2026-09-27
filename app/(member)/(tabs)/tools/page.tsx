import { TOOLS } from '@/content/tools';
import { Tools } from '@/components/trade/Tools';

export const metadata = { title: TOOLS.meta.title };

type Search = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v.slice(0, 40) : undefined;

/** A signal's "Size this trade" arrives with its prices filled in. */
export default async function ToolsPage({ searchParams }: Search) {
  const q = await searchParams;
  return (
    <Tools
      key={new URLSearchParams(
        Object.entries(q).flatMap(([k, v]) =>
          typeof v === 'string' ? [[k, v]] : [],
        ),
      ).toString()}
      start={{
        tool: one(q.tool),
        entry: one(q.entry),
        stop: one(q.stop),
        target: one(q.target),
      }}
    />
  );
}
