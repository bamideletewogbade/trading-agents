'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TABS, TAB_DUE } from '@/content/member';
import { usePractice } from '@/lib/client/practice';
import {
  BookIcon,
  DumbbellIcon,
  PathIcon,
  PersonIcon,
} from '@/components/ui/icons';

const ICONS = {
  path: PathIcon,
  practice: DumbbellIcon,
  book: BookIcon,
  me: PersonIcon,
} as const;

/**
 * The four places a learner lives on a phone: the path, practice (with a
 * count of mistakes ready to try again), the lesson library and their
 * progress. Fixed at the bottom within thumb reach, above
 * the phone's own gesture bar; from a laptop's width it sits in the header
 * instead (the layout decides).
 */
export function TabBar() {
  const path = usePathname();
  const due = usePractice().due.length;
  return (
    <nav
      aria-label={TABS.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-4">
        {TABS.items.map((tab) => {
          const Icon = ICONS[tab.icon];
          const active = path === tab.href || path.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 type-tick font-semibold transition-colors ${active ? 'text-gold' : 'text-fg-2'}`}
              >
                <span className="relative">
                  <Icon
                    width={24}
                    height={24}
                    className={active ? 'animate-pop' : ''}
                  />
                  {tab.icon === 'practice' && due > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 font-mono text-[0.625rem] leading-4 font-bold text-ink num">
                      <span aria-hidden>{due}</span>
                      <span className="sr-only">{TAB_DUE(due)}</span>
                    </span>
                  ) : null}
                </span>
                {tab.label}
                <span
                  aria-hidden
                  className={`h-0.5 w-6 rounded-full transition-colors ${active ? 'bg-gold' : 'bg-transparent'}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The same four places as header links, for wider screens. */
export function TabLinks() {
  const path = usePathname();
  return (
    <nav aria-label={TABS.label} className="hidden items-center gap-1 lg:flex">
      {TABS.items.map((tab) => {
        const active = path === tab.href || path.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-md px-3 type-small font-semibold ${active ? 'text-gold' : 'text-fg-2 hover:text-fg'}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
