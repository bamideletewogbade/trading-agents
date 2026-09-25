/**
 * Assertions over the pure core: money, phones, countries, seeded randomness,
 * and the determinism rules every engine has to keep.
 *
 *     pnpm check
 *
 * Plain Node with type stripping. No database, no network, no framework,
 * which is why `lib/core` imports its neighbours by relative `.ts` path and
 * nothing else. It exits non-zero on the first run with any failure, so it
 * can gate a push.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { deepStrictEqual, equal, ok, throws } from 'node:assert/strict';
import {
  add,
  formatBp,
  formatMoney,
  fromMinor,
  money,
  mulDiv,
  ofBp,
  parseMoney,
  percentToBp,
  shareBp,
  subtract,
  times,
  usdMicros,
} from '../lib/core/money.ts';
import {
  formatPhone,
  guessMomoProvider,
  normalisePhone,
  waDigits,
} from '../lib/core/phone.ts';
import { COUNTRIES, COUNTRY_ORDER, guessCountry } from '../lib/core/country.ts';
import { createRng } from '../lib/core/rng.ts';
import { CODE_ALPHABET, newLoginCode } from '../lib/core/ids.ts';

/** The first six `int(1, 100)` draws for seed "sika", recorded 25 Sep 2026. */
const PINNED_DRAWS = [64, 56, 27, 63, 73, 78];

let passed = 0;
const failures: string[] = [];

