/**
 * Every experience that exists. The coach can only summon what is listed
 * here (spec §37), and the server only replays runs of what is listed here.
 * Adding an experience is one entry, plus its view in
 * components/experiences/<key>.
 */

import { payday } from './payday.ts';
import type { Experience } from './types.ts';

/**
 * Experiences of different shapes, held as `unknown`: whoever takes one out
 * gets its inputs through `parseConfig` and `parseAction`, which is exactly
 * the validation a stranger's input needs anyway. (Method-style members in
 * `Experience` make each specific experience assignable here.)
 */
export type AnyExperience = Experience<unknown, unknown, unknown, unknown>;

export const EXPERIENCES: Readonly<Record<string, AnyExperience>> = {
  [payday.key]: payday,
};

export function experience(key: string) {
  const found = EXPERIENCES[key];
  if (!found) throw new Error(`No experience called ${key}.`);
  if (!found.truth)
    throw new Error(
      `${key} declares no truth; every experience must (spec §84).`,
    );
  return found;
}
