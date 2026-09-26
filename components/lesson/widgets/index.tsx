'use client';

import type { ComponentType } from 'react';
import type { WidgetName } from '@/lib/lessons/types';
import { ChartDemo } from '@/components/landing/ChartDemo';
import { LeverageDemo } from '@/components/landing/LeverageDemo';
import { IpoLab } from '@/components/marketing/IpoLab';
import { NoiseFilter } from '@/components/marketing/NoiseFilter';
import { SignalOrNoise } from '@/components/marketing/SignalOrNoise';
import {
  ChartTypesWidget,
  RangeOrTrendWidget,
  TimeframesWidget,
  TrendSwingsWidget,
  VolumeBreakoutWidget,
} from './charts';
import type { WidgetComponentProps } from './kit';
import {
  CostsWidget,
  MarketSorterWidget,
  OrderBookWidget,
  OrderTypesWidget,
  SpreadWidget,
} from './market';
import {
  DrawdownWidget,
  ExpectancyWidget,
  PositionSizeWidget,
  RMultiplesWidget,
} from './risk';
import {
  AtrStopsWidget,
  DivergenceWidget,
  DoubleTopWidget,
  FibTestWidget,
  MacdBuildWidget,
  MovingAveragesWidget,
  PatternTestWidget,
  RsiRunWidget,
  TimeframesTradeWidget,
  TrendlineWidget,
} from './technical';
import {
  CarryTradeWidget,
  DollarEarningsWidget,
  IncomeStatementWidget,
  InflationReplayWidget,
  NewsPullbackWidget,
  NewsSurpriseWidget,
  RateSetterWidget,
  ReleaseDayWidget,
  ValueTrapWidget,
} from './fundamental';

/**
 * Every widget a lesson can name. The Record type makes a missing one a
 * type error, so a lesson can never point at a widget that doesn't exist.
 * The landing page's own interactives are reused here as they are.
 */
export const WIDGETS: Record<
  WidgetName,
  ComponentType<WidgetComponentProps>
> = {
  'noise-filter': ({ onDone }) => <NoiseFilter onDone={onDone} />,
  'signal-or-noise': ({ onDone }) => <SignalOrNoise onDone={onDone} />,
  'ipo-lab': ({ onDone }) => (
    <div className="lg:[&>div]:grid-cols-1">
      <IpoLab onDone={onDone} />
    </div>
  ),
  'order-book': OrderBookWidget,
  spread: SpreadWidget,
  'order-types': OrderTypesWidget,
  'market-sorter': MarketSorterWidget,
  leverage: ({ onDone }) => <LeverageDemo onDone={onDone} />,
  costs: CostsWidget,
  'chart-types': ChartTypesWidget,
  'candle-anatomy': ({ onDone }) => (
    <ChartDemo start={0} end={0} onDone={onDone} />
  ),
  timeframes: TimeframesWidget,
  'trend-swings': TrendSwingsWidget,
  'find-support': ({ onDone }) => (
    <ChartDemo start={1} end={1} onDone={onDone} />
  ),
  'range-or-trend': RangeOrTrendWidget,
  'volume-breakout': VolumeBreakoutWidget,
  'plan-stop': ({ onDone }) => <ChartDemo start={2} end={2} onDone={onDone} />,
  'position-size': PositionSizeWidget,
  'r-multiples': RMultiplesWidget,
  drawdown: DrawdownWidget,
  expectancy: ExpectancyWidget,
  trendline: TrendlineWidget,
  'moving-averages': MovingAveragesWidget,
  'rsi-run': RsiRunWidget,
  'macd-build': MacdBuildWidget,
  'atr-stops': AtrStopsWidget,
  'pattern-test': PatternTestWidget,
  'double-top': DoubleTopWidget,
  'fib-test': FibTestWidget,
  'timeframes-trade': TimeframesTradeWidget,
  divergence: DivergenceWidget,
  'news-surprise': NewsSurpriseWidget,
  'rate-setter': RateSetterWidget,
  'inflation-replay': InflationReplayWidget,
  'income-statement': IncomeStatementWidget,
  'value-trap': ValueTrapWidget,
  'release-day': ReleaseDayWidget,
  'dollar-earnings': DollarEarningsWidget,
  'carry-trade': CarryTradeWidget,
  'news-pullback': NewsPullbackWidget,
};
