'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { BRAND } from '@/lib/brand';
import { NAV, TAB_DUE, type NavIcon } from '@/content/member';
import { usePractice } from '@/lib/client/practice';
import { AccountButton } from '@/components/auth/AccountButton';
import { Mark } from '@/components/marketing/Mark';
import { HabitChips } from './HabitChips';
import {
  BookIcon,
  CalendarIcon,
  CloseIcon,
  DeskIcon,
  DumbbellIcon,
  JournalIcon,
  LiveIcon,
  MenuIcon,
  PaperIcon,
  PathIcon,
  PeopleIcon,
  PersonIcon,
  SignalIcon,
  ToolsIcon,
  WordsIcon,
} from '@/components/ui/icons';

/**
 * The signed-in app's navigation (docs/member-app-plan.md §2). On a laptop,
 * a side nav grouped by what you're doing, with streak, XP and the account
 * at its foot. On a phone, a bottom bar with four places in thumb reach and
 * a Menu that opens the whole nav as a sheet. "Soon" items are words, never
 * dead links. The practice count rides on Practice, and on Learn in the bar.
 */

const ICONS: Record<NavIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  desk: DeskIcon,
  path: PathIcon,
  book: BookIcon,
  practice: DumbbellIcon,
  words: WordsIcon,
  signal: SignalIcon,
  calendar: CalendarIcon,
  journal: JournalIcon,
  tools: ToolsIcon,
  paper: PaperIcon,
  people: PeopleIcon,
  live: LiveIcon,
  me: PersonIcon,
};

type Item = (typeof NAV.groups)[number]['items'][number];

/** The item the path belongs to: the longest href that matches wins, so /learn/glossary isn't Path. */
function activeHref(path: string): string | null {
  let best: string | null = null;
  for (const group of NAV.groups)
    for (const item of group.items as readonly Item[]) {
      const href = item.href;
      if (!href) continue;
      if (
        (path === href || path.startsWith(`${href}/`)) &&
        href.length > (best?.length ?? 0)
      )
        best = href;
    }
  return best;
}

function groupOf(href: string | null): string | null | undefined {
  if (!href) return undefined;
  return NAV.groups.find((g) =>
    (g.items as readonly Item[]).some((i) => i.href === href),
  )?.title;
}

function Due({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="grid min-w-5 place-items-center rounded-full bg-gold px-1 font-mono text-[0.625rem] leading-4 font-bold text-ink num">
      <span aria-hidden>{count}</span>
      <span className="sr-only">{TAB_DUE(count)}</span>
    </span>
  );
}

function NavList({
  path,
  due,
  large = false,
}: {
  path: string;
  due: number;
  large?: boolean;
}) {
  const active = activeHref(path);
  return (
    <ul className={large ? 'space-y-5' : 'space-y-4'}>
      {NAV.groups.map((group) => (
        <li key={group.title ?? 'home'}>
          {group.title ? (
            <p className="mb-1 px-3 font-mono type-tick text-muted uppercase">
              {group.title}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {(group.items as readonly Item[]).map((item) => {
              const Icon = ICONS[item.icon];
              const here = item.href !== null && item.href === active;
              const body = (
                <>
                  <Icon
                    width={20}
                    height={20}
                    className={here ? 'text-gold' : 'text-fg-2'}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.icon === 'practice' ? <Due count={due} /> : null}
                  {item.href === null ? (
                    <span className="rounded-sm border border-line px-1 font-mono text-[0.625rem] leading-4 text-muted uppercase">
                      {NAV.soon}
                    </span>
                  ) : null}
                </>
              );
              const shape = `flex items-center gap-3 rounded-lg px-3 ${large ? 'min-h-12 type-body' : 'min-h-10 type-small'}`;
              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      aria-current={here ? 'page' : undefined}
                      className={`${shape} font-semibold transition-colors ${here ? 'bg-gold-soft text-fg' : 'text-fg-2 hover:bg-raised hover:text-fg'}`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <span className={`${shape} text-muted`} aria-disabled>
                      {body}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2"
      aria-label={BRAND.name}
    >
      <Mark />
      <span className="type-heading text-fg">{BRAND.name}</span>
    </Link>
  );
}

/** Laptop and up: the whole nav down the left. */
export function SideNav() {
  const path = usePathname();
  const due = usePractice().due.length;
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-panel/50 lg:flex">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <nav
        aria-label={NAV.label}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
      >
        <NavList path={path} due={due} />
      </nav>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
        <HabitChips />
        <AccountButton />
      </div>
    </aside>
  );
}

/** Phones and tablets: a slim header with the brand and the habit chips. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md lg:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
        <Brand />
        <HabitChips />
      </div>
    </header>
  );
}

/** Phones and tablets: four places and the Menu, at the bottom. */
export function BottomBar() {
  const path = usePathname();
  const due = usePractice().due.length;
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(path);
  // Close when the route changes, without an effect: compare during render.
  if (open && openedAt !== path) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const group = groupOf(activeHref(path));
  const tab =
    'flex min-h-16 flex-col items-center justify-center gap-1 type-tick font-semibold transition-colors';

  return (
    <>
      <nav
        aria-label={NAV.label}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-[560px] grid-cols-5">
          {NAV.bar.map((item) => {
            const Icon = ICONS[item.icon];
            const here =
              !open &&
              (item.group === null ? path === item.href : group === item.group);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={here ? 'page' : undefined}
                  className={`${tab} ${here ? 'text-gold' : 'text-fg-2'}`}
                >
                  <span className="relative">
                    <Icon
                      width={24}
                      height={24}
                      className={here ? 'animate-pop' : ''}
                    />
                    {item.group === 'Learn' && due > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5">
                        <Due count={due} />
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                  <span
                    aria-hidden
                    className={`h-0.5 w-6 rounded-full ${here ? 'bg-gold' : 'bg-transparent'}`}
                  />
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="app-menu"
              onClick={() => {
                setOpenedAt(path);
                setOpen((v) => !v);
              }}
              className={`${tab} w-full ${open ? 'text-gold' : 'text-fg-2'}`}
            >
              {open ? (
                <CloseIcon width={24} height={24} />
              ) : (
                <MenuIcon width={24} height={24} />
              )}
              {open ? NAV.close : NAV.menu}
              <span
                aria-hidden
                className={`h-0.5 w-6 rounded-full ${open ? 'bg-gold' : 'bg-transparent'}`}
              />
            </button>
          </li>
        </ul>
      </nav>
      {open ? (
        <div
          id="app-menu"
          className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 overflow-y-auto bg-ink/97 px-4 pt-4 pb-6 backdrop-blur-md animate-page-in lg:hidden"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <Brand />
            <AccountButton />
          </div>
          <nav aria-label={NAV.menu}>
            <NavList path={path} due={due} large />
          </nav>
        </div>
      ) : null}
    </>
  );
}
