import type { Rng } from '../../lib/stats/random';
import { gaussian } from '../../lib/stats/random';

/** Real-world quantitative contexts used to vary question wording and numbers. */
export interface NumScenario {
  id: string;
  who: string; // "a random sample of 9 high school seniors"
  what: string; // "minutes spent on TikTok yesterday"
  unit: string; // "minutes"
  short: string; // "screen time"
  center: number;
  spread: number;
  decimals: number;
  min?: number;
}

export const NUM_SCENARIOS: NumScenario[] = [
  { id: 'tiktok', who: 'high school seniors', what: 'minutes spent on TikTok yesterday', unit: 'minutes', short: 'TikTok time', center: 75, spread: 30, decimals: 0, min: 0 },
  { id: 'points', who: 'games played by a college point guard', what: 'points scored per game', unit: 'points', short: 'points', center: 18, spread: 6, decimals: 0, min: 0 },
  { id: 'commute', who: 'FCC students', what: 'commute time to campus', unit: 'minutes', short: 'commute time', center: 24, spread: 9, decimals: 0, min: 3 },
  { id: 'sneakers', who: 'sneakers on a resale app', what: 'listing price', unit: 'dollars', short: 'price', center: 160, spread: 45, decimals: 0, min: 40 },
  { id: 'gas', who: 'gas stations in Frederick', what: 'price per gallon of regular gas', unit: 'dollars', short: 'gas price', center: 3.45, spread: 0.18, decimals: 2, min: 2.5 },
  { id: 'battery', who: 'smartphones tested by a tech reviewer', what: 'battery life on a full charge', unit: 'hours', short: 'battery life', center: 14, spread: 3, decimals: 1, min: 4 },
  { id: 'movies', who: 'this year\'s top box-office movies', what: 'running time', unit: 'minutes', short: 'run time', center: 128, spread: 18, decimals: 0, min: 80 },
  { id: 'likes', who: 'posts from a food blogger\'s Instagram', what: 'number of likes', unit: 'likes', short: 'likes', center: 420, spread: 140, decimals: 0, min: 20 },
  { id: 'temps', who: 'October days in Baltimore', what: 'daily high temperature', unit: '°F', short: 'high temperature', center: 66, spread: 7, decimals: 0 },
  { id: 'sleep', who: 'college students', what: 'hours of sleep last night', unit: 'hours', short: 'sleep', center: 6.8, spread: 1.2, decimals: 1, min: 3 },
  { id: 'coffee', who: 'coffee shops downtown', what: 'price of a large latte', unit: 'dollars', short: 'latte price', center: 5.2, spread: 0.7, decimals: 2, min: 3 },
  { id: 'goals', who: 'players in a youth soccer league', what: 'goals scored this season', unit: 'goals', short: 'goals', center: 7, spread: 4, decimals: 0, min: 0 },
  { id: 'game-hours', who: 'gamers in an online survey', what: 'hours of video games played per week', unit: 'hours', short: 'gaming time', center: 12, spread: 6, decimals: 0, min: 0 },
  { id: 'delivery', who: 'food delivery orders', what: 'delivery time', unit: 'minutes', short: 'delivery time', center: 34, spread: 9, decimals: 0, min: 10 },
  { id: 'paychecks', who: 'part-time workers at a mall', what: 'weekly paycheck', unit: 'dollars', short: 'paycheck', center: 310, spread: 70, decimals: 0, min: 80 },
];

export interface DataOpts {
  n: number;
  skew?: 'none' | 'right' | 'left';
  outlier?: 'none' | 'high' | 'low';
  distinctRound?: boolean;
}

/** Generate a realistic data set for a scenario. */
export function genData(rng: Rng, s: NumScenario, opts: DataOpts): number[] {
  const out: number[] = [];
  const k = 10 ** s.decimals;
  for (let i = 0; i < opts.n; i++) {
    let v: number;
    if (opts.skew === 'right') v = s.center - s.spread * 0.8 + Math.abs(gaussian(rng, 0, s.spread * 1.1));
    else if (opts.skew === 'left') v = s.center + s.spread * 0.8 - Math.abs(gaussian(rng, 0, s.spread * 1.1));
    else v = gaussian(rng, s.center, s.spread);
    if (s.min !== undefined) v = Math.max(s.min, v);
    out.push(Math.round(v * k) / k);
  }
  if (opts.outlier === 'high') out[rng.int(0, out.length - 1)] = Math.round((s.center + s.spread * rng.float(3.5, 5, 2)) * k) / k;
  if (opts.outlier === 'low') out[rng.int(0, out.length - 1)] = Math.max(s.min ?? -Infinity, Math.round((s.center - s.spread * rng.float(3.5, 5, 2)) * k) / k);
  return out;
}

export function scenario(rng: Rng, filter?: (s: NumScenario) => boolean) {
  const pool = filter ? NUM_SCENARIOS.filter(filter) : NUM_SCENARIOS;
  return rng.pick(pool);
}

/** Small integer data sets that are friendly for hand calculation. */
export function niceData(rng: Rng, n: number, lo: number, hi: number): number[] {
  return Array.from({ length: n }, () => rng.int(lo, hi));
}

/** Integer data with an integer mean (handy for by-hand SD). */
export function integerMeanData(rng: Rng, n: number, lo: number, hi: number): number[] {
  for (let tries = 0; tries < 200; tries++) {
    const d = niceData(rng, n, lo, hi);
    const s = d.reduce((a, b) => a + b, 0);
    if (s % n === 0 && new Set(d).size > 2) return d;
  }
  const base = rng.int(lo + 3, hi - 3);
  return Array.from({ length: n }, (_, i) => base + (i % 2 === 0 ? 1 : -1) * (i < n - (n % 2) ? Math.ceil((i + 1) / 2) : 0));
}

export const unitLabel = (s: NumScenario, v: string) => (s.unit === 'dollars' ? `$${v}` : `${v} ${s.unit}`);
