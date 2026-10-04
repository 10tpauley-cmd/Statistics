/**
 * Descriptive statistics exactly as computed in FCC MA120 (and by Stapplet / TI-84):
 * quartiles are medians of the lower and upper halves, excluding the overall median
 * when n is odd. Sample variance divides by n − 1.
 */

export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export const sorted = (xs: readonly number[]) => xs.slice().sort((a, b) => a - b);

export function mean(xs: readonly number[]): number {
  if (!xs.length) return NaN;
  return sum(xs) / xs.length;
}

export function median(xs: readonly number[]): number {
  if (!xs.length) return NaN;
  const s = sorted(xs);
  const m = s.length;
  return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2;
}

/** All modes; empty array if every value occurs once. */
export function modes(xs: readonly number[]): number[] {
  const counts = new Map<number, number>();
  xs.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  let max = 0;
  counts.forEach((c) => (max = Math.max(max, c)));
  if (max <= 1) return [];
  return [...counts.entries()].filter(([, c]) => c === max).map(([v]) => v).sort((a, b) => a - b);
}

export function midrange(xs: readonly number[]): number {
  const s = sorted(xs);
  return (s[0] + s[s.length - 1]) / 2;
}

export function range(xs: readonly number[]): number {
  const s = sorted(xs);
  return s[s.length - 1] - s[0];
}

export interface FiveNumber {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export function lowerHalf(xs: readonly number[]): number[] {
  const s = sorted(xs);
  return s.slice(0, Math.floor(s.length / 2));
}

export function upperHalf(xs: readonly number[]): number[] {
  const s = sorted(xs);
  return s.slice(Math.ceil(s.length / 2));
}

export function fiveNumber(xs: readonly number[]): FiveNumber {
  const s = sorted(xs);
  if (s.length === 1) return { min: s[0], q1: s[0], median: s[0], q3: s[0], max: s[0] };
  return {
    min: s[0],
    q1: median(lowerHalf(s)),
    median: median(s),
    q3: median(upperHalf(s)),
    max: s[s.length - 1],
  };
}

export function iqr(xs: readonly number[]): number {
  const f = fiveNumber(xs);
  return f.q3 - f.q1;
}

export function sumSquaredDeviations(xs: readonly number[]): number {
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2));
}

export function variance(xs: readonly number[], kind: 'sample' | 'population' = 'sample'): number {
  const n = xs.length;
  if (kind === 'sample') return n > 1 ? sumSquaredDeviations(xs) / (n - 1) : NaN;
  return sumSquaredDeviations(xs) / n;
}

export function sd(xs: readonly number[], kind: 'sample' | 'population' = 'sample'): number {
  return Math.sqrt(variance(xs, kind));
}

export interface Fences {
  lower: number;
  upper: number;
  outliers: number[];
}

/** 1.5 × IQR rule. */
export function iqrFences(xs: readonly number[]): Fences & { iqr: number; step: number } {
  const f = fiveNumber(xs);
  const i = f.q3 - f.q1;
  const step = 1.5 * i;
  const lower = f.q1 - step;
  const upper = f.q3 + step;
  return { iqr: i, step, lower, upper, outliers: sorted(xs).filter((x) => x < lower || x > upper) };
}

/** Two standard deviations rule (sample SD). */
export function twoSdFences(xs: readonly number[]): Fences & { mean: number; sd: number } {
  const m = mean(xs);
  const s = sd(xs);
  const lower = m - 2 * s;
  const upper = m + 2 * s;
  return { mean: m, sd: s, lower, upper, outliers: sorted(xs).filter((x) => x < lower || x > upper) };
}

/** Percentile as used in the course: % of data values strictly less than x. */
export function percentileOf(xs: readonly number[], x: number): number {
  return xs.filter((v) => v < x).length / xs.length;
}

export function zScore(x: number, m: number, s: number): number {
  return (x - m) / s;
}

export type Shape = 'symmetric' | 'skewed right' | 'skewed left';

/**
 * Heuristic shape from summary values (mean vs median relative to spread),
 * the way the course reasons from μ vs MD.
 */
export function shapeFromMeanMedian(m: number, md: number, spread: number): Shape {
  const tol = Math.max(spread * 0.1, 1e-9);
  if (m - md > tol) return 'skewed right';
  if (md - m > tol) return 'skewed left';
  return 'symmetric';
}

export interface FreqRow {
  label: string;
  lo: number;
  hi: number;
  f: number;
  rel: number;
  cum: number;
  cumRel: number;
}

/** Frequency table with class boundaries [lo, hi) — or inclusive integer classes when `inclusive`. */
export function frequencyTable(
  xs: readonly number[],
  classes: { lo: number; hi: number; label?: string }[],
  inclusive = false,
): FreqRow[] {
  const n = xs.length;
  let cum = 0;
  return classes.map((c) => {
    const f = xs.filter((x) => (inclusive ? x >= c.lo && x <= c.hi : x >= c.lo && x < c.hi)).length;
    cum += f;
    return {
      label: c.label ?? `${c.lo} – ${c.hi}`,
      lo: c.lo,
      hi: c.hi,
      f,
      rel: f / n,
      cum,
      cumRel: cum / n,
    };
  });
}

export interface Bin {
  lo: number;
  hi: number;
  count: number;
}

export function histogramBins(xs: readonly number[], width: number, start?: number): Bin[] {
  if (!xs.length || width <= 0) return [];
  const s = sorted(xs);
  const lo0 = start ?? Math.floor(s[0] / width) * width;
  const bins: Bin[] = [];
  for (let lo = lo0; lo <= s[s.length - 1]; lo += width) {
    const hi = lo + width;
    bins.push({ lo, hi, count: s.filter((x) => x >= lo && x < hi).length });
    if (bins.length > 400) break;
  }
  return bins;
}

/** Expand a grouped frequency table into raw values at the class midpoints (course method). */
export function expandMidpoints(groups: { mid: number; f: number }[]): number[] {
  const out: number[] = [];
  groups.forEach((g) => {
    for (let i = 0; i < g.f; i++) out.push(g.mid);
  });
  return out;
}

export interface StemLeaf {
  stem: number;
  leaves: number[];
}

/** Stem-and-leaf with leaf unit `leafUnit` (e.g. 1 → stem = tens). */
export function stemAndLeaf(xs: readonly number[], leafUnit = 1): StemLeaf[] {
  const s = sorted(xs);
  if (!s.length) return [];
  const toStem = (x: number) => Math.floor(Math.round(x / leafUnit) / 10);
  const toLeaf = (x: number) => Math.round(x / leafUnit) % 10;
  const minS = toStem(s[0]);
  const maxS = toStem(s[s.length - 1]);
  const rows: StemLeaf[] = [];
  for (let st = minS; st <= maxS; st++) rows.push({ stem: st, leaves: [] });
  s.forEach((x) => rows[toStem(x) - minS].leaves.push(toLeaf(x)));
  return rows;
}

export interface Summary extends FiveNumber {
  n: number;
  mean: number;
  sd: number;
  variance: number;
  range: number;
  iqr: number;
  modes: number[];
  midrange: number;
}

export function summarize(xs: readonly number[]): Summary {
  const f = fiveNumber(xs);
  return {
    n: xs.length,
    mean: mean(xs),
    sd: sd(xs),
    variance: variance(xs),
    range: f.max - f.min,
    iqr: f.q3 - f.q1,
    modes: modes(xs),
    midrange: (f.min + f.max) / 2,
    ...f,
  };
}
