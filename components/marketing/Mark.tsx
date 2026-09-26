/**
 * The placeholder mark: rising steps in gold, because getting better is the
 * product (lib/brand.ts). One component, so the rename is one edit.
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" className="fill-gold" />
      <path
        d="M5 18h4v-4h4v-4h4V6h2"
        className="fill-none stroke-ink"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
