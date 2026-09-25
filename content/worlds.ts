/**
 * The progression worlds (spec §65) and the labs (spec §66), as the MVP
 * plans them. Lesson counts follow implementation plan, appendix C; a world
 * marked `later` is shown so the path is visible, but cannot be opened.
 */

export type World = {
  key: string;
  name: string;
  line: string;
  lessons: number;
  status: 'mvp' | 'later';
};

export const WORLDS: readonly World[] = [
  {
    key: 'money',
    name: 'Money',
    line: 'Paydays, emergencies, family, inflation, loan apps.',
    lessons: 6,
    status: 'mvp',
  },
  {
    key: 'risk',
    name: 'Risk',
    line: 'Leverage, position size, and a hundred versions of you.',
    lessons: 6,
    status: 'mvp',
  },
  {
    key: 'markets',
    name: 'Markets',
    line: 'Uncertain prices, volatility, your currency and the dollar.',
    lessons: 4,
    status: 'mvp',
  },
  {
    key: 'investing',
    name: 'Investing',
    line: 'Compounding, diversification, building a portfolio.',
    lessons: 0,
    status: 'later',
  },
  {
    key: 'business',
    name: 'Business',
    line: 'Run a MoMo agent shop, a kiosk, a chop bar.',
    lessons: 0,
    status: 'later',
  },
  {
    key: 'intelligence',
    name: 'Financial intelligence',
    line: 'Everything together, under pressure.',
    lessons: 0,
    status: 'later',
  },
];

export type Lab = {
  key: string;
  name: string;
  line: string;
  status: 'mvp' | 'later';
};

export const LABS: readonly Lab[] = [
  {
    key: 'money',
    name: 'Money Lab',
    line: 'Live a month, or a year, on a fictional income.',
    status: 'mvp',
  },
  {
    key: 'risk',
    name: 'Risk Lab',
    line: 'Change the risk and watch 100 traders survive or not.',
    status: 'mvp',
  },
  {
    key: 'market',
    name: 'Market Lab',
    line: 'Guess where price goes next, and learn why you can’t.',
    status: 'mvp',
  },
  {
    key: 'portfolio',
    name: 'Portfolio Lab',
    line: 'Split money across things that move differently.',
    status: 'later',
  },
  {
    key: 'business',
    name: 'Business Lab',
    line: 'Keep a small business liquid and profitable.',
    status: 'later',
  },
];
