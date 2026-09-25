import type { ReactNode } from 'react';
import { BottomNav } from '@/components/shell/BottomNav';

/**
 * The product shell (spec §11): the tabs stay put, the experiences change
 * inside them. One column at most 480 px wide on phones and tablets; from
 * 1024 px the nav moves to a left rail and the column may widen.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lg:pl-24">
        <main
          id="content"
          className="mx-auto w-full max-w-[480px] px-4 pb-nav lg:max-w-[1120px] lg:px-8 lg:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomNav label="Main" />
    </>
  );
}
