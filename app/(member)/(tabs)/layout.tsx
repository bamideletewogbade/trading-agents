import type { ReactNode } from 'react';
import { BottomBar, SideNav, TopBar } from '@/components/member/AppNav';

/**
 * The signed-in app (docs/member-app-plan.md §2): the desk, learning,
 * signals, the journal and tools, and progress. A side nav on a laptop; on
 * a phone, a slim header and a bottom bar whose Menu opens everything.
 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex">
      <SideNav />
      <div className="min-w-0 flex-1">
        <TopBar />
        <div className="animate-page-in pb-nav lg:pb-12">{children}</div>
      </div>
      <BottomBar />
    </div>
  );
}
