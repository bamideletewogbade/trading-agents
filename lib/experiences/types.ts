/**
 * Facts: the numbers an engine hands the coach, and nothing else. The coach
 * may repeat these; the numeric guard (lib/intelligence/guard.ts) rejects a
 * turn that says any number not among them (CLAUDE.md rule 1).
 *
 * Numbers and flags only. The sentences that describe them are written in
 * `content/`, so engines never hold words and content never does
 * arithmetic.
 */

import type { Money } from '../core/money.ts';

export type Fact =
  | { kind: 'money'; value: Money }
  | { kind: 'days'; value: number }
  | { kind: 'bp'; value: number }
  | { kind: 'count'; value: number };

export type Facts = {
  numbers: Readonly<Record<string, Fact>>;
  /** The engine's view that this moment is worth a coach question. */
  pivotal: boolean;
};
