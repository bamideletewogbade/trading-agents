/**
 * Plays every lesson in stages 1–3 in a phone-sized browser, the way a
 * learner would: does each widget's one thing, answers each question until
 * it's right, and finishes. Fails on any console error, a Continue that
 * never unlocks, or a lesson that doesn't reach its finish screen.
 *
 *     pnpm dev                               (in another terminal)
 *     pnpm walk:lessons                      every lesson
 *     pnpm walk:lessons <url> [id …]         against another server, or some lessons
 */

import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const BASE = (
  args.find((a) => a.startsWith('http')) ?? 'http://localhost:5177'
).replace(/\/$/, '');
const ALL = [
  'm0',
  'm1',
  'm2',
  'm3',
  'm4',
  'f0',
  'm5',
  'm6',
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'r1',
  'r2',
  'r3',
  'r4',
  'r5',
  'r6',
];
const chosen = args.filter((a) => !a.startsWith('http'));
const IDS = chosen.length ? chosen : ALL;

mkdirSync('shots', { recursive: true });
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

async function slide(widget, value) {
  const input = widget.locator('input[type=range]').first();
  await input.fill(String(value));
}
const click = (scope, name, exact = true) =>
  scope.getByRole('button', { name, exact }).first().click();
const radio = (scope, text) =>
  scope.locator('label').filter({ hasText: text }).first().click();

/** How to do each widget's one thing. */
const WIDGETS = {
  'noise-filter': (w) => slide(w, 20),
  'signal-or-noise': async (w) => {
    for (let i = 0; i < 8; i += 1) {
      await w
        .getByRole('button', { name: /Signal/ })
        .first()
        .click();
      await w.getByRole('button', { name: /Next/ }).click();
    }
  },
  'ipo-lab': (w) => w.getByRole('button', { name: /20,000/ }).click(),
  'order-book': (w) => click(w, 'Buy 150 at market'),
  spread: async (w) => {
    for (let i = 0; i < 3; i += 1) await click(w, 'Buy 10, then sell 10 back');
  },
  'order-types': async (w) => {
    await click(w, 'Play the market');
    await radio(w, 'Stop');
    await click(w, 'Play the market');
  },
  'market-sorter': async (w) => {
    for (let i = 0; i < 4; i += 1)
      await w.locator('li').nth(i).getByRole('button').first().click();
  },
  leverage: async (w) => {
    await radio(w, 'I lose a lot');
    await click(w, 'Run the market');
    await w.getByText(/Try another leverage/).waitFor();
  },
  costs: (w) => slide(w, 60),
  'chart-types': async (w) => {
    await radio(w, 'Bars');
    await radio(w, 'Candles');
  },
  'candle-anatomy': async (w) => {
    for (let i = 0; i < 3; i += 1)
      await w.getByRole('button', { name: 'Earlier candle' }).click();
  },
  timeframes: async (w) => {
    await radio(w, '4 hours');
    await radio(w, '1 day');
  },
  'trend-swings': async (w) => {
    await click(w, 'Mark the swings');
    await radio(w, 'Chart B');
    await click(w, 'Mark the swings');
  },
  'find-support': (w) => click(w, 'Line C'),
  'range-or-trend': async (w) => {
    for (let i = 0; i < 4; i += 1)
      await w
        .getByRole('button', { name: 'Trend', exact: true })
        .first()
        .click();
  },
  'volume-breakout': async (w) => {
    await radio(w, 'Breakout B');
    await click(w, 'Play what happened');
  },
  'plan-stop': async (w) => {
    await w.getByText(/Below support, with room/).click();
    await click(w, 'Show what happened');
    await w.getByText(/Same chart, every plan/).waitFor();
  },
  'position-size': (w) => slide(w, 200),
  'r-multiples': (w) => slide(w, 5000),
  drawdown: (w) => slide(w, 5000),
  expectancy: (w) => click(w, 'Run 200 trades'),
};

const continueButton = () => page.locator('div.sticky.bottom-0 button').last();

for (const id of IDS) {
  const before = problems.length;
  try {
    await page.goto(`${BASE}/lesson/${id}`, { waitUntil: 'networkidle' });
    for (let step = 0; step < 20; step += 1) {
      if (await page.getByText('Lesson complete').isVisible()) break;
      const widget = page.locator('[data-widget]');
      if (await widget.count()) {
        const name = await widget.getAttribute('data-widget');
        const act = WIDGETS[name];
        if (!act) throw new Error(`no walk step for widget ${name}`);
        await act(widget);
        await page.screenshot({ path: `shots/lesson-${id}-${name}.png` });
      }
      const options = page.locator('fieldset button[aria-pressed]');
      const count = await options.count();
      for (let i = 0; i < count; i += 1) {
        await options.nth(i).click();
        if (
          await page
            .locator('[aria-live] .text-gold')
            .filter({ hasText: 'Right' })
            .count()
        )
          break;
      }
      const next = continueButton();
      await page.waitForFunction(
        () =>
          !document
            .querySelector('div.sticky.bottom-0 button:last-child')
            ?.hasAttribute('disabled'),
        null,
        { timeout: 8_000 },
      );
      await next.click();
    }
    await page.getByText('Lesson complete').waitFor({ timeout: 8_000 });
    await page.screenshot({ path: `shots/lesson-${id}-done.png` });
    console.log(`✓ ${id}`);
  } catch (error) {
    problems.push(
      `${id}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
    );
    await page
      .screenshot({ path: `shots/lesson-${id}-failure.png`, fullPage: true })
      .catch(() => {});
  }
  if (problems.length > before) console.log(`✗ ${id}`);
}

// Completion reached the roadmap: every walked lesson now shows as done.
await page.goto(`${BASE}/roadmap`, { waitUntil: 'networkidle' });
const ticks = await page.getByText('✓ Done').count();
if (ticks < 1)
  problems.push('the roadmap shows no finished lessons after the walk');

await browser.close();
if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${IDS.length} lessons played to the finish.`);
