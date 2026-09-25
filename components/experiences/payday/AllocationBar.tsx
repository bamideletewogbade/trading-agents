import {
  allocated,
  BUCKETS,
  type Bucket,
  type Split,
} from '@/lib/engines/payday';

/**
 * The split as one stacked bar: a segment per place, in the chart palette's
 * validated order, with 2 px gaps so neighbours never touch (design brief
 * §9). The rows below it carry each colour's name and amount, so the colour
 * is never the only way to tell them apart.
 */

export const BUCKET_SWATCH: Record<Bucket, string> = {
  rent: 'bg-series-1',
  family: 'bg-series-2',
  savings: 'bg-series-3',
  scheme: 'bg-series-4',
  spend: 'bg-series-5',
};

export function AllocationBar({
  split,
  income,
}: {
  split: Split;
  income: number;
}) {
  return (
    <div
      className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm bg-raised"
      aria-hidden
    >
      {BUCKETS.map((bucket) =>
        split[bucket] > 0 ? (
          <span
            key={bucket}
            className={`${BUCKET_SWATCH[bucket]} transition-[flex-grow] duration-(--duration-base) ease-out`}
            style={{ flexGrow: split[bucket], flexBasis: 0 }}
          />
        ) : null,
      )}
      {income > allocated(split) ? (
        <span style={{ flexGrow: income - allocated(split), flexBasis: 0 }} />
      ) : null}
    </div>
  );
}
