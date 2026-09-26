import Link from 'next/link';
import { MARKETING } from '@/content/marketing';
import { BRAND } from '@/lib/brand';
import { Mark } from './Mark';

const COPY = MARKETING.footer;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 type-heading text-fg">
            <Mark /> {BRAND.name}
          </p>
          <p className="max-w-[36ch] type-body text-fg-2">{COPY.tagline}</p>
          <p className="type-small text-muted">{COPY.made}</p>
        </div>
        {COPY.columns.map((column) => (
          <div key={column.title}>
            <p className="font-mono type-label text-muted">{column.title}</p>
            <ul className="mt-3 space-y-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center type-small text-fg-2 hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-6 type-small text-muted sm:px-8">
          {COPY.disclaimer}
        </p>
      </div>
    </footer>
  );
}
