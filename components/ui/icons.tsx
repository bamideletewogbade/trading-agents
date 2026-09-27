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

export function PersonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </Icon>
  );
}

/** The path: coins joined by a winding trail. */
export function PathIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="5.5" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="7" cy="18.5" r="2" />
      <path d="M9 6.5c4 1 6 2 7 3.7M15.2 13.2c-2 2-4.5 3.5-6.4 4.6" />
    </Icon>
  );
}

/** The streak. Drawn filled, so it reads as a flame at chip size. */
export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M12.6 2.5c.4 3-1.6 4.6-3.2 6.4-1.5 1.7-2.9 3.5-2.9 6.1a5.5 5.5 0 0 0 11 0c0-2-.9-3.6-2-4.9-.2 1.3-.9 2.2-1.9 2.6.5-3.4-.4-6.9-1-10.2z"
      />
    </Icon>
  );
}

/** The desk: a dashboard of four panes. */
export function DeskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
    </Icon>
  );
}

/** Signals: a candle with an arrow leaving it. */
export function SignalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5v3M6 17.5v3" />
      <rect x="3.5" y="6.5" width="5" height="11" rx="1" />
      <path d="M12 16.5 20.5 8M15 8h5.5v5.5" />
    </Icon>
  );
}

/** The journal: a notebook with a ribbon. */
export function JournalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z" />
      <path d="M6 3.5v17M9.5 8.5h6M9.5 12h6M14.5 3.5v5l1.5-1 1.5 1v-5" />
    </Icon>
  );
}

export function ToolsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 7.5h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 17.5h.01M12 17.5h.01" />
    </Icon>
  );
}

/** The glossary: letters. */
export function WordsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 18.5 8 5.5l4.5 13M5 14h6M15 12.5a2.5 2.5 0 1 1 0 5c-1.4 0-2.5-1-2.5-2.5M17.5 11v7.5" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  );
}

/** The paper account: a sheet with a curve on it. */
export function PaperIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h8.5l4 4V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
      <path d="m8.5 16 2.5-3 2 1.5 3-4" />
    </Icon>
  );
}

/** The Floor: people together. */
export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c.7-3.4 3-5 5.5-5s4.8 1.6 5.5 5" />
      <path d="M15.5 5.8a3 3 0 0 1 0 5.4M17 14.8c1.8.6 3 2.2 3.5 4.7" />
    </Icon>
  );
}

/** Live: a broadcast. */
export function LiveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

/** Live market data: a pulse. */
export function PulseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </Icon>
  );
}
