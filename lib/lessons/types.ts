/**
 * The lesson format. A lesson is a list of beats, each one a step of the
 * learning loop (spec §18): see it, touch it, predict, decide, see the
 * consequence, hear why, try again, and a check at the end.
 *
 * Beats are data, and the player draws them. The interactive parts are
 * *widgets*: registered components addressed by name, each backed by an
 * engine (CLAUDE.md rule 2: compose registered experiences, never invent
 * UI). A new lesson is a content file; a new kind of interaction is one
 * widget, registered once and reusable by every lesson after.
 */

export const WIDGET_NAMES = [
  'noise-filter',
  'signal-or-noise',
  'ipo-lab',
  'order-book',
  'spread',
  'order-types',
  'market-sorter',
  'leverage',
  'costs',
  'chart-types',
  'candle-anatomy',
  'timeframes',
  'trend-swings',
  'find-support',
  'range-or-trend',
  'volume-breakout',
  'plan-stop',
  'position-size',
  'r-multiples',
  'drawdown',
  'expectancy',
] as const;

export type WidgetName = (typeof WIDGET_NAMES)[number];

export type LoopTag =
  | 'see'
  | 'touch'
  | 'predict'
  | 'decide'
  | 'consequence'
  | 'why'
  | 'again'
  | 'check';

export type WidgetProps = Readonly<Record<string, string | number | boolean>>;

export type Option = {
  label: string;
  correct?: boolean;
  /** Said after this option is picked, right or wrong. */
  feedback: string;
};

export type Beat =
  | {
      kind: 'say';
      tag: LoopTag;
      title: string;
      body: string;
      points?: string[];
    }
  | {
      kind: 'widget';
      tag: LoopTag;
      title: string;
      body?: string;
      widget: WidgetName;
      props?: WidgetProps;
      /** Continue waits until the learner has done the widget's one thing. */
      gate?: boolean;
    }
  | { kind: 'choice'; tag: LoopTag; prompt: string; options: Option[] }
  | { kind: 'reflect'; tag: LoopTag; prompt: string; placeholder: string };

export type LessonDef = {
  id: string;
  /** What to remember, shown on the finish screen. */
  takeaways: string[];
  /** Built on demand, so every number in the words comes from an engine at that moment. */
  beats: () => Beat[];
};
