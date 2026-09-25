'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TABS, type TabKey } from '@/content/copy/shell';
import {
  BookIcon,
  CoachIcon,
  DumbbellIcon,
  HomeIcon,
  StepsIcon,
} from '@/components/ui/icons';

/**
 * The five tabs (spec §11, design brief §6). Icon and label always: an icon
 * alone is a guessing game on a first visit. The active tab gets a gold
 * icon, a gold bar and `aria-current`, so it's marked three ways.
 *
 * On phones it sits at the bottom, above the gesture bar. From 1024 px wide it
 * becomes a rail down the left side, where a mouse expects it.
 */

const ICONS: Record<TabKey, typeof HomeIcon> = {
  home: HomeIcon,
  learn: BookIcon,
  practice: DumbbellIcon,
  progress: StepsIcon,
  coach: CoachIcon,
};

function isActive(pathname: string, href: string): boolean {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ label }: { label: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:inset-x-auto lg:top-0 lg:left-0 lg:w-24 lg:border-t-0 lg:border-r lg:pb-0"
    >
      <ul className="mx-auto grid h-16 max-w-[480px] grid-cols-5 lg:mt-6 lg:h-auto lg:max-w-none lg:grid-cols-1 lg:gap-2">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = ICONS[tab.key];
          return (
            <li key={tab.key} className="flex">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-12 w-full flex-col items-center justify-center gap-1 transition-colors duration-(--duration-base) lg:min-h-16 ${
                  active ? 'text-fg' : 'text-muted hover:text-fg-2'
                }`}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-gold lg:top-auto lg:left-0 lg:h-8 lg:w-0.5"
                  />
                ) : null}
                <Icon
                  width={22}
                  height={22}
                  className={active ? 'text-gold' : undefined}
                />
                <span className="text-[0.6875rem] leading-none font-semibold tracking-wide">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
