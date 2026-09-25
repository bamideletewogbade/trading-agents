import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The browser-only preview of the first 3 minutes (preview/), for sharing a
 * link before the site is deployed. `pnpm preview:build` turns it into one
 * self-contained HTML file. The real app builds with vite.config.ts.
 */
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'preview',
  base: './',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    alias: [
      { find: 'next/link', replacement: `${root}preview/shims/next-link.tsx` },
      {
        find: '@/lib/client/track',
        replacement: `${root}preview/shims/track.ts`,
      },
      { find: /^@\//, replacement: root },
    ],
  },
  build: {
    outDir: '../dist-preview',
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 100_000_000,
  },
});
