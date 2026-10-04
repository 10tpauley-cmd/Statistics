import { describe, expect, it } from 'vitest';
import { fiveNumber, iqrFences, mean, median, modes, percentileOf, sd, summarize, twoSdFences, variance, stemAndLeaf, frequencyTable } from '../src/lib/stats/descriptive';
import { linearRegression, fitLinear, fitQuadratic, fitExponential } from '../src/lib/stats/regression';
import { binomPmf, binomProb, binomSd, distSd, expectedValue, sumIndependent, nCr } from '../src/lib/stats/probability';
import { parseNumber, fmt } from '../src/lib/stats/format';
import { DATASETS, BIVARIATE } from '../src/content/datasets';

const ds = (id: string) => DATASETS.find((d) => d.id === id)!.data;
const bv = (id: string) => BIVARIATE.find((d) => d.id === id)!;

describe('descriptive statistics match the PDF answer keys', () => {
  it('chip air (p.22, p.18)', () => {
    const s = summarize(ds('chips'));
    expect(s.mean).toBeCloseTo(42.571, 3);
    expect(s.median).toBe(45.5);
    expect(s.q1).toBe(39);
    expect(s.q3).toBe(49);
    expect(s.range).toBe(40);
    expect(s.iqr).toBe(10);
    expect(s.sd).toBeCloseTo(10.181, 3);
    expect(s.variance).toBeCloseTo(103.65, 1);
    expect(iqrFences(ds('chips')).outliers).toEqual([19]);
    expect(twoSdFences(ds('chips')).outliers).toEqual([19]);
  });
  it('chips without Fritos and with Helium Chips', () => {
    const without = ds('chips').filter((x) => x !== 19);
    expect(mean(without)).toBeCloseTo(44.385, 3);
    expect(median(without)).toBe(46);
    expect(sd(without)).toBeCloseTo(7.901, 3);
    expect(fiveNumber(without).q3 - fiveNumber(without).q1).toBe(9.5);
    const helium = [...ds('chips'), 78];
    expect(mean(helium)).toBeCloseTo(44.933, 3);
    expect(median(helium)).toBe(46);
  });
  it('orange juice (p.17, p.20)', () => {
    const s = summarize(ds('oj'));
    expect(s.n).toBe(18);
    expect(s.mean).toBeCloseTo(4.035, 3);
    expect(s.min).toBe(2.99);
    expect(s.q1).toBe(3.59);
    expect(s.median).toBeCloseTo(3.985, 3);
    expect(s.q3).toBe(4.29);
    expect(s.max).toBe(5.99);
    expect(s.sd).toBeCloseTo(0.68, 2);
    const f = iqrFences(ds('oj'));
    expect(f.lower).toBeCloseTo(2.54, 2);
    expect(f.upper).toBeCloseTo(5.34, 2);
    expect(f.outliers).toEqual([5.99]);
  });
  it('paint brands (p.50)', () => {
    expect(mean(ds('paint-a'))).toBe(35);
    expect(fiveNumber(ds('paint-a'))).toEqual({ min: 10, q1: 15, median: 35, q3: 55, max: 60 });
    expect(variance(ds('paint-a'))).toBeCloseTo(477.6, 5);
    expect(sd(ds('paint-b'))).toBeCloseTo(7.071, 3);
    expect(sd(ds('paint-b'), 'population')).toBeCloseTo(Math.sqrt(250 / 6), 6);
  });
  it('northbound speeds five-number summary (p.54) uses exclude-median halves', () => {
    expect(fiveNumber(ds('speeds-north'))).toEqual({ min: 60, q1: 63, median: 65, q3: 66, max: 83 });
  });
  it('2003 payroll summary (p.58)', () => {
    const s = summarize(ds('payroll-2003'));
    expect(s.mean).toBeCloseTo(71.067, 3);
    expect(s.median).toBe(69);
    expect(s.min).toBe(20);
    expect(s.max).toBe(153);
  });
  it('corporations rebuilt from histogram midpoints (p.2)', () => {
    const s = summarize(ds('corporations'));
    expect(s.n).toBe(45);
    expect(s.mean).toBeCloseTo(48.111, 3);
    expect(s.median).toBe(45);
    expect(s.sd).toBeCloseTo(16.49, 2);
  });
  it('AP exam histogram (p.23)', () => {
    expect(mean(ds('ap-exam'))).toBe(3.25);
    expect(median(ds('ap-exam'))).toBe(4);
  });
  it('percentile and modes', () => {
    expect(percentileOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 8)).toBe(0.7);
    expect(modes([3.7, 3.74, 3.7, 3.74, 3.8])).toEqual([3.7, 3.74]);
    expect(modes([1, 2, 3])).toEqual([]);
  });
  it('stem and leaf of actor ages', () => {
    const rows = stemAndLeaf(ds('actors'));
    expect(rows[0]).toEqual({ stem: 1, leaves: [8] });
    expect(rows[6]).toEqual({ stem: 7, leaves: [1, 2, 3, 4, 6, 7] });
  });
  it('Lyme disease frequency table (p.63)', () => {
    const classes = Array.from({ length: 8 }, (_, i) => ({ lo: 0.5 + 6 * i, hi: 6.5 + 6 * i }));
    const t = frequencyTable(ds('lyme-a'), classes);
    expect(t.map((r) => r.f)).toEqual([2, 5, 9, 5, 7, 7, 2, 3]);
    expect(t[t.length - 1].cumRel).toBe(1);
  });
});

