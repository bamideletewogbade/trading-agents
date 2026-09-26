/**
 * Plays onboarding the way a person would: some answers typed in their own
 * words, some tapped, then on to the desk. Fails on any console error, or if
 * the summary or the desk doesn't reflect the answers.
 *
 *     pnpm dev                              (in another terminal)
 *     pnpm walk:onboarding                  against localhost
 *     pnpm walk:onboarding <url>            against another server
 */

import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? 'http://localhost:5177').replace(/\/$/, '');
const bundled = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(bundled) ? { executablePath: bundled } : {},
);
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const problems = [];
page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`);
});

const input = page.locator('#answer');
async function type(text) {
  await input.waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => !document.querySelector('#answer')?.disabled,
  );
  await input.fill(text);
  await input.press('Enter');
}
async function tap(label) {
  const chip = page.getByRole('button', { name: label, exact: true });
  await chip.waitFor({ state: 'visible' });
  await chip.click();
}

try {
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
  await type("hi, I'm Ama");
  await page.getByText('Nice to meet you, Ama').waitFor();
  await type('everyone is talking about the Dangote IPO');
  await tap('A few times');
  await type('NGX stocks and a bit of crypto');
  await type('I think 50');
  await page.getByText('It’s actually 100%').waitFor();
  await tap('I’d want proof first');
  await type('15 mins');
  await page.getByText('Here’s what I heard, Ama:').waitFor();
  const summary = await page.locator('main').innerText();
  for (const expected of ['How an IPO works', 'stage 1', 'IPO 101 first'])
    if (!summary.includes(expected))
      problems.push(`summary is missing “${expected}”`);
  await page.getByRole('button', { name: 'Take me to my desk' }).click();
  await page.waitForURL(`${BASE}/desk`, { timeout: 15_000 });
  await page.getByText('Ama.').first().waitFor({ timeout: 15_000 });
  const desk = await page.locator('main').innerText();
  if (!desk.includes('How an IPO works: the Dangote offer'))
    problems.push('the desk does not start with IPO 101');
} catch (error) {
  problems.push(
    error instanceof Error ? error.message.split('\n')[0] : String(error),
  );
  await page
    .screenshot({ path: 'shots/onboarding-failure.png', fullPage: true })
    .catch(() => {});
}

await browser.close();
if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exit(1);
}
console.log(
  '✓ onboarding: typed and tapped answers read right, placed at IPO 101, desk shows it.',
);
