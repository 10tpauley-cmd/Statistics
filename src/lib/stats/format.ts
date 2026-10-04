/** Round to a number of decimals, avoiding -0 and float noise. */
export function round(x: number, decimals = 4): number {
  if (!Number.isFinite(x)) return x;
  const f = 10 ** decimals;
  const r = Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/** Format a number for display: trims trailing zeros, keeps up to `decimals`. */
export function fmt(x: number, decimals = 4): string {
  if (Number.isNaN(x)) return '—';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
  const r = round(x, decimals);
  if (Math.abs(r) !== 0 && Math.abs(r) < 10 ** -decimals) return x.toExponential(2);
  const s = r.toFixed(decimals).replace(/\.?0+$/, '');
  return s.replace('-', '−');
}

/** Fixed decimals (keeps trailing zeros). */
export function fixed(x: number, decimals = 2): string {
  return round(x, decimals).toFixed(decimals).replace('-', '−');
}

export function pct(x: number, decimals = 1): string {
  return `${fmt(x * 100, decimals)}%`;
}

export function money(x: number, decimals = 2): string {
  const sign = x < 0 ? '−' : '';
  return `${sign}$${Math.abs(round(x, decimals)).toFixed(decimals)}`;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** Reduce a fraction of integers. */
export function reduce(n: number, d: number): [number, number] {
  const g = gcd(n, d);
  const sign = d < 0 ? -1 : 1;
  return [(sign * n) / g, (sign * d) / g];
}

export function fracStr(n: number, d: number): string {
  const [a, b] = reduce(n, d);
  return b === 1 ? `${a}` : `${a}/${b}`;
}

/** Parse a user-typed number: supports fractions "3/8", percents "40%", commas, unicode minus. */
export function parseNumber(input: string): number | null {
  if (input == null) return null;
  let s = String(input).trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
  if (!s) return null;
  s = s.replace(/^\$/, '').replace(/^-\$/, '-');
  let isPct = false;
  if (s.endsWith('%')) {
    isPct = true;
    s = s.slice(0, -1);
  }
  let v: number;
  const frac = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    if (d === 0) return null;
    v = parseFloat(frac[1]) / d;
  } else if (/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) {
    v = parseFloat(s);
  } else {
    return null;
  }
  return isPct ? v / 100 : v;
}
