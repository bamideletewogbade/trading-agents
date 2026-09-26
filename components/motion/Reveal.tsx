'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Fades and lifts its children in the first time they scroll into view.
 *
 * Hidden only once JavaScript has said it's running (`html.js`, set by the
 * root layout), so a phone where the script never arrives still shows every
 * word. Anyone who asked for less motion gets the words with no movement
 * (app/globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-shown', '');
            observer.unobserve(entry.target);
          }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
