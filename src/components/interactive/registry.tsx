import type { ComponentType } from 'react';
import type { WidgetId } from '../../engine/types';
import { DragMeanWidget, SpreadWidget, HistogramBuilderWidget, OutlierWidget, BoxplotBuilderWidget, ShapeWidget, StemLeafWidget, FreqTableWidget, PercentileWidget, ZScoreWidget } from './DataWidgets';
import { CorrelationWidget, ScatterFitWidget, ResidualsWidget } from './RegressionWidgets';
import { LLNWidget, DiceWidget, TreeWidget, VennWidget, ContingencyWidget, BinomialWidget, FreeThrowsWidget, ExpectedValueWidget, TransformWidget } from './ProbabilityWidgets';
import { SamplingWidget, ExperimentDesignWidget, BiasSpotterWidget } from './DesignWidgets';

// Each widget takes its own optional props; lesson content passes them as a loose record.
type AnyWidget = ComponentType<any>;

export const WIDGETS: Record<WidgetId, { title: string; component: AnyWidget; concept: string }> = {
  'drag-mean': { title: 'Drag the data: mean vs. median', component: DragMeanWidget, concept: 'center' },
  spread: { title: 'Build the standard deviation', component: SpreadWidget, concept: 'std-dev' },
  correlation: { title: 'Correlation explorer', component: CorrelationWidget, concept: 'correlation' },
  lln: { title: 'Law of large numbers', component: LLNWidget, concept: 'prob-basics' },
  binomial: { title: 'Binomial explorer', component: BinomialWidget, concept: 'binomial' },
  'histogram-builder': { title: 'Histogram builder', component: HistogramBuilderWidget, concept: 'quant-graphs' },
  residuals: { title: 'Residual lab', component: ResidualsWidget, concept: 'residuals' },
  outliers: { title: 'Outlier fences', component: OutlierWidget, concept: 'outliers' },
  'boxplot-builder': { title: 'Box plot builder', component: BoxplotBuilderWidget, concept: 'boxplots' },
  sampling: { title: 'Sampling the wood-duck park', component: SamplingWidget, concept: 'sampling' },
  dice: { title: 'Two-dice events', component: DiceWidget, concept: 'independence' },
  tree: { title: 'Tree diagram explorer', component: TreeWidget, concept: 'trees-venn' },
  transform: { title: 'Transforming a random variable', component: TransformWidget, concept: 'transform' },
  'expected-value': { title: 'Expected value: play the game', component: ExpectedValueWidget, concept: 'expected-value' },
  venn: { title: 'Venn diagram explorer', component: VennWidget, concept: 'prob-rules' },
  shape: { title: 'Shape, mean and median', component: ShapeWidget, concept: 'shape' },
  stemleaf: { title: 'Stem-and-leaf builder', component: StemLeafWidget, concept: 'quant-graphs' },
  'freq-table': { title: 'Frequency table builder', component: FreqTableWidget, concept: 'freq-tables' },
  'scatter-fit': { title: 'Fit the line yourself', component: ScatterFitWidget, concept: 'regression' },
  percentile: { title: 'Percentiles on a dot plot', component: PercentileWidget, concept: 'position' },
  zscore: { title: 'Standardized scores', component: ZScoreWidget, concept: 'z-score' },
  contingency: { title: 'Two-way table conditioning', component: ContingencyWidget, concept: 'conditional' },
  'free-throws': { title: 'Buzzer-beater free throws', component: FreeThrowsWidget, concept: 'binomial' },
  'experiment-design': { title: 'Design an experiment', component: ExperimentDesignWidget, concept: 'experiments' },
  'bias-spotter': { title: 'Bias spotter', component: BiasSpotterWidget, concept: 'bias' },
};

export function Widget({ id, props }: { id: WidgetId; props?: Record<string, unknown> }) {
  const entry = WIDGETS[id];
  if (!entry) return <div className="callout warn">Unknown simulation: {id}</div>;
  const C = entry.component;
  return <C {...(props ?? {})} />;
}
