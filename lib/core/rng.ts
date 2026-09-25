/**
 * Seeded randomness for simulations, identical on every device.
 *
 * A simulation run is `{ config, seed, actions[] }` and its state is
 * recomputed from those (plan §4.3). That is what makes "What if?" a replay,
 * lets a friend play the same year from a shared link, and lets the server
 * check a run before it counts. All three break if the same seed gives a
 * different story on a Safari phone than on the server.
 *
 * Two rules follow, and `pnpm check` enforces both over `lib/engines` and
 * this file:
 *
 * 1. **No `Math.random()`.** Every draw comes from a generator made here.
 * 2. **No `Math.sin`, `cos`, `log`, `exp` or `pow` in anything that shapes
 *    state.** ECMAScript lets each JavaScript engine approximate those
 *    differently in the last bits, so a V8 server and a JavaScriptCore iPhone
 *    can drift apart after a few hundred steps. `+ − × ÷` and `Math.sqrt` are
 *    exactly specified by IEEE 754 and safe. That is why `normal()` below sums
 *    uniforms instead of using Box–Muller.
 *
 * The generator is sfc32 (Chris Doty-Humphrey's Small Fast Counter), seeded
 * through cyrb128 so a readable seed like `"payday:GH:2026-09-25"` works as
 * well as a number. 32-bit integer arithmetic only.
 *
 * Pure: `pnpm check` runs this file under plain Node.
 */

export type Rng = {
  /** A float in [0, 1). */
  next(): number;
  /** An integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  /** True with probability `bp` / 10,000. */
  chanceBp(bp: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Pick by integer weights: `weighted([['rent', 3], ['gift', 1]])`. */
  weighted<T>(items: readonly (readonly [T, number])[]): T;
  /**
   * Approximately standard normal (mean 0, sd 1): the sum of twelve uniforms
   * minus six. Bounded to ±6, which is a feature in a teaching simulation: no
   * one-in-a-billion move ruins a lesson about ordinary volatility.
   */
  normal(): number;
};

/** cyrb128: a string to four 32-bit seed words. */
function cyrb128(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i += 1) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function createRng(seed: string | number): Rng {
  let [a, b, c, d] = cyrb128(String(seed));

  function nextUint32(): number {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  }

  // Discard the first draws: sfc32's opening outputs track the seed closely.
  for (let i = 0; i < 12; i += 1) nextUint32();

  const next = () => nextUint32() / 4294967296;

  return {
    next,
    int(min, max) {
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min)
        throw new RangeError(`Bad integer range ${min}..${max}`);
      return min + Math.floor(next() * (max - min + 1));
    },
    chanceBp(bp) {
      return nextUint32() % 10_000 < bp;
    },
    pick(items) {
      if (items.length === 0) throw new RangeError('Cannot pick from nothing.');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    weighted(items) {
      const total = items.reduce((sum, [, weight]) => sum + weight, 0);
      if (
        !(total > 0) ||
        items.some(([, weight]) => !Number.isSafeInteger(weight) || weight < 0)
      )
        throw new RangeError(
          'Weights must be non-negative integers with a positive total.',
        );
      let roll = Math.floor(next() * total);
      for (const [item, weight] of items) {
        if (roll < weight) return item;
        roll -= weight;
      }
      return (items[items.length - 1] as (typeof items)[number])[0];
    },
    normal() {
      let sum = 0;
      for (let i = 0; i < 12; i += 1) sum += next();
      return sum - 6;
    },
  };
}

/** A fresh seed for a new run: readable, and unique enough per learner. */
export function newSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => byte.toString(36).padStart(2, '0')).join('');
}
