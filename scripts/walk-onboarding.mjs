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
const problems = [];
let page;
async function open() {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  page = await context.newPage();
  page.on('pageerror', (error) =>
    problems.push(`page error: ${error.message}`),
  );
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
}

async function type(text) {
  const input = page.locator('#answer');
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
  await open();
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

  // Everything typed, the way people type on a device: no name given, a
  // crisis phrase (the support card, then the same question waits), and
  // answers that used to be misread.
  await open();
  await type('I’d rather not say');
  await page.getByText('That’s fine, no name needed.').waitFor();
  await page.getByText('What brought you here?').waitFor();
  await type('I lost everything and I want to die');
  await page.getByText('You don’t have to carry this alone').waitFor();
  await newestInView('the support card');
  await page.getByText('Whenever you’re ready, we can carry on').waitFor();
  if (await page.getByRole('button', { name: 'Just curious' }).count())
    problems.push('suggestions crowd the support card');
  await type('I lost money on forex');
  await page.getByText('Thank you for saying that.').waitFor();
  await type('never tried');
  await page.getByText('You’ve got no bad habits to unlearn').waitFor();
  await type('forex and gold');
  await type('2x');
  await page.getByText('Exactly: 100%').waitFor();
  await type('is it legit?');
  await page.getByText('Good instinct.').waitFor();
  await type('like 2 hours');
  await page.getByText('Here’s what I heard:').waitFor();
  const unnamed = await page.locator('main').innerText();
  for (const expected of [
    'You’ve lost money before',
    'You haven’t traded with real money yet',
    'forex, commodities',
    'An hour or more a day',
  ])
    if (!unnamed.includes(expected))
      problems.push(`the typed-only summary is missing “${expected}”`);
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
  '✓ onboarding: typed and tapped answers read right (“about 2hrs” included), two unclear answers skip instead of looping, placed at IPO 101, desk shows it; a declined name, a crisis phrase (support card, question waits) and an all-typed run read right.',
);
