import type { AnchorHTMLAttributes, ReactNode } from 'react';

/**
 * `next/link` for the preview bundle, which runs as a single page with no
 * router. "Back to home" and "Leave" restart the month instead of going to a
 * home page the preview doesn't have.
 */
export default function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      {...props}
      href="#top"
      onClick={(event) => {
        event.preventDefault();
        if (href === '/') window.location.reload();
      }}
    >
      {children}
    </a>
  );
}
