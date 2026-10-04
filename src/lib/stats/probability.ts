/** Probability helpers: counting, binomial, discrete random variables. */

export function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** n choose k, computed multiplicatively to stay accurate for large n. */
export function nCr(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r) === r || r > 1e15 ? r : Math.round(r);
}

export function binomPmf(n: number, p: number, k: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  // log-space for numerical stability with big n
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  const logC = lnChoose(n, k);
  return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

function lnChoose(n: number, k: number): number {
  let s = 0;
  k = Math.min(k, n - k);
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

export type BinomQuery = 'eq' | 'le' | 'lt' | 'ge' | 'gt' | 'between';

/** P(X op k) — `between` uses inclusive [k, k2]. */
export function binomProb(n: number, p: number, op: BinomQuery, k: number, k2?: number): number {
  let total = 0;
  for (let x = 0; x <= n; x++) {
    const hit =
      op === 'eq' ? x === k :
      op === 'le' ? x <= k :
      op === 'lt' ? x < k :
      op === 'ge' ? x >= k :
      op === 'gt' ? x > k :
      x >= k && x <= (k2 ?? k);
    if (hit) total += binomPmf(n, p, x);
  }
  return Math.min(1, Math.max(0, total));
}

export function binomMean(n: number, p: number) {
  return n * p;
}
export function binomSd(n: number, p: number) {
  return Math.sqrt(n * p * (1 - p));
}

export interface DiscreteDist {
  x: number[];
  p: number[];
}

export function distSum(d: DiscreteDist) {
  return d.p.reduce((a, b) => a + b, 0);
}

export function isValidDist(d: DiscreteDist, tol = 1e-6) {
  return d.p.every((v) => v >= 0 && v <= 1) && Math.abs(distSum(d) - 1) < tol;
}

export function expectedValue(d: DiscreteDist) {
  return d.x.reduce((acc, x, i) => acc + x * d.p[i], 0);
}

export function expectedSquare(d: DiscreteDist) {
  return d.x.reduce((acc, x, i) => acc + x * x * d.p[i], 0);
}

/** σ² = Σx²P(x) − μ² (the course's computational formula). */
export function distVariance(d: DiscreteDist) {
  const mu = expectedValue(d);
  return Math.max(0, expectedSquare(d) - mu * mu);
}

export function distSd(d: DiscreteDist) {
  return Math.sqrt(distVariance(d));
}

/** Distribution of a·X + b. */
export function transformDist(d: DiscreteDist, a: number, b: number): DiscreteDist {
  return { x: d.x.map((v) => a * v + b), p: d.p.slice() };
}

/** Distribution of X + Y for independent X, Y (values merged). */
export function sumIndependent(X: DiscreteDist, Y: DiscreteDist): DiscreteDist {
  const m = new Map<number, number>();
  X.x.forEach((xv, i) =>
    Y.x.forEach((yv, j) => {
      const key = Math.round((xv + yv) * 1e9) / 1e9;
      m.set(key, (m.get(key) ?? 0) + X.p[i] * Y.p[j]);
    }),
  );
  const keys = [...m.keys()].sort((a, b) => a - b);
  return { x: keys, p: keys.map((k) => m.get(k)!) };
}

export function binomialDist(n: number, p: number): DiscreteDist {
  const x = Array.from({ length: n + 1 }, (_, i) => i);
  return { x, p: x.map((k) => binomPmf(n, p, k)) };
}
