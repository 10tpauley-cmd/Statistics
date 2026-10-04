import type { WidgetId } from '../types';

/** Every interactive the Pathway can embed (kept in sync with components/interactive/registry.tsx by a test). */
export const WIDGET_IDS: WidgetId[] = [
  'drag-mean', 'spread', 'correlation', 'lln', 'binomial', 'histogram-builder', 'residuals', 'outliers', 'boxplot-builder',
  'sampling', 'dice', 'tree', 'transform', 'expected-value', 'venn', 'shape', 'stemleaf', 'freq-table', 'scatter-fit',
  'percentile', 'zscore', 'contingency', 'free-throws', 'experiment-design', 'bias-spotter',
];
