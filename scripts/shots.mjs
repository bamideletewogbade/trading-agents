/**
 * Every screen at phone width: a screenshot each, and a hard check that
 * nothing scrolls sideways (CLAUDE.md rule 8).
 *
 *     pnpm dev                 (in another terminal)
 *     pnpm shots               screenshots at 375 px into shots/, overflow checked at 360, 375, 390
 *     pnpm shots <url>         against another server, e.g. a preview deploy
 *
 * Two pictures per page: `<name>.png` is the first screen exactly as a phone
 * shows it, and `<name>-full.png` is the whole page with the fixed nav hidden
 * (a full-page capture otherwise paints the nav halfway down).
 *
 * Exits non-zero if any page is wider than the phone, naming the element that
 * sticks out, so it can gate a push.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? 'http://localhost:5177').replace(/\/$/, '');
const PAGES = [
  ['landing', '/'],
  ['roadmap', '/roadmap'],
  ['mindset', '/mindset'],
  ['ipo', '/ipo'],
  ['community', '/community'],
  ['pricing', '/pricing'],
  ['sign-in', '/sign-in'],
  ['sign-up', '/sign-up'],
  ['onboarding', '/onboarding'],
  ['desk', '/desk'],
  ['lesson', '/lesson/m1'],
  ['lesson-chart', '/lesson/c4'],
  ['home', '/home'],
  ['learn', '/learn'],
  ['practice', '/practice'],
  ['progress', '/progress'],
  ['coach', '/coach'],
  ['design', '/design'],
  ['payday', '/play/payday?country=GH'],
];
const WIDTHS = [360, 375, 390];

// Cloud sessions ship a Chromium at this path; elsewhere Playwright finds its own.
const bundled = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(bundled) ? { executablePath: bundled } : {},
);
mkdirSync('shots', { recursive: true });

const problems = [];
for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  for (const [name, path] of PAGES) {
    const response = await page.goto(`${BASE}${path}`, {
      waitUntil: 'networkidle',
    });
    if (!response?.ok()) {
      problems.push(`${path} answered ${response?.status()}`);
      continue;
    }
    const overflow = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth <= limit) return null;
      const culprit = [...document.querySelectorAll('body *')].find(
        (el) => el.getBoundingClientRect().right > limit + 0.5,
      );
      return `${document.documentElement.scrollWidth}px wide; first too-wide element: ${culprit?.outerHTML.slice(0, 120) ?? 'unknown'}`;
    });
    if (overflow) problems.push(`${path} at ${width}px: ${overflow}`);
    if (width === 375) {
      await page.screenshot({ path: `shots/${name}.png` });
      const hide = await page.addStyleTag({
        content: 'nav[aria-label] { display: none !important; }',
      });
      await page.screenshot({ path: `shots/${name}-full.png`, fullPage: true });
      await hide.evaluate((node) => node.remove());
    }
  }
  await context.close();
}
await browser.close();

if (problems.length) {
  console.error(problems.map((line) => `✗ ${line}`).join('\n'));
  process.exit(1);
}
console.log(
  `✓ ${PAGES.length} pages at ${WIDTHS.join(', ')} px: no sideways scrolling. Screenshots in shots/.`,
);
