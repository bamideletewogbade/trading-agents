/**
 * Plays every lesson in stages 1–5 in a phone-sized browser, the way a
 * learner would: does each widget's one thing, answers each question until
 * it's right, and finishes. Fails on any console error, a widget that scrolls
 * sideways, a Continue that never unlocks, or a lesson that doesn't reach its
 * finish screen.
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
  't1',
  't2',
  't3',
  't4',
  't5',
  't6',
  't7',
  't8',
  't9',
  't10',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
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
  trendline: async (w) => {
    await click(w, 'A');
    await click(w, 'X');
    await w.getByText(/isn’t support/).waitFor();
    await click(w, 'Start again');
    await click(w, 'A');
    await click(w, 'B');
    await click(w, 'Copy it to the highs');
    await w.getByText(/a channel/).waitFor();
  },
  'moving-averages': async (w) => {
    await radio(w, 'EMA');
    await slide(w, 40);
  },
  'rsi-run': async (w) => {
    for (let i = 0; i < 6; i += 1) await click(w, 'Next 6 bars');
    await w.getByText(/Selling when RSI first passed 70/).waitFor();
  },
  'macd-build': async (w) => {
    for (let i = 0; i < 3; i += 1) await click(w, 'Add the next piece');
  },
  'atr-stops': async (w) => {
    await radio(w, 'A wild market');
    await slide(w, 20);
  },
  'pattern-test': async (w) => {
    await click(w, 'Test on 200 simulated charts');
    await w.getByText('Any candle at all', { exact: true }).waitFor();
  },
  'double-top': async (w) => {
    await click(w, 'Line A');
    await click(w, 'Line B');
    await click(w, 'Play what happened');
    await w.getByText(/The neckline broke/).waitFor();
    await click(w, 'Replay: what if it held?');
    await w.getByText(/The neckline held/).waitFor();
  },
  'fib-test': async (w) => {
    await click(w, 'Test both on 300 random charts');
    await w
      .getByText(/bounces in/)
      .first()
      .waitFor();
  },
  'timeframes-trade': async (w) => {
    await radio(w, 'Bigger trend down');
    await click(w, 'Test buying hourly dips, 150 charts each way');
    await w.getByText('Dips bought in a downtrend').waitFor();
  },
  'news-surprise': async (w) => {
    await slide(w, 2000);
    await radio(w, 'Rate decision');
    await slide(w, 150);
    await w.getByText(/Surprise:/).waitFor();
  },
  'rate-setter': (w) => slide(w, 2700),
  'inflation-replay': async (w) => {
    for (let i = 0; i < 12; i += 1) await click(w, 'Next month');
    await w.getByText(/Saved GH₵/).waitFor();
  },
  'income-statement': (w) => slide(w, 9000),
  'value-trap': async (w) => {
    await click(w, 'Play 5 years');
    await slide(w, 0);
  },
  'release-day': async (w) => {
    await click(w, 'Play the day');
    await w.getByText(/Planned to lose/).waitFor();
    await radio(w, 'Wait for it to settle');
    await click(w, 'Play the day');
    await click(w, 'Try another day');
  },
  'dollar-earnings': async (w) => {
    await slide(w, 40);
    await w
      .getByText(/Short of dollars/)
      .first()
      .waitFor();
  },
  'carry-trade': async (w) => {
    for (let i = 0; i < 7; i += 1) await click(w, 'Next 3 months');
    await w.getByText(/Before the devaluation/).waitFor();
  },
  'news-pullback': async (w) => {
    await click(w, 'Play what happened');
    await w.getByText(/Your result/).waitFor();
    await click(w, 'Replay: what if the good news fades?');
    await w.getByText(/faded/).first().waitFor();
  },
  divergence: async (w) => {
    await click(w, 'Mark the two highs');
    await click(w, 'Play what happened');
    await w.getByText(/rolled over/).waitFor();
    await click(w, 'Replay: the other way');
    await w.getByText(/kept rising/).waitFor();
  },
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
        // A widget's later states (tables, results) mustn't push the page sideways.
        const wide = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (wide > 0)
          problems.push(`${id}: ${name} scrolls sideways by ${wide}px`);
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

// Completion reached the roadmap: each stage header counts its finished
// lessons ("3 of 8 done"), whichever stages the walk played.
await page.goto(`${BASE}/roadmap`, { waitUntil: 'networkidle' });
const counted = await page.getByText(/\d+ of \d+ done/).count();
if (counted < 1)
  problems.push('the roadmap shows no finished lessons after the walk');

await browser.close();
if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${IDS.length} lessons played to the finish.`);
