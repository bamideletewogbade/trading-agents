import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const results = [];
mkdirSync('shots/landing-review', { recursive: true });
try {
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('http://localhost:5177/', {
      waitUntil: 'networkidle',
    });
    assert.equal(res.status(), 200);
    await page
      .getByRole('heading', { name: 'A share. Two prices. What changes?' })
      .waitFor();
    await page
      .getByRole('button', { name: 'See the result', exact: true })
      .click();
    await page.getByRole('status').filter({ hasText: 'You gain' }).waitFor();
    assert.match(await page.getByRole('status').innerText(), /2/);
    await page.getByRole('button', { name: 'Lower ↓', exact: true }).click();
    await page
      .getByRole('button', { name: 'See the result', exact: true })
      .click();
    await page.getByRole('status').filter({ hasText: 'You lose' }).waitFor();
    await page.getByRole('button', { name: 'The same =', exact: true }).click();
    await page
      .getByRole('button', { name: 'See the result', exact: true })
      .click();
    await page
      .getByRole('status')
      .filter({ hasText: 'You break even.' })
      .waitFor();
    const measure = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      badAnchors: [...document.querySelectorAll('a[href^="#"]')]
        .filter((a) => !document.getElementById(a.hash.slice(1)))
        .map((a) => a.hash),
      h1: document.querySelector('h1')?.textContent,
    }));
    if (measure.scroll > width) {
      await page.screenshot({
        path: `shots/landing-review/overflow-${width}.png`,
        fullPage: true,
      });
      console.log(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              text: e.textContent.slice(0, 60),
              right: e.getBoundingClientRect().right,
            }))
            .slice(0, 25),
        ),
      );
    }
    assert.ok(measure.scroll <= width, `Overflow at ${width}`);
    assert.deepEqual(measure.badAnchors, []);
    assert.deepEqual(errors, []);
    await page.getByRole('button', { name: 'Higher ↑', exact: true }).click();
    await page.evaluate(() => scrollTo(0, 0));
    if ([375, 1440].includes(width)) {
      await page.screenshot({ path: `shots/landing-review/${width}.png` });
      await page.screenshot({
        path: `shots/landing-review/${width}-full.png`,
        fullPage: true,
      });
    }
    results.push({
      ...measure,
      interactions: 'gain/loss/break-even passed',
      errors,
    });
    await context.close();
  }
  writeFileSync(
    'shots/landing-review/results.json',
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
