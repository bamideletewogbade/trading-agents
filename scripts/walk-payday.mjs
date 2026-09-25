/**
 * The first 3 minutes, played by a script the way a learner would, at phone
 * size: split the money, guess, watch the month, open What If, see the maths.
 *
 *     pnpm dev              (in another terminal)
 *     pnpm walk             screenshots of every step into shots/payday-*.png
 *     pnpm walk <url>       against another server
 *     pnpm walk <url> --test  marked as test traffic: played, but not stored
 *
 * It plays Ghana's pilot month with the split from the plan's own example
 * (§8), so the numbers it expects are the ones worked out by hand in
 * scripts/check-engines.ts: GH₵460 owed at month end, GH₵115 if the scheme
 * money had gone to savings, GH₵5.03 billion in the reveal. It fails on any
 * of those being wrong, on a console error, and on sideways scrolling.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const BASE = (
  args.find((arg) => !arg.startsWith('--')) ?? 'http://localhost:5177'
).replace(/\/$/, '');
const bundled = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(bundled) ? { executablePath: bundled } : {},
);
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
if (args.includes('--test'))
  await context.addCookies([{ name: 'sika_test', value: '1', url: BASE }]);
const page = await context.newPage();
mkdirSync('shots', { recursive: true });

const problems = [];
page.on('console', (message) => {
  if (message.type() === 'error')
    problems.push(`console: ${message.text().slice(0, 200)}`);
});
page.on('pageerror', (error) => problems.push(`page: ${error.message}`));

let shot = 0;
async function snap(name) {
  shot += 1;
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  if (overflow) problems.push(`${name}: scrolls sideways at 375 px`);
  await page.screenshot({
    path: `shots/payday-${String(shot).padStart(2, '0')}-${name}.png`,
    fullPage: true,
  });
}

async function expectText(text) {
  try {
    await page
      .getByText(text, { exact: false })
      .first()
      .waitFor({ timeout: 5000 });
  } catch {
    problems.push(`expected to see "${text}"`);
  }
}

await page.goto(`${BASE}/play/payday?country=GH`, { waitUntil: 'networkidle' });
await expectText('GH₵3,000');
await snap('intro');

await page.getByRole('button', { name: 'Split the money' }).click();
await page.getByRole('button', { name: 'Set to GH₵900' }).click();
await page.getByRole('button', { name: 'Set to GH₵400' }).click();
for (let i = 0; i < 2; i += 1)
  await page.getByRole('button', { name: 'More for Savings' }).click();
for (let i = 0; i < 3; i += 1)
  await page.getByRole('button', { name: 'More for Kofi’s guy' }).click();
await page.getByRole('button', { name: 'Put the rest here' }).click();
await expectText('All placed');
await snap('split');
await page.getByRole('button', { name: 'Next' }).click();

await page.getByRole('slider').fill('90');
await expectText('90 days');
await snap('guess');
await page.getByRole('button', { name: 'Play the month' }).click();

await page.waitForTimeout(3200);
await snap('month-playing');
await page.getByRole('button', { name: 'Skip to the result' }).click();
await page.getByRole('button', { name: 'Month end' }).click();

await expectText('You guessed 90 days. It’s 0 days.');
await expectText('GH₵460');
await snap('result');

await page.getByRole('button', { name: 'What if…?' }).click();
await snap('whatif');
await page
  .getByRole('button', { name: 'Put the GH₵300 for Kofi’s guy into savings' })
  .click();
await expectText('GH₵115');
await snap('compare');

await page.getByRole('button', { name: 'About Kofi’s guy…' }).click();
await expectText('GH₵5.03 billion');
await snap('reveal');

await page.getByRole('button', { name: 'Play another month' }).click();
await expectText('Same life, a new month.');

// Give the last beacons a moment to leave before the browser closes.
await page.waitForTimeout(500);
await browser.close();

if (problems.length) {
  console.error(problems.map((line) => `✗ ${line}`).join('\n'));
  process.exit(1);
}
console.log(
  `✓ the first 3 minutes play through: ${shot} screens in shots/payday-*.png`,
);