describe('regression matches the PDF', () => {
  it('SCUBA (p.44)', () => {
    const m = linearRegression(bv('scuba').x, bv('scuba').y);
    expect(m.a).toBeCloseTo(106.3421, 3);
    expect(m.b).toBeCloseTo(-0.8145, 4);
  });
  it('Archaeopteryx (p.11)', () => {
    const m = linearRegression(bv('archaeopteryx').x, bv('archaeopteryx').y);
    expect(m.a).toBeCloseTo(-3.6596, 3);
    expect(m.b).toBeCloseTo(1.1969, 4);
    expect(m.r).toBeCloseTo(0.9941, 4);
    expect(m.r2).toBeCloseTo(0.9883, 4);
  });
  it('Spelling bee vs spider bites (p.2)', () => {
    const m = linearRegression(bv('spelling').x, bv('spelling').y);
    expect(m.a).toBeCloseTo(-5.4141, 4);
    expect(m.b).toBeCloseTo(1.2778, 4);
    expect(m.r).toBeCloseTo(0.806, 3);
    expect(m.r2).toBeCloseTo(0.649, 3);
  });
  it('iPhone linear, quadratic and exponential (p.14)', () => {
    const lin = fitLinear(bv('iphone').x, bv('iphone').y);
    expect(lin.r2).toBeCloseTo(0.9138, 4);
    expect(lin.s).toBeCloseTo(1.4429, 4);
    const quad = fitQuadratic(bv('iphone').x, bv('iphone').y);
    expect(quad.r2).toBeCloseTo(0.9838, 3);
    expect(quad.s).toBeCloseTo(0.6761, 3);
    const exp = fitExponential(bv('iphone').x, bv('iphone').y);
    expect(exp.r2).toBeCloseTo(0.97, 2);
    expect(exp.s).toBeCloseTo(1.5587, 4);
  });
});

describe('probability matches the PDF', () => {
  it('snow days distribution (p.3)', () => {
    const d = { x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], p: [0.33, 0.19, 0.14, 0.1, 0.07, 0.05, 0.04, 0.04, 0.02, 0.01, 0.01] };
    expect(expectedValue(d)).toBeCloseTo(2.17, 6);
    expect(distSd(d)).toBeCloseTo(2.409, 3);
  });
  it('slot machines Z = X + Y (p.4)', () => {
    const Z = sumIndependent({ x: [-20, 20], p: [0.7, 0.3] }, { x: [-20, 20], p: [0.8, 0.2] });
    expect(Z.x).toEqual([-40, 0, 40]);
    expect(Z.p[0]).toBeCloseTo(0.56);
    expect(Z.p[1]).toBeCloseTo(0.38);
    expect(expectedValue(Z)).toBeCloseTo(-20);
    expect(distSd(Z)).toBeCloseTo(24.33, 2);
  });
  it('roulette $100 on black (p.29)', () => {
    const d = { x: [100, -100], p: [18 / 38, 20 / 38] };
    expect(expectedValue(d)).toBeCloseTo(-5.263, 3);
    expect(distSd(d)).toBeCloseTo(99.86, 2);
  });
  it('binomial: free throws, pop quiz, draw a three', () => {
    expect(binomPmf(3, 0.72, 3)).toBeCloseTo(0.373, 3);
    expect(binomPmf(3, 0.72, 2)).toBeCloseTo(0.435, 3);
    expect(binomProb(3, 0.72, 'le', 1)).toBeCloseTo(0.191, 3);
    expect(binomPmf(10, 0.25, 6)).toBeCloseTo(0.0162, 4);
    expect(binomSd(10, 0.25)).toBeCloseTo(1.369, 3);
    expect(binomProb(6, 0.75, 'ge', 5)).toBeCloseTo(0.534, 3);
    expect(binomProb(250, 1 / 13, 'le', 10)).toBeCloseTo(0.0133, 4);
    expect(nCr(10, 3)).toBe(120);
  });
});

describe('number parsing', () => {
  it('parses fractions, percents, money', () => {
    expect(parseNumber('3/8')).toBe(0.375);
    expect(parseNumber('40%')).toBe(0.4);
    expect(parseNumber('$5.26')).toBe(5.26);
    expect(parseNumber('−0.072')).toBe(-0.072);
    expect(parseNumber('1,080')).toBe(1080);
    expect(parseNumber('abc')).toBeNull();
    expect(fmt(0.62568, 3)).toBe('0.626');
    expect(fmt(-2, 2)).toBe('−2');
  });
});
