import type { ReactNode } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { AccountButton } from '@/components/auth/AccountButton';
import { Mark } from '@/components/marketing/Mark';
import { HabitChips } from '@/components/member/HabitChips';
import { TabBar, TabLinks } from '@/components/member/TabBar';

/**
 * The learner's home screens: the path, the lessons and their progress.
 * Streak and XP stay in the header; the tabs sit at the bottom on a phone,
 * in the header on a laptop.
 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={BRAND.name}
          >
            <Mark />
            <span className="hidden type-heading text-fg sm:inline">
              {BRAND.name}
            </span>
          </Link>
          <TabLinks />
          <div className="flex items-center gap-2">
            <HabitChips />
            <span className="hidden lg:inline-flex">
              <AccountButton />
            </span>
          </div>
        </div>
      </header>
      <div className="animate-page-in pb-nav lg:pb-12">{children}</div>
      <TabBar />
    </>
  );
}
