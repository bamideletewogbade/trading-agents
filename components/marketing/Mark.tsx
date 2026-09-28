/**
 * Chartward's open C and decision point, legible at navigation size.
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M17 3H8L3 8v3h4V9l3-3h7zM3 14v3l5 5h9v-4h-7l-3-3v-1z"
        className="fill-fg"
      />
      <rect x="15" y="10" width="6" height="6" rx="1" className="fill-gold" />
    </svg>
  );
}
