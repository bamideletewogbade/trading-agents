import type { ReactNode, SVGProps } from 'react';

/**
 * The icon set, drawn inline: 24 px grid, 1.75 px strokes, round joins
 * (design brief §6). No icon font and no library download, because every
 * kilobyte is paid for by the learner, and these are a few hundred bytes.
 *
 * Icons are decorative by default (`aria-hidden`): the words beside them
 * carry the meaning. Pass `title` only for an icon that stands alone.
 */

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Icon({
  title,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z" />
    </Icon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
      <path d="M12 6.5V20" />
    </Icon>
  );
}

/** Practice. This is a gym. */
export function DumbbellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />
    </Icon>
  );
}

export function StepsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 20.5h17M5 20.5v-4.5h4v-4h4v-4h4V4" />
    </Icon>
  );
}

export function CoachIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5h16v11H10l-6 4.5z" />
      <path d="M10 9a2 2 0 1 1 2.9 1.8c-.6.3-.9.7-.9 1.3M12 14h.01" />
    </Icon>
  );
}

/** Simulation: something that runs, and can run again. */
export function LoopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19.5 9M19.5 4.5V9H15M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4.5 15M4.5 19.5V15H9" />
    </Icon>
  );
}

/** Hypothetical: approximately. */
export function ApproxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 9.5c2-2 4-2 7 0s5 2 7 0M5 15c2-2 4-2 7 0s5 2 7 0" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Icon>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4 21 19.5H3z" />
      <path d="M12 10v4.5M12 17h.01" />
    </Icon>
  );
}

/**
 * The gain and loss markers. Filled, and drawn rather than typed because no
 * web subset of Inter carries ▲ ▼ (design brief §4).
 */
export function TriangleUp(props: IconProps) {
  return (
    <Icon {...props} stroke="none" fill="currentColor">
      <path d="M12 5.5 19.5 18h-15z" />
    </Icon>
  );
}

export function TriangleDown(props: IconProps) {
  return (
    <Icon {...props} stroke="none" fill="currentColor">
      <path d="M12 18.5 4.5 6h15z" />
    </Icon>
  );
}
