/**
 * Plays onboarding the way a person would: some answers typed in their own
 * words, some tapped, two it can't read (asked again, then skipped), then
 * on to the desk. Fails on any console error, or if
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
/** The newest line sits inside the log's visible area, not below the chips. */
async function newestInView(what) {
  const seen = await page
    .waitForFunction(
      () => {
        const log = document.querySelector('[aria-live="polite"]');
        const last = log?.querySelector('ul > li:last-child');
        if (!log || !last) return false;
        const box = log.getBoundingClientRect();
        const line = last.getBoundingClientRect();
        return line.bottom <= box.bottom + 1 && line.bottom > box.top;
      },
      null,
      { timeout: 3_000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!seen) problems.push(`${what} is hidden below the view`);
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
  // Two answers the reading can't place: asked again with examples, then
  // skipped, never a loop and never "tap one".
  await type('hmm');
  await page.getByText('Say it your way, like “I’d join”').waitFor();
  await newestInView('the scam question asked again');
  await type('hmm');
  await page.getByText('No problem, let’s skip that one.').waitFor();
  // Typed time, the way people type it.
  await type('it depends');
  await page.getByText('Roughly how long a day? Say it your way').waitFor();
  await newestInView('the time question asked again');
  await type('about 2hrs');
  await page.getByText('Here’s what I heard, Ama:').waitFor();
  const summary = await page.locator('main').innerText();
  for (const expected of [
    'How an IPO works',
    'course 1',
    'IPO 101 first',
    'An hour or more a day',
  ])
    if (!summary.includes(expected))
      problems.push(`summary is missing “${expected}”`);
  await page.getByRole('button', { name: 'Show me my path' }).click();
  await page.waitForURL(`${BASE}/desk`, { timeout: 15_000 });
  await page
    .getByText(/Good (morning|afternoon|evening), Ama/)
    .first()
    .waitFor({ timeout: 15_000 });
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
  '✓ onboarding: typed and tapped answers read right (“about 2hrs” included), two unclear answers skip instead of looping, placed at IPO 101, desk shows it.',
);
