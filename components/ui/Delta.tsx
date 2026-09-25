import { formatBp, formatMoney, type Money } from '@/lib/core/money';
import { TriangleDown, TriangleUp } from './icons';

/**
 * A change, said four ways at once (design brief §2, rule 3): the marker, the
 * sign, the word, and only then the colour. `▲ +GH₵300 gain` still reads in
 * greyscale, in forced-colours mode, and to someone who can't tell red from
 * green.
 *
 * The amount comes in as Money from an engine; this component only formats
 * it. It never computes one.
 */
export function Delta({
  amount,
  shareBp,
  words = { gain: 'gain', loss: 'loss', none: 'no change' },
  size = 'body',
}: {
  amount: Money;
  /** The same change as a share of the starting amount, if it helps. */
  shareBp?: number;
  words?: { gain: string; loss: string; none: string };
  size?: 'body' | 'small';
}) {
  const direction =
    amount.minor > 0 ? 'gain' : amount.minor < 0 ? 'loss' : 'none';
  const tone =
    direction === 'gain'
      ? 'text-gain'
      : direction === 'loss'
        ? 'text-loss'
        : 'text-fg-2';
  const iconSize = size === 'body' ? 14 : 12;
  return (
    <span
      className={`inline-flex items-center gap-1.5 num font-semibold ${tone} ${size === 'body' ? 'type-body' : 'type-small'}`}
    >
      {direction === 'gain' ? (
        <TriangleUp width={iconSize} height={iconSize} />
      ) : null}
      {direction === 'loss' ? (
        <TriangleDown width={iconSize} height={iconSize} />
      ) : null}
      {/* No change is said in a word alone: "GH₵0 same" reads as a glitch. */}
      {direction === 'none' ? null : (
        <span>
          {formatMoney(amount, { signed: true })}
          {shareBp !== undefined
            ? ` (${formatBp(shareBp, { signed: true })})`
            : ''}
        </span>
      )}
      <span className="font-normal">{words[direction]}</span>
    </span>
  );
}