function check(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    failures.push(
      `✗ ${name}\n    ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
    );
  }
}

/* ── Money ─────────────────────────────────────────────────────────────── */

check('0.10 + 0.20 is exactly 0.30', () => {
  deepStrictEqual(add(money(0.1, 'GHS'), money(0.2, 'GHS')), money(0.3, 'GHS'));
});

check('currencies never mix', () => {
  throws(() => add(money(1, 'GHS'), money(1, 'NGN')));
  throws(() => subtract(money(1, 'KES'), money(1, 'USD')));
});

check('formatting: whole amounts drop .00, true minus, KSh is spaced', () => {
  equal(formatMoney(money(1000, 'GHS')), 'GH₵1,000');
  equal(formatMoney(fromMinor(125050, 'GHS')), 'GH₵1,250.50');
  equal(formatMoney(money(2500, 'NGN')), '₦2,500');
  equal(formatMoney(money(250, 'KES')), 'KSh 250');
  equal(formatMoney(money(-60, 'USD')), '−$60');
  equal(formatMoney(money(40, 'USD'), { signed: true }), '+$40');
  equal(formatMoney(fromMinor(5, 'GHS')), 'GH₵0.05');
});

check('parsing the ways people type amounts', () => {
  deepStrictEqual(parseMoney('1,250.50', 'GHS'), fromMinor(125050, 'GHS'));
  deepStrictEqual(parseMoney('GH₵ 85', 'GHS'), money(85, 'GHS'));
  deepStrictEqual(parseMoney('GHS49', 'GHS'), money(49, 'GHS'));
  deepStrictEqual(parseMoney('₦2,500', 'NGN'), money(2500, 'NGN'));
  deepStrictEqual(parseMoney('KSh 250', 'KES'), money(250, 'KES'));
  equal(parseMoney('12.005', 'GHS'), null);
  equal(parseMoney('about 50', 'GHS'), null);
  equal(parseMoney('-5', 'GHS'), null);
});

check('mulDiv rounds half away from zero, exactly, past 2^53', () => {
  equal(mulDiv(5, 1, 2), 3);
  equal(mulDiv(-5, 1, 2), -3);
  equal(mulDiv(4, 1, 3), 1);
  equal(mulDiv(-4, 1, 3), -1);
  // 9e14 × 9e3 overflows a double's exact range; BigInt keeps it exact.
  equal(mulDiv(900_000_000_000_000, 9_999, 10_000), 899_910_000_000_000);
});

check(
  "the spec's leverage example: $500 at 20×, −3% → −$300, $200 left (−60%)",
  () => {
    const capital = money(500, 'USD');
    const exposure = times(capital, 20);
    equal(formatMoney(exposure), '$10,000');
    const pnl = ofBp(exposure, -300);
    equal(formatMoney(pnl), '−$300');
    const equity = add(capital, pnl);
    equal(formatMoney(equity), '$200');
    equal(shareBp(pnl, capital), -6000);
    equal(formatBp(shareBp(pnl, capital)), '−60%');
  },
);

check('"doubles every 30 days": GH₵300 after 24 doublings', () => {
  let amount = money(300, 'GHS');
  for (let month = 0; month < 24; month += 1) amount = times(amount, 2);
  equal(formatMoney(amount), 'GH₵5,033,164,800');
});

check('compact amounts for hero numbers', () => {
  equal(
    formatMoney(fromMinor(503_316_480_000, 'GHS'), { compact: true }),
    'GH₵5.03 billion',
  );
  equal(
    formatMoney(money(1_200_000, 'NGN'), { compact: true }),
    '₦1.2 million',
  );
  equal(
    formatMoney(money(999_999_999, 'GHS'), { compact: true }),
    'GH₵1 billion',
  );
  equal(formatMoney(money(3000, 'GHS'), { compact: true }), 'GH₵3,000');
  equal(
    formatMoney(money(-2_500_000, 'KES'), { compact: true }),
    '−KSh 2.5 million',
  );
});

check('basis points', () => {
  equal(percentToBp(12.5), 1250);
  equal(formatBp(1250), '12.5%');
  equal(formatBp(27), '0.27%');
  equal(formatBp(-300), '−3%');
  equal(formatBp(250, { signed: true }), '+2.5%');
  equal(formatBp(1_000_000), '10,000%');
});

check('AI costs in micro-dollars', () => {
  equal(usdMicros(0.00004), 40);
  equal(usdMicros(0.0015), 1500);
});

check('amounts outside the safe range are refused', () => {
  throws(() => money(Number.MAX_SAFE_INTEGER, 'GHS'));
  throws(() => times(money(1, 'GHS'), 1.5));
});

/* ── Phones ────────────────────────────────────────────────────────────── */

check('Ghana numbers, every way they get typed', () => {
  for (const typed of [
    '0244123456',
    '024 412 3456',
    '+233244123456',
    '233 24 412 3456',
    '00233244123456',
    '244123456',
  ])
    deepStrictEqual(
      normalisePhone(typed, 'GH'),
      { e164: '+233244123456', country: 'GH' },
      typed,
    );
  equal(normalisePhone('0302123456', 'GH'), null); // Accra landline
  equal(normalisePhone('024412345', 'GH'), null); // one digit short
});

check('Nigeria and Kenya', () => {
  deepStrictEqual(normalisePhone('0803 123 4567', 'NG'), {
    e164: '+2348031234567',
    country: 'NG',
  });
  deepStrictEqual(normalisePhone('+234 901 234 5678', 'GH'), {
    e164: '+2349012345678',
    country: 'NG',
  });
  deepStrictEqual(normalisePhone('0712 345 678', 'KE'), {
    e164: '+254712345678',
    country: 'KE',
  });
  deepStrictEqual(normalisePhone('0110 123 456', 'KE'), {
    e164: '+254110123456',
    country: 'KE',
  });
  equal(normalisePhone('0612345678', 'NG'), null);
});

check('a number with its country code keeps its own country', () => {
  equal(normalisePhone('+254712345678', 'GH')?.country, 'KE');
  equal(normalisePhone('+233302123456', 'NG'), null);
});

check('reading numbers back, and wa.me digits', () => {
  const gh = normalisePhone('0244123456', 'GH');
  const ng = normalisePhone('08031234567', 'NG');
  const ke = normalisePhone('0712345678', 'KE');
  ok(gh && ng && ke);
  equal(formatPhone(gh), '024 412 3456');
  equal(formatPhone(ng), '0803 123 4567');
  equal(formatPhone(ke), '0712 345 678');
  equal(waDigits(gh), '233244123456');
});

check('mobile-money network is guessed from the prefix', () => {
  const guess = (typed: string, country: 'GH' | 'NG' | 'KE') => {
    const phone = normalisePhone(typed, country);
    ok(phone, typed);
    return guessMomoProvider(phone);
  };
  equal(guess('0244123456', 'GH'), 'mtn');
  equal(guess('0501234567', 'GH'), 'vod');
  equal(guess('0271234567', 'GH'), 'atl');
  equal(guess('0712345678', 'KE'), 'mpesa');
  equal(guess('08031234567', 'NG'), null);
});

/* ── Countries ─────────────────────────────────────────────────────────── */

check('countries: launch order and guesses', () => {
  deepStrictEqual(COUNTRY_ORDER, ['GH', 'NG', 'KE']);
  equal(COUNTRIES.GH.status, 'launch');
  equal(guessCountry('ng'), 'NG');
  equal(guessCountry('ZA'), 'GH');
  equal(guessCountry(undefined), 'GH');
});

/* ── Seeded randomness ─────────────────────────────────────────────────── */

check('the same seed tells the same story', () => {
  const a = createRng('payday:GH:efua');
  const b = createRng('payday:GH:efua');
  const drawsA = Array.from({ length: 50 }, () => a.int(1, 1000));
  const drawsB = Array.from({ length: 50 }, () => b.int(1, 1000));
  deepStrictEqual(drawsA, drawsB);
  const c = createRng('payday:GH:kofi');
  ok(drawsA.join() !== Array.from({ length: 50 }, () => c.int(1, 1000)).join());
});

check('seeded draws are pinned (a change here breaks every saved run)', () => {
  const rng = createRng('sika');
  deepStrictEqual(
    Array.from({ length: 6 }, () => rng.int(1, 100)),
    PINNED_DRAWS,
  );
});

check('int covers its bounds; weighted follows its weights', () => {
  const rng = createRng(42);
  const seen = new Set<number>();
  for (let i = 0; i < 2000; i += 1) seen.add(rng.int(1, 6));
  deepStrictEqual(
    [...seen].sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6],
  );
  let rent = 0;
  for (let i = 0; i < 20_000; i += 1)
    if (
      rng.weighted([
        ['rent', 3],
        ['gift', 1],
      ] as const) === 'rent'
    )
      rent += 1;
  ok(
    rent > 14_500 && rent < 15_500,
    `rent drawn ${rent} of 20000, expected about 15000`,
  );
});

check('normal() is centred, spread about 1, and bounded', () => {
  const rng = createRng('volatility');
  let sum = 0;
  let squares = 0;
  let extreme = 0;
  const n = 20_000;
  for (let i = 0; i < n; i += 1) {
    const x = rng.normal();
    sum += x;
    squares += x * x;
    extreme = Math.max(extreme, Math.abs(x));
  }
  const mean = sum / n;
  const variance = squares / n - mean * mean;
  ok(Math.abs(mean) < 0.03, `mean ${mean}`);
  ok(Math.abs(variance - 1) < 0.05, `variance ${variance}`);
  ok(extreme <= 6);
});

/* ── Ids ───────────────────────────────────────────────────────────────── */

check('login codes are readable: no I, L, O, U, 0 or 1', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = newLoginCode();
    ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code), code);
    for (const letter of code.replace('-', ''))
      ok(CODE_ALPHABET.includes(letter), code);
  }
});

/* ── Determinism rules over engine code ────────────────────────────────── */

/**
 * No `Math.random()` anywhere a simulation's state is shaped, and none of the
 * functions ECMAScript lets engines approximate differently. See rng.ts for
 * why. Comments are stripped first, so explaining the rule is allowed.
 */
check(
  'engines and core use no Math.random and no engine-dependent maths',
  () => {
    const banned =
      /Math\.(random|sin|cos|tan|asin|acos|atan2?|sinh|cosh|tanh|log|log2|log10|log1p|exp|expm1|pow|cbrt|hypot)\s*\(|\*\*/;
    const offenders: string[] = [];
    for (const root of ['lib/core', 'lib/engines']) {
      for (const file of walk(root)) {
        const code = readFileSync(file, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|[^:])\/\/.*$/gm, '$1');
        code.split('\n').forEach((line, index) => {
          if (banned.test(line))
            offenders.push(`${file}:${index + 1}: ${line.trim()}`);
        });
      }
    }
    ok(offenders.length === 0, offenders.join(' · '));
  },
);

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return []; // lib/engines arrives in Phase 1.
  }
  return entries.flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/* ── Report ────────────────────────────────────────────────────────────── */

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failed, ${passed} passed.`);
  process.exit(1);
}
console.log(`✓ core: ${passed} checks passed.`);
