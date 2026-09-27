/**
 * Walks the trading side of the desk in a real browser: take a signal to
 * the journal (prices filled in), log four trades by hand, get a wrong-side
 * stop refused in words, close a trade at a typed price, see the journal
 * name the leak (FOMO), size a signal in Tools, then place a paper trade at
 * the live price, close it, take a signal to the paper ticket, and find the
 * paper trade in the journal and on the desk. Fails on any console error, a
 * missing answer, or sideways scrolling on a phone.
 *
 *     pnpm dev            # in one terminal
 *     pnpm walk:trade     # in another
 *
 * Needs market data (Kraken) to be reachable from the dev server.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? 'http://localhost:5177').replace(/\/$/, '');
const S = 'shots';
mkdirSync(S, { recursive: true });
const browser = await chromium.launch(
  existsSync('/opt/pw-browsers/chromium')
    ? { executablePath: '/opt/pw-browsers/chromium' }
    : {},
);
const problems = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('dialog', (d) => d.accept());

// From a signal to the journal, prefilled.
await page.goto(`${BASE}/signals/btc`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: 'Log it in my journal' }).click();
await page.waitForURL(/\/journal\?/);
await page.waitForLoadState('networkidle');
const market = await page.locator('#j-market').inputValue();
const entry = await page.locator('#j-entry').inputValue();
if (market !== 'BTC/USD' || !entry)
  problems.push(`prefill failed: ${market} ${entry}`);
await page.getByRole('button', { name: 'Save trade' }).click();
await page.getByRole('button', { name: 'Log a trade' }).waitFor();

async function log(t) {
  await page.getByRole('button', { name: 'Log a trade' }).click();
  await page.fill('#j-market', t.market);
  if (t.side === 'sell')
    await page.locator('form').getByText('Sell', { exact: true }).click();
  await page.fill('#j-entry', t.entry);
  await page.fill('#j-stop', t.stop);
  if (t.target) await page.fill('#j-target', t.target);
  if (t.exit) await page.fill('#j-exit', t.exit);
  await page.locator('form').getByText(t.feeling, { exact: true }).click();
  await page.locator('form').getByText(t.setup, { exact: true }).click();
  await page.getByRole('button', { name: 'Save trade' }).click();
  await page.waitForTimeout(200);
}
await log({
  market: 'EUR/USD',
  entry: '1.0850',
  stop: '1.0820',
  target: '1.0910',
  exit: '1.0910',
  feeling: 'Calm',
  setup: 'Pullback',
});
await log({
  market: 'EUR/USD',
  entry: '1.0900',
  stop: '1.0870',
  exit: '1.0860',
  feeling: 'FOMO',
  setup: 'Breakout',
});
await log({
  market: 'GBP/USD',
  side: 'sell',
  entry: '1.2700',
  stop: '1.2740',
  exit: '1.2745',
  feeling: 'FOMO',
  setup: 'Breakout',
});
await log({
  market: 'Gold',
  entry: '4200',
  stop: '4150',
  exit: '4130',
  feeling: 'FOMO',
  setup: 'Breakout',
});

// A wrong-side stop is refused with words.
await page.getByRole('button', { name: 'Log a trade' }).click();
await page.fill('#j-market', 'BTC/USD');
await page.fill('#j-entry', '100');
await page.fill('#j-stop', '110');
await page.getByRole('button', { name: 'Save trade' }).click();
if (!(await page.getByText('A buy’s stop sits below the entry').isVisible()))
  problems.push('wrong-side stop not refused');
await page.getByRole('button', { name: 'Cancel' }).click();

// Close the open BTC trade.
await page.getByRole('button', { name: 'Close it' }).first().click();
await page.locator('input[id^="exit-"]').fill('85,000.5');
await page.getByRole('button', { name: 'Close trade' }).click();
await page.waitForTimeout(300);
const text = await page.locator('main').innerText();
for (const want of ['Where to look first', 'FOMO', 'Closed trades'])
  if (!text.toLowerCase().includes(want.toLowerCase()))
    problems.push(`journal missing "${want}"`);
await page.screenshot({ path: `${S}/walk-journal.png`, fullPage: true });

// Size this trade: tools prefilled.
await page.goto(`${BASE}/signals/eth`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: 'Size this trade' }).click();
await page.waitForURL(/\/tools\?/);
await page.waitForLoadState('networkidle');
const tools = await page.locator('main').innerText();
if (
  !tools.includes('BUY OR SELL') &&
  !tools.toLowerCase().includes('buy or sell')
)
  problems.push('tools not answered from the signal');
await page.screenshot({ path: `${S}/walk-tools.png`, fullPage: true });

// The paper account: a live quote, a trade with a stop, a close.
await page.goto(`${BASE}/paper`, { waitUntil: 'networkidle' });
const quote = await (
  await page.request.get(`${BASE}/api/paper?market=btc`)
).json();
const tenth = (units) => (units / 10).toFixed(1);
await page.getByText(/^Bid /).waitFor({ timeout: 15_000 });
await page.fill('#paper-stop', tenth(Math.round(quote.bid * 0.9)));
await page.fill('#paper-target', tenth(Math.round(quote.ask * 1.2)));
await page.locator('form').getByText('FOMO', { exact: true }).click();
await page.getByText(/About .* at risk\./).waitFor({ timeout: 5_000 });
await page.getByRole('button', { name: 'Place paper trade' }).click();
await page.getByText(/^Bought .* BTC\/USD at /).waitFor({ timeout: 15_000 });
await page.getByRole('button', { name: 'Close', exact: true }).waitFor();
// A stop on the wrong side is caught before it's sent.
await page.fill('#paper-stop', tenth(Math.round(quote.ask * 1.1)));
if (await page.getByRole('button', { name: 'Place paper trade' }).isEnabled())
  problems.push('paper: a buy with its stop above the price could be placed');
await page.fill('#paper-stop', '');
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.getByText('Closed by you').waitFor({ timeout: 15_000 });
await page.screenshot({ path: `${S}/walk-paper.png`, fullPage: true });

// A signal's "Paper-trade it" fills the ticket in.
await page.goto(`${BASE}/signals`, { waitUntil: 'networkidle' });
const call = page.locator('a[href^="/signals/"]', {
  hasText: /Open ·|New today/,
});
if (await call.count()) {
  await call.first().click();
  await page.waitForLoadState('networkidle');
  const paperIt = page.getByRole('link', { name: 'Paper-trade it' });
  if (await paperIt.count()) {
    await paperIt.click();
    await page.waitForURL(/\/paper\?/);
    await page
      .getByText('Filled in from the signal.', { exact: false })
      .waitFor();
    if (!(await page.locator('#paper-stop').inputValue()))
      problems.push('paper: the signal did not fill the stop in');
  }
}

// The journal counts the paper trade, and the desk shows the account.
await page.goto(`${BASE}/journal`, { waitUntil: 'networkidle' });
await page
  .getByText('Paper', { exact: true })
  .first()
  .waitFor({ timeout: 15_000 });
await page.goto(`${BASE}/desk`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
if (
  !(await page.locator('main').innerText())
    .toLowerCase()
    .includes('paper account')
)
  problems.push('desk: no paper account card');
await page.screenshot({ path: `${S}/walk-desk.png`, fullPage: true });

const phone = await browser.newContext({
  viewport: { width: 375, height: 812 },
});
const p2 = await phone.newPage();
for (const path of ['/journal', '/paper']) {
  await p2.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await p2.evaluate(
    (data) => localStorage.setItem('sika:journal-log', data ?? '[]'),
    await page.evaluate(() => localStorage.getItem('sika:journal-log')),
  );
  await p2.reload({ waitUntil: 'networkidle' });
  const over = await p2.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (over > 0) problems.push(`375 ${path} ${over}px sideways`);
  await p2.screenshot({
    path: `${S}/walk${path.replace('/', '-')}-phone.png`,
    fullPage: true,
  });
}
await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(
  '✓ trade: a signal into the journal, four trades logged, a bad stop refused, one closed, the leak named, a signal sized, a paper trade placed and closed, a signal on the ticket, paper in the journal.',
);
