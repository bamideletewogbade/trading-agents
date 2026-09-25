import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import { BRAND, siteUrl } from '@/lib/brand';
import './globals.css';

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND.name}: ${BRAND.promise}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  // Rising steps in gold: getting better is the product. A placeholder mark
  // until the name is settled (lib/brand.ts).
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: BRAND.promise,
    description: BRAND.description,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0c10',
};

/*
 * Applies the device's gain-and-loss colour choice before first paint, so a
 * learner who needs blue–orange never sees a flash of red and green. Must stay
 * in step with PALETTE_KEY in components/shell/PaletteSetting.tsx.
 */
const PALETTE_SCRIPT = `try{if(localStorage.getItem('sika:palette')==='blue-orange')document.documentElement.dataset.palette='blue-orange'}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the palette script may set data-palette on
    // <html> before React hydrates, which is the point, not a mismatch.
    <html lang="en-GH" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PALETTE_SCRIPT }} />
      </head>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
