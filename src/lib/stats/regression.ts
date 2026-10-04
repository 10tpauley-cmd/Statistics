import { mean, sum } from './descriptive';

export interface LinReg {
  n: number;
  a: number; // intercept
  b: number; // slope
  r: number;
  r2: number;
  s: number; // standard deviation of residuals
  xbar: number;
  ybar: number;
  residuals: number[];
  predicted: number[];
  sxx: number;
  syy: number;
  sxy: number;
}

export function linearRegression(x: readonly number[], y: readonly number[]): LinReg {
  const n = x.length;
  const xbar = mean(x);
  const ybar = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - xbar) * (y[i] - ybar);
    sxx += (x[i] - xbar) ** 2;
    syy += (y[i] - ybar) ** 2;
  }
  const b = sxx === 0 ? 0 : sxy / sxx;
  const a = ybar - b * xbar;
  const r = sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  const predicted = x.map((xi) => a + b * xi);
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const s = n > 2 ? Math.sqrt(sum(residuals.map((e) => e * e)) / (n - 2)) : NaN;
  return { n, a, b, r, r2: r * r, s, xbar, ybar, residuals, predicted, sxx, syy, sxy };
}

export const predict = (m: { a: number; b: number }, x: number) => m.a + m.b * x;
/** Solve ŷ = a + bx for x (the course does this, e.g. Archaeopteryx humerus → femur). */
export const solveForX = (m: { a: number; b: number }, y: number) => (y - m.a) / m.b;

export function correlation(x: readonly number[], y: readonly number[]): number {
  return linearRegression(x, y).r;
}

/** Solve a small linear system (Gaussian elimination). */
function solve(A: number[][], bVec: number[]): number[] {
  const n = bVec.length;
  const M = A.map((row, i) => [...row, bVec[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

export interface ModelFit {
  kind: 'linear' | 'quadratic' | 'exponential';
  predict: (x: number) => number;
  equation: string;
  r2: number;
  s: number;
  residuals: number[];
}

function fitStats(x: readonly number[], y: readonly number[], f: (x: number) => number, params: number) {
  const ybar = mean(y);
  const residuals = y.map((yi, i) => yi - f(x[i]));
  const sse = sum(residuals.map((e) => e * e));
  const sst = sum(y.map((yi) => (yi - ybar) ** 2));
  return { residuals, r2: 1 - sse / sst, s: Math.sqrt(sse / (x.length - params)) };
}

export function fitLinear(x: readonly number[], y: readonly number[]): ModelFit {
  const m = linearRegression(x, y);
  const f = (xx: number) => m.a + m.b * xx;
  return { kind: 'linear', predict: f, equation: `ŷ = ${m.a.toFixed(4)} + ${m.b.toFixed(4)}x`, r2: m.r2, s: m.s, residuals: m.residuals };
}

export function fitQuadratic(x: readonly number[], y: readonly number[]): ModelFit {
  const S = (p: number) => sum(x.map((v) => v ** p));
  const T = (p: number) => sum(x.map((v, i) => v ** p * y[i]));
  const [c, b, a] = solve(
    [
      [x.length, S(1), S(2)],
      [S(1), S(2), S(3)],
      [S(2), S(3), S(4)],
    ],
    [T(0), T(1), T(2)],
  );
  const f = (xx: number) => c + b * xx + a * xx * xx;
  const st = fitStats(x, y, f, 3);
  return { kind: 'quadratic', predict: f, equation: `ŷ = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`, ...st };
}

/** Exponential ŷ = a·bˣ fitted by linear regression on ln(y) (as calculators do). r² reported on the log scale like TI/Stapplet. */
export function fitExponential(x: readonly number[], y: readonly number[]): ModelFit {
  const ly = y.map((v) => Math.log(v));
  const m = linearRegression(x, ly);
  const a = Math.exp(m.a);
  const b = Math.exp(m.b);
  const f = (xx: number) => a * b ** xx;
  const residuals = y.map((yi, i) => yi - f(x[i]));
  const s = Math.sqrt(sum(residuals.map((e) => e * e)) / (x.length - 2));
  return { kind: 'exponential', predict: f, equation: `ŷ = ${a.toFixed(4)}·(${b.toFixed(4)})ˣ`, r2: m.r2, s, residuals };
}
