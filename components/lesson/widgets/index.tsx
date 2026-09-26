'use client';

import { lazy, type ComponentType } from 'react';
import type { WidgetName } from '@/lib/lessons/types';
import type { WidgetComponentProps } from './kit';

/**
 * Every widget a lesson can name. The Record type makes a missing one a
 * type error, so a lesson can never point at a widget that doesn't exist.
 *
 * Each widget is loaded only when a lesson shows it: a phone opening one
 * lesson downloads that lesson's widgets and their engines, not all forty.
 * Widgets from the same file share one download, so a lesson with two
 * technical widgets fetches technical.tsx once. The landing page's own
 * interactives are reused as they are.
 */

type Widget = ComponentType<WidgetComponentProps>;

/** One lazy component for one named export of a module. */
function from<M>(load: () => Promise<M>, pick: (module: M) => Widget): Widget {
  return lazy(() => load().then((module) => ({ default: pick(module) })));
}

const market = () => import('./market');
const charts = () => import('./charts');
const risk = () => import('./risk');
const technical = () => import('./technical');
const fundamental = () => import('./fundamental');
const strategy = () => import('./strategy');
const chartDemo = () => import('@/components/landing/ChartDemo');

export const WIDGETS: Record<WidgetName, Widget> = {
  'noise-filter': from(
    () => import('@/components/marketing/NoiseFilter'),
    (m) =>
      function NoiseFilterWidget({ onDone }) {
        return <m.NoiseFilter onDone={onDone} />;
      },
  ),
  'signal-or-noise': from(
    () => import('@/components/marketing/SignalOrNoise'),
    (m) =>
      function SignalOrNoiseWidget({ onDone }) {
        return <m.SignalOrNoise onDone={onDone} />;
      },
  ),
  'ipo-lab': from(
    () => import('@/components/marketing/IpoLab'),
    (m) =>
      function IpoLabWidget({ onDone }) {
        return (
          <div className="lg:[&>div]:grid-cols-1">
            <m.IpoLab onDone={onDone} />
          </div>
        );
      },
  ),
  'order-book': from(market, (m) => m.OrderBookWidget),
  spread: from(market, (m) => m.SpreadWidget),
  'order-types': from(market, (m) => m.OrderTypesWidget),
  'market-sorter': from(market, (m) => m.MarketSorterWidget),
  leverage: from(
    () => import('@/components/landing/LeverageDemo'),
    (m) =>
      function LeverageWidget({ onDone }) {
        return <m.LeverageDemo onDone={onDone} />;
      },
  ),
  costs: from(market, (m) => m.CostsWidget),
  'chart-types': from(charts, (m) => m.ChartTypesWidget),
  'candle-anatomy': from(
    chartDemo,
    (m) =>
      function CandleAnatomyWidget({ onDone }) {
        return <m.ChartDemo start={0} end={0} onDone={onDone} />;
      },
  ),
  timeframes: from(charts, (m) => m.TimeframesWidget),
  'trend-swings': from(charts, (m) => m.TrendSwingsWidget),
  'find-support': from(
    chartDemo,
    (m) =>
      function FindSupportWidget({ onDone }) {
        return <m.ChartDemo start={1} end={1} onDone={onDone} />;
      },
  ),
  'range-or-trend': from(charts, (m) => m.RangeOrTrendWidget),
  'volume-breakout': from(charts, (m) => m.VolumeBreakoutWidget),
  'plan-stop': from(
    chartDemo,
    (m) =>
      function PlanStopWidget({ onDone }) {
        return <m.ChartDemo start={2} end={2} onDone={onDone} />;
      },
  ),
  'position-size': from(risk, (m) => m.PositionSizeWidget),
  'r-multiples': from(risk, (m) => m.RMultiplesWidget),
  drawdown: from(risk, (m) => m.DrawdownWidget),
  expectancy: from(risk, (m) => m.ExpectancyWidget),
  trendline: from(technical, (m) => m.TrendlineWidget),
  'moving-averages': from(technical, (m) => m.MovingAveragesWidget),
  'rsi-run': from(technical, (m) => m.RsiRunWidget),
  'macd-build': from(technical, (m) => m.MacdBuildWidget),
  'atr-stops': from(technical, (m) => m.AtrStopsWidget),
  'pattern-test': from(technical, (m) => m.PatternTestWidget),
  'double-top': from(technical, (m) => m.DoubleTopWidget),
  'fib-test': from(technical, (m) => m.FibTestWidget),
  'timeframes-trade': from(technical, (m) => m.TimeframesTradeWidget),
  divergence: from(technical, (m) => m.DivergenceWidget),
  'news-surprise': from(fundamental, (m) => m.NewsSurpriseWidget),
  'rate-setter': from(fundamental, (m) => m.RateSetterWidget),
  'inflation-replay': from(fundamental, (m) => m.InflationReplayWidget),
  'income-statement': from(fundamental, (m) => m.IncomeStatementWidget),
  'value-trap': from(fundamental, (m) => m.ValueTrapWidget),
  'release-day': from(fundamental, (m) => m.ReleaseDayWidget),
  'dollar-earnings': from(fundamental, (m) => m.DollarEarningsWidget),
  'carry-trade': from(fundamental, (m) => m.CarryTradeWidget),
  'news-pullback': from(fundamental, (m) => m.NewsPullbackWidget),
  'trend-rules': from(strategy, (m) => m.TrendRulesWidget),
  'range-rules': from(strategy, (m) => m.RangeRulesWidget),
  'breakout-picks': from(strategy, (m) => m.BreakoutPicksWidget),
  'trade-styles': from(strategy, (m) => m.TradeStylesWidget),
  'news-rules': from(strategy, (m) => m.NewsRulesWidget),
  'invest-vs-trade': from(strategy, (m) => m.InvestVsTradeWidget),
  'strategy-builder': from(strategy, (m) => m.StrategyBuilderWidget),
};
