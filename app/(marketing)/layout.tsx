import type { ReactNode } from 'react';
import { Announcement } from '@/components/marketing/Announcement';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteNav } from '@/components/marketing/SiteNav';

/**
 * Every marketing page: the announcement strip, the nav, the page, the
 * footer. Pages bring only their own sections, so a new page is a folder
 * here and a line in content/marketing.ts, and nothing else moves.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Announcement today={today} />
      <SiteNav />
      <main id="content" className="animate-page-in">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
