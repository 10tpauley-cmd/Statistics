import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export const C = {
  s1: 'var(--chart-1)',
  s2: 'var(--chart-2)',
  s3: 'var(--chart-3)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  surface: 'var(--surface)',
  text: 'var(--text-2)',
  muted: 'var(--muted)',
  good: 'var(--success-strong)',
  bad: 'var(--danger)',
};
export const SERIES = [C.s1, C.s2, C.s3];

export interface Scale {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
  invert: (px: number) => number;
}

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = ((v: number) => r0 + (v - d0) * k) as Scale;
  f.domain = domain;
  f.range = range;
  f.invert = (px: number) => (k === 0 ? d0 : d0 + (px - r0) / k);
  return f;
}

/** "Nice" tick values (1-2-5 steps). */
export function ticks(min: number, max: number, count = 6): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const span = max - min;
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

export function niceDomain(min: number, max: number, pad = 0.05): [number, number] {
  if (min === max) return [min - 1, max + 1];
  const span = max - min;
  const t = ticks(min - span * pad, max + span * pad, 6);
  return [Math.min(t[0], min - span * pad), Math.max(t[t.length - 1], max + span * pad)];
}

export function tickFmt(v: number) {
  const a = Math.abs(v);
  if (a >= 1000) return `${Math.round(v / 100) / 10}k`.replace('.0k', 'k');
  if (a >= 100) return String(Math.round(v));
  if (a >= 1) return String(Math.round(v * 100) / 100);
  if (a === 0) return '0';
  return String(Math.round(v * 1000) / 1000);
}

/** Track an element's width (responsive SVGs). */
export function useWidth<T extends HTMLElement>(fallback = 560) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = Math.round(entries[0].contentRect.width);
      if (width > 0) setW(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export interface Tip {
  x: number;
  y: number;
  value: string;
  label?: string;
}

/** Shared hover/focus tooltip state for a chart. */
export function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const show = useCallback((t: Tip) => setTip(t), []);
  const hide = useCallback(() => setTip(null), []);
  const el = tip ? (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="status">
      <strong>{tip.value}</strong>
      {tip.label && <span style={{ opacity: 0.8 }}> · {tip.label}</span>}
    </div>
  ) : null;
  return { tip, show, hide, el };
}

export function XAxis({ x, y, ticksAt, label, width, format = tickFmt }: { x: Scale; y: number; ticksAt: number[]; label?: string; width: number; format?: (v: number) => string }) {
  return (
    <g className="axis">
      <line x1={x.range[0]} x2={x.range[1]} y1={y} y2={y} />
      {ticksAt.map((t) => (
        <g key={t} transform={`translate(${x(t)},${y})`}>
          <line y2={5} />
          <text y={18} textAnchor="middle">{format(t)}</text>
        </g>
      ))}
      {label && <text className="label" x={(x.range[0] + x.range[1]) / 2} y={y + 38} textAnchor="middle">{label}</text>}
      <desc>{`x axis ${label ?? ''} width ${width}`}</desc>
    </g>
  );
}

export function YAxis({ y, x, ticksAt, label, gridTo, format = tickFmt }: { y: Scale; x: number; ticksAt: number[]; label?: string; gridTo?: number; format?: (v: number) => string }) {
  return (
    <g className="axis">
      {gridTo !== undefined && (
        <g className="grid">
          {ticksAt.map((t) => <line key={t} x1={x} x2={gridTo} y1={y(t)} y2={y(t)} />)}
        </g>
      )}
      {ticksAt.map((t) => (
        <text key={t} x={x - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
      ))}
      {label && <text className="label" transform={`translate(${x - 42},${(y.range[0] + y.range[1]) / 2}) rotate(-90)`} textAnchor="middle">{label}</text>}
    </g>
  );
}

export function ChartFrame({ children, height, title, w, frameRef, tipEl, className = '' }: { children: ReactNode; height: number; title: string; w: number; frameRef: React.RefObject<HTMLDivElement | null>; tipEl: ReactNode; className?: string }) {
  return (
    <div ref={frameRef} className={className} style={{ position: 'relative', width: '100%' }}>
      <svg className="chart" width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={title}>
        <title>{title}</title>
        {children}
      </svg>
      {tipEl}
    </div>
  );
}

/** Rounded-top bar path anchored to the baseline (4px data-end radius). */
export function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0 || w <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
