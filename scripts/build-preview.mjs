/**
 * Builds the browser-only preview of the first 3 minutes into one
 * self-contained HTML file, for publishing as a shareable page before (or
 * alongside) the real deploy.
 *
 *     pnpm preview:build            → dist-preview/sika-lab-payday.html
 *
 * The page carries its own script and styles inline and pulls only Inter from
 * Google Fonts, so it runs anywhere a single HTML file can be served. It
 * records nothing: the save calls are shimmed out (preview/shims/track.ts).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

execFileSync(
  'npx',
  ['vite', 'build', '--config', 'vite.preview.config.ts', '--logLevel', 'warn'],
  { stdio: 'inherit' },
);

const out = 'dist-preview';
const html = readFileSync(join(out, 'index.html'), 'utf8');
const script = /<script[^>]+src="\.\/([^"]+\.js)"[^>]*><\/script>/.exec(
  html,
)?.[1];
const style =
  /<link[^>]+rel="stylesheet"[^>]+href="\.\/([^"]+\.css)"[^>]*>/.exec(
    html,
  )?.[1];
if (!script || !style)
  throw new Error(
    'The preview build did not produce one script and one stylesheet.',
  );

// A literal closing tag inside inlined code would end the element early.
const js = readFileSync(join(out, script), 'utf8').replaceAll(
  '</script',
  '<\\/script',
);
const css = readFileSync(join(out, style), 'utf8').replaceAll(
  '</style',
  '<\\/style',
);

const page = `<title>Sika Lab Payday</title>
<meta name="theme-color" content="#0a0c10">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
const file = join(out, 'sika-lab-payday.html');
writeFileSync(file, page);
console.log(`✓ ${file} · ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`);
