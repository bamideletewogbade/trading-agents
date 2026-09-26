'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TABS } from '@/content/member';
import { BookIcon, PathIcon, PersonIcon } from '@/components/ui/icons';

const ICONS = { path: PathIcon, book: BookIcon, me: PersonIcon } as const;

/**
 * The three places a learner lives on a phone: the path, the lesson
 * library and their progress. Fixed at the bottom within thumb reach, above
 * the phone's own gesture bar; from a laptop's width it sits in the header
 * instead (the layout decides).
 */
export function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label={TABS.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-3">
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
                <Icon
                  width={24}
                  height={24}
                  className={active ? 'animate-pop' : ''}
                />
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

/** The same three places as header links, for wider screens. */
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
