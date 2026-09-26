'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MARKETING } from '@/content/marketing';
import { BRAND } from '@/lib/brand';
import { Mark } from './Mark';

/**
 * The marketing nav. Links inline from 1024 px; below that a Menu button
 * opens a full-height sheet whose links arrive one after another. The sheet
 * closes on navigation and on Escape, locks the page behind it, and keeps
 * "Start free" in reach of the thumb.
 */

const COPY = MARKETING.nav;

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // Close when the route changes, without an effect: compare during render.
  if (open && openedAt !== pathname) setOpen(false);

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

  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={BRAND.name}
          >
            <Mark />
            <span className="type-heading text-fg">{BRAND.name}</span>
          </Link>

          <nav aria-label={COPY.label} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {COPY.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active(link.href) ? 'page' : undefined}
                    className={`relative inline-flex min-h-12 items-center gap-1.5 rounded-md px-3 type-small transition-colors ${active(link.href) ? 'text-fg' : 'text-fg-2 hover:text-fg'}`}
                  >
                    {link.label}
                    {'badge' in link && link.badge ? (
                      <span className="rounded-sm bg-gold px-1 font-mono text-[0.625rem] leading-4 font-bold text-ink uppercase">
                        {link.badge}
                      </span>
                    ) : null}
                    {active(link.href) ? (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold" />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden min-h-12 items-center rounded-md px-3 type-small font-semibold text-fg-2 hover:text-fg sm:inline-flex"
            >
              {COPY.signIn}
            </Link>
            <Link
              href="/sign-up"
              className="hidden min-h-12 items-center rounded-md bg-gold px-4 type-small font-semibold text-ink transition-[filter] hover:brightness-110 sm:inline-flex"
            >
              {COPY.start}
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => {
                setOpenedAt(pathname);
                setOpen((value) => !value);
              }}
              className="grid size-12 place-items-center rounded-md border border-edge bg-raised text-fg lg:hidden"
            >
              <span className="sr-only">{open ? COPY.close : COPY.menu}</span>
              <span aria-hidden className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 h-0.5 w-5 rounded-full bg-fg transition-transform duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
                />
                <span
                  className={`absolute top-1.5 left-0 h-0.5 w-5 rounded-full bg-fg transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
                />
                <span
                  className={`absolute left-0 h-0.5 w-5 rounded-full bg-fg transition-transform duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>
      {open ? (
        <div
          id="site-menu"
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
              aria-label={BRAND.name}
            >
              <Mark />
              <span className="type-heading text-fg">{BRAND.name}</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-12 place-items-center rounded-md border border-edge bg-raised text-fg"
            >
              <span className="sr-only">{COPY.close}</span>
              <span aria-hidden className="text-xl leading-none">
                ✕
              </span>
            </button>
          </div>
          <div className="h-6 shrink-0" />
          <nav aria-label={COPY.label}>
            <ul className="space-y-1">
              {COPY.links.map((link, i) => (
                <li
                  key={link.href}
                  className="animate-menu-item"
                  style={{ animationDelay: `${60 + i * 45}ms` }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active(link.href) ? 'page' : undefined}
                    className={`flex min-h-14 items-center justify-between rounded-md px-3 text-[1.625rem] leading-8 font-semibold tracking-[-0.01em] ${active(link.href) ? 'text-gold' : 'text-fg'}`}
                  >
                    <span className="flex items-center gap-2">
                      {link.label}
                      {'badge' in link && link.badge ? (
                        <span className="rounded-sm bg-gold px-1 font-mono text-[0.625rem] leading-4 font-bold text-ink uppercase">
                          {link.badge}
                        </span>
                      ) : null}
                    </span>
                    <span aria-hidden className="font-mono text-fg-2">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div
            className="mt-auto space-y-3 pt-8 animate-menu-item"
            style={{ animationDelay: '320ms' }}
          >
            <p className="font-mono type-tick text-muted uppercase">
              {COPY.menuNote}
            </p>
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center justify-center rounded-md bg-gold px-5 type-body font-semibold text-ink"
            >
              {COPY.start}
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center justify-center rounded-md border border-edge bg-raised px-5 type-body font-semibold text-fg"
            >
              {COPY.signIn}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
