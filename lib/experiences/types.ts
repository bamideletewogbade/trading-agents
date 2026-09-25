/**
 * The contract every experience keeps (plan §4.1).
 *
 * An experience is a pure, seeded state machine: `init` from a config and a
 * seed, then `step` once per learner action. Because it's pure, a run is just
 * `{ config, seed, actions[] }`, and everything else is replayed from that:
 * the screen, the server's check of a result, a friend's copy of the same
 * month, and "What if?" (the same actions with one changed).
 *
 * One refinement on the plan: `facts` returns numbers and flags only. The
 * sentences that describe them (for the coach, the screen reader and
 * WhatsApp) are written in `content/`, per country, so engines never hold
 * words and content never does arithmetic.
 *
 * Pure: `pnpm check` runs everything under lib/experiences and lib/engines
 * under plain Node.
 */

import type { Money } from '../core/money.ts';
import type { Truth } from './truth.ts';

export type WhatsAppMode = 'native' | 'flow' | 'handoff' | 'none';

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

export type Experience<Config, State, Action, Outcome> = {
  key: string;
  /** Bumped whenever the maths change; a saved run replays on its own version. */
  version: number;
  truth: Truth;
  /** Skill ids from the skill graph (Phase 3). */
  objectives: readonly string[];
  difficulty: { min: number; max: number };
  whatsapp: WhatsAppMode;
  /** Refuses anything outside the experience's bounds; see `lib/experiences/validate.ts`. */
  parseConfig(input: unknown): Config;
  parseAction(input: unknown): Action;
  init(config: Config, seed: string): State;
  /** Deterministic. Throws `ActionError` for an action the state can't take. */
  step(
    state: State,
    action: Action,
  ): { state: State; outcomes: readonly Outcome[] };
  facts(state: State): Facts;
};

/** An action that doesn't fit the state: allocating twice, playing before allocating. */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

export type Run<Config, Action> = {
  experience: string;
  version: number;
  config: Config;
  seed: string;
  actions: readonly Action[];
};

/** Replay a run from nothing. The only way state is ever rebuilt. */
export function replay<Config, State, Action, Outcome>(
  experience: Experience<Config, State, Action, Outcome>,
  run: Run<Config, Action>,
): { state: State; outcomes: Outcome[] } {
  if (run.version !== experience.version)
    throw new ActionError(
      `${experience.key} run is version ${run.version}; this engine is ${experience.version}.`,
    );
  let state = experience.init(run.config, run.seed);
  const outcomes: Outcome[] = [];
  for (const action of run.actions) {
    const next = experience.step(state, action);
    state = next.state;
    outcomes.push(...next.outcomes);
  }
  return { state, outcomes };
}
